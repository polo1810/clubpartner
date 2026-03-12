import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, isSigned } from '../data/initialData';

export default function Dashboard() {
  const { prospectsList, partnersList, allActions, todayStr, totalCA, totalPaid, contracts, contractTTC, caByType, companies } = useApp();
  const totalDue = contracts.filter(c => isSigned(c)).reduce((t, c) => t + contractTTC(c), 0);
  const nbPartP = companies.filter(c => (c.dealType || "Partenariat") === "Partenariat" && c.isPartner).length;
  const nbPartM = companies.filter(c => c.dealType === "Mécénat" && c.isPartner).length;
  const nbProsP = companies.filter(c => (c.dealType || "Partenariat") === "Partenariat" && !c.isPartner).length;
  const nbProsM = companies.filter(c => c.dealType === "Mécénat" && !c.isPartner).length;
  return (<>
    <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🎯</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.pri }}>{prospectsList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Prospects</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🤝</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{partnersList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Partenaires</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>📋</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.warn }}>{allActions.filter(a => a.date === todayStr && !a.done).length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Actions aujourd'hui</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>💰</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{fmt(totalCA)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CA HT total</div></div>
    </div>

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
