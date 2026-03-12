import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, lineHT, lineTTC, isSigned } from '../data/initialData';
import { Badge, Modal, Field, MemberSelect, PhoneLink } from '../components/index';
 
function ContractForm({ initial, onClose }) {
  const { companies, partnersList, products, members, addMember, seasons, currentSeason, contracts, setContracts, getCompany } = useApp();
  const def = { companyId: partnersList[0]?.id || companies[0]?.id, type: "Partenariat", member: members[0], signataire: "", seasons: 1, startSeason: currentSeason, status: "En attente", donAmount: 0, payments: [], actions: [] };
  const [f, setF] = useState({ ...def, ...initial });
  const co = getCompany(f.companyId);
  const isM = f.type === "Mécénat";
  const totHT = (co?.products || []).reduce((t, cp) => t + lineHT(cp), 0);
  const totTTC = (co?.products || []).reduce((t, cp) => { const pr = products.find(x => x.id === cp.productId); return t + lineTTC(cp, pr?.tva); }, 0);
  const ratio = isM && f.donAmount > 0 ? (totHT / f.donAmount) * 100 : 0;
  const ratioOK = !isM || f.donAmount === 0 || ratio <= 25;
  const [payments, setPayments] = useState(initial?.payments || []);
 
  const save = () => {
    const c = { ...f, id: initial?.id || uid(), payments };
    if (initial?.id) setContracts(cs => cs.map(x => x.id === initial.id ? c : x)); else setContracts(cs => [...cs, c]);
    onClose();
  };
 
  return (
    <Modal title={initial?.id ? "Modifier contrat" : `Contrat — ${co?.company || ""}`} onClose={onClose}>
      {co && <div style={S.alert("success")}><strong>{co.company}</strong> · {fmt(totHT)} HT ({co.products?.length || 0} produit(s))</div>}
      <div style={S.g2}>
        <Field label="Entreprise"><select style={S.sel} value={f.companyId} onChange={e => setF({ ...f, companyId: +e.target.value })}>{partnersList.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
        <Field label="Type"><select style={S.sel} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option>Partenariat</option><option>Mécénat</option></select></Field>
        <Field label="Responsable"><MemberSelect value={f.member} onChange={v => setF({ ...f, member: v })} members={members} onAdd={addMember} /></Field>
        <Field label="Signataire"><input style={S.inp} value={f.signataire} onChange={e => setF({ ...f, signataire: e.target.value })} /></Field>
        <Field label="Saisons"><select style={S.sel} value={f.seasons} onChange={e => setF({ ...f, seasons: +e.target.value })}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></Field>
        <Field label="Début"><select style={S.sel} value={f.startSeason} onChange={e => setF({ ...f, startSeason: e.target.value })}>{seasons.map(s => <option key={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Statut"><select style={S.sel} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>
      {isM && <Field label="Montant don"><input type="number" style={S.inp} value={f.donAmount} onChange={e => setF({ ...f, donAmount: +e.target.value })} /></Field>}
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <div style={{ fontSize: 13 }}>HT: <strong>{fmt(totHT)}</strong> · TTC: <strong style={{ color: Cl.pri }}>{fmt(totTTC)}</strong></div>
        <p style={{ fontSize: 10, color: Cl.txtL }}>Produits modifiables depuis la fiche entreprise.</p>
      </div>
      {isM && f.donAmount > 0 && <div style={S.alert(ratioOK ? "success" : "danger")}>{ratioOK ? `✅ ${ratio.toFixed(1)}%` : `⚠️ ${ratio.toFixed(1)}% > 25%`}</div>}
      <div style={{ marginTop: 14 }}><div style={S.fx}><label style={S.lbl}>💳 Échéancier</label><button style={S.btnS("ghost")} onClick={() => { const rem = totTTC - payments.reduce((s, p) => s + p.amount, 0); setPayments(ps => [...ps, { id: uid(), label: `Éch. ${ps.length + 1}`, amount: Math.round(Math.max(0, rem)), dueDate: "", status: "En attente" }]); }}>+</button></div>
        {payments.length === 0 ? <p style={{ fontSize: 11, color: Cl.txtL }}>Paiement en une fois</p>
          : <table style={S.tbl}><thead><tr><th style={S.th}>Libellé</th><th style={S.th}>Montant</th><th style={S.th}>Date</th><th style={S.th}>Statut</th><th style={S.th}></th></tr></thead>
            <tbody>{payments.map(p => (<tr key={p.id}><td style={S.td}><input style={S.inp} value={p.label} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, label: e.target.value } : x))} /></td><td style={S.td}><input type="number" style={{ ...S.inp, width: 80 }} value={p.amount} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, amount: +e.target.value } : x))} /></td><td style={S.td}><input type="date" style={{ ...S.inp, width: 130 }} value={p.dueDate} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, dueDate: e.target.value } : x))} /></td><td style={S.td}><select style={{ ...S.sel, width: "auto" }} value={p.status} onChange={e => setPayments(ps => ps.map(x => x.id === p.id ? { ...x, status: e.target.value } : x))}><option>En attente</option><option>Payé</option><option>En retard</option></select></td><td style={S.td}><button style={S.btnS("ghost")} onClick={() => setPayments(ps => ps.filter(x => x.id !== p.id))}>✕</button></td></tr>))}</tbody></table>}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={S.btn("ghost")} onClick={onClose}>Annuler</button><button style={S.btn("primary")} onClick={save}>Enregistrer</button></div>
    </Modal>
  );
}
 
function ContractDetail({ contract, onClose, onOpenCompany }) {
  const { getCompany, products, contracts, setContracts, openAddContractAction } = useApp();
  const co = getCompany(contract.companyId);
  const totHT = (co?.products || []).reduce((t, cp) => t + lineHT(cp), 0);
  const totTTC = (co?.products || []).reduce((t, cp) => { const pr = products.find(x => x.id === cp.productId); return t + lineTTC(cp, pr?.tva); }, 0);
  const paid = (contract.payments || []).filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
  const upd = (ch) => { const u = { ...contract, ...ch }; setContracts(cs => cs.map(c => c.id === contract.id ? u : c)); };
 
  return (
    <Modal title={`Contrat — ${co?.company || "?"}`} onClose={onClose}>
      <div style={S.g2}>
        <div><span style={S.lbl}>Statut</span><select style={{ ...S.sel, width: "auto" }} value={contract.status} onChange={e => upd({ status: e.target.value })}>{["Brouillon", "En attente", "Signé", "Facturé", "Payé"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><span style={S.lbl}>Type</span><Badge type={contract.type === "Mécénat" ? "mecenat" : "partenariat"}>{contract.type}</Badge></div>
        <div><span style={S.lbl}>Responsable</span>{contract.member}</div>
        <div><span style={S.lbl}>Saisons</span>{contract.seasons} ({contract.startSeason})</div>
      </div>
      {co && <div style={{ marginTop: 10 }}><button style={S.btnS("primary")} onClick={() => { if (onOpenCompany) onOpenCompany(co); onClose(); }}>👁️ Fiche {co.company}</button></div>}
 
      <div style={{ ...S.cT, marginTop: 14 }}>💰 {fmt(totHT)} HT / {fmt(totTTC)} TTC</div>
      <table style={S.tbl}><thead><tr><th style={S.th}>Produit</th><th style={S.th}>Prix</th><th style={S.th}>Qté</th><th style={S.thR}>HT</th></tr></thead>
        <tbody>{(co?.products || []).map(cp => { const pr = products.find(x => x.id === cp.productId); if (!pr) return null; return (<tr key={cp.productId}><td style={S.td}>{pr.name}</td><td style={S.td}>{fmt(cp.unitPrice)}</td><td style={S.td}>{cp.qty}</td><td style={S.tdR}>{fmt(lineHT(cp))}</td></tr>); })}</tbody></table>
 
      <div style={{ ...S.fx, marginTop: 14 }}><div style={S.cT}>💳 Échéancier — {fmt(paid)} / {fmt(totTTC)}</div>
        <button style={S.btnS("primary")} onClick={() => { const rem = totTTC - (contract.payments || []).reduce((s, p) => s + p.amount, 0); upd({ payments: [...(contract.payments || []), { id: uid(), label: `Éch. ${(contract.payments || []).length + 1}`, amount: Math.round(Math.max(0, rem)), dueDate: "", status: "En attente" }] }); }}>+ Échéance</button>
      </div>
      {totTTC > 0 && <div style={S.barBox}><div style={S.bar((paid / totTTC) * 100, Cl.ok)} /></div>}
      {(contract.payments || []).length === 0 ? <p style={{ fontSize: 11, color: Cl.txtL, marginTop: 6 }}>Paiement en une fois — cliquez + pour ajouter des échéances</p>
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
      {(contract.payments || []).length > 0 && (() => { const tp = (contract.payments || []).reduce((s, p) => s + p.amount, 0); const diff = totTTC - tp; return Math.abs(diff) > 1 ? <div style={S.alert("warning")}>{diff > 0 ? `⚠️ Reste ${fmt(diff)} non couvert` : `⚠️ Dépasse de ${fmt(-diff)}`}</div> : null; })()}
 
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
 
export default function ContractsTab({ onOpenCompany }) {
  const { contracts, setContracts, getCompany, contractHT, contractTTC } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editC, setEditC] = useState(null);
  const [viewC, setViewC] = useState(null);
 
  return (<>
    <div style={S.fx}><h2 style={{ fontSize: 16, fontWeight: 700 }}>📝 Contrats</h2>
      <button style={S.btn("primary")} onClick={() => { setEditC(null); setShowForm(true); }}>+ Contrat</button>
    </div>
    <div style={{ marginTop: 8 }}>{contracts.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucun contrat</div>
      : contracts.map(c => {
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
            <div style={{ fontSize: 14, fontWeight: 800, color: Cl.pri }}>{fmt(contractHT(c))} HT</div>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: Cl.txtL, display: "flex", gap: 10 }}>
            <span>👷 {c.member}</span>
            {(c.payments || []).length > 0 && <span>💳 {fmt(paid)}/{fmt(contractTTC(c))}</span>}
            {co && <span onClick={e => e.stopPropagation()}><PhoneLink phone={co.phone} /></span>}
          </div>
        </div>);
      })}</div>
    {showForm && <ContractForm initial={editC} onClose={() => { setShowForm(false); setEditC(null); }} />}
    {viewC && <ContractDetail contract={contracts.find(c => c.id === viewC.id) || viewC} onClose={() => setViewC(null)} onOpenCompany={onOpenCompany} />}
  </>);
}
