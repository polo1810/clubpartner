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

  const entries = [];
  if (!isCerfa) {
    const lib = `${invoice.companyName} - ${invoice.number}`;
    entries.push({ journal: "VT", date: invoice.dateStr, compte: invoice.accountCode, piece: invoice.number, libelle: lib, debit: isAvoir ? 0 : invoice.totalTTC, credit: isAvoir ? invoice.totalTTC : 0 });
    const byTva = {};
    invoice.lines.forEach(l => { byTva[l.tvaRate] = (byTva[l.tvaRate] || 0) + l.tvaAmount; });
    Object.entries(byTva).forEach(([rate, amount]) => {
      if (amount > 0) entries.push({ journal: "VT", date: invoice.dateStr, compte: accountCodes.tva?.[rate] || "44571000", piece: invoice.number, libelle: lib, debit: isAvoir ? Math.round(amount * 100) / 100 : 0, credit: isAvoir ? 0 : Math.round(amount * 100) / 100 });
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
    const avoir = { ...invoice, id: uid(), number: avoirNum, isAvoir: true, avoirDeFacture: invoice.id, date: new Date().toISOString().slice(0, 10), dateStr, status: "Avoir" };
    setInvoices(is => [...is.map(i => i.id === invoice.id ? { ...i, status: "Annulée" } : i), avoir]);
    setShowAvoirConfirm(false); setAvoirConfirmText("");
  };

  return (
    <Modal title={`${isAvoir ? "Avoir" : isCerfa ? "CERFA" : "Facture"} ${invoice.number}`} onClose={onClose}>
      {isAvoir && <div style={S.alert("warning")}>📋 Cet avoir annule la facture {invoice.avoirDeFacture ? invoices.find(i => i.id === invoice.avoirDeFacture)?.number || "" : ""}</div>}
      {isAnnulee && hasAvoir && <div style={S.alert("warning")}>⚠️ Cette facture a été annulée — un avoir a été généré</div>}
      <div style={S.g2}>
        <div><span style={S.lbl}>Entreprise</span><strong>{invoice.companyName}</strong></div>
        <div><span style={S.lbl}>Date</span><input type="date" style={{ ...S.inp, width: 160 }} value={invoice.date} onChange={e => { const d = e.target.value; const parts = d.split("-"); const ds = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : invoice.dateStr; upd({ date: d, dateStr: ds }); }} /></div>
        <div><span style={S.lbl}>Saison</span><Badge type="draft">{invoice.season}</Badge></div>
        <div><span style={S.lbl}>Statut</span><select style={S.paySel(invoice.status === "Payée" ? "Payé" : "En attente")} value={invoice.status} onChange={e => upd({ status: e.target.value })}>{INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>

      {!isCerfa && <>
        <div style={{ ...S.cT, marginTop: 14 }}>📦 Lignes</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>Produit</th><th style={S.th}>Qté</th><th style={S.th}>PU HT</th><th style={S.th}>Total HT</th><th style={S.th}>TVA</th></tr></thead>
          <tbody>{invoice.lines.map((l, i) => (
            <tr key={i}><td style={S.td}>{l.name}</td><td style={S.td}>{l.qty}</td><td style={S.td}>{fmt(l.unitPrice)}</td><td style={S.td}><strong>{fmt(l.totalHT)}</strong></td><td style={S.td}>{fmt(l.tvaAmount)} ({l.tvaRate}%)</td></tr>
          ))}</tbody>
        </table>
        <div style={{ textAlign: "right", marginTop: 8 }}>
          <div style={{ fontSize: 13 }}>HT : {fmt(invoice.totalHT)} · TVA : {fmt(invoice.totalTVA)}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isAvoir ? Cl.err : Cl.pri }}>{isAvoir ? "Avoir" : "TTC"} : {isAvoir ? "-" : ""}{fmt(invoice.totalTTC)}</div>
        </div>
      </>}

      {!isCerfa && payments.length > 0 && <>
        <div style={{ ...S.cT, marginTop: 14 }}>💳 Échéancier lié</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>Libellé</th><th style={S.th}>Montant</th><th style={S.th}>Date</th><th style={S.th}>Statut</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id} style={S.payRow(p.status)}>
              <td style={S.td}>{p.label}</td><td style={S.td}>{fmt(p.amount)}</td><td style={S.td}>{p.dueDate || "—"}</td>
              <td style={S.td}><Badge type={p.status === "Payé" ? "signed" : p.status === "En retard" ? "danger" : "pending"}>{p.status}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ marginTop: 6, fontSize: 13 }}>Encaissé : <strong style={{ color: Cl.ok }}>{fmt(paid)}</strong> / {fmt(invoice.totalTTC)}</div>
        {invoice.totalTTC > 0 && <div style={S.barBox}><div style={S.bar((paid / invoice.totalTTC) * 100, Cl.ok)} /></div>}
      </>}

      {!isCerfa && entries.length > 0 && <>
        <div style={{ ...S.cT, marginTop: 14 }}>📒 Écritures comptables {isAvoir && <span style={{ fontSize: 11, color: Cl.err }}>(inversées)</span>}</div>
        <table style={S.acctTbl}>
          <thead><tr><th style={S.th}>Jnl</th><th style={S.th}>Compte</th><th style={S.th}>Libellé</th><th style={S.th}>Débit</th><th style={S.th}>Crédit</th></tr></thead>
          <tbody>{entries.map((e, i) => (
            <tr key={i}><td style={S.td}>{e.journal}</td><td style={{ ...S.td, fontFamily: "monospace" }}>{e.compte}</td><td style={S.td}>{e.libelle}</td><td style={{ ...S.td, fontWeight: e.debit > 0 ? 700 : 400 }}>{e.debit > 0 ? fmt(e.debit) : ""}</td><td style={{ ...S.td, fontWeight: e.credit > 0 ? 700 : 400 }}>{e.credit > 0 ? fmt(e.credit) : ""}</td></tr>
          ))}</tbody>
        </table>
      </>}

      <div style={{ ...S.fx, marginTop: 16 }}><div style={S.cT}>📋 Actions</div><button style={S.btnS("ghost")} onClick={() => openAddInvoiceAction(invoice.id)}>+</button></div>
      {(invoice.actions || []).map(a => (
        <div key={a.id} style={S.actItem(a.done)}>
          <input type="checkbox" checked={a.done} onChange={() => upd({ actions: invoice.actions.map(x => x.id === a.id ? { ...x, done: !x.done } : x) })} />
          <Badge type={a.category === "Relance" ? "pending" : "draft"}>{a.category}</Badge>
          <strong style={{ flex: 1 }}>{a.type}</strong><span style={{ color: Cl.txtL }}>{a.date}</span><span style={{ color: Cl.pri, fontSize: 11 }}>👤 {a.assignee}</span>
        </div>
      ))}

      {/* Documents */}
      <div style={S.docZone}>
        <div style={S.docZoneTitle}>Documents</div>
        <div style={S.docGrid}>
          {!isCerfa && !isAvoir && <button style={S.btnDocAction(Cl.pri, Cl.priL)} onClick={() => generateFacturePDF(clubInfo, co, invoice)}>📄 Télécharger la facture</button>}
          {isCerfa && <button style={S.btnDocAction(Cl.pur, Cl.purL)} onClick={() => generateCerfa(clubInfo, co, con, invoice, invoice.season)}>🏛️ Télécharger le CERFA</button>}
          {!isCerfa && !isAvoir && !isAnnulee && !hasAvoir && (
            showAvoirConfirm
              ? <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input style={S.inp} placeholder="Tapez AVOIR" value={avoirConfirmText} onChange={e => setAvoirConfirmText(e.target.value.toUpperCase())} />
                  <button style={{ ...S.btn("primary"), background: Cl.err }} disabled={avoirConfirmText !== "AVOIR"} onClick={generateAvoir}>Confirmer</button>
                  <button style={S.btn("ghost")} onClick={() => setShowAvoirConfirm(false)}>✕</button>
                </div>
              : <button style={S.btnDoc} onClick={() => setShowAvoirConfirm(true)}>📋 Générer un avoir</button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function InvoicesTab() {
  const { seasonInvoices, invoices, setInvoices, getCompany, contracts, clubInfo, accountCodes, currentSeason, products } = useApp();
  const [viewInv, setViewInv] = useState(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("Tous");
  const [typeF, setTypeF] = useState("Tous");
  const [showExport, setShowExport] = useState(false);
  const [exportSel, setExportSel] = useState({});
  const [exporting, setExporting] = useState(false);

  const doExportInvoices = async () => {
    const sel = Object.entries(exportSel).filter(([, v]) => v).map(([id]) => id);
    if (sel.length === 0) return;
    setExporting(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const invId of sel) {
        const inv = invoices.find(i => i.id === invId);
        if (!inv) continue;
        const co = getCompany(inv.companyId);
        const con = contracts.find(c => c.id === inv.contractId);
        if (inv.type === "cerfa" && co && con) {
          const cf = await generateCerfa(clubInfo, co, con, inv, inv.season, true);
          if (cf) zip.file(cf.name, cf.blob);
        } else if (!inv.isAvoir && co) {
          const ff = generateFacturePDF(clubInfo, co, inv, true);
          if (ff) zip.file(ff.name, ff.blob);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `Export_Factures_${currentSeason}.zip`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { console.error("Export error:", e); alert("Erreur lors de l'export : " + e.message); }
    setExporting(false);
  };

  const buildAllEntries = () => {
    const allEntries = [];
    seasonInvoices.filter(inv => inv.type !== "cerfa").forEach(inv => {
      const isAv = inv.isAvoir;
      const lib = `${inv.companyName} - ${inv.number}`;
      allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": inv.accountCode, "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? 0 : inv.totalTTC, Crédit: isAv ? inv.totalTTC : 0, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      const byTva = {};
      inv.lines.forEach(l => { byTva[l.tvaRate] = (byTva[l.tvaRate] || 0) + l.tvaAmount; });
      Object.entries(byTva).forEach(([rate, amount]) => {
        if (amount > 0) allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.tva?.[rate] || "44571000", "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? Math.round(amount * 100) / 100 : 0, Crédit: isAv ? 0 : Math.round(amount * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      });
      const byCat = {};
      inv.lines.forEach(l => { byCat[l.category] = (byCat[l.category] || 0) + l.totalHT; });
      Object.entries(byCat).forEach(([cat, ht]) => {
        allEntries.push({ Journal: "VT", "Date d'opération": inv.dateStr, "Numéro de compte": accountCodes.categories?.[cat] || "708XXXXX", "Numéro de pièce": inv.number, Libellé: lib, Débit: isAv ? Math.round(ht * 100) / 100 : 0, Crédit: isAv ? 0 : Math.round(ht * 100) / 100, "Créée par": "", "Modifiée par": "", "Type écriture": "vente_ecriture", "Génération automatique": "True", "Moyen de paiement": "", "Lien du document": "" });
      });
    });
    return allEntries;
  };

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

  const totalTTC = filtered.reduce((t, i) => t + (i.type === "cerfa" ? (i.donAmount || 0) : i.isAvoir ? -i.totalTTC : i.totalTTC), 0);

  return (<>
    <div style={S.fx}>
      <h2 style={S.pageH}>Factures & CERFA</h2>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={S.btn("ghost")} onClick={() => { setExportSel({}); setShowExport(true); }}>📦 Export ZIP</button>
        {seasonInvoices.filter(i => i.type !== "cerfa").length > 0 && <button style={S.btn("ghost")} onClick={() => dlCSV(`Ecritures_comptables_${currentSeason}.csv`, toCSV(buildAllEntries()))}>📤 Export écritures</button>}
      </div>
    </div>
    <div style={S.filterBar}>
      <input style={S.filterInp} placeholder="🔍 Rechercher entreprise, n° facture..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={S.filterSel} value={statusF} onChange={e => setStatusF(e.target.value)}><option>Tous</option><option>Émise</option><option>Payée</option><option>Annulée</option><option>Avoir</option><option>CERFA</option></select>
      <select style={S.filterSel} value={typeF} onChange={e => setTypeF(e.target.value)}><option>Tous</option><option>Partenariat</option><option>Mécénat</option></select>
    </div>

    {/* Mini tableau de bord */}
    {(() => {
      const factures = seasonInvoices.filter(i => i.type !== "cerfa" && !i.isAvoir && i.status !== "Annulée");
      const totalEmis = factures.reduce((t, i) => t + i.totalTTC, 0);
      const totalPaye = factures.filter(i => i.status === "Payée").reduce((t, i) => t + i.totalTTC, 0);
      const reste = totalEmis - totalPaye;
      return <div style={{ ...S.card, marginTop: 10, ...S.g3 }}>
        <div style={S.statCard}><div style={S.statL}>Total émis</div><div style={S.statV(Cl.pri)}>{fmt(totalEmis)}</div></div>
        <div style={S.statCard}><div style={S.statL}>Total payé</div><div style={S.statV(Cl.ok)}>{fmt(totalPaye)}</div></div>
        <div style={S.statCard}><div style={S.statL}>Reste à payer</div><div style={S.statV(reste > 0 ? Cl.warn : Cl.ok)}>{fmt(reste)}</div></div>
      </div>;
    })()}

    {/* Liste — même marginTop: 10 et coCard que partout */}
    <div style={{ marginTop: 10 }}>
      {filtered.length === 0 ? <div style={S.empty}>Aucune facture trouvée</div>
      : filtered.map(inv => {
        const isCerfa = inv.type === "cerfa";
        const isAv = inv.isAvoir;
        const con = contracts.find(c => c.id === inv.contractId);
        const payments = con?.payments || [];
        const paid = payments.filter(p => p.status === "Payé").reduce((s, p) => s + p.amount, 0);
        const late = payments.some(p => p.status === "En retard");
        const borderColor = isAv ? Cl.err : isCerfa ? Cl.pur : inv.status === "Payée" ? Cl.ok : inv.status === "Annulée" ? Cl.txtL : late ? Cl.err : Cl.warn;
        return (
          <div key={inv.id} style={S.coCard(borderColor)} onClick={() => setViewInv(inv)}>
            <div style={S.fx}>
              <div>
                <div style={S.coName}>{inv.companyName}</div>
                <div style={S.coSub}>{inv.number} · {inv.dateStr}{!isCerfa && !isAv ? ` · ${inv.lines.length} ligne${inv.lines.length > 1 ? "s" : ""}` : ""}{!isCerfa && !isAv && payments.length > 0 ? ` · ${fmt(paid)}/${fmt(inv.totalTTC)}` : ""}{isAv ? ` · Annule ${inv.avoirDeFacture ? invoices.find(i => i.id === inv.avoirDeFacture)?.number || "" : ""}` : ""}</div>
              </div>
              <div style={S.coRight}>
                {isAv
                  ? <Badge type="danger">Avoir</Badge>
                  : isCerfa
                  ? <Badge type="mecenat">CERFA</Badge>
                  : <select style={S.inlineStatusSel} value={inv.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); setInvoices(is => is.map(i => i.id === inv.id ? { ...i, status: e.target.value } : i)); }}>{INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                }
                <span style={S.invAmt(isAv ? Cl.err : isCerfa ? Cl.pur : Cl.pri)}>
                  {isAv ? `-${fmt(inv.totalTTC)}` : isCerfa ? fmt(inv.donAmount || inv.totalTTC) : fmt(inv.totalTTC)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {viewInv && <InvoiceDetail invoice={invoices.find(i => i.id === viewInv.id) || viewInv} onClose={() => setViewInv(null)} />}

    {showExport && <Modal title="📦 Export factures (ZIP)" onClose={() => setShowExport(false)}>
      <div style={{ fontSize: 12, color: Cl.txtL, marginBottom: 10 }}>Cochez les factures et CERFA à exporter en PDF. Idéal pour l'archivage comptable ou la facturation électronique.</div>
      <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
        <button style={S.btnS("ghost")} onClick={() => { const all = {}; seasonInvoices.forEach(i => { if (!i.isAvoir) all[i.id] = true; }); setExportSel(all); }}>Tout cocher</button>
        <button style={S.btnS("ghost")} onClick={() => setExportSel({})}>Tout décocher</button>
        <button style={S.btnS("ghost")} onClick={() => { const sel = {}; seasonInvoices.filter(i => i.type !== "cerfa" && !i.isAvoir).forEach(i => { sel[i.id] = true; }); setExportSel(sel); }}>Factures seules</button>
        <button style={S.btnS("ghost")} onClick={() => { const sel = {}; seasonInvoices.filter(i => i.type === "cerfa").forEach(i => { sel[i.id] = true; }); setExportSel(sel); }}>CERFA seuls</button>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {seasonInvoices.filter(i => !i.isAvoir).map(inv => (
          <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${Cl.brd}` }}>
            <input type="checkbox" checked={!!exportSel[inv.id]} onChange={() => setExportSel(s => ({ ...s, [inv.id]: !s[inv.id] }))} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13 }}>{inv.companyName}</strong>
              <span style={{ fontSize: 11, color: Cl.txtL, marginLeft: 6 }}>{inv.number} · {inv.type === "cerfa" ? "CERFA" : "Facture"} · {inv.dateStr}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: inv.type === "cerfa" ? Cl.pur : Cl.pri }}>{fmt(inv.type === "cerfa" ? (inv.donAmount || 0) : inv.totalTTC)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowExport(false)}>Annuler</button>
        <button style={S.btn("primary")} disabled={exporting || Object.values(exportSel).filter(Boolean).length === 0} onClick={doExportInvoices}>{exporting ? "Export en cours..." : `📦 Exporter (${Object.values(exportSel).filter(Boolean).length})`}</button>
      </div>
    </Modal>}
  </>);
}
