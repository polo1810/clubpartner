import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { useAuth } from '../data/AuthContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, getPrice, statusBType, P_STATUSES, PARTNER_STATUSES, ACTION_TYPES, genAccountCode } from '../data/initialData';
import { Badge, Modal, Field, MemberSelect, ProductPicker, PhoneLink, EmailLink } from './index';
import { generateDevis } from '../utils/pdfGenerator';

// --- Season tabs shared component ---
function SeasonTabs({ seasonIds, active, onChange }) {
  return (
    <div style={S.seasonTabs}>
      {seasonIds.map(sid => (
        <button key={sid} style={{ ...S.btnS(active === sid ? "primary" : "ghost"), fontWeight: active === sid ? 700 : 400 }} onClick={() => onChange(sid)}>
          📅 {sid}
        </button>
      ))}
    </div>
  );
}

function getCompanySP(co, seasons) {
  if (co.seasonProducts && Object.keys(co.seasonProducts).length > 0) return co.seasonProducts;
  if ((co.products || []).length > 0) return { [co.season || seasons[0]?.id || "?"]: [...co.products] };
  return {};
}

function allSeasonsHT(sp) {
  return Object.values(sp).reduce((total, prods) => total + prods.reduce((t, cp) => t + lineHT(cp), 0), 0);
}

function hasAnyProduct(sp) {
  return Object.values(sp).some(prods => prods.length > 0);
}

export function CompanyForm({ data, onSave, onClose }) {
  const { products, members, addMember, seasons, cats, currentSeason } = useApp();
  const isP = data?.isPartner;
  const [f, setF] = useState(data || { company: "", sector: "", contact: "", phone: "", email: "", adresseNum: "", adresseRue: "", adresseCP: "", adresseCommune: "", formeJuridique: "", siret: "", tvaNumber: "", accountCode: "", season: currentSeason, isPartner: false, dealType: "Partenariat", donAmount: 0, prospectStatus: "Nouveau", partnerStatus: "", callbackDate: "", rdvDate: "", member: members[0], products: [], seasonProducts: {}, seasonDonAmounts: {} });
  const set = (k, v) => setF({ ...f, [k]: v });

  const [sp, setSp] = useState(() => {
    const existing = getCompanySP(data || {}, seasons);
    if (!existing[currentSeason]) existing[currentSeason] = [];
    return existing;
  });
  const [sda, setSda] = useState(() => {
    if (data?.seasonDonAmounts && Object.keys(data.seasonDonAmounts).length > 0) return { ...data.seasonDonAmounts };
    return { [currentSeason]: data?.donAmount || 0 };
  });
  const [activeSeason, setActiveSeason] = useState(currentSeason);
  const seasonIds = seasons.map(s => s.id);

  const togP = (id) => {
    const pr = products.find(x => x.id === id);
    const p = getPrice(pr, activeSeason).price || getPrice(pr, currentSeason).price || 0;
    const cur = sp[activeSeason] || [];
    const updated = cur.find(x => x.productId === id) ? cur.filter(x => x.productId !== id) : [...cur, { productId: id, qty: 1, unitPrice: p }];
    setSp({ ...sp, [activeSeason]: updated });
  };

  const curProds = sp[activeSeason] || [];
  const setCP = (prods) => setSp({ ...sp, [activeSeason]: prods });
  const totalHT = allSeasonsHT(sp);
  const isM = f.dealType === "Mécénat";
  const curDon = sda[activeSeason] || 0;
  const curHT = curProds.reduce((t, cp) => t + lineHT(cp), 0);
  const curRatio = isM && curDon > 0 ? (curHT / curDon) * 100 : 0;
  const totDon = Object.values(sda).reduce((t, d) => t + (d || 0), 0);
  const allRatiosOK = !isM || seasonIds.every(sid => { const d = sda[sid] || 0; const h = (sp[sid] || []).reduce((t, cp) => t + lineHT(cp), 0); return d === 0 || (h / d) * 100 <= 25; });

  const copyFrom = (fromSid) => {
    if (sp[fromSid]) setSp({ ...sp, [activeSeason]: sp[fromSid].map(p => ({ ...p })) });
    if (sda[fromSid] !== undefined) setSda({ ...sda, [activeSeason]: sda[fromSid] });
  };

  const activeSeasons = seasonIds.filter(sid => (sp[sid]?.length > 0) || (sda[sid] > 0));

  const doSave = () => {
    const cleanSP = {}; const cleanSDA = {};
    Object.entries(sp).forEach(([k, v]) => { if (v.length > 0) cleanSP[k] = v; });
    Object.entries(sda).forEach(([k, v]) => { if (v > 0) cleanSDA[k] = v; });
    const dataSeasons = seasons.map(s => s.id).filter(sid => cleanSP[sid]?.length > 0 || cleanSDA[sid] > 0);
    const autoSeason = dataSeasons[0] || f.season || currentSeason;
    onSave({ ...f, season: autoSeason, seasonProducts: cleanSP, seasonDonAmounts: cleanSDA, donAmount: totDon, products: cleanSP[currentSeason] || [] });
  };

  return (
    <Modal title={data ? `Modifier — ${data.company}` : "Nouvelle entreprise"} onClose={onClose}>
      <div style={S.g2}>
        <Field label="Entreprise *"><input style={S.inp} value={f.company} onChange={e => set("company", e.target.value)} /></Field>
        <Field label="Secteur"><input style={S.inp} value={f.sector} onChange={e => set("sector", e.target.value)} /></Field>
        <Field label="Contact"><input style={S.inp} value={f.contact} onChange={e => set("contact", e.target.value)} /></Field>
        <Field label="Téléphone"><input style={S.inp} value={f.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input style={S.inp} value={f.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Adresse N°"><input style={S.inp} value={f.adresseNum || ""} onChange={e => set("adresseNum", e.target.value)} placeholder="12" /></Field>
        <Field label="Rue"><input style={S.inp} value={f.adresseRue || ""} onChange={e => set("adresseRue", e.target.value)} placeholder="avenue du Stade" /></Field>
        <Field label="Code postal"><input style={S.inp} value={f.adresseCP || ""} onChange={e => set("adresseCP", e.target.value)} placeholder="49300" /></Field>
        <Field label="Commune"><input style={S.inp} value={f.adresseCommune || ""} onChange={e => set("adresseCommune", e.target.value)} placeholder="Cholet" /></Field>
        <Field label="Forme juridique"><input style={S.inp} value={f.formeJuridique || ""} onChange={e => set("formeJuridique", e.target.value)} placeholder="SAS, SARL, SA..." /></Field>
        <Field label="SIRET"><input style={S.inp} value={f.siret || ""} onChange={e => set("siret", e.target.value)} placeholder="Optionnel" /></Field>
        <Field label="N° TVA"><input style={S.inp} value={f.tvaNumber || ""} onChange={e => set("tvaNumber", e.target.value)} placeholder="Optionnel" /></Field>
        <Field label="Compte comptable"><input style={{ ...S.inp, fontFamily: "monospace" }} value={f.accountCode || genAccountCode(f.company)} onChange={e => set("accountCode", e.target.value)} /></Field>
        <Field label="Type"><select style={S.sel} value={f.dealType || "Partenariat"} onChange={e => set("dealType", e.target.value)}><option>Partenariat</option><option>Mécénat</option></select></Field>
        {!isP && <Field label="Statut prospection"><select style={S.sel} value={f.prospectStatus} onChange={e => set("prospectStatus", e.target.value)}>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>}
        {isP && <Field label="Statut partenaire"><select style={S.sel} value={f.partnerStatus} onChange={e => set("partnerStatus", e.target.value)}>{PARTNER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>}
        {f.prospectStatus === "À rappeler" && <Field label="Date rappel"><input type="date" style={S.inp} value={f.callbackDate || ""} onChange={e => set("callbackDate", e.target.value)} /></Field>}
        {f.prospectStatus === "RDV pris" && <Field label="Date RDV"><input type="date" style={S.inp} value={f.rdvDate || ""} onChange={e => set("rdvDate", e.target.value)} /></Field>}
        <Field label="Saison(s)">{activeSeasons.length > 0 ? <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{activeSeasons.map(s => <Badge key={s} type="new">{s}</Badge>)}</div> : <select style={S.sel} value={f.season || currentSeason} onChange={e => set("season", e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select>}{activeSeasons.length > 0 && <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>Auto-détecté depuis les produits/dons saisis</div>}</Field>
        <Field label="Responsable"><MemberSelect value={f.member} onChange={v => set("member", v)} members={members} onAdd={addMember} /></Field>
      </div>

      {/* Products per season */}
      <div style={{ marginTop: 14 }}>
        <label style={S.lbl}>{isP ? "Produits validés" : "Produits proposés"}{isM ? " (contreparties)" : ""} — par saison</label>
        <SeasonTabs seasonIds={seasonIds} active={activeSeason} onChange={(sid) => { if (!sp[sid]) setSp({ ...sp, [sid]: [] }); setActiveSeason(sid); }} />
        {Object.keys(sp).length > 1 && <div style={{ marginBottom: 8, fontSize: 11, color: Cl.txtL }}>
          Copier depuis : {seasonIds.filter(s => s !== activeSeason && (sp[s]?.length > 0 || sda[s] > 0)).map(s => (
            <button key={s} style={{ ...S.btnS("ghost"), fontSize: 11, padding: "2px 8px" }} onClick={() => copyFrom(s)}>📋 {s}</button>
          ))}
        </div>}
        {isM && <div style={{ marginBottom: 10, padding: 10, background: Cl.purL, borderRadius: 10, border: `1px solid ${Cl.pur}` }}>
          <label style={{ ...S.lbl, color: Cl.pur }}>💜 Montant du don — {activeSeason}</label>
          <input type="number" style={S.mecInp} value={sda[activeSeason] || 0} onChange={e => setSda({ ...sda, [activeSeason]: Math.max(0, +e.target.value) })} />
          {curDon > 0 && curHT > 0 && <div style={S.alert(curRatio <= 25 ? "success" : "danger")}>{curRatio <= 25 ? `✅ Contreparties = ${curRatio.toFixed(1)}% du don (max 25%)` : `⚠️ ${curRatio.toFixed(1)}% > 25% !`}</div>}
        </div>}
        <ProductPicker products={products} selected={curProds} onToggle={togP} cats={cats} currentSeason={activeSeason} />
      </div>

      {curProds.length > 0 && <table style={{ ...S.tbl, marginTop: 10 }}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Catalogue</th><th style={S.th}>Remise</th><th style={S.th}>Prix conclu</th><th style={S.th}>Qté</th><th style={S.thR}>Total HT</th><th style={S.th}></th></tr></thead>
        <tbody>{curProds.map(spi => { const pr = products.find(x => x.id === spi.productId); if (!pr) return null; const catPrice = getPrice(pr, activeSeason).price || getPrice(pr, currentSeason).price;
          const applyDiscount = (type, val) => {
            const v = Math.max(0, val);
            const newPrice = type === "%" ? Math.round(catPrice * (1 - v / 100)) : Math.max(0, catPrice - v);
            setCP(curProds.map(x => x.productId === spi.productId ? { ...x, unitPrice: newPrice, discountType: type, discountValue: v } : x));
          };
          const dt = spi.discountType || "%"; const dv = spi.discountValue || 0;
          const pctOff = catPrice > 0 ? Math.round((1 - spi.unitPrice / catPrice) * 100) : 0;
          return (
          <tr key={spi.productId}>
            <td style={S.td}>{pr.name}</td>
            <td style={S.td}><span style={{ color: Cl.txtL }}>{fmt(catPrice)}</span></td>
            <td style={S.td}><div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input type="number" min="0" style={S.inpW(50)} value={dv} onChange={e => applyDiscount(dt, +e.target.value)} />
              <select style={{ ...S.sel, width: 44, fontSize: 11, padding: "3px 2px" }} value={dt} onChange={e => applyDiscount(e.target.value, dv)}><option value="%">%</option><option value="€">€</option></select>
            </div></td>
            <td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 80, fontWeight: 700 }} value={spi.unitPrice} onChange={e => setCP(curProds.map(x => x.productId === spi.productId ? { ...x, unitPrice: Math.max(0, +e.target.value), discountType: "", discountValue: 0 } : x))} />{pctOff > 0 && <div style={{ fontSize: 10, color: Cl.ok }}>-{pctOff}%</div>}</td>
            <td style={S.td}><input type="number" min="1" style={S.inpW(50)} value={spi.qty} onChange={e => setCP(curProds.map(x => x.productId === spi.productId ? { ...x, qty: Math.max(1, +e.target.value) } : x))} /></td>
            <td style={S.tdR}><strong>{fmt(lineHT(spi))}</strong></td>
            <td style={S.td}><button style={S.btnS("ghost")} onClick={() => setCP(curProds.filter(x => x.productId !== spi.productId))}>✕</button></td>
          </tr>); })}</tbody></table>}
      {curProds.length > 0 && <div style={S.subTL}>Sous-total {activeSeason} : {fmt(curHT)} HT</div>}
      {isM && totDon > 0 && <div style={{ textAlign: "right", marginTop: 4, fontSize: 15, fontWeight: 700, color: Cl.pur }}>Don total : {fmt(totDon)}</div>}
      {hasAnyProduct(sp) && <div style={S.subT}>Contreparties total : {fmt(totalHT)} HT</div>}
      <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={onClose}>Annuler</button>
        <button style={{ ...S.btn("primary"), opacity: isM && !allRatiosOK ? 0.5 : 1 }} disabled={isM && !allRatiosOK} onClick={doSave}>Enregistrer</button>
      </div>
    </Modal>
  );
}

export function CompanyDetail({ company, onClose, onOpenContract }) {
  const { companies, setCompanies, products, todayStr, convertToPartner, openAddAction, companyContracts, cats, currentSeason, seasons, setMiniForm, members, addMember, clubInfo, invoices, setInvoices, contracts, setContracts, setSeasonStatus, hasContractForSeason } = useApp();
  const auth = useAuth();
  const co = companies.find(c => c.id === company.id) || company;
  const [noteText, setNoteText] = useState("");
  const [editingProducts, setEditingProducts] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showRepass, setShowRepass] = useState(false);
  const [repassSeason, setRepassSeason] = useState("");
  const setCo = (u) => { setCompanies(cs => cs.map(x => x.id === u.id ? u : x)); };
  const myContracts = companyContracts(co.id);
  const lastNote = (co.notes || []).sort((a, b) => b.date.localeCompare(a.date))[0];
  const isM = co.dealType === "Mécénat";

  const coSP = getCompanySP(co, seasons);
  const [editSP, setEditSP] = useState({ ...coSP });
  const [editSDA, setEditSDA] = useState({ ...(co.seasonDonAmounts || {}) });
  const [activeSeason, setActiveSeason] = useState(currentSeason);
  const seasonIds = seasons.map(s => s.id);

  const editProds = editSP[activeSeason] || [];
  const setEditProds = (prods) => setEditSP({ ...editSP, [activeSeason]: prods });

  const togP = (id) => {
    const pr = products.find(x => x.id === id);
    const p = getPrice(pr, activeSeason).price || getPrice(pr, currentSeason).price || 0;
    setEditProds(editProds.find(x => x.productId === id) ? editProds.filter(x => x.productId !== id) : [...editProds, { productId: id, qty: 1, unitPrice: p }]);
  };

  const saveProducts = () => {
    const cleanSP = {}; const cleanSDA = {};
    Object.entries(editSP).forEach(([k, v]) => { if (v.length > 0) cleanSP[k] = v; });
    Object.entries(editSDA).forEach(([k, v]) => { if (v > 0) cleanSDA[k] = v; });
    const newDon = Object.values(cleanSDA).reduce((t, d) => t + (d || 0), 0);
    setCo({ ...co, seasonProducts: cleanSP, seasonDonAmounts: cleanSDA, donAmount: newDon, products: cleanSP[currentSeason] || [] });
    setEditingProducts(false);
  };

  const startEdit = () => {
    setEditSP({ ...getCompanySP(co, seasons) });
    setEditSDA({ ...(co.seasonDonAmounts || {}) });
    if (!editSP[activeSeason]) setEditSP(prev => ({ ...prev, [activeSeason]: [] }));
    setEditingProducts(true);
  };

  const copyFrom = (fromSid) => {
    if (editSP[fromSid]) setEditSP({ ...editSP, [activeSeason]: editSP[fromSid].map(p => ({ ...p })) });
    if (editSDA[fromSid] !== undefined) setEditSDA({ ...editSDA, [activeSeason]: editSDA[fromSid] });
  };

  const editTotalHT = allSeasonsHT(editSP);
  const editCurHT = editProds.reduce((t, cp) => t + lineHT(cp), 0);
  const editCurDon = editSDA[activeSeason] || 0;
  const editCurRatio = isM && editCurDon > 0 ? (editCurHT / editCurDon) * 100 : 0;
  const coSDA = co.seasonDonAmounts || {};
  const totDon = Object.keys(coSDA).length > 0 ? Object.values(coSDA).reduce((t, d) => t + (d || 0), 0) : (co.donAmount || 0);

  return (
    <Modal title={co.company} onClose={onClose}>
      <div style={S.g2}>
        <div><span style={S.lbl}>Entreprise</span><input style={S.inp} value={co.company || ""} onChange={e => setCo({ ...co, company: e.target.value })} /></div>
        <div><span style={S.lbl}>Contact</span><input style={S.inp} value={co.contact || ""} onChange={e => setCo({ ...co, contact: e.target.value })} /></div>
        <div><span style={S.lbl}>Secteur</span><input style={S.inp} value={co.sector || ""} onChange={e => setCo({ ...co, sector: e.target.value })} /></div>
        <div><span style={S.lbl}>Téléphone</span><input style={S.inp} value={co.phone || ""} onChange={e => setCo({ ...co, phone: e.target.value })} /></div>
        <div><span style={S.lbl}>Email</span><input style={S.inp} value={co.email || ""} onChange={e => setCo({ ...co, email: e.target.value })} /></div>
        <div><span style={S.lbl}>Forme juridique</span><input style={S.inp} value={co.formeJuridique || ""} onChange={e => setCo({ ...co, formeJuridique: e.target.value })} placeholder="SAS, SARL..." /></div>
        <div><span style={S.lbl}>Adresse N°</span><input style={S.inp} value={co.adresseNum || ""} onChange={e => setCo({ ...co, adresseNum: e.target.value })} /></div>
        <div><span style={S.lbl}>Rue</span><input style={S.inp} value={co.adresseRue || ""} onChange={e => setCo({ ...co, adresseRue: e.target.value })} /></div>
        <div><span style={S.lbl}>Code postal</span><input style={S.inp} value={co.adresseCP || ""} onChange={e => setCo({ ...co, adresseCP: e.target.value })} /></div>
        <div><span style={S.lbl}>Commune</span><input style={S.inp} value={co.adresseCommune || ""} onChange={e => setCo({ ...co, adresseCommune: e.target.value })} /></div>
        <div><span style={S.lbl}>SIRET</span><input style={S.inp} value={co.siret || ""} onChange={e => setCo({ ...co, siret: e.target.value })} /></div>
        <div><span style={S.lbl}>N° TVA</span><input style={S.inp} value={co.tvaNumber || ""} onChange={e => setCo({ ...co, tvaNumber: e.target.value })} /></div>
        <div><span style={S.lbl}>Compte comptable</span><input style={{ ...S.inp, fontFamily: "monospace" }} value={co.accountCode || ""} onChange={e => setCo({ ...co, accountCode: e.target.value })} /></div>
        <div><span style={S.lbl}>Responsable</span><MemberSelect value={co.member} onChange={v => setCo({ ...co, member: v })} members={members} onAdd={addMember} /></div>
        <div><span style={S.lbl}>Saison(s)</span>{(() => { const as = seasons.map(s=>s.id).filter(sid => coSP[sid]?.length > 0 || (coSDA[sid] || 0) > 0); return as.length > 0 ? as.map(s => <Badge key={s} type="draft">{s}</Badge>) : <Badge type="draft">{co.season}</Badge>; })()}</div>
        <div><span style={S.lbl}>Dernier contact</span>{lastNote?.date || "—"}</div>
        <div><span style={S.lbl}>Statut</span>{co.isPartner
          ? <select style={S.sel} value={co.partnerStatus || ""} onChange={e => setCo({ ...co, partnerStatus: e.target.value })}>{PARTNER_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          : <select style={S.sel} value={co.prospectStatus || ""} onChange={e => setCo({ ...co, prospectStatus: e.target.value })}>{P_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        }</div>
      </div>

      {/* Type selector */}
      <div style={{ ...S.section, marginTop: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={S.lbl}>Type :</span>
          <button style={S.chip(!isM)} onClick={() => setCo({ ...co, dealType: "Partenariat" })}>🤝 Partenariat</button>
          <button style={S.chip(isM)} onClick={() => setCo({ ...co, dealType: "Mécénat" })}>💜 Mécénat</button>
        </div>
        {isM && totDon > 0 && <div style={{ marginTop: 8, fontSize: 12, color: Cl.pur }}>Don total : <strong>{fmt(totDon)}</strong> (modifiable depuis les onglets produits ci-dessous)</div>}
      </div>

      {!co.isPartner && <div style={S.section}>
        <div style={S.sectionTitle}>Statut prospection</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{P_STATUSES.map(s => (
          <button key={s} onClick={() => setCo({ ...co, prospectStatus: s })} style={{ ...S.chip(co.prospectStatus === s), fontWeight: co.prospectStatus === s ? 700 : 400 }}>{s}</button>
        ))}</div>
        {co.prospectStatus === "À rappeler" && <div style={{ marginTop: 8 }}><span style={S.lbl}>📅 Date rappel</span><input type="date" style={{ ...S.inp, width: 160 }} value={co.callbackDate || ""} onChange={e => setCo({ ...co, callbackDate: e.target.value })} /></div>}
        {co.prospectStatus === "RDV pris" && <div style={{ marginTop: 8 }}><span style={S.lbl}>📅 Date RDV</span><input type="date" style={{ ...S.inp, width: 160 }} value={co.rdvDate || ""} onChange={e => setCo({ ...co, rdvDate: e.target.value })} /></div>}
        <div style={{ marginTop: 12, borderTop: `1px solid ${Cl.brd}`, paddingTop: 10 }}>
          <button style={S.btnConvert} onClick={() => { convertToPartner(co.id); onClose(); }}>🤝 Convertir en partenaire</button>
        </div>
      </div>}

      <div style={{ marginTop: 14 }}>
        <div style={S.cT}>📝 Journal</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input style={{ ...S.inp, flex: 1 }} placeholder="Ajouter une note..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === "Enter" && noteText.trim() && (setCo({ ...co, notes: [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])] }), setNoteText(""))} />
          <button style={S.btn("primary")} onClick={() => { if (noteText.trim()) { setCo({ ...co, notes: [{ id: uid(), date: todayStr, text: noteText.trim() }, ...(co.notes || [])] }); setNoteText(""); } }}>+</button>
        </div>
        {(co.notes || []).sort((a, b) => b.date.localeCompare(a.date)).map(n => (
          <div key={n.id} style={S.noteItem}><span style={S.noteDate}>{n.date}</span>{n.text}</div>
        ))}
      </div>

      {/* PRODUITS */}
      <div style={{ marginTop: 14 }}>
        <div style={S.cT}>📦 {co.isPartner ? "Produits validés" : "Produits proposés"} — par saison</div>
        {!editingProducts && <div style={{ marginBottom: 12 }}><button style={{ ...S.btn("primary"), width: "100%" }} onClick={startEdit}>✏️ Modifier / Ajouter des produits</button></div>}

        <SeasonTabs seasonIds={seasonIds} active={activeSeason} onChange={(sid) => {
          if (editingProducts && !editSP[sid]) setEditSP(prev => ({ ...prev, [sid]: [] }));
          setActiveSeason(sid);
        }} />

        {editingProducts ? (<>
          {seasonIds.filter(s => s !== activeSeason && (editSP[s]?.length > 0 || editSDA[s] > 0)).length > 0 && <div style={{ marginBottom: 8, fontSize: 11, color: Cl.txtL }}>
            Copier depuis : {seasonIds.filter(s => s !== activeSeason && (editSP[s]?.length > 0 || editSDA[s] > 0)).map(s => (
              <button key={s} style={{ ...S.btnS("ghost"), fontSize: 11, padding: "2px 8px" }} onClick={() => copyFrom(s)}>📋 {s}</button>
            ))}
          </div>}
          {isM && <div style={{ marginBottom: 10, padding: 10, background: Cl.purL, borderRadius: 10, border: `1px solid ${Cl.pur}` }}>
            <label style={{ ...S.lbl, color: Cl.pur }}>💜 Montant du don — {activeSeason}</label>
            <input type="number" style={S.mecInp} value={editSDA[activeSeason] || 0} onChange={e => setEditSDA({ ...editSDA, [activeSeason]: Math.max(0, +e.target.value) })} />
            {editCurDon > 0 && editCurHT > 0 && <div style={S.alert(editCurRatio <= 25 ? "success" : "danger")}>{editCurRatio <= 25 ? `✅ Contreparties = ${editCurRatio.toFixed(1)}% du don (max 25%)` : `⚠️ ${editCurRatio.toFixed(1)}% > 25% !`}</div>}
          </div>}
          <ProductPicker products={products} selected={editProds} onToggle={togP} cats={cats} currentSeason={activeSeason} />
          {editProds.length > 0 && <table style={{ ...S.tbl, marginTop: 10 }}>
            <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Catalogue</th><th style={S.th}>Remise</th><th style={S.th}>Prix conclu</th><th style={S.th}>Qté</th><th style={S.thR}>Total HT</th><th style={S.th}></th></tr></thead>
            <tbody>{editProds.map(sp => {
              const pr = products.find(x => x.id === sp.productId);
              if (!pr) return null;
              const catPrice = getPrice(pr, activeSeason).price || getPrice(pr, currentSeason).price;
              const applyDiscount = (type, val) => {
                const v = Math.max(0, val);
                const newPrice = type === "%" ? Math.round(catPrice * (1 - v / 100)) : Math.max(0, catPrice - v);
                setEditProds(editProds.map(x => x.productId === sp.productId ? { ...x, unitPrice: newPrice, discountType: type, discountValue: v } : x));
              };
              const dt = sp.discountType || "%"; const dv = sp.discountValue || 0;
              const pctOff = catPrice > 0 ? Math.round((1 - sp.unitPrice / catPrice) * 100) : 0;
              return (
                <tr key={sp.productId}>
                  <td style={S.td}>{pr.name}</td>
                  <td style={S.td}><span style={{ color: Cl.txtL }}>{fmt(catPrice)}</span></td>
                  <td style={S.td}><div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input type="number" min="0" style={S.inpW(50)} value={dv} onChange={e => applyDiscount(dt, +e.target.value)} />
                    <select style={{ ...S.sel, width: 44, fontSize: 11, padding: "3px 2px" }} value={dt} onChange={e => applyDiscount(e.target.value, dv)}><option value="%">%</option><option value="€">€</option></select>
                  </div></td>
                  <td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 80, fontWeight: 700 }} value={sp.unitPrice} onChange={e => setEditProds(editProds.map(x => x.productId === sp.productId ? { ...x, unitPrice: Math.max(0, +e.target.value), discountType: "", discountValue: 0 } : x))} />{pctOff > 0 && <div style={{ fontSize: 10, color: Cl.ok }}>-{pctOff}%</div>}</td>
                  <td style={S.td}><input type="number" min="1" style={S.inpW(50)} value={sp.qty} onChange={e => setEditProds(editProds.map(x => x.productId === sp.productId ? { ...x, qty: Math.max(1, +e.target.value) } : x))} /></td>
                  <td style={S.tdR}><strong>{fmt(lineHT(sp))}</strong></td>
                  <td style={S.td}><button style={S.btnS("ghost")} onClick={() => setEditProds(editProds.filter(x => x.productId !== sp.productId))}>✕</button></td>
                </tr>
              );
            })}</tbody>
          </table>}
          {editProds.length > 0 && <div style={S.subTL}>Sous-total {activeSeason} : {fmt(editCurHT)} HT</div>}
          {hasAnyProduct(editSP) && <div style={S.subT}>Contreparties total : {fmt(editTotalHT)} HT</div>}
          <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setEditingProducts(false)}>Annuler</button>
            <button style={S.btn("success")} onClick={saveProducts}>✅ Enregistrer</button>
          </div>
        </>) : (<>
          {isM && (coSDA[activeSeason] || 0) > 0 && <div style={{ marginBottom: 8, fontSize: 13, color: Cl.pur }}>💜 Don {activeSeason} : <strong>{fmt(coSDA[activeSeason])}</strong></div>}
          {(() => {
            const viewProds = coSP[activeSeason] || [];
            if (viewProds.length === 0 && !(isM && (coSDA[activeSeason] || 0) > 0)) return <p style={{ fontSize: 13, color: Cl.txtL }}>Aucun produit pour {activeSeason} — cliquez Modifier pour en ajouter</p>;
            if (viewProds.length === 0) return null;
            const viewHT = viewProds.reduce((t, cp) => t + lineHT(cp), 0);
            const viewDon = coSDA[activeSeason] || 0;
            const viewRatio = isM && viewDon > 0 ? (viewHT / viewDon) * 100 : 0;
            return (<>
              <table style={{ ...S.tbl, marginTop: 6 }}>
                <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Catalogue</th><th style={S.th}>Prix conclu</th><th style={S.th}>Qté</th><th style={S.thR}>Total HT</th></tr></thead>
                <tbody>{viewProds.map(cp => {
                  const pr = products.find(x => x.id === cp.productId);
                  if (!pr) return null;
                  const catPrice = getPrice(pr, activeSeason).price || getPrice(pr, currentSeason).price;
                  const pctOff = catPrice > 0 ? Math.round((1 - cp.unitPrice / catPrice) * 100) : 0;
                  return (
                    <tr key={cp.productId}>
                      <td style={S.td}><strong>{pr.name}</strong><span style={{ fontSize: 11, color: Cl.txtL, marginLeft: 6 }}>{pr.category}</span></td>
                      <td style={S.td}><span style={{ color: Cl.txtL }}>{fmt(catPrice)}</span></td>
                      <td style={S.td}>{fmt(cp.unitPrice)}{pctOff > 0 && <span style={{ fontSize: 10, color: Cl.ok, marginLeft: 6 }}>-{pctOff}%</span>}</td>
                      <td style={S.td}>{cp.qty}</td>
                      <td style={S.tdR}><strong>{fmt(lineHT(cp))}</strong></td>
                    </tr>
                  );
                })}</tbody>
              </table>
              <div style={S.subTL}>Sous-total {activeSeason} : {fmt(viewHT)} HT</div>
              {isM && viewDon > 0 && viewHT > 0 && <div style={{ textAlign: "right", fontSize: 12, color: viewRatio <= 25 ? Cl.ok : Cl.err, fontWeight: 700 }}>Ratio : {viewRatio.toFixed(1)}% du don</div>}
            </>);
          })()}
          {hasAnyProduct(coSP) && <div style={S.subT}>Contreparties total : {fmt(allSeasonsHT(coSP))} HT</div>}
        </>)}
      </div>

      {/* Devis PDF */}
      {(hasAnyProduct(coSP) || totDon > 0) && <div style={{ marginTop: 12 }}>
        <button style={{ ...S.btn("ghost"), width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => generateDevis(clubInfo, co, co.products, products, currentSeason, [], seasons)}>📄 Télécharger le devis / proposition</button>
      </div>}

      <div style={{ marginTop: 14 }}>
        <div style={S.fx}><div style={S.cT}>📋 Actions</div><button style={S.btnS("ghost")} onClick={() => openAddAction(co.id, co.isPartner ? "Partenariat" : "Prospection")}>+</button></div>
        {(co.actions || []).map(a => (
          <div key={a.id} style={S.actItem(a.done)}>
            <input type="checkbox" checked={a.done} onChange={() => setCo({ ...co, actions: co.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) })} />
            <Badge type={statusBType(a.category) || "draft"}>{a.category}</Badge>
            <strong style={{ flex: 1 }}>{a.type}</strong><span style={{ color: Cl.txtL }}>{a.date}</span>
            <span style={{ color: Cl.pri, fontSize: 11 }}>👤 {a.assignee}</span>
            <button style={S.btnS("ghost")} onClick={() => setMiniForm({ title: "Modifier l'action", fields: [
              { key: "type", label: "Intitulé", value: a.type },
              { key: "category", label: "Catégorie", value: a.category, type: "select", options: ACTION_TYPES },
              { key: "date", label: "Date", value: a.date, type: "date" },
              { key: "assignee", label: "Assigné à", value: a.assignee, type: "member", options: members, onAdd: addMember },
              { key: "note", label: "Note", value: a.note || "", type: "textarea" },
            ], onSave: (v) => { setCo({ ...co, actions: co.actions.map(x => x.id === a.id ? { ...x, type: v.type || x.type, category: v.category, date: v.date || x.date, assignee: v.assignee || x.assignee, note: v.note } : x) }); setMiniForm(null); } })}>✏️</button>
            <button style={S.btnS("ghost")} onClick={() => setCo({ ...co, actions: co.actions.filter(x => x.id !== a.id) })}>✕</button>
          </div>
        ))}
      </div>

      {myContracts.length > 0 && <div style={{ marginTop: 14 }}>
        <div style={S.cT}>📝 Contrats liés</div>
        {myContracts.map(con => (
          <div key={con.id} style={{ ...S.card, cursor: "pointer", padding: 12 }} onClick={() => { if (onOpenContract) onOpenContract(con); onClose(); }}>
            <Badge type={con.type === "Mécénat" ? "mecenat" : "partenariat"}>{con.type}</Badge>
            <Badge type={['Signé','Facturé','Payé'].includes(con.status) ? "signed" : "pending"}>{con.status}</Badge>
          </div>
        ))}
      </div>}

      {/* Convert / Repass per season */}
      <div style={{ marginTop: 18, borderTop: `1px solid ${Cl.brd}`, paddingTop: 14 }}>
        {co.isPartner || (co.seasonStatus && Object.values(co.seasonStatus).includes("partenaire")) ? (<>
          {!showRepass ? (
            <div style={{ textAlign: "center" }}>
              <button style={{ ...S.btn("ghost"), color: Cl.warn, fontSize: 13 }} onClick={() => { setShowRepass(true); setRepassSeason(""); }}>↩️ Repasser en prospect pour une saison</button>
            </div>
          ) : (
            <div style={S.repassZone}>
              <div style={S.repassH}>↩️ Repasser en prospect — pour quelle saison ?</div>
              <select style={S.sel} value={repassSeason} onChange={e => setRepassSeason(e.target.value)}>
                <option value="">-- Choisir --</option>
                {seasons.map(s => {
                  const hasCon = hasContractForSeason(co, s.id);
                  return <option key={s.id} value={s.id} disabled={hasCon}>{s.name}{hasCon ? " (contrat en cours)" : ""}</option>;
                })}
              </select>
              {repassSeason && hasContractForSeason(co, repassSeason) && <div style={{ fontSize: 12, color: Cl.err, marginTop: 6 }}>⚠️ Un contrat signé couvre cette saison — impossible de repasser en prospect.</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                <button style={S.btn("ghost")} onClick={() => setShowRepass(false)}>Annuler</button>
                <button style={{ ...S.btn("primary"), background: Cl.warn }} disabled={!repassSeason || hasContractForSeason(co, repassSeason)} onClick={() => { setSeasonStatus(co.id, repassSeason, "prospect"); setShowRepass(false); }}>Confirmer</button>
              </div>
            </div>
          )}
        </>) : (
          <div style={{ textAlign: "center" }}>
            <button style={S.btnConvert} onClick={() => { convertToPartner(co.id); onClose(); }}>🤝 Convertir en partenaire</button>
          </div>
        )}
      </div>

      {/* Delete section */}
      {(() => {
        const coInvoices = invoices.filter(i => i.companyId === co.id);
        const hasInvoices = coInvoices.filter(i => i.type !== "cerfa").length > 0;
        const isSuperDemo = auth.isSuperAdmin && auth.member?.club_id === "demo";
        return <div style={{ marginTop: 18, borderTop: `1px solid ${Cl.brd}`, paddingTop: 14 }}>
          {!showDelete ? (
            <div style={{ textAlign: "center" }}>
              {hasInvoices && !isSuperDemo ? (
                <div style={{ fontSize: 12, color: Cl.txtL }}>
                  ⚠️ Ce {co.isPartner ? "partenaire" : "prospect"} a des factures — suppression impossible.
                  <button style={{ ...S.btn("ghost"), fontSize: 12, color: Cl.warn, marginTop: 8, display: "block", margin: "8px auto 0" }} onClick={() => {
                    coInvoices.forEach(inv => { if (inv.type === "cerfa" || inv.status === "Annulée") return; setInvoices(is => is.map(i => i.id === inv.id ? { ...i, status: "Annulée" } : i)); });
                    alert("Les factures ont été marquées comme annulées (avoir).");
                  }}>📋 Générer un avoir (annuler les factures)</button>
                </div>
              ) : (
                <button style={S.btnDelete} onClick={() => setShowDelete(true)}>🗑️ Supprimer {co.isPartner ? "ce partenaire" : "ce prospect"}</button>
              )}
              {isSuperDemo && hasInvoices && <button style={{ ...S.btnDelete, marginTop: 6, opacity: 0.6 }} onClick={() => setShowDelete(true)}>🔓 Forcer la suppression (super admin démo)</button>}
            </div>
          ) : (
            <div style={S.delZone}>
              <div style={S.delTitle}>⚠️ Suppression définitive</div>
              <div style={S.delText}>Cette action est irréversible. Les contrats et données liés seront aussi supprimés. Tapez <strong>SUPPRIMER</strong> pour confirmer.</div>
              <input style={S.delInp} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value.toUpperCase())} placeholder="Tapez SUPPRIMER" autoFocus />
              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                <button style={S.btn("ghost")} onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}>Annuler</button>
                <button style={{ ...S.btn("primary"), background: Cl.err, opacity: deleteConfirm === "SUPPRIMER" ? 1 : 0.3 }} disabled={deleteConfirm !== "SUPPRIMER"} onClick={() => {
                  setContracts(cs => cs.filter(c => c.companyId !== co.id));
                  setInvoices(is => is.filter(i => i.companyId !== co.id));
                  setCompanies(cs => cs.filter(c => c.id !== co.id));
                  onClose();
                }}>🗑️ Confirmer la suppression</button>
              </div>
            </div>
          )}
        </div>;
      })()}
    </Modal>
  );
}
