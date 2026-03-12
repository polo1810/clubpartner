import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { statusBType, P_STATUSES, parseCSV, uid } from '../data/initialData';
import { Badge, Modal, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';

export default function ProspectsTab() {
  const { prospectsList, companies, setCompanies, seasons, currentSeason, members, convertToPartner } = useApp();
  const [seasonF, setSeasonF] = useState(currentSeason);
  const [sectorF, setSectorF] = useState("Tous");
  const [statusF, setStatusF] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const sectors = [...new Set(prospectsList.map(p => p.sector).filter(Boolean))];
  let filtered = prospectsList;
  if (seasonF !== "Toutes") filtered = filtered.filter(p => p.season === seasonF);
  if (sectorF !== "Tous") filtered = filtered.filter(p => p.sector === sectorF);
  if (statusF !== "Tous") filtered = filtered.filter(p => p.prospectStatus === statusF);

  const saveCo = (d) => {
    if (editCo) setCompanies(cs => cs.map(c => c.id === editCo.id ? { ...c, ...d } : c));
    else setCompanies(cs => [...cs, { ...d, id: uid(), actions: [], notes: [] }]);
    setShowForm(false); setEditCo(null);
  };

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>🎯 Prospects ({filtered.length})</h2>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <select style={{ ...S.sel, width: "auto", fontWeight: 700 }} value={seasonF} onChange={e => setSeasonF(e.target.value)}><option value="Toutes">Toutes</option>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>
        <select style={{ ...S.sel, width: "auto" }} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
        <select style={{ ...S.sel, width: "auto" }} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <button style={S.btn("ghost")} onClick={() => setShowImport(true)}>📥</button>
        <button style={S.btn("primary")} onClick={() => { setEditCo(null); setShowForm(true); }}>+ Prospect</button>
      </div>
    </div>
    <div style={{ marginTop: 8 }}>{filtered.map(co => (
      <div key={co.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${co.prospectStatus === "Intéressé" ? Cl.ok : co.prospectStatus === "RDV pris" ? Cl.pur : co.prospectStatus === "Refusé" ? Cl.err : co.prospectStatus === "À rappeler" ? Cl.warn : Cl.brd}` }} onClick={() => setViewCo(co)}>
        <div style={S.fx}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13 }}>{co.company}</strong><span style={{ color: Cl.txtL, fontSize: 11 }}>{co.sector}</span>
            <Badge type={statusBType(co.prospectStatus)}>{co.prospectStatus}</Badge>
            <Badge type="draft">{co.season}</Badge>
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            <button style={S.btnS("ghost")} onClick={() => { setEditCo(co); setShowForm(true); }}>✏️</button>
            <button style={S.btnS("primary")} onClick={() => convertToPartner(co.id)}>→ Convertir</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, fontSize: 11 }}>
          <span>👤 {co.contact}</span><PhoneLink phone={co.phone} /><EmailLink email={co.email} /><span>👷 {co.member}</span>
        </div>
        {(co.notes || []).length > 0 && <div style={{ marginTop: 4, fontSize: 11, color: Cl.txtL, fontStyle: "italic" }}>📝 {co.notes[0]?.text?.slice(0, 60)}</div>}
      </div>
    ))}</div>
    {showForm && <CompanyForm data={editCo} onSave={saveCo} onClose={() => { setShowForm(false); setEditCo(null); }} />}
    {viewCo && <CompanyDetail company={companies.find(c => c.id === viewCo.id) || viewCo} onClose={() => setViewCo(null)} />}
    {showImport && <Modal title="📥 Import CSV" onClose={() => setShowImport(false)}><p style={{ fontSize: 12, marginBottom: 8 }}>CSV avec colonne <strong>Entreprise</strong> minimum.</p><input type="file" accept=".csv" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const data = parseCSV(ev.target.result); let count = 0; data.forEach(row => { const company = row.Entreprise || row.entreprise || row["Nom"] || ""; if (!company || companies.find(p => p.company.toLowerCase() === company.toLowerCase())) return; count++; setCompanies(cs => [...cs, { id: uid(), company, sector: row.Secteur || "", contact: row.Contact || "", phone: String(row.Téléphone || ""), email: row.Email || "", address: row.Adresse || "", siret: "", tvaNumber: "", season: currentSeason, isPartner: false, prospectStatus: "Nouveau", partnerStatus: "", callbackDate: "", rdvDate: "", member: members[0], products: [], notes: [], actions: [] }]); }); alert(`${count} importé(s)`); setShowImport(false); } catch { alert("Erreur CSV"); } }; reader.readAsText(file); e.target.value = ""; }} /></Modal>}
  </>);
}
