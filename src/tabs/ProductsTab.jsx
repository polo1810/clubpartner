import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, getPrice } from '../data/initialData';
import { Badge, ProductFormModal } from '../components/index';

export default function ProductsTab() {
  const { products, setProducts, cats, seasons, currentSeason, stockSold, caByProd, setMiniForm } = useApp();
  const [showProdF, setShowProdF] = useState(false);

  const totPot = products.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
  const totReal = Object.values(caByProd).reduce((a, b) => a + b, 0);

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>📦 Produits & Stocks</h2>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={S.btn("primary")} onClick={() => setShowProdF(true)}>+ Produit</button>
      </div>
    </div>
    <div style={{ ...S.card, marginTop: 8, ...S.g3 }}>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.txtL }}>{fmt(totPot)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CA potentiel</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.ok }}>{fmt(totReal)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CA réalisé</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pri }}>{totPot > 0 ? ((totReal / totPot) * 100).toFixed(0) : 0}%</div><div style={{ fontSize: 10, color: Cl.txtL }}>Progression</div></div>
    </div>
    {cats.map(cat => {
      const items = products.filter(p => p.category === cat); if (!items.length) return null;
      const pot = items.reduce((t, p) => t + getPrice(p, currentSeason).price * p.stock, 0);
      const real = items.reduce((t, p) => t + (caByProd[p.id] || 0), 0);
      const pct = pot > 0 ? (real / pot) * 100 : 0;
      return (<div key={cat} style={S.card}>
        <div style={S.fx}><div style={S.cT}>{cat}</div><div style={{ fontSize: 11 }}>Pot: <strong>{fmt(pot)}</strong> · Réal: <strong style={{ color: Cl.ok }}>{fmt(real)}</strong> · {pct.toFixed(0)}%</div></div>
        <div style={S.barBox}><div style={S.bar(pct, Cl.ok)} /></div>
        <table style={{ ...S.tbl, marginTop: 8 }}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix HT</th><th style={S.th}>TVA</th><th style={S.th}>Stock</th><th style={S.th}>Vendus</th><th style={S.th}>Dispo</th><th style={S.thR}>CA HT</th><th style={S.th}></th></tr></thead>
          <tbody>{items.map(p => { const pr = getPrice(p, currentSeason); const sold = stockSold[p.id] || 0; const rem = p.stock - sold; return (
            <tr key={p.id}><td style={S.td}><strong>{p.name}</strong>{p.totalCost > 0 && <div style={{ fontSize: 10, color: Cl.txtL }}>Invest: {fmt(p.totalCost)} · Amort: {fmt(pr.amort || 0)}/s</div>}</td><td style={S.td}>{fmt(pr.price)}</td><td style={S.td}>{p.tva}%</td><td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 50, fontSize: 11 }} value={p.stock} onChange={e => setProducts(ps => ps.map(x => x.id === p.id ? { ...x, stock: Math.max(0, +e.target.value) } : x))} /></td><td style={S.td}><Badge type="signed">{sold}</Badge></td><td style={S.td}><Badge type={rem <= 0 ? "danger" : rem <= 3 ? "pending" : "signed"}>{rem}</Badge></td><td style={S.tdR}><strong>{fmt(caByProd[p.id] || 0)}</strong></td>
            <td style={S.td}><button style={S.btnS("ghost")} onClick={() => setMiniForm({ title: `${p.name} — ${currentSeason}`, fields: [{ key: "price", label: "Prix vente HT", value: pr.price, type: "number" }, { key: "cost", label: "Coût revient", value: pr.cost, type: "number" }, { key: "amort", label: "Amortissement", value: pr.amort || 0, type: "number" }, { key: "tva", label: "TVA %", value: p.tva, type: "number" }, { key: "totalCost", label: "Investissement total", value: p.totalCost || 0, type: "number" }], onSave: (v) => { setProducts(ps => ps.map(x => x.id === p.id ? { ...x, tva: +v.tva, totalCost: +v.totalCost, prices: { ...x.prices, [currentSeason]: { price: +v.price, cost: +v.cost, amort: +v.amort } } } : x)); setMiniForm(null); } })}>✏️</button></td></tr>
          ); })}</tbody></table>
      </div>);
    })}
    {showProdF && <ProductFormModal onClose={() => setShowProdF(false)} onAdd={p => { setProducts(ps => [...ps, { ...p, id: uid() }]); setShowProdF(false); }} cats={cats} seasons={seasons} currentSeason={currentSeason} />}
  </>);
}
