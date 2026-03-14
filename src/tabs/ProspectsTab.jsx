import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { statusBType, P_STATUSES, ACTION_TYPES, parseCSV, uid } from '../data/initialData';
import { Badge, Modal, PhoneLink, EmailLink } from '../components/index';
import { CompanyForm, CompanyDetail } from '../components/CompanyModals';

// --- Script renderer (simple markdown: **bold**, • bullets, newlines) ---
function ScriptView({ text }) {
  if (!text) return <p style={{ color: Cl.txtL, fontSize: 12 }}>Aucun script défini — allez dans ⚙️ Paramètres pour en créer un.</p>;
  return <div style={{ fontSize: 12, lineHeight: 1.7 }}>{text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const isBullet = line.trim().startsWith("•");
    const isHeader = line.includes("<b>");
    return <div key={i} style={{ marginTop: isHeader ? 10 : 0, paddingLeft: isBullet ? 12 : 0, fontWeight: isHeader ? 700 : 400 }} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
  })}</div>;
}

// --- Call Mode Modal ---
function CallModal({ company, onClose }) {
  const { companies, setCompanies, scripts, clubInfo, currentSeason, members, addMember, todayStr } = useApp();
  const co = companies.find(c => c.id === company.id) || company;
  const type = co.dealType || "Partenariat";
  const rawScript = scripts?.[type] || "";
  // Replace placeholders
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
    // Add note
    if (noteText.trim()) {
      updates.notes = [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])];
    }
    // Add action if filled
    if (actionType.trim()) {
      updates.actions = [...(co.actions || []), { id: uid(), type: actionType, category: "Prospection", date: actionDate, done: false, note: "", assignee: actionAssignee }];
    }
    setCompanies(cs => cs.map(c => c.id === co.id ? { ...c, ...updates } : c));
    setSaved(true);
  };

  const splitStyle = { display: "flex", gap: 16, flexWrap: "wrap" };
  const colStyle = { flex: 1, minWidth: 280 };

  return (
    <div style={{ ...S.modal, zIndex: 1100 }} onClick={onClose}>
      <div style={{ ...S.modalC, maxWidth: 900, width: "95%" }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.fx, marginBottom: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>📞 Appel — {co.company}</h2>
          <button onClick={onClose} style={{ ...S.btnS("ghost"), fontSize: 16 }}>✕</button>
        </div>

        <div style={splitStyle}>
          {/* LEFT: Prospect info */}
          <div style={colStyle}>
            <div style={{ ...S.card, border: `2px solid ${Cl.pri}`, marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{co.company}</div>
              <div style={{ fontSize: 12, color: Cl.txtL }}>{co.sector}</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13 }}>👤 <strong>{co.contact}</strong></div>
                {/* Big phone button */}
                <a href={`tel:${phone}`} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 16px", background: Cl.ok, color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 800, fontSize: 18 }}>
                  📞 {phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}
                </a>
                {co.email && <div style={{ marginTop: 6 }}><EmailLink email={co.email} /></div>}
                {co.address && <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>📍 {co.address}</div>}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Badge type={statusBType(co.prospectStatus)}>{co.prospectStatus}</Badge>
                <Badge type={type === "Mécénat" ? "mecenat" : "partenariat"}>{type}</Badge>
                <span style={{ fontSize: 10, color: Cl.txtL }}>👷 {co.member}</span>
              </div>
            </div>

            {/* Previous notes */}
            <div style={{ ...S.cT, fontSize: 12 }}>📝 Historique ({(co.notes || []).length})</div>
            <div style={{ maxHeight: 150, overflowY: "auto", marginTop: 4 }}>
              {(co.notes || []).length === 0 ? <p style={{ fontSize: 11, color: Cl.txtL }}>Aucune note</p>
              : (co.notes || []).sort((a, b) => b.date.localeCompare(a.date)).map(n => (
                <div key={n.id} style={{ padding: "4px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: Cl.pri, marginRight: 6 }}>{n.date}</span>{n.text}
                </div>
              ))}
            </div>

            {/* Post-call actions */}
            <div style={{ ...S.card, marginTop: 10, background: saved ? Cl.okL : Cl.hov, border: saved ? `2px solid ${Cl.ok}` : `1px solid ${Cl.brd}` }}>
              <div style={{ ...S.cT, fontSize: 12 }}>{saved ? "✅ Résultat enregistré" : "✍️ Résultat de l'appel"}</div>
              <textarea style={{ ...S.inp, minHeight: 50, resize: "vertical", fontSize: 12 }} placeholder="Notes de l'appel..." value={noteText} onChange={e => setNoteText(e.target.value)} disabled={saved} />
              <div style={{ ...S.g2, marginTop: 6 }}>
                <div><label style={{ ...S.lbl, fontSize: 10 }}>Nouveau statut</label><select style={S.sel} value={newStatus} onChange={e => setNewStatus(e.target.value)} disabled={saved}>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                {newStatus === "À rappeler" && <div><label style={{ ...S.lbl, fontSize: 10 }}>Date rappel</label><input type="date" style={S.inp} value={callbackDate} onChange={e => setCallbackDate(e.target.value)} disabled={saved} /></div>}
                {newStatus === "RDV pris" && <div><label style={{ ...S.lbl, fontSize: 10 }}>Date RDV</label><input type="date" style={S.inp} value={rdvDate} onChange={e => setRdvDate(e.target.value)} disabled={saved} /></div>}
              </div>
              <div style={{ marginTop: 8, padding: 6, background: "#fff", borderRadius: 6, border: `1px solid ${Cl.brd}` }}>
                <label style={{ ...S.lbl, fontSize: 10 }}>➕ Programmer une action (optionnel)</label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  <input style={{ ...S.inp, flex: 1 }} placeholder="Ex: Envoyer plaquette" value={actionType} onChange={e => setActionType(e.target.value)} disabled={saved} />
                  <input type="date" style={{ ...S.inp, width: 130 }} value={actionDate} onChange={e => setActionDate(e.target.value)} disabled={saved} />
                </div>
              </div>
              {!saved && <button style={{ ...S.btn("primary"), width: "100%", marginTop: 8 }} onClick={saveCallResult}>💾 Enregistrer le résultat</button>}
              {saved && <button style={{ ...S.btn("ghost"), width: "100%", marginTop: 6 }} onClick={onClose}>Fermer</button>}
            </div>
          </div>

          {/* RIGHT: Script */}
          <div style={{ ...colStyle, background: Cl.hov, borderRadius: 8, padding: 14, border: `1px solid ${Cl.brd}`, maxHeight: 600, overflowY: "auto" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: type === "Mécénat" ? Cl.pur : Cl.pri }}>
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
  const { prospectsList, companies, setCompanies, seasons, currentSeason, members, convertToPartner } = useApp();
  const [sectorF, setSectorF] = useState("Tous");
  const [statusF, setStatusF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCo, setEditCo] = useState(null);
  const [viewCo, setViewCo] = useState(null);
  const [callCo, setCallCo] = useState(null);
  const [showImport, setShowImport] = useState(false);

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

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>🎯 Prospects ({filtered.length})</h2>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button style={S.btn("ghost")} onClick={() => setShowImport(true)}>📥</button>
        <button style={S.btn("primary")} onClick={() => { setEditCo(null); setShowForm(true); }}>+ Prospect</button>
      </div>
    </div>
    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
      <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="🔍 Rechercher entreprise, contact, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...S.sel, width: "auto" }} value={sectorF} onChange={e => setSectorF(e.target.value)}><option>Tous</option>{sectors.map(s => <option key={s}>{s}</option>)}</select>
      <select style={{ ...S.sel, width: "auto" }} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      <select style={{ ...S.sel, width: "auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>
    <div style={{ marginTop: 8 }}>{filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucun prospect trouvé</div> : filtered.map(co => (
      <div key={co.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${co.prospectStatus === "Intéressé" ? Cl.ok : co.prospectStatus === "RDV pris" ? Cl.pur : co.prospectStatus === "Refusé" ? Cl.err : co.prospectStatus === "À rappeler" ? Cl.warn : Cl.brd}` }} onClick={() => setViewCo(co)}>
        <div style={S.fx}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13 }}>{co.company}</strong><span style={{ color: Cl.txtL, fontSize: 11 }}>{co.sector}</span>
            <Badge type={statusBType(co.prospectStatus)}>{co.prospectStatus}</Badge>
            <Badge type={co.dealType === "Mécénat" ? "mecenat" : "partenariat"}>{co.dealType || "Partenariat"}</Badge>
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            <button style={{ ...S.btnS("primary"), background: Cl.ok, color: "#fff" }} onClick={() => setCallCo(co)} title="Prospecter">📞</button>
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
    {callCo && <CallModal company={callCo} onClose={() => setCallCo(null)} />}
    {showImport && <Modal title="📥 Import CSV" onClose={() => setShowImport(false)}><p style={{ fontSize: 12, marginBottom: 8 }}>CSV avec colonne <strong>Entreprise</strong> minimum.</p><input type="file" accept=".csv" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const data = parseCSV(ev.target.result); let count = 0; data.forEach(row => { const company = row.Entreprise || row.entreprise || row["Nom"] || ""; if (!company || companies.find(p => p.company.toLowerCase() === company.toLowerCase())) return; count++; setCompanies(cs => [...cs, { id: uid(), company, sector: row.Secteur || "", contact: row.Contact || "", phone: String(row.Téléphone || ""), email: row.Email || "", address: row.Adresse || "", siret: "", tvaNumber: "", season: currentSeason, isPartner: false, prospectStatus: "Nouveau", partnerStatus: "", callbackDate: "", rdvDate: "", member: members[0], products: [], notes: [], actions: [] }]); }); alert(`${count} importé(s)`); setShowImport(false); } catch { alert("Erreur CSV"); } }; reader.readAsText(file); e.target.value = ""; }} /></Modal>}
  </>);
}
