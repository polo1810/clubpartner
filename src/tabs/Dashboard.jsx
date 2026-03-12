import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, isSigned } from '../data/initialData';

export default function Dashboard() {
  const { prospectsList, partnersList, allActions, todayStr, totalCA, totalPaid, contracts, contractTTC } = useApp();
  const totalDue = contracts.filter(c => isSigned(c)).reduce((t, c) => t + contractTTC(c), 0);
  return (<>
    <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🎯</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.pri }}>{prospectsList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Prospects</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>🤝</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{partnersList.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Partenaires</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>📋</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.warn }}>{allActions.filter(a => a.date === todayStr && !a.done).length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Actions aujourd'hui</div></div>
      <div style={S.stat}><div style={{ fontSize: 18 }}>💰</div><div style={{ fontSize: 24, fontWeight: 800, color: Cl.ok }}>{fmt(totalCA)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CA HT</div></div>
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
