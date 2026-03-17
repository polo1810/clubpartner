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

export function generateCerfa(club, company, contract, invoice, season) {
  const doc = new jsPDF();
  const donAmount = contract.seasonDonAmounts?.[season] || contract.donAmount || 0;
  const prods = contract.seasonProducts?.[season] || [];
  const productsHT = prods.reduce((t, cp) => t + (cp.unitPrice || 0) * (cp.qty || 1), 0);
  const cerfaNum = `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  // Parse addresses
  const addr = club.address || "";
  const am = addr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const clubRue = am ? am[1] : addr; const clubCP = am ? am[2] : ""; const clubVille = am ? am[3] : "";
  const coAddr = company.address || "";
  const cm = coAddr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const coRue = cm ? cm[1] : coAddr; const coCP = cm ? cm[2] : ""; const coVille = cm ? cm[3] : "";
  const todayFr = new Date().toLocaleDateString("fr-FR");
  const ct = club.cerfaType || "association_1901";

  // Styles
  const W = 210; const ML = 15; const MR = 195;
  const box = (y, h) => { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(ML, y, MR - ML, h); };
  const hline = (y) => { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(ML, y, MR, y); };
  const cb = (checked, x, y) => { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(x, y, 3, 3); if (checked) { doc.line(x, y, x + 3, y + 3); doc.line(x + 3, y, x, y + 3); } };
  const sm = (t, x, y, o) => { doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(t, x, y, o); };
  const bd = (t, x, y, o) => { doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text(t, x, y, o); };
  const fill = (t, x, y) => { doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 150); doc.text(String(t || ""), x, y); doc.setTextColor(0); };
  const dotline = (x1, x2, y) => { doc.setDrawColor(180); doc.setLineWidth(0.1); doc.line(x1, y + 0.5, x2, y + 0.5); doc.setDrawColor(0); };

  // ============= PAGE 1 =============

  // Header top left
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
  doc.text("RÉPUBLIQUE", ML, 10); doc.text("FRANÇAISE", ML, 13);
  doc.setFontSize(5); doc.text("Liberté", ML, 16); doc.text("Égalité", ML, 18.5); doc.text("Fraternité", ML, 21);

  // Header center
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
  doc.text("Reçu des dons et versements effectués par", 105, 11, { align: "center" });
  doc.text("les entreprises au titre de l'article 238 bis du", 105, 15.5, { align: "center" });
  doc.text("code général des impôts", 105, 20, { align: "center" });

  // Header top right
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("2041-MEC-SD", MR, 10, { align: "right" });
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("N° Cerfa : 16216*02", MR, 15, { align: "right" });

  // Numéro d'ordre box
  doc.setFontSize(7); doc.text("Numéro d'ordre du reçu", 160, 22);
  doc.rect(160, 23, 35, 6);
  fill(cerfaNum, 162, 27.5);

  // ---- Section Organisme bénéficiaire ----
  let y = 33;
  box(y, 8);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 150);
  doc.text("Organisme bénéficiaire des dons et versements", 105, y + 5.5, { align: "center" });
  doc.setTextColor(0);
  y += 11;

  bd("Dénomination de l'organisme :", ML + 2, y); dotline(68, MR - 2, y); fill(club.name || "", 70, y);
  y += 5;
  bd("Numéro SIREN ou RNA :", ML + 2, y); fill(club.siren || club.siret || "", 55, y);
  y += 5;
  bd("Adresse :", ML + 2, y);
  y += 4;
  sm("N°", ML + 2, y); dotline(20, 35, y); sm("Rue", 37, y); dotline(44, MR - 2, y); fill(clubRue, 45, y);
  y += 4;
  sm("Code postal", ML + 2, y); fill(clubCP, 32, y); dotline(30, 45, y); sm("Commune", 48, y); fill(clubVille, 65, y); dotline(63, MR - 2, y);
  y += 4;
  sm("Pays", ML + 2, y); fill("France", 25, y);
  y += 5;

  bd("Objet", ML + 2, y);
  y += 4;
  dotline(ML + 2, MR - 2, y); fill(club.cerfaObjet || "Soutien aux activités sportives du club", ML + 3, y);
  y += 5;

  // Cochez la case
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 150);
  doc.text("Cochez la case qui vous concerne :", ML + 2, y);
  doc.setTextColor(0);
  y += 5;

  // Checkbox section
  const isOeuvre = ["association_1901", "association_rup", "fondation_universitaire", "fondation_entreprise", "musee", "aide_alimentaire", "oeuvre_interet_general"].includes(ct);
  cb(isOeuvre, ML + 2, y - 2.5);
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  doc.text("Œuvre ou organisme d'intérêt général ayant un caractère philanthropique, éducatif, scientifique, social,", ML + 8, y);
  y += 3;
  doc.text("humanitaire, sportif, familial, culturel ou concourant à l'égalité entre les femmes et les hommes, à la", ML + 8, y);
  y += 3;
  doc.text("mise en valeur du patrimoine artistique, à la défense de l'environnement naturel ou à la diffusion de la", ML + 8, y);
  y += 3;
  doc.text("culture, de la langue et des connaissances scientifiques françaises. Précisez si vous êtes :", ML + 8, y);
  y += 4;

  // Sub-checkboxes
  const subcb = (checked, label, yp) => { doc.setFontSize(6); doc.text("○", ML + 10, yp); if (checked) { doc.setFont("helvetica", "bold"); doc.text("●", ML + 10, yp); doc.setFont("helvetica", "normal"); } doc.text(label, ML + 14, yp); };
  subcb(ct === "association_1901", "Association loi 1901", y); y += 3.5;
  subcb(ct === "association_rup", "Association ou fondation reconnue d'utilité publique par décret en date du ……/……/…… publié au", y); y += 3;
  doc.text("Journal officiel du ……/……/…… ", ML + 14, y); y += 3.5;
  subcb(ct === "fondation_universitaire", "Fondation universitaire ou fondation partenariale mentionnées respectivement aux articles L.719-12", y); y += 3;
  doc.text("et L.719-13 du code de l'éducation", ML + 14, y); y += 3.5;
  subcb(ct === "fondation_entreprise", "Fondation d'entreprise", y); y += 3.5;
  subcb(ct === "musee", "Musée de France", y); y += 3.5;
  subcb(ct === "aide_alimentaire", "Organismes sans but lucratif fournissant gratuitement une aide alimentaire, des soins médicaux ou", y); y += 3;
  doc.text("des produits de première nécessité à des personnes en difficulté ou favorisant leur logement", ML + 14, y); y += 3.5;
  subcb(false, "Autres (précisez) :", y); y += 4;

  cb(false, ML + 2, y - 2.5);
  doc.setFontSize(6.5);
  doc.text("Association cultuelle ou établissement public des cultes reconnus d'Alsace-Moselle", ML + 8, y); y += 5;

  cb(false, ML + 2, y - 2.5);
  doc.text("Établissement d'enseignement supérieur ou d'enseignement artistique public ou privé, d'intérêt général,", ML + 8, y); y += 3;
  doc.text("à but non lucratif", ML + 8, y); y += 4;

  cb(false, ML + 2, y - 2.5);
  doc.text("Société ou organisme public ou privé agréé par le ministre chargé du budget en vertu de l'article 4 de", ML + 8, y); y += 3;
  doc.text("l'ordonnance n° 58-882 du 25 septembre 1958 relative à la fiscalité en matière de recherche scientifique", ML + 8, y); y += 3;
  doc.text("et technique", ML + 8, y); y += 3;
  sm("Date de l'agrément : ……/……/……", ML + 8, y); y += 5;

  cb(false, ML + 2, y - 2.5);
  doc.text("Organisme public ou privé dont la gestion est désintéressée et qui a pour activité principale la", ML + 8, y); y += 3;
  doc.text("présentation au public d'œuvres dramatiques, lyriques, musicales, chorégraphiques,", ML + 8, y); y += 3;
  doc.text("cinématographiques, audiovisuelles et de cirque ou l'organisation d'expositions d'art contemporain", ML + 8, y); y += 5;

  cb(ct === "fonds_dotation", ML + 2, y - 2.5);
  doc.text("Fonds de dotation", ML + 8, y);

  // Footer page 1
  doc.setFontSize(5); doc.setTextColor(130);
  doc.text("1. Pour les associations inscrites d'Alsace-Moselle, numéro d'inscription au registre des associations.", ML, 284);
  doc.text("2. Cochez la case qui vous concerne et précisez l'objet si nécessaire.", ML, 287);
  doc.text("3. Collectivités locales, État, GIP, établissements publics, etc.", ML, 290);
  doc.setTextColor(0);

  // ============= PAGE 2 =============
  doc.addPage();
  y = 15;

  // Section Entreprise donatrice
  box(y, 7);
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 150);
  doc.text("Entreprise donatrice", 105, y + 5, { align: "center" });
  doc.setTextColor(0);
  y += 10;

  bd("Dénomination de l'entreprise :", ML + 2, y); dotline(68, MR - 2, y); fill(company.company || "", 70, y);
  y += 5;
  bd("Forme juridique :", ML + 2, y); dotline(45, MR - 2, y); fill(company.formeJuridique || "", 47, y);
  y += 5;
  bd("Numéro SIREN :", ML + 2, y); dotline(40, 80, y); fill(company.siret || "", 42, y);
  y += 5;
  bd("Adresse :", ML + 2, y);
  y += 4;
  sm("N°", ML + 2, y); dotline(20, 35, y); sm("Rue", 37, y); dotline(44, MR - 2, y); fill(coRue, 45, y);
  y += 4;
  sm("Code postal", ML + 2, y); fill(coCP, 32, y); dotline(30, 45, y); sm("Commune", 48, y); fill(coVille, 65, y); dotline(63, MR - 2, y);
  y += 8;

  // Dons et versements
  box(y, 7);
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 150);
  doc.text("Dons et versements effectués par l'entreprise", 105, y + 5, { align: "center" });
  doc.setTextColor(0);
  y += 11;

  // Dons en nature
  if (productsHT > 0) {
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("L'organisme bénéficiaire reconnaît avoir reçu, au titre de la réduction d'impôt prévue à l'article", ML + 2, y);
    y += 3.5;
    doc.text("238 bis du code général des impôts, des dons en nature pour une valeur en euros égale à :", ML + 2, y);
    y += 5;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    fill(`${fmtE(productsHT)}`, ML + 2, y);
    y += 5;
    sm("Indiquez la valeur totale des dons en nature en toutes lettres :", ML + 2, y);
    fill(numberToFrench(productsHT), ML + 2, y + 4);
    y += 9;

    bd("Description exhaustive des biens et prestations reçus et acceptés :", ML + 2, y);
    y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    prods.forEach(cp => {
      const name = cp.productId ? `Produit #${cp.productId}` : "Prestation";
      doc.text(`• ${name} — Qté ${cp.qty} × ${fmtE(cp.unitPrice)} = ${fmtE((cp.unitPrice || 0) * (cp.qty || 1))}`, ML + 4, y);
      y += 3.5;
    });
    y += 3;
    hline(y); y += 4;
  }

  // Versements
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("L'organisme bénéficiaire reconnaît avoir reçu, au titre de la réduction d'impôt prévue à l'article", ML + 2, y);
  y += 3.5;
  doc.text("238 bis du code général des impôts, des versements pour une valeur totale égale à :", ML + 2, y);
  y += 5;
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  fill(`${fmtE(donAmount)}`, ML + 2, y);
  y += 5;
  sm("Indiquez le total des versements en toutes lettres :", ML + 2, y);
  fill(numberToFrench(donAmount), ML + 2, y + 4);
  y += 10;

  // Forme des versements
  bd("Forme des versements :", ML + 2, y); y += 5;
  cb(false, ML + 4, y - 2.5); sm("Remise d'espèces", ML + 10, y);
  cb(false, ML + 42, y - 2.5); sm("Chèque", ML + 48, y);
  cb(true, ML + 64, y - 2.5); sm("Virement, prélèvement ou carte bancaire", ML + 70, y);
  cb(false, ML + 135, y - 2.5); sm("Autre", ML + 141, y);
  y += 8;

  // Montant total
  hline(y); y += 4;
  bd("Montant total des dons et versements reçus par l'organisme :", ML + 2, y);
  y += 5;
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  fill(`${fmtE(donAmount)}`, ML + 2, y);
  y += 5;
  sm("Indiquez le montant total des dons et versements en toutes lettres :", ML + 2, y);
  fill(numberToFrench(donAmount), ML + 2, y + 4);
  y += 12;

  // Date des versements
  hline(y); y += 4;
  bd("Date ou période au cours de laquelle les dons et versements ont été effectués :", ML + 2, y);
  y += 5;
  sm("du ou le", ML + 2, y); dotline(ML + 14, ML + 34, y); sm("au", ML + 36, y); dotline(ML + 40, ML + 60, y);
  fill(`Saison ${season}`, ML + 14, y);
  y += 10;

  // Date et signature
  doc.rect(130, y, 60, 25);
  bd("Date et signature", 133, y + 5);
  fill(`Le ${todayFr}`, 133, y + 12);
  fill(club.president || "", 133, y + 18);

  // Footnotes
  doc.setFontSize(4.5); doc.setTextColor(130);
  doc.text("5. L'organisme bénéficiaire des dons en nature reporte sur le reçu fiscal le montant indiqué par l'entreprise donatrice.", ML, 272);
  doc.text("6. L'entreprise ne peut pas prétendre au bénéfice de la réduction d'impôt à raison des dons en nature refusés par l'organisme.", ML, 275);
  doc.text("7. La description peut être établie par l'organisme bénéficiaire sur papier libre signé, daté et joint à la présente attestation.", ML, 278);
  doc.text("8. L'organisme bénéficiaire des versements peut cocher une ou plusieurs cases.", ML, 281);
  doc.text("9. L'organisme bénéficiaire peut établir un reçu unique pour plusieurs dons et versements effectués lors d'une période déterminée.", ML, 284);
  doc.setTextColor(0);

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6); doc.setTextColor(150);
  doc.text("CERFA 2041-MEC-SD · N° 16216*02 · Reçu au titre de l'article 238 bis du CGI", 105, pageH - 6, { align: "center" });

  doc.save(`CERFA_Mecenat_${company.company.replace(/\s/g, "_")}_${season}_${cerfaNum}.pdf`);
}
