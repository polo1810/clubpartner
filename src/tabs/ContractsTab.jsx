import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, lineTTC, isSigned, getPrice, getContractSeasonIds } from '../data/initialData';
import { Badge, Modal, Field, MemberSelect, PhoneLink, ProductPicker } from '../components/index';
import { generateContrat, generateFacturePDF } from '../utils/pdfGenerator';

// --- Shared components ---
function SeasonProductTable({ prods, products: allProducts }) {
  if (!prods || prods.length === 0) return <p style={{ fontSize: 11, color: Cl.txtL }}>Aucun produit pour cette saison</p>;
  const tot = prods.reduce((t, cp) => t + lineHT(cp), 0);
  return (<>
    <table style={S.tbl}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix</th><th style={S.th}>Qté</th><th style={S.thR}>HT</th></tr></thead>
      <tbody>{prods.map(cp => { const pr = allProducts.find(x => x.id === cp.productId); if (!pr) return null; return (<tr key={cp.productId}><td style={S.td}>{pr.name}</td><td style={S.td}>{fmt(cp.unitPrice)}</td><td style={S.td}>{cp.qty}</td><td style={S.tdR}>{fmt(lineHT(cp))}</td></tr>); })}</tbody>
    </table>
    <div style={{ textAlign: "right", marginTop: 4, fontSize: 13, fontWeight: 700, color: Cl.pri }}>Sous-total : {fmt(tot)} HT</div>
  </>);
}

function SeasonTabs({ seasonIds, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
      {seasonIds.map(sid => (
        <button key={sid} style={{ ...S.btnS(active === sid ? "primary" : "ghost"), fontWeight: active === sid ? 700 : 400 }} onClick={() => onChange(sid)}>📅 {sid}</button>
      ))}
    </div>
  );
}

function SeasonProductEditor({ seasonId, prods, setProds, allProducts, cats, currentSeason }) {
  const togP = (id) => {
    const pr = allProducts.find(x => x.id === id);
    const p = getPrice(pr, seasonId).price || getPrice(pr, currentSeason).price || 0;
    setProds(prods.find(x => x.productId === id) ? prods.filter(x => x.productId !== id) : [...prods, { productId: id, qty: 1, unitPrice: p }]);
  };
  const totalHT = prods.reduce((t, sp) => t + lineHT(sp), 0);
  return (<div>
    <ProductPicker products={allProducts} selected={prods} onToggle={togP} cats={cats} currentSeason={seasonId} />
    {prods.length > 0 && <table style={{ ...S.tbl, marginTop: 8 }}>
      <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix conclu</th><th style={S.th}>Qté</th><th style={S.thR}>Total HT</th><th style={S.th}></th></tr></thead>
      <tbody>{prods.map(sp => {
        const pr = allProducts.find(x => x.id === sp.productId);
        if (!pr) return null;
        return (<tr key={sp.productId}>
          <td style={S.td}>{pr.name}</td>
          <td style={S.td}><input type="number" min="0" style={{ ...S.inp, width: 80, fontWeight: 700 }} value={sp.unitPrice} onChange={e => setProds(prods.map(x => x.productId === sp.productId ? { ...x, unitPrice: Math.max(0, +e.target.value) } : x))} /></td>
          <td style={S.td}><input type="number" min="1" style={{ ...S.inp, width: 50 }} value={sp.qty} onChange={e => setProds(prods.map(x => x.productId === sp.productId ? { ...x, qty: Math.max(1, +e.target.value) } : x))} /></td>
          <td style={S.tdR}><strong>{fmt(lineHT(sp))}</strong></td>
          <td style={S.td}><button style={S.btnS("ghost")} onClick={() => setProds(prods.filter(x => x.productId !== sp.productId))}>✕</button></td>
        </tr>);
      })}</tbody>
    </table>}
    {prods.length > 0 && <div style={{ textAlign: "right", marginTop: 4, fontSize: 13, fontWeight: 700, color: Cl.pri }}>Sous-total : {fmt(totalHT)} HT</div>}
  </div>);
}

// --- Contract Form ---
function ContractForm({ initial, onClose }) {
  const { companies, partnersList, products, members, addMember, seasons, currentSeason, contracts, setContracts, getCompany, cats } = useApp();
  const def = { companyId: partnersList[0]?.id || companies[0]?.id, type: "Partenariat", member: members[0], signataire: "", seasons: 1, startSeason: currentSeason, status: "En attente", donAmount: 0, payments: [], actions: [], seasonProducts: {}, seasonDonAmounts: {} };
  const [f, setF] = useState(() => {
    const base = { ...def, ...initial };
    if (!initial?.id) { const co = partnersList[0]; if (co) { base.type = co.dealType || "Partenariat"; base.donAmount = co.donAmount || 0; } }
    return base;
  });
  const co = getCompany(f.companyId);
  const isM = f.type === "Mécénat" || co?.dealType === "Mécénat";

  // Season products
  const [sp, setSp] = useState(() => {
    if (initial?.seasonProducts && Object.keys(initial.seasonProducts).length > 0) return { ...initial.seasonProducts };
    const sids = getContractSeasonIds({ ...f }, seasons);
    const coSP = co?.seasonProducts || {};
    const o = {}; sids.forEach(sid => { o[sid] = coSP[sid] ? coSP[sid].map(p => ({ ...p })) : [...(co?.products || []).map(p => ({ ...p }))]; });
    return o;
  });
  // Season don amounts
  const [sda, setSda] = useState(() => {
    if (initial?.seasonDonAmounts && Object.keys(initial.seasonDonAmounts).length > 0) return { ...initial.seasonDonAmounts };
    const sids = getContractSeasonIds({ ...f }, seasons);
    const coSDA = co?.seasonDonAmounts || {};
    const fb = initial?.donAmount || co?.donAmount || 0;
    const o = {}; sids.forEach(sid => { o[sid] = coSDA[sid] ?? fb; }); return o;
  });

  const coveredSeasons = getContractSeasonIds(f, seasons);
  const [activeSeason, setActiveSeason] = useState(coveredSeasons[0] || currentSeason);

  const ensureSeasons = (nc) => {
    const uSp = { ...sp }; const uSda = { ...sda };
    const coSP = co?.seasonProducts || {}; const coSDA = co?.seasonDonAmounts || {};
    const fb = co?.donAmount || 0;
    nc.forEach(sid => {
      if (!uSp[sid]) uSp[sid] = coSP[sid] ? coSP[sid].map(p => ({ ...p })) : [...(co?.products || []).map(p => ({ ...p }))];
      if (uSda[sid] === undefined) uSda[sid] = coSDA[sid] ?? fb;
    });
    Object.keys(uSp).forEach(sid => { if (!nc.includes(sid)) { delete uSp[sid]; delete uSda[sid]; } });
    setSp(uSp); setSda(uSda);
  };

  const onSeasonsChange = (v) => { const nf = { ...f, seasons: v }; setF(nf); const nc = getContractSeasonIds(nf, seasons); ensureSeasons(nc); if (!nc.includes(activeSeason)) setActiveSeason(nc[0] || currentSeason); };
  const onStartChange = (v) => { const nf = { ...f, startSeason: v }; setF(nf); const nc = getContractSeasonIds(nf, seasons); ensureSeasons(nc); if (!nc.includes(activeSeason)) setActiveSeason(nc[0] || currentSeason); };

  // Per-season calcs
  const sHT = (sid) => (sp[sid] || []).reduce((t, cp) => t + lineHT(cp), 0);
  const sDon = (sid) => sda[sid] || 0;
  const sRatio = (sid) => { const d = sDon(sid); return d > 0 ? (sHT(sid) / d) * 100 : 0; };
  const sOK = (sid) => !isM || sDon(sid) === 0 || sRatio(sid) <= 25;
  const allOK = coveredSeasons.every(sOK);

  const totHT = Object.values(sp).reduce((t, ps) => t + ps.reduce((s, cp) => s + lineHT(cp), 0), 0);
  const totTTC = Object.values(sp).reduce((t, ps) => t + ps.reduce((s, cp) => { const pr = products.find(x => x.id === cp.productId); return s + lineTTC(cp, pr?.tva); }, 0), 0);
  const totDon = Object.values(sda).reduce((t, d) => t + (d || 0), 0);
  const totFacture = isM && totDon > 0 ? totDon : totTTC;
  const [payments, setPayments] = useState(initial?.payments || []);

  const changeCompany = (cid) => {
    const c = getCompany(cid); setF({ ...f, companyId: cid, type: c?.dealType || "Partenariat", donAmount: c?.donAmount || 0 });
    const sids = getContractSeasonIds(f, seasons); const coSP = c?.seasonProducts || {}; const coSDA = c?.seasonDonAmounts || {};
    const o = {}; const od = {};
    sids.forEach(sid => { o[sid] = coSP[sid] ? coSP[sid].map(p => ({ ...p })) : [...(c?.products || []).map(p => ({ ...p }))]; od[sid] = coSDA[sid] ?? (c?.donAmount || 0); });
    setSp(o); setSda(od);
  };
  const copyFrom = (from) => {
    if (sp[from]) setSp({ ...sp, [activeSeason]: sp[from].map(p => ({ ...p })) });
    if (sda[from] !== undefined) setSda({ ...sda, [activeSeason]: sda[from] });
  };
  const save = () => {
    const c = { ...f, id: initial?.id || uid(), payments, donAmount: totDon, seasonProducts: sp, seasonDonAmounts: sda };
    if (initial?.id) setContracts(cs => cs.map(x => x.id === initial.id ? c : x)); else setContracts(cs => [...cs, c]);
    onClose();
  };

  return (
    <Modal title={initial?.id ? "Modifier contrat" : `Contrat — ${co?.company || ""}`} onClose={onClose}>
      {co && <div style={S.alert("success")}><strong>{co.company}</strong> · {isM ? `Don total: ${fmt(totDon)}` : `${fmt(totHT)} HT`} ({coveredSeasons.length} saison{coveredSeasons.length > 1 ? "s" : ""})</div>}
      <div style={S.g2}>
        <Field label="Entreprise"><select style={S.sel} value={f.companyId} onChange={e => changeCompany(+e.target.value)}>{partnersList.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
        <Field label="Type"><select style={S.sel} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option>Partenariat</option><option>Mécénat</option></select></Field>
        <Field label="Responsable"><MemberSelect value={f.member} onChange={v => setF({ ...f, member: v })} members={members} onAdd={addMember} /></Field>
        <Field label="Signataire"><input style={S.inp} value={f.signataire} onChange={e => setF({ ...f, signataire: e.target.value })} /></Field>
        <Field label="Nb saisons"><select style={S.sel} value={f.seasons} onChange={e => onSeasonsChange(+e.target.value)}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></Field>
        <Field label="Début"><select style={S.sel} value={f.startSeason} onChange={e => onStartChange(e.target.value)}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Statut"><select style={S.sel} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>

      {/* Per-season */}
      <div style={{ marginTop: 14 }}>
        <div style={S.cT}>{isM ? "💜 Mécénat par saison" : "📦 Produits par saison"}</div>
        <SeasonTabs seasonIds={coveredSeasons} active={activeSeason} onChange={setActiveSeason} />
        {coveredSeasons.length > 1 && <div style={{ marginBottom: 6, fontSize: 10, color: Cl.txtL }}>
          Copier depuis : {coveredSeasons.filter(s => s !== activeSeason).map(s => (
            <button key={s} style={{ ...S.btnS("ghost"), fontSize: 10, padding: "1px 6px" }} onClick={() => copyFrom(s)}>📋 {s}</button>
          ))}
        </div>}
        {isM && <div style={{ marginBottom: 8, padding: 8, background: Cl.purL, borderRadius: 6, border: `1px solid ${Cl.pur}` }}>
          <label style={{ ...S.lbl, color: Cl.pur }}>💜 Montant du don — {activeSeason}</label>
          <input type="number" style={{ ...S.inp, fontWeight: 700, fontSize: 16 }} value={sda[activeSeason] || 0} onChange={e => setSda({ ...sda, [activeSeason]: Math.max(0, +e.target.value) })} />
          {sDon(activeSeason) > 0 && sHT(activeSeason) > 0 && <div style={S.alert(sOK(activeSeason) ? "success" : "danger")}>{sOK(activeSeason) ? `✅ Contreparties = ${sRatio(activeSeason).toFixed(1)}% du don (max 25%)` : `⚠️ ${sRatio(activeSeason).toFixed(1)}% > 25% !`}</div>}
        </div>}
        <div style={{ fontSize: 11, color: Cl.txtL, marginBottom: 4 }}>{isM ? "Contreparties" : "Produits"} — {activeSeason}</div>
        <SeasonProductEditor seasonId={activeSeason} prods={sp[activeSeason] || []} setProds={(p) => setSp({ ...sp, [activeSeason]: p })} allProducts={products} cats={cats} currentSeason={currentSeason} />
      </div>

      <div style={{ marginTop: 10, textAlign: "right" }}>
        {isM ? <div style={{ fontSize: 13 }}>Don total : <strong style={{ color: Cl.pur }}>{fmt(totDon)}</strong> · Contreparties : {fmt(totHT)} HT</div>
          : <div style={{ fontSize: 13 }}>Total : <strong style={{ color: Cl.pri }}>{fmt(totHT)} HT</strong> · TTC: {fmt(totTTC)}</div>}
      </div>

      <div style={{ marginTop: 14 }}><div style={S.fx}><label style={S.lbl}>💳 Échéancier — base : {fmt(totFacture)}</label><button style={S.btnS("ghost")} onClick={() => { const rem = totFacture - payments.reduce((s, p) => s + p.amount, 0); setPayments(ps => [...ps, { id: uid(), label: `Éch. ${ps.length + 1}`, amount: Math.round(Math.max(0, rem)), dueDate: "", status: "En attente" }]); }}>+</button></div>
        {payments.length === 0 ? <p style={{ fontSize: 11, color: Cl.txtL }}>Paiement en une fois</p>
          : <table style={S.tbl}><thead><tr><th style={S.th}>Libellé</th><th style={S.th}>Montant</th><th style={S.th}>Date</th><th style={S.th}>Statut</th><th style={S.th}></th></tr></thead>
            <tbody>{payments.map(p => (<tr key={p.id}><td style={S.td}><input style={S.inp} value={p.label} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, label: e.target.value } : x))} /></td><td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={p.amount} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, amount: +e.target.value } : x))} /></td><td style={S.td}><input type="date" style={{ ...S.inp, width: 130 }} value={p.dueDate} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, dueDate: e.target.value } : x))} /></td><td style={S.td}><select style={{ ...S.sel, width: "auto" }} value={p.status} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, status: e.target.value } : x))}><option>En attente</option><option>Payé</option><option>En retard</option></select></td><td style={S.td}><button style={S.btnS("ghost")} onClick={() => setPayments(ps => ps.filter(x => x.id !== p.id))}>✕</button></td></tr>))}</tbody></table>}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={onClose}>Annuler</button>
        <button style={{ ...S.btn("primary"), opacity: isM && !allOK ? 0.5 : 1 }} disabled={isM && !allOK} onClick={save}>Enregistrer</button>
      </div>
    </Modal>
  );
}

// --- Contract Detail ---
function ContractDetail({ contract, onClose, onOpenCompany }) {
  const { getCompany, products, contracts, setContracts, openAddContractAction, clubInfo, seasons, currentSeason, contractHT, contractTTC, generateInvoice, invoices } = useApp();
  const co = getCompany(contract.companyId);
  const isM = contract.type === "Mécénat" || co?.dealType === "Mécénat";
  const coveredSeasons = getContractSeasonIds(contract, seasons);
  const hasSP = contract.seasonProducts && Object.keys(contract.seasonProducts).length > 0;
  const sda = contract.seasonDonAmounts || {};
  const donAmount = contract.donAmount || co?.donAmount || 0;

  const prodHT = contractHT(contract);
  const prodTTC = contractTTC(contract);
  const totDon = Object.keys(sda).length > 0 ? Object.values(sda).reduce((t, d) => t + (d || 0), 0) : donAmount;
  const totFacture = isM && totDon > 0 ? totDon : prodTTC;
  const paid = (contract.payments || []).filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
  const upd = (ch) => { const u = { ...contract, ...ch }; setContracts(cs => cs.map(c => c.id === contract.id ? u : c)); };

  const [activeSeason, setActiveSeason] = useState(coveredSeasons[0] || currentSeason);

  // Per-season don for display
  const seasonDon = (sid) => sda[sid] ?? donAmount;
  const seasonHT = (sid) => (contract.seasonProducts?.[sid] || []).reduce((t, cp) => t + lineHT(cp), 0);
  const seasonRatio = (sid) => { const d = seasonDon(sid); return d > 0 ? (seasonHT(sid) / d) * 100 : 0; };

  return (
    <Modal title={`Contrat — ${co?.company || "?"}`} onClose={onClose}>
      <div style={S.g2}>
        <div><span style={S.lbl}>Statut</span><select style={{ ...S.sel, width: "auto" }} value={contract.status} onChange={e => upd({ status: e.target.value })}>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><span style={S.lbl}>Type</span><Badge type={isM ? "mecenat" : "partenariat"}>{isM ? "Mécénat" : "Partenariat"}</Badge></div>
        <div><span style={S.lbl}>Responsable</span>{contract.member}</div>
        <div><span style={S.lbl}>Saisons</span>{contract.seasons} ({coveredSeasons.join(", ")})</div>
      </div>

      {isM && <div style={{ ...S.card, marginTop: 10, border: `2px solid ${Cl.pur}`, background: Cl.purL }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: Cl.pur }}>💜 MÉCÉNAT TOTAL</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: Cl.pur }}>{fmt(totDon)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: Cl.txtL }}>Contreparties : {fmt(prodHT)} HT</div>
          </div>
        </div>
        {coveredSeasons.length > 1 && <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {coveredSeasons.map(sid => {
            const r = seasonRatio(sid);
            return <div key={sid} style={{ fontSize: 10 }}>
              <strong>{sid}</strong>: {fmt(seasonDon(sid))} don · {fmt(seasonHT(sid))} HT
              {seasonDon(sid) > 0 && seasonHT(sid) > 0 && <span style={{ marginLeft: 4, fontWeight: 700, color: r <= 25 ? Cl.ok : Cl.err }}>{r.toFixed(1)}%</span>}
            </div>;
          })}
        </div>}
      </div>}

      {co && <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={S.btnS("primary")} onClick={() => { if (onOpenCompany) onOpenCompany(co); onClose(); }}>👁️ Fiche {co.company}</button>
        <button style={S.btnS("ghost")} onClick={() => generateContrat(clubInfo, co, contract, products, seasons, currentSeason)}>📄 Contrat PDF</button>
        {isSigned(contract) && coveredSeasons.map(sid => {
          const already = invoices.find(i => i.contractId === contract.id && i.season === sid);
          return already
            ? <button key={sid} style={{ ...S.btnS("ghost"), fontSize: 10, color: Cl.ok, padding: "2px 6px" }} onClick={() => generateFacturePDF(clubInfo, co, already)} title="Télécharger la facture">✅ {already.number} 📄</button>
            : <button key={sid} style={S.btnS("primary")} onClick={() => generateInvoice(contract, sid)}>🧾 Facturer {sid}</button>;
        })}
      </div>}

      {/* Products per season */}
      <div style={{ ...S.cT, marginTop: 14 }}>{isM ? "📦 Contreparties" : "💰 Produits"} — {fmt(prodHT)} HT total</div>
      {hasSP && coveredSeasons.length > 1 ? (<>
        <SeasonTabs seasonIds={coveredSeasons} active={activeSeason} onChange={setActiveSeason} />
        {isM && seasonDon(activeSeason) > 0 && <div style={{ fontSize: 11, color: Cl.pur, marginBottom: 4 }}>Don {activeSeason} : <strong>{fmt(seasonDon(activeSeason))}</strong> · Ratio : <strong style={{ color: seasonRatio(activeSeason) <= 25 ? Cl.ok : Cl.err }}>{seasonRatio(activeSeason).toFixed(1)}%</strong></div>}
        <SeasonProductTable prods={contract.seasonProducts[activeSeason] || []} products={products} />
      </>) : hasSP ? (
        <SeasonProductTable prods={contract.seasonProducts[coveredSeasons[0]] || []} products={products} />
      ) : (
        <table style={S.tbl}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix</th><th style={S.th}>Qté</th><th style={S.thR}>HT</th></tr></thead>
          <tbody>{(co?.products || []).map(cp => { const pr = products.find(x => x.id === cp.productId); if (!pr) return null; return (<tr key={cp.productId}><td style={S.td}>{pr.name}</td><td style={S.td}>{fmt(cp.unitPrice)}</td><td style={S.td}>{cp.qty}</td><td style={S.tdR}>{fmt(lineHT(cp))}</td></tr>); })}</tbody></table>
      )}

      <div style={{ ...S.fx, marginTop: 14 }}><div style={S.cT}>💳 Échéancier — {fmt(paid)} / {fmt(totFacture)}</div>
        <button style={S.btnS("primary")} onClick={() => { const rem = totFacture - (contract.payments || []).reduce((s, p) => s + p.amount, 0); upd({ payments: [...(contract.payments || []), { id: uid(), label: `Éch. ${(contract.payments || []).length + 1}`, amount: Math.round(Math.max(0, rem)), dueDate: "", status: "En attente" }] }); }}>+ Échéance</button>
      </div>
      {totFacture > 0 && <div style={S.barBox}><div style={S.bar((paid / totFacture) * 100, Cl.ok)} /></div>}
      {(contract.payments || []).length === 0 ? <p style={{ fontSize: 11, color: Cl.txtL, marginTop: 6 }}>Paiement en une fois</p>
        : <table style={{ ...S.tbl, marginTop: 8 }}>
          <thead><tr><th style={S.th}>Libellé</th><th style={S.th}>Montant</th><th style={S.th}>Date</th><th style={S.th}>Statut</th><th style={S.th}></th></tr></thead>
          <tbody>{(contract.payments || []).map(p => (
            <tr key={p.id} style={p.status === "En retard" ? { background: Cl.errL } : p.status === "Payé" ? { opacity: 0.6 } : {}}>
              <td style={S.td}><input style={{ ...S.inp }} value={p.label} onChange={e => upd({ payments: contract.payments.map(x => x.id === p.id ? { ...x, label: e.target.value } : x) })} /></td>
              <td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={p.amount} onChange={e => upd({ payments: contract.payments.map(x => x.id === p.id ? { ...x, amount: +e.target.value } : x) })} /></td>
              <td style={S.td}><input type="date" style={{ ...S.inp, width: 130 }} value={p.dueDate || ""} onChange={e => upd({ payments: contract.payments.map(x => x.id === p.id ? { ...x, dueDate: e.target.value } : x) })} /></td>
              <td style={S.td}><select style={{ ...S.sel, width: "auto", fontSize: 11, padding: "2px 6px", borderRadius: 12, fontWeight: 600, background: p.status === "Payé" ? Cl.okL : p.status === "En retard" ? Cl.errL : Cl.warnL }} value={p.status} onChange={e => upd({ payments: contract.payments.map(x => x.id === p.id ? { ...x, status: e.target.value } : x) })}><option>En attente</option><option>Payé</option><option>En retard</option></select></td>
              <td style={S.td}><button style={S.btnS("ghost")} onClick={() => upd({ payments: contract.payments.filter(x => x.id !== p.id) })}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>}
      {(contract.payments || []).length > 0 && (() => { const tp = (contract.payments || []).reduce((s, p) => s + p.amount, 0); const diff = totFacture - tp; return Math.abs(diff) > 1 ? <div style={S.alert("warning")}>{diff > 0 ? `⚠️ Reste ${fmt(diff)} non couvert` : `⚠️ Dépasse de ${fmt(-diff)}`}</div> : null; })()}

      <div style={{ ...S.fx, marginTop: 14 }}><div style={S.cT}>📋 Actions</div><button style={S.btnS("ghost")} onClick={() => openAddContractAction(contract.id)}>+</button></div>
      {(contract.actions || []).map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 11, opacity: a.done ? 0.5 : 1 }}>
          <input type="checkbox" checked={a.done} onChange={() => upd({ actions: contract.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) })} />
          <Badge type="draft">{a.category}</Badge><strong>{a.type}</strong><span style={{ color: Cl.txtL }}>{a.date}</span><span style={{ color: Cl.pri, fontSize: 10 }}>👤 {a.assignee}</span>
        </div>
      ))}
    </Modal>
  );
}

// --- Contracts List ---
export default function ContractsTab({ onOpenCompany, directContract, onDirectContractClosed }) {
  const { contracts, setContracts, getCompany, contractHT, contractTTC, seasonContracts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editC, setEditC] = useState(null);
  const [viewC, setViewC] = useState(directContract || null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");

  let filtered = seasonContracts;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(c => { const co = getCompany(c.companyId); return (co?.company || "").toLowerCase().includes(q) || (c.member || "").toLowerCase().includes(q); }); }
  if (statusF !== "Tous") filtered = filtered.filter(c => c.status === statusF);
  if (typeF !== "Tous") filtered = filtered.filter(c => c.type === typeF);

  const deleteContract = (e, cid) => { e.stopPropagation(); if (confirm("Supprimer ce contrat ?")) setContracts(cs => cs.filter(c => c.id !== cid)); };

  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>📝 Contrats ({filtered.length})</h2>
      <button style={S.btn("primary")} onClick={() => { setEditC(null); setShowForm(true); }}>+ Contrat</button>
    </div>
    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
      <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="🔍 Rechercher entreprise, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...S.sel, width: "auto" }} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select>
      <select style={{ ...S.sel, width: "auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>
    <div style={{ marginTop: 8 }}>{filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucun contrat trouvé</div>
      : filtered.map(c => {
        const co = getCompany(c.companyId);
        const paid = (c.payments || []).filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
        return (<div key={c.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setViewC(c)}>
          <div style={S.fx}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <strong>{co?.company || "?"}</strong>
              <Badge type={c.type === "Mécénat" ? "mecenat" : "partenariat"}>{c.type}</Badge>
              {c.seasons > 1 && <Badge type="draft">{c.seasons} sais.</Badge>}
              <select style={{ ...S.sel, width: "auto", fontSize: 10, padding: "2px 6px", borderRadius: 12, fontWeight: 700, background: isSigned(c) ? Cl.okL : c.status === "En attente" ? Cl.warnL : Cl.hov, color: isSigned(c) ? Cl.ok : c.status === "En attente" ? Cl.warn : Cl.txtL }} value={c.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); setContracts(cs => cs.map(x => x.id === c.id ? { ...x, status: e.target.value } : x)); }}>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: Cl.pri }}>{fmt(contractHT(c))} HT</div>
              <button style={{ ...S.btnS("ghost"), color: Cl.err, fontSize: 12, padding: "2px 6px" }} onClick={e => deleteContract(e, c.id)} title="Supprimer">🗑️</button>
            </div>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: Cl.txtL, display: "flex", gap: 10 }}>
            <span>👷 {c.member}</span>
            {(c.payments || []).length > 0 && <span>💳 {fmt(paid)}/{fmt(contractTTC(c))}</span>}
            {co && <span onClick={e => e.stopPropagation()}><PhoneLink phone={co.phone} /></span>}
          </div>
        </div>);
      })}</div>
    {showForm && <ContractForm initial={editC} onClose={() => { setShowForm(false); setEditC(null); }} />}
    {viewC && <ContractDetail contract={contracts.find(c => c.id === viewC.id) || viewC} onClose={() => { setViewC(null); if (onDirectContractClosed) onDirectContractClosed(); }} onOpenCompany={onOpenCompany} />}
  </>);
}
