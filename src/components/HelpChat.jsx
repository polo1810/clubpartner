import { useState, useRef, useEffect } from 'react';
import { Cl } from '../data/styles';

// === STYLES ===
const st = {
  fab: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: Cl.slate, color: "#fff", border: "none", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  panel: { position: "fixed", bottom: 24, right: 24, width: 420, maxHeight: 580, borderRadius: 16, background: Cl.wh, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${Cl.brd}` },
  header: { background: Cl.slate, color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, fontWeight: 600 },
  body: { flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12, minHeight: 200, maxHeight: 420 },
  msgUser: { alignSelf: "flex-end", background: Cl.priL, color: Cl.txt, padding: "8px 14px", borderRadius: "14px 14px 4px 14px", maxWidth: "80%", fontSize: 13, lineHeight: 1.7 },
  msgBot: { alignSelf: "flex-start", background: Cl.hov, color: Cl.txt, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", maxWidth: "95%", fontSize: 13, lineHeight: 1.7, width: "95%" },
  footer: { padding: 12, borderTop: `1px solid ${Cl.brd}`, display: "flex", gap: 8 },
  input: { flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${Cl.brd}`, fontSize: 13, fontFamily: "inherit", outline: "none" },
  send: { padding: "8px 14px", borderRadius: 8, background: Cl.slate, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  feedback: { display: "flex", gap: 8, marginTop: 8 },
  fbBtn: (ok) => ({ padding: "6px 14px", borderRadius: 8, border: `1px solid ${ok ? "#22c55e" : "#ef4444"}`, background: ok ? "#f0fdf4" : "#fef2f2", color: ok ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }),
  waBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", marginTop: 8, border: "none", cursor: "pointer" },
};

// === MINI MOCKUP STYLES ===
const mk = {
  wrap: { borderRadius: 10, overflow: "hidden", border: `1px solid ${Cl.brd}`, margin: "8px 0", background: Cl.wh, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  hdr: { background: "#1e293b", color: "#fff", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 },
  hdrBtn: (hl) => ({ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 500, background: hl ? "#fff" : "rgba(255,255,255,0.15)", color: hl ? "#1e293b" : "#fff", border: "none", transition: "all 0.3s", boxShadow: hl ? "0 0 8px rgba(255,255,255,0.8)" : "none" }),
  nav: { display: "flex", gap: 0, padding: "0 10px", background: Cl.wh, borderBottom: `1px solid ${Cl.brd}`, fontSize: 10 },
  navI: (hl) => ({ padding: "7px 10px", borderBottom: hl ? "2px solid #1e293b" : "2px solid transparent", fontWeight: hl ? 600 : 400, color: hl ? "#1e293b" : "#999", background: hl ? "#eef1f7" : "transparent", transition: "all 0.3s" }),
  content: { padding: 10, minHeight: 80 },
  row: { display: "flex", alignItems: "center", padding: "5px 8px", marginBottom: 4, borderRadius: 6, background: Cl.hov, fontSize: 10, gap: 6 },
  field: { marginBottom: 6 },
  fieldLbl: { fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 },
  fieldInp: { width: "100%", padding: "4px 8px", borderRadius: 5, border: `1px solid ${Cl.brd}`, fontSize: 10, background: Cl.wh, boxSizing: "border-box" },
  btn: (hl) => ({ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: hl ? Cl.pri : Cl.slate, color: "#fff", border: "none", boxShadow: hl ? `0 0 0 3px ${Cl.priL}, 0 0 12px ${Cl.pri}` : "none", animation: hl ? "pulse-btn 1.5s infinite" : "none" }),
  badge: (bg, c) => ({ display: "inline-block", padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 600, background: bg, color: c }),
  pointer: { position: "absolute", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: Cl.pri },
};

// === SCENES : mini-maquettes de chaque écran ===
const scenes = {
  // --- Navigation tabs ---
  "nav-prospects": () => <MockNav hl="Prospects" />,
  "nav-partners": () => <MockNav hl="Partenaires" />,
  "nav-contracts": () => <MockNav hl="Contrats" />,
  "nav-factures": () => <MockNav hl="Factures" />,
  "nav-actions": () => <MockNav hl="Actions" />,
  "nav-stocks": () => <MockNav hl="Stocks" />,
  "nav-admin": () => <MockNav hl="Administration" />,

  // --- Header buttons ---
  "header-equipe": () => <MockHeader hl="Équipe" />,
  "header-params": () => <MockHeader hl="Paramètres" />,
  "header-export": () => <MockHeader hl="Export" />,

  // --- Add buttons ---
  "add-prospect": () => (
    <div style={mk.wrap}>
      <MockHdr /><MockNavBar hl="Prospects" />
      <div style={mk.content}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Prospects (23)</span>
          <button style={mk.btn(true)}>+ Prospect</button>
        </div>
        <div style={mk.row}><span style={mk.badge(Cl.priL, Cl.pri)}>Nouveau</span> Boulangerie Durand</div>
        <div style={mk.row}><span style={mk.badge("#d1fae5", "#059669")}>Intéressé</span> Pharmacie Centrale</div>
        <div style={mk.row}><span style={mk.badge(Cl.purL, Cl.pur)}>RDV pris</span> Garage Auto Plus</div>
      </div>
    </div>
  ),

  "add-contract": () => (
    <div style={mk.wrap}>
      <MockHdr /><MockNavBar hl="Contrats" />
      <div style={mk.content}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Contrats</span>
          <button style={mk.btn(true)}>+ Contrat</button>
        </div>
        <div style={mk.row}><span style={mk.badge(Cl.okL, Cl.ok)}>Signé</span> Garage Auto Plus — 2 350 €</div>
        <div style={mk.row}><span style={mk.badge("#fdf5e8", Cl.warn)}>En attente</span> Fleuriste Martin — 800 €</div>
      </div>
    </div>
  ),

  "add-product": () => (
    <div style={mk.wrap}>
      <MockHdr /><MockNavBar hl="Stocks" />
      <div style={mk.content}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Produits & Stocks</span>
          <button style={mk.btn(true)}>+ Produit</button>
        </div>
        <div style={mk.row}>Panneau terrain (grand) — Stock: 10</div>
        <div style={mk.row}>Logo maillot (dos) — Stock: 1</div>
      </div>
    </div>
  ),

  // --- Forms ---
  "form-prospect": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>Nouveau prospect</span><span style={{ color: "#999" }}>✕</span>
      </div>
      <div style={{ padding: 10 }}>
        <MockField label="Nom entreprise" placeholder="ex: Boulangerie Durand" hl />
        <MockField label="Secteur" placeholder="ex: Alimentation" />
        <MockField label="Contact" placeholder="Prénom Nom" />
        <MockField label="Téléphone" placeholder="06 xx xx xx xx" />
        <MockField label="Email" placeholder="email@example.com" />
        <MockField label="Responsable" placeholder="Choisir un membre" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
          <button style={{ ...mk.btn(false), background: Cl.wh, color: Cl.txt, border: `1px solid ${Cl.brd}` }}>Annuler</button>
          <button style={mk.btn(true)}>Enregistrer</button>
        </div>
      </div>
    </div>
  ),

  "form-contract": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>Nouveau contrat</span><span style={{ color: "#999" }}>✕</span>
      </div>
      <div style={{ padding: 10 }}>
        <MockField label="Entreprise" placeholder="Choisir..." hl />
        <MockField label="Type" placeholder="Partenariat / Mécénat" />
        <MockField label="Responsable" placeholder="Choisir un membre" />
        <MockField label="Nb de saisons" placeholder="1" />
        <MockField label="Saison de début" placeholder="2025-2026" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
          <button style={{ ...mk.btn(false), background: Cl.wh, color: Cl.txt, border: `1px solid ${Cl.brd}` }}>Annuler</button>
          <button style={mk.btn(true)}>Créer</button>
        </div>
      </div>
    </div>
  ),

  // --- Actions on detail views ---
  "convert-partner": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>Boulangerie Durand</span><span style={mk.badge("#d1fae5", "#059669")}>Intéressé</span>
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>Contact : Marie Durand · 06 12 34 56 78</div>
        <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>Responsable : Sarah Martin</div>
        <div style={{ borderTop: `1px solid ${Cl.brd}`, paddingTop: 8, display: "flex", gap: 6 }}>
          <button style={{ ...mk.btn(false), background: Cl.wh, color: Cl.txt, border: `1px solid ${Cl.brd}` }}>Ajouter action</button>
          <button style={mk.btn(true)}>Convertir en partenaire</button>
        </div>
      </div>
    </div>
  ),

  "generate-invoice": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>Contrat — Garage Auto Plus</span><span style={mk.badge(Cl.okL, Cl.ok)}>Signé</span>
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>Type : Partenariat · 2 saisons · 2 350 € HT</div>
        <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>Produits : Panneau terrain, Annonce speaker ×5</div>
        <div style={{ borderTop: `1px solid ${Cl.brd}`, paddingTop: 8, display: "flex", gap: 6 }}>
          <button style={mk.btn(true)}>Générer facture</button>
          <button style={{ ...mk.btn(false), background: Cl.pur, boxShadow: "none" }}>Générer CERFA</button>
        </div>
      </div>
    </div>
  ),

  // --- Modals ---
  "team-modal": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>👥 Équipe</span><span style={{ color: "#999" }}>✕</span>
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ ...mk.row, justifyContent: "space-between" }}><b>Sarah Martin</b> <span style={{ color: "#999", fontSize: 9 }}>sarah@club.fr</span></div>
        <div style={{ ...mk.row, justifyContent: "space-between" }}><b>Lucas Dupont</b> <span style={{ color: "#999", fontSize: 9 }}>lucas@club.fr</span></div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ ...mk.fieldInp, flex: 1 }} placeholder="Nouveau membre..." />
          <button style={mk.btn(true)}>Ajouter</button>
        </div>
      </div>
    </div>
  ),

  "export-modal": () => (
    <div style={mk.wrap}>
      <div style={{ ...mk.hdr, background: Cl.wh, color: Cl.txt, borderBottom: `1px solid ${Cl.brd}` }}>
        <span style={{ fontWeight: 600 }}>📤 Export</span><span style={{ color: "#999" }}>✕</span>
      </div>
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={mk.btn(true)}>📤 Prospects</button>
        <button style={mk.btn(false)}>📤 Partenaires</button>
        <button style={mk.btn(false)}>📤 Stocks</button>
        <button style={mk.btn(false)}>📤 Contrats</button>
      </div>
    </div>
  ),
};

// === HELPER COMPONENTS ===
function MockHdr({ hl }) {
  return (
    <div style={mk.hdr}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14 }}>🏟️</span>
        <div><div style={{ fontWeight: 600, fontSize: 11 }}>Mon Club Sportif</div><div style={{ fontSize: 8, opacity: 0.6 }}>2025-2026</div></div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={mk.hdrBtn(hl === "Équipe")}>Équipe</button>
        <button style={mk.hdrBtn(hl === "Paramètres")}>Paramètres</button>
        <button style={mk.hdrBtn(hl === "Export")}>Export</button>
      </div>
    </div>
  );
}

function MockNavBar({ hl }) {
  const tabs = ["Tableau de bord", "Prospects", "Partenaires", "Contrats", "Factures", "Actions", "Stocks"];
  return <div style={mk.nav}>{tabs.map(t => <span key={t} style={mk.navI(t === hl)}>{t}</span>)}</div>;
}

function MockNav({ hl }) {
  return <div style={mk.wrap}><MockHdr /><MockNavBar hl={hl} /></div>;
}

function MockHeader({ hl }) {
  return <div style={mk.wrap}><MockHdr hl={hl} /><MockNavBar /></div>;
}

function MockField({ label, placeholder, hl }) {
  return (
    <div style={mk.field}>
      <div style={mk.fieldLbl}>{label}</div>
      <input style={{ ...mk.fieldInp, ...(hl ? { borderColor: Cl.pri, boxShadow: `0 0 0 2px ${Cl.priL}` } : {}) }} placeholder={placeholder} readOnly />
    </div>
  );
}

// === PARSE + RENDER ===
function parseInline(text) {
  const parts = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function renderContent(text) {
  const lines = text.split("\n");
  const elements = [];
  let stepGroup = [];

  const flushSteps = () => {
    if (!stepGroup.length) return;
    elements.push(
      <div key={`sg-${elements.length}`} style={{ margin: "6px 0" }}>
        {stepGroup.map((s, i) => (
          <div key={i}>
            {i > 0 && <div style={{ textAlign: "center", color: "#bbb", fontSize: 12, margin: "2px 0" }}>↓</div>}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px", borderRadius: 8, background: Cl.wh, border: `1px solid ${Cl.brd}`, marginBottom: 2 }}>
              <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: Cl.pri, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{parseInline(s.text)}</div>
            </div>
            {s.scene && scenes[s.scene] && <div style={{ marginTop: 2, marginBottom: 4 }}>{scenes[s.scene]()}</div>}
          </div>
        ))}
      </div>
    );
    stepGroup = [];
  };

  for (let li = 0; li < lines.length; li++) {
    const trimmed = lines[li].trim();

    // Detect numbered step
    const stepMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (stepMatch) {
      let stepText = stepMatch[2];
      let scene = null;

      // Check if next line is a scene marker
      if (li + 1 < lines.length) {
        const nextTrimmed = lines[li + 1].trim();
        const sceneMatch = nextTrimmed.match(/^\[scene:([^\]]+)\]$/);
        if (sceneMatch) {
          scene = sceneMatch[1];
          li++; // skip scene line
        }
      }

      // Also check inline scene marker
      const inlineScene = stepText.match(/\[scene:([^\]]+)\]/);
      if (inlineScene) {
        scene = inlineScene[1];
        stepText = stepText.replace(/\s*\[scene:[^\]]+\]/, "");
      }

      stepGroup.push({ text: stepText, scene });
      continue;
    }

    flushSteps();

    // Standalone scene
    const sceneMatch = trimmed.match(/^\[scene:([^\]]+)\]$/);
    if (sceneMatch && scenes[sceneMatch[1]]) {
      elements.push(<div key={`sc-${li}`}>{scenes[sceneMatch[1]]()}</div>);
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={`br-${li}`} style={{ height: 4 }} />);
    } else {
      elements.push(<div key={`l-${li}`}>{parseInline(trimmed)}</div>);
    }
  }
  flushSteps();
  return elements;
}

// === ANIMATION CSS ===
const animStyle = `@keyframes pulse-btn { 0%,100%{box-shadow:0 0 0 3px #eef1f7, 0 0 12px #3b5998} 50%{box-shadow:0 0 0 6px #eef1f7, 0 0 20px #3b5998} }`;

// === MAIN COMPONENT ===
export default function HelpChat({ whatsapp }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis l'assistant ClubPartner.\n\nPosez-moi vos questions, par exemple :\n\n1. Comment ajouter un partenaire ?\n[scene:add-prospect]\n2. Comment créer un contrat ?\n[scene:add-contract]\n3. Comment gérer mon équipe ?\n[scene:team-modal]", noFeedback: true }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [missCount, setMissCount] = useState(0);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    if (!text) setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const history = messages.slice(-8).filter(m => m.role !== "system");
      const res = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.error ? "Désolé, une erreur est survenue : " + data.error : data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Impossible de contacter l'assistant. Vérifiez votre connexion." }]);
    }
    setLoading(false);
  };

  const handleFeedback = (msgIdx, ok) => {
    setFeedbackGiven(prev => ({ ...prev, [msgIdx]: true }));
    if (ok) {
      setMissCount(0);
      setMessages(prev => [...prev, { role: "assistant", content: "Super, content d'avoir pu vous aider ! 😊 N'hésitez pas si vous avez d'autres questions.", noFeedback: true }]);
    } else {
      const newMiss = missCount + 1;
      setMissCount(newMiss);
      if (newMiss >= 2) {
        const waMsg = whatsapp
          ? "Je suis désolé de ne pas avoir pu résoudre votre problème. 😕\n\nJe vous propose de contacter directement notre support :"
          : "Je suis désolé de ne pas avoir pu résoudre votre problème. 😕\n\nJe vous conseille de contacter directement le responsable de votre club pour plus d'aide.";
        setMessages(prev => [...prev, { role: "assistant", content: waMsg, showWhatsapp: true, noFeedback: true }]);
      } else {
        send("Ma réponse précédente n'a pas aidé l'utilisateur. Pose-lui 1 ou 2 questions courtes pour mieux comprendre son problème exact et essaie de donner une réponse plus précise.");
      }
    }
  };

  const waLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide avec ClubPartner.")}` : null;

  if (!open) return (
    <>
      <style>{animStyle}</style>
      <button style={st.fab} onClick={() => setOpen(true)} title="Aide">❓</button>
    </>
  );

  return (
    <>
      <style>{animStyle}</style>
      <div style={st.panel}>
        <div style={st.header}>
          <span>❓ Aide ClubPartner</span>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={st.body} ref={bodyRef}>
          {messages.map((m, i) => (
            <div key={i}>
              <div style={m.role === "user" ? st.msgUser : st.msgBot}>
                {m.role === "assistant" ? renderContent(m.content) : m.content}
                {m.showWhatsapp && waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" style={st.waBtn}>
                    💬 Contacter le support sur WhatsApp
                  </a>
                )}
              </div>
              {m.role === "assistant" && !m.noFeedback && !feedbackGiven[i] && !loading && (
                <div style={st.feedback}>
                  <button style={st.fbBtn(true)} onClick={() => handleFeedback(i, true)}>✅ Résolu</button>
                  <button style={st.fbBtn(false)} onClick={() => handleFeedback(i, false)}>❌ Pas résolu</button>
                </div>
              )}
            </div>
          ))}
          {loading && <div style={st.msgBot}><span style={{ opacity: 0.6 }}>Réflexion en cours...</span></div>}
        </div>
        <div style={st.footer}>
          <input style={st.input} placeholder="Posez votre question..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} disabled={loading} autoFocus />
          <button style={{ ...st.send, opacity: loading ? 0.5 : 1 }} onClick={() => send()} disabled={loading}>Envoyer</button>
        </div>
      </div>
    </>
  );
}
