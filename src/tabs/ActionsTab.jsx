import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { ACTION_TYPES, uid } from '../data/initialData';
import { Badge } from '../components/index';

export default function ActionsTab() {
  const { allActions, companies, setCompanies, contracts, setContracts, members, addMember, seasons, currentSeason, todayStr, prospectsList, partnersList, setMiniForm, setInvoices } = useApp();
  const [periodF, setPeriodF] = useState("jour");
  const [memberF, setMemberF] = useState("Tous");
  const [seasonF, setSeasonF] = useState(currentSeason);
  const [catF, setCatF] = useState("Tous");
  const [showArchived, setShowArchived] = useState(false);
  const [celebrating, setCelebrating] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);

  // --- Helper : modifier une action dans sa source ---
  const updateActionInSource = (a, updater) => {
    if (a.invoiceId) setInvoices(is => is.map(i => i.id === a.invoiceId ? { ...i, actions: updater(i.actions) } : i));
    else if (a.contractId) setContracts(cs => cs.map(c => c.id === a.contractId ? { ...c, actions: updater(c.actions) } : c));
    else setCompanies(cs => cs.map(c => c.id === a.companyId ? { ...c, actions: updater(c.actions) } : c));
  };

  const toggleAction = (a) => {
    if (!a.done) {
      setCelebrating(prev => ({ ...prev, [a.id]: true }));
      setTimeout(() => {
        updateActionInSource(a, acts => acts.map(x => x.id === a.id ? { ...x, done: true } : x));
        setCelebrating(prev => { const n = { ...prev }; delete n[a.id]; return n; });
      }, 800);
    } else {
      updateActionInSource(a, acts => acts.map(x => x.id === a.id ? { ...x, done: false } : x));
    }
  };

  const editAction = (a) => {
    setMenuOpen(null);
    setMiniForm({ title: "Modifier l'action", fields: [
      { key: "type", label: "Intitulé", value: a.type },
      { key: "category", label: "Catégorie", value: a.category, type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: a.date, type: "date" },
      { key: "assignee", label: "Assigné à", value: a.assignee, type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: a.note || "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type) return;
      updateActionInSource(a, acts => acts.map(x => x.id === a.id ? { ...x, type: v.type, category: v.category, date: v.date, assignee: v.assignee, note: v.note || "" } : x));
      setMiniForm(null);
    }});
  };

  const archiveAction = (a) => {
    setMenuOpen(null);
    updateActionInSource(a, acts => acts.map(x => x.id === a.id ? { ...x, archived: !x.archived } : x));
  };

  const deleteAction = (a) => {
    setMenuOpen(null);
    if (!confirm("Supprimer cette action ?")) return;
    updateActionInSource(a, acts => acts.filter(x => x.id !== a.id));
  };

  const now = new Date();
  const isInPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (periodF === "jour") return dateStr === todayStr;
    if (periodF === "semaine") { const w = new Date(now); w.setDate(now.getDate() - now.getDay() + 1); const we = new Date(w); we.setDate(w.getDate() + 6); return d >= w && d <= we; }
    if (periodF === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (periodF === "saison") { const s = seasons.find(x => x.id === seasonF); if (!s) return true; return dateStr >= s.startDate && dateStr <= s.endDate; }
    return true;
  };

  let filtered = allActions.filter(a => isInPeriod(a.date));
  if (!showArchived) filtered = filtered.filter(a => !a.archived);
  else filtered = filtered.filter(a => a.archived);
  if (memberF !== "Tous") filtered = filtered.filter(a => a.assignee === memberF);
  if (catF !== "Tous") filtered = filtered.filter(a => a.category === catF);

  const grouped = {};
  ACTION_TYPES.forEach(t => { grouped[t] = filtered.filter(a => a.category === t); });

  const addAction = () => {
    const allCos = [...prospectsList, ...partnersList];
    if (!allCos.length) return;
    setMiniForm({ title: "Nouvelle action", fields: [
      { key: "company", label: "Entreprise", value: allCos[0]?.company || "", type: "select", options: allCos.map(c => c.company) },
      { key: "type", label: "Intitulé", value: "" },
      { key: "category", label: "Catégorie", value: "Prospection", type: "select", options: ACTION_TYPES },
      { key: "date", label: "Date", value: todayStr, type: "date" },
      { key: "assignee", label: "Assigné à", value: members[0], type: "member", options: members, onAdd: addMember },
      { key: "note", label: "Note", value: "", type: "textarea" },
    ], onSave: (v) => {
      if (!v.type || !v.company) return;
      const co = allCos.find(c => c.company === v.company);
      if (!co) return;
      setCompanies(cs => cs.map(c => c.id === co.id ? { ...c, actions: [...(c.actions || []), { id: uid(), type: v.type, category: v.category, date: v.date || todayStr, done: false, note: v.note || "", assignee: v.assignee || "" }] } : c));
      setMiniForm(null);
    }});
  };

  return (<>
    <style>{`
      @keyframes drawCheck {
        0% { stroke-dashoffset: 24; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes circleDraw {
        0% { stroke-dashoffset: 60; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes popBounce {
        0% { transform: scale(0); opacity: 0; }
        40% { transform: scale(1.2); opacity: 1; }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes strikeThrough {
        0% { width: 0; }
        100% { width: 100%; }
      }
    `}</style>
    {/* Titre + bouton */}
    <div style={S.fx}><h2 style={S.pageH}>Actions ({filtered.length})</h2><button style={S.btn("primary")} onClick={addAction}>+ Action</button></div>

    {/* Mini tableau de bord */}
    {(() => {
      const all = allActions.filter(a => !a.archived);
      const todo = all.filter(a => !a.done);
      const late = todo.filter(a => a.date < todayStr);
      const todoToday = todo.filter(a => a.date === todayStr);
      const lateToday = todo.filter(a => a.date < todayStr);
      return <div style={{ ...S.card, marginTop: 10, ...S.g4 }}>
        <div style={S.statCard}><div style={S.statL}>À faire (total)</div><div style={S.statV(Cl.pri)}>{todo.length}</div></div>
        <div style={S.statCard}><div style={S.statL}>En retard (total)</div><div style={S.statV(Cl.err)}>{late.length}</div></div>
        <div style={S.statCard}><div style={S.statL}>À faire aujourd'hui</div><div style={S.statV(Cl.warn)}>{todoToday.length}</div></div>
        <div style={S.statCard}><div style={S.statL}>En retard aujourd'hui</div><div style={S.statV(lateToday.length > 0 ? Cl.err : Cl.ok)}>{lateToday.length}</div></div>
      </div>;
    })()}

    {/* Filtres */}
    <div style={S.filterBar}>
      <select style={{ ...S.filterSel, fontWeight: 600 }} value={periodF} onChange={e => setPeriodF(e.target.value)}>
        <option value="jour">Aujourd'hui</option><option value="semaine">Semaine</option><option value="mois">Mois</option><option value="saison">Saison</option><option value="tout">Tout</option>
      </select>
      {periodF === "saison" && <select style={S.filterSel} value={seasonF} onChange={e => setSeasonF(e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>}
      <select style={S.filterSel} value={catF} onChange={e => setCatF(e.target.value)}><option>Tous</option>{ACTION_TYPES.map(t => <option key={t}>{t}</option>)}</select>
      <select style={S.filterSel} value={memberF} onChange={e => setMemberF(e.target.value)}><option>Tous</option>{members.map(m => <option key={m}>{m}</option>)}</select>
      <button style={{ ...S.filterSel, cursor: "pointer", background: showArchived ? Cl.priL : Cl.wh, border: `1px solid ${showArchived ? Cl.pri : Cl.brd}`, borderRadius: 6, padding: "5px 10px", fontSize: 12 }} onClick={() => setShowArchived(!showArchived)}>
        {showArchived ? "📦 Archivées" : "📋 Actives"}
      </button>
    </div>
    {/* Liste */}
    <div style={{ marginTop: 10 }}>
    {filtered.length === 0 ? <div style={S.empty}>{showArchived ? "Aucune action archivée" : "Aucune action pour cette période"}</div>
      : (catF !== "Tous" ? [catF] : ACTION_TYPES).map(cat => {
        const items = grouped[cat] || [];
        if (!items.length) return null;
        return (<div key={cat} style={{ marginTop: 12 }}>
          <div style={S.sectionTitle}>{cat} ({items.length})</div>
          {items.sort((a, b) => a.date.localeCompare(b.date)).map(a => {
            const isCeleb = celebrating[a.id];
            const isMenuOpen = menuOpen === a.id + a.source;
            const CheckSvg = () => (
              <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: "popBounce 0.5s ease forwards" }}>
                <circle cx="11" cy="11" r="9" fill="none" stroke={Cl.ok} strokeWidth="2" strokeDasharray="60" strokeDashoffset="60" style={{ animation: "circleDraw 0.4s ease forwards" }} />
                <path d="M6.5 11.5L9.5 14.5L15.5 8" fill="none" stroke={Cl.ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "drawCheck 0.3s ease 0.2s forwards" }} />
              </svg>
            );
            return (
            <div key={`${a.id}-${a.source}`} style={{
              ...S.actItem(a.done),
              background: isCeleb ? Cl.okL : a.archived ? "#f9f9f9" : S.actItem(a.done).background,
              boxShadow: isCeleb ? `0 0 0 1px ${Cl.ok}` : "none",
              transition: "all 0.3s ease",
            }}>
              <div style={{ width: 22, height: 22, flexShrink: 0, cursor: "pointer" }} onClick={() => !isCeleb && toggleAction(a)}>
                {isCeleb
                  ? <CheckSvg />
                  : a.done
                    ? <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="none" stroke={Cl.ok} strokeWidth="2" /><path d="M6.5 11.5L9.5 14.5L15.5 8" fill="none" stroke={Cl.ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${Cl.brd}`, background: Cl.wh }} />
                }
              </div>
              <div style={{ ...S.actText, position: "relative" }}>
                <strong style={{ color: isCeleb ? Cl.txtL : Cl.txt, transition: "color 0.3s" }}>{a.companyName}</strong> · {a.type}
                {a.note && <span style={{ color: Cl.txtL }}> — {a.note}</span>}
                {isCeleb && <div style={{ position: "absolute", top: "50%", left: 0, height: 2, background: Cl.ok, borderRadius: 1, animation: "strikeThrough 0.4s ease 0.3s forwards", width: 0 }} />}
              </div>
              <span style={{ fontSize: 12, color: Cl.txtL }}>{a.date}</span>
              {isCeleb
                ? <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#fff", background: Cl.ok, animation: "popBounce 0.4s ease 0.3s both", whiteSpace: "nowrap" }}>Fait !</span>
                : <span style={{ fontSize: 11, color: Cl.pri, fontWeight: 500 }}>👤 {a.assignee}</span>
              }
              {/* Menu contextuel */}
              <div style={{ position: "relative" }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 4, color: Cl.txtL }} onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : a.id + a.source); }}>⋮</button>
                {isMenuOpen && <>
                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />
                  <div style={{ position: "absolute", right: 0, top: "100%", background: Cl.wh, border: `1px solid ${Cl.brd}`, borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 150, padding: "4px 0" }}>
                    <button style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", display: "block", width: "100%", border: "none", background: "transparent", textAlign: "left" }} onClick={() => editAction(a)}>✏️ Modifier</button>
                    <button style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", display: "block", width: "100%", border: "none", background: "transparent", textAlign: "left" }} onClick={() => archiveAction(a)}>{a.archived ? "📋 Désarchiver" : "📦 Archiver"}</button>
                    <button style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", display: "block", width: "100%", border: "none", background: "transparent", textAlign: "left", color: Cl.err }} onClick={() => deleteAction(a)}>🗑️ Supprimer</button>
                  </div>
                </>}
              </div>
            </div>
            );
          })}
        </div>);
      })}
    </div>
  </>);
}
