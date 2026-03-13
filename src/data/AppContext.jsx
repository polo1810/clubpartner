import { createContext, useContext, useState, useMemo } from 'react';
import { uid, isSigned, lineHT, lineTTC, INIT_MEMBERS, INIT_SEASONS, INIT_CATS, INIT_CURRENT, INIT_PRODUCTS, INIT_COMPANIES, INIT_CONTRACTS, INIT_CLUB_INFO, ACTION_TYPES, getPrice, getContractSeasonIds } from '../data/initialData';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState(INIT_COMPANIES);
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [contracts, setContracts] = useState(INIT_CONTRACTS);
  const [members, setMembers] = useState(INIT_MEMBERS);
  const [seasons, setSeasons] = useState(INIT_SEASONS);
  const [cats, setCats] = useState(INIT_CATS);
  const [currentSeason, setCurrentSeason] = useState(INIT_CURRENT);
  const [miniForm, setMiniForm] = useState(null);
  const [clubInfo, setClubInfo] = useState(INIT_CLUB_INFO);

  const addMember = (n) => { if (n && !members.includes(n)) setMembers(ms => [...ms, n]); };
  const todayStr = new Date().toISOString().slice(0, 10);

  const prospectsList = useMemo(() => companies.filter(c => !c.isPartner && c.season === currentSeason), [companies, currentSeason]);
  const partnersList = useMemo(() => companies.filter(c => c.isPartner && c.season === currentSeason), [companies, currentSeason]);
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

  const allActions = useMemo(() => {
    const acts = [];
    // Actions from companies of current season
    const seasonCompanies = companies.filter(c => c.season === currentSeason);
    seasonCompanies.forEach(co => { (co.actions || []).forEach(a => acts.push({ ...a, companyId: co.id, companyName: co.company, source: co.isPartner ? "partner" : "prospect" })); });
    // Actions from contracts covering current season
    seasonContracts.forEach(con => { const co = getCompany(con.companyId); (con.actions || []).forEach(a => acts.push({ ...a, companyId: con.companyId, companyName: co?.company || "?", contractId: con.id, source: "contract" })); });
    return acts;
  }, [companies, contracts, currentSeason, seasons]);

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
    setContracts(cs => [...cs, { id: uid(), companyId, type: co.dealType || "Partenariat", member: co.member, signataire: co.contact, seasons: Object.keys(sp).length || 1, startSeason: Object.keys(sp).sort()[0] || currentSeason, status: "En attente", donAmount: co.donAmount || 0, seasonProducts: sp, payments: [], actions: [] }]);
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

  const [allObjectives, setAllObjectives] = useState({ "2025-2026": { partenariat: 50000, mecenat: 20000, members: {} } });
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
      { key: "category", label: "Catégorie", value: "Contrat et facturation", type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: todayStr, type: "date" },
      { key: "assignee", label: "Assigné à", value: con?.member || members[0], type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type) return;
      setContracts(cs => cs.map(c => c.id === contractId ? { ...c, actions: [...(c.actions || []), { id: uid(), type: v.type, category: v.category, date: v.date || todayStr, done: false, note: v.note || "", assignee: v.assignee || c.member }] } : c));
      setMiniForm(null);
    }});
  };

  const value = {
    companies, setCompanies, products, setProducts, contracts, setContracts,
    members, setMembers, addMember, seasons, setSeasons, cats, setCats, currentSeason, setCurrentSeason,
    miniForm, setMiniForm, todayStr, clubInfo, setClubInfo,
    prospectsList, partnersList, getCompany, companyContracts,
    contractHT, contractTTC, stockSold, stockProv, caByProd, caByType, totalCA, totalPaid, allActions, seasonContracts,
    objectives, setObjectives, caByMember,
    convertToPartner, openAddAction, openAddContractAction,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
