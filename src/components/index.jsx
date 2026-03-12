import { useState } from 'react';
import { S, Cl } from '../data/styles';
import { getPrice } from '../data/initialData';

export const Badge = ({ children, type }) => {
  const m = { new: [Cl.pri, Cl.priL], renewal: [Cl.pur, Cl.purL], signed: [Cl.ok, Cl.okL], pending: [Cl.warn, Cl.warnL], draft: [Cl.txtL, Cl.hov], danger: [Cl.err, Cl.errL], mecenat: [Cl.pur, Cl.purL], partenariat: [Cl.pri, Cl.priL], interested: ["#059669", "#d1fae5"], refused: [Cl.err, Cl.errL], callback: [Cl.warn, Cl.warnL], rdv: [Cl.pur, Cl.purL], proposition: [Cl.pri, Cl.priL], noreply: [Cl.txtL, Cl.hov], partner: [Cl.ok, Cl.okL] };
  const [c, bg] = m[type] || [Cl.pri, Cl.priL];
  return <span style={S.badge(c, bg)}>{children}</span>;
};

export const Field = ({ label, children }) => <div style={{ marginBottom: 8 }}><label style={S.lbl}>{label}</label>{children}</div>;

export const Modal = ({ title, onClose, children }) => (
  <div style={S.modal} onClick={onClose}><div style={S.modalC} onClick={e => e.stopPropagation()}>
    <div style={{ ...S.fx, marginBottom: 14 }}><h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2><button onClick={onClose} style={{ ...S.btnS("ghost"), fontSize: 16 }}>✕</button></div>
    {children}
  </div></div>
);

export const PhoneLink = ({ phone }) => { const c = (phone || "").replace(/\s/g, ""); return <a href={`tel:${c}`} style={S.link} onClick={e => e.stopPropagation()}>📞 {c.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}</a>; };
export const EmailLink = ({ email }) => <a href={`mailto:${email}`} style={S.link} onClick={e => e.stopPropagation()}>✉️ {email}</a>;

export const MemberSelect = ({ value, onChange, members, onAdd, style: sx }) => {
  const [adding, setAdding] = useState(false);
  const [nn, setNn] = useState("");
  if (adding) return (<div style={{ display: "flex", gap: 4 }}><input style={{ ...S.inp, flex: 1 }} placeholder="Nom Prénom" value={nn} onChange={e => setNn(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && nn.trim()) { onAdd(nn.trim()); onChange(nn.trim()); setNn(""); setAdding(false); } }} autoFocus /><button style={S.btnS("primary")} onClick={() => { if (nn.trim()) { onAdd(nn.trim()); onChange(nn.trim()); setNn(""); setAdding(false); } }}>✓</button><button style={S.btnS("ghost")} onClick={() => setAdding(false)}>✕</button></div>);
  return (<div style={{ display: "flex", gap: 4 }}><select style={{ ...S.sel, flex: 1, ...(sx || {}) }} value={value} onChange={e => onChange(e.target.value)}>{members.map(m => <option key={m}>{m}</option>)}</select><button style={{ ...S.btnS("ghost"), fontSize: 14, padding: "3px 6px" }} onClick={() => setAdding(true)}>+</button></div>);
};

export const MiniForm = ({ title, fields, onSave, onClose }) => {
  const iv = {}; fields.forEach(f => { iv[f.key] = f.value || ""; });
  const [vals, setVals] = useState(iv);
  const set = (k, v) => setVals({ ...vals, [k]: v });
  return (<Modal title={title} onClose={onClose}>
    {fields.map(f => (<Field key={f.key} label={f.label}>
      {f.type === "member" ? <MemberSelect value={vals[f.key]} onChange={v => set(f.key, v)} members={f.options || []} onAdd={f.onAdd || (() => {})} />
      : f.type === "select" ? <select style={S.sel} value={vals[f.key]} onChange={e => set(f.key, e.target.value)}>{(f.options || []).map(o => <option key={o}>{o}</option>)}</select>
      : f.type === "textarea" ? <textarea style={{ ...S.inp, minHeight: 50, resize: "vertical" }} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} />
      : <input type={f.type || "text"} style={S.inp} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} />}
    </Field>))}
    <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={S.btn("ghost")} onClick={onClose}>Annuler</button><button style={S.btn("primary")} onClick={() => onSave(vals)}>Valider</button></div>
  </Modal>);
};

export const ProductPicker = ({ products, selected, onToggle, cats, currentSeason }) => {
  const [openCat, setOpenCat] = useState(cats[0] || "");
  return (<div>
    <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>{cats.map(cat => {
      const count = products.filter(p => p.category === cat).length;
      const selC = selected.filter(sp => products.find(x => x.id === sp.productId)?.category === cat).length;
      return <button key={cat} style={{ ...S.btnS(openCat === cat ? "primary" : "ghost"), fontWeight: openCat === cat ? 700 : 400 }} onClick={() => setOpenCat(cat)}>{cat} ({count}){selC > 0 && <span style={{ ...S.badge(Cl.wh, Cl.pri), marginLeft: 3, fontSize: 9 }}>{selC}</span>}</button>;
    })}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{products.filter(p => p.category === openCat).map(p => {
      const sel = selected.find(x => x.productId === p.id);
      const pr = getPrice(p, currentSeason);
      return <div key={p.id} style={{ ...S.chip(!!sel), opacity: p.stock <= 0 ? 0.4 : 1 }} onClick={() => p.stock > 0 && onToggle(p.id)}>{p.name} <span style={{ fontSize: 9, opacity: 0.6 }}>{pr.price}€ · {p.stock}</span></div>;
    })}</div>
  </div>);
};

export const TeamModal = ({ members, onAdd, onRemove, onClose }) => {
  const [nn, setNn] = useState("");
  return (<Modal title="👥 Équipe" onClose={onClose}>
    {members.map(m => (<div key={m} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${Cl.brd}` }}><span style={{ flex: 1, fontSize: 13 }}>{m}</span>{members.length > 1 && <button style={S.btnS("ghost")} onClick={() => onRemove(m)}>✕</button>}</div>))}
    <div style={{ marginTop: 10, display: "flex", gap: 6 }}><input style={{ ...S.inp, flex: 1 }} placeholder="Nouveau membre..." value={nn} onChange={e => setNn(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && nn.trim()) { onAdd(nn.trim()); setNn(""); } }} /><button style={S.btn("primary")} onClick={() => { if (nn.trim()) { onAdd(nn.trim()); setNn(""); } }}>Ajouter</button></div>
  </Modal>);
};

export const ProductFormModal = ({ onClose, onAdd, cats, seasons, currentSeason }) => {
  const [f, setF] = useState({ name: "", category: cats[0] || "Signalétique", stock: 0, tva: 20, totalCost: 0 });
  const [sp, setSp] = useState(() => { const o = {}; seasons.forEach(s => { o[s.id] = { price: 0, cost: 0, amort: 0 }; }); return o; });
  const setSpVal = (sid, k, v) => setSp(prev => ({ ...prev, [sid]: { ...prev[sid], [k]: v } }));
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
  return (<Modal title="Nouveau produit" onClose={onClose}><div style={S.g2}>
    <Field label="Nom"><input style={S.inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
    <Field label="Catégorie"><select style={S.sel} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{cats.map(c => <option key={c}>{c}</option>)}</select></Field>
    <Field label="Stock"><input type="number" style={S.inp} value={f.stock} onChange={e => setF({ ...f, stock: +e.target.value })} /></Field>
    <Field label="TVA %"><select style={S.sel} value={f.tva} onChange={e => setF({ ...f, tva: +e.target.value })}><option value={20}>20%</option><option value={10}>10%</option><option value={5.5}>5.5%</option><option value={0}>0%</option></select></Field>
    <Field label="Coût total investissement"><input type="number" style={S.inp} value={f.totalCost} onChange={e => setF({ ...f, totalCost: +e.target.value })} /></Field>
  </div>
  <div style={{ marginTop: 12 }}>
    <div style={S.sectionTitle}>Prix et amortissement par saison</div>
    <table style={S.tbl}><thead><tr><th style={S.th}>Saison</th><th style={S.th}>Prix vente HT</th><th style={S.th}>Coût revient</th><th style={S.th}>Amortissement</th></tr></thead>
      <tbody>{seasons.map(s => (<tr key={s.id} style={s.id === currentSeason ? { background: Cl.priL } : {}}>
        <td style={S.td}><strong>{s.name}</strong>{s.id === currentSeason && <Badge type="new">Active</Badge>}</td>
        <td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={sp[s.id]?.price || 0} onChange={e => setSpVal(s.id, "price", +e.target.value)} /></td>
        <td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={sp[s.id]?.cost || 0} onChange={e => setSpVal(s.id, "cost", +e.target.value)} /></td>
        <td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={sp[s.id]?.amort || 0} onChange={e => setSpVal(s.id, "amort", +e.target.value)} /></td>
      </tr>))}</tbody></table>
    {f.totalCost > 0 && (() => { const totalAmort = Object.values(sp).reduce((t, v) => t + (v.amort || 0), 0); const diff = f.totalCost - totalAmort; return <div style={S.alert(Math.abs(diff) < 1 ? "success" : "warning")}>{Math.abs(diff) < 1 ? "✅ Amortissement = investissement" : diff > 0 ? `⚠️ Reste ${fmt(diff)} à répartir` : `⚠️ Dépasse de ${fmt(-diff)}`}</div>; })()}
  </div>
  <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={S.btn("ghost")} onClick={onClose}>Annuler</button><button style={S.btn("primary")} onClick={() => { const prices = {}; Object.entries(sp).forEach(([k, v]) => { if (v.price || v.cost || v.amort) prices[k] = v; }); onAdd({ ...f, prices, totalCost: f.totalCost }); }}>Ajouter</button></div></Modal>);
};

export const SettingsModal = ({ cats, setCats, seasons, currentSeason, onClose }) => {
  const [newCat, setNewCat] = useState("");
  return (<Modal title="⚙️ Paramètres" onClose={onClose}>
    <div style={S.cT}>📁 Catégories</div>
    {cats.map(c => (<div key={c} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${Cl.brd}` }}><span style={{ flex: 1, fontSize: 13 }}>{c}</span>{cats.length > 1 && <button style={S.btnS("ghost")} onClick={() => setCats(cs => cs.filter(x => x !== c))}>✕</button>}</div>))}
    <div style={{ marginTop: 8, display: "flex", gap: 6 }}><input style={{ ...S.inp, flex: 1 }} placeholder="Nouvelle catégorie..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCat.trim() && !cats.includes(newCat.trim())) { setCats(cs => [...cs, newCat.trim()]); setNewCat(""); } }} /><button style={S.btn("primary")} onClick={() => { if (newCat.trim() && !cats.includes(newCat.trim())) { setCats(cs => [...cs, newCat.trim()]); setNewCat(""); } }}>Ajouter</button></div>
    <div style={{ ...S.cT, marginTop: 16 }}>📅 Saisons</div>
    {seasons.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 12 }}><strong style={{ minWidth: 80 }}>{s.name}</strong><span style={{ color: Cl.txtL }}>{s.startDate} → {s.endDate}</span>{s.id === currentSeason && <Badge type="new">Active</Badge>}</div>))}
  </Modal>);
};
