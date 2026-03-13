import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, isSigned } from '../data/initialData';

export default function Dashboard() {
  const { prospectsList, partnersList, allActions, todayStr, totalCA, totalPaid, contracts, contractTTC, caByType, caByMember, companies, members, objectives, setObjectives, currentSeason } = useApp();
  const [editObj, setEditObj] = useState(false);
  const totalDue = contracts.filter(c => isSigned(c)).reduce((t, c) => t + contractTTC(c), 0);
  const nbPartP = companies.filter(c => (c.dealType || "Partenariat") === "Partenariat" && c.isPartner).length;
  const nbPartM = companies.filter(c => c.dealType === "Mécénat" && c.isPartner).length;
  const nbProsP = companies.filter(c => (c.dealType || "Partenariat") === "Partenariat" && !c.isPartner).length;
  const nbProsM = companies.filter(c => c.dealType === "Mécénat" && !c.isPartner).length;

  const objTotal = (objectives.partenariat || 0) + (objectives.mecenat || 0);
  const realTotal = (caByType["Partenariat"] || 0) + (caByType["Mécénat"] || 0);
  const pctP = objectives.partenariat > 0 ? ((caByType["Partenariat"] || 0) / objectives.partenariat) * 100 : 0;
  const pctM = objectives.mecenat > 0 ? ((caByType["Mécénat"] || 0) / objectives.mecenat) * 100 : 0;
  const pctT = objTotal > 0 ? (realTotal / objTotal) * 100 : 0;

  const setMemberObj = (m, v) => setObjectives(o => ({ ...o, members: { ...o.members, [m]: Math.max(0, v) } }));

  return (<>
    {/* Stats rapides */}
    <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🎯</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.pri }}>{prospectsList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Prospects</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🤝</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{partnersList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Partenaires</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>📋</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.warn }}>{allActions.filter(a => a.date === todayStr && !a.done).length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Actions aujourd'hui</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>💰</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{fmt(totalCA)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CA HT total</div></div>
    </div>

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
        <div style={{ marginTop: 8, fontSize: 12, color: Cl.txtL }}>Total : <strong>{fmt(objTotal)}</strong></div>
      </div>}

      {/* Barres objectifs globaux */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: Cl.pri }}>🤝 Partenariat</span>
            <span><strong>{fmt(caByType["Partenariat"] || 0)}</strong> / {fmt(objectives.partenariat || 0)} <span style={{ fontWeight: 700, color: pctP >= 100 ? Cl.ok : pctP >= 50 ? Cl.warn : Cl.err }}>{pctP.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 10 }}><div style={S.bar(pctP, pctP >= 100 ? Cl.ok : Cl.pri)} /></div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: Cl.pur }}>💜 Mécénat</span>
            <span><strong>{fmt(caByType["Mécénat"] || 0)}</strong> / {fmt(objectives.mecenat || 0)} <span style={{ fontWeight: 700, color: pctM >= 100 ? Cl.ok : pctM >= 50 ? Cl.warn : Cl.err }}>{pctM.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 10 }}><div style={S.bar(pctM, pctM >= 100 ? Cl.ok : Cl.pur)} /></div>
        </div>
        <div style={{ borderTop: `2px solid ${Cl.brd}`, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>📊 TOTAL</span>
            <span><strong style={{ fontSize: 16 }}>{fmt(realTotal)}</strong> / {fmt(objTotal)} <span style={{ fontWeight: 800, fontSize: 14, color: pctT >= 100 ? Cl.ok : pctT >= 50 ? Cl.warn : Cl.err }}>{pctT.toFixed(0)}%</span></span>
          </div>
          <div style={{ ...S.barBox, height: 12 }}><div style={S.bar(pctT, pctT >= 100 ? Cl.ok : pctT >= 50 ? Cl.warn : Cl.err)} /></div>
        </div>
      </div>
    </div>

    {/* Contribution par membre */}
    <div style={S.card}>
      <div style={S.fx}>
        <div style={S.cT}>👤 Contribution par membre</div>
        {editObj && <span style={{ fontSize: 10, color: Cl.txtL }}>Définir les objectifs individuels ↓</span>}
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
              {editObj && <td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 80, fontSize: 11 }} value={obj} onChange={e => setMemberObj(m, +e.target.value)} /></td>}
              <td style={S.tdR}>
                {obj > 0 ? (<>
                  <strong style={{ color: pct >= 100 ? Cl.ok : pct >= 50 ? Cl.warn : Cl.err }}>{pct.toFixed(0)}%</strong>
                  <div style={{ ...S.barBox, width: 60, display: "inline-block", marginLeft: 6, verticalAlign: "middle" }}><div style={S.bar(pct, pct >= 100 ? Cl.ok : pct >= 50 ? Cl.warn : Cl.err)} /></div>
                </>) : <span style={{ color: Cl.txtL, fontSize: 10 }}>Pas d'objectif</span>}
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
        <div style={{ ...S.card, border: `2px solid ${Cl.pri}`, marginBottom: 0 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: Cl.pri, marginBottom: 4 }}>🤝 PARTENARIAT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: Cl.pri }}>{fmt(caByType["Partenariat"] || 0)}</div>
            <div style={{ fontSize: 10, color: Cl.txtL, marginTop: 4 }}>{nbPartP} partenaire{nbPartP > 1 ? "s" : ""} · {nbProsP} prospect{nbProsP > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ ...S.card, border: `2px solid ${Cl.pur}`, marginBottom: 0 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: Cl.pur, marginBottom: 4 }}>💜 MÉCÉNAT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: Cl.pur }}>{fmt(caByType["Mécénat"] || 0)}</div>
            <div style={{ fontSize: 10, color: Cl.txtL, marginTop: 4 }}>{nbPartM} partenaire{nbPartM > 1 ? "s" : ""} · {nbProsM} prospect{nbProsM > 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>
      {totalCA > 0 && <div style={{ ...S.barBox, height: 12, marginTop: 10, display: "flex", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((caByType["Partenariat"] || 0) / totalCA) * 100}%`, background: Cl.pri, borderRadius: 0 }} />
        <div style={{ height: "100%", width: `${((caByType["Mécénat"] || 0) / totalCA) * 100}%`, background: Cl.pur, borderRadius: 0 }} />
      </div>}
    </div>

    {/* Encaissements */}
    <div style={S.card}><div style={S.cT}>🏦 Encaissements</div>
      <div style={S.g3}>
        <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.ok }}>{fmt(totalPaid)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Encaissé</div></div>
        <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.warn }}>{fmt(totalDue - totalPaid)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Reste</div></div>
        <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.txtL }}>{fmt(totalDue)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Total TTC</div></div>
      </div>
      {totalDue > 0 && <div style={S.barBox}><div style={S.bar((totalPaid / totalDue) * 100, Cl.ok)} /></div>}
    </div>
  </>);
}
