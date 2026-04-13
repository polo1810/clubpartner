import { useState } from 'react';
import { S, Cl } from '../data/styles';
import { getPrice } from '../data/initialData';

export const Badge = ({ children, type }) => {
  const m = { new: [Cl.pri, Cl.priL], renewal: [Cl.pur, Cl.purL], signed: [Cl.ok, Cl.okL], pending: [Cl.warn, Cl.warnL], draft: [Cl.txtL, Cl.hov], danger: [Cl.err, Cl.errL], mecenat: [Cl.pur, Cl.purL], partenariat: [Cl.pri, Cl.priL], interested: ["#059669", "#d1fae5"], refused: [Cl.err, Cl.errL], callback: [Cl.warn, Cl.warnL], rdv: [Cl.pur, Cl.purL], proposition: [Cl.pri, Cl.priL], noreply: [Cl.txtL, Cl.hov], partner: [Cl.ok, Cl.okL] };
  const [c, bg] = m[type] || [Cl.pri, Cl.priL];
  return <span style={S.badge(c, bg)}>{children}</span>;
};

export const Field = ({ label, children }) => <div style={{ marginBottom: 10 }}><label style={S.lbl}>{label}</label>{children}</div>;

export const Modal = ({ title, onClose, children }) => (
  <div style={S.modal} onClick={onClose}><div style={S.modalC} onClick={e => e.stopPropagation()}>
    <div style={{ ...S.fx, marginBottom: 16 }}><h2 style={S.pageH}>{title}</h2><button onClick={onClose} style={{ ...S.btnS("ghost"), fontSize: 18 }}>✕</button></div>
    {children}
  </div></div>
);

export const PhoneLink = ({ phone }) => { const c = (phone || "").replace(/\s/g, ""); return <a href={`tel:${c}`} style={S.link} onClick={e => e.stopPropagation()}>📞 {c.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}</a>; };
export const EmailLink = ({ email }) => <a href={`mailto:${email}`} style={S.link} onClick={e => e.stopPropagation()}>✉️ {email}</a>;

export const MemberSelect = ({ value, onChange, members, onAdd, style: sx }) => {
  const [adding, setAdding] = useState(false);
  const [nn, setNn] = useState("");
  if (adding) return (<div style={{ display: "flex", gap: 6 }}><input style={{ ...S.inp, flex: 1 }} placeholder="Nom Prénom" value={nn} onChange={e => setNn(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && nn.trim()) { onAdd(nn.trim()); onChange(nn.trim()); setNn(""); setAdding(false); } }} autoFocus /><button style={S.btnS("primary")} onClick={() => { if (nn.trim()) { onAdd(nn.trim()); onChange(nn.trim()); setNn(""); setAdding(false); } }}>✓</button><button style={S.btnS("ghost")} onClick={() => setAdding(false)}>✕</button></div>);
  return (<div style={{ display: "flex", gap: 6 }}><select style={{ ...S.sel, flex: 1, ...(sx || {}) }} value={value} onChange={e => onChange(e.target.value)}>{members.map(m => <option key={m}>{m}</option>)}</select><button style={{ ...S.btnS("ghost"), fontSize: 16, padding: "4px 8px" }} onClick={() => setAdding(true)}>+</button></div>);
};

export const MiniForm = ({ title, fields, onSave, onClose }) => {
  const iv = {}; fields.forEach(f => { iv[f.key] = f.value || ""; });
  const [vals, setVals] = useState(iv);
  const set = (k, v) => setVals({ ...vals, [k]: v });
  return (<Modal title={title} onClose={onClose}>
    {fields.map(f => (<Field key={f.key} label={f.label}>
      {f.type === "member" ? <MemberSelect value={vals[f.key]} onChange={v => set(f.key, v)} members={f.options || []} onAdd={f.onAdd || (() => {})} />
      : f.type === "select" ? <select style={S.sel} value={vals[f.key]} onChange={e => set(f.key, e.target.value)}>{(f.options || []).map(o => <option key={o}>{o}</option>)}</select>
      : f.type === "textarea" ? <textarea style={{ ...S.inp, minHeight: 60, resize: "vertical" }} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} />
      : <input type={f.type || "text"} style={S.inp} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} />}
    </Field>))}
    <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={S.btn("ghost")} onClick={onClose}>Annuler</button><button style={S.btn("primary")} onClick={() => onSave(vals)}>Valider</button></div>
  </Modal>);
};

export const ProductPicker = ({ products, selected, onToggle, cats, currentSeason }) => {
  const [openCat, setOpenCat] = useState(cats[0] || "");
  return (<div>
    <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>{cats.map(cat => {
      const count = products.filter(p => p.category === cat).length;
      const selC = selected.filter(sp => products.find(x => x.id === sp.productId)?.category === cat).length;
      return <button key={cat} style={{ ...S.btnS(openCat === cat ? "primary" : "ghost"), fontWeight: openCat === cat ? 700 : 400 }} onClick={() => setOpenCat(cat)}>{cat} ({count}){selC > 0 && <span style={{ ...S.badge(Cl.wh, Cl.pri), marginLeft: 4, fontSize: 10 }}>{selC}</span>}</button>;
    })}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{products.filter(p => p.category === openCat).map(p => {
      const sel = selected.find(x => x.productId === p.id);
      const pr = getPrice(p, currentSeason);
      return <div key={p.id} style={{ ...S.chip(!!sel), opacity: p.stock <= 0 ? 0.4 : 1 }} onClick={() => p.stock > 0 && onToggle(p.id)}>{p.name} <span style={{ fontSize: 10, opacity: 0.6 }}>{pr.price}€ · {p.stock}</span></div>;
    })}</div>
  </div>);
};

export const TeamModal = ({ members, memberEmails, onAdd, onRemove, onSetEmail, onClose }) => {
  const [nn, setNn] = useState("");
  return (<Modal title="👥 Équipe" onClose={onClose}>
    {members.map(m => (<div key={m} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${Cl.brd}` }}>
      <span style={{ minWidth: 120, fontSize: 14, fontWeight: 600 }}>{m}</span>
      <input style={{ ...S.inp, flex: 1, fontSize: 12 }} placeholder="email@example.com" value={memberEmails?.[m] || ""} onChange={e => onSetEmail(m, e.target.value)} />
      {members.length > 1 && <button style={S.btnS("ghost")} onClick={() => onRemove(m)}>✕</button>}
    </div>))}
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}><input style={{ ...S.inp, flex: 1 }} placeholder="Nouveau membre..." value={nn} onChange={e => setNn(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && nn.trim()) { onAdd(nn.trim()); setNn(""); } }} /><button style={S.btn("primary")} onClick={() => { if (nn.trim()) { onAdd(nn.trim()); setNn(""); } }}>Ajouter</button></div>
  </Modal>);
};

export const ProductFormModal = ({ onClose, onAdd, cats, subcats, placements, seasons, currentSeason }) => {
  const [f, setF] = useState({ name: "", category: cats[0] || "Signalétique", subcategory: "", placement: "", stock: 0, tva: 20, totalCost: 0 });
  const [sp, setSp] = useState(() => { const o = {}; seasons.forEach(s => { o[s.id] = { price: 0, cost: 0, amort: 0 }; }); return o; });
  const setSpVal = (sid, k, v) => setSp(prev => ({ ...prev, [sid]: { ...prev[sid], [k]: v } }));
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
  const catPlacements = (placements && typeof placements === "object" && !Array.isArray(placements)) ? (placements[f.category] || []) : (Array.isArray(placements) ? placements : []);
  return (<Modal title="Nouveau produit" onClose={onClose}><div style={S.g2}>
    <Field label="Nom"><input style={S.inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
    <Field label="Catégorie"><select style={S.sel} value={f.category} onChange={e => setF({ ...f, category: e.target.value, placement: "" })}>{cats.map(c => <option key={c}>{c}</option>)}</select></Field>
    {subcats && subcats.length > 0 && <Field label="Sous-catégorie"><select style={S.sel} value={f.subcategory} onChange={e => setF({ ...f, subcategory: e.target.value })}><option value="">— Aucune —</option>{subcats.map(c => <option key={c}>{c}</option>)}</select></Field>}
    <Field label="Emplacement">{catPlacements.length > 0 ? <select style={S.sel} value={f.placement} onChange={e => setF({ ...f, placement: e.target.value })}><option value="">— Aucun —</option>{catPlacements.map(c => <option key={c}>{c}</option>)}</select> : <div style={{ fontSize: 12, color: Cl.txtL, padding: "8px 0" }}>Aucun emplacement pour « {f.category} ». Ajoutez-en dans ⚙️ Paramètres.</div>}</Field>
    <Field label="Stock"><input type="number" style={S.inp} value={f.stock} onChange={e => setF({ ...f, stock: +e.target.value })} /></Field>
    <Field label="TVA %"><select style={S.sel} value={f.tva} onChange={e => setF({ ...f, tva: +e.target.value })}><option value={20}>20%</option><option value={10}>10%</option><option value={5.5}>5.5%</option><option value={0}>0%</option></select></Field>
    <Field label="Coût total investissement"><input type="number" style={S.inp} value={f.totalCost} onChange={e => setF({ ...f, totalCost: +e.target.value })} /></Field>
  </div>
  <div style={{ marginTop: 14 }}>
    <div style={S.sectionTitle}>Prix et amortissement par saison</div>
    <table style={S.tbl}><thead><tr><th style={S.th}>Saison</th><th style={S.th}>Prix vente HT</th><th style={S.th}>Coût revient</th><th style={S.th}>Amortissement</th></tr></thead>
      <tbody>{seasons.map(s => (<tr key={s.id} style={s.id === currentSeason ? { background: Cl.priL } : {}}>
        <td style={S.td}><strong>{s.name}</strong>{s.id === currentSeason && <Badge type="new">Active</Badge>}</td>
        <td style={S.td}><input type="number" style={S.inpW(80)} value={sp[s.id]?.price || 0} onChange={e => setSpVal(s.id, "price", +e.target.value)} /></td>
        <td style={S.td}><input type="number" style={S.inpW(80)} value={sp[s.id]?.cost || 0} onChange={e => setSpVal(s.id, "cost", +e.target.value)} /></td>
        <td style={S.td}><input type="number" style={S.inpW(80)} value={sp[s.id]?.amort || 0} onChange={e => setSpVal(s.id, "amort", +e.target.value)} /></td>
      </tr>))}</tbody></table>
    {f.totalCost > 0 && (() => { const totalAmort = Object.values(sp).reduce((t, v) => t + (v.amort || 0), 0); const diff = f.totalCost - totalAmort; return <div style={S.alert(Math.abs(diff) < 1 ? "success" : "warning")}>{Math.abs(diff) < 1 ? "✅ Amortissement = investissement" : diff > 0 ? `⚠️ Reste ${fmt(diff)} à répartir` : `⚠️ Dépasse de ${fmt(-diff)}`}</div>; })()}
  </div>
  <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={S.btn("ghost")} onClick={onClose}>Annuler</button><button style={S.btn("primary")} onClick={() => { const prices = {}; Object.entries(sp).forEach(([k, v]) => { if (v.price || v.cost || v.amort) prices[k] = v; }); onAdd({ ...f, prices, totalCost: f.totalCost }); }}>Ajouter</button></div></Modal>);
};

export const SettingsModal = ({ cats, seasons, setSeasons, currentSeason, clubInfo, setClubInfo, accountCodes, setAccountCodes, scripts, setScripts, contractTemplates, setContractTemplates, exclusiviteText, setExclusiviteText, onClose }) => {
  const [newSeason, setNewSeason] = useState({ name: "", startDate: "", endDate: "" });
  const updateSeason = (id, key, value) => setSeasons(ss => ss.map(s => s.id === id ? { ...s, [key]: value } : s));
  const setClub = (k, v) => setClubInfo(ci => ({ ...ci, [k]: v }));
  const setAccCat = (cat, val) => setAccountCodes(ac => ({ ...ac, categories: { ...ac.categories, [cat]: val } }));
  return (<Modal title="⚙️ Paramètres" onClose={onClose}>
    <div style={S.cT}>🏟️ Informations du club / association</div>
    <div style={S.g2}>
      <Field label="Nom du club"><input style={S.inp} value={clubInfo.name || ""} onChange={e => setClub("name", e.target.value)} /></Field>
      <Field label="Adresse N°"><input style={S.inp} value={clubInfo.adresseNum || ""} onChange={e => setClub("adresseNum", e.target.value)} placeholder="12" /></Field>
      <Field label="Rue"><input style={S.inp} value={clubInfo.adresseRue || ""} onChange={e => setClub("adresseRue", e.target.value)} placeholder="avenue du Stade" /></Field>
      <Field label="Code postal"><input style={S.inp} value={clubInfo.adresseCP || ""} onChange={e => setClub("adresseCP", e.target.value)} placeholder="49300" /></Field>
      <Field label="Commune"><input style={S.inp} value={clubInfo.adresseCommune || ""} onChange={e => setClub("adresseCommune", e.target.value)} placeholder="Cholet" /></Field>
      <Field label="Téléphone"><input style={S.inp} value={clubInfo.phone || ""} onChange={e => setClub("phone", e.target.value)} /></Field>
      <Field label="Email"><input style={S.inp} value={clubInfo.email || ""} onChange={e => setClub("email", e.target.value)} /></Field>
      <Field label="SIRET"><input style={S.inp} value={clubInfo.siret || ""} onChange={e => setClub("siret", e.target.value)} /></Field>
      <Field label="N° TVA"><input style={S.inp} value={clubInfo.tvaNumber || ""} onChange={e => setClub("tvaNumber", e.target.value)} /></Field>
      <Field label="Soumis à la TVA">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={S.chip(clubInfo.soumisTVA !== false)} onClick={() => setClub("soumisTVA", true)}>✅ Oui</button>
          <button style={S.chip(clubInfo.soumisTVA === false)} onClick={() => setClub("soumisTVA", false)}>❌ Non</button>
          {clubInfo.soumisTVA === false && <span style={{ fontSize: 11, color: Cl.txtL }}>TVA non applicable — art. 293 B du CGI</span>}
        </div>
      </Field>
      <Field label="Objet social"><input style={S.inp} value={clubInfo.objetSocial || ""} onChange={e => setClub("objetSocial", e.target.value)} placeholder="Promotion et développement de la pratique sportive..." /></Field>
      <Field label="Président(e)"><input style={S.inp} value={clubInfo.president || ""} onChange={e => setClub("president", e.target.value)} /></Field>
      <Field label="Validité devis (jours)"><input type="number" style={S.inp} value={clubInfo.validiteDays || 30} onChange={e => setClub("validiteDays", +e.target.value)} /></Field>
      <Field label="Logo du club">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {clubInfo.logo && <img src={clubInfo.logo} alt="Logo" style={{ height: 40, borderRadius: 6, border: `1px solid ${Cl.brd}` }} />}
          <label style={{ ...S.btnS("primary"), cursor: "pointer", display: "inline-block" }}>
            {clubInfo.logo ? "Changer" : "📷 Charger"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const img = new Image(); img.onload = () => { const MAX = 200; let w = img.width, h = img.height; if (w > MAX) { h = h * MAX / w; w = MAX; } if (h > MAX) { w = w * MAX / h; h = MAX; } const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); setClub("logo", c.toDataURL("image/png")); }; img.src = ev.target.result; }; reader.readAsDataURL(file); }} />
          </label>
          {clubInfo.logo && <button style={S.btnS("ghost")} onClick={() => setClub("logo", "")}>✕</button>}
        </div>
      </Field>
      <Field label="Signature du représentant légal">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {clubInfo.signature && <img src={clubInfo.signature} alt="Signature" style={{ height: 40, borderRadius: 6, border: `1px solid ${Cl.brd}`, background: "#fff" }} />}
          <label style={{ ...S.btnS("primary"), cursor: "pointer", display: "inline-block" }}>
            {clubInfo.signature ? "Changer" : "✍️ Charger"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const img = new Image(); img.onload = () => { const MAX = 400; let w = img.width, h = img.height; if (w > MAX) { h = h * MAX / w; w = MAX; } const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); setClub("signature", c.toDataURL("image/png")); }; img.src = ev.target.result; }; reader.readAsDataURL(file); }} />
          </label>
          {clubInfo.signature && <button style={S.btnS("ghost")} onClick={() => setClub("signature", "")}>✕</button>}
        </div>
        <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>Cette signature sera intégrée automatiquement dans les devis, contrats, conventions et CERFA. (Image redimensionnée à 400px max)</div>
      </Field>
      <Field label="Couleur du thème">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="color" value={clubInfo.themeColor || "#2563eb"} onChange={e => setClub("themeColor", e.target.value)} style={{ width: 40, height: 32, border: "none", cursor: "pointer", borderRadius: 6 }} />
          <input style={{ ...S.inp, width: 90, fontFamily: "monospace" }} value={clubInfo.themeColor || "#2563eb"} onChange={e => setClub("themeColor", e.target.value)} />
          {clubInfo.themeColor && clubInfo.themeColor !== "#2563eb" && <button style={S.btnS("ghost")} onClick={() => setClub("themeColor", "#2563eb")}>Reset</button>}
        </div>
      </Field>
      <Field label="SIREN (pour CERFA)"><input style={S.inp} value={clubInfo.siren || ""} onChange={e => setClub("siren", e.target.value)} placeholder="123 456 789" /></Field>
      <Field label="Objet CERFA"><input style={S.inp} value={clubInfo.cerfaObjet || ""} onChange={e => setClub("cerfaObjet", e.target.value)} placeholder="Soutien aux activités sportives..." /></Field>
      <Field label="Type d'organisme (CERFA)"><select style={S.sel} value={clubInfo.cerfaType || "association_1901"} onChange={e => setClub("cerfaType", e.target.value)}>
        <option value="association_1901">Association loi 1901</option>
        <option value="association_rup">Association reconnue d'utilité publique</option>
        <option value="fondation_universitaire">Fondation universitaire</option>
        <option value="fondation_entreprise">Fondation d'entreprise</option>
        <option value="musee">Musée de France</option>
        <option value="aide_alimentaire">Organisme d'aide alimentaire/médicale</option>
        <option value="fonds_dotation">Fonds de dotation</option>
      </select></Field>
    </div>

    <div style={{ ...S.cT, marginTop: 22 }}>🧾 Comptes comptables</div>
    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: Cl.txtL }}>Comptes TVA collectée :</div>
    <table style={{ ...S.tbl, marginTop: 6 }}>
      <thead><tr><th style={S.th}>Taux TVA</th><th style={S.th}>N° de compte</th></tr></thead>
      <tbody>{[20, 10, 5.5].map(rate => (
        <tr key={rate}><td style={S.td}><strong>{rate}%</strong></td><td style={S.td}><input style={{ ...S.inp, fontFamily: "monospace" }} value={accountCodes.tva?.[rate] || ""} onChange={e => setAccountCodes(ac => ({ ...ac, tva: { ...ac.tva, [rate]: e.target.value } }))} placeholder="4457XXXX" /></td></tr>
      ))}</tbody>
    </table>
    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: Cl.txtL }}>Comptes produits par catégorie :</div>
    <table style={{ ...S.tbl, marginTop: 6 }}>
      <thead><tr><th style={S.th}>Catégorie</th><th style={S.th}>N° de compte</th></tr></thead>
      <tbody>{cats.map(cat => (
        <tr key={cat}><td style={S.td}><strong>{cat}</strong></td><td style={S.td}><input style={{ ...S.inp, fontFamily: "monospace" }} value={accountCodes.categories?.[cat] || ""} onChange={e => setAccCat(cat, e.target.value)} placeholder="708XXXXX" /></td></tr>
      ))}</tbody>
    </table>

    <div style={{ ...S.cT, marginTop: 22 }}>📅 Saisons</div>
    <table style={S.tbl}>
      <thead><tr><th style={S.th}>Nom</th><th style={S.th}>Date début</th><th style={S.th}>Date fin</th><th style={S.th}></th></tr></thead>
      <tbody>{seasons.map(s => (
        <tr key={s.id} style={s.id === currentSeason ? { background: Cl.priL } : {}}>
          <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><input style={{ ...S.inp, fontWeight: 700 }} value={s.name} onChange={e => updateSeason(s.id, "name", e.target.value)} />{s.id === currentSeason && <Badge type="new">Active</Badge>}</div></td>
          <td style={S.td}><input type="date" style={S.inp} value={s.startDate} onChange={e => updateSeason(s.id, "startDate", e.target.value)} /></td>
          <td style={S.td}><input type="date" style={S.inp} value={s.endDate} onChange={e => updateSeason(s.id, "endDate", e.target.value)} /></td>
          <td style={S.td}>{s.id !== currentSeason && seasons.length > 1 && <button style={S.btnS("ghost")} onClick={() => setSeasons(ss => ss.filter(x => x.id !== s.id))}>✕</button>}</td>
        </tr>
      ))}</tbody>
    </table>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: Cl.txtL, marginBottom: 8 }}>Ajouter une saison</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...S.inp, width: 110 }} placeholder="Ex: 2028-2029" value={newSeason.name} onChange={e => setNewSeason({ ...newSeason, name: e.target.value })} />
        <input type="date" style={{ ...S.inp, width: 150 }} value={newSeason.startDate} onChange={e => setNewSeason({ ...newSeason, startDate: e.target.value })} />
        <input type="date" style={{ ...S.inp, width: 150 }} value={newSeason.endDate} onChange={e => setNewSeason({ ...newSeason, endDate: e.target.value })} />
        <button style={S.btn("primary")} onClick={() => { if (newSeason.name.trim() && !seasons.find(s => s.id === newSeason.name.trim())) { setSeasons(ss => [...ss, { id: newSeason.name.trim(), name: newSeason.name.trim(), startDate: newSeason.startDate, endDate: newSeason.endDate }]); setNewSeason({ name: "", startDate: "", endDate: "" }); } }}>Ajouter</button>
      </div>
    </div>

    <div style={{ ...S.cT, marginTop: 22 }}>📞 Scripts de prospection</div>
    {["Partenariat", "Mécénat"].map(type => (
      <div key={type} style={{ marginTop: 10 }}>
        <label style={{ ...S.lbl, fontWeight: 700 }}>{type === "Partenariat" ? "🤝" : "💜"} Script {type}</label>
        <textarea style={{ ...S.inp, minHeight: 120, resize: "vertical", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5 }} value={scripts?.[type] || ""} onChange={e => setScripts(sc => ({ ...sc, [type]: e.target.value }))} placeholder={`Script d'appel pour ${type}...`} />
      </div>
    ))}
    <div style={{ marginTop: 6, fontSize: 11, color: Cl.txtL }}>Utilisez **texte** pour le gras, • pour les puces. Les placeholders [contact], [nom], [club], [saison] seront remplacés automatiquement.</div>

    <div style={{ ...S.cT, marginTop: 22 }}>📝 Modèles de contrat</div>
    {["Partenariat", "Mécénat"].map(type => (
      <div key={type} style={{ marginTop: 10 }}>
        <label style={{ ...S.lbl, fontWeight: 700 }}>{type === "Partenariat" ? "🤝" : "💜"} Contrat {type}</label>
        <textarea style={{ ...S.inp, minHeight: 200, resize: "vertical", fontFamily: "inherit", fontSize: 12, lineHeight: 1.6 }} value={contractTemplates?.[type] || ""} onChange={e => setContractTemplates(ct => ({ ...ct, [type]: e.target.value }))} />
      </div>
    ))}
    <div style={{ marginTop: 10 }}>
      <label style={{ ...S.lbl, fontWeight: 700 }}>🔒 Clause d'exclusivité (utilisée quand cochée sur le contrat)</label>
      <textarea style={{ ...S.inp, minHeight: 60, resize: "vertical", fontFamily: "inherit", fontSize: 12, lineHeight: 1.6 }} value={exclusiviteText || ""} onChange={e => setExclusiviteText(e.target.value)} />
    </div>
    <div style={{ marginTop: 6, fontSize: 11, color: Cl.txtL }}>
      Placeholders disponibles : [club], [president], [entreprise], [signataire], [saison_debut], [saison_fin], [nb_saisons], [montant_total], [montant_don], [ratio_contreparties], [objet_social], [tableau_produits], [echeancier], [clause_exclusivite]
    </div>
  </Modal>);
};
