import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, isSigned, uid, ACTION_TYPES } from '../data/initialData';

export default function Dashboard() {
  const { prospectsList, partnersList, allActions, todayStr, totalCA, totalPaid, contracts, setContracts, contractTTC, caByType, caByMember, members, addMember, objectives, setObjectives, currentSeason, companies, setCompanies, setInvoices, setMiniForm } = useApp();
  const [editObj, setEditObj] = useState(false);
  const [justDone, setJustDone] = useState({});
  // justDone[id] = "celebrate" | "fadeout"
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
    <style>{`
      @keyframes celebPop { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.4) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
      @keyframes celebSlide { 0% { transform: translateX(-8px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
    `}</style>
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
      const totalCount = lateActions.length + shown.length;

      const toggleAction = (a) => {
        // Phase 1 : célébration (0.8s)
        setJustDone(prev => ({ ...prev, [a.id]: "celebrate" }));
        // Phase 2 : fondu (après 0.8s, dure 0.5s)
        setTimeout(() => setJustDone(prev => ({ ...prev, [a.id]: "fadeout" })), 800);
        // Phase 3 : vraiment coché (après 1.3s)
        setTimeout(() => {
          if (a.invoiceId) setInvoices(is => is.map(i => i.id === a.invoiceId ? { ...i, actions: i.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : i));
          else if (a.contractId) setContracts(cs => cs.map(c => c.id === a.contractId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : c));
          else setCompanies(cs => cs.map(c => c.id === a.companyId ? { ...c, actions: c.actions.map(x => x.id === a.id ? { ...x, done: true } : x) } : c));
          setJustDone(prev => { const n = { ...prev }; delete n[a.id]; return n; });
        }, 1300);
      };

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

      const catColors = { Prospection: [Cl.pri, Cl.priL], Partenariat: [Cl.ok, Cl.okL], "Mise en place": [Cl.pur, Cl.purL], Contrat: [Cl.warn, Cl.warnL], Facturation: [Cl.err, Cl.errL] };

      const ActionRow = ({ a }) => {
        const phase = justDone[a.id]; // "celebrate" | "fadeout" | undefined
        const celebrating = phase === "celebrate";
        const fading = phase === "fadeout";
        const [cc, cbg] = catColors[a.category] || [Cl.txtL, Cl.hov];
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 3,
            borderRadius: 6, fontSize: 13,
            borderLeft: celebrating ? `3px solid ${Cl.ok}` : "3px solid transparent",
            background: celebrating ? Cl.okL : "transparent",
            opacity: fading ? 0 : 1,
            maxHeight: fading ? 0 : 50,
            padding: fading ? "0 10px" : "8px 10px",
            overflow: "hidden",
            transition: celebrating ? "all 0.3s ease" : "all 0.5s ease",
          }}>
            <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
              <input type="checkbox" checked={!!phase} style={{ cursor: "pointer", width: 18, height: 18, accentColor: Cl.ok }} onChange={() => !phase && toggleAction(a)} />
              {celebrating && <span style={{ position: "absolute", top: -2, left: -1, fontSize: 20, pointerEvents: "none", animation: "celebPop 0.4s ease forwards" }}>✓</span>}
            </div>
            <span style={{ ...S.badge(a.date < todayStr ? Cl.err : a.date === todayStr ? Cl.warn : Cl.txtL, a.date < todayStr ? Cl.errL : a.date === todayStr ? Cl.warnL : Cl.hov) }}>{a.date}</span>
            <span style={{ ...S.badge(cc, cbg) }}>{a.category}</span>
            <strong style={{ flex: 1 }}>{a.type}</strong>
            <span style={{ color: Cl.txtL }}>{a.companyName}</span>
            {celebrating && <span style={{ fontSize: 11, fontWeight: 600, color: Cl.ok, animation: "celebSlide 0.3s ease forwards", whiteSpace: "nowrap" }}>Fait !</span>}
            {a.assignee && !celebrating && <span style={{ ...S.badge(Cl.pri, Cl.priL) }}>{a.assignee}</span>}
          </div>
        );
      };

      return <div style={S.card}>
        <div style={S.fx}>
          <div style={S.cT}>📋 Actions ({totalCount})</div>
          <button style={S.btn("primary")} onClick={addAction}>+ Action</button>
        </div>
        {totalCount === 0 && <div style={{ color: Cl.txtL, fontSize: 13, padding: "8px 0" }}>Aucune action à venir</div>}
        {lateActions.length > 0 && <>
          <div style={{ fontSize: 12, fontWeight: 600, color: Cl.err, marginTop: 4, marginBottom: 4 }}>⚠️ En retard ({lateActions.length})</div>
          {lateActions.map((a, i) => <ActionRow key={`l${i}`} a={a} />)}
        </>}
        {shown.length > 0 && <>
          {lateActions.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: Cl.txtL, marginTop: 12, marginBottom: 4 }}>{todayActions.length > 0 ? "Aujourd'hui" : "À venir"}</div>}
          {shown.map((a, i) => <ActionRow key={`s${i}`} a={a} />)}
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
