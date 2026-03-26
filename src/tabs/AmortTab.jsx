import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, getPrice } from '../data/initialData';
import { Badge } from '../components/index';

export default function AmortTab() {
  const { products, seasons, currentSeason, caByProd } = useApp();
  const [seasonF, setSeasonF] = useState(currentSeason);
  const amortProducts = products.filter(p => p.totalCost > 0);

  const amortData = amortProducts.map(p => {
    const pr = getPrice(p, seasonF);
    const amortSeason = pr.amort || 0;
    const caProd = caByProd[p.id] || 0;
    const totalAmortDone = Object.entries(p.prices || {}).reduce((t, [sid, v]) => {
      const sIdx = seasons.findIndex(s => s.id === sid);
      const curIdx = seasons.findIndex(s => s.id === seasonF);
      return sIdx <= curIdx ? t + (v.amort || 0) : t;
    }, 0);
    const result = caProd - amortSeason;
    return { ...p, pr, amortSeason, caProd, totalAmortDone, result };
  });

  const totalInvest = amortProducts.reduce((t, p) => t + p.totalCost, 0);
  const totalAmortS = amortData.reduce((t, d) => t + d.amortSeason, 0);
  const totalCAS = amortData.reduce((t, d) => t + d.caProd, 0);
  const totalRes = totalCAS - totalAmortS;

  return (<>
    <div style={S.fx}><h2 style={S.pageH}>Amortissement</h2></div>
    <div style={S.filterBar}>
      <select style={{ ...S.filterSel, fontWeight: 600 }} value={seasonF} onChange={e => setSeasonF(e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>
    </div>
    <div style={{ ...S.card, marginTop: 10, ...S.g4 }}>
      <div style={S.statCard}><div style={S.statL}>Investissement</div><div style={S.statV(Cl.txtL)}>{fmt(totalInvest)}</div></div>
      <div style={S.statCard}><div style={S.statL}>À amortir ({seasonF})</div><div style={S.statV(Cl.warn)}>{fmt(totalAmortS)}</div></div>
      <div style={S.statCard}><div style={S.statL}>CA réalisé</div><div style={S.statV(Cl.pri)}>{fmt(totalCAS)}</div></div>
      <div style={S.statCard}><div style={S.statL}>Résultat</div><div style={S.statV(totalRes >= 0 ? Cl.ok : Cl.err)}>{totalRes >= 0 ? "+" : ""}{fmt(totalRes)}</div></div>
    </div>

    {amortData.length === 0 ? <div style={S.empty}>Aucun produit avec amortissement</div>
      : <div style={S.card}><table style={S.tbl}>
        <thead><tr><th style={S.th}>Produit</th><th style={S.thR}>Invest.</th><th style={S.thR}>Amort. saison</th><th style={S.thR}>CA</th><th style={S.thR}>Résultat</th><th style={S.thR}>Amort. cumulé</th><th style={S.thR}>Reste</th><th style={S.th}>Statut</th></tr></thead>
        <tbody>{amortData.map(d => {
          const reste = d.totalCost - d.totalAmortDone;
          const pct = d.totalCost > 0 ? (d.totalAmortDone / d.totalCost) * 100 : 0;
          const ok = d.result >= 0;
          return (<tr key={d.id} style={{ background: ok ? "#f9fefb" : "#fef7f7" }}>
            <td style={S.td}><strong>{d.name}</strong><div style={{ fontSize: 11, color: Cl.txtL }}>{d.category} · {fmt(d.pr.price)}/u</div></td>
            <td style={S.tdR}>{fmt(d.totalCost)}</td>
            <td style={S.tdR}><strong>{fmt(d.amortSeason)}</strong></td>
            <td style={S.tdR}><strong style={{ color: Cl.pri }}>{fmt(d.caProd)}</strong></td>
            <td style={S.tdR}><strong style={{ color: ok ? Cl.ok : Cl.err }}>{ok ? "+" : ""}{fmt(d.result)}</strong></td>
            <td style={S.tdR}>{fmt(d.totalAmortDone)} <div style={{ ...S.barBox, width: 50, display: "inline-block", verticalAlign: "middle" }}><div style={S.bar(pct, pct >= 100 ? Cl.ok : Cl.warn)} /></div></td>
            <td style={S.tdR}>{reste <= 0 ? <Badge type="signed">Amorti ✅</Badge> : fmt(reste)}</td>
            <td style={S.td}>{ok ? <Badge type="signed">Rentable</Badge> : <Badge type="danger">Déficit</Badge>}</td>
          </tr>);
        })}</tbody></table></div>}

    {amortData.map(d => (<div key={d.id} style={S.card}>
      <div style={S.cT}>{d.name} — Détail</div>
      <table style={S.tbl}><thead><tr><th style={S.th}>Saison</th><th style={S.thR}>Prix</th><th style={S.thR}>Coût</th><th style={S.thR}>Amortissement</th></tr></thead>
        <tbody>{seasons.map(s => { const sv = (d.prices || {})[s.id]; if (!sv) return null; return (<tr key={s.id} style={s.id === seasonF ? { background: Cl.priL } : {}}><td style={S.td}><strong>{s.name}</strong>{s.id === seasonF && <Badge type="new">Active</Badge>}</td><td style={S.tdR}>{fmt(sv.price || 0)}</td><td style={S.tdR}>{fmt(sv.cost || 0)}</td><td style={S.tdR}><strong>{fmt(sv.amort || 0)}</strong></td></tr>); })}</tbody></table>
    </div>))}
  </>);
}
