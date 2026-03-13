import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { fmt, INVOICE_STATUSES, toCSV, dlCSV } from '../data/initialData';
import { Badge, Modal } from '../components/index';
import { generateFacturePDF } from '../utils/pdfGenerator';

function InvoiceDetail({ invoice, onClose }) {
  const { getCompany, contracts, invoices, setInvoices, clubInfo, accountCodes, products } = useApp();
  const co = getCompany(invoice.companyId);
  const con = contracts.find(c => c.id === invoice.contractId);
  const payments = (con?.payments || []);
  const paid = payments.filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
  const upd = (ch) => setInvoices(is => is.map(i => i.id === invoice.id ? { ...i, ...ch } : i));

  // Accounting entries for this invoice
  const entries = [];
  const lib = `${invoice.companyName} - ${invoice.number}`;
  // 1. Debit client TTC
  entries.push({ journal: "VT", date: invoice.dateStr, compte: invoice.accountCode, piece: invoice.number, libelle: lib, debit: invoice.totalTTC, credit: 0 });
  // 2. Credit TVA if any
  if (invoice.totalTVA > 0) {
    entries.push({ journal: "VT", date: invoice.dateStr, compte: accountCodes.tvaCollectee || "44571000", piece: invoice.number, libelle: lib, debit: 0, credit: Math.round(invoice.totalTVA * 100) / 100 });
  }
  // 3. Credit per category
  const byCat = {};
  invoice.lines.forEach(l => { byCat[l.category] = (byCat[l.category] || 0) + l.totalHT; });
  Object.entries(byCat).forEach(([cat, ht]) => {
    const compte = accountCodes.categories?.[cat] || "708XXXXX";
    entries.push({ journal: "VT", date: invoice.dateStr, compte, piece: invoice.number, libelle: lib, debit: 0, credit: Math.round(ht * 100) / 100 });
  });

  return (
    <Modal title={`Facture ${invoice.number}`} onClose={onClose}>
      <div style={S.g2}>
        <div><span style={S.lbl}>Entreprise</span><strong>{invoice.companyName}</strong></div>
        <div><span style={S.lbl}>Date de facturation</span><input type="date" style={{ ...S.inp, width: 160 }} value={invoice.date} onChange={e => { const d = e.target.value; const parts = d.split("-"); const ds = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : invoice.dateStr; upd({ date: d, dateStr: ds }); }} /></div>
        <div><span style={S.lbl}>Saison</span><Badge type="draft">{invoice.season}</Badge></div>
        <div><span style={S.lbl}>Statut</span><select style={{ ...S.sel, width: "auto" }} value={invoice.status} onChange={e => upd({ status: e.target.value })}>{INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>

      {/* Lines */}
      <div style={{ ...S.cT, marginTop: 12 }}>📦 Lignes</div>
      <table style={S.tbl}>
        <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Qté</th><th style={S.th}>PU HT</th><th style={S.th}>Total HT</th><th style={S.th}>TVA</th></tr></thead>
        <tbody>{invoice.lines.map((l, i) => (
          <tr key={i}><td style={S.td}>{l.name}</td><td style={S.td}>{l.qty}</td><td style={S.td}>{fmt(l.unitPrice)}</td><td style={S.td}><strong>{fmt(l.totalHT)}</strong></td><td style={S.td}>{fmt(l.tvaAmount)} ({l.tvaRate}%)</td></tr>
        ))}</tbody>
      </table>
      <div style={{ textAlign: "right", marginTop: 6 }}>
        <div style={{ fontSize: 12 }}>HT : {fmt(invoice.totalHT)} · TVA : {fmt(invoice.totalTVA)}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: Cl.pri }}>TTC : {fmt(invoice.totalTTC)}</div>
      </div>

      {/* Payments link */}
      {payments.length > 0 && <>
        <div style={{ ...S.cT, marginTop: 12 }}>💳 Échéancier lié</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>Libellé</th><th style={S.th}>Montant</th><th style={S.th}>Date</th><th style={S.th}>Statut</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id} style={p.status === "En retard" ? { background: Cl.errL } : p.status === "Payé" ? { opacity: 0.6 } : {}}>
              <td style={S.td}>{p.label}</td><td style={S.td}>{fmt(p.amount)}</td><td style={S.td}>{p.dueDate || "—"}</td>
              <td style={S.td}><Badge type={p.status === "Payé" ? "signed" : p.status === "En retard" ? "danger" : "pending"}>{p.status}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ marginTop: 4, fontSize: 12 }}>Encaissé : <strong style={{ color: Cl.ok }}>{fmt(paid)}</strong> / {fmt(invoice.totalTTC)}</div>
        {invoice.totalTTC > 0 && <div style={S.barBox}><div style={S.bar((paid / invoice.totalTTC) * 100, Cl.ok)} /></div>}
      </>}

      {/* Écritures comptables */}
      <div style={{ ...S.cT, marginTop: 12 }}>📒 Écritures comptables</div>
      <table style={{ ...S.tbl, fontSize: 10 }}>
        <thead><tr><th style={S.th}>Jnl</th><th style={S.th}>Compte</th><th style={S.th}>Libellé</th><th style={S.th}>Débit</th><th style={S.th}>Crédit</th></tr></thead>
        <tbody>{entries.map((e, i) => (
          <tr key={i}><td style={S.td}>{e.journal}</td><td style={{ ...S.td, fontFamily: "monospace" }}>{e.compte}</td><td style={S.td}>{e.libelle}</td><td style={{ ...S.td, fontWeight: e.debit > 0 ? 700 : 400 }}>{e.debit > 0 ? fmt(e.debit) : ""}</td><td style={{ ...S.td, fontWeight: e.credit > 0 ? 700 : 400 }}>{e.credit > 0 ? fmt(e.credit) : ""}</td></tr>
        ))}</tbody>
      </table>

      {/* Buttons */}
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={S.btn("primary")} onClick={() => generateFacturePDF(clubInfo, co, invoice)}>📄 Télécharger la facture PDF</button>
        <button style={S.btn("ghost")} onClick={() => {
          const rows = entries.map(e => ({ Journal: e.journal, "Date d'opération": e.date, "Numéro de compte": e.compte, "Numéro de pièce": e.piece, Libellé: e.libelle, Débit: e.debit || "", Crédit: e.credit || "" }));
          dlCSV(`Ecritures_${invoice.number}.csv`, toCSV(rows));
        }}>📤 Export écritures CSV</button>
      </div>
    </Modal>
  );
}

export default function InvoicesTab() {
  const { seasonInvoices, invoices, setInvoices, getCompany, contracts, clubInfo, accountCodes, currentSeason } = useApp();
  const [viewInv, setViewInv] = useState(null);

  // Build all entries for Excel export
  const buildAllEntries = () => {
    const allEntries = [];
    seasonInvoices.forEach(inv => {
      const lib = `${inv.companyName} - ${inv.number}`;
      allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": inv.accountCode, "Numéro de pièce": inv.number, Libellé: lib, Débit: inv.totalTTC, Crédit: 0, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      if (inv.totalTVA > 0) {
        allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.tvaCollectee || "44571000", "Numéro de pièce": inv.number, Libellé: lib, Débit: 0, Crédit: Math.round(inv.totalTVA * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      }
      const byCat = {};
      inv.lines.forEach(l => { byCat[l.category] = (byCat[l.category] || 0) + l.totalHT; });
      Object.entries(byCat).forEach(([cat, ht]) => {
        allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.categories?.[cat] || "708XXXXX", "Numéro de pièce": inv.number, Libellé: lib, Débit: 0, Crédit: Math.round(ht * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      });
    });
    return allEntries;
  };

  const totalHT = seasonInvoices.reduce((t, i) => t + i.totalHT, 0);
  const totalTTC = seasonInvoices.reduce((t, i) => t + i.totalTTC, 0);
  const nbPaid = seasonInvoices.filter(i => i.status === "Payée").length;

  return (<>
    <div style={S.fx}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>🧾 Factures</h2>
      <div style={{ display: "flex", gap: 4 }}>
        {seasonInvoices.length > 0 && <>
          <button style={S.btn("ghost")} onClick={() => dlCSV(`Ecritures_comptables_${currentSeason}.csv`, toCSV(buildAllEntries()))}>📤 Export écritures</button>
        </>}
      </div>
    </div>

    {/* Stats */}
    {seasonInvoices.length > 0 && <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pri }}>{seasonInvoices.length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Factures</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.ok }}>{nbPaid}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Payées</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(totalHT)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Total HT</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pri }}>{fmt(totalTTC)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Total TTC</div></div>
    </div>}

    {/* List */}
    <div style={{ marginTop: 8 }}>
      {seasonInvoices.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucune facture pour cette saison. Générez-les depuis les contrats signés.</div>
      : seasonInvoices.map(inv => {
        const con = contracts.find(c => c.id === inv.contractId);
        const payments = con?.payments || [];
        const paid = payments.filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
        const late = payments.some(p => p.status === "En retard");
        return (
          <div key={inv.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${inv.status === "Payée" ? Cl.ok : late ? Cl.err : inv.status === "Annulée" ? Cl.txtL : Cl.warn}` }} onClick={() => setViewInv(inv)}>
            <div style={S.fx}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{inv.number}</strong>
                <strong>{inv.companyName}</strong>
                <Badge type={inv.status === "Payée" ? "signed" : inv.status === "Annulée" ? "draft" : late ? "danger" : "pending"}>{late && inv.status !== "Payée" ? "⚠️ Retard" : inv.status}</Badge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: Cl.pri }}>{fmt(inv.totalTTC)}</div>
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: Cl.txtL, display: "flex", gap: 10 }}>
              <span>📅 {inv.dateStr}</span>
              <span>📦 {inv.lines.length} ligne{inv.lines.length > 1 ? "s" : ""}</span>
              {payments.length > 0 && <span>💳 {fmt(paid)} / {fmt(inv.totalTTC)}</span>}
            </div>
          </div>
        );
      })}
    </div>

    {viewInv && <InvoiceDetail invoice={invoices.find(i => i.id === viewInv.id) || viewInv} onClose={() => setViewInv(null)} />}
  </>);
}
