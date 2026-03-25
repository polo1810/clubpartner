import { createContext, useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { uid, isSigned, lineHT, lineTTC, INIT_MEMBERS, INIT_SEASONS, INIT_CATS, INIT_CURRENT, INIT_PRODUCTS, INIT_COMPANIES, INIT_CONTRACTS, INIT_CLUB_INFO, ACTION_TYPES, getPrice, getContractSeasonIds, INIT_ACCOUNT_CODES, genAccountCode, invoiceNum, cerfaDocNum, INIT_SCRIPTS } from '../data/initialData';
import { useAuth } from './AuthContext';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const auth = useAuth();
  const cd = auth?.clubData; // JSON from Supabase (or null in local mode)

  const [companies, setCompanies] = useState(cd?.companies || INIT_COMPANIES);
  const [products, setProducts] = useState(cd?.products || INIT_PRODUCTS);
  const [contracts, setContracts] = useState(cd?.contracts || INIT_CONTRACTS);
  const [members, setMembers] = useState(cd?.members || INIT_MEMBERS);
  const [seasons, setSeasons] = useState(cd?.seasons || INIT_SEASONS);
  const [cats, setCats] = useState(cd?.cats || INIT_CATS);
  const [currentSeason, setCurrentSeason] = useState(cd?.currentSeason || INIT_CURRENT);
  const [miniForm, setMiniForm] = useState(null);
  const [clubInfo, setClubInfo] = useState(cd?.clubInfo || INIT_CLUB_INFO);
  const [invoices, setInvoices] = useState(cd?.invoices || []);
  const [accountCodes, setAccountCodes] = useState(cd?.accountCodes || INIT_ACCOUNT_CODES);
  const [invoiceSeq, setInvoiceSeq] = useState(cd?.invoiceSeq || 1);
  const [scripts, setScripts] = useState(cd?.scripts || INIT_SCRIPTS);
  const [allObjectives, setAllObjectives] = useState(cd?.allObjectives || { "2025-2026": { partenariat: 50000, mecenat: 20000, members: {} } });

  // --- Auto-save to Supabase (debounced) ---
  const saveTimer = useRef(null);
  const getFullState = useCallback(() => ({
    companies, products, contracts, members, seasons, cats, currentSeason,
    clubInfo, invoices, accountCodes, invoiceSeq, scripts, allObjectives,
  }), [companies, products, contracts, members, seasons, cats, currentSeason, clubInfo, invoices, accountCodes, invoiceSeq, scripts, allObjectives]);

  useEffect(() => {
    if (auth?.isLocal || !auth?.saveClubData) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      auth.saveClubData(getFullState());
    }, 1000); // Save 1s after last change
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [companies, products, contracts, members, seasons, cats, currentSeason, clubInfo, invoices, accountCodes, invoiceSeq, scripts, allObjectives]);

  const addMember = (n) => { if (n && !members.includes(n)) setMembers(ms => [...ms, n]); };
  const todayStr = new Date().toISOString().slice(0, 10);

  const companyInSeason = (c, sid) => c.season === sid || !!(c.seasonProducts?.[sid]?.length) || !!(c.seasonDonAmounts?.[sid]);
  const prospectsList = useMemo(() => companies.filter(c => !c.isPartner && companyInSeason(c, currentSeason)), [companies, currentSeason]);
  const partnersList = useMemo(() => companies.filter(c => c.isPartner && companyInSeason(c, currentSeason)), [companies, currentSeason]);
  // All companies (unfiltered) for lookups
  const allCompanies = companies;
  const getCompany = (id) => companies.find(c => c.id === id);
  const companyContracts = (cid) => contracts.filter(c => c.companyId === cid);

  // Contracts covering the current season
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

  // Helper: get products for a company for the current season
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
    // Actions from companies of current season
    const seasonCompanies = companies.filter(c => companyInSeason(c, currentSeason));
    seasonCompanies.forEach(co => { (co.actions || []).forEach(a => acts.push({ ...a, companyId: co.id, companyName: co.company, source: co.isPartner ? "partner" : "prospect" })); });
    // Actions from contracts covering current season
    seasonContracts.forEach(con => { const co = getCompany(con.companyId); (con.actions || []).forEach(a => acts.push({ ...a, companyId: con.companyId, companyName: co?.company || "?", contractId: con.id, source: "contract" })); });
    // Actions from invoices of current season
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
      // Copy all season products from company
      Object.entries(coSP).forEach(([sid, prods]) => { sp[sid] = prods.map(p => ({ ...p })); });
    } else {
      sp[currentSeason] = [...(co.products || []).map(p => ({ ...p }))];
    }
    const coSDA = co.seasonDonAmounts && Object.keys(co.seasonDonAmounts).length > 0 ? { ...co.seasonDonAmounts } : {};
    const totDon = Object.keys(coSDA).length > 0 ? Object.values(coSDA).reduce((t, d) => t + (d || 0), 0) : (co.donAmount || 0);
    setContracts(cs => [...cs, { id: uid(), companyId, type: co.dealType || "Partenariat", member: co.member, signataire: co.contact, seasons: Object.keys(sp).length || 1, startSeason: Object.keys(sp).sort()[0] || currentSeason, status: "En attente", donAmount: totDon, seasonDonAmounts: coSDA, seasonProducts: sp, payments: [], actions: [] }]);
    setCompanies(cs => cs.map(c => c.id === companyId ? { ...c, isPartner: true, prospectStatus: "", partnerStatus: "Nouveau partenaire" } : c));
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

  // CA réalisé par membre (basé sur le responsable de l'entreprise)
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

  // --- Invoice generation ---
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
    // Set contract status to Facturé if not already
    setContracts(cs => cs.map(c => c.id === contract.id ? { ...c, status: c.status === "Signé" ? "Facturé" : c.status } : c));
    return inv;
  };

  // Generate CERFA record (for mécénat - no invoice, just a tracking record)
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
    members, setMembers, addMember, seasons, setSeasons, cats, setCats, currentSeason, setCurrentSeason,
    miniForm, setMiniForm, todayStr, clubInfo, setClubInfo,
    invoices, setInvoices, seasonInvoices, generateInvoice, generateCerfaRecord, accountCodes, setAccountCodes, scripts, setScripts,
    prospectsList, partnersList, getCompany, companyContracts,
    contractHT, contractTTC, stockSold, stockProv, caByProd, caByType, totalCA, totalPaid, allActions, seasonContracts,
    objectives, setObjectives, caByMember,
    convertToPartner, openAddAction, openAddContractAction, openAddInvoiceAction,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
