import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, statusBType, isSigned } from '../data/initialData';
import { Badge, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';

export default function PartnersTab({ onOpenContract }) {
  const { partnersList, companies, setCompanies, seasons, currentSeason, companyContracts } = useApp();
  const [seasonF, setSeasonF] = useState(currentSeason);
  const [sectorF, setSectorF] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);

  const sectors = [...new Set(partnersList.map(p => p.sector).filter(Boolean))];
  let filtered = partnersList;
  if (seasonF !== "Toutes") filtered = filtered.filter(p => p.season === seasonF);
  if (sectorF !== "Tous") filtered = filtered.filter(p => p.sector === sectorF);

  const saveCo = (d) => {
    if (editCo) setCompanies(cs => cs.map(c => c.id === editCo.id ? { ...c, ...d } : c));
    else setCompanies(cs => [...cs, { ...d, id: uid(), actions: [], notes: [] }]);
    setShowForm(false); setEditCo(null);
  };

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>🤝 Partenaires ({filtered.length})</h2>
      <div style={{ display: "flex", gap: 4 }}>
        <select style={{ ...S.sel, width: "auto", fontWeight: 700 }} value={seasonF} onChange={e => setSeasonF(e.target.value)}><option value="Toutes">Toutes</option>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>
        <select style={{ ...S.sel, width: "auto" }} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
      </div>
    </div>
    <div style={{ marginTop: 8 }}>{filtered.map(co => {
      const myC = companyContracts(co.id);
      const hasSigned = myC.some(c => isSigned(c));
      return (
        <div key={co.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${Cl.ok}` }} onClick={() => setViewCo(co)}>
          <div style={S.fx}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{co.company}</strong><span style={{ color: Cl.txtL, fontSize: 11 }}>{co.sector}</span>
              <Badge type={statusBType(co.partnerStatus)}>{co.partnerStatus}</Badge>
              <Badge type={co.dealType === "Mécénat" ? "mecenat" : "partenariat"}>{co.dealType || "Partenariat"}</Badge>
              {hasSigned && <Badge type="signed">Contrat signé</Badge>}
            </div>
            <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
              <button style={S.btnS("ghost")} onClick={() => { setEditCo(co); setShowForm(true); }}>✏️</button>
              {myC.length > 0 && <button style={S.btnS("primary")} onClick={() => onOpenContract && onOpenContract(myC[0])}>📝 Contrat</button>}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, fontSize: 11 }}>
            <span>👤 {co.contact}</span><PhoneLink phone={co.phone} /><EmailLink email={co.email} />
            <span style={{ fontWeight: 700, color: Cl.pri }}>{fmt((co.products || []).reduce((t, cp) => t + lineHT(cp), 0))} HT</span>
          </div>
        </div>
      );
    })}</div>
    {showForm && <CompanyForm data={editCo} onSave={saveCo} onClose={() => { setShowForm(false); setEditCo(null); }} />}
    {viewCo && <CompanyDetail company={companies.find(c => c.id === viewCo.id) || viewCo} onClose={() => setViewCo(null)} onOpenContract={onOpenContract} />}
  </>);
}
