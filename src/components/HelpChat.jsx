import { useState, useRef, useEffect } from 'react';
import { S, Cl } from '../data/styles';

const st = {
  fab: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: Cl.slate, color: "#fff", border: "none", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  panel: { position: "fixed", bottom: 24, right: 24, width: 380, maxHeight: 520, borderRadius: 16, background: Cl.wh, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${Cl.brd}` },
  header: { background: Cl.slate, color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, fontWeight: 600 },
  body: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 200, maxHeight: 360 },
  msgUser: { alignSelf: "flex-end", background: Cl.priL, color: Cl.txt, padding: "8px 14px", borderRadius: "14px 14px 4px 14px", maxWidth: "80%", fontSize: 13, lineHeight: 1.5 },
  msgBot: { alignSelf: "flex-start", background: Cl.hov, color: Cl.txt, padding: "8px 14px", borderRadius: "14px 14px 14px 4px", maxWidth: "85%", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  footer: { padding: 12, borderTop: `1px solid ${Cl.brd}`, display: "flex", gap: 8 },
  input: { flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${Cl.brd}`, fontSize: 13, fontFamily: "inherit", outline: "none" },
  send: { padding: "8px 14px", borderRadius: 8, background: Cl.slate, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
};

export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis l'assistant ClubPartner. Posez-moi vos questions sur l'utilisation de l'application.\n\nExemples :\n• Comment ajouter un partenaire ?\n• Comment créer un contrat ?\n• Comment générer une facture ?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      // Envoyer les 6 derniers messages comme historique (pour garder le contexte)
      const history = messages.slice(-6).filter(m => m.role !== "system");

      const res = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue : " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Impossible de contacter l'assistant. Vérifiez votre connexion." }]);
    }
    setLoading(false);
  };

  if (!open) return <button style={st.fab} onClick={() => setOpen(true)} title="Aide">❓</button>;

  return (
    <div style={st.panel}>
      <div style={st.header}>
        <span>❓ Aide ClubPartner</span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      <div style={st.body} ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? st.msgUser : st.msgBot}>{m.content}</div>
        ))}
        {loading && <div style={st.msgBot}>
          <span style={{ animation: "pulse 1.5s infinite", opacity: 0.6 }}>Réflexion en cours...</span>
        </div>}
      </div>
      <div style={st.footer}>
        <input
          style={st.input}
          placeholder="Posez votre question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={loading}
          autoFocus
        />
        <button style={{ ...st.send, opacity: loading ? 0.5 : 1 }} onClick={send} disabled={loading}>Envoyer</button>
      </div>
    </div>
  );
}
