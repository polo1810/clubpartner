import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { statusBType, P_STATUSES, ACTION_TYPES, parseCSV, uid } from '../data/initialData';
import { Badge, Modal, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';
import ImportWizard from '../components/ImportWizard';

// --- Script renderer ---
function ScriptView({ text }) {
  if (!text) return <p style={{ color: Cl.txtL, fontSize: 13 }}>Aucun script défini — allez dans ⚙️ Paramètres pour en créer un.</p>;
  return <div style={{ fontSize: 13, lineHeight: 1.7 }}>{text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const isBullet = line.trim().startsWith("•");
    const isHeader = line.includes("<b>");
    return <div key={i} style={{ marginTop: isHeader ? 12 : 0, paddingLeft: isBullet ? 16 : 0, fontWeight: isHeader ? 700 : 400 }} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
  })}</div>;
}

// --- Call Mode Modal ---
function CallModal({ company, onClose }) {
  const { companies, setCompanies, scripts, clubInfo, currentSeason, members, addMember, todayStr } = useApp();
  const co = companies.find(c => c.id === company.id) || company;
  const type = co.dealType || "Partenariat";
  const rawScript = scripts?.[type] || "";
  const script = rawScript
    .replace(/\[contact\]/gi, co.contact || "___")
    .replace(/\[nom\]/gi, clubInfo.president || "___")
    .replace(/\[club\]/gi, clubInfo.name || "___")
    .replace(/\[saison\]/gi, currentSeason);

  const [noteText, setNoteText] = useState("");
  const [newStatus, setNewStatus] = useState(co.prospectStatus);
  const [callbackDate, setCallbackDate] = useState(co.callbackDate || "");
  const [rdvDate, setRdvDate] = useState(co.rdvDate || "");
  const [actionType, setActionType] = useState("");
  const [actionDate, setActionDate] = useState(todayStr);
  const [actionAssignee, setActionAssignee] = useState(co.member || members[0]);
  const [saved, setSaved] = useState(false);

  const phone = (co.phone || "").replace(/\s/g, "");

  const saveCallResult = () => {
    const updates = { prospectStatus: newStatus };
    if (newStatus === "À rappeler") updates.callbackDate = callbackDate;
    if (newStatus === "RDV pris") updates.rdvDate = rdvDate;
    if (noteText.trim()) {
      updates.notes = [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])];
    }
    if (actionType.trim()) {
      updates.actions = [...(co.actions || []), { id: uid(), type: actionType, category: "Prospection", date: actionDate, done: false, note: "", assignee: actionAssignee }];
    }
    setCompanies(cs => cs.map(c => c.id === co.id ? { ...c, ...updates } : c));
    setSaved(true);
  };

  return (
    <div style={{ ...S.modal, zIndex: 1100 }} onClick={onClose}>
      <div style={{ ...S.modalC, maxWidth: 900, width: "95%" }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.fx, marginBottom: 12 }}>
          <h2 style={S.pageH}>📞 Appel — {co.company}</h2>
          <button onClick={onClose} style={{ ...S.btnS("ghost"), fontSize: 18 }}>✕</button>
        </div>

        <div style={S.callSplit}>
          {/* LEFT: Prospect info */}
          <div style={S.callCol}>
            <div style={{ ...S.card, border: `2px solid ${Cl.pri}`, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{co.company}</div>
              <div style={{ fontSize: 13, color: Cl.txtL }}>{co.sector}</div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 14 }}>👤 <strong>{co.contact}</strong></div>
                <a href={`tel:${phone}`} style={S.callPhone}>
                  📞 {phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}
                </a>
                {co.email && <div style={{ marginTop: 8 }}><EmailLink email={co.email} /></div>}
                {(co.adresseRue || co.address) && <div style={{ fontSize: 12, color: Cl.txtL, marginTop: 6 }}>📍 {co.adresseNum ? co.adresseNum + " " : ""}{co.adresseRue || co.address}{co.adresseCP ? ", " + co.adresseCP : ""}{co.adresseCommune ? " " + co.adresseCommune : ""}</div>}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge type={statusBType(co.prospectStatus)}>{co.prospectStatus}</Badge>
                <Badge type={type === "Mécénat" ? "mecenat" : "partenariat"}>{type}</Badge>
                <span style={{ fontSize: 11, color: Cl.txtL }}>👷 {co.member}</span>
              </div>
            </div>

            {/* Previous notes */}
            <div style={{ ...S.cT, fontSize: 13 }}>📝 Historique ({(co.notes || []).length})</div>
            <div style={S.noteList}>
              {(co.notes || []).length === 0 ? <p style={{ fontSize: 12, color: Cl.txtL }}>Aucune note</p>
              : (co.notes || []).sort((a, b) => b.date.localeCompare(a.date)).map(n => (
                <div key={n.id} style={S.noteItem}>
                  <span style={S.noteDate}>{n.date}</span>{n.text}
                </div>
              ))}
            </div>

            {/* Post-call actions */}
            <div style={S.callResult(saved)}>
              <div style={{ ...S.cT, fontSize: 13 }}>{saved ? "✅ Résultat enregistré" : "✍️ Résultat de l'appel"}</div>
              <textarea style={{ ...S.inp, minHeight: 50, resize: "vertical", fontSize: 13 }} placeholder="Notes de l'appel..." value={noteText} onChange={e => setNoteText(e.target.value)} disabled={saved} />
              <div style={{ ...S.g2, marginTop: 8 }}>
                <div><label style={S.lbl}>Nouveau statut</label><select style={S.sel} value={newStatus} onChange={e => setNewStatus(e.target.value)} disabled={saved}>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                {newStatus === "À rappeler" && <div><label style={S.lbl}>Date rappel</label><input type="date" style={S.inp} value={callbackDate} onChange={e => setCallbackDate(e.target.value)} disabled={saved} /></div>}
                {newStatus === "RDV pris" && <div><label style={S.lbl}>Date RDV</label><input type="date" style={S.inp} value={rdvDate} onChange={e => setRdvDate(e.target.value)} disabled={saved} /></div>}
              </div>
              <div style={{ marginTop: 10, padding: 8, background: Cl.wh, borderRadius: 8, border: `1px solid ${Cl.brd}` }}>
                <label style={S.lbl}>➕ Programmer une action (optionnel)</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  <input style={{ ...S.inp, flex: 1 }} placeholder="Ex: Envoyer plaquette" value={actionType} onChange={e => setActionType(e.target.value)} disabled={saved} />
                  <input type="date" style={{ ...S.inp, width: 140 }} value={actionDate} onChange={e => setActionDate(e.target.value)} disabled={saved} />
                </div>
              </div>
              {!saved && <button style={{ ...S.btn("primary"), width: "100%", marginTop: 10 }} onClick={saveCallResult}>💾 Enregistrer le résultat</button>}
              {saved && <button style={{ ...S.btn("ghost"), width: "100%", marginTop: 8 }} onClick={onClose}>Fermer</button>}
            </div>
          </div>

          {/* RIGHT: Script */}
          <div style={S.callScript}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: type === "Mécénat" ? Cl.pur : Cl.pri }}>
              {type === "Mécénat" ? "💜" : "🤝"} Script {type}
            </div>
            <ScriptView text={script} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Tab ---
export default function ProspectsTab() {
  const { prospectsList, companies, setCompanies, seasons, currentSeason, members, convertToPartner, setMiniForm } = useApp();
  const [sectorF, setSectorF] = useState("Tous");
  const [statusF, setStatusF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);
  const [callCo, setCallCo] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState([]);

  const sectors = [...new Set(prospectsList.map(p => p.sector).filter(Boolean))];
  let filtered = prospectsList;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => (p.company || "").toLowerCase().includes(q) || (p.contact || "").toLowerCase().includes(q) || (p.member || "").toLowerCase().includes(q)); }
  if (sectorF !== "Tous") filtered = filtered.filter(p => p.sector === sectorF);
  if (statusF !== "Tous") filtered = filtered.filter(p => p.prospectStatus === statusF);
  if (typeF !== "Tous") filtered = filtered.filter(p => (p.dealType || "Partenariat") === typeF);

  const saveCo = (d) => {
    if (editCo) setCompanies(cs => cs.map(c => c.id === editCo.id ? { ...c, ...d } : c));
    else setCompanies(cs => [...cs, { ...d, id: uid(), actions: [], notes: [] }]);
    setShowForm(false); setEditCo(null);
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(c => c.id));

  const [confirmDel, setConfirmDel] = useState(null);
  const deleteSelected = () => setConfirmDel({ ids: [...selected], label: `${selected.length} prospect(s)` });
  const doDelete = () => { setCompanies(cs => cs.filter(c => !confirmDel.ids.includes(c.id))); setSelected(s => s.filter(x => !confirmDel.ids.includes(x))); setConfirmDel(null); };

  const bulkEdit = () => {
    setMiniForm({ title: `Modifier ${selected.length} prospect(s)`, fields: [
      { key: "prospectStatus", label: "Statut (vide = ne pas changer)", value: "", type: "select", options: ["", ...P_STATUSES] },
      { key: "member", label: "Responsable (vide = ne pas changer)", value: "", type: "select", options: ["", ...members] },
      { key: "dealType", label: "Type (vide = ne pas changer)", value: "", type: "select", options: ["", "Partenariat", "Mécénat"] },
    ], onSave: (v) => {
      setCompanies(cs => cs.map(c => {
        if (!selected.includes(c.id)) return c;
        const u = { ...c };
        if (v.prospectStatus) u.prospectStatus = v.prospectStatus;
        if (v.member) u.member = v.member;
        if (v.dealType) u.dealType = v.dealType;
        return u;
      }));
      setSelected([]); setMiniForm(null);
    }});
  };

  return (<>
    <div style={S.fx}><h2 style={S.pageH}>Prospects ({filtered.length})</h2>
      <div style={S.coActions}>
        {selected.length > 0 && <>
          <button style={{ ...S.btn("ghost"), color: Cl.warn, fontSize: 13 }} onClick={bulkEdit}>✏️ Modifier {selected.length}</button>
          <button style={{ ...S.btn("ghost"), color: Cl.err, fontSize: 13 }} onClick={deleteSelected}>🗑 Supprimer {selected.length}</button>
        </>}
        <button style={S.btn("ghost")} onClick={() => setShowImport(true)}>📥 Import</button>
        <button style={S.btn("primary")} onClick={() => { setEditCo(null); setShowForm(true); }}>+ Prospect</button>
      </div>
    </div>
    <div style={S.filterBar}>
      <input style={S.filterInp} placeholder="🔍 Rechercher entreprise, contact, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={S.filterSel} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
      <select style={S.filterSel} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      <select style={S.filterSel} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>

    {filtered.length > 0 && <div style={S.selAll}>
      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
      <span style={{ cursor: "pointer" }} onClick={toggleAll}>{allSelected ? "Tout désélectionner" : "Tout sélectionner"}</span>
      {selected.length > 0 && <span style={S.selCount}>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>}
    </div>}

    <div style={{ marginTop: 10 }}>{filtered.length === 0 ? <div style={S.empty}>Aucun prospect trouvé</div> : filtered.map(co => {
      const bc = co.prospectStatus === "Intéressé" ? Cl.ok : co.prospectStatus === "RDV pris" ? Cl.pur : co.prospectStatus === "Refusé" ? Cl.err : co.prospectStatus === "À rappeler" ? Cl.warn : Cl.brd;
      const isSelected = selected.includes(co.id);
      // Bouton contextuel : change selon le statut
      const ctxBtn = co.prospectStatus === "Intéressé"
        ? <button style={S.btnConvert} onClick={(e) => { e.stopPropagation(); convertToPartner(co.id); }}>Convertir</button>
        : co.prospectStatus === "RDV pris"
        ? <button style={{ ...S.btnS("primary") }} onClick={(e) => { e.stopPropagation(); setViewCo(co); }}>Voir fiche</button>
        : <button style={S.btnCall} onClick={(e) => { e.stopPropagation(); setCallCo(co); }}>Appeler</button>;
      return (
      <div key={co.id} style={{ ...S.coCard(bc), background: isSelected ? Cl.priL : undefined }} onClick={() => setViewCo(co)}>
        <div style={S.fx}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isSelected} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(co.id)} />
            <div>
              <div style={S.coName}>{co.company}</div>
              <div style={S.coSub}>{co.contact}{co.phone ? ` · ${co.phone}` : ""}{co.sector ? ` · ${co.sector}` : ""}</div>
            </div>
          </div>
          <div style={S.coRight}>
            <Badge type={statusBType(co.prospectStatus)}>{co.prospectStatus}</Badge>
            {ctxBtn}
          </div>
        </div>
      </div>
    );})}</div>
    {showForm && <CompanyForm data={editCo} onSave={saveCo} onClose={() => { setShowForm(false); setEditCo(null); }} />}
    {viewCo && <CompanyDetail company={companies.find(c => c.id === viewCo.id) || viewCo} onClose={() => setViewCo(null)} />}
    {callCo && <CallModal company={callCo} onClose={() => setCallCo(null)} />}
    {showImport && <ImportWizard defaultType="prospects" onClose={() => setShowImport(false)} />}
    {confirmDel && <Modal title="🗑 Confirmer la suppression" onClose={() => setConfirmDel(null)}>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Êtes-vous sûr de vouloir supprimer <strong>{confirmDel.label}</strong> ? Cette action est irréversible.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setConfirmDel(null)}>Annuler</button>
        <button style={{ ...S.btn("primary"), background: Cl.err }} onClick={doDelete}>Supprimer</button>
      </div>
    </Modal>}
  </>);
}
