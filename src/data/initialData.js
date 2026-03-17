// --- UID generator ---
let nid = 100;
export const uid = () => ++nid;

// --- CSV helpers ---
export const toCSV = (rows) => { if (!rows.length) return ""; const h = Object.keys(rows[0]); const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; }; return [h.map(esc).join(","), ...rows.map(r => h.map(k => esc(r[k])).join(","))].join("\n"); };
export const dlCSV = (fn, csv) => { const b = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); };
export const parseCSV = (text) => { const lines = text.split(/\r?\n/).filter(l => l.trim()); if (lines.length < 2) return []; const hd = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim()); return lines.slice(1).map(line => { const v = []; let c = ""; let q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else { if (ch === '"') q = true; else if (ch === ",") { v.push(c.trim()); c = ""; } else c += ch; } } v.push(c.trim()); const o = {}; hd.forEach((h, i) => { o[h] = v[i] || ""; }); return o; }); };

// --- Helpers ---
export const fmt = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
export const lineHT = (cp) => (cp.unitPrice || 0) * (cp.qty || 1);
export const lineTTC = (cp, tva) => lineHT(cp) * (1 + (tva || 20) / 100);
export const getPrice = (prod, season) => (prod.prices && prod.prices[season]) || { cost: 0, price: 0, amort: 0 };
export const isSigned = (c) => ["Signé", "Facturé", "Payé"].includes(c.status);
export const getContractSeasonIds = (contract, seasons) => {
  const i = seasons.findIndex(s => s.id === contract.startSeason);
  return i < 0 ? [] : seasons.slice(i, i + (contract.seasons || 1)).map(s => s.id);
};
export const getSeasonProducts = (contract, company) => {
  if (contract.seasonProducts && Object.keys(contract.seasonProducts).length > 0) return contract.seasonProducts;
  // Fallback: company products for all seasons
  return {};
};
// --- Accounting helpers ---
export const genAccountCode = (companyName) => {
  const clean = (companyName || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  return "411" + (clean || "XXXXX");
};
export const invoiceNum = (date, seq) => {
  const d = date || new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `FA-${d}-${String(seq).padStart(5, "0")}`;
};
export const INIT_ACCOUNT_CODES = {
  tva: { 20: "44571000", 10: "44571000", 5.5: "44571000" },
  categories: { "Signalétique": "70820000", "Print": "70830000", "Textile": "70840000", "Digital": "70851000", "Événement": "70843000" },
};
export const INVOICE_STATUSES = ["Émise", "Payée partiellement", "Payée", "Annulée"];
export const INIT_SCRIPTS = {
  "Partenariat": `**Introduction**\nBonjour [contact], je suis [nom] du [club].\nJe vous contacte car nous proposons des partenariats pour la saison [saison].\n\n**Présentation**\n• Expliquer les différentes formules de visibilité\n• Mentionner le nombre de spectateurs / matchs\n• Évoquer les retombées pour le partenaire\n\n**Questions à poser**\n• Avez-vous déjà fait du sponsoring sportif ?\n• Quel budget envisagez-vous ?\n• Quels supports vous intéressent ?\n\n**Conclusion**\n• Proposer un RDV pour présenter le dossier\n• Envoyer la plaquette par email\n• Remercier pour le temps accordé`,
  "Mécénat": `**Introduction**\nBonjour [contact], je suis [nom] du [club].\nJe vous contacte concernant notre programme de mécénat pour la saison [saison].\n\n**Présentation**\n• Expliquer la mission sociale/éducative du club\n• Mentionner l'avantage fiscal (60% de réduction d'impôt)\n• Préciser la règle des 25% max de contreparties\n\n**Questions à poser**\n• Votre entreprise fait-elle déjà du mécénat ?\n• Connaissez-vous les avantages fiscaux ?\n• Quel montant de don envisageriez-vous ?\n\n**Conclusion**\n• Proposer un RDV pour détailler la convention\n• Envoyer la documentation mécénat\n• Remercier pour le temps accordé`,
};
export const statusBType = (s) => ({ "Nouveau": "new", "Pas répondu": "noreply", "Intéressé": "interested", "À rappeler": "callback", "RDV pris": "rdv", "Proposition envoyée": "proposition", "Renouvellement potentiel": "renewal", "Refusé": "refused", "Nouveau partenaire": "partner", "Renouvellement": "renewal" }[s] || "draft");

// --- Constants ---
export const P_STATUSES = ["Nouveau", "Pas répondu", "Intéressé", "À rappeler", "RDV pris", "Proposition envoyée", "Renouvellement potentiel", "Refusé"];
export const PARTNER_STATUSES = ["Nouveau partenaire", "Renouvellement"];
export const ACTION_TYPES = ["Prospection", "Partenariat", "Mise en place", "Contrat", "Facturation"];

export const INIT_MEMBERS = ["Sarah Martin", "Lucas Dupont", "Amina Bey", "Thomas Roux"];
export const INIT_CATS = ["Signalétique", "Print", "Textile", "Digital", "Événement"];
export const INIT_CURRENT = "2025-2026";

export const INIT_SEASONS = [
  { id: "2024-2025", name: "2024-2025", startDate: "2024-09-01", endDate: "2025-06-30" },
  { id: "2025-2026", name: "2025-2026", startDate: "2025-09-01", endDate: "2026-06-30" },
  { id: "2026-2027", name: "2026-2027", startDate: "2026-09-01", endDate: "2027-06-30" },
  { id: "2027-2028", name: "2027-2028", startDate: "2027-09-01", endDate: "2028-06-30" },
];

export const INIT_PRODUCTS = [
  { id: 1, name: "Panneau terrain (grand)", category: "Signalétique", stock: 10, tva: 20, totalCost: 5000, prices: { "2024-2025": { price: 1400, cost: 180, amort: 1000 }, "2025-2026": { price: 1500, cost: 200, amort: 1000 }, "2026-2027": { price: 1500, cost: 200, amort: 1000 } } },
  { id: 2, name: "Panneau terrain (petit)", category: "Signalétique", stock: 15, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 800, cost: 120, amort: 0 } } },
  { id: 3, name: "Encart programme match", category: "Print", stock: 50, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 300, cost: 15, amort: 0 } } },
  { id: 4, name: "Logo maillot (dos)", category: "Textile", stock: 1, tva: 20, totalCost: 30000, prices: { "2024-2025": { price: 2800, cost: 0, amort: 10000 }, "2025-2026": { price: 3000, cost: 0, amort: 12000 }, "2026-2027": { price: 3200, cost: 0, amort: 8000 } } },
  { id: 5, name: "Logo maillot (manche)", category: "Textile", stock: 2, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 1500, cost: 0, amort: 0 } } },
  { id: 6, name: "Encart site web", category: "Digital", stock: 20, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 500, cost: 0, amort: 0 } } },
  { id: 7, name: "Post réseaux sociaux (x5)", category: "Digital", stock: 30, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 400, cost: 0, amort: 0 } } },
  { id: 8, name: "Bâche tribune", category: "Signalétique", stock: 4, tva: 20, totalCost: 8000, prices: { "2024-2025": { price: 2200, cost: 350, amort: 2000 }, "2025-2026": { price: 2500, cost: 350, amort: 2000 }, "2026-2027": { price: 2500, cost: 350, amort: 2000 }, "2027-2028": { price: 2500, cost: 350, amort: 2000 } } },
  { id: 9, name: "Annonce speaker match", category: "Événement", stock: 40, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 200, cost: 0, amort: 0 } } },
  { id: 10, name: "Table VIP (1 match)", category: "Événement", stock: 20, tva: 20, totalCost: 0, prices: { "2025-2026": { price: 600, cost: 50, amort: 0 } } },
];

export const INIT_COMPANIES = [
  { id: 1, company: "Boulangerie Durand", accountCode: "411BOULA", sector: "Alimentation", contact: "Marie Durand", phone: "0612345678", email: "m.durand@boulangerie.fr", address: "12 rue du Pain, 49300 Cholet", siret: "", tvaNumber: "", season: "2025-2026", isPartner: false, dealType: "Partenariat", donAmount: 0, prospectStatus: "Intéressé", partnerStatus: "", callbackDate: "", rdvDate: "", member: "Sarah Martin", products: [{ productId: 3, qty: 2, unitPrice: 300 }], seasonProducts: { "2025-2026": [{ productId: 3, qty: 2, unitPrice: 300 }] }, notes: [{ id: 1, date: "2026-03-08", text: "Appelée, intéressée par encarts" }], actions: [{ id: 1, type: "Fixer un RDV", category: "Prospection", date: "2026-03-10", done: false, note: "Premier contact", assignee: "Sarah Martin" }] },
  { id: 2, company: "Garage Auto Plus", accountCode: "411GARAG", sector: "Automobile", contact: "Jean Petit", phone: "0698765432", email: "jpetit@autoplus.fr", address: "ZI Nord, 49300 Cholet", siret: "12345678900012", tvaNumber: "FR12345678900", season: "2025-2026", isPartner: true, dealType: "Partenariat", donAmount: 0, prospectStatus: "", partnerStatus: "Renouvellement", callbackDate: "", rdvDate: "", member: "Lucas Dupont", products: [{ productId: 1, qty: 1, unitPrice: 1350 }, { productId: 9, qty: 5, unitPrice: 200 }], seasonProducts: { "2025-2026": [{ productId: 1, qty: 1, unitPrice: 1350 }, { productId: 9, qty: 5, unitPrice: 200 }], "2026-2027": [{ productId: 1, qty: 1, unitPrice: 1400 }, { productId: 9, qty: 5, unitPrice: 200 }, { productId: 6, qty: 1, unitPrice: 500 }] }, notes: [{ id: 2, date: "2026-03-07", text: "Partenaire saison dernière, contrat renouvelé" }], actions: [{ id: 3, type: "Installer panneau", category: "Mise en place", date: "2026-03-20", done: false, note: "", assignee: "Thomas Roux" }] },
  { id: 3, company: "Pharmacie Centrale", accountCode: "411PHARM", sector: "Santé", contact: "Sophie Lemaire", phone: "0655443322", email: "s.lemaire@pharma.fr", address: "Place de la Mairie, 49300 Cholet", siret: "", tvaNumber: "", season: "2025-2026", isPartner: false, dealType: "Mécénat", donAmount: 5000, prospectStatus: "RDV pris", partnerStatus: "", callbackDate: "", rdvDate: "2026-03-12", member: "Sarah Martin", products: [], notes: [{ id: 3, date: "2026-03-09", text: "RDV confirmé 12 mars 14h — intéressée par mécénat" }], actions: [{ id: 4, type: "RDV", category: "Prospection", date: "2026-03-12", done: false, note: "14h", assignee: "Sarah Martin" }] },
  { id: 4, company: "Fleurs & Jardins", accountCode: "411FLEUR", sector: "Commerce", contact: "Luc Moreau", phone: "0644332211", email: "luc@fleurs.fr", address: "3 rue des Lilas, 49300 Cholet", siret: "", tvaNumber: "", season: "2024-2025", isPartner: false, dealType: "Partenariat", donAmount: 0, prospectStatus: "Refusé", partnerStatus: "", callbackDate: "", rdvDate: "", member: "Amina Bey", products: [], notes: [{ id: 4, date: "2025-06-10", text: "Pas intéressé cette saison" }], actions: [] },
];

export const INIT_CONTRACTS = [
  { id: 1, companyId: 2, type: "Partenariat", member: "Lucas Dupont", signataire: "Jean Petit", seasons: 2, startSeason: "2025-2026", status: "Signé", donAmount: 0, seasonProducts: {
    "2025-2026": [{ productId: 1, qty: 1, unitPrice: 1350 }, { productId: 9, qty: 5, unitPrice: 200 }],
    "2026-2027": [{ productId: 1, qty: 1, unitPrice: 1400 }, { productId: 9, qty: 5, unitPrice: 200 }, { productId: 6, qty: 1, unitPrice: 500 }]
  }, payments: [{ id: 1, label: "Acompte 50%", amount: 1175, dueDate: "2026-04-01", status: "Payé" }, { id: 2, label: "Solde 50%", amount: 1175, dueDate: "2026-09-01", status: "En attente" }], actions: [{ id: 10, type: "Envoyer facture solde", category: "Facturation", date: "2026-08-15", done: false, note: "", assignee: "Lucas Dupont" }] },
];

export const INIT_CLUB_INFO = {
  name: "Club Sportif de Cholet",
  address: "12 avenue du Stade, 49300 Cholet",
  phone: "02 41 00 00 00",
  email: "contact@clubcholet.fr",
  siret: "123 456 789 00012",
  siren: "123 456 789",
  tvaNumber: "FR 12 345678900",
  president: "Michel Dupont",
  validiteDays: 30,
  cerfaObjet: "Soutien aux activités sportives et éducatives du club",
  cerfaType: "association_1901",
};

// --- Number to French words ---
export const numberToFrench = (n) => {
  const u = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const d = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  if (n === 0) return "zéro";
  const convert = (num) => {
    if (num < 20) return u[num];
    if (num < 100) {
      const t = Math.floor(num / 10); const r = num % 10;
      if (t === 7 || t === 9) return d[t] + (r === 1 && t === 7 ? "-et-" : "-") + u[r + 10];
      if (t === 8 && r === 0) return "quatre-vingts";
      return d[t] + (r === 1 && t < 8 ? "-et-un" : r > 0 ? "-" + u[r] : "");
    }
    if (num < 1000) { const c = Math.floor(num / 100); const r = num % 100; return (c === 1 ? "cent" : u[c] + "-cent") + (r === 0 && c > 1 ? "s" : r > 0 ? " " + convert(r) : ""); }
    if (num < 1000000) { const m = Math.floor(num / 1000); const r = num % 1000; return (m === 1 ? "mille" : convert(m) + " mille") + (r > 0 ? " " + convert(r) : ""); }
    const mi = Math.floor(num / 1000000); const r = num % 1000000;
    return (mi === 1 ? "un million" : convert(mi) + " millions") + (r > 0 ? " " + convert(r) : "");
  };
  const euros = Math.floor(n);
  const cents = Math.round((n - euros) * 100);
  let result = convert(euros) + " euro" + (euros > 1 ? "s" : "");
  if (cents > 0) result += " et " + convert(cents) + " centime" + (cents > 1 ? "s" : "");
  return result;
};
