import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, isSigned } from '../data/initialData';

export default function Dashboard() {
  const { prospectsList, partnersList, allActions, todayStr, totalCA, totalPaid, contracts, contractTTC, caByType, caByMember, members, objectives, setObjectives, currentSeason } = useApp();
  const [editObj, setEditObj] = useState(false);
  const totalDue = contracts.filter(c => isSigned(c)).reduce((t, c) => t + contractTTC(c), 0);
  const nbPartP = partnersList.filter(c => (c.dealType || "Partenariat") === "Partenariat").length;
  const nbPartM = partnersList.filter(c => c.dealType === "Mécénat").length;
  const nbProsP = prospectsList.filter(c => (c.dealType || "Partenariat") === "Partenariat").length;
  const nbProsM = prospectsList.filter(c => c.dealType === "Mécénat").length;

  const objTotal = (objectives.partenariat || 0) + (objectives.mecenat || 0);
  const realTotal = (caByType["Partenariat"] || 0) + (caByType["Mécénat"] || 0);
  const pctP = objectives.partenariat > 0 ? ((caByType["Partenariat"] || 0) / objectives.partenariat) * 100 : 0;
  const pctM = objectives.mecenat > 0 ? ((caByType["Mécénat"] || 0) / objectives.mecenat) * 100 : 0;
  const pctT = objTotal > 0 ? (realTotal / objTotal) * 100 : 0;

  const setMemberObj = (m, v) => setObjectives(o => ({ ...o, members: { ...o.members, [m]: Math.max(0, v) } }));

  return (<>
    {/* Stats rapides — enrichies avec contexte */}
    <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.statCard}><div style={S.statL}>Prospects</div><div style={S.statV(Cl.pri)}>{prospectsList.length}</div>{prospectsList.filter(p => p.prospectStatus === "À rappeler").length > 0 && <div style={S.statSub(Cl.warn)}>{prospectsList.filter(p => p.prospectStatus === "À rappeler").length} à rappeler</div>}</div>
      <div style={S.statCard}><div style={S.statL}>Partenaires</div><div style={S.statV(Cl.ok)}>{partnersList.length}</div><div style={S.statSub()}>{partnersList.filter(p => p.partnerStatus === "Nouveau").length > 0 ? `${partnersList.filter(p => p.partnerStatus === "Nouveau").length} nouveau${partnersList.filter(p => p.partnerStatus === "Nouveau").length > 1 ? "x" : ""}` : "Tous actifs"}</div></div>
      <div style={S.statCard}><div style={S.statL}>CA réalisé</div><div style={S.statV(Cl.txt)}>{fmt(totalCA)}</div>{objTotal > 0 && <><div style={S.statSub(pctT >= 100 ? Cl.ok : Cl.txtL)}>{pctT.toFixed(0)}% de l'objectif</div><div style={S.statBar}><div style={S.statBarFill(pctT, pctT >= 100 ? Cl.ok : Cl.pri)} /></div></>}</div>
      <div style={S.statCardHighlight(Cl.warnL)}><div style={S.statL}>Aujourd'hui</div><div style={S.statV(Cl.warn)}>{allActions.filter(a => a.date === todayStr && !a.done).length}</div><div style={S.statSub(Cl.warn)}>actions à faire</div></div>
    </div>

    {/* Actions du jour */}
    {(() => {
      const todayActions = allActions.filter(a => a.date === todayStr && !a.done);
      const upcomingActions = allActions.filter(a => a.date > todayStr && !a.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
      const lateActions = allActions.filter(a => a.date < todayStr && !a.done).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
      const shown = todayActions.length > 0 ? todayActions : upcomingActions;
      const label = todayActions.length > 0 ? `📋 Actions du jour (${todayActions.length})` : `📋 Prochaines actions (${upcomingActions.length})`;
      return (shown.length > 0 || lateActions.length > 0) && <div style={S.card}>
        {lateActions.length > 0 && <>
          <div style={{ ...S.cT, color: Cl.err }}>⚠️ En retard ({lateActions.length})</div>
          {lateActions.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 13 }}>
              <span style={{ ...S.badge(Cl.err, Cl.errL) }}>{a.date}</span>
              <strong style={{ flex: 1 }}>{a.type}</strong>
              <span style={{ color: Cl.txtL }}>{a.companyName}</span>
              {a.assignee && <span style={{ ...S.badge(Cl.pri, Cl.priL) }}>{a.assignee}</span>}
            </div>
          ))}
        </>}
        {shown.length > 0 && <>
          <div style={{ ...S.cT, marginTop: lateActions.length > 0 ? 14 : 0 }}>{label}</div>
          {shown.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 13 }}>
              <span style={{ ...S.badge(todayActions.length > 0 ? Cl.warn : Cl.txtL, todayActions.length > 0 ? Cl.warnL : Cl.hov) }}>{a.date}</span>
              <strong style={{ flex: 1 }}>{a.type}</strong>
              <span style={{ color: Cl.txtL }}>{a.companyName}</span>
              {a.assignee && <span style={{ ...S.badge(Cl.pri, Cl.priL) }}>{a.assignee}</span>}
            </div>
          ))}
        </>}
      </div>;
    })()}

    {/* Objectifs saison */}
    <div style={S.card}>
      <div style={S.fx}>
        <div style={S.cT}>🎯 Objectifs {currentSeason}</div>
        <button style={S.btnS(editObj ? "primary" : "ghost")} onClick={() => setEditObj(!editObj)}>{editObj ? "✓ OK" : "⚙️ Définir"}</button>
      </div>

      {editObj && <div style={{ ...S.section, marginBottom: 12 }}>
        <div style={S.g2}>
          <div><label style={S.lbl}>Objectif Partenariat (€)</label><input type="number" style={S.inp} value={objectives.partenariat || 0} onChange={e => setObjectives(o => ({ ...o, partenariat: Math.max(0, +e.target.value) }))} /></div>
          <div><label style={S.lbl}>Objectif Mécénat (€)</label><input type="number" style={S.inp} value={objectives.mecenat || 0} onChange={e => setObjectives(o => ({ ...o, mecenat: Math.max(0, +e.target.value) }))} /></div>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: Cl.txtL }}>Total : <strong>{fmt(objTotal)}</strong></div>
      </div>}

      {/* Barres objectifs globaux */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={S.fx}>
            <span style={{ fontWeight: 600, color: Cl.pri, fontSize: 13 }}>🤝 Partenariat</span>
            <span style={{ fontSize: 13 }}><strong>{fmt(caByType["Partenariat"] || 0)}</strong> / {fmt(objectives.partenariat || 0)} <span style={{ fontWeight: 700, color: pctP >= 100 ? Cl.ok : pctP >= 50 ? Cl.warn : Cl.err }}>{pctP.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 10 }}><div style={S.bar(pctP, pctP >= 100 ? Cl.ok : Cl.pri)} /></div>
        </div>
        <div>
          <div style={S.fx}>
            <span style={{ fontWeight: 600, color: Cl.pur, fontSize: 13 }}>💜 Mécénat</span>
            <span style={{ fontSize: 13 }}><strong>{fmt(caByType["Mécénat"] || 0)}</strong> / {fmt(objectives.mecenat || 0)} <span style={{ fontWeight: 700, color: pctM >= 100 ? Cl.ok : pctM >= 50 ? Cl.warn : Cl.err }}>{pctM.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 10 }}><div style={S.bar(pctM, pctM >= 100 ? Cl.ok : Cl.pur)} /></div>
        </div>
        <div style={{ borderTop: `2px solid ${Cl.brd}`, paddingTop: 10 }}>
          <div style={S.fx}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>📊 TOTAL</span>
            <span><strong style={{ fontSize: 18 }}>{fmt(realTotal)}</strong> / {fmt(objTotal)} <span style={{ fontWeight: 800, fontSize: 15, color: pctT >= 100 ? Cl.ok : pctT >= 50 ? Cl.warn : Cl.err }}>{pctT.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 14 }}><div style={S.bar(pctT, pctT >= 100 ? Cl.ok : pctT >= 50 ? Cl.warn : Cl.err)} /></div>
        </div>
      </div>
    </div>

    {/* Contribution par membre */}
    <div style={S.card}>
      <div style={S.fx}>
        <div style={S.cT}>👤 Contribution par membre</div>
        {editObj && <span style={{ fontSize: 11, color: Cl.txtL }}>Définir les objectifs individuels ↓</span>}
      </div>
      <table style={S.tbl}>
        <thead><tr><th style={S.th}>Membre</th><th style={S.th}>Partenariat</th><th style={S.th}>Mécénat</th><th style={S.th}>Total réalisé</th>{editObj && <th style={S.th}>Objectif</th>}<th style={S.thR}>Atteinte</th></tr></thead>
        <tbody>{members.map(m => {
          const d = caByMember[m] || { partenariat: 0, mecenat: 0, total: 0 };
          const obj = objectives.members?.[m] || 0;
          const pct = obj > 0 ? (d.total / obj) * 100 : 0;
          return (
            <tr key={m}>
              <td style={S.td}><strong>{m}</strong></td>
              <td style={S.td}>{d.partenariat > 0 ? <span style={{ color: Cl.pri, fontWeight: 600 }}>{fmt(d.partenariat)}</span> : <span style={{ color: Cl.txtL }}>—</span>}</td>
              <td style={S.td}>{d.mecenat > 0 ? <span style={{ color: Cl.pur, fontWeight: 600 }}>{fmt(d.mecenat)}</span> : <span style={{ color: Cl.txtL }}>—</span>}</td>
              <td style={S.td}><strong>{fmt(d.total)}</strong></td>
              {editObj && <td style={S.td}><input type="number" min="0" style={S.inpW(80)} value={obj} onChange={e => setMemberObj(m, +e.target.value)} /></td>}
              <td style={S.tdR}>
                {obj > 0 ? (<>
                  <strong style={{ color: pct >= 100 ? Cl.ok : pct >= 50 ? Cl.warn : Cl.err }}>{pct.toFixed(0)}%</strong>
                  <div style={{ ...S.barBox, width: 60, display: "inline-block", marginLeft: 8, verticalAlign: "middle" }}><div style={S.bar(pct, pct >= 100 ? Cl.ok : pct >= 50 ? Cl.warn : Cl.err)} /></div>
                </>) : <span style={{ color: Cl.txtL, fontSize: 11 }}>Pas d'objectif</span>}
              </td>
            </tr>
          );
        })}</tbody>
      </table>
      {editObj && (() => {
        const totalMemberObj = members.reduce((t, m) => t + (objectives.members?.[m] || 0), 0);
        const diff = objTotal - totalMemberObj;
        return totalMemberObj > 0 && <div style={S.alert(Math.abs(diff) < 1 ? "success" : "warning")}>{Math.abs(diff) < 1 ? "✅ Objectifs individuels = objectif global" : diff > 0 ? `⚠️ ${fmt(diff)} non répartis (total membres: ${fmt(totalMemberObj)})` : `⚠️ Dépasse l'objectif global de ${fmt(-diff)}`}</div>;
      })()}
    </div>

    {/* Répartition par type */}
    <div style={S.card}><div style={S.cT}>📊 Répartition Partenariat / Mécénat</div>
      <div style={S.g2}>
        <div style={S.typeCard(Cl.pri)}>
          <div style={S.typeTitle(Cl.pri)}>🤝 PARTENARIAT</div>
          <div style={S.typeVal(Cl.pri)}>{fmt(caByType["Partenariat"] || 0)}</div>
          <div style={S.typeSub}>{nbPartP} partenaire{nbPartP > 1 ? "s" : ""} · {nbProsP} prospect{nbProsP > 1 ? "s" : ""}</div>
        </div>
        <div style={S.typeCard(Cl.pur)}>
          <div style={S.typeTitle(Cl.pur)}>💜 MÉCÉNAT</div>
          <div style={S.typeVal(Cl.pur)}>{fmt(caByType["Mécénat"] || 0)}</div>
          <div style={S.typeSub}>{nbPartM} partenaire{nbPartM > 1 ? "s" : ""} · {nbProsM} prospect{nbProsM > 1 ? "s" : ""}</div>
        </div>
      </div>
      {totalCA > 0 && <div style={S.stackBar}>
        <div style={S.stackSeg(((caByType["Partenariat"] || 0) / totalCA) * 100, Cl.pri)} />
        <div style={S.stackSeg(((caByType["Mécénat"] || 0) / totalCA) * 100, Cl.pur)} />
      </div>}
    </div>

    {/* Encaissements */}
    <div style={S.card}><div style={S.cT}>🏦 Encaissements</div>
      <div style={S.g3}>
        <div style={S.stat}><div style={S.statV(Cl.ok)}>{fmt(totalPaid)}</div><div style={S.statL}>Encaissé</div></div>
        <div style={S.stat}><div style={S.statV(Cl.warn)}>{fmt(totalDue - totalPaid)}</div><div style={S.statL}>Reste</div></div>
        <div style={S.stat}><div style={S.statV(Cl.txtL)}>{fmt(totalDue)}</div><div style={S.statL}>Total TTC</div></div>
      </div>
      {totalDue > 0 && <div style={S.barBox}><div style={S.bar((totalPaid / totalDue) * 100, Cl.ok)} /></div>}
    </div>
  </>);
}
