import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid, fmt, INVOICE_STATUSES, toCSV, dlCSV } from '../data/initialData';
import { Badge, Modal } from '../components/index';
import { generateFacturePDF, generateCerfa } from '../utils/pdfGenerator';

function InvoiceDetail({ invoice, onClose }) {
  const { getCompany, contracts, invoices, setInvoices, clubInfo, accountCodes, products, openAddInvoiceAction } = useApp();
  const co = getCompany(invoice.companyId);
  const con = contracts.find(c => c.id === invoice.contractId);
  const payments = (con?.payments || []);
  const paid = payments.filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
  const upd = (ch) => setInvoices(is => is.map(i => i.id === invoice.id ? { ...i, ...ch } : i));
  const isAvoir = invoice.isAvoir;
  const isCerfa = invoice.type === "cerfa";
  const isAnnulee = invoice.status === "Annulée";
  const hasAvoir = invoices.some(i => i.avoirDeFacture === invoice.id);
  const [showAvoirConfirm, setShowAvoirConfirm] = useState(false);
  const [avoirConfirmText, setAvoirConfirmText] = useState("");

  // Accounting entries (reversed for avoir)
  const entries = [];
  if (!isCerfa) {
    const lib = `${invoice.companyName} - ${invoice.number}`;
    entries.push({ journal: "VT", date: invoice.dateStr, compte: invoice.accountCode, piece: invoice.number, libelle: lib, debit: isAvoir ? 0 : invoice.totalTTC, credit: isAvoir ? invoice.totalTTC : 0 });
    const byTva = {};
    invoice.lines.forEach(l => { byTva[l.tvaRate] = (byTva[l.tvaRate] || 0) + l.tvaAmount; });
    Object.entries(byTva).forEach(([rate, amount]) => {
      if (amount > 0) {
        entries.push({ journal: "VT", date: invoice.dateStr, compte: accountCodes.tva?.[rate] || "44571000", piece: invoice.number, libelle: lib, debit: isAvoir ? Math.round(amount * 100) / 100 : 0, credit: isAvoir ? 0 : Math.round(amount * 100) / 100 });
      }
    });
    const byCat = {};
    invoice.lines.forEach(l => { byCat[l.category] = (byCat[l.category] || 0) + l.totalHT; });
    Object.entries(byCat).forEach(([cat, ht]) => {
      entries.push({ journal: "VT", date: invoice.dateStr, compte: accountCodes.categories?.[cat] || "708XXXXX", piece: invoice.number, libelle: lib, debit: isAvoir ? Math.round(ht * 100) / 100 : 0, credit: isAvoir ? 0 : Math.round(ht * 100) / 100 });
    });
  }

  const generateAvoir = () => {
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const avoirNum = invoice.number.replace("FA-", "AV-");
    const avoir = {
      ...invoice,
      id: uid(),
      number: avoirNum,
      isAvoir: true,
      avoirDeFacture: invoice.id,
      date: new Date().toISOString().slice(0, 10),
      dateStr,
      status: "Avoir",
    };
    setInvoices(is => [...is.map(i => i.id === invoice.id ? { ...i, status: "Annulée" } : i), avoir]);
    setShowAvoirConfirm(false);
    setAvoirConfirmText("");
  };

  return (
    <Modal title={`${isAvoir ? "Avoir" : isCerfa ? "CERFA" : "Facture"} ${invoice.number}`} onClose={onClose}>
      {isAvoir && <div style={{ ...S.alert("warning"), marginBottom: 8 }}>📋 Cet avoir annule la facture {invoice.avoirDeFacture ? invoices.find(i => i.id === invoice.avoirDeFacture)?.number || "" : ""}</div>}
      {isAnnulee && hasAvoir && <div style={{ ...S.alert("warning"), marginBottom: 8 }}>⚠️ Cette facture a été annulée — un avoir a été généré</div>}
      <div style={S.g2}>
        <div><span style={S.lbl}>Entreprise</span><strong>{invoice.companyName}</strong></div>
        <div><span style={S.lbl}>Date</span><input type="date" style={{ ...S.inp, width: 160 }} value={invoice.date} onChange={e => { const d = e.target.value; const parts = d.split("-"); const ds = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : invoice.dateStr; upd({ date: d, dateStr: ds }); }} /></div>
        <div><span style={S.lbl}>Saison</span><Badge type="draft">{invoice.season}</Badge></div>
        <div><span style={S.lbl}>Statut</span><select style={{ ...S.sel, width: "auto" }} value={invoice.status} onChange={e => upd({ status: e.target.value })}>{INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>

      {/* Lines */}
      {!isCerfa && <>
        <div style={{ ...S.cT, marginTop: 12 }}>📦 Lignes</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Qté</th><th style={S.th}>PU HT</th><th style={S.th}>Total HT</th><th style={S.th}>TVA</th></tr></thead>
          <tbody>{invoice.lines.map((l, i) => (
            <tr key={i}><td style={S.td}>{l.name}</td><td style={S.td}>{l.qty}</td><td style={S.td}>{fmt(l.unitPrice)}</td><td style={S.td}><strong>{fmt(l.totalHT)}</strong></td><td style={S.td}>{fmt(l.tvaAmount)} ({l.tvaRate}%)</td></tr>
          ))}</tbody>
        </table>
        <div style={{ textAlign: "right", marginTop: 6 }}>
          <div style={{ fontSize: 12 }}>HT : {fmt(invoice.totalHT)} · TVA : {fmt(invoice.totalTVA)}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: isAvoir ? Cl.err : Cl.pri }}>{isAvoir ? "Avoir" : "TTC"} : {isAvoir ? "-" : ""}{fmt(invoice.totalTTC)}</div>
        </div>
      </>}

      {/* Payments */}
      {!isCerfa && payments.length > 0 && <>
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
      {!isCerfa && entries.length > 0 && <>
        <div style={{ ...S.cT, marginTop: 12 }}>📒 Écritures comptables {isAvoir && <span style={{ fontSize: 10, color: Cl.err }}>(inversées)</span>}</div>
        <table style={{ ...S.tbl, fontSize: 10 }}>
          <thead><tr><th style={S.th}>Jnl</th><th style={S.th}>Compte</th><th style={S.th}>Libellé</th><th style={S.th}>Débit</th><th style={S.th}>Crédit</th></tr></thead>
          <tbody>{entries.map((e, i) => (
            <tr key={i}><td style={S.td}>{e.journal}</td><td style={{ ...S.td, fontFamily: "monospace" }}>{e.compte}</td><td style={S.td}>{e.libelle}</td><td style={{ ...S.td, fontWeight: e.debit > 0 ? 700 : 400 }}>{e.debit > 0 ? fmt(e.debit) : ""}</td><td style={{ ...S.td, fontWeight: e.credit > 0 ? 700 : 400 }}>{e.credit > 0 ? fmt(e.credit) : ""}</td></tr>
          ))}</tbody>
        </table>
      </>}

      {/* Actions */}
      <div style={{ ...S.fx, marginTop: 14 }}><div style={S.cT}>📋 Actions</div><button style={S.btnS("ghost")} onClick={() => openAddInvoiceAction(invoice.id)}>+</button></div>
      {(invoice.actions || []).map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 11, opacity: a.done ? 0.5 : 1 }}>
          <input type="checkbox" checked={a.done} onChange={() => upd({ actions: invoice.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) })} />
          <Badge type="draft">{a.category}</Badge><strong>{a.type}</strong><span style={{ color: Cl.txtL }}>{a.date}</span>
        </div>
      ))}

      {/* Buttons */}
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {isCerfa ? (
          <button style={{ ...S.btn("primary"), background: Cl.pur }} onClick={() => generateCerfa(clubInfo, co, con, invoice, invoice.season)}>🏛️ Télécharger le CERFA mécénat</button>
        ) : (<>
          <button style={S.btn("primary")} onClick={() => generateFacturePDF(clubInfo, co, invoice)}>📄 Télécharger {isAvoir ? "l'avoir" : "la facture"} PDF</button>
          <button style={S.btn("ghost")} onClick={() => {
            const rows = entries.map(e => ({ Journal: e.journal, "Date d'opération": e.date, "Numéro de compte": e.compte, "Numéro de pièce": e.piece, Libellé: e.libelle, Débit: e.debit || "", Crédit: e.credit || "" }));
            dlCSV(`Ecritures_${invoice.number}.csv`, toCSV(rows));
          }}>📤 Export écritures CSV</button>
        </>)}
      </div>

      {/* --- AVOIR SECTION --- */}
      {!isCerfa && !isAvoir && !isAnnulee && !hasAvoir && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${Cl.brd}`, paddingTop: 12 }}>
          {!showAvoirConfirm ? (
            <button style={{ ...S.btn("ghost"), color: Cl.err, width: "100%" }} onClick={() => setShowAvoirConfirm(true)}>📋 Générer un avoir (annuler cette facture)</button>
          ) : (
            <div style={{ background: Cl.errL, padding: 12, borderRadius: 8, border: `2px solid ${Cl.err}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: Cl.err, marginBottom: 6 }}>📋 Générer un avoir</div>
              <div style={{ fontSize: 11, marginBottom: 4 }}>Cette action va :</div>
              <div style={{ fontSize: 11, marginBottom: 2 }}>• Passer cette facture en statut <strong>"Annulée"</strong></div>
              <div style={{ fontSize: 11, marginBottom: 2 }}>• Créer un document d'avoir <strong>{invoice.number.replace("FA-", "AV-")}</strong></div>
              <div style={{ fontSize: 11, marginBottom: 8 }}>• Générer les <strong>écritures comptables inversées</strong> (débits ↔ crédits)</div>
              <div style={{ fontSize: 11, color: Cl.err, marginBottom: 8 }}>Tapez <strong>AVOIR</strong> pour confirmer.</div>
              <input style={{ ...S.inp, borderColor: Cl.err, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 2 }} value={avoirConfirmText} onChange={e => setAvoirConfirmText(e.target.value.toUpperCase())} placeholder="Tapez AVOIR" autoFocus />
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
                <button style={S.btn("ghost")} onClick={() => { setShowAvoirConfirm(false); setAvoirConfirmText(""); }}>Annuler</button>
                <button style={{ ...S.btn("primary"), background: Cl.err, opacity: avoirConfirmText === "AVOIR" ? 1 : 0.3 }} disabled={avoirConfirmText !== "AVOIR"} onClick={generateAvoir}>📋 Confirmer l'avoir</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function InvoicesTab() {
  const { seasonInvoices, invoices, setInvoices, getCompany, contracts, clubInfo, accountCodes, currentSeason } = useApp();
  const [viewInv, setViewInv] = useState(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");

  // Build all entries for Excel export (includes avoirs with reversed entries)
  const buildAllEntries = () => {
    const allEntries = [];
    seasonInvoices.filter(inv => inv.type !== "cerfa").forEach(inv => {
      const isAv = inv.isAvoir;
      const lib = `${inv.companyName} - ${inv.number}`;
      allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": inv.accountCode, "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? 0 : inv.totalTTC, Crédit: isAv ? inv.totalTTC : 0, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      const byTva = {};
      inv.lines.forEach(l => { byTva[l.tvaRate] = (byTva[l.tvaRate] || 0) + l.tvaAmount; });
      Object.entries(byTva).forEach(([rate, amount]) => {
        if (amount > 0) {
          allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.tva?.[rate] || "44571000", "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? Math.round(amount * 100) / 100 : 0, Crédit: isAv ? 0 : Math.round(amount * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
        }
      });
      const byCat = {};
      inv.lines.forEach(l => { byCat[l.category] = (byCat[l.category] || 0) + l.totalHT; });
      Object.entries(byCat).forEach(([cat, ht]) => {
        allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.categories?.[cat] || "708XXXXX", "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? Math.round(ht * 100) / 100 : 0, Crédit: isAv ? 0 : Math.round(ht * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      });
    });
    return allEntries;
  };

  // Filtered list
  let filtered = seasonInvoices;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(i => (i.companyName || "").toLowerCase().includes(q) || (i.number || "").toLowerCase().includes(q)); }
  if (statusF !== "Tous") {
    if (statusF === "CERFA") filtered = filtered.filter(i => i.type === "cerfa");
    else if (statusF === "Avoir") filtered = filtered.filter(i => i.isAvoir);
    else filtered = filtered.filter(i => i.type !== "cerfa" && !i.isAvoir && i.status === statusF);
  }
  if (typeF !== "Tous") {
    filtered = filtered.filter(i => {
      const con = contracts.find(c => c.id === i.contractId);
      if (typeF === "Partenariat") return i.type !== "cerfa" && con?.type !== "Mécénat";
      if (typeF === "Mécénat") return i.type === "cerfa" || con?.type === "Mécénat";
      return true;
    });
  }

  const totalHT = filtered.filter(i => i.type !== "cerfa" && !i.isAvoir).reduce((t, i) => t + i.totalHT, 0);
  const totalTTC = filtered.reduce((t, i) => t + (i.type === "cerfa" ? (i.donAmount || 0) : i.isAvoir ? -i.totalTTC : i.totalTTC), 0);
  const nbPaid = filtered.filter(i => i.type !== "cerfa" && !i.isAvoir && i.status === "Payée").length;

  return (<>
    <div style={S.fx}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>🧾 Factures & CERFA</h2>
      <div style={{ display: "flex", gap: 4 }}>
        {seasonInvoices.filter(i => i.type !== "cerfa").length > 0 && <button style={S.btn("ghost")} onClick={() => dlCSV(`Ecritures_comptables_${currentSeason}.csv`, toCSV(buildAllEntries()))}>📤 Export écritures</button>}
      </div>
    </div>
    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
      <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="🔍 Rechercher entreprise, n° facture..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...S.sel, width: "auto" }} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option><option>Émise</option><option>Payée</option><option>Annulée</option><option>Avoir</option><option>CERFA</option></select>
      <select style={{ ...S.sel, width: "auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>

    {/* Stats */}
    {filtered.length > 0 && <div style={{ ...S.card, ...S.g4 }}>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pri }}>{filtered.filter(i => i.type !== "cerfa" && !i.isAvoir).length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Factures</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pur }}>{filtered.filter(i => i.type === "cerfa").length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>CERFA</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.err }}>{filtered.filter(i => i.isAvoir).length}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Avoirs</div></div>
      <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 800, color: Cl.pri }}>{fmt(totalTTC)}</div><div style={{ fontSize: 10, color: Cl.txtL }}>Net</div></div>
    </div>}

    {/* List */}
    <div style={{ marginTop: 8 }}>
      {filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: Cl.txtL }}>Aucune facture trouvée</div>
      : filtered.map(inv => {
        const isCerfa = inv.type === "cerfa";
        const isAv = inv.isAvoir;
        const con = contracts.find(c => c.id === inv.contractId);
        const payments = con?.payments || [];
        const paid = payments.filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
        const late = payments.some(p => p.status === "En retard");
        const borderColor = isAv ? Cl.err : isCerfa ? Cl.pur : inv.status === "Payée" ? Cl.ok : inv.status === "Annulée" ? Cl.txtL : late ? Cl.err : Cl.warn;
        return (
          <div key={inv.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${borderColor}` }} onClick={() => setViewInv(inv)}>
            <div style={S.fx}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <strong style={{ fontFamily: "monospace", fontSize: 12, color: isAv ? Cl.err : isCerfa ? Cl.pur : "inherit" }}>{inv.number}</strong>
                <strong>{inv.companyName}</strong>
                {isAv
                  ? <Badge type="danger">📋 Avoir</Badge>
                  : isCerfa
                  ? <Badge type="mecenat">🏛️ CERFA</Badge>
                  : <Badge type={inv.status === "Payée" ? "signed" : inv.status === "Annulée" ? "draft" : late ? "danger" : "pending"}>{late && inv.status !== "Payée" ? "⚠️ Retard" : inv.status}</Badge>
                }
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isAv ? Cl.err : isCerfa ? Cl.pur : Cl.pri }}>
                {isAv ? `-${fmt(inv.totalTTC)}` : isCerfa ? `Don: ${fmt(inv.donAmount || inv.totalTTC)}` : fmt(inv.totalTTC)}
              </div>
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: Cl.txtL, display: "flex", gap: 10 }}>
              <span>📅 {inv.dateStr}</span>
              {!isCerfa && !isAv && <span>📦 {inv.lines.length} ligne{inv.lines.length > 1 ? "s" : ""}</span>}
              {!isCerfa && !isAv && payments.length > 0 && <span>💳 {fmt(paid)} / {fmt(inv.totalTTC)}</span>}
              {isAv && <span>↩️ Annule {inv.avoirDeFacture ? invoices.find(i => i.id === inv.avoirDeFacture)?.number || "" : ""}</span>}
            </div>
          </div>
        );
      })}
    </div>

    {viewInv && <InvoiceDetail invoice={invoices.find(i => i.id === viewInv.id) || viewInv} onClose={() => setViewInv(null)} />}
  </>);
}
