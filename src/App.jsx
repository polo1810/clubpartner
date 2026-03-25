import { useState } from 'react';
import { AuthProvider, useAuth } from './data/AuthContext';
import { AppProvider, useApp } from './data/AppContext';
import { S, Cl } from './data/styles';
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
import AdminTab from './tabs/AdminTab';

// --- Login Screen ---
function LoginScreen() {
  const { login, loginWithPassword, signUp, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic" | "signup" | "sent"
  const [sending, setSending] = useState(false);

  const handlePassword = async () => {
    if (!email.trim() || !password) return;
    setSending(true);
    await loginWithPassword(email.trim().toLowerCase(), password);
    setSending(false);
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || password.length < 6) return;
    setSending(true);
    const ok = await signUp(email.trim().toLowerCase(), password);
    setSending(false);
    if (ok) setMode("confirm");
  };

  const handleMagic = async () => {
    if (!email.trim()) return;
    setSending(true);
    const ok = await login(email.trim().toLowerCase());
    setSending(false);
    if (ok) setMode("sent");
  };

  const inputStyle = { ...S.inp, fontSize: 16, padding: "12px 14px", marginTop: 6, width: "100%", boxSizing: "border-box" };
  const btnMain = { ...S.btn("primary"), width: "100%", marginTop: 12, padding: "12px", fontSize: 15, fontWeight: 700 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a73e8 0%, #6c3aed 100%)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>🏟️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>ClubPartner</h1>
          <p style={{ fontSize: 13, color: Cl.txtL }}>Gestion de partenariats sportifs</p>
        </div>

        {mode === "sent" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Vérifiez votre boîte mail</h2>
            <p style={{ fontSize: 13, color: Cl.txtL, marginTop: 8 }}>Un lien de connexion a été envoyé à <strong>{email}</strong>.</p>
            <button style={{ ...S.btn("ghost"), marginTop: 16 }} onClick={() => setMode("password")}>← Retour</button>
          </div>
        ) : mode === "confirm" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Compte créé</h2>
            <p style={{ fontSize: 13, color: Cl.txtL, marginTop: 8 }}>Vérifiez votre boîte mail pour confirmer, puis connectez-vous.</p>
            <button style={{ ...S.btn("primary"), marginTop: 16 }} onClick={() => setMode("password")}>Se connecter</button>
          </div>
        ) : mode === "signup" ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL }}>Email</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" autoFocus />
            <label style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL, marginTop: 10, display: "block" }}>Mot de passe (6 caractères min.)</label>
            <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && handleSignUp()} />
            <button style={btnMain} onClick={handleSignUp} disabled={sending}>{sending ? "Création..." : "Créer mon compte"}</button>
            {error && <div style={{ marginTop: 10, padding: 10, background: Cl.errL, borderRadius: 8, fontSize: 12, color: Cl.err }}>{error}</div>}
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => setMode("password")}>← Déjà un compte ? Se connecter</button>
            </div>
          </div>
        ) : mode === "magic" ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL }}>Email</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" onKeyDown={e => e.key === "Enter" && handleMagic()} autoFocus />
            <button style={btnMain} onClick={handleMagic} disabled={sending}>{sending ? "Envoi..." : "📧 Recevoir le lien de connexion"}</button>
            {error && <div style={{ marginTop: 10, padding: 10, background: Cl.errL, borderRadius: 8, fontSize: 12, color: Cl.err }}>{error}</div>}
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => setMode("password")}>← Connexion par mot de passe</button>
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL }}>Email</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" autoFocus />
            <label style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL, marginTop: 10, display: "block" }}>Mot de passe</label>
            <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && handlePassword()} />
            <button style={btnMain} onClick={handlePassword} disabled={sending}>{sending ? "Connexion..." : "Se connecter"}</button>
            {error && <div style={{ marginTop: 10, padding: 10, background: Cl.errL, borderRadius: 8, fontSize: 12, color: Cl.err }}>{error}</div>}
            <div style={{ marginTop: 14, textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => setMode("magic")}>🔗 Connexion par lien email</button>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={() => setMode("signup")}>Première connexion ? Créer un compte</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a73e8 0%, #6c3aed 100%)" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 48 }}>🏟️</div>
        <p style={{ marginTop: 12, fontSize: 16 }}>Chargement...</p>
      </div>
    </div>
  );
}

// --- Access Denied ---
function AccessDenied() {
  const { error, logout } = useAuth();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a73e8 0%, #6c3aed 100%)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 400, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Accès refusé</h2>
        <p style={{ fontSize: 13, color: Cl.txtL, marginTop: 8 }}>{error || "Votre email n'est rattaché à aucun club."}</p>
        <button style={{ ...S.btn("ghost"), marginTop: 16 }} onClick={logout}>← Se déconnecter</button>
      </div>
    </div>
  );
}

// --- Main App (after auth) ---
function AppInner() {
  const ctx = useApp();
  const auth = useAuth();
  const { miniForm, setMiniForm, members, setMembers, addMember, cats, setCats, seasons, currentSeason, setCurrentSeason, prospectsList, partnersList, products, contracts, stockSold, caByProd, contractHT } = ctx;
  const [tab, setTab] = useState("dashboard");
  const [showTeam, setShowTeam] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [directContract, setDirectContract] = useState(null);

  const openContractDirect = (contract) => { setDirectContract(contract); setTab("contracts"); };
  const setTabAndView = (t) => { setDirectContract(null); setTab(t); };

  // Role-based tabs
  const allTabs = [
    { id: "dashboard", label: "📊 Bord", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "prospects", label: "🎯 Prospects", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "partners", label: "🤝 Partenaires", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "contracts", label: "📝 Contrats", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "invoices", label: "🧾 Factures", roles: ["superadmin", "admin"] },
    { id: "actions", label: "📋 Actions", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "products", label: "📦 Stocks", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "amortize", label: "💰 Amort.", roles: ["superadmin", "admin"] },
    { id: "admin", label: "🔧 Admin", roles: ["superadmin"] },
  ];
  const visibleTabs = allTabs.filter(t => t.roles.includes(auth.role));
  const memberName = auth.member?.name || auth.member?.email || "";
  const tc = ctx.clubInfo?.themeColor || "#1a73e8";
  const logo = ctx.clubInfo?.logo;

  return (
    <div style={S.app}>
      <div style={{ ...S.header, background: `linear-gradient(135deg, ${tc} 0%, ${tc}dd 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {logo ? <img src={logo} alt="Logo" style={{ height: 36, borderRadius: 6, background: "#fff", padding: 2 }} /> : <span style={{ fontSize: 24 }}>🏟️</span>}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{ctx.clubInfo?.name || "ClubPartner"}</div>
            <select value={currentSeason} onChange={e => setCurrentSeason(e.target.value)} style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>{seasons.map(s => <option key={s.id} value={s.id} style={{ color: "#000" }}>{s.name}</option>)}</select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!auth.isLocal && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginRight: 4 }}>{memberName}</span>}
          <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowTeam(true)}>👥</button>
          {auth.canSettings && <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowSettings(true)}>⚙️</button>}
          <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={() => setShowExport(true)}>📤</button>
          {!auth.isLocal && <button style={{ ...S.btn("ghost"), color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11 }} onClick={auth.logout}>🚪</button>}
        </div>
      </div>
      <nav style={{ ...S.nav, background: `${tc}ee` }}>{visibleTabs.map(t => <button key={t.id} style={S.navB(tab === t.id)} onClick={() => setTabAndView(t.id)}>{t.label}</button>)}</nav>
      <div style={S.main}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "prospects" && <ProspectsTab />}
        {tab === "partners" && <PartnersTab onOpenContract={openContractDirect} />}
        {tab === "actions" && <ActionsTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "amortize" && <AmortTab />}
        {tab === "contracts" && <ContractsTab onOpenCompany={(co) => setTab(co.isPartner ? "partners" : "prospects")} directContract={directContract} onDirectContractClosed={() => setDirectContract(null)} />}
        {tab === "invoices" && <InvoicesTab />}
        {tab === "admin" && <AdminTab />}
      </div>
      {showTeam && <TeamModal members={members} onAdd={addMember} onRemove={m => setMembers(ms => ms.filter(x => x !== m))} onClose={() => setShowTeam(false)} />}
      {showSettings && <SettingsModal cats={cats} setCats={setCats} seasons={seasons} setSeasons={ctx.setSeasons} currentSeason={currentSeason} clubInfo={ctx.clubInfo} setClubInfo={ctx.setClubInfo} accountCodes={ctx.accountCodes} setAccountCodes={ctx.setAccountCodes} scripts={ctx.scripts} setScripts={ctx.setScripts} contractTemplates={ctx.contractTemplates} setContractTemplates={ctx.setContractTemplates} exclusiviteText={ctx.exclusiviteText} setExclusiviteText={ctx.setExclusiviteText} onClose={() => setShowSettings(false)} />}
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

// --- Auth Gate ---
function AuthGate() {
  const { user, loading, error, member, clubData, isLocal } = useAuth();

  // Mode local (pas de Supabase configuré) → direct
  if (isLocal) return <AppProvider><AppInner /></AppProvider>;

  // Chargement
  if (loading) return <LoadingScreen />;

  // Pas connecté
  if (!user) return <LoginScreen />;

  // Connecté mais pas de club
  if (error || !member) return <AccessDenied />;

  // Connecté + club → charger l'appli
  if (clubData !== null) return <AppProvider><AppInner /></AppProvider>;

  return <LoadingScreen />;
}

export default function App() {
  return <AuthProvider><AuthGate /></AuthProvider>;
}
