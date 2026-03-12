# 🏟️ ClubPartner

Outil de gestion des partenariats et mécénat pour clubs sportifs associatifs.

## 🚀 Déployer sur Netlify (5 minutes)

### 1. Créer un compte GitHub (si pas déjà fait)
- Va sur https://github.com et crée un compte gratuit

### 2. Créer un nouveau repo
- Clique sur "New Repository"
- Nom : `clubpartner`
- Coche "Add a README" → NON (on a déjà le nôtre)
- Clique "Create repository"

### 3. Uploader les fichiers
- Sur la page du repo, clique "uploading an existing file"
- Glisse-dépose TOUS les fichiers et dossiers de ce projet
- Clique "Commit changes"

### 4. Connecter Netlify
- Va sur https://app.netlify.com
- Clique "Add new site" → "Import an existing project"
- Choisis "GitHub" → autorise l'accès
- Sélectionne le repo `clubpartner`
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- Clique "Deploy site"

### 5. C'est en ligne ! 🎉
Netlify te donne une URL (ex: clubpartner-abc123.netlify.app).
Tu peux la personnaliser dans Site Settings → Domain management.

## 📝 Pour modifier le projet

1. Demande-moi la modification sur Claude
2. Je te donne le fichier modifié
3. Tu remplaces le fichier sur GitHub
4. Netlify redéploie automatiquement

### Structure des fichiers
```
src/
  data/
    initialData.js    ← Données de démo, constantes, helpers
    styles.js          ← Tous les styles
    AppContext.jsx      ← État global partagé
  components/
    index.jsx          ← Composants réutilisables (Badge, Modal, etc.)
    CompanyModals.jsx   ← Formulaire et détail entreprise
  tabs/
    Dashboard.jsx      ← Tableau de bord
    ProspectsTab.jsx    ← Onglet prospects
    PartnersTab.jsx    ← Onglet partenaires
    ActionsTab.jsx     ← Onglet actions
    ProductsTab.jsx    ← Onglet produits & stocks
    AmortTab.jsx       ← Onglet amortissement
    ContractsTab.jsx   ← Onglet contrats
  App.jsx              ← Routage principal
  main.jsx             ← Point d'entrée
```
