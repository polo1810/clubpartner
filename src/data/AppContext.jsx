import { createContext, useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { uid, isSigned, lineHT, lineTTC, INIT_MEMBERS, INIT_SEASONS, INIT_CATS, INIT_SUBCATS, INIT_PRODUCT_TYPES, INIT_PLACEMENTS, INIT_CURRENT, INIT_PRODUCTS, INIT_COMPANIES, INIT_CONTRACTS, INIT_CLUB_INFO, ACTION_TYPES, getPrice, getContractSeasonIds, INIT_ACCOUNT_CODES, genAccountCode, invoiceNum, cerfaDocNum, INIT_SCRIPTS, INIT_CONTRACT_TEMPLATES, DEFAULT_EXCLUSIVITE } from '../data/initialData';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

// --- Sync helper : détecte les ajouts/modifs/suppressions et met à jour Supabase ---
const syncTable = async (table, clubId, current, prevRef) => {
  if (!supabase || !clubId) return;
  const prev = prevRef.current;
  if (prev === null) { prevRef.current = current; return; } // premier rendu, on skip

  const prevMap = new Map(prev.map(item => [String(item.id), JSON.stringify(item)]));
  const currMap = new Map(current.map(item => [String(item.id), JSON.stringify(item)]));

  // Upsert les ajoutés/modifiés
  const upserts = [];
  for (const [id, json] of currMap) {
    if (prevMap.get(id) !== json) {
      upserts.push({ id, club_id: clubId, data: JSON.parse(json), updated_at: new Date().toISOString() });
    }
  }
  if (upserts.length) {
    const { error } = await supabase.from(table).upsert(upserts);
    if (error) console.error(`Sync ${table} upsert error:`, error);
  }

  // Supprimer les retirés
  const deleted = [...prevMap.keys()].filter(id => !currMap.has(id));
  if (deleted.length) {
    const { error } = await supabase.from(table).delete().in('id', deleted);
    if (error) console.error(`Sync ${table} delete error:`, error);
  }

  prevRef.current = current;
};

// --- Hook de sync debounced pour une table ---
function useTableSync(table, data, clubId, canSync) {
  const prevRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!canSync) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => syncTable(table, clubId, data, prevRef), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, canSync, clubId, table]);
}

export function AppProvider({ children }) {
  const auth = useAuth();
  const cd = auth?.clubData;
  const clubId = auth?.member?.club_id;
  const canSync = !auth?.isLocal && !!clubId && auth?.member?.role !== "readonly";

  // --- Les 4 tables séparées : init depuis les tables Supabase (ou données démo en local) ---
  const [companies, setCompanies] = useState(() => {
    if (auth?.isLocal) return cd?.companies || INIT_COMPANIES;
    return auth?.initCompanies?.length ? auth.initCompanies : [];
  });
  const [products, setProducts] = useState(() => {
    if (auth?.isLocal) return cd?.products || INIT_PRODUCTS;
    return auth?.initProducts?.length ? auth.initProducts : [];
  });
  const [contracts, setContracts] = useState(() => {
    if (auth?.isLocal) return cd?.contracts || INIT_CONTRACTS;
    return auth?.initContracts?.length ? auth.initContracts : [];
  });
  const [invoices, setInvoices] = useState(() => {
    if (auth?.isLocal) return cd?.invoices || [];
    return auth?.initInvoices?.length ? auth.initInvoices : [];
  });

  // --- Paramètres du club : restent dans le JSON clubs.data ---
  const [members, setMembers] = useState(cd?.members || INIT_MEMBERS);
  const [memberEmails, setMemberEmails] = useState(cd?.memberEmails || {});
  const [seasons, setSeasons] = useState(cd?.seasons || INIT_SEASONS);
  const [cats, setCats] = useState(cd?.cats || INIT_CATS);
  const [subcats, setSubcats] = useState(cd?.subcats || INIT_SUBCATS);
  const [productTypes, setProductTypes] = useState(cd?.productTypes || INIT_PRODUCT_TYPES);
  const [placements, setPlacements] = useState(() => {
    const p = cd?.placements || INIT_PLACEMENTS;
    if (Array.isArray(p)) { const obj = {}; (cd?.cats || INIT_CATS).forEach(c => { obj[c] = [...p]; }); return obj; }
    return p;
  });
  const [currentSeason, setCurrentSeason] = useState(cd?.currentSeason || INIT_CURRENT);
  const [miniForm, setMiniForm] = useState(null);
  const [clubInfo, setClubInfo] = useState(cd?.clubInfo || INIT_CLUB_INFO);
  const [accountCodes, setAccountCodes] = useState(cd?.accountCodes || INIT_ACCOUNT_CODES);
  const [invoiceSeq, setInvoiceSeq] = useState(cd?.invoiceSeq || 1);
  const [scripts, setScripts] = useState((cd?.scripts && cd.scripts["Partenariat"]) ? cd.scripts : INIT_SCRIPTS);
  const [contractTemplates, setContractTemplates] = useState((cd?.contractTemplates && cd.contractTemplates["Partenariat"]) ? cd.contractTemplates : INIT_CONTRACT_TEMPLATES);
  const [exclusiviteText, setExclusiviteText] = useState(cd?.exclusiviteText || DEFAULT_EXCLUSIVITE);
  const [allObjectives, setAllObjectives] = useState(cd?.allObjectives || { "2025-2026": { partenariat: 50000, mecenat: 20000, members: {} } });

  // --- Sync automatique des 4 tables vers Supabase ---
  useTableSync('companies', companies, clubId, canSync);
  useTableSync('contracts', contracts, clubId, canSync);
  useTableSync('invoices', invoices, clubId, canSync);
  useTableSync('products', products, clubId, canSync);

  // --- Sync des paramètres vers clubs.data (debounced) ---
  const settingsTimer = useRef(null);
  const getSettings = useCallback(() => ({
    members, memberEmails, seasons, cats, subcats, productTypes, placements, currentSeason,
    clubInfo, accountCodes, invoiceSeq, scripts, contractTemplates, exclusiviteText, allObjectives,
  }), [members, memberEmails, seasons, cats, subcats, productTypes, placements, currentSeason, clubInfo, accountCodes, invoiceSeq, scripts, contractTemplates, exclusiviteText, allObjectives]);

  useEffect(() => {
    if (auth?.isLocal || !auth?.saveClubData) return;
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => {
      auth.saveClubData(getSettings());
    }, 1000);
    return () => { if (settingsTimer.current) clearTimeout(settingsTimer.current); };
  }, [members, memberEmails, seasons, cats, subcats, productTypes, placements, currentSeason, clubInfo, accountCodes, invoiceSeq, scripts, contractTemplates, exclusiviteText, allObjectives]);

  // ==================================================================
  // Tout le reste est IDENTIQUE à l'ancien AppContext
  // ==================================================================

  const addMember = (n, email) => { if (n && !members.includes(n)) setMembers(ms => [...ms, n]); if (n && email) setMemberEmails(prev => ({ ...prev, [n]: email })); };
  const todayStr = new Date().toISOString().slice(0, 10);

  const companyInSeason = (c, sid) => c.season === sid || !!(c.seasonProducts?.[sid]?.length) || !!(c.seasonDonAmounts?.[sid]) || !!(c.seasonStatus?.[sid]) || contracts.some(con => con.companyId === c.id && getContractSeasonIds(con, seasons).includes(sid));
  const hasContractForSeason = (c, sid) => contracts.some(con => con.companyId === c.id && isSigned(con) && getContractSeasonIds(con, seasons).includes(sid));
  const isPartnerForSeason = (c, sid) => {
    if (hasContractForSeason(c, sid)) return true;
    if (c.seasonStatus && c.seasonStatus[sid] !== undefined) return c.seasonStatus[sid] === "partenaire";
    return c.isPartner || false;
  };
  const setSeasonStatus = (companyId, sid, status) => {
    setCompanies(cs => cs.map(c => c.id === companyId ? { ...c, seasonStatus: { ...(c.seasonStatus || {}), [sid]: status } } : c));
  };
  const prospectsList = useMemo(() => companies.filter(c => !isPartnerForSeason(c, currentSeason) && companyInSeason(c, currentSeason)), [companies, contracts, currentSeason, seasons]);
  const partnersList = useMemo(() => companies.filter(c => isPartnerForSeason(c, currentSeason) && companyInSeason(c, currentSeason)), [companies, contracts, currentSeason, seasons]);
  const allCompanies = companies;
  const getCompany = (id) => companies.find(c => c.id === id);
  const companyContracts = (cid) => contracts.filter(c => c.companyId === cid);

  const seasonContracts = useMemo(() => contracts.filter(c => {
    const sids = getContractSeasonIds(c, seasons);
    return sids.includes(currentSeason);
  }), [contracts, currentSeason, seasons]);

  const contractHT = (con) => {
    if (con.seasonProducts && Object.keys(con.seasonProducts).length > 0) {
      return Object.values(con.seasonProducts).reduce((total, prods) => total + prods.reduce((t, cp) => t + lineHT(cp), 0), 0);
    }
    const co = getCompany(con.companyId); return (co?.products || []).reduce((t, cp) => t + lineHT(cp), 0);
  };
  const contractTTC = (con) => {
    if (con.seasonProducts && Object.keys(con.seasonProducts).length > 0) {
      return Object.values(con.seasonProducts).reduce((total, prods) => total + prods.reduce((t, cp) => { const prod = products.find(x => x.id === cp.productId); return t + lineTTC(cp, prod?.tva); }, 0), 0);
    }
    const co = getCompany(con.companyId); return (co?.products || []).reduce((t, cp) => { const prod = products.find(x => x.id === cp.productId); return t + lineTTC(cp, prod?.tva); }, 0);
  };

  const seasonProdsFor = (c) => {
    if (c.seasonProducts && c.seasonProducts[currentSeason]) return c.seasonProducts[currentSeason];
    return c.products || [];
  };

  const stockSold = useMemo(() => { const u = {}; partnersList.forEach(c => { const cons = companyContracts(c.id); if (cons.some(co => isSigned(co))) seasonProdsFor(c).forEach(cp => { u[cp.productId] = (u[cp.productId] || 0) + cp.qty; }); }); return u; }, [companies, contracts, currentSeason]);

  const stockProv = useMemo(() => { const u = {}; prospectsList.forEach(c => { seasonProdsFor(c).forEach(cp => { u[cp.productId] = (u[cp.productId] || 0) + cp.qty; }); }); partnersList.forEach(c => { const cons = companyContracts(c.id); if (!cons.some(co => isSigned(co))) seasonProdsFor(c).forEach(cp => { u[cp.productId] = (u[cp.productId] || 0) + cp.qty; }); }); return u; }, [companies, contracts, currentSeason]);

  const caByProd = useMemo(() => { const r = {}; partnersList.forEach(c => { const cons = companyContracts(c.id); if (cons.some(co => isSigned(co))) seasonProdsFor(c).forEach(cp => { r[cp.productId] = (r[cp.productId] || 0) + lineHT(cp); }); }); return r; }, [companies, contracts, currentSeason]);

  const totalCA = useMemo(() => Object.values(caByProd).reduce((a, b) => a + b, 0), [caByProd]);
  const totalPaid = useMemo(() => seasonContracts.reduce((t, c) => t + (c.payments || []).filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0), 0), [seasonContracts]);

  const seasonInvoices = useMemo(() => invoices.filter(i => i.season === currentSeason), [invoices, currentSeason]);

  const allActions = useMemo(() => {
    const acts = [];
    const seasonCompanies = companies.filter(c => companyInSeason(c, currentSeason));
    seasonCompanies.forEach(co => { (co.actions || []).forEach(a => acts.push({ ...a, companyId: co.id, companyName: co.company, source: co.isPartner ? "partner" : "prospect" })); });
    seasonContracts.forEach(con => { const co = getCompany(con.companyId); (con.actions || []).forEach(a => acts.push({ ...a, companyId: con.companyId, companyName: co?.company || "?", contractId: con.id, source: "contract" })); });
    seasonInvoices.forEach(inv => { (inv.actions || []).forEach(a => acts.push({ ...a, companyId: inv.companyId, companyName: inv.companyName, invoiceId: inv.id, source: "invoice" })); });
    return acts;
  }, [companies, contracts, invoices, currentSeason, seasons]);

  const caByType = useMemo(() => {
    const r = { Partenariat: 0, "Mécénat": 0 };
    partnersList.forEach(c => {
      const cons = companyContracts(c.id);
      if (cons.some(co => isSigned(co))) {
        const ht = seasonProdsFor(c).reduce((t, cp) => t + lineHT(cp), 0);
        r[c.dealType || "Partenariat"] = (r[c.dealType || "Partenariat"] || 0) + ht;
      }
    });
    return r;
  }, [companies, contracts, currentSeason]);

  const convertToPartner = (companyId) => {
    const co = companies.find(c => c.id === companyId);
    if (!co) return;
    const coSP = co.seasonProducts && Object.keys(co.seasonProducts).length > 0 ? co.seasonProducts : {};
    const sp = {};
    if (Object.keys(coSP).length > 0) {
      Object.entries(coSP).forEach(([sid, prods]) => { sp[sid] = prods.map(p => ({ ...p })); });
    } else {
      sp[currentSeason] = [...(co.products || []).map(p => ({ ...p }))];
    }
    const coSDA = co.seasonDonAmounts && Object.keys(co.seasonDonAmounts).length > 0 ? { ...co.seasonDonAmounts } : {};
    const totDon = Object.keys(coSDA).length > 0 ? Object.values(coSDA).reduce((t, d) => t + (d || 0), 0) : (co.donAmount || 0);
    setContracts(cs => [...cs, { id: uid(), companyId, type: co.dealType || "Partenariat", member: co.member, signataire: co.contact, seasons: Object.keys(sp).length || 1, startSeason: Object.keys(sp).sort()[0] || currentSeason, status: "En attente", donAmount: totDon, seasonDonAmounts: coSDA, seasonProducts: sp, exclusivite: false, payments: [], actions: [] }]);
    setCompanies(cs => cs.map(c => c.id === companyId ? { ...c, isPartner: true, prospectStatus: "", partnerStatus: "Nouveau partenaire", seasonStatus: { ...(c.seasonStatus || {}), [currentSeason]: "partenaire" } } : c));
  };

  const openAddAction = (companyId, defaultCat) => {
    const co = companies.find(c => c.id === companyId);
    setMiniForm({ title: "Nouvelle action", fields: [
      { key: "type", label: "Intitulé", value: "" },
      { key: "category", label: "Catégorie", value: defaultCat || "Prospection", type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: todayStr, type: "date" },
      { key: "assignee", label: "Assigné à", value: co?.member || members[0], type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type) return;
      setCompanies(cs => cs.map(c => c.id === companyId ? { ...c, actions: [...(c.actions || []), { id: uid(), type: v.type, category: v.category, date: v.date || todayStr, done: false, note: v.note || "", assignee: v.assignee || c.member }] } : c));
      setMiniForm(null);
    }});
  };

  const objectives = allObjectives[currentSeason] || { partenariat: 0, mecenat: 0, members: {} };
  const setObjectives = (updater) => {
    setAllObjectives(prev => {
      const cur = prev[currentSeason] || { partenariat: 0, mecenat: 0, members: {} };
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [currentSeason]: next };
    });
  };

  const caByMember = useMemo(() => {
    const r = {};
    members.forEach(m => { r[m] = { partenariat: 0, mecenat: 0, total: 0 }; });
    partnersList.forEach(c => {
      const cons = companyContracts(c.id);
      if (cons.some(co => isSigned(co))) {
        const ht = seasonProdsFor(c).reduce((t, cp) => t + lineHT(cp), 0);
        const isM = c.dealType === "Mécénat";
        const amount = isM ? (c.donAmount || 0) : ht;
        const m = c.member;
        if (!r[m]) r[m] = { partenariat: 0, mecenat: 0, total: 0 };
        if (isM) r[m].mecenat += amount; else r[m].partenariat += amount;
        r[m].total += amount;
      }
    });
    return r;
  }, [companies, contracts, members, currentSeason]);

  const openAddContractAction = (contractId) => {
    const con = contracts.find(c => c.id === contractId);
    setMiniForm({ title: "Action contrat", fields: [
      { key: "type", label: "Intitulé", value: "" },
      { key: "category", label: "Catégorie", value: "Contrat", type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: todayStr, type: "date" },
      { key: "assignee", label: "Assigné à", value: con?.member || members[0], type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type) return;
      setContracts(cs => cs.map(c => c.id === contractId ? { ...c, actions: [...(c.actions || []), { id: uid(), type: v.type, category: v.category, date: v.date || todayStr, done: false, note: v.note || "", assignee: v.assignee || c.member }] } : c));
      setMiniForm(null);
    }});
  };

  const openAddInvoiceAction = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const co = getCompany(inv?.companyId);
    setMiniForm({ title: "Action facturation", fields: [
      { key: "type", label: "Intitulé", value: "" },
      { key: "category", label: "Catégorie", value: "Facturation", type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: todayStr, type: "date" },
      { key: "assignee", label: "Assigné à", value: co?.member || members[0], type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type) return;
      setInvoices(is => is.map(i => i.id === invoiceId ? { ...i, actions: [...(i.actions || []), { id: uid(), type: v.type, category: v.category, date: v.date || todayStr, done: false, note: v.note || "", assignee: v.assignee || co?.member || "" }] } : i));
      setMiniForm(null);
    }});
  };

  const generateInvoice = (contract, season) => {
    const co = getCompany(contract.companyId);
    if (!co) return null;
    const sp = contract.seasonProducts || {};
    const prods = sp[season] || co.products || [];
    const isTVA = clubInfo.soumisTVA !== false;
    const lines = prods.map(cp => {
      const pr = products.find(x => x.id === cp.productId);
      if (!pr) return null;
      const ht = lineHT(cp);
      const tvaRate = isTVA ? (pr.tva || 20) : 0;
      const tvaAmount = isTVA ? Math.round(ht * tvaRate / 100 * 100) / 100 : 0;
      return { productId: cp.productId, name: pr.name, category: pr.category, qty: cp.qty, unitPrice: cp.unitPrice, totalHT: ht, tvaRate, tvaAmount };
    }).filter(Boolean);
    const totalHT = lines.reduce((t, l) => t + l.totalHT, 0);
    const totalTVA = lines.reduce((t, l) => t + l.tvaAmount, 0);
    const totalTTC = totalHT + totalTVA;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const seq = invoiceSeq;
    setInvoiceSeq(s => s + 1);
    const inv = {
      id: uid(), number: invoiceNum(dateStr, seq),
      contractId: contract.id, companyId: co.id, companyName: co.company,
      accountCode: co.accountCode || genAccountCode(co.company),
      date: todayStr, dateStr, season,
      lines, totalHT: Math.round(totalHT * 100) / 100, totalTVA: Math.round(totalTVA * 100) / 100, totalTTC: Math.round(totalTTC * 100) / 100,
      status: "Émise",
    };
    setInvoices(is => [...is, inv]);
    setContracts(cs => cs.map(c => c.id === contract.id ? { ...c, status: c.status === "Signé" ? "Facturé" : c.status } : c));
    return inv;
  };

  const generateCerfaRecord = (contract, season) => {
    const co = getCompany(contract.companyId);
    if (!co) return null;
    const donAmount = contract.seasonDonAmounts?.[season] || contract.donAmount || 0;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const seq = invoiceSeq;
    setInvoiceSeq(s => s + 1);
    const rec = {
      id: uid(), number: cerfaDocNum(dateStr, seq),
      contractId: contract.id, companyId: co.id, companyName: co.company,
      date: todayStr, dateStr, season,
      type: "cerfa",
      donAmount,
      totalHT: 0, totalTVA: 0, totalTTC: donAmount,
      lines: [],
      status: "CERFA émis",
    };
    setInvoices(is => [...is, rec]);
    setContracts(cs => cs.map(c => c.id === contract.id ? { ...c, status: c.status === "Signé" ? "Facturé" : c.status } : c));
    return rec;
  };

  const value = {
    companies, setCompanies, products, setProducts, contracts, setContracts,
    members, setMembers, addMember, memberEmails, setMemberEmails, seasons, setSeasons, cats, setCats, subcats, setSubcats, productTypes, setProductTypes, placements, setPlacements, currentSeason, setCurrentSeason,
    miniForm, setMiniForm, todayStr, clubInfo, setClubInfo,
    invoices, setInvoices, seasonInvoices, generateInvoice, generateCerfaRecord, accountCodes, setAccountCodes, scripts, setScripts, contractTemplates, setContractTemplates, exclusiviteText, setExclusiviteText,
    prospectsList, partnersList, getCompany, companyContracts,
    contractHT, contractTTC, stockSold, stockProv, caByProd, caByType, totalCA, totalPaid, allActions, seasonContracts,
    objectives, setObjectives, caByMember,
    convertToPartner, openAddAction, openAddContractAction, openAddInvoiceAction, setSeasonStatus, hasContractForSeason,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
