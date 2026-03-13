import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, lineHT, getPrice } from '../data/initialData';

const fmtN = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fmtE = (n) => fmtN(n) + " €";
const today = () => new Date().toLocaleDateString("fr-FR");
const devisNum = () => `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const contratNum = () => `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

function addHeader(doc, club, title, num) {
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
  doc.text(`Date : ${today()}`, 190, 37, { align: "right" });

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

export function generateDevis(club, company, products, allProducts, currentSeason, payments) {
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

  // Products table
  const prods = (company.products || []).map(cp => {
    const pr = allProducts.find(x => x.id === cp.productId);
    if (!pr) return null;
    const catPrice = getPrice(pr, currentSeason).price;
    const remise = catPrice > 0 && cp.unitPrice < catPrice ? `-${Math.round((1 - cp.unitPrice / catPrice) * 100)}%` : "";
    return [pr.name, fmtE(catPrice), remise, fmtE(cp.unitPrice), String(cp.qty), fmtE(lineHT(cp))];
  }).filter(Boolean);

  const totalHT = (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);

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

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (isM) {
    doc.text(`Montant du don : ${fmtE(company.donAmount || 0)}`, 190, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Contreparties : ${fmtE(totalHT)} HT (${company.donAmount > 0 ? ((totalHT / company.donAmount) * 100).toFixed(1) : 0}% du don)`, 190, y, { align: "right" });
    y += 8;
  } else {
    doc.text(`Total HT : ${fmtE(totalHT)}`, 190, y, { align: "right" });
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
    if ((company.products || []).length > 0) {
      const totalHT = (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);
      doc.text(`En contrepartie, le Club s'engage à fournir les prestations ci-dessous, d'une valeur de ${fmtE(totalHT)} HT`, 20, y, { maxWidth: 170 });
      y += 4;
      doc.text(`(soit ${donAmount > 0 ? ((totalHT / donAmount) * 100).toFixed(1) : 0}% du don, conformément à la règle des 25% maximum).`, 20, y, { maxWidth: 170 });
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

  // Article 3 - Prestations
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(isM ? "Article 3 — Contreparties" : "Article 3 — Prestations", 20, y);
  y += 3;

  const prods = (company.products || []).map(cp => {
    const pr = allProducts.find(x => x.id === cp.productId);
    if (!pr) return null;
    return [pr.name, String(cp.qty), fmtE(cp.unitPrice), fmtE(lineHT(cp))];
  }).filter(Boolean);

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

  // Article 4 - Montant
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Article 4 — Conditions financières", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (isM) {
    doc.text(`Montant du don : ${fmtE(donAmount)}`, 20, y);
  } else {
    const totalHT = (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);
    doc.text(`Montant total : ${fmtE(totalHT)} HT`, 20, y);
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
