import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, statusBType, isSigned } from '../data/initialData';
import { Badge, Modal, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';

export default function PartnersTab({ onOpenContract }) {
  const { partnersList, companies, setCompanies, seasons, currentSeason, companyContracts, setSeasonStatus, hasContractForSeason } = useApp();
  const [sectorF, setSectorF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showBulkRepass, setShowBulkRepass] = useState(false);
  const [bulkSeason, setBulkSeason] = useState("");

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

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(c => c.id));

  // Filter: only partners WITHOUT a contract for the target season
  const canRepass = (coId, sid) => !hasContractForSeason(companies.find(c => c.id === coId), sid);

  const doBulkRepass = () => {
    if (!bulkSeason) return;
    let count = 0;
    selected.forEach(id => {
      if (canRepass(id, bulkSeason)) {
        setSeasonStatus(id, bulkSeason, "prospect");
        count++;
      }
    });
    setSelected([]);
    setShowBulkRepass(false);
    setBulkSeason("");
  };

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>🤝 Partenaires ({filtered.length})</h2>
      {selected.length > 0 && <button style={{ ...S.btn("ghost"), color: Cl.warn, fontSize: 12 }} onClick={() => setShowBulkRepass(true)}>↩️ Repasser {selected.length} en prospect</button>}
    </div>
    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
      <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="🔍 Rechercher entreprise, contact, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...S.sel, width: "auto" }} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
      <select style={{ ...S.sel, width: "auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>

    {/* Select all */}
    {filtered.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: Cl.txtL, display: "flex", alignItems: "center", gap: 6 }}>
      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
      <span style={{ cursor: "pointer" }} onClick={toggleAll}>{allSelected ? "Tout désélectionner" : "Tout sélectionner"}</span>
      {selected.length > 0 && <span style={{ fontWeight: 700, color: Cl.pri }}>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>}
    </div>}

    <div style={{ marginTop: 8 }}>{filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucun partenaire trouvé</div> : filtered.map(co => {
      const myC = companyContracts(co.id);
      const hasSigned = myC.some(c => isSigned(c));
      const isSelected = selected.includes(co.id);
      return (
        <div key={co.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${Cl.ok}`, background: isSelected ? Cl.okL : undefined }} onClick={() => setViewCo(co)}>
          <div style={S.fx}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <input type="checkbox" checked={isSelected} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(co.id)} />
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
            <span style={{ fontWeight: 700, color: Cl.pri }}>{fmt(((co.seasonProducts?.[currentSeason]) || co.products || []).reduce((t, cp) => t + lineHT(cp), 0))} HT</span>
          </div>
        </div>
      );
    })}</div>

    {showForm && <CompanyForm data={editCo} onSave={saveCo} onClose={() => { setShowForm(false); setEditCo(null); }} />}
    {viewCo && <CompanyDetail company={companies.find(c => c.id === viewCo.id) || viewCo} onClose={() => setViewCo(null)} onOpenContract={onOpenContract} />}

    {/* Bulk repass modal */}
    {showBulkRepass && <Modal title={`↩️ Repasser ${selected.length} partenaire${selected.length > 1 ? "s" : ""} en prospect`} onClose={() => setShowBulkRepass(false)}>
      <p style={{ fontSize: 13, marginBottom: 10 }}>Pour quelle saison voulez-vous les repasser en prospect ?</p>
      <select style={S.sel} value={bulkSeason} onChange={e => setBulkSeason(e.target.value)}>
        <option value="">-- Choisir la saison --</option>
        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {bulkSeason && (() => {
        const blocked = selected.filter(id => !canRepass(id, bulkSeason));
        const ok = selected.filter(id => canRepass(id, bulkSeason));
        return <div style={{ marginTop: 10, fontSize: 12 }}>
          {ok.length > 0 && <div style={{ color: Cl.ok, marginBottom: 4 }}>✅ {ok.length} partenaire{ok.length > 1 ? "s" : ""} sera{ok.length > 1 ? "ont" : ""} repassé{ok.length > 1 ? "s" : ""} en prospect</div>}
          {blocked.length > 0 && <div style={{ color: Cl.err }}>⚠️ {blocked.length} ignoré{blocked.length > 1 ? "s" : ""} (contrat en cours sur {bulkSeason})</div>}
        </div>;
      })()}
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowBulkRepass(false)}>Annuler</button>
        <button style={{ ...S.btn("primary"), background: Cl.warn }} disabled={!bulkSeason || selected.filter(id => canRepass(id, bulkSeason)).length === 0} onClick={doBulkRepass}>Confirmer</button>
      </div>
    </Modal>}
  </>);
}
