import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { useAuth } from '../data/AuthContext';
import { S, Cl } from '../data/styles';

const font = `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`;

const st = {
  bg: { minHeight: "100vh", background: `linear-gradient(160deg, #0f172a 0%, ${Cl.slate} 50%, ${Cl.slateL} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { background: "#fff", borderRadius: 14, padding: "36px 40px", maxWidth: 520, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" },
  step: { fontSize: 11, fontWeight: 600, color: Cl.pri, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 },
  sub: { fontSize: 13, color: Cl.txtL, marginBottom: 20, lineHeight: 1.5 },
  label: { fontSize: 12, fontWeight: 500, color: Cl.txtL, marginBottom: 3, display: "block" },
  inp: { padding: "9px 12px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", marginBottom: 10 },
  row: { display: "flex", gap: 10 },
  btnMain: { padding: "11px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: font, background: Cl.slate, color: "#fff" },
  btnGhost: { padding: "11px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13, fontFamily: font, background: "transparent", color: Cl.txtL },
  btnSkip: { background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontFamily: font, color: Cl.txtL, padding: 4, marginTop: 12 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  dots: { display: "flex", gap: 6 },
  dot: (active) => ({ width: 8, height: 8, borderRadius: "50%", background: active ? Cl.slate : Cl.brd }),
  memberRow: { display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 13 },
  tag: { fontSize: 11, padding: "3px 8px", borderRadius: 4, background: Cl.priL, color: Cl.pri, fontWeight: 500 },
  helpBox: { background: Cl.priL, borderRadius: 10, padding: 20, textAlign: "center", marginTop: 16, border: `1px solid ${Cl.pri}30` },
  helpIcon: { fontSize: 36, marginBottom: 8 },
};

const STEPS = ["Club", "Équipe", "Saison", "Produits", "C'est parti !"];

export default function Onboarding({ onFinish }) {
  const ctx = useApp();
  const auth = useAuth();
  const [step, setStep] = useState(0);

  // Step 1: Club info
  const [club, setClub] = useState({
    name: "", phone: "", email: "", siret: "",
    adresseNum: "", adresseRue: "", adresseCP: "", adresseCommune: "",
    president: "",
  });
  const setC = (k, v) => setClub(prev => ({ ...prev, [k]: v }));

  // Step 2: Team
  const [team, setTeam] = useState([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const addTeamMember = () => {
    if (!newName.trim()) return;
    setTeam(t => [...t, { name: newName.trim(), email: newEmail.trim() }]);
    setNewName(""); setNewEmail("");
  };

  // Step 3: Season
  const [seasonName, setSeasonName] = useState(ctx.seasons?.[ctx.seasons.length - 1]?.name || "2025-2026");

  // Step 4: Products (quick add)
  const [quickProds, setQuickProds] = useState([
    { name: "", category: "Signalétique", price: "", stock: "" },
  ]);
  const setQP = (i, k, v) => setQuickProds(ps => ps.map((p, j) => j === i ? { ...p, [k]: v } : p));
  const addQP = () => setQuickProds(ps => [...ps, { name: "", category: "Signalétique", price: "", stock: "" }]);
  const removeQP = (i) => setQuickProds(ps => ps.filter((_, j) => j !== i));

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const finish = () => {
    // Sauvegarder les infos du club
    if (club.name) {
      ctx.setClubInfo(ci => ({
        ...ci,
        ...club,
        onboardingDone: true,
      }));
    } else {
      ctx.setClubInfo(ci => ({ ...ci, onboardingDone: true }));
    }

    // Ajouter les membres d'équipe
    team.forEach(m => {
      if (m.name) ctx.addMember(m.name, m.email || "");
    });

    // Ajouter les produits rapides
    quickProds.forEach(p => {
      if (p.name && p.price) {
        const season = ctx.currentSeason;
        ctx.setProducts(ps => [...ps, {
          id: Date.now() + Math.random(),
          name: p.name,
          category: p.category,
          stock: parseInt(p.stock) || 0,
          tva: 20,
          totalCost: 0,
          prices: { [season]: { price: parseFloat(p.price) || 0, cost: 0, amort: 0 } },
        }]);
      }
    });

    onFinish();
  };

  const skipAll = () => {
    ctx.setClubInfo(ci => ({ ...ci, onboardingDone: true }));
    onFinish();
  };

  return (
    <div style={st.bg}>
      <div style={st.card}>
        {/* Stepper dots */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={st.dots}>{STEPS.map((_, i) => <div key={i} style={st.dot(i <= step)} />)}</div>
          <button style={st.btnSkip} onClick={skipAll}>Passer l'intro →</button>
        </div>

        {/* === STEP 1 : CLUB === */}
        {step === 0 && (<>
          <div style={st.step}>Étape 1 / {STEPS.length}</div>
          <div style={st.title}>Bienvenue sur ClubPartner ! 🏟️</div>
          <div style={st.sub}>Commençons par les informations de votre club. Elles seront utilisées pour vos devis, contrats et factures.</div>

          <label style={st.label}>Nom du club *</label>
          <input style={st.inp} value={club.name} onChange={e => setC("name", e.target.value)} placeholder="Ex: FC Nantes" autoFocus />

          <div style={st.row}>
            <div style={{ flex: 1 }}>
              <label style={st.label}>N° et rue</label>
              <input style={st.inp} value={club.adresseRue} onChange={e => setC("adresseRue", e.target.value)} placeholder="12 avenue du Stade" />
            </div>
          </div>
          <div style={st.row}>
            <div style={{ flex: 1 }}>
              <label style={st.label}>Code postal</label>
              <input style={st.inp} value={club.adresseCP} onChange={e => setC("adresseCP", e.target.value)} placeholder="44000" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={st.label}>Commune</label>
              <input style={st.inp} value={club.adresseCommune} onChange={e => setC("adresseCommune", e.target.value)} placeholder="Nantes" />
            </div>
          </div>
          <div style={st.row}>
            <div style={{ flex: 1 }}>
              <label style={st.label}>Téléphone</label>
              <input style={st.inp} value={club.phone} onChange={e => setC("phone", e.target.value)} placeholder="02 40 00 00 00" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={st.label}>Email</label>
              <input style={st.inp} value={club.email} onChange={e => setC("email", e.target.value)} placeholder="contact@club.fr" />
            </div>
          </div>
          <div style={st.row}>
            <div style={{ flex: 1 }}>
              <label style={st.label}>SIRET</label>
              <input style={st.inp} value={club.siret} onChange={e => setC("siret", e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={st.label}>Président(e)</label>
              <input style={st.inp} value={club.president} onChange={e => setC("president", e.target.value)} placeholder="Prénom Nom" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: Cl.txtL }}>* Vous pourrez compléter le reste plus tard dans ⚙️ Paramètres</div>
        </>)}

        {/* === STEP 2 : TEAM === */}
        {step === 1 && (<>
          <div style={st.step}>Étape 2 / {STEPS.length}</div>
          <div style={st.title}>Votre équipe 👥</div>
          <div style={st.sub}>Ajoutez les personnes qui utiliseront l'outil. Chacune pourra se connecter avec son email.</div>

          {team.map((m, i) => (
            <div key={i} style={st.memberRow}>
              <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
              <span style={{ flex: 1, color: Cl.txtL, fontSize: 12 }}>{m.email || "—"}</span>
              <button style={S.btnDelete} onClick={() => setTeam(t => t.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}

          <div style={{ ...st.row, marginTop: 10 }}>
            <input style={{ ...st.inp, flex: 1, marginBottom: 0 }} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Prénom Nom" onKeyDown={e => e.key === "Enter" && addTeamMember()} />
            <input style={{ ...st.inp, flex: 1, marginBottom: 0 }} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@club.fr (optionnel)" onKeyDown={e => e.key === "Enter" && addTeamMember()} />
            <button style={{ ...st.btnMain, padding: "9px 14px", fontSize: 13 }} onClick={addTeamMember}>+</button>
          </div>
          {team.length === 0 && <div style={{ fontSize: 12, color: Cl.txtL, marginTop: 8 }}>Vous pourrez aussi ajouter des membres plus tard via le bouton "Équipe"</div>}
        </>)}

        {/* === STEP 3 : SEASON === */}
        {step === 2 && (<>
          <div style={st.step}>Étape 3 / {STEPS.length}</div>
          <div style={st.title}>Votre saison 📅</div>
          <div style={st.sub}>Vérifiez que la saison en cours est correcte. Vous pouvez gérer plusieurs saisons dans les paramètres.</div>

          <label style={st.label}>Saison active</label>
          <select style={{ ...st.inp, cursor: "pointer" }} value={ctx.currentSeason} onChange={e => ctx.setCurrentSeason(e.target.value)}>
            {ctx.seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div style={{ background: Cl.hov, borderRadius: 8, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: Cl.txtL, marginBottom: 6 }}>Saisons disponibles :</div>
            {ctx.seasons.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span style={{ fontWeight: s.id === ctx.currentSeason ? 600 : 400 }}>{s.name}</span>
                {s.id === ctx.currentSeason && <span style={st.tag}>Active</span>}
              </div>
            ))}
          </div>
        </>)}

        {/* === STEP 4 : PRODUCTS === */}
        {step === 3 && (<>
          <div style={st.step}>Étape 4 / {STEPS.length}</div>
          <div style={st.title}>Vos premiers produits 📦</div>
          <div style={st.sub}>Ajoutez vos supports de partenariat (panneaux, maillots, etc.). Vous pourrez tout personnaliser ensuite dans l'onglet Stocks.</div>

          {quickProds.map((p, i) => (
            <div key={i} style={{ ...st.row, marginBottom: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                {i === 0 && <label style={st.label}>Nom</label>}
                <input style={{ ...st.inp, marginBottom: 0 }} value={p.name} onChange={e => setQP(i, "name", e.target.value)} placeholder="Ex: Panneau terrain" />
              </div>
              <div style={{ flex: 1 }}>
                {i === 0 && <label style={st.label}>Catégorie</label>}
                <select style={{ ...st.inp, marginBottom: 0, cursor: "pointer" }} value={p.category} onChange={e => setQP(i, "category", e.target.value)}>
                  {(ctx.cats || []).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ width: 80 }}>
                {i === 0 && <label style={st.label}>Prix HT</label>}
                <input type="number" style={{ ...st.inp, marginBottom: 0 }} value={p.price} onChange={e => setQP(i, "price", e.target.value)} placeholder="0" />
              </div>
              <div style={{ width: 60 }}>
                {i === 0 && <label style={st.label}>Stock</label>}
                <input type="number" style={{ ...st.inp, marginBottom: 0 }} value={p.stock} onChange={e => setQP(i, "stock", e.target.value)} placeholder="0" />
              </div>
              {quickProds.length > 1 && <button style={{ ...S.btnDelete, marginBottom: 2 }} onClick={() => removeQP(i)}>✕</button>}
            </div>
          ))}
          <button style={{ ...st.btnGhost, color: Cl.pri, fontSize: 12, padding: "6px 0" }} onClick={addQP}>+ Ajouter un produit</button>
          <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>Laissez vide si vous préférez ajouter vos produits plus tard</div>
        </>)}

        {/* === STEP 5 : DONE === */}
        {step === 4 && (<>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={st.title}>Tout est prêt !</div>
            <div style={st.sub}>Vous pouvez maintenant commencer à ajouter vos premiers prospects et gérer vos partenariats.</div>

            <div style={st.helpBox}>
              <div style={st.helpIcon}>❓</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Besoin d'aide ?</div>
              <div style={{ fontSize: 13, color: Cl.txtL, lineHeight: 1.5 }}>
                Un assistant est disponible en bas à droite de votre écran. Posez-lui vos questions, il vous guidera pas à pas. Si jamais il ne peut pas résoudre votre problème, il vous mettra en contact avec le support.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20, textAlign: "left" }}>
              <div style={{ background: Cl.hov, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>1. Ajouter un prospect</div>
                <div style={{ fontSize: 11, color: Cl.txtL }}>Onglet Prospects → bouton + Prospect</div>
              </div>
              <div style={{ background: Cl.hov, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>2. Convertir en partenaire</div>
                <div style={{ fontSize: 11, color: Cl.txtL }}>Cliquez sur le prospect → Convertir</div>
              </div>
              <div style={{ background: Cl.hov, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>3. Créer un contrat</div>
                <div style={{ fontSize: 11, color: Cl.txtL }}>Fiche partenaire → Nouveau contrat</div>
              </div>
              <div style={{ background: Cl.hov, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>4. Facturer</div>
                <div style={{ fontSize: 11, color: Cl.txtL }}>Contrat signé → Générer facture</div>
              </div>
            </div>
          </div>
        </>)}

        {/* Footer navigation */}
        <div style={st.footer}>
          {step > 0 ? <button style={st.btnGhost} onClick={prev}>← Retour</button> : <div />}
          {step < STEPS.length - 1
            ? <button style={st.btnMain} onClick={next}>Continuer →</button>
            : <button style={{ ...st.btnMain, background: Cl.ok, padding: "12px 32px" }} onClick={finish}>Commencer 🚀</button>
          }
        </div>
      </div>
    </div>
  );
}
