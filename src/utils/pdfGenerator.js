import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, lineHT, getPrice, getContractSeasonIds, numberToFrench } from '../data/initialData';

const fmtN = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fmtE = (n) => fmtN(n) + " €";
const today = () => new Date().toLocaleDateString("fr-FR");
const devisNum = () => `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const contratNum = () => `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

function addHeader(doc, club, title, num, customDate) {
  // Logo (if available)
  let logoOffset = 0;
  if (club.logo) {
    try { doc.addImage(club.logo, "AUTO", 20, 12, 18, 18); logoOffset = 22; } catch(e) { /* ignore if logo fails */ }
  }

  // Club info (left)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(club.name || "Club", 20 + logoOffset, 25);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  let y = 32;
  if (club.adresseRue || club.address) { const addr = club.adresseRue ? `${club.adresseNum ? club.adresseNum + " " : ""}${club.adresseRue}, ${club.adresseCP || ""} ${club.adresseCommune || ""}` : club.address; doc.text(addr, 20 + logoOffset, y); y += 4; }
  if (club.phone) { doc.text("Tél : " + club.phone, 20 + logoOffset, y); y += 4; }
  if (club.email) { doc.text(club.email, 20 + logoOffset, y); y += 4; }
  if (club.siret) { doc.text("SIRET : " + club.siret, 20 + logoOffset, y); y += 4; }
  if (club.tvaNumber) { doc.text("TVA : " + club.tvaNumber, 20 + logoOffset, y); y += 4; }

  // Title + num + date (right)
  doc.setTextColor(0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 190, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${num}`, 190, 32, { align: "right" });
  doc.text(`Date : ${customDate || today()}`, 190, 37, { align: "right" });

  // Line (use theme color if available)
  const tc = club.themeColor || "#1a73e8";
  const r = parseInt(tc.slice(1,3), 16); const g = parseInt(tc.slice(3,5), 16); const b = parseInt(tc.slice(5,7), 16);
  doc.setDrawColor(r, g, b);
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
  if (co.adresseRue || co.address) { const addr = co.adresseRue ? `${co.adresseNum ? co.adresseNum + " " : ""}${co.adresseRue}, ${co.adresseCP || ""} ${co.adresseCommune || ""}` : co.address; doc.text(addr, 112, dy); dy += 4; }
  if (co.siret) { doc.text("SIRET : " + co.siret, 112, dy); dy += 4; }
  return y + 36;
}

export function generateDevis(club, company, products, allProducts, currentSeason, payments, seasons, returnBlob) {
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
  let grandTotalTVA = 0;

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
      const seasonTVA = club.soumisTVA !== false ? seasonProds.reduce((t, cp) => { const pr = allProducts.find(x => x.id === cp.productId); return t + lineHT(cp) * ((pr?.tva || 20) / 100); }, 0) : 0;
      grandTotalHT += seasonHT;
      grandTotalDon += seasonDon;
      grandTotalTVA += seasonTVA;

      if (y > 240) { doc.addPage(); y = 25; }

      // Season subtitle — enough space before table
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isM ? 124 : 26, isM ? 58 : 115, isM ? 237 : 232);
      doc.text(`Saison ${sid}`, 20, y);
      if (isM && seasonDon > 0) {
        doc.text(`Don : ${fmtE(seasonDon)}`, 190, y, { align: "right" });
      }
      doc.setTextColor(0);
      y += 6;

      if (rows.length > 0) {
        const showTVA = club.soumisTVA !== false;
        const head = showTVA ? [["Produit", "Prix catalogue", "Remise", "Prix HT", "Qté", "Total HT", "TVA", "Total TTC"]] : [["Produit", "Prix catalogue", "Remise", "Prix conclu", "Qté", "Total HT"]];
        const bodyRows = showTVA ? seasonProds.map(cp => {
          const pr = allProducts.find(x => x.id === cp.productId); if (!pr) return null;
          const catPrice = getPrice(pr, sid).price || getPrice(pr, currentSeason).price;
          const remise = catPrice > 0 && cp.unitPrice < catPrice ? `-${Math.round((1 - cp.unitPrice / catPrice) * 100)}%` : "";
          const ht = lineHT(cp); const tva = pr.tva || 20; const ttc = Math.round(ht * (1 + tva / 100) * 100) / 100;
          return [pr.name, fmtE(catPrice), remise, fmtE(cp.unitPrice), String(cp.qty), fmtE(ht), `${tva}%`, fmtE(ttc)];
        }).filter(Boolean) : rows;
        autoTable(doc, {
          startY: y,
          head: head,
          body: bodyRows,
          theme: "striped",
          headStyles: { fillColor: isM ? [124, 58, 237] : [26, 115, 232], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: showTVA ? { 0: { cellWidth: 40 }, 5: { halign: "right" }, 7: { halign: "right", fontStyle: "bold" } } : { 0: { cellWidth: 50 }, 5: { halign: "right", fontStyle: "bold" } },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable.finalY + 4;
      }
      // Season subtotal
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      if (isM && seasonDon > 0 && seasonHT > 0) {
        doc.text(`Contreparties ${sid} : ${fmtE(seasonHT)} HT`, 190, y, { align: "right" });
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
  const showTVA = club.soumisTVA !== false;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (isM) {
    doc.text(`Montant total du don : ${fmtE(grandTotalDon)}`, 190, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Contreparties totales : ${fmtE(grandTotalHT)} HT`, 190, y, { align: "right" });
    y += 8;
  } else {
    doc.text(`Total HT : ${fmtE(grandTotalHT)}`, 190, y, { align: "right" });
    y += 5;
    if (showTVA) {
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`TVA : ${fmtE(Math.round(grandTotalTVA * 100) / 100)}`, 190, y, { align: "right" });
      y += 5;
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(`Total TTC : ${fmtE(Math.round((grandTotalHT + grandTotalTVA) * 100) / 100)}`, 190, y, { align: "right" });
      y += 6;
    } else {
      doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100);
      doc.text("TVA non applicable — article 293 B du CGI", 190, y, { align: "right" });
      doc.setTextColor(0); y += 6;
    }
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
  if (club.signature) { try { doc.addImage(club.signature, "AUTO", 35, y + 12, 30, 18); } catch(e) {} }
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Bon pour accord", 150, y + 17, { align: "center" });
  doc.text("Date et signature", 150, y + 21, { align: "center" });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  const fname = `Devis_${company.company.replace(/\s/g, "_")}_${num}.pdf`;
  if (returnBlob) return { blob: doc.output('blob'), name: fname };
  doc.save(fname);
}

export function generateContrat(club, company, contract, allProducts, seasons, currentSeason, contractTemplates, exclusiviteText, returnBlob) {
  const doc = new jsPDF();
  const isM = contract.type === "Mécénat" || company.dealType === "Mécénat";
  const num = contratNum();
  const donAmount = contract.donAmount || company.donAmount || 0;
  const hasSP = contract.seasonProducts && Object.keys(contract.seasonProducts).length > 0;
  const coveredSeasons = getContractSeasonIds(contract, seasons);
  const startS = seasons.find(s => s.id === contract.startSeason);
  const endSeason = seasons[seasons.indexOf(startS) + contract.seasons - 1]?.name || contract.startSeason;
  const grandTotalHT = hasSP
    ? Object.values(contract.seasonProducts).reduce((t, ps) => t + ps.reduce((s, cp) => s + lineHT(cp), 0), 0)
    : (company.products || []).reduce((t, cp) => t + lineHT(cp), 0);

  // Get template
  const defaultTemplates = { "Partenariat": "", "Mécénat": "" };
  const templates = contractTemplates || defaultTemplates;
  const rawTemplate = templates[isM ? "Mécénat" : "Partenariat"] || "";

  // Exclusivité
  const exclText = contract.exclusivite ? (exclusiviteText || "") : "";

  // Replace placeholders
  let text = rawTemplate
    .replace(/\[club\]/gi, club.name || "___")
    .replace(/\[president\]/gi, club.president || "___")
    .replace(/\[entreprise\]/gi, company.company || "___")
    .replace(/\[signataire\]/gi, contract.signataire || company.contact || "___")
    .replace(/\[saison_debut\]/gi, contract.startSeason || "___")
    .replace(/\[saison_fin\]/gi, endSeason)
    .replace(/\[nb_saisons\]/gi, String(contract.seasons || 1))
    .replace(/\[montant_total\]/gi, fmtE(grandTotalHT))
    .replace(/\[montant_don\]/gi, fmtE(donAmount))
    .replace(/\[ratio_contreparties\]% ?/gi, "")
    .replace(/\[objet_social\]/gi, club.objetSocial ? `Objet social : ${club.objetSocial}` : "")
    .replace(/\[clause_exclusivite\]/gi, exclText)
    .replace(/\[tableau_produits\]/gi, "%%TABLEAU%%")
    .replace(/\[echeancier\]/gi, "%%ECHEANCIER%%");

  // Header
  let y = addHeader(doc, club, isM ? "Convention de mécénat" : "Contrat de partenariat", num);
  y = addCompanyBlock(doc, company, y);

  // Render template text
  const lines = text.split("\n");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (y > 270) { doc.addPage(); y = 20; }

    // Special: product table placeholder
    if (line === "%%TABLEAU%%") {
      if (hasSP) {
        coveredSeasons.forEach(sid => {
          const seasonProds = (contract.seasonProducts[sid] || []);
          const rows = seasonProds.map(cp => {
            const pr = allProducts.find(x => x.id === cp.productId);
            if (!pr) return null;
            return [pr.name, String(cp.qty), fmtE(cp.unitPrice), fmtE(lineHT(cp))];
          }).filter(Boolean);
          const seasonHT = seasonProds.reduce((t, cp) => t + lineHT(cp), 0);

          if (y > 240) { doc.addPage(); y = 20; }
          doc.setFontSize(9); doc.setFont("helvetica", "bold");
          const tc = club.themeColor || "#1a73e8";
          const r = parseInt(tc.slice(1,3),16), g = parseInt(tc.slice(3,5),16), b = parseInt(tc.slice(5,7),16);
          doc.setTextColor(r, g, b);
          doc.text(`Saison ${sid}`, 20, y); doc.setTextColor(0); y += 6;

          if (rows.length > 0) {
            autoTable(doc, {
              startY: y,
              head: [["Prestation", "Qté", "Prix unitaire HT", "Total HT"]],
              body: rows, theme: "striped",
              headStyles: { fillColor: isM ? [124, 58, 237] : [r, g, b], fontSize: 8 },
              styles: { fontSize: 8, cellPadding: 3 },
              columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
              margin: { left: 20, right: 20 },
            });
            y = doc.lastAutoTable.finalY + 2;
          }
          doc.setFontSize(8); doc.setFont("helvetica", "bold");
          doc.text(`Sous-total ${sid} : ${fmtE(seasonHT)} HT`, 190, y, { align: "right" });
          doc.setFont("helvetica", "normal"); y += 6;
        });
      }
      continue;
    }

    // Special: echeancier placeholder
    if (line === "%%ECHEANCIER%%") {
      if ((contract.payments || []).length > 0) {
        doc.setFontSize(8); doc.text("Échéancier de paiement :", 20, y); y += 2;
        autoTable(doc, {
          startY: y,
          head: [["Échéance", "Montant", "Date"]],
          body: contract.payments.map(p => [p.label, fmtE(p.amount), p.dueDate || "À définir"]),
          theme: "striped",
          headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable.finalY + 6;
      }
      continue;
    }

    // Bold line (starts with **)
    const isBold = line.startsWith("**") && line.endsWith("**");
    if (isBold) {
      const cleanLine = line.replace(/\*\*/g, "");
      y += 3;
      doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(cleanLine, 20, y, { maxWidth: 170 });
      y += 6;
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
    } else if (line === "") {
      y += 3;
    } else {
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(line, 170);
      textLines.forEach(tl => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(tl, 20, y);
        y += 4;
      });
    }
  }

  // Signature block
  if (y > 220) { doc.addPage(); y = 20; }
  y += 5;
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Fait en deux exemplaires originaux, à _________________, le _________________`, 105, y, { align: "center" });
  y += 10;
  doc.setDrawColor(200); doc.setLineWidth(0.3);
  doc.rect(20, y, 80, 40); doc.rect(110, y, 80, 40);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Pour le Club", 60, y + 6, { align: "center" });
  doc.text(`Pour ${isM ? "le Mécène" : "le Partenaire"}`, 150, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(club.president || "___", 60, y + 12, { align: "center" });
  doc.text(contract.signataire || company.contact || "___", 150, y + 12, { align: "center" });
  if (club.signature) { try { doc.addImage(club.signature, "AUTO", 35, y + 16, 30, 18); } catch(e) {} }
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text("Signature et cachet", 60, y + 37, { align: "center" });
  doc.text("Signature et cachet", 150, y + 20, { align: "center" });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6); doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  const fname = `Contrat_${company.company.replace(/\s/g, "_")}_${num}.pdf`;
  if (returnBlob) return { blob: doc.output('blob'), name: fname };
  doc.save(fname);
}

export function generateFacturePDF(club, company, invoice, returnBlob) {
  const doc = new jsPDF();
  const showTVA = club.soumisTVA !== false;

  // Header
  let y = addHeader(doc, club, "Facture", invoice.number, invoice.dateStr);
  y = addCompanyBlock(doc, company, y);

  // Invoice info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Saison : ${invoice.season}`, 20, y);
  y += 8;

  // Lines table
  if (showTVA) {
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
  } else {
    const rows = invoice.lines.map(l => [l.name, String(l.qty), fmtE(l.unitPrice), fmtE(l.totalHT)]);
    autoTable(doc, {
      startY: y,
      head: [["Prestation", "Qté", "Prix unitaire", "Total"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [26, 115, 232], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: 20, right: 20 },
    });
  }
  y = doc.lastAutoTable.finalY + 8;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (showTVA) {
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
  } else {
    doc.text(`Total : ${fmtE(invoice.totalHT)}`, 190, y, { align: "right" });
    y += 5;
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100);
    doc.text("TVA non applicable — article 293 B du CGI", 190, y, { align: "right" });
    doc.setTextColor(0);
    y += 10;
  }

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
  if (club.signature) { try { doc.addImage(club.signature, "AUTO", 125, y + 8, 30, 18); } catch(e) {} }

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`${club.name} · SIRET ${club.siret || "___"} · TVA ${club.tvaNumber || "___"}`, 105, pageH - 10, { align: "center" });

  const fname = `Facture_${(company?.company || invoice.companyName).replace(/\s/g, "_")}_${invoice.number.replace(/\//g, "-")}.pdf`;
  if (returnBlob) return { blob: doc.output('blob'), name: fname };
  doc.save(fname);
}


// =====================================================
// CERFA MECENAT - Coordonnees ajustees via positionneur
// x = distance depuis la gauche, y = distance depuis le HAUT
// =====================================================
const CERFA_COORDS = {
  // --- PAGE 1 ---
  numero_recu:           { page: 1, x: 463, y: 135, size: 8 },
  denomination:          { page: 1, x: 201, y: 184, size: 9 },
  siren:                 { page: 1, x: 166, y: 207, size: 9 },
  adresse_numero:        { page: 1, x: 66, y: 230, size: 8 },
  adresse_rue:           { page: 1, x: 153, y: 233, size: 8 },
  adresse_cp:            { page: 1, x: 111, y: 245, size: 8 },
  adresse_commune:       { page: 1, x: 242, y: 244, size: 8 },
  adresse_pays:          { page: 1, x: 68, y: 255, size: 8 },
  objet:                 { page: 1, x: 79, y: 269, size: 8 },
  check_oeuvre:           { page: 1, x: 34, y: 383, size: 10 },
  check_asso_1901:        { page: 1, x: 56, y: 360, size: 10 },
  check_asso_rup:         { page: 1, x: 114, y: 365, size: 10 },
  check_fondation_uni:    { page: 1, x: 114, y: 394, size: 10 },
  check_fondation_ent:    { page: 1, x: 114, y: 410, size: 10 },
  check_musee:            { page: 1, x: 114, y: 421, size: 10 },
  check_aide_alim:        { page: 1, x: 114, y: 432, size: 10 },
  check_fonds_dot:        { page: 1, x: 28, y: 720, size: 10 },
  // --- PAGE 2 ---
  ent_denomination:       { page: 2, x: 197, y: 205, size: 9 },
  ent_forme_juridique:    { page: 2, x: 126, y: 216, size: 8 },
  ent_siren:              { page: 2, x: 124, y: 230, size: 8 },
  ent_adresse_numero:     { page: 2, x: 60, y: 253, size: 8 },
  ent_adresse_rue:        { page: 2, x: 173, y: 253, size: 8 },
  ent_adresse_cp:         { page: 2, x: 99, y: 267, size: 8 },
  ent_adresse_commune:    { page: 2, x: 236, y: 267, size: 8 },
  nature_montant:         { page: 2, x: 35, y: 336, size: 10 },
  nature_lettres:         { page: 2, x: 28, y: 359, size: 8 },
  nature_description:     { page: 2, x: 275, y: 383, size: 7, lineHeight: 12 },
  versement_montant:      { page: 2, x: 35, y: 475, size: 10 },
  versement_lettres:      { page: 2, x: 294, y: 483, size: 8 },
  check_virement:         { page: 2, x: 256, y: 523, size: 10 },
  total_montant:          { page: 2, x: 35, y: 546, size: 10 },
  total_lettres:          { page: 2, x: 371, y: 556, size: 8 },
  date_periode:           { page: 2, x: 101, y: 609, size: 8 },
  date_signature:         { page: 2, x: 349, y: 631, size: 9 },
  nom_signature:          { page: 2, x: 336, y: 659, size: 9 },
};

export async function generateCerfa(club, company, contract, invoice, season, returnBlob) {
  var pdfLib = await import('pdf-lib');
  var PDFDocument = pdfLib.PDFDocument;
  var rgb = pdfLib.rgb;
  var StandardFonts = pdfLib.StandardFonts;
  var C = CERFA_COORDS;

  var donAmount = contract.seasonDonAmounts?.[season] || contract.donAmount || 0;
  var prods = contract.seasonProducts?.[season] || [];
  var productsHT = prods.reduce(function(t, cp) { return t + (cp.unitPrice || 0) * (cp.qty || 1); }, 0);
  var todayFr = new Date().toLocaleDateString("fr-FR");
  var ct = club.cerfaType || "association_1901";

  // Club address (split fields, fallback to old address field)
  var clubNum = club.adresseNum || "";
  var clubRue = club.adresseRue || club.address || "";
  var clubCP = club.adresseCP || "";
  var clubVille = club.adresseCommune || "";

  // Company address (split fields, fallback to old address field)
  var coNum = company.adresseNum || "";
  var coRue = company.adresseRue || company.address || "";
  var coCP = company.adresseCP || "";
  var coVille = company.adresseCommune || "";

  // Load template
  var templateUrl = new URL('/cerfa-template.pdf', window.location.origin).href;
  var templateBytes = await fetch(templateUrl).then(function(r) { return r.arrayBuffer(); });
  var pdfDoc = await PDFDocument.load(templateBytes);
  var font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  var fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  var blue = rgb(0, 0, 0.7);

  var pages = pdfDoc.getPages();
  var p1 = pages[0];
  var p2 = pages[1];
  var H = p1.getSize().height;

  // Write text using coords (y from top -> PDF bottom-left)
  var write = function(text, coords, bold) {
    if (!text) return;
    var page = coords.page === 2 ? p2 : p1;
    page.drawText(String(text), {
      x: coords.x,
      y: H - coords.y,
      size: coords.size || 9,
      font: bold ? fontBold : font,
      color: blue
    });
  };

  // Draw X in checkbox
  var checkX = function(coords) {
    var page = coords.page === 2 ? p2 : p1;
    page.drawText("X", {
      x: coords.x + 1,
      y: H - coords.y,
      size: coords.size || 10,
      font: fontBold,
      color: blue
    });
  };

  // ============= PAGE 1 : Organisme beneficiaire =============
  var cerfaNum = "REC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
  write(cerfaNum, C.numero_recu);
  write(club.name || "", C.denomination);
  write(club.siren || club.siret || "", C.siren);
  write(clubNum, C.adresse_numero);
  write(clubRue, C.adresse_rue);
  write(clubCP, C.adresse_cp);
  write(clubVille, C.adresse_commune);
  write("France", C.adresse_pays);
  write(club.cerfaObjet || "Soutien aux activites sportives du club", C.objet);

  // Checkboxes page 1
  var isOeuvre = ["association_1901", "association_rup", "fondation_universitaire", "fondation_entreprise", "musee", "aide_alimentaire"].includes(ct);
  if (isOeuvre) checkX(C.check_oeuvre);
  if (ct === "association_1901") checkX(C.check_asso_1901);
  if (ct === "association_rup") checkX(C.check_asso_rup);
  if (ct === "fondation_universitaire") checkX(C.check_fondation_uni);
  if (ct === "fondation_entreprise") checkX(C.check_fondation_ent);
  if (ct === "musee") checkX(C.check_musee);
  if (ct === "aide_alimentaire") checkX(C.check_aide_alim);
  if (ct === "fonds_dotation") checkX(C.check_fonds_dot);

  // ============= PAGE 2 : Entreprise + Dons =============
  write(company.company || "", C.ent_denomination);
  write(company.formeJuridique || "", C.ent_forme_juridique);
  write(company.siret || "", C.ent_siren);
  write(coNum, C.ent_adresse_numero);
  write(coRue, C.ent_adresse_rue);
  write(coCP, C.ent_adresse_cp);
  write(coVille, C.ent_adresse_commune);

  // Dons en nature (contreparties)
  if (productsHT > 0) {
    write(fmtN(productsHT), C.nature_montant, true);
    write(numberToFrench(productsHT), C.nature_lettres);
    var descY = C.nature_description.y;
    prods.forEach(function(cp) {
      var line = fmtE((cp.unitPrice || 0) * (cp.qty || 1));
      write(line, { page: 2, x: C.nature_description.x, y: descY, size: C.nature_description.size });
      descY += C.nature_description.lineHeight;
    });
  }

  // Versements
  write(fmtN(donAmount), C.versement_montant, true);
  write(numberToFrench(donAmount), C.versement_lettres);

  // Forme versements : cocher Virement
  checkX(C.check_virement);

  // Montant total
  write(fmtN(donAmount), C.total_montant, true);
  write(numberToFrench(donAmount), C.total_lettres);

  // Date période = date de paiement (pas la saison)
  var paymentDate = invoice?.dateStr || todayFr;
  write(paymentDate, C.date_periode);

  // Signature
  write(todayFr, C.date_signature);
  write(club.president || "", C.nom_signature);

  // Signature image
  if (club.signature) {
    try {
      var sigData = club.signature;
      var sigBytes = Uint8Array.from(atob(sigData.split(",")[1]), function(c) { return c.charCodeAt(0); });
      var sigImage = sigData.includes("image/png") ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
      var sigW = 60; var sigH = sigW * sigImage.height / sigImage.width;
      if (sigH > 35) { sigH = 35; sigW = sigH * sigImage.width / sigImage.height; }
      p2.drawImage(sigImage, { x: 340, y: H - 700, width: sigW, height: sigH });
    } catch(e) { console.warn("Signature CERFA error:", e); }
  }

  // Download
  var pdfBytes = await pdfDoc.save();
  var blob = new Blob([pdfBytes], { type: "application/pdf" });
  var fname = "CERFA_Mecenat_" + company.company.replace(/\s/g, "_") + "_" + season + ".pdf";
  if (returnBlob) return { blob: blob, name: fname };
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);
}
