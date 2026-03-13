import { useState } from 'react';
import { AppProvider, useApp } from './data/AppContext';
import { S } from './data/styles';
import { toCSV, dlCSV, fmt, lineHT, getPrice } from './data/initialData';
import { MiniForm, TeamModal, SettingsModal, Modal } from './components/index';
import Dashboard from './tabs/Dashboard';
import ProspectsTab from './tabs/ProspectsTab';
import PartnersTab from './tabs/PartnersTab';
import ActionsTab from './tabs/ActionsTab';
import ProductsTab from './tabs/ProductsTab';
import AmortTab from './tabs/AmortTab';
import ContractsTab from './tabs/ContractsTab';
import InvoicesTab from './tabs/InvoicesTab';

const tabs = [
  { id: "dashboard", label: "📊 Bord" }, { id: "prospects", label: "🎯 Prospects" },
  { id: "partners", label: "🤝 Partenaires" }, { id: "contracts", label: "📝 Contrats" },
  { id: "invoices", label: "🧾 Factures" },
  { id: "actions", label: "📋 Actions" }, { id: "products", label: "📦 Stocks" },
  { id: "amortize", label: "💰 Amort." },
];

function AppInner() {
  const ctx = useApp();
  const { miniForm, setMiniForm, members, setMembers, addMember, cats, setCats, seasons, currentSeason, setCurrentSeason, prospectsList, partnersList, products, contracts, stockSold, caByProd, contractHT } = ctx;
  const [tab, setTab] = useState("dashboard");
  const [showTeam, setShowTeam] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [directContract, setDirectContract] = useState(null);

  const openContractDirect = (contract) => { setDirectContract(contract); setTab("contracts"); };
  const setTabAndView = (t) => { setDirectContract(null); setTab(t); };

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>🏟️ ClubPartner</div><select value={currentSeason} onChange={e => setCurrentSeason(e.target.value)} style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>{seasons.map(s => <option key={s.id} value={s.id} style={{ color: "#000" }}>{s.name}</option>)}</select></div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowTeam(true)}>👥</button>
          <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowSettings(true)}>⚙️</button>
          <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowExport(true)}>📤</button>
        </div>
      </div>
      <nav style={S.nav}>{tabs.map(t => <button key={t.id} style={S.navB(tab === t.id)} onClick={() => setTabAndView(t.id)}>{t.label}</button>)}</nav>
      <div style={S.main}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "prospects" && <ProspectsTab />}
        {tab === "partners" && <PartnersTab onOpenContract={openContractDirect} />}
        {tab === "actions" && <ActionsTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "amortize" && <AmortTab />}
        {tab === "contracts" && <ContractsTab onOpenCompany={(co) => setTab(co.isPartner ? "partners" : "prospects")} directContract={directContract} onDirectContractClosed={() => setDirectContract(null)} />}
        {tab === "invoices" && <InvoicesTab />}
      </div>
      {showTeam && <TeamModal members={members} onAdd={addMember} onRemove={m => setMembers(ms => ms.filter(x => x !== m))} onClose={() => setShowTeam(false)} />}
      {showSettings && <SettingsModal cats={cats} setCats={setCats} seasons={seasons} setSeasons={ctx.setSeasons} currentSeason={currentSeason} clubInfo={ctx.clubInfo} setClubInfo={ctx.setClubInfo} accountCodes={ctx.accountCodes} setAccountCodes={ctx.setAccountCodes} onClose={() => setShowSettings(false)} />}
      {showExport && <Modal title="📤 Export" onClose={() => setShowExport(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Prospects.csv", toCSV(prospectsList.map(p => ({ Entreprise: p.company, Secteur: p.sector, Saison: p.season, Contact: p.contact, Téléphone: p.phone, Email: p.email, Statut: p.prospectStatus, Responsable: p.member })))); setShowExport(false); }}>📤 Prospects</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Partenaires.csv", toCSV(partnersList.map(p => ({ Entreprise: p.company, Secteur: p.sector, Saison: p.season, Contact: p.contact, Téléphone: p.phone, Email: p.email, Statut: p.partnerStatus, HT: (p.products || []).reduce((t, cp) => t + lineHT(cp), 0) })))); setShowExport(false); }}>📤 Partenaires</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Stocks.csv", toCSV(products.map(p => ({ Produit: p.name, Catégorie: p.category, Prix: getPrice(p, currentSeason).price, Stock: p.stock, Vendus: stockSold[p.id] || 0, CA: Math.round(caByProd[p.id] || 0) })))); setShowExport(false); }}>📤 Stocks</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Contrats.csv", toCSV(contracts.map(c => { const co = ctx.getCompany(c.companyId); return { Entreprise: co?.company || "?", Type: c.type, Statut: c.status, Saisons: c.seasons, HT: Math.round(contractHT(c)) }; }))); setShowExport(false); }}>📤 Contrats</button>
        </div>
      </Modal>}
      {miniForm && <MiniForm title={miniForm.title} fields={miniForm.fields} onSave={miniForm.onSave} onClose={() => setMiniForm(null)} />}
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
