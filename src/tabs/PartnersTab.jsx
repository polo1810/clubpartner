import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, statusBType, isSigned } from '../data/initialData';
import { Badge, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';

export default function PartnersTab({ onOpenContract }) {
  const { partnersList, companies, setCompanies, seasons, currentSeason, companyContracts } = useApp();
  const [sectorF, setSectorF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);

  const sectors = [...new Set(partnersList.map(p => p.sector).filter(Boolean))];
  let filtered = partnersList;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => (p.company || "").toLowerCase().includes(q) || (p.contact || "").toLowerCase().includes(q) || (p.member || "").toLowerCase().includes(q)); }
  if (sectorF !== "Tous") filtered = filtered.filter(p => p.sector === sectorF);
  if (typeF !== "Tous") filtered = filtered.filter(p => (p.dealType || "Partenariat") === typeF);

  const saveCo = (d) => {
    if (editCo) setCompanies(cs => cs.map(c => c.id === editCo.id ? { ...c, ...d } : c));
    else setCompanies(cs => [...cs, { ...d, id: uid(), actions: [], notes: [] }]);
    setShowForm(false); setEditCo(null);
  };

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>🤝 Partenaires ({filtered.length})</h2>
    </div>
    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
      <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="🔍 Rechercher entreprise, contact, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...S.sel, width: "auto" }} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
      <select style={{ ...S.sel, width: "auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>
    <div style={{ marginTop: 8 }}>{filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucun partenaire trouvé</div> : filtered.map(co => {
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
