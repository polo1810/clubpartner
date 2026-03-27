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
  const [celebrating, setCelebrating] = useState({});

  const toggleAction = (a) => {
    if (!a.done) {
      setCelebrating(prev => ({ ...prev, [a.id]: true }));
      setTimeout(() => {
        if (a.invoiceId) setInvoices(is => is.map(i => i.id === a.invoiceId ? { ...i, actions: i.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : i));
        else if (a.contractId) setContracts(cs => cs.map(c => c.id === a.contractId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : c));
        else setCompanies(cs => cs.map(c => c.id === a.companyId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : c));
        setCelebrating(prev => { const n = { ...prev }; delete n[a.id]; return n; });
      }, 700);
    } else {
      if (a.invoiceId) setInvoices(is => is.map(i => i.id === a.invoiceId ? { ...i, actions: i.actions.map(x => x.id === a.id ? { ...x, done: false } : x) } : i));
      else if (a.contractId) setContracts(cs => cs.map(c => c.id === a.contractId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: false } : x) } : c));
      else setCompanies(cs => cs.map(c => c.id === a.companyId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: false } : x) } : c));
    }
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
    <style>{`@keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }`}</style>
    {/* Titre + bouton */}
    <div style={S.fx}><h2 style={S.pageH}>Actions ({filtered.length})</h2><button style={S.btn("primary")} onClick={addAction}>+ Action</button></div>
    {/* Filtres — même filterBar que Prospects/Partners/Contrats */}
    <div style={S.filterBar}>
      <select style={{ ...S.filterSel, fontWeight: 600 }} value={periodF} onChange={e => setPeriodF(e.target.value)}>
        <option value="jour">Aujourd'hui</option><option value="semaine">Semaine</option><option value="mois">Mois</option><option value="saison">Saison</option><option value="tout">Tout</option>
      </select>
      {periodF === "saison" && <select style={S.filterSel} value={seasonF} onChange={e => setSeasonF(e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>}
      <select style={S.filterSel} value={catF} onChange={e => setCatF(e.target.value)}><option>Tous</option>{ACTION_TYPES.map(t => <option key={t}>{t}</option>)}</select>
      <select style={S.filterSel} value={memberF} onChange={e => setMemberF(e.target.value)}><option>Tous</option>{members.map(m => <option key={m}>{m}</option>)}</select>
    </div>
    {/* Liste — même espacement marginTop: 10 */}
    <div style={{ marginTop: 10 }}>
    {filtered.length === 0 ? <div style={S.empty}>Aucune action pour cette période</div>
      : (catF !== "Tous" ? [catF] : ACTION_TYPES).map(cat => {
        const items = grouped[cat] || [];
        if (!items.length) return null;
        return (<div key={cat} style={{ marginTop: 12 }}>
          <div style={S.sectionTitle}>{cat} ({items.length})</div>
          {items.sort((a, b) => a.date.localeCompare(b.date)).map(a => {
            const isCelebrating = celebrating[a.id];
            return (
            <div key={`${a.id}-${a.source}`} style={{
              ...S.actItem(a.done),
              background: isCelebrating ? Cl.okL : S.actItem(a.done).background,
              borderColor: isCelebrating ? Cl.ok : S.actItem(a.done).borderColor,
              transform: isCelebrating ? "scale(1.02)" : "scale(1)",
              opacity: isCelebrating ? 1 : a.done ? 0.4 : 1,
              transition: "all 0.4s ease",
            }}>
              <div style={{ position: "relative", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <input type="checkbox" checked={a.done || !!isCelebrating} style={{ ...S.actCheck, width: 18, height: 18, accentColor: Cl.ok }} onChange={() => toggleAction(a)} />
                {isCelebrating && <span style={{ position: "absolute", fontSize: 18, pointerEvents: "none", animation: "popIn 0.4s ease" }}>✅</span>}
              </div>
              <div style={S.actText}>
                <strong>{a.companyName}</strong> · {a.type}
                {a.note && <span style={{ color: Cl.txtL }}> — {a.note}</span>}
                {isCelebrating && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: Cl.ok, animation: "popIn 0.3s ease" }}>Bravo !</span>}
              </div>
              <span style={{ fontSize: 12, color: Cl.txtL }}>{a.date}</span>
              <span style={{ fontSize: 11, color: Cl.pri, fontWeight: 500 }}>👤 {a.assignee}</span>
            </div>
            );
          })}
        </div>);
      })}
    </div>
  </>);
}
