import { useState, useRef } from 'react';
import { useApp } from '../data/AppContext';
import { S, Cl } from '../data/styles';
import { uid } from '../data/initialData';
import { Modal } from './index';

// ====================================================
// CONFIGURATION DES TYPES D'IMPORT
// Ajoute ici un nouveau type si tu veux importer autre chose !
// ====================================================
const IMPORT_TYPES = {
  prospects: {
    label: "📋 Prospects",
    desc: "Entreprises à prospecter",
    fields: [
      { key: "company",        label: "Entreprise",      required: true },
      { key: "contact",        label: "Contact",         required: false },
      { key: "phone",          label: "Téléphone",       required: false },
      { key: "email",          label: "Email",           required: false },
      { key: "sector",         label: "Secteur",         required: false },
      { key: "address",        label: "Adresse",         required: false },
      { key: "adresseNum",     label: "N° voie",         required: false },
      { key: "adresseRue",     label: "Rue",             required: false },
      { key: "adresseCP",      label: "Code postal",     required: false },
      { key: "adresseCommune", label: "Commune",         required: false },
      { key: "formeJuridique", label: "Forme juridique", required: false },
      { key: "siret",          label: "SIRET",           required: false },
      { key: "tvaNumber",      label: "N° TVA",          required: false },
      { key: "member",         label: "Commercial",      required: false },
      { key: "notes",          label: "Notes",           required: false },
    ],
  },
  partenaires: {
    label: "🤝 Partenaires",
    desc: "Partenaires existants",
    fields: [
      { key: "company",        label: "Entreprise",      required: true },
      { key: "contact",        label: "Contact",         required: false },
      { key: "phone",          label: "Téléphone",       required: false },
      { key: "email",          label: "Email",           required: false },
      { key: "sector",         label: "Secteur",         required: false },
      { key: "address",        label: "Adresse",         required: false },
      { key: "adresseNum",     label: "N° voie",         required: false },
      { key: "adresseRue",     label: "Rue",             required: false },
      { key: "adresseCP",      label: "Code postal",     required: false },
      { key: "adresseCommune", label: "Commune",         required: false },
      { key: "formeJuridique", label: "Forme juridique", required: false },
      { key: "siret",          label: "SIRET",           required: false },
      { key: "tvaNumber",      label: "N° TVA",          required: false },
      { key: "dealType",       label: "Type (Partenariat/Mécénat)", required: false },
      { key: "member",         label: "Commercial",      required: false },
      { key: "notes",          label: "Notes",           required: false },
    ],
  },
  produits: {
    label: "📦 Produits",
    desc: "Produits & stocks",
    fields: [
      { key: "name",        label: "Nom du produit",   required: true },
      { key: "category",    label: "Catégorie",        required: false },
      { key: "subcategory", label: "Sous-catégorie",   required: false },
      { key: "productType", label: "Type de produit",  required: false },
      { key: "placement",   label: "Emplacement",      required: false },
      { key: "price",       label: "Prix vente HT",    required: false },
      { key: "cost",        label: "Coût revient",     required: false },
      { key: "stock",       label: "Stock",             required: false },
      { key: "tva",         label: "TVA %",             required: false },
      { key: "totalCost",   label: "Investissement",    required: false },
      { key: "amort",       label: "Amortissement",     required: false },
    ],
  },
};

// ====================================================
// AUTO-DETECTION : associe les noms de colonnes courants aux champs
// ====================================================
const ALIASES = {
  company:        ["entreprise", "société", "societe", "nom", "raison sociale", "company", "name", "nom entreprise", "nom_entreprise", "raison_sociale"],
  contact:        ["contact", "interlocuteur", "nom contact", "prénom nom", "referent", "référent", "nom_contact"],
  phone:          ["téléphone", "telephone", "tel", "tél", "phone", "mobile", "portable", "num_tel", "numéro"],
  email:          ["email", "mail", "e-mail", "courriel", "adresse mail", "adresse_mail"],
  sector:         ["secteur", "activité", "activite", "domaine", "sector", "catégorie", "categorie", "secteur_activite"],
  address:        ["adresse", "address", "adresse complète", "adresse_complete"],
  adresseNum:     ["n°", "numéro", "num", "n° voie", "numero_voie"],
  adresseRue:     ["rue", "voie", "nom_voie", "nom voie", "street"],
  adresseCP:      ["cp", "code postal", "code_postal", "zip", "postal"],
  adresseCommune: ["commune", "ville", "city", "localité", "localite"],
  formeJuridique: ["forme juridique", "forme_juridique", "statut", "type entreprise"],
  siret:          ["siret", "n° siret", "siren", "num_siret"],
  tvaNumber:      ["tva", "n° tva", "num_tva", "tva intra", "tva_intra"],
  dealType:       ["type", "type contrat", "partenariat", "mécénat", "deal_type"],
  member:         ["commercial", "assigné", "assignee", "responsable", "membre", "member", "attribué"],
  notes:          ["notes", "commentaire", "remarque", "observation", "commentaires", "note"],
  name:           ["nom", "produit", "nom produit", "nom_produit", "name", "product", "désignation", "designation", "libellé", "libelle"],
  price:          ["prix", "prix vente", "prix_vente", "prix ht", "prix_ht", "tarif", "price"],
  cost:           ["coût", "cout", "coût revient", "cout_revient", "cost", "prix achat", "prix_achat"],
  stock:          ["stock", "quantité", "quantite", "qty", "quantity", "disponible"],
  tva:            ["tva", "tva %", "taux tva", "taux_tva", "tax"],
  totalCost:      ["investissement", "invest", "coût total", "cout_total", "total_cost", "investment"],
  amort:          ["amortissement", "amort", "depreciation"],
  category:       ["catégorie", "categorie", "category", "cat", "famille"],
  subcategory:    ["sous-catégorie", "sous_categorie", "sous categorie", "subcategory", "sub_category", "sous-cat", "sous_cat", "sous cat"],
  productType:    ["type de produit", "type_produit", "type produit", "product_type", "product type", "type"],
  placement:      ["emplacement", "lieu", "localisation", "location", "placement", "zone"],
};

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
}

function autoMap(headers, fields) {
  const mapping = {};
  fields.forEach(f => {
    const aliases = ALIASES[f.key] || [f.key];
    const match = headers.find(h => {
      const hn = normalize(h);
      return aliases.some(a => normalize(a) === hn);
    });
    if (match) mapping[f.key] = match;
  });
  return mapping;
}

// ====================================================
// PARSEUR CSV simple (gère guillemets, virgules, points-virgules)
// ====================================================
function parseCSVSmart(text) {
  // Détecte le séparateur : point-virgule ou virgule
  const firstLine = text.split(/\r?\n/)[0] || "";
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const vals = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === sep) { vals.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
    }
    vals.push(cur.trim());
    return vals;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(row => Object.values(row).some(v => v)); // filtre les lignes vides

  return { headers, rows };
}

// ====================================================
// PARSEUR EXCEL (xlsx) — utilise SheetJS via CDN
// ====================================================
let XLSX = null;
async function loadXLSX() {
  if (XLSX) return XLSX;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => { XLSX = window.XLSX; resolve(XLSX); };
    s.onerror = () => reject(new Error("Impossible de charger la librairie Excel"));
    document.head.appendChild(s);
  });
}

async function parseExcel(file) {
  const lib = await loadXLSX();
  const data = await file.arrayBuffer();
  const wb = lib.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = lib.utils.sheet_to_json(ws, { defval: "" });
  if (!json.length) return { headers: [], rows: [], sheets: wb.SheetNames };
  return { headers: Object.keys(json[0]), rows: json, sheets: wb.SheetNames };
}

// ====================================================
// COMPOSANT PRINCIPAL
// ====================================================
export default function ImportWizard({ onClose, defaultType }) {
  const { companies, setCompanies, products, setProducts, members, currentSeason, cats } = useApp();

  const [step, setStep] = useState(1);               // 1=type+fichier, 2=mapping, 3=aperçu
  const [importType, setImportType] = useState(defaultType || "prospects");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});         // { fieldKey: headerName }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);         // { added, skipped }
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const config = IMPORT_TYPES[importType];
  const fields = config.fields;

  // --- Charger un fichier ---
  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      let parsed;
      const ext = file.name.split(".").pop().toLowerCase();
      if (["xlsx", "xls", "xlsm"].includes(ext)) {
        parsed = await parseExcel(file);
      } else {
        const text = await file.text();
        parsed = parseCSVSmart(text);
      }
      if (!parsed.headers.length || !parsed.rows.length) {
        setError("Fichier vide ou format non reconnu.");
        setLoading(false);
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      // Auto-mapping
      setMapping(autoMap(parsed.headers, fields));
      setStep(2);
    } catch (e) {
      setError("Erreur de lecture : " + (e.message || "format invalide"));
    }
    setLoading(false);
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const onFileInput = (e) => { handleFile(e.target.files[0]); e.target.value = ""; };

  // --- Mapper une colonne ---
  const setMap = (fieldKey, headerName) => {
    const m = { ...mapping };
    if (headerName === "") delete m[fieldKey];
    else m[fieldKey] = headerName;
    setMapping(m);
  };

  // --- Aperçu des données mappées ---
  const mappedRows = rows.map(row => {
    const obj = {};
    fields.forEach(f => {
      const col = mapping[f.key];
      obj[f.key] = col ? String(row[col] || "").trim() : "";
    });
    return obj;
  });

  // --- Import effectif ---
  const doImport = () => {
    let added = 0, skipped = 0;

    if (importType === "produits") {
      // Import de produits
      const newProducts = [];
      mappedRows.forEach(row => {
        if (!row.name) { skipped++; return; }
        if (products.some(p => p.name.toLowerCase() === row.name.toLowerCase())) { skipped++; return; }
        if (newProducts.some(p => p.name.toLowerCase() === row.name.toLowerCase())) { skipped++; return; }
        const price = parseFloat(row.price) || 0;
        const cost = parseFloat(row.cost) || 0;
        const amort = parseFloat(row.amort) || 0;
        newProducts.push({
          id: uid(),
          name: row.name,
          category: row.category || cats[0] || "Signalétique",
          subcategory: row.subcategory || "",
          productType: row.productType || "",
          placement: row.placement || "",
          stock: parseInt(row.stock) || 0,
          tva: parseFloat(row.tva) || 20,
          totalCost: parseFloat(row.totalCost) || 0,
          prices: { [currentSeason]: { price, cost, amort } },
        });
        added++;
      });
      if (newProducts.length) setProducts(ps => [...ps, ...newProducts]);
    } else {
      // Import prospects / partenaires
      const isPartner = importType === "partenaires";
      const newCompanies = [];
      mappedRows.forEach(row => {
        if (!row.company) { skipped++; return; }
        if (companies.some(c => c.company.toLowerCase() === row.company.toLowerCase())) { skipped++; return; }
        if (newCompanies.some(c => c.company.toLowerCase() === row.company.toLowerCase())) { skipped++; return; }
        newCompanies.push({
          id: uid(),
          company: row.company,
          sector: row.sector || "",
          contact: row.contact || "",
          phone: String(row.phone || ""),
          email: row.email || "",
          address: row.address || "",
          adresseNum: row.adresseNum || "",
          adresseRue: row.adresseRue || "",
          adresseCP: row.adresseCP || "",
          adresseCommune: row.adresseCommune || "",
          formeJuridique: row.formeJuridique || "",
          siret: String(row.siret || ""),
          tvaNumber: row.tvaNumber || "",
          accountCode: "",
          season: currentSeason,
          isPartner,
          dealType: row.dealType || "Partenariat",
          donAmount: 0,
          prospectStatus: isPartner ? "" : "Nouveau",
          partnerStatus: isPartner ? "Nouveau partenaire" : "",
          callbackDate: "",
          rdvDate: "",
          member: row.member || members[0] || "",
          products: [],
          seasonProducts: {},
          seasonDonAmounts: {},
          notes: row.notes ? [{ id: uid(), date: new Date().toISOString().slice(0, 10), text: row.notes }] : [],
          actions: [],
        });
        added++;
      });
      if (newCompanies.length) setCompanies(cs => [...cs, ...newCompanies]);
    }
    setResult({ added, skipped });
    setStep(4);
  };

  // --- Télécharger un modèle CSV ---
  const downloadTemplate = () => {
    const sep = ";";
    const header = fields.map(f => f.label).join(sep);
    // Ligne d'exemple
    const examples = {
      prospects: { Entreprise: "Boulangerie Dupont", Contact: "Jean Dupont", "Téléphone": "0601020304", Email: "jean@dupont.fr", Secteur: "Alimentaire", Commercial: "Marie" },
      partenaires: { Entreprise: "Garage Martin", Contact: "Pierre Martin", "Téléphone": "0611223344", Email: "pierre@garage.fr", Secteur: "Automobile", Commercial: "Paul" },
      produits: { "Nom du produit": "Panneau LED 4x3", "Catégorie": "Signalétique", "Sous-catégorie": "Panneaux", "Type de produit": "LED", "Emplacement": "Tribune", "Prix vente HT": "1500", "Coût revient": "200", Stock: "10", "TVA %": "20", Investissement: "5000", Amortissement: "1000" },
    };
    const ex = examples[importType] || {};
    const exampleRow = fields.map(f => ex[f.label] || "").join(sep);
    const csv = header + "\n" + exampleRow;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modele_${importType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Colonnes non-mappées (pour info) ---
  const usedHeaders = new Set(Object.values(mapping));
  const unusedHeaders = headers.filter(h => !usedHeaders.has(h));

  // ====================================================
  // RENDU
  // ====================================================
  return (
    <Modal title="📥 Import de données" onClose={onClose}>

      {/* === ÉTAPE 1 : Type + Fichier === */}
      {step === 1 && (
        <div>
          {/* Choix du type */}
          <label style={S.lbl}>Que voulez-vous importer ?</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {Object.entries(IMPORT_TYPES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setImportType(key)}
                style={{
                  ...S.btn(importType === key ? "primary" : "ghost"),
                  flex: 1,
                  textAlign: "center",
                  border: importType === key ? "none" : `1px solid ${Cl.brd}`,
                }}
              >
                {t.label}
                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Zone de drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? Cl.pri : Cl.brd}`,
              borderRadius: 10,
              padding: "36px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? Cl.priL : Cl.hov,
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: Cl.txt }}>
              Glissez votre fichier ici
            </div>
            <div style={{ fontSize: 12, color: Cl.txtL, marginTop: 4 }}>
              ou cliquez pour parcourir — CSV, Excel (.xlsx, .xls)
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.tsv"
              onChange={onFileInput}
              style={{ display: "none" }}
            />
          </div>

          {loading && <div style={{ textAlign: "center", marginTop: 12, color: Cl.pri }}>⏳ Chargement...</div>}
          {error && <div style={{ ...S.alert("danger"), marginTop: 12 }}>{error}</div>}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button onClick={downloadTemplate} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: Cl.pri, textDecoration: "underline" }}>
              📄 Télécharger un modèle CSV ({config.label.replace(/^[^\s]+\s/, "")})
            </button>
          </div>
        </div>
      )}

      {/* === ÉTAPE 2 : Mapping des colonnes === */}
      {step === 2 && (
        <div>
          <div style={{ ...S.alert("success"), marginBottom: 12 }}>
            ✅ {rows.length} ligne(s) détectée(s) · {headers.length} colonne(s)
          </div>

          <label style={{ ...S.lbl, marginBottom: 8 }}>Associez chaque champ à une colonne de votre fichier :</label>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {fields.map(f => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 150, fontSize: 13, fontWeight: f.required ? 600 : 400 }}>
                  {f.label} {f.required && <span style={{ color: Cl.err }}>*</span>}
                </div>
                <div style={{ fontSize: 18 }}>←</div>
                <select
                  style={{ ...S.sel, flex: 1, background: mapping[f.key] ? Cl.okL : Cl.wh }}
                  value={mapping[f.key] || ""}
                  onChange={e => setMap(f.key, e.target.value)}
                >
                  <option value="">— Ignorer —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapping[f.key] && (
                  <span style={{ fontSize: 11, color: Cl.ok, fontWeight: 600, whiteSpace: "nowrap" }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Colonnes non utilisées */}
          {unusedHeaders.length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: Cl.hov, borderRadius: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: Cl.txtL }}>Colonnes ignorées :</span>{" "}
              {unusedHeaders.map(h => (
                <span key={h} style={{ ...S.badge(Cl.txtL, Cl.hov), border: `1px solid ${Cl.brd}`, margin: 2 }}>{h}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between" }}>
            <button style={S.btn("ghost")} onClick={() => setStep(1)}>← Retour</button>
            <button
              style={S.btn("primary")}
              onClick={() => {
                const requiredKey = importType === "produits" ? "name" : "company";
                const requiredLabel = importType === "produits" ? "Nom du produit" : "Entreprise";
                if (!mapping[requiredKey]) {
                  setError(`Le champ « ${requiredLabel} » est obligatoire.`);
                  return;
                }
                setError("");
                setStep(3);
              }}
            >
              Aperçu →
            </button>
          </div>
          {error && <div style={{ ...S.alert("danger"), marginTop: 8 }}>{error}</div>}
        </div>
      )}

      {/* === ÉTAPE 3 : Aperçu avant import === */}
      {step === 3 && (() => {
        const nameKey = importType === "produits" ? "name" : "company";
        const existingNames = importType === "produits"
          ? products.map(p => p.name.toLowerCase())
          : companies.map(c => c.company.toLowerCase());
        const countOk = mappedRows.filter(r => r[nameKey] && !existingNames.includes(r[nameKey].toLowerCase())).length;
        return (
        <div>
          <div style={{ ...S.alert("success"), marginBottom: 12 }}>
            📋 Aperçu — {countOk} entrée(s) à importer
          </div>

          <div style={{ overflowX: "auto", maxHeight: 350 }}>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  {fields.filter(f => mapping[f.key]).map(f => (
                    <th key={f.key} style={S.th}>{f.label}</th>
                  ))}
                  <th style={S.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {mappedRows.slice(0, 50).map((row, i) => {
                  const name = row[nameKey];
                  const isDuplicate = !name || existingNames.includes(name.toLowerCase());
                  return (
                    <tr key={i} style={{ opacity: isDuplicate ? 0.4 : 1 }}>
                      <td style={S.td}>{i + 1}</td>
                      {fields.filter(f => mapping[f.key]).map(f => (
                        <td key={f.key} style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row[f.key]}
                        </td>
                      ))}
                      <td style={S.td}>
                        {!name
                          ? <span style={S.badge(Cl.err, Cl.errL)}>Nom manquant</span>
                          : isDuplicate
                            ? <span style={S.badge(Cl.warn, Cl.warnL)}>Doublon</span>
                            : <span style={S.badge(Cl.ok, Cl.okL)}>OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {mappedRows.length > 50 && (
              <div style={{ fontSize: 12, color: Cl.txtL, textAlign: "center", marginTop: 8 }}>
                ... et {mappedRows.length - 50} ligne(s) de plus
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between" }}>
            <button style={S.btn("ghost")} onClick={() => setStep(2)}>← Mapping</button>
            <button style={S.btn("primary")} onClick={doImport}>
              ✅ Importer {countOk} entrée(s)
            </button>
          </div>
        </div>
        );
      })()}

      {/* === ÉTAPE 4 : Résultat === */}
      {step === 4 && result && (
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Import terminé !</div>
          <div style={{ fontSize: 14, color: Cl.txt, marginBottom: 4 }}>
            ✅ <strong>{result.added}</strong> {importType === "produits" ? "produit(s)" : importType === "partenaires" ? "partenaire(s)" : "prospect(s)"} ajouté(s)
          </div>
          {result.skipped > 0 && (
            <div style={{ fontSize: 13, color: Cl.txtL }}>
              ⏭️ {result.skipped} ignoré(s) (doublons ou nom manquant)
            </div>
          )}
          <button style={{ ...S.btn("primary"), marginTop: 16 }} onClick={onClose}>
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
}
