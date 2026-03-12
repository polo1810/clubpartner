import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, statusBType, P_STATUSES, PARTNER_STATUSES } from '../data/initialData';
import { Badge, Modal, Field, MemberSelect, ProductPicker, PhoneLink, EmailLink } from './index';

export function CompanyForm({ data, onSave, onClose }) {
  const { products, members, addMember, seasons, cats, currentSeason, stockSold } = useApp();
  const isP = data?.isPartner;
  const [f, setF] = useState(data || { company: "", sector: "", contact: "", phone: "", email: "", address: "", siret: "", tvaNumber: "", season: currentSeason, isPartner: false, prospectStatus: "Nouveau", partnerStatus: "", callbackDate: "", rdvDate: "", member: members[0], products: [] });
  const [selP, setSelP] = useState(data?.products || []);
  const set = (k, v) => setF({ ...f, [k]: v });
  const togP = (id) => { const pr = products.find(x => x.id === id); const p = (pr?.prices?.[currentSeason]?.price) || 0; setSelP(s => s.find(x => x.productId === id) ? s.filter(x => x.productId !== id) : [...s, { productId: id, qty: 1, unitPrice: p }]); };
  return (
    <Modal title={data ? `Modifier — ${data.company}` : "Nouvelle entreprise"} onClose={onClose}>
      <div style={S.g2}>
        <Field label="Entreprise *"><input style={S.inp} value={f.company} onChange={e => set("company", e.target.value)} /></Field>
        <Field label="Secteur"><input style={S.inp} value={f.sector} onChange={e => set("sector", e.target.value)} /></Field>
        <Field label="Contact"><input style={S.inp} value={f.contact} onChange={e => set("contact", e.target.value)} /></Field>
        <Field label="Téléphone"><input style={S.inp} value={f.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input style={S.inp} value={f.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Adresse"><input style={S.inp} value={f.address} onChange={e => set("address", e.target.value)} /></Field>
        <Field label="SIRET"><input style={S.inp} value={f.siret || ""} onChange={e => set("siret", e.target.value)} placeholder="Optionnel" /></Field>
        <Field label="N° TVA"><input style={S.inp} value={f.tvaNumber || ""} onChange={e => set("tvaNumber", e.target.value)} placeholder="Optionnel" /></Field>
        {!isP && <Field label="Statut prospection"><select style={S.sel} value={f.prospectStatus} onChange={e => set("prospectStatus", e.target.value)}>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>}
        {isP && <Field label="Statut partenaire"><select style={S.sel} value={f.partnerStatus} onChange={e => set("partnerStatus", e.target.value)}>{PARTNER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>}
        {f.prospectStatus === "À rappeler" && <Field label="Date rappel"><input type="date" style={S.inp} value={f.callbackDate || ""} onChange={e => set("callbackDate", e.target.value)} /></Field>}
        {f.prospectStatus === "RDV pris" && <Field label="Date RDV"><input type="date" style={S.inp} value={f.rdvDate || ""} onChange={e => set("rdvDate", e.target.value)} /></Field>}
        <Field label="Saison"><select style={S.sel} value={f.season || currentSeason} onChange={e => set("season", e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Responsable"><MemberSelect value={f.member} onChange={v => set("member", v)} members={members} onAdd={addMember} /></Field>
      </div>
      <div style={{ marginTop: 12 }}><label style={S.lbl}>{isP ? "Produits validés" : "Produits proposés"}</label>
        <ProductPicker products={products} selected={selP} onToggle={togP} cats={cats} currentSeason={currentSeason} />
      </div>
      {selP.length > 0 && <table style={{ ...S.tbl, marginTop: 8 }}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix conclu</th><th style={S.th}>Qté</th><th style={S.thR}>Total HT</th></tr></thead>
        <tbody>{selP.map(sp => { const pr = products.find(x => x.id === sp.productId); if (!pr) return null; return (
          <tr key={sp.productId}><td style={S.td}>{pr.name}</td><td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 80, fontWeight: 700 }} value={sp.unitPrice} onChange={e => setSelP(s => s.map(x => x.productId === sp.productId ? { ...x, unitPrice: Math.max(0, +e.target.value) } : x))} /></td><td style={S.td}><input type="number" min="1" style={{ ...S.inp, width: 50 }} value={sp.qty} onChange={e => setSelP(s => s.map(x => x.productId === sp.productId ? { ...x, qty: Math.max(1, +e.target.value) } : x))} /></td><td style={S.tdR}><strong>{fmt(lineHT(sp))}</strong></td></tr>
        ); })}</tbody></table>}
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={onClose}>Annuler</button>
        <button style={S.btn("primary")} onClick={() => onSave({ ...f, products: selP })}>Enregistrer</button>
      </div>
    </Modal>
  );
}

export function CompanyDetail({ company, onClose, onOpenContract }) {
  const { companies, setCompanies, products, todayStr, convertToPartner, openAddAction, companyContracts } = useApp();
  const [co, setCo_] = useState(company);
  const [noteText, setNoteText] = useState("");
  const setCo = (u) => { setCo_(u); setCompanies(cs => cs.map(x => x.id === u.id ? u : x)); };
  const myContracts = companyContracts(co.id);
  const lastNote = (co.notes || []).sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <Modal title={co.company} onClose={onClose}>
      <div style={S.g2}>
        <div><span style={S.lbl}>Contact</span><strong>{co.contact}</strong></div>
        <div><span style={S.lbl}>Secteur</span>{co.sector}</div>
        <div><span style={S.lbl}>Téléphone</span><PhoneLink phone={co.phone} /></div>
        <div><span style={S.lbl}>Email</span><EmailLink email={co.email} /></div>
        <div><span style={S.lbl}>Responsable</span><strong>{co.member}</strong></div>
        <div><span style={S.lbl}>Saison</span><Badge type="draft">{co.season}</Badge></div>
        {co.siret && <div><span style={S.lbl}>SIRET</span>{co.siret}</div>}
        <div><span style={S.lbl}>Dernier contact</span>{lastNote?.date || "—"}</div>
        <div><span style={S.lbl}>Statut</span><Badge type={statusBType(co.isPartner ? co.partnerStatus : co.prospectStatus)}>{co.isPartner ? co.partnerStatus : co.prospectStatus}</Badge></div>
      </div>

      {!co.isPartner && <div style={S.section}>
        <div style={S.sectionTitle}>Statut prospection</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{P_STATUSES.map(s => (
          <button key={s} onClick={() => setCo({ ...co, prospectStatus: s })} style={{ ...S.chip(co.prospectStatus === s), fontWeight: co.prospectStatus === s ? 700 : 400 }}>{s}</button>
        ))}</div>
        {co.prospectStatus === "À rappeler" && <div style={{ marginTop: 6 }}><span style={S.lbl}>📅 Date rappel</span><input type="date" style={{ ...S.inp, width: 160 }} value={co.callbackDate || ""} onChange={e => setCo({ ...co, callbackDate: e.target.value })} /></div>}
        {co.prospectStatus === "RDV pris" && <div style={{ marginTop: 6 }}><span style={S.lbl}>📅 Date RDV</span><input type="date" style={{ ...S.inp, width: 160 }} value={co.rdvDate || ""} onChange={e => setCo({ ...co, rdvDate: e.target.value })} /></div>}
      </div>}

      <div style={{ marginTop: 12 }}>
        <div style={S.cT}>📝 Journal</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input style={{ ...S.inp, flex: 1 }} placeholder="Ajouter une note..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === "Enter" && noteText.trim() && (setCo({ ...co, notes: [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])] }), setNoteText(""))} />
          <button style={S.btn("primary")} onClick={() => { if (noteText.trim()) { setCo({ ...co, notes: [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])] }); setNoteText(""); } }}>+</button>
        </div>
        {(co.notes || []).sort((a, b) => b.date.localeCompare(a.date)).map(n => (
          <div key={n.id} style={{ padding: "5px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 12 }}><span style={{ fontWeight: 600, color: Cl.pri, marginRight: 6 }}>{n.date}</span>{n.text}</div>
        ))}
      </div>

      {(co.products || []).length > 0 && <div style={{ marginTop: 12 }}>
        <div style={S.cT}>📦 {co.isPartner ? "Produits validés" : "Produits proposés"}</div>
        {co.products.map(cp => { const pr = products.find(x => x.id === cp.productId); return pr ? <div key={cp.productId} style={{ fontSize: 12, padding: "3px 0" }}>{pr.name} × {cp.qty} — {fmt(lineHT(cp))} HT</div> : null; })}
      </div>}

      <div style={{ marginTop: 12 }}>
        <div style={{ ...S.fx }}><div style={S.cT}>📋 Actions</div><button style={S.btnS("ghost")} onClick={() => openAddAction(co.id, co.isPartner ? "Partenariat" : "Prospection")}>+</button></div>
        {(co.actions || []).map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 11, opacity: a.done ? 0.5 : 1 }}>
            <input type="checkbox" checked={a.done} onChange={() => setCo({ ...co, actions: co.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) })} />
            <Badge type={statusBType(a.category) || "draft"}>{a.category}</Badge>
            <strong>{a.type}</strong><span style={{ color: Cl.txtL }}>{a.date}</span>
            <span style={{ color: Cl.pri, fontSize: 10 }}>👤 {a.assignee}</span>
          </div>
        ))}
      </div>

      {myContracts.length > 0 && <div style={{ marginTop: 12 }}>
        <div style={S.cT}>📝 Contrats liés</div>
        {myContracts.map(con => (
          <div key={con.id} style={{ ...S.card, cursor: "pointer", padding: 10 }} onClick={() => { if (onOpenContract) onOpenContract(con); onClose(); }}>
            <Badge type={con.type === "Mécénat" ? "mecenat" : "partenariat"}>{con.type}</Badge>
            <Badge type={['Signé','Facturé','Payé'].includes(con.status) ? "signed" : "pending"}>{con.status}</Badge>
          </div>
        ))}
      </div>}

      {!co.isPartner && <div style={{ marginTop: 16, textAlign: "center" }}>
        <button style={{ ...S.btn("success"), fontSize: 14, padding: "10px 28px" }} onClick={() => { convertToPartner(co.id); onClose(); }}>✅ Convertir en partenaire</button>
      </div>}
    </Modal>
  );
}
