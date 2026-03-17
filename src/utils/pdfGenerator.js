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
  const cerfaNum = `CERFA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  // Parse address
  const addr = club.address || "";
  const addrMatch = addr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const clubRue = addrMatch ? addrMatch[1] : addr;
  const clubCP = addrMatch ? addrMatch[2] : "";
  const clubVille = addrMatch ? addrMatch[3] : "";

  const coAddr = company.address || "";
  const coMatch = coAddr.match(/^(.+?),?\s*(\d{5})\s+(.+)$/);
  const coRue = coMatch ? coMatch[1] : coAddr;
  const coCP = coMatch ? coMatch[2] : "";
  const coVille = coMatch ? coMatch[3] : "";

  const todayFr = new Date().toLocaleDateString("fr-FR");

  // Helper
  const title = (text, x, y) => { doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 150); doc.text(text, x, y); doc.setTextColor(0); };
  const label = (text, x, y) => { doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text(text, x, y); };
  const value = (text, x, y, opts) => { doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(String(text || ""), x, y, opts); };
  const check = (checked, x, y) => { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(x, y - 3, 3.5, 3.5); if (checked) { doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("X", x + 0.7, y); } };

  // ===================== PAGE 1 =====================
  // Header
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("RÉPUBLIQUE FRANÇAISE", 20, 15);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("2041-MEC-SD", 175, 12, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("N° Cerfa : 16216*02", 175, 16, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Reçu des dons et versements effectués par", 105, 22, { align: "center" });
  doc.text("les entreprises au titre de l'article 238 bis du", 105, 27, { align: "center" });
  doc.text("code général des impôts", 105, 32, { align: "center" });

  // Numéro d'ordre
  label("Numéro d'ordre du reçu :", 130, 38);
  doc.setDrawColor(0); doc.rect(165, 34, 30, 6); value(cerfaNum, 167, 38.5);

  // === ORGANISME BÉNÉFICIAIRE ===
  let y = 48;
  doc.setDrawColor(0, 0, 150); doc.setLineWidth(0.5);
  doc.line(20, y - 2, 190, y - 2);
  title("Organisme bénéficiaire des dons et versements", 20, y + 3);
  y += 10;

  label("Dénomination de l'organisme :", 20, y);
  value(club.name || "", 75, y);
  y += 6;

  label("Numéro SIREN ou RNA :", 20, y);
  value(club.siren || club.siret || "", 60, y);
  y += 6;

  label("Adresse :", 20, y);
  y += 5;
  label("Rue :", 20, y); value(clubRue, 30, y);
  y += 5;
  label("Code postal :", 20, y); value(clubCP, 45, y);
  label("Commune :", 70, y); value(clubVille, 90, y);
  y += 5;
  label("Pays :", 20, y); value("France", 32, y);
  y += 6;

  label("Objet :", 20, y);
  value(club.cerfaObjet || "Soutien aux activités sportives", 33, y);
  y += 8;

  label("Cochez la case qui vous concerne :", 20, y);
  y += 6;

  // Type d'organisme
  const ct = club.cerfaType || "association_1901";
  doc.setFontSize(7); doc.setFont("helvetica", "normal");

  check(ct === "association_1901" || ct === "oeuvre_interet_general", 20, y);
  doc.text("Œuvre ou organisme d'intérêt général ayant un caractère philanthropique, éducatif,", 26, y, { maxWidth: 160 });
  y += 4;
  doc.text("scientifique, social, humanitaire, sportif, familial, culturel...", 26, y);
  y += 5;

  check(ct === "association_1901", 28, y);
  doc.text("Association loi 1901", 34, y);
  y += 5;

  check(ct === "association_rup", 28, y);
  doc.text("Association ou fondation reconnue d'utilité publique", 34, y);
  y += 5;

  check(ct === "fondation_universitaire", 28, y);
  doc.text("Fondation universitaire ou fondation partenariale", 34, y);
  y += 5;

  check(ct === "fondation_entreprise", 28, y);
  doc.text("Fondation d'entreprise", 34, y);
  y += 5;

  check(ct === "musee", 28, y);
  doc.text("Musée de France", 34, y);
  y += 5;

  check(ct === "aide_alimentaire", 28, y);
  doc.text("Organismes fournissant gratuitement une aide alimentaire, des soins ou des produits de première nécessité", 34, y, { maxWidth: 150 });
  y += 5;

  check(ct === "fonds_dotation", 28, y);
  doc.text("Fonds de dotation", 34, y);

  // ===================== PAGE 2 =====================
  doc.addPage();
  y = 20;

  // === ENTREPRISE DONATRICE ===
  doc.setDrawColor(0, 0, 150); doc.setLineWidth(0.5);
  doc.line(20, y - 2, 190, y - 2);
  title("Entreprise donatrice", 20, y + 3);
  y += 10;

  label("Dénomination de l'entreprise :", 20, y);
  value(company.company || "", 72, y);
  y += 6;

  label("Forme juridique :", 20, y);
  value(company.sector || "", 52, y);
  y += 6;

  label("Numéro SIREN :", 20, y);
  value(company.siret || "", 50, y);
  y += 6;

  label("Adresse :", 20, y);
  y += 5;
  label("Rue :", 20, y); value(coRue, 30, y);
  y += 5;
  label("Code postal :", 20, y); value(coCP, 45, y);
  label("Commune :", 70, y); value(coVille, 90, y);
  y += 10;

  // === DONS EN NATURE (contreparties) ===
  if (productsHT > 0) {
    doc.setDrawColor(0, 0, 150); doc.setLineWidth(0.5);
    doc.line(20, y - 2, 190, y - 2);
    title("Dons en nature", 20, y + 3);
    y += 10;

    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("L'organisme bénéficiaire reconnaît avoir reçu, au titre de la réduction d'impôt prévue à l'article", 20, y);
    y += 4;
    doc.text("238 bis du code général des impôts, des dons en nature pour une valeur en euros égale à :", 20, y);
    y += 6;

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(`${fmtE(productsHT)}`, 20, y);
    y += 5;
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(`Soit en toutes lettres : ${numberToFrench(productsHT)}`, 20, y, { maxWidth: 170 });
    y += 8;

    label("Description des biens et prestations :", 20, y);
    y += 5;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    prods.forEach(cp => {
      doc.text(`• Qté ${cp.qty} × ${fmtE(cp.unitPrice)} = ${fmtE((cp.unitPrice || 0) * (cp.qty || 1))}`, 24, y);
      y += 4;
    });
    y += 4;
  }

  // === VERSEMENTS ===
  doc.setDrawColor(0, 0, 150); doc.setLineWidth(0.5);
  doc.line(20, y - 2, 190, y - 2);
  title("Dons et versements", 20, y + 3);
  y += 10;

  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("L'organisme bénéficiaire reconnaît avoir reçu, au titre de la réduction d'impôt prévue à l'article", 20, y);
  y += 4;
  doc.text("238 bis du code général des impôts, des versements pour une valeur totale égale à :", 20, y);
  y += 6;

  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(`${fmtE(donAmount)}`, 20, y);
  y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Soit en toutes lettres : ${numberToFrench(donAmount)}`, 20, y, { maxWidth: 170 });
  y += 10;

  // Forme des versements
  label("Forme des versements :", 20, y);
  y += 5;
  check(false, 20, y); doc.setFontSize(7); doc.text("Remise d'espèces", 26, y);
  check(false, 60, y); doc.text("Chèque", 66, y);
  check(true, 85, y); doc.text("Virement, prélèvement ou carte bancaire", 91, y);
  check(false, 160, y); doc.text("Autre", 166, y);
  y += 8;

  // Montant total
  doc.setDrawColor(0, 0, 150); doc.setLineWidth(0.3);
  doc.line(20, y - 2, 190, y - 2);
  y += 3;
  label("Montant total des dons et versements reçus par l'organisme :", 20, y);
  y += 6;
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`${fmtE(donAmount)}`, 20, y);
  y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Soit en toutes lettres : ${numberToFrench(donAmount)}`, 20, y, { maxWidth: 170 });
  y += 10;

  // Dates
  label("Date ou période au cours de laquelle les dons et versements ont été effectués :", 20, y);
  y += 5;
  value(`Saison ${season}`, 20, y);
  y += 10;

  // Signature
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.rect(110, y, 80, 30);
  label("Date et signature", 115, y + 5);
  value(`Le ${todayFr}`, 115, y + 12);
  value(club.president || "", 115, y + 18);

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6); doc.setTextColor(150);
  doc.text("CERFA 2041-MEC-SD · N° 16216*02 · Reçu au titre de l'article 238 bis du CGI", 105, pageH - 10, { align: "center" });

  doc.save(`CERFA_Mecenat_${company.company.replace(/\s/g, "_")}_${season}_${cerfaNum}.pdf`);
}
