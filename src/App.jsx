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
import HelpChat from './components/HelpChat';
import Onboarding, { WelcomeScreen } from './components/Onboarding';

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

// ★ NOUVEAU : Écran de sélection de club
function ClubSelector() {
  const { allMemberships, selectClub, logout, user } = useAuth();
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (m) => {
    setSelecting(true);
    await selectClub(m);
  };

  const roleLabels = { superadmin: "Super Admin", admin: "Admin", commercial: "Commercial", readonly: "Lecture seule" };
  const roleColors = { superadmin: "#e74c3c", admin: "#3b5998", commercial: "#27ae60", readonly: "#95a5a6" };

  return (
    <div style={S.authBg}>
      <div style={{ ...S.authCard, maxWidth: 440 }}>
        <div style={S.authCenter}>
          <div style={S.authIcon}>🏟️</div>
          <h1 style={S.authTitle}>Choisissez un club</h1>
          <p style={S.authSub}>{user?.email}</p>
        </div>

        {selecting ? (
          <p style={{ textAlign: "center", color: "#666", marginTop: 16 }}>Chargement...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {allMemberships.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelect(m)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: 12,
                  border: "1px solid #e0e0e0", background: "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                  textAlign: "left", fontFamily: "inherit",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.borderColor = "#3b5998"; }}
                onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e0e0e0"; }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>{m.clubName}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{m.club_id}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  color: roleColors[m.role] || "#666",
                  background: (roleColors[m.role] || "#666") + "15",
                }}>
                  {roleLabels[m.role] || m.role}
                </span>
              </button>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={S.authLinkBtn} onClick={logout}>← Se déconnecter</button>
        </div>
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

  // ★ Onboarding
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const userEmail = auth.user?.email || "";

  // Parcours complet (admin) : club vide, pas encore configuré
  const isNewClub = !ctx.clubInfo?.onboardingDone && ctx.companies?.length === 0;
  const needsFullOnboarding = !onboardingDismissed && isNewClub && (auth.role === 'admin' || auth.role === 'superadmin');

  // Parcours léger (membre) : club configuré mais ce membre n'a pas encore vu l'accueil
  const onboardedList = ctx.clubInfo?.onboardedMembers || [];
  const needsWelcome = !onboardingDismissed && !isNewClub && ctx.clubInfo?.onboardingDone && userEmail && !onboardedList.includes(userEmail);

  const markMemberOnboarded = () => {
    ctx.setClubInfo(ci => ({ ...ci, onboardedMembers: [...(ci.onboardedMembers || []), userEmail] }));
    setOnboardingDismissed(true);
  };

  if (needsFullOnboarding) return <Onboarding onFinish={() => setOnboardingDismissed(true)} />;
  if (needsWelcome) return <WelcomeScreen clubName={ctx.clubInfo?.name} memberName={auth.member?.name || ""} onFinish={markMemberOnboarded} />;

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

  // ★ L'utilisateur a accès à plusieurs clubs ?
  const hasMultipleClubs = auth.allMemberships.length > 1;

  // ★ Micro-onboarding : guides contextuels par onglet
  const guides = {
    prospects: {
      show: prospectsList.length === 0 && partnersList.length === 0,
      icon: "🎯", title: "Ajoutez votre premier prospect",
      text: "Commencez par importer ou ajouter manuellement les entreprises que vous souhaitez démarcher.",
      cta: "Utilisez le bouton « + Prospect » ou « Importer » ci-dessous pour démarrer.",
    },
    products: {
      show: products.length === 0,
      icon: "📦", title: "Configurez vos produits",
      text: "Ajoutez les supports de partenariat que vous proposez : panneaux, maillots, digital, événements...",
      cta: "Cliquez sur « + Produit » ci-dessous pour créer votre premier support.",
    },
    partners: {
      show: partnersList.length === 0 && prospectsList.length > 0,
      icon: "🤝", title: "Convertissez un prospect en partenaire",
      text: "Vous avez des prospects ! Quand un accord est trouvé, convertissez-le en partenaire.",
      cta: "Allez dans Prospects, ouvrez une fiche et cliquez « Convertir en partenaire ».",
    },
    contracts: {
      show: contracts.length === 0 && partnersList.length > 0,
      icon: "📝", title: "Créez votre premier contrat",
      text: "Vous avez des partenaires, formalisez l'accord avec un contrat.",
      cta: "Ouvrez la fiche d'un partenaire → « Nouveau contrat ».",
    },
    actions: {
      show: ctx.allActions?.length === 0,
      icon: "✅", title: "Planifiez vos premières actions",
      text: "Les actions vous aident à suivre ce qu'il reste à faire : relances, installations, RDV...",
      cta: "Cliquez sur « + Action » ci-dessous ou ajoutez-en depuis une fiche prospect.",
    },
  };
  const tabNeedsDot = (tabId) => guides[tabId]?.show === true;

  // ★ Lien vidéo tuto (configurable dans la config globale)
  const videoUrl = auth.globalConfig?.tutorialVideoUrl || "";

  return (
    <div style={S.app}>
      <style>{`
        @keyframes guidePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
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
          {/* ★ Bouton changer de club */}
          {hasMultipleClubs && <button style={S.hdrBtn} onClick={auth.switchClub} title="Changer de club">🔄 Club</button>}
          <button style={S.hdrBtn} onClick={() => setShowTeam(true)}>Équipe</button>
          {auth.canSettings && <button style={S.hdrBtn} onClick={() => setShowSettings(true)}>Paramètres</button>}
          <button style={S.hdrBtn} onClick={() => setShowExport(true)}>Export</button>
          {!auth.isLocal && <button style={S.hdrBtn} onClick={auth.logout}>Déconnexion</button>}
        </div>
      </div>
      {/* ★ Bandeau période d'essai */}
      {auth.clubStatus?.status === 'trial' && auth.clubStatus?.daysLeft != null && (() => {
        const d = auth.clubStatus.daysLeft;
        const urgent = d <= 7;
        const bg = urgent ? Cl.errL : Cl.warnL;
        const c = urgent ? Cl.err : Cl.warn;
        const borderC = urgent ? Cl.err : Cl.warn;
        return (
          <div style={{ padding: "8px 28px", background: bg, borderBottom: `1px solid ${borderC}30`, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: c }}>
              {d <= 1 ? "⚠️ Dernier jour d'essai !" : `🕐 Période d'essai : ${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`}
            </span>
          </div>
        );
      })()}
      <nav style={S.nav}>
          {visibleTabs.map(t => (
            <button key={t.id} style={{ ...S.navB(tab === t.id), ...(tab === t.id ? { borderBottomColor: tc } : {}), position: "relative" }} onClick={() => setTabAndView(t.id)}>
              {t.label}
              {tabNeedsDot(t.id) && <span style={{ position: "absolute", top: 6, right: 4, width: 7, height: 7, borderRadius: "50%", background: Cl.warn, animation: "dotPulse 2s ease-in-out infinite" }} />}
            </button>
          ))}
        </nav>
      <div style={S.main}>
        {/* ★ Guide contextuel */}
        {guides[tab]?.show && (
          <div style={{ background: Cl.wh, borderRadius: 10, padding: "24px 28px", marginBottom: 16, border: `1px solid ${Cl.pri}30`, boxShadow: "0 2px 8px rgba(59,89,152,0.08)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 32, animation: "guidePulse 2s ease-in-out infinite" }}>{guides[tab].icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>{guides[tab].title}</div>
                <div style={{ fontSize: 13, color: Cl.txtL, lineHeight: 1.5, marginBottom: 8 }}>{guides[tab].text}</div>
                <div style={{ fontSize: 12, color: Cl.pri, fontWeight: 500 }}>👉 {guides[tab].cta}</div>
                {videoUrl && <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: Cl.pri, fontWeight: 500, textDecoration: "none", padding: "5px 12px", background: Cl.priL, borderRadius: 6 }}>🎬 Voir le tutoriel vidéo</a>}
              </div>
            </div>
          </div>
        )}
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
      {showTeam && <TeamModal members={members} memberEmails={ctx.memberEmails} onAdd={addMember} onRemove={m => { setMembers(ms => ms.filter(x => x !== m)); ctx.setMemberEmails(prev => { const n = {...prev}; delete n[m]; return n; }); }} onSetEmail={(m, email) => ctx.setMemberEmails(prev => ({ ...prev, [m]: email }))} onClose={() => setShowTeam(false)} />}
      {showSettings && <SettingsModal cats={cats} seasons={seasons} setSeasons={ctx.setSeasons} currentSeason={currentSeason} clubInfo={ctx.clubInfo} setClubInfo={ctx.setClubInfo} accountCodes={ctx.accountCodes} setAccountCodes={ctx.setAccountCodes} scripts={ctx.scripts} setScripts={ctx.setScripts} contractTemplates={ctx.contractTemplates} setContractTemplates={ctx.setContractTemplates} exclusiviteText={ctx.exclusiviteText} setExclusiviteText={ctx.setExclusiviteText} onClose={() => setShowSettings(false)} />}
      {showExport && <Modal title="📤 Export" onClose={() => setShowExport(false)}>
        <div style={S.exportList}>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Prospects.csv", toCSV(prospectsList.map(p => ({ Entreprise: p.company, Secteur: p.sector, Saison: p.season, Contact: p.contact, Téléphone: p.phone, Email: p.email, Statut: p.prospectStatus, Responsable: p.member })))); setShowExport(false); }}>📤 Prospects</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Partenaires.csv", toCSV(partnersList.map(p => ({ Entreprise: p.company, Secteur: p.sector, Saison: p.season, Contact: p.contact, Téléphone: p.phone, Email: p.email, Statut: p.partnerStatus, HT: (p.products || []).reduce((t, cp) => t + lineHT(cp), 0) })))); setShowExport(false); }}>📤 Partenaires</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Stocks.csv", toCSV(products.map(p => ({ Produit: p.name, Catégorie: p.category, Prix: getPrice(p, currentSeason).price, Stock: p.stock, Vendus: stockSold[p.id] || 0, CA: Math.round(caByProd[p.id] || 0) })))); setShowExport(false); }}>📤 Stocks</button>
          <button style={S.btn("primary")} onClick={() => { dlCSV("Contrats.csv", toCSV(contracts.map(c => { const co = ctx.getCompany(c.companyId); return { Entreprise: co?.company || "?", Type: c.type, Statut: c.status, Saisons: c.seasons, HT: Math.round(contractHT(c)) }; }))); setShowExport(false); }}>📤 Contrats</button>
        </div>
      </Modal>}
      {miniForm && <MiniForm title={miniForm.title} fields={miniForm.fields} onSave={miniForm.onSave} onClose={() => setMiniForm(null)} />}
      <HelpChat whatsapp={auth.globalConfig?.supportWhatsapp} />
    </div>
  );
}

// --- Blocked Screen (essai terminé) ---
function BlockedScreen() {
  const { clubInfo, logout, clubStatus, switchClub, allMemberships } = useAuth();
  const hasMultipleClubs = allMemberships.length > 1;
  return (
    <div style={S.authBg}>
      <div style={{ ...S.authCard, textAlign: "center" }}>
        <div style={S.authMsgIcon}>⏰</div>
        <h2 style={S.authMsgH}>Période d'essai terminée</h2>
        <p style={{ fontSize: 14, color: Cl.txtL, marginTop: 10, lineHeight: 1.6 }}>
          L'accès de <strong>{clubInfo?.name || "votre club"}</strong> a été désactivé.<br />
          {clubStatus?.blockedReason || "Votre période d'essai est arrivée à son terme."}
        </p>
        <div style={{ background: Cl.priL, borderRadius: 8, padding: 16, marginTop: 20 }}>
          <p style={{ fontSize: 13, color: Cl.pri, fontWeight: 500, margin: 0 }}>
            📧 Contactez-nous pour activer votre abonnement et retrouver l'accès à vos données.
          </p>
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {hasMultipleClubs && <button style={S.authLinkBtn} onClick={switchClub}>← Changer de club</button>}
          <button style={S.authLinkBtn} onClick={logout}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// --- Auth Gate ---
function AuthGate() {
  const { user, loading, error, member, clubData, isLocal, needsClubSelection, isClubBlocked } = useAuth();
  if (isLocal) return <AppProvider><AppInner /></AppProvider>;
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  // ★ NOUVEAU : sélection de club si multi-clubs
  if (needsClubSelection) return <ClubSelector />;
  if (error || !member) return <AccessDenied />;
  // ★ Club bloqué
  if (isClubBlocked) return <BlockedScreen />;
  if (clubData !== null) return <AppProvider><AppInner /></AppProvider>;
  return <LoadingScreen />;
}

export default function App() {
  return <AuthProvider><AuthGate /></AuthProvider>;
}
