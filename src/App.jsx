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
  const [mode, setMode] = useState("password");
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

  return (
    <div style={S.authBg}>
      <div style={S.authCard}>
        <div style={S.authCenter}>
          <div style={S.authIcon}>🏟️</div>
          <h1 style={S.authTitle}>ClubPartner</h1>
          <p style={S.authSub}>Gestion de partenariats sportifs</p>
        </div>

        {mode === "sent" ? (
          <div style={{ textAlign: "center" }}>
            <div style={S.authMsgIcon}>📧</div>
            <h2 style={S.authMsgH}>Vérifiez votre boîte mail</h2>
            <p style={S.authMsgP}>Un lien de connexion a été envoyé à <strong>{email}</strong>.</p>
            <button style={{ ...S.authLinkBtn, marginTop: 16 }} onClick={() => setMode("password")}>← Retour</button>
          </div>
        ) : mode === "confirm" ? (
          <div style={{ textAlign: "center" }}>
            <div style={S.authMsgIcon}>✅</div>
            <h2 style={S.authMsgH}>Compte créé</h2>
            <p style={S.authMsgP}>Vérifiez votre boîte mail pour confirmer, puis connectez-vous.</p>
            <button style={{ ...S.authBtnMain, marginTop: 16 }} onClick={() => setMode("password")}>Se connecter</button>
          </div>
        ) : mode === "signup" ? (
          <div>
            <label style={S.authLbl}>Email</label>
            <input type="email" style={S.authInp} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" autoFocus />
            <label style={S.authLblBlock}>Mot de passe (6 caractères min.)</label>
            <input type="password" style={S.authInp} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && handleSignUp()} />
            <button style={S.authBtnMain} onClick={handleSignUp} disabled={sending}>{sending ? "Création..." : "Créer mon compte"}</button>
            {error && <div style={S.authErr}>{error}</div>}
            <div style={S.authLinks}>
              <button style={S.authLinkBtn} onClick={() => setMode("password")}>← Déjà un compte ? Se connecter</button>
            </div>
          </div>
        ) : mode === "magic" ? (
          <div>
            <label style={S.authLbl}>Email</label>
            <input type="email" style={S.authInp} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" onKeyDown={e => e.key === "Enter" && handleMagic()} autoFocus />
            <button style={S.authBtnMain} onClick={handleMagic} disabled={sending}>{sending ? "Envoi..." : "📧 Recevoir le lien de connexion"}</button>
            {error && <div style={S.authErr}>{error}</div>}
            <div style={S.authLinks}>
              <button style={S.authLinkBtn} onClick={() => setMode("password")}>← Connexion par mot de passe</button>
            </div>
          </div>
        ) : (
          <div>
            <label style={S.authLbl}>Email</label>
            <input type="email" style={S.authInp} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@club.fr" autoFocus />
            <label style={S.authLblBlock}>Mot de passe</label>
            <input type="password" style={S.authInp} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && handlePassword()} />
            <button style={S.authBtnMain} onClick={handlePassword} disabled={sending}>{sending ? "Connexion..." : "Se connecter"}</button>
            {error && <div style={S.authErr}>{error}</div>}
            <div style={S.authLinks}>
              <button style={S.authLinkBtn} onClick={() => setMode("magic")}>🔗 Connexion par lien email</button>
              <button style={S.authLinkBtn} onClick={() => setMode("signup")}>Première connexion ? Créer un compte</button>
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
    <div style={S.authBg}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={S.authIcon}>🏟️</div>
        <p style={{ marginTop: 14, fontSize: 17 }}>Chargement...</p>
      </div>
    </div>
  );
}

// --- Access Denied ---
function AccessDenied() {
  const { error, logout } = useAuth();
  return (
    <div style={S.authBg}>
      <div style={{ ...S.authCard, textAlign: "center" }}>
        <div style={S.authMsgIcon}>🚫</div>
        <h2 style={S.authMsgH}>Accès refusé</h2>
        <p style={S.authMsgP}>{error || "Votre email n'est rattaché à aucun club."}</p>
        <button style={{ ...S.authLinkBtn, marginTop: 16 }} onClick={logout}>← Se déconnecter</button>
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

  // Tous les onglets visibles directement
  const allTabs = [
    { id: "dashboard", label: "Tableau de bord", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "prospects", label: "Prospects", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "partners", label: "Partenaires", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "contracts", label: "Contrats", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "invoices", label: "Factures", roles: ["superadmin", "admin"] },
    { id: "actions", label: "Actions", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "products", label: "Stocks", roles: ["superadmin", "admin", "commercial", "readonly"] },
    { id: "amortize", label: "Amortissement", roles: ["superadmin", "admin"] },
    { id: "admin", label: "Administration", roles: ["superadmin"] },
  ];
  const visibleTabs = allTabs.filter(t => t.roles.includes(auth.role));
  const memberName = auth.member?.name || auth.member?.email || "";
  const tc = ctx.clubInfo?.themeColor || "#3b5998";
  const logo = ctx.clubInfo?.logo;

  return (
    <div style={S.app}>
      <div style={{ ...S.header, background: `linear-gradient(135deg, ${tc} 0%, ${tc}cc 100%)` }}>
        <div style={S.hdrLeft}>
          {logo ? <img src={logo} alt="Logo" style={S.hdrLogo} /> : <span style={S.hdrLogoFb}>🏟️</span>}
          <div>
            <div style={S.hdrClub}>{ctx.clubInfo?.name || "ClubPartner"}</div>
            <select value={currentSeason} onChange={e => setCurrentSeason(e.target.value)} style={S.hdrSeason}>{seasons.map(s => <option key={s.id} value={s.id} style={{ color: "#000" }}>{s.name}</option>)}</select>
          </div>
        </div>
        <div style={S.hdrRight}>
          {!auth.isLocal && <span style={S.hdrUser}>{memberName}</span>}
          <button style={S.hdrBtn} onClick={() => setShowTeam(true)}>Équipe</button>
          {auth.canSettings && <button style={S.hdrBtn} onClick={() => setShowSettings(true)}>Paramètres</button>}
          <button style={S.hdrBtn} onClick={() => setShowExport(true)}>Export</button>
          {!auth.isLocal && <button style={S.hdrBtn} onClick={auth.logout}>Déconnexion</button>}
        </div>
      </div>
      <nav style={S.nav}>
          {visibleTabs.map(t => <button key={t.id} style={{ ...S.navB(tab === t.id), ...(tab === t.id ? { borderBottomColor: tc } : {}) }} onClick={() => setTabAndView(t.id)}>{t.label}</button>)}
        </nav>
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
        <div style={S.exportList}>
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
  if (isLocal) return <AppProvider><AppInner /></AppProvider>;
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  if (error || !member) return <AccessDenied />;
  if (clubData !== null) return <AppProvider><AppInner /></AppProvider>;
  return <LoadingScreen />;
}

export default function App() {
  return <AuthProvider><AuthGate /></AuthProvider>;
}
