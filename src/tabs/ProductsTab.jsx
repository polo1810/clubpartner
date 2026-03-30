import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, getPrice } from '../data/initialData';
import { Badge, ProductFormModal, Modal } from '../components/index';
import ImportWizard from '../components/ImportWizard';

// --- Settings Modal for subcats, productTypes, placements ---
function ProductSettingsModal({ onClose }) {
  const { subcats, setSubcats, productTypes, setProductTypes, placements, setPlacements } = useApp();
  const [newSub, setNewSub] = useState("");
  const [newType, setNewType] = useState("");
  const [newPlace, setNewPlace] = useState("");

  const addItem = (list, setList, val, setVal) => { if (val.trim() && !list.includes(val.trim())) { setList([...list, val.trim()]); setVal(""); } };
  const removeItem = (list, setList, val) => setList(list.filter(x => x !== val));

  const renderList = (title, emoji, list, setList, newVal, setNewVal) => (
    <div style={{ marginBottom: 16 }}>
      <div style={S.sectionTitle}>{emoji} {title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {list.map(item => (
          <span key={item} style={S.chip(true)}>
            {item}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: Cl.err, fontWeight: 700, fontSize: 14, padding: 0, marginLeft: 4 }} onClick={() => removeItem(list, setList, item)}>×</button>
          </span>
        ))}
        {list.length === 0 && <span style={{ fontSize: 12, color: Cl.txtL }}>Aucun élément</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={S.inp} placeholder={`Ajouter un(e) ${title.toLowerCase()}...`} value={newVal} onChange={e => setNewVal(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem(list, setList, newVal, setNewVal)} />
        <button style={S.btn("primary")} onClick={() => addItem(list, setList, newVal, setNewVal)}>+</button>
      </div>
    </div>
  );

  return (
    <Modal title="⚙️ Paramètres Produits & Stocks" onClose={onClose}>
      {renderList("Sous-catégories", "📂", subcats, setSubcats, newSub, setNewSub)}
      {renderList("Types de produit", "📦", productTypes, setProductTypes, newType, setNewType)}
      {renderList("Emplacements", "📍", placements, setPlacements, newPlace, setNewPlace)}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button style={S.btn("primary")} onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}

export default function ProductsTab() {
  const { products, setProducts, cats, subcats, productTypes, placements, seasons, currentSeason, stockSold, stockProv, caByProd, setMiniForm } = useApp();
  const [showProdF, setShowProdF] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState([]);

  const totPot = products.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
  const totReal = Object.values(caByProd).reduce((a, b) => a + b, 0);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allIds = products.map(p => p.id);
  const allSelected = products.length > 0 && products.every(p => selected.includes(p.id));
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const [confirmDel, setConfirmDel] = useState(null); // { ids: [...], label: "..." }

  const deleteSelected = () => setConfirmDel({ ids: [...selected], label: `${selected.length} produit(s)` });
  const deleteOne = (id) => { const p = products.find(x => x.id === id); setConfirmDel({ ids: [id], label: p?.name || "ce produit" }); };
  const doDelete = () => { setProducts(ps => ps.filter(p => !confirmDel.ids.includes(p.id))); setSelected(s => s.filter(x => !confirmDel.ids.includes(x))); setConfirmDel(null); };

  const bulkEdit = () => {
    setMiniForm({ title: `Modifier ${selected.length} produit(s)`, fields: [
      { key: "category", label: "Catégorie (vide = ne pas changer)", value: "", type: "select", options: ["", ...cats] },
      { key: "subcategory", label: "Sous-catégorie (vide = ne pas changer)", value: "", type: "select", options: ["", ...subcats] },
      { key: "productType", label: "Type (vide = ne pas changer)", value: "", type: "select", options: ["", ...productTypes] },
      { key: "placement", label: "Emplacement (vide = ne pas changer)", value: "", type: "select", options: ["", ...placements] },
      { key: "tva", label: "TVA % (vide = ne pas changer)", value: "", type: "select", options: ["", "20", "10", "5.5", "0"] },
    ], onSave: (v) => {
      setProducts(ps => ps.map(p => {
        if (!selected.includes(p.id)) return p;
        const u = { ...p };
        if (v.category) u.category = v.category;
        if (v.subcategory) u.subcategory = v.subcategory;
        if (v.productType) u.productType = v.productType;
        if (v.placement) u.placement = v.placement;
        if (v.tva) u.tva = +v.tva;
        return u;
      }));
      setSelected([]); setMiniForm(null);
    }});
  };

  // Build product label with hierarchy details
  const prodLabel = (p) => {
    const parts = [p.subcategory, p.productType, p.placement].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (<>
    <div style={S.fx}><h2 style={S.pageH}>Produits & Stocks</h2>
      <div style={S.coActions}>
        {selected.length > 0 && <>
          <button style={{ ...S.btn("ghost"), color: Cl.warn, fontSize: 13 }} onClick={bulkEdit}>✏️ Modifier {selected.length}</button>
          <button style={{ ...S.btn("ghost"), color: Cl.err, fontSize: 13 }} onClick={deleteSelected}>🗑 Supprimer {selected.length}</button>
        </>}
        <button style={S.btn("ghost")} onClick={() => setShowSettings(true)}>⚙️ Paramètres</button>
        <button style={S.btn("ghost")} onClick={() => setShowImport(true)}>📥 Import</button>
        <button style={S.btn("primary")} onClick={() => setShowProdF(true)}>+ Produit</button>
      </div>
    </div>
    <div style={{ ...S.card, marginTop: 10, ...S.g3 }}>
      <div style={S.statCard}><div style={S.statL}>CA potentiel</div><div style={S.statV(Cl.txtL)}>{fmt(totPot)}</div></div>
      <div style={S.statCard}><div style={S.statL}>CA réalisé</div><div style={S.statV(Cl.ok)}>{fmt(totReal)}</div></div>
      <div style={S.statCard}><div style={S.statL}>Progression</div><div style={S.statV(Cl.pri)}>{totPot > 0 ? ((totReal / totPot) * 100).toFixed(0) : 0}%</div><div style={S.statBar}><div style={S.statBarFill(totPot > 0 ? (totReal / totPot) * 100 : 0, Cl.ok)} /></div></div>
    </div>

    {products.length > 0 && <div style={S.selAll}>
      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
      <span style={{ cursor: "pointer" }} onClick={toggleAll}>{allSelected ? "Tout désélectionner" : "Tout sélectionner"}</span>
      {selected.length > 0 && <span style={S.selCount}>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>}
    </div>}

    {cats.map(cat => {
      const items = products.filter(p => p.category === cat); if (!items.length) return null;
      const pot = items.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
      const real = items.reduce((t, p) => t + (caByProd[p.id] || 0), 0);
      const pct = pot > 0 ? (real / pot) * 100 : 0;
      return (<div key={cat} style={S.card}>
        <div style={S.fx}><div style={S.cT}>{cat}</div><div style={{ fontSize: 12 }}>Pot: <strong>{fmt(pot)}</strong> · Réal: <strong style={{ color: Cl.ok }}>{fmt(real)}</strong> · {pct.toFixed(0)}%</div></div>
        <div style={S.barBox}><div style={S.bar(pct, Cl.ok)} /></div>
        <table style={{ ...S.tbl, marginTop: 10 }}><thead><tr><th style={S.th}></th><th style={S.th}>Produit</th><th style={S.th}>Prix HT</th><th style={S.th}>TVA</th><th style={S.th}>Stock</th><th style={S.th}>Vendus</th><th style={S.th}>Provisoire</th><th style={S.th}>Dispo réel</th><th style={S.thR}>CA HT</th><th style={S.th}></th></tr></thead>
          <tbody>{items.map(p => { const pr = getPrice(p, currentSeason); const sold = stockSold[p.id] || 0; const prov = stockProv[p.id] || 0; const dispoReel = p.stock - sold; const dispoSiTous = p.stock - sold - prov; const isSelected = selected.includes(p.id); const label = prodLabel(p); return (
            <tr key={p.id} style={isSelected ? { background: Cl.priL } : {}}>
              <td style={S.td}><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} /></td>
              <td style={S.td}>
                <strong>{p.name}</strong>
                {label && <div style={{ fontSize: 11, color: Cl.pri }}>{label}</div>}
                {p.totalCost > 0 && <div style={{ fontSize: 11, color: Cl.txtL }}>Invest: {fmt(p.totalCost)} · Amort: {fmt(pr.amort || 0)}/s</div>}
              </td>
              <td style={S.td}>{fmt(pr.price)}</td>
              <td style={S.td}>{p.tva}%</td>
              <td style={S.td}><input type="number" min="0" style={S.inpW(55)} value={p.stock} onChange={e => setProducts(ps => ps.map(x => x.id === p.id ? { ...x, stock: Math.max(0, +e.target.value) } : x))} /></td>
              <td style={S.td}><Badge type="signed">{sold}</Badge></td>
              <td style={S.td}>{prov > 0 ? <Badge type="pending">{prov}</Badge> : <span style={{ color: Cl.txtL }}>—</span>}</td>
              <td style={S.td}>
                <Badge type={dispoReel <= 0 ? "danger" : dispoReel <= 3 ? "pending" : "signed"}>{dispoReel}</Badge>
                {prov > 0 && <div style={{ fontSize: 10, color: dispoSiTous <= 0 ? Cl.err : Cl.warn }}>{dispoSiTous <= 0 ? `⚠️ ${dispoSiTous}` : dispoSiTous} si tout validé</div>}
              </td>
              <td style={S.tdR}><strong>{fmt(caByProd[p.id] || 0)}</strong></td>
              <td style={S.td}>
                <button style={S.btnS("ghost")} onClick={() => setMiniForm({ title: `Modifier — ${p.name}`, fields: [{ key: "name", label: "Nom", value: p.name }, { key: "category", label: "Catégorie", value: p.category, type: "select", options: cats }, { key: "subcategory", label: "Sous-catégorie", value: p.subcategory || "", type: "select", options: ["", ...subcats] }, { key: "productType", label: "Type de produit", value: p.productType || "", type: "select", options: ["", ...productTypes] }, { key: "placement", label: "Emplacement", value: p.placement || "", type: "select", options: ["", ...placements] }, { key: "stock", label: "Stock", value: p.stock, type: "number" }, { key: "price", label: `Prix vente HT (${currentSeason})`, value: pr.price, type: "number" }, { key: "cost", label: "Coût revient", value: pr.cost, type: "number" }, { key: "amort", label: "Amortissement", value: pr.amort || 0, type: "number" }, { key: "tva", label: "TVA %", value: p.tva, type: "number" }, { key: "totalCost", label: "Investissement total", value: p.totalCost || 0, type: "number" }], onSave: (v) => { setProducts(ps => ps.map(x => x.id === p.id ? { ...x, name: v.name || x.name, category: v.category || x.category, subcategory: v.subcategory || "", productType: v.productType || "", placement: v.placement || "", stock: +v.stock, tva: +v.tva, totalCost: +v.totalCost, prices: { ...x.prices, [currentSeason]: { price: +v.price, cost: +v.cost, amort: +v.amort } } } : x)); setMiniForm(null); } })}>✏️</button>
                <button style={S.btnDelete} onClick={() => deleteOne(p.id)}>🗑</button>
              </td>
            </tr>
          ); })}</tbody></table>
      </div>);
    })}
    {showProdF && <ProductFormModal onClose={() => setShowProdF(false)} onAdd={p => { setProducts(ps => [...ps, { ...p, id: uid() }]); setShowProdF(false); }} cats={cats} subcats={subcats} productTypes={productTypes} placements={placements} seasons={seasons} currentSeason={currentSeason} />}
    {showImport && <ImportWizard defaultType="produits" onClose={() => setShowImport(false)} />}
    {showSettings && <ProductSettingsModal onClose={() => setShowSettings(false)} />}
    {confirmDel && <Modal title="🗑 Confirmer la suppression" onClose={() => setConfirmDel(null)}>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Êtes-vous sûr de vouloir supprimer <strong>{confirmDel.label}</strong> ? Cette action est irréversible.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setConfirmDel(null)}>Annuler</button>
        <button style={{ ...S.btn("primary"), background: Cl.err }} onClick={doDelete}>Supprimer</button>
      </div>
    </Modal>}
  </>);
}
