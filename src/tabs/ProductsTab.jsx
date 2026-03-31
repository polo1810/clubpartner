import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, getPrice } from '../data/initialData';
import { Badge, ProductFormModal, Modal } from '../components/index';
import ImportWizard from '../components/ImportWizard';

// --- Settings Modal for cats, subcats + placements par catégorie ---
function ProductSettingsModal({ onClose }) {
  const { cats, setCats, subcats, setSubcats, placements, setPlacements } = useApp();
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [newPlaceVals, setNewPlaceVals] = useState({});

  const addCat = () => { if (newCat.trim() && !cats.includes(newCat.trim())) { setCats([...cats, newCat.trim()]); setNewCat(""); } };
  const removeCat = (val) => { if (cats.length > 1) setCats(cats.filter(x => x !== val)); };

  const addSub = () => { if (newSub.trim() && !subcats.includes(newSub.trim())) { setSubcats([...subcats, newSub.trim()]); setNewSub(""); } };
  const removeSub = (val) => setSubcats(subcats.filter(x => x !== val));

  const addPlacement = (cat) => {
    const val = (newPlaceVals[cat] || "").trim();
    if (!val) return;
    const catList = placements[cat] || [];
    if (catList.includes(val)) return;
    setPlacements({ ...placements, [cat]: [...catList, val] });
    setNewPlaceVals({ ...newPlaceVals, [cat]: "" });
  };

  const removePlacement = (cat, val) => {
    setPlacements({ ...placements, [cat]: (placements[cat] || []).filter(x => x !== val) });
  };

  return (
    <Modal title="⚙️ Paramètres Produits & Stocks" onClose={onClose}>
      {/* Catégories */}
      <div style={{ marginBottom: 20 }}>
        <div style={S.sectionTitle}>📁 Catégories</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {cats.map(c => (
            <span key={c} style={S.chip(true)}>
              {c}
              {cats.length > 1 && <button style={{ background: "none", border: "none", cursor: "pointer", color: Cl.err, fontWeight: 700, fontSize: 14, padding: 0, marginLeft: 4 }} onClick={() => removeCat(c)}>×</button>}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={S.inp} placeholder="Ajouter une catégorie..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} />
          <button style={S.btn("primary")} onClick={addCat}>+</button>
        </div>
      </div>

      {/* Sous-catégories (globales) */}
      <div style={{ marginBottom: 20 }}>
        <div style={S.sectionTitle}>📂 Sous-catégories</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {subcats.map(item => (
            <span key={item} style={S.chip(true)}>
              {item}
              <button style={{ background: "none", border: "none", cursor: "pointer", color: Cl.err, fontWeight: 700, fontSize: 14, padding: 0, marginLeft: 4 }} onClick={() => removeSub(item)}>×</button>
            </span>
          ))}
          {subcats.length === 0 && <span style={{ fontSize: 12, color: Cl.txtL }}>Aucun élément</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={S.inp} placeholder="Ajouter une sous-catégorie..." value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()} />
          <button style={S.btn("primary")} onClick={addSub}>+</button>
        </div>
      </div>

      {/* Emplacements par catégorie */}
      <div style={S.sectionTitle}>📍 Emplacements par catégorie</div>
      <div style={{ fontSize: 12, color: Cl.txtL, marginBottom: 10 }}>
        Chaque catégorie a ses propres emplacements.
      </div>

      {cats.map(cat => {
        const catList = placements[cat] || [];
        return (
          <div key={cat} style={{ marginBottom: 14, padding: 12, background: Cl.hov, borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: Cl.pri }}>{cat}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {catList.map(item => (
                <span key={item} style={S.chip(true)}>
                  {item}
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: Cl.err, fontWeight: 700, fontSize: 14, padding: 0, marginLeft: 4 }} onClick={() => removePlacement(cat, item)}>×</button>
                </span>
              ))}
              {catList.length === 0 && <span style={{ fontSize: 11, color: Cl.txtL }}>Aucun emplacement</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...S.inp, fontSize: 12 }}
                placeholder={`Ajouter pour ${cat}...`}
                value={newPlaceVals[cat] || ""}
                onChange={e => setNewPlaceVals({ ...newPlaceVals, [cat]: e.target.value })}
                onKeyDown={e => e.key === "Enter" && addPlacement(cat)}
              />
              <button style={S.btn("primary")} onClick={() => addPlacement(cat)}>+</button>
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button style={S.btn("primary")} onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}

// Helper : récupérer les emplacements d'une catégorie
const getCatPlacements = (placements, cat) => {
  if (!placements || Array.isArray(placements)) return Array.isArray(placements) ? placements : [];
  return placements[cat] || [];
};

// Helper : tous les emplacements (pour bulk edit)
const getAllPlacements = (placements) => {
  if (!placements) return [];
  if (Array.isArray(placements)) return placements;
  const all = new Set();
  Object.values(placements).forEach(arr => (arr || []).forEach(v => all.add(v)));
  return [...all];
};

export default function ProductsTab() {
  const { products, setProducts, cats, subcats, placements, seasons, currentSeason, stockSold, stockProv, caByProd, setMiniForm } = useApp();
  const [showProdF, setShowProdF] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState([]);
  const [collapsed, setCollapsed] = useState({});

  const totPot = products.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
  const totReal = Object.values(caByProd).reduce((a, b) => a + b, 0);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allIds = products.map(p => p.id);
  const allSelected = products.length > 0 && products.every(p => selected.includes(p.id));
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const [confirmDel, setConfirmDel] = useState(null);

  const toggleCollapse = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  const deleteSelected = () => setConfirmDel({ ids: [...selected], label: `${selected.length} produit(s)` });
  const deleteOne = (id) => { const p = products.find(x => x.id === id); setConfirmDel({ ids: [id], label: p?.name || "ce produit" }); };
  const doDelete = () => { setProducts(ps => ps.filter(p => !confirmDel.ids.includes(p.id))); setSelected(s => s.filter(x => !confirmDel.ids.includes(x))); setConfirmDel(null); };

  const allPlc = getAllPlacements(placements);

  const bulkEdit = () => {
    setMiniForm({ title: `Modifier ${selected.length} produit(s)`, fields: [
      { key: "category", label: "Catégorie (vide = ne pas changer)", value: "", type: "select", options: ["", ...cats] },
      { key: "subcategory", label: "Sous-catégorie (vide = ne pas changer)", value: "", type: "select", options: ["", ...subcats] },
      { key: "placement", label: "Emplacement (vide = ne pas changer)", value: "", type: "select", options: ["", ...allPlc] },
      { key: "tva", label: "TVA % (vide = ne pas changer)", value: "", type: "select", options: ["", "20", "10", "5.5", "0"] },
    ], onSave: (v) => {
      setProducts(ps => ps.map(p => {
        if (!selected.includes(p.id)) return p;
        const u = { ...p };
        if (v.category) u.category = v.category;
        if (v.subcategory) u.subcategory = v.subcategory;
        if (v.placement) u.placement = v.placement;
        if (v.tva) u.tva = +v.tva;
        return u;
      }));
      setSelected([]); setMiniForm(null);
    }});
  };

  // --- Regrouper les produits par sous-catégorie ---
  const getSubgroups = (items) => {
    const groups = {};
    items.forEach(p => {
      const sub = p.subcategory || "";
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(p);
    });
    const keys = Object.keys(groups).sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    });
    return keys.map(k => ({ name: k, items: groups[k] }));
  };

  // --- Rendu d'une ligne produit ---
  const renderProductRow = (p) => {
    const pr = getPrice(p, currentSeason);
    const sold = stockSold[p.id] || 0;
    const prov = stockProv[p.id] || 0;
    const dispoReel = p.stock - sold;
    const dispoSiTous = p.stock - sold - prov;
    const isSelected = selected.includes(p.id);
    const details = p.placement || "";
    const pCatPlacements = getCatPlacements(placements, p.category);

    return (
      <tr key={p.id} style={isSelected ? { background: Cl.priL } : {}}>
        <td style={S.td}><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} /></td>
        <td style={S.td}>
          <strong>{p.name}</strong>
          {details && <div style={{ fontSize: 11, color: Cl.txtL }}>{details}</div>}
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
          <button style={S.btnS("ghost")} onClick={() => setMiniForm({ title: `Modifier — ${p.name}`, fields: [{ key: "name", label: "Nom", value: p.name }, { key: "category", label: "Catégorie", value: p.category, type: "select", options: cats }, { key: "subcategory", label: "Sous-catégorie", value: p.subcategory || "", type: "select", options: ["", ...subcats] }, { key: "placement", label: "Emplacement", value: p.placement || "", type: "select", options: ["", ...pCatPlacements] }, { key: "stock", label: "Stock", value: p.stock, type: "number" }, { key: "price", label: `Prix vente HT (${currentSeason})`, value: pr.price, type: "number" }, { key: "cost", label: "Coût revient", value: pr.cost, type: "number" }, { key: "amort", label: "Amortissement", value: pr.amort || 0, type: "number" }, { key: "tva", label: "TVA %", value: p.tva, type: "number" }, { key: "totalCost", label: "Investissement total", value: p.totalCost || 0, type: "number" }], onSave: (v) => { setProducts(ps => ps.map(x => x.id === p.id ? { ...x, name: v.name || x.name, category: v.category || x.category, subcategory: v.subcategory || "", placement: v.placement || "", stock: +v.stock, tva: +v.tva, totalCost: +v.totalCost, prices: { ...x.prices, [currentSeason]: { price: +v.price, cost: +v.cost, amort: +v.amort } } } : x)); setMiniForm(null); } })}>✏️</button>
          <button style={S.btnDelete} onClick={() => deleteOne(p.id)}>🗑</button>
        </td>
      </tr>
    );
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
      const items = products.filter(p => p.category === cat);
      if (!items.length) return null;
      const pot = items.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
      const real = items.reduce((t, p) => t + (caByProd[p.id] || 0), 0);
      const pct = pot > 0 ? (real / pot) * 100 : 0;
      const catKey = `cat:${cat}`;
      const catCollapsed = collapsed[catKey];
      const subgroups = getSubgroups(items);
      const hasSubcats = subgroups.length > 1 || (subgroups.length === 1 && subgroups[0].name !== "");

      return (<div key={cat} style={S.card}>
        <div style={{ ...S.fx, cursor: "pointer", userSelect: "none" }} onClick={() => toggleCollapse(catKey)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: Cl.txtL, transition: "transform 0.2s", transform: catCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
            <div style={S.cT}>{cat}</div>
            <span style={{ fontSize: 12, color: Cl.txtL }}>({items.length} produit{items.length > 1 ? "s" : ""})</span>
          </div>
          <div style={{ fontSize: 12 }}>Pot: <strong>{fmt(pot)}</strong> · Réal: <strong style={{ color: Cl.ok }}>{fmt(real)}</strong> · {pct.toFixed(0)}%</div>
        </div>
        <div style={S.barBox}><div style={S.bar(pct, Cl.ok)} /></div>

        {!catCollapsed && (
          hasSubcats ? (
            subgroups.map(sg => {
              const subKey = `sub:${cat}:${sg.name}`;
              const subCollapsed = collapsed[subKey];
              const subPot = sg.items.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
              const subReal = sg.items.reduce((t, p) => t + (caByProd[p.id] || 0), 0);

              return (
                <div key={sg.name || "__none"} style={{ marginTop: 10 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: Cl.hov, borderRadius: 8, cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleCollapse(subKey)}
                  >
                    <span style={{ fontSize: 11, color: Cl.txtL, transition: "transform 0.2s", transform: subCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: Cl.pri }}>{sg.name || "Sans sous-catégorie"}</span>
                    <span style={{ fontSize: 11, color: Cl.txtL }}>({sg.items.length}) · {fmt(subPot)} pot. · {fmt(subReal)} réal.</span>
                  </div>
                  {!subCollapsed && (
                    <table style={{ ...S.tbl, marginTop: 4 }}>
                      <thead><tr><th style={S.th}></th><th style={S.th}>Produit</th><th style={S.th}>Prix HT</th><th style={S.th}>TVA</th><th style={S.th}>Stock</th><th style={S.th}>Vendus</th><th style={S.th}>Provisoire</th><th style={S.th}>Dispo réel</th><th style={S.thR}>CA HT</th><th style={S.th}></th></tr></thead>
                      <tbody>{sg.items.map(renderProductRow)}</tbody>
                    </table>
                  )}
                </div>
              );
            })
          ) : (
            <table style={{ ...S.tbl, marginTop: 10 }}>
              <thead><tr><th style={S.th}></th><th style={S.th}>Produit</th><th style={S.th}>Prix HT</th><th style={S.th}>TVA</th><th style={S.th}>Stock</th><th style={S.th}>Vendus</th><th style={S.th}>Provisoire</th><th style={S.th}>Dispo réel</th><th style={S.thR}>CA HT</th><th style={S.th}></th></tr></thead>
              <tbody>{items.map(renderProductRow)}</tbody>
            </table>
          )
        )}
      </div>);
    })}

    {showProdF && <ProductFormModal onClose={() => setShowProdF(false)} onAdd={p => { setProducts(ps => [...ps, { ...p, id: uid() }]); setShowProdF(false); }} cats={cats} subcats={subcats} placements={placements} seasons={seasons} currentSeason={currentSeason} />}
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
