import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, lineHT, getPrice, getContractSeasonIds, numberToFrench } from '../data/initialData';

const fmtN = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fmtE = (n) => fmtN(n) + " €";
const today = () => new Date().toLocaleDateString("fr-FR");
const devisNum = () => `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const contratNum = () => `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

function addHeader(doc, club, title, num, customDate) {
  // Club info (left)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(club.name || "Club", 20, 25);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  let y = 32;
  if (club.address) { doc.text(club.address, 20, y); y += 4; }
  if (club.phone) { doc.text("Tél : " + club.phone, 20, y); y += 4; }
  if (club.email) { doc.text(club.email, 20, y); y += 4; }
  if (club.siret) { doc.text("SIRET : " + club.siret, 20, y); y += 4; }
  if (club.tvaNumber) { doc.text("TVA : " + club.tvaNumber, 20, y); y += 4; }

  // Title + num + date (right)
  doc.setTextColor(0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 190, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${num}`, 190, 32, { align: "right" });
  doc.text(`Date : ${customDate || today()}`, 190, 37, { align: "right" });

  // Line
  doc.setDrawColor(30, 115, 232);
  doc.setLineWidth(0.8);
  doc.line(20, y + 4, 190, y + 4);
  return y + 10;
}

function addCompanyBlock(doc, co, startY) {
  let y = startY;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(110, y - 4, 80, 32, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("DESTINATAIRE", 112, y + 1);
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(co.company || "", 112, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let dy = y + 12;
  if (co.contact) { doc.text(co.contact, 112, dy); dy += 4; }
  if (co.address) { doc.text(co.address, 112, dy); dy += 4; }
  if (co.siret) { doc.text("SIRET : " + co.siret, 112, dy); dy += 4; }
  return y + 36;
}

export function generateDevis(club, company, products, allProducts, currentSeason, payments, seasons) {
  const doc = new jsPDF();
  const isM = company.dealType === "Mécénat";
  const num = devisNum();

  // Header
  let y = addHeader(doc, club, isM ? "Proposition de mécénat" : "Devis / Proposition", num);
  y = addCompanyBlock(doc, company, y);

  // Type
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isM ? 124 : 26, isM ? 58 : 115, isM ? 237 : 232);
  doc.text(isM ? "Convention de mécénat" : "Proposition de partenariat", 20, y);
  doc.setTextColor(0);
  y += 8;

  const coSP = company.seasonProducts || {};
  const coSDA = company.seasonDonAmounts || {};
  const hasSP = Object.keys(coSP).length > 0;
  // Find which seasons have data (products or don)
  const allSeasons = seasons ? seasons.map(s => s.id) : [currentSeason];
  const activeSeasons = allSeasons.filter(sid => (coSP[sid]?.length > 0) || (coSDA[sid] > 0));
  const displaySeasons = activeSeasons.length > 0 ? activeSeasons : [currentSeason];

  // Duration line if multi-season
  if (displaySeasons.length > 1) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Durée : ${displaySeasons.length} saisons (${displaySeasons[0]} à ${displaySeasons[displaySeasons.length - 1]})`, 20, y);
    y += 6;
  }

  let grandTotalHT = 0;
  let grandTotalDon = 0;

  if (hasSP && displaySeasons.length > 0) {
    // One table per season
    displaySeasons.forEach(sid => {
      const seasonProds = coSP[sid] || [];
      const seasonDon = coSDA[sid] || 0;
      const rows = seasonProds.map(cp => {
        const pr = allProducts.find(x => x.id === cp.productId);
        if (!pr) return null;
        const catPrice = getPrice(pr, sid).price || getPrice(pr, currentSeason).price;
        const remise = catPrice > 0 && cp.unitPrice < catPrice ? `-${Math.round((1 - cp.unitPrice / catPrice) * 100)}%` : "";
        return [pr.name, fmtE(catPrice), remise, fmtE(cp.unitPrice), String(cp.qty), fmtE(lineHT(cp))];
      }).filter(Boolean);
      const seasonHT = seasonProds.reduce((t, cp) => t + lineHT(cp), 0);
      grandTotalHT += seasonHT;
      grandTotalDon += seasonDon;

      if (y > 240) { doc.addPage(); y = 25; }

      // Season subtitle
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isM ? 124 : 26, isM ? 58 : 115, isM ? 237 : 232);
      doc.text(`Saison ${sid}`, 20, y + 4);
      if (isM && seasonDon > 0) {
        doc.text(`Don : ${fmtE(seasonDon)}`, 190, y + 4, { align: "right" });
      }
      doc.setTextColor(0);
      y += 2;

      if (rows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Produit", "Prix catalogue", "Remise", "Prix conclu", "Qté", "Total HT"]],
          body: rows,
          theme: "striped",
          headStyles: { fillColor: isM ? [124, 58, 237] : [26, 115, 232], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: { 0: { cellWidth: 50 }, 5: { halign: "right", fontStyle: "bold" } },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable.finalY + 2;
      }
      // Season subtotal
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      if (isM && seasonDon > 0 && seasonHT > 0) {
        const ratio = ((seasonHT / seasonDon) * 100).toFixed(1);
        doc.text(`Contreparties ${sid} : ${fmtE(seasonHT)} HT (${ratio}% du don)`, 190, y, { align: "right" });
      } else {
        doc.text(`Sous-total ${sid} : ${fmtE(seasonHT)} HT`, 190, y, { align: "right" });
      }
      doc.setFont("helvetica", "normal");
      y += 6;
    });
  } else {
    // Fallback: single table (old behavior)
    const prods = (company.products || []).map(cp => {
      const pr = allProducts.find(x => x.id === cp.productId);
      if (!pr) return null;
      const catPrice = getPrice(pr, currentSeason).price;
      const remise = catPrice > 0 && cp.unitPrice < catPrice ? `-${Math.round((1 - cp.unitPrice / catPrice) * 100)}%` : "";
      return [pr.name, fmtE(catPrice), remise, fmtE(cp.unitPrice), String(cp.qty), fmtE(lineHT(cp))];
    }).filter(Boolean);
    grandTotalHT = (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);
    grandTotalDon = company.donAmount || 0;

    if (prods.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Produit", "Prix catalogue", "Remise", "Prix conclu", "Qté", "Total HT"]],
        body: prods,
        theme: "striped",
        headStyles: { fillColor: isM ? [124, 58, 237] : [26, 115, 232], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 50 }, 5: { halign: "right", fontStyle: "bold" } },
        margin: { left: 20, right: 20 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // Totals
  if (y > 250) { doc.addPage(); y = 25; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (isM) {
    doc.text(`Montant total du don : ${fmtE(grandTotalDon)}`, 190, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Contreparties totales : ${fmtE(grandTotalHT)} HT (${grandTotalDon > 0 ? ((grandTotalHT / grandTotalDon) * 100).toFixed(1) : 0}% du don)`, 190, y, { align: "right" });
    y += 8;
  } else {
    doc.text(`Total HT : ${fmtE(grandTotalHT)}`, 190, y, { align: "right" });
    y += 6;
  }

  // Validité
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Ce devis est valable ${club.validiteDays || 30} jours à compter de sa date d'émission.`, 20, y);
  y += 4;
  doc.text("Conditions de paiement : selon échéancier ci-dessus ou à réception de facture.", 20, y);
  y += 10;

  // Signature
  if (y > 240) { doc.addPage(); y = 25; }
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(20, y, 80, 35);
  doc.rect(110, y, 80, 35);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Le club", 60, y + 5, { align: "center" });
  doc.text("Le partenaire", 150, y + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(club.president || "", 60, y + 10, { align: "center" });
  doc.text(company.contact || "", 150, y + 10, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Bon pour accord", 150, y + 17, { align: "center" });
  doc.text("Date et signature", 150, y + 21, { align: "center" });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  doc.save(`Devis_${company.company.replace(/\s/g, "_")}_${num}.pdf`);
}

export function generateContrat(club, company, contract, allProducts, seasons, currentSeason) {
  const doc = new jsPDF();
  const isM = contract.type === "Mécénat" || company.dealType === "Mécénat";
  const num = contratNum();
  const donAmount = contract.donAmount || company.donAmount || 0;

  // Header
  let y = addHeader(doc, club, isM ? "Convention de mécénat" : "Contrat de partenariat", num);
  y = addCompanyBlock(doc, company, y);

  // Parties
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ENTRE LES SOUSSIGNÉS", 105, y, { align: "center" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${club.name}, représenté(e) par ${club.president || "___"}, en qualité de Président(e),`, 20, y);
  y += 5;
  doc.text(`ci-après dénommé(e) "le Club",`, 20, y);
  y += 7;
  doc.text("ET", 105, y, { align: "center" });
  y += 7;
  doc.text(`${company.company}, représenté(e) par ${contract.signataire || company.contact || "___"},`, 20, y);
  y += 5;
  doc.text(`ci-après dénommé(e) "${isM ? "le Mécène" : "le Partenaire"}",`, 20, y);
  y += 10;

  // Article 1 - Objet
  doc.setFont("helvetica", "bold");
  doc.text("Article 1 — Objet", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (isM) {
    doc.text(`Le Mécène s'engage à verser au Club un don de ${fmtE(donAmount)} dans le cadre d'une convention de mécénat.`, 20, y, { maxWidth: 170 });
    y += 8;
    const hasSPObj = contract.seasonProducts && Object.keys(contract.seasonProducts).length > 0;
    const totalHTObjet = hasSPObj
      ? Object.values(contract.seasonProducts).reduce((total, prods) => total + prods.reduce((t, cp) => t + lineHT(cp), 0), 0)
      : (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);
    if (totalHTObjet > 0) {
      doc.text(`En contrepartie, le Club s'engage à fournir les prestations ci-dessous, d'une valeur de ${fmtE(totalHTObjet)} HT`, 20, y, { maxWidth: 170 });
      y += 4;
      doc.text(`(soit ${donAmount > 0 ? ((totalHTObjet / donAmount) * 100).toFixed(1) : 0}% du don, conformément à la règle des 25% maximum).`, 20, y, { maxWidth: 170 });
      y += 6;
    }
  } else {
    doc.text(`Le Partenaire s'engage à soutenir le Club selon les modalités définies ci-après, en échange des contreparties listées.`, 20, y, { maxWidth: 170 });
    y += 8;
  }

  // Article 2 - Durée
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Article 2 — Durée", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const startS = seasons.find(s => s.id === contract.startSeason);
  doc.text(`Le présent contrat est conclu pour ${contract.seasons} saison(s), de ${contract.startSeason}${contract.seasons > 1 ? ` à ${seasons[seasons.indexOf(startS) + contract.seasons - 1]?.name || "___"}` : ""}.`, 20, y, { maxWidth: 170 });
  y += 8;

  // Article 3 - Prestations (per season)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(isM ? "Article 3 — Contreparties" : "Article 3 — Prestations", 20, y);
  y += 3;

  const hasSP = contract.seasonProducts && Object.keys(contract.seasonProducts).length > 0;
  const coveredSeasons = getContractSeasonIds(contract, seasons);
  let grandTotalHT = 0;

  if (hasSP) {
    // One table per season
    coveredSeasons.forEach(sid => {
      const seasonProds = (contract.seasonProducts[sid] || []);
      const rows = seasonProds.map(cp => {
        const pr = allProducts.find(x => x.id === cp.productId);
        if (!pr) return null;
        return [pr.name, String(cp.qty), fmtE(cp.unitPrice), fmtE(lineHT(cp))];
      }).filter(Boolean);
      const seasonHT = seasonProds.reduce((t, cp) => t + lineHT(cp), 0);
      grandTotalHT += seasonHT;

      if (y > 240) { doc.addPage(); y = 25; }

      // Season subtitle
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 115, 232);
      doc.text(`Saison ${sid}`, 20, y + 4);
      doc.setTextColor(0);
      y += 2;

      if (rows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Prestation", "Qté", "Prix unitaire HT", "Total HT"]],
          body: rows,
          theme: "striped",
          headStyles: { fillColor: isM ? [124, 58, 237] : [26, 115, 232], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable.finalY + 2;
      }
      // Season subtotal
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Sous-total ${sid} : ${fmtE(seasonHT)} HT`, 190, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6;
    });
  } else {
    // Fallback: old contract without seasonProducts
    const prods = (company.products || []).map(cp => {
      const pr = allProducts.find(x => x.id === cp.productId);
      if (!pr) return null;
      return [pr.name, String(cp.qty), fmtE(cp.unitPrice), fmtE(lineHT(cp))];
    }).filter(Boolean);
    grandTotalHT = (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);

    if (prods.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Prestation", "Qté", "Prix unitaire HT", "Total HT"]],
        body: prods,
        theme: "striped",
        headStyles: { fillColor: isM ? [124, 58, 237] : [26, 115, 232], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
        margin: { left: 20, right: 20 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // Article 4 - Montant
  if (y > 240) { doc.addPage(); y = 25; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Article 4 — Conditions financières", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (isM) {
    doc.text(`Montant du don : ${fmtE(donAmount)}`, 20, y);
  } else {
    doc.text(`Montant total toutes saisons : ${fmtE(grandTotalHT)} HT`, 20, y);
  }
  y += 6;

  // Payments
  if ((contract.payments || []).length > 0) {
    doc.text("Échéancier de paiement :", 20, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Échéance", "Montant", "Date"]],
      body: contract.payments.map(p => [p.label, fmtE(p.amount), p.dueDate || "À définir"]),
      theme: "striped",
      headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Check if we need a new page
  if (y > 230) { doc.addPage(); y = 25; }

  // Article 5 - Obligations
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Article 5 — Obligations", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Le Club s'engage à fournir l'ensemble des prestations prévues à l'article 3.`, 20, y, { maxWidth: 170 });
  y += 5;
  doc.text(`${isM ? "Le Mécène" : "Le Partenaire"} s'engage à régler les sommes prévues selon l'échéancier convenu.`, 20, y, { maxWidth: 170 });
  y += 12;

  // Signature
  if (y > 230) { doc.addPage(); y = 25; }
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Fait en deux exemplaires originaux, à _________________, le _________________`, 105, y, { align: "center" });
  y += 10;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(20, y, 80, 40);
  doc.rect(110, y, 80, 40);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Pour le Club", 60, y + 6, { align: "center" });
  doc.text(`Pour ${isM ? "le Mécène" : "le Partenaire"}`, 150, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(club.president || "___", 60, y + 12, { align: "center" });
  doc.text(contract.signataire || company.contact || "___", 150, y + 12, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Signature et cachet", 60, y + 20, { align: "center" });
  doc.text("Signature et cachet", 150, y + 20, { align: "center" });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  doc.save(`Contrat_${company.company.replace(/\s/g, "_")}_${num}.pdf`);
}

export function generateFacturePDF(club, company, invoice) {
  const doc = new jsPDF();

  // Header
  let y = addHeader(doc, club, "Facture", invoice.number, invoice.dateStr);
  y = addCompanyBlock(doc, company, y);

  // Invoice info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Saison : ${invoice.season}`, 20, y);
  y += 8;

  // Lines table
  const rows = invoice.lines.map(l => [l.name, String(l.qty), fmtE(l.unitPrice), fmtE(l.totalHT), `${l.tvaRate}%`, fmtE(l.tvaAmount)]);

  autoTable(doc, {
    startY: y,
    head: [["Prestation", "Qté", "Prix unitaire HT", "Total HT", "TVA %", "TVA"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [26, 115, 232], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" }, 5: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total HT : ${fmtE(invoice.totalHT)}`, 190, y, { align: "right" });
  y += 5;
  doc.text(`TVA : ${fmtE(invoice.totalTVA)}`, 190, y, { align: "right" });
  y += 6;
  doc.setFontSize(12);
  doc.setDrawColor(26, 115, 232);
  doc.setLineWidth(0.5);
  doc.line(130, y - 1, 190, y - 1);
  doc.text(`Total TTC : ${fmtE(invoice.totalTTC)}`, 190, y + 4, { align: "right" });
  y += 14;

  // Payment info
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Conditions de paiement : selon échéancier convenu ou à réception de facture.", 20, y);
  y += 4;
  doc.text(`Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.`, 20, y);
  y += 10;

  // Signature area
  if (y > 240) { doc.addPage(); y = 25; }
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(110, y, 80, 30);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Cachet et signature", 150, y + 6, { align: "center" });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  doc.save(`Facture_${(company?.company || invoice.companyName).replace(/\s/g, "_")}_${invoice.number.replace(/\//g, "-")}.pdf`);
}


export async function generateCerfa(club, company, contract, invoice, season) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const donAmount = contract.seasonDonAmounts?.[season] || contract.donAmount || 0;
  const prods = contract.seasonProducts?.[season] || [];
  const productsHT = prods.reduce((t, cp) => t + (cp.unitPrice || 0) * (cp.qty || 1), 0);
  const todayFr = new Date().toLocaleDateString("fr-FR");
  const ct = club.cerfaType || "association_1901";

  // Parse addresses
  const addr = club.address || "";
  const am = addr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const clubRue = am ? am[1] : addr;
  const clubCP = am ? am[2] : "";
  const clubVille = am ? am[3] : "";
  const coAddr = company.address || "";
  const cmatch = coAddr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const coRue = cmatch ? cmatch[1] : coAddr;
  const coCP = cmatch ? cmatch[2] : "";
  const coVille = cmatch ? cmatch[3] : "";

  // Load the real CERFA template
  const templateUrl = new URL('/cerfa-template.pdf', window.location.origin).href;
  const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0, 0, 0.7);

  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];
  const { height: H } = p1.getSize();

  // Write text (y = distance from top, converted to PDF bottom-left coords)
  const write = (page, text, x, yFromTop, size, bold) => {
    if (!text) return;
    page.drawText(String(text), { x, y: H - yFromTop, size: size || 9, font: bold ? fontBold : font, color: blue });
  };
  // Draw X in a checkbox
  const checkX = (page, x, yFromTop) => {
    page.drawText("X", { x: x + 1, y: H - yFromTop, size: 10, font: fontBold, color: blue });
  };

  // ============= PAGE 1 : Organisme beneficiaire =============
  const cerfaNum = "REC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
  write(p1, cerfaNum, 468, 118, 8);

  // Denomination
  write(p1, club.name || "", 195, 177);
  // SIREN
  write(p1, club.siren || club.siret || "", 120, 197);
  // Adresse
  write(p1, clubRue, 70, 218, 8);
  write(p1, clubCP, 73, 232, 8);
  write(p1, clubVille, 175, 232, 8);
  write(p1, "France", 53, 247, 8);
  // Objet
  write(p1, club.cerfaObjet || "Soutien aux activites sportives du club", 40, 267, 8);

  // Checkboxes page 1
  var isOeuvre = ["association_1901", "association_rup", "fondation_universitaire", "fondation_entreprise", "musee", "aide_alimentaire"].includes(ct);
  if (isOeuvre) checkX(p1, 28, 296);
  if (ct === "association_1901") checkX(p1, 114, 352);
  if (ct === "association_rup") checkX(p1, 114, 365);
  if (ct === "fondation_universitaire") checkX(p1, 114, 394);
  if (ct === "fondation_entreprise") checkX(p1, 114, 410);
  if (ct === "musee") checkX(p1, 114, 421);
  if (ct === "aide_alimentaire") checkX(p1, 114, 432);
  if (ct === "fonds_dotation") checkX(p1, 28, 720);

  // ============= PAGE 2 : Entreprise donatrice + dons =============
  // Entreprise
  write(p2, company.company || "", 145, 111);
  write(p2, company.formeJuridique || "", 105, 125, 8);
  write(p2, company.siret || "", 97, 139, 8);
  write(p2, coRue, 70, 162, 8);
  write(p2, coCP, 73, 176, 8);
  write(p2, coVille, 155, 176, 8);

  // Dons en nature (contreparties)
  if (productsHT > 0) {
    write(p2, fmtN(productsHT), 40, 246, 10, true);
    write(p2, numberToFrench(productsHT), 40, 264, 8);
    var descY = 310;
    prods.forEach(function(cp) {
      var line = "Qte " + cp.qty + " x " + fmtE(cp.unitPrice) + " = " + fmtE((cp.unitPrice || 0) * (cp.qty || 1));
      write(p2, line, 40, descY, 7);
      descY += 12;
    });
  }

  // Versements
  write(p2, fmtN(donAmount), 40, 418, 10, true);
  write(p2, numberToFrench(donAmount), 40, 436, 8);

  // Forme versements : cocher Virement
  checkX(p2, 268, 470);

  // Montant total
  write(p2, fmtN(donAmount), 40, 510, 10, true);
  write(p2, numberToFrench(donAmount), 40, 528, 8);

  // Date des versements
  write(p2, "Saison " + season, 90, 558, 8);

  // Date et signature
  write(p2, todayFr, 435, 570);
  write(p2, club.president || "", 435, 585);

  // Save and download
  var pdfBytes = await pdfDoc.save();
  var blob = new Blob([pdfBytes], { type: "application/pdf" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "CERFA_Mecenat_" + company.company.replace(/\s/g, "_") + "_" + season + ".pdf";
  a.click();
  URL.revokeObjectURL(url);
}
