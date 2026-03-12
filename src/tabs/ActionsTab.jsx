import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { ACTION_TYPES } from '../data/initialData';
import { Badge } from '../components/index';

export default function ActionsTab() {
  const { allActions, companies, setCompanies, contracts, setContracts, members, seasons, currentSeason, todayStr } = useApp();
  const [periodF, setPeriodF] = useState("jour");
  const [memberF, setMemberF] = useState("Tous");
  const [seasonF, setSeasonF] = useState(currentSeason);
  const [catF, setCatF] = useState("Tous");

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

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>📋 Actions ({filtered.length})</h2>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <select style={{ ...S.sel, width: "auto", fontWeight: 700 }} value={periodF} onChange={e => setPeriodF(e.target.value)}>
          <option value="jour">Aujourd'hui</option><option value="semaine">Semaine</option><option value="mois">Mois</option><option value="saison">Saison</option><option value="tout">Tout</option>
        </select>
        {periodF === "saison" && <select style={{ ...S.sel, width: "auto" }} value={seasonF} onChange={e => setSeasonF(e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>}
        <select style={{ ...S.sel, width: "auto" }} value={catF} onChange={e => setCatF(e.target.value)}><option>Tous</option>{ACTION_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <select style={{ ...S.sel, width: "auto" }} value={memberF} onChange={e => setMemberF(e.target.value)}><option>Tous</option>{members.map(m => <option key={m}>{m}</option>)}</select>
      </div>
    </div>
    {filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>🎉 Aucune action</div>
      : (catF !== "Tous" ? [catF] : ACTION_TYPES).map(cat => {
        const items = grouped[cat] || [];
        if (!items.length) return null;
        return (<div key={cat} style={{ marginTop: 10 }}>
          <div style={S.sectionTitle}>{cat} ({items.length})</div>
          {items.sort((a, b) => a.date.localeCompare(b.date)).map(a => (
            <div key={`${a.id}-${a.source}`} style={{ ...S.card, display: "flex", alignItems: "center", gap: 8, padding: 10, opacity: a.done ? 0.5 : 1 }}>
              <input type="checkbox" checked={a.done} style={{ width: 14, height: 14 }} onChange={() => {
                if (a.contractId) setContracts(cs => cs.map(c => c.id === a.contractId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) } : c));
                else setCompanies(cs => cs.map(c => c.id === a.companyId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) } : c));
              }} />
              <div style={{ flex: 1, fontSize: 12 }}><strong>{a.companyName}</strong> · {a.type}{a.note && <span style={{ color: Cl.txtL }}> — {a.note}</span>}</div>
              <span style={{ fontSize: 11, color: Cl.txtL }}>{a.date}</span>
              <span style={{ fontSize: 10, color: Cl.pri }}>👤 {a.assignee}</span>
            </div>
          ))}
        </div>);
      })}
  </>);
}
