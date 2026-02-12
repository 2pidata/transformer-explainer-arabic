# 🏗️ Architecture complète - شارح المحوّل (Transformer Explainer Arabe)

## 📁 Structure du projet

```
transformer-explainer-arabic/
│
├── 📄 README.md                    # Documentation principale
├── 📄 README_AR.md                 # Documentation en arabe
├── 📄 package.json                 # Dépendances NPM
├── 📄 package-lock.json            # Lock des versions
├── 📄 tsconfig.json                # Configuration TypeScript
├── 📄 svelte.config.js             # Configuration SvelteKit
├── 📄 vite.config.ts               # Configuration Vite
├── 📄 tailwind.config.js           # Configuration Tailwind CSS
├── 📄 postcss.config.js            # Configuration PostCSS
├── 📄 .gitignore                   # Fichiers à ignorer
├── 📄 .npmrc                       # Configuration NPM
├── 📄 LICENSE                      # Licence MIT
│
├── 📂 static/                      # Fichiers statiques
│   ├── 📄 favicon.png              # Icône du site
│   ├── 📄 og-image.png             # Image pour partage social
│   │
│   ├── 📂 models/                  # 🧠 MODÈLES ONNX
│   │   └── 📂 aragpt2-base/        # AraGPT2-base converti
│   │       ├── 📄 model.onnx           # Modèle ONNX (~500MB ou quantifié ~125MB)
│   │       ├── 📄 model_quantized.onnx # Version quantifiée (optionnel)
│   │       ├── 📄 config.json          # Configuration du modèle
│   │       ├── 📄 tokenizer.json       # Tokenizer
│   │       ├── 📄 tokenizer_config.json
│   │       ├── 📄 vocab.json           # Vocabulaire
│   │       ├── 📄 merges.txt           # Règles BPE
│   │       └── 📄 special_tokens_map.json
│   │
│   ├── 📂 images/                  # Images pour l'article
│   │   ├── 📄 transformer-architecture.svg
│   │   ├── 📄 embedding.png
│   │   ├── 📄 attention.png
│   │   ├── 📄 qkv.png
│   │   ├── 📄 mlp.png
│   │   ├── 📄 softmax.png
│   │   └── 📄 positional-encoding.png
│   │
│   └── 📂 fonts/                   # Polices arabes
│       ├── 📄 NotoSansArabic-Regular.woff2
│       ├── 📄 NotoSansArabic-Bold.woff2
│       └── 📄 Amiri-Regular.woff2
│
├── 📂 src/                         # Code source
│   ├── 📄 app.html                 # Template HTML principal
│   ├── 📄 app.css                  # Styles globaux + RTL
│   │
│   ├── 📂 lib/                     # Bibliothèque partagée
│   │   │
│   │   ├── 📂 store/               # 🔄 GESTION D'ÉTAT
│   │   │   └── 📄 index.ts             # Stores Svelte (DÉJÀ CRÉÉ ✅)
│   │   │
│   │   ├── 📂 utils/               # 🔧 UTILITAIRES
│   │   │   ├── 📄 data.ts              # Inférence ONNX + tokenisation
│   │   │   ├── 📄 tokenizer.ts         # Wrapper tokenizer
│   │   │   ├── 📄 inference.ts         # Logique d'inférence
│   │   │   ├── 📄 postprocess.ts       # Softmax, top-k, top-p
│   │   │   ├── 📄 attention.ts         # Traitement des matrices d'attention
│   │   │   ├── 📄 colors.ts            # Échelles de couleurs D3
│   │   │   ├── 📄 arabic.ts            # Utilitaires spécifiques arabe/RTL
│   │   │   ├── 📄 constants.ts         # Constantes (config modèle, exemples)
│   │   │   └── 📄 mock_data.ts         # Données de démonstration
│   │   │
│   │   ├── 📂 components/          # 🧩 COMPOSANTS SVELTE
│   │   │   │
│   │   │   ├── 📂 layout/          # Structure de page
│   │   │   │   ├── 📄 Header.svelte        # En-tête avec titre
│   │   │   │   ├── 📄 Footer.svelte        # Pied de page (crédits)
│   │   │   │   ├── 📄 LoadingScreen.svelte # Écran de chargement
│   │   │   │   └── 📄 Alert.svelte         # Messages d'alerte
│   │   │   │
│   │   │   ├── 📂 input/           # Entrée utilisateur
│   │   │   │   ├── 📄 InputForm.svelte     # Champ de texte principal
│   │   │   │   ├── 📄 Examples.svelte      # Boutons d'exemples
│   │   │   │   └── 📄 GenerateButton.svelte # Bouton "توليد"
│   │   │   │
│   │   │   ├── 📂 controls/        # Contrôles
│   │   │   │   ├── 📄 Temperature.svelte   # Slider température
│   │   │   │   ├── 📄 TopKSelector.svelte  # Sélecteur top-k
│   │   │   │   ├── 📄 TopPSelector.svelte  # Sélecteur top-p
│   │   │   │   ├── 📄 SamplingToggle.svelte # Toggle top-k/top-p
│   │   │   │   └── 📄 LayerNavigator.svelte # Navigation couches/têtes
│   │   │   │
│   │   │   ├── 📂 visualization/   # 📊 VISUALISATIONS
│   │   │   │   │
│   │   │   │   ├── 📂 embedding/   # Visualisation Embedding
│   │   │   │   │   ├── 📄 EmbeddingColumn.svelte   # Colonne complète
│   │   │   │   │   ├── 📄 TokenList.svelte        # Liste des tokens
│   │   │   │   │   ├── 📄 TokenItem.svelte        # Token individuel
│   │   │   │   │   └── 📄 EmbeddingVector.svelte  # Vecteur d'embedding
│   │   │   │   │
│   │   │   │   ├── 📂 attention/   # Visualisation Attention
│   │   │   │   │   ├── 📄 AttentionBlock.svelte   # Bloc complet
│   │   │   │   │   ├── 📄 AttentionMatrix.svelte  # Matrice heatmap
│   │   │   │   │   ├── 📄 AttentionHead.svelte    # Tête individuelle
│   │   │   │   │   ├── 📄 QKVMatrices.svelte      # Matrices Q, K, V
│   │   │   │   │   └── 📄 AttentionFlow.svelte    # Flux (Sankey)
│   │   │   │   │
│   │   │   │   ├── 📂 mlp/         # Visualisation MLP
│   │   │   │   │   ├── 📄 MLPBlock.svelte         # Bloc MLP complet
│   │   │   │   │   ├── 📄 MLPLayer.svelte         # Couche individuelle
│   │   │   │   │   └── 📄 ActivationViz.svelte    # Visualisation GELU
│   │   │   │   │
│   │   │   │   ├── 📂 output/      # Visualisation Sortie
│   │   │   │   │   ├── 📄 ProbabilityColumn.svelte # Colonne probabilités
│   │   │   │   │   ├── 📄 PredictionBar.svelte    # Barre de prédiction
│   │   │   │   │   ├── 📄 PredictionList.svelte   # Liste des prédictions
│   │   │   │   │   └── 📄 SoftmaxViz.svelte       # Visualisation softmax
│   │   │   │   │
│   │   │   │   └── 📂 shared/      # Composants partagés
│   │   │   │       ├── 📄 Heatmap.svelte          # Heatmap générique
│   │   │   │       ├── 📄 BarChart.svelte         # Graphique barres
│   │   │   │       ├── 📄 Tooltip.svelte          # Info-bulle
│   │   │   │       ├── 📄 ColorScale.svelte       # Légende couleurs
│   │   │   │       └── 📄 AnimatedValue.svelte    # Valeur animée
│   │   │   │
│   │   │   ├── 📂 article/         # 📖 ARTICLE ÉDUCATIF
│   │   │   │   ├── 📄 Article.svelte              # Article complet
│   │   │   │   ├── 📄 Section.svelte              # Section générique
│   │   │   │   ├── 📄 TransformerIntro.svelte     # ما هو المحوّل؟
│   │   │   │   ├── 📄 ArchitectureSection.svelte  # بنية المحوّل
│   │   │   │   ├── 📄 EmbeddingSection.svelte     # التضمين
│   │   │   │   ├── 📄 AttentionSection.svelte     # الانتباه الذاتي
│   │   │   │   ├── 📄 MLPSection.svelte           # الشبكة العصبية
│   │   │   │   ├── 📄 OutputSection.svelte        # احتمالات المخرجات
│   │   │   │   ├── 📄 TemperatureSection.svelte   # درجة الحرارة
│   │   │   │   └── 📄 FeaturesSection.svelte      # الميزات المعمارية
│   │   │   │
│   │   │   └── 📂 popover/         # Popovers détaillés
│   │   │       ├── 📄 TokenPopover.svelte
│   │   │       ├── 📄 AttentionPopover.svelte
│   │   │       └── 📄 PredictionPopover.svelte
│   │   │
│   │   └── 📂 types/               # 📝 TYPES TYPESCRIPT
│   │       ├── 📄 index.ts             # Export tous les types
│   │       ├── 📄 token.ts             # Types pour tokens
│   │       ├── 📄 model.ts             # Types pour modèle
│   │       └── 📄 visualization.ts     # Types pour visualisations
│   │
│   └── 📂 routes/                  # 🛣️ ROUTES SVELTEKIT
│       ├── 📄 +layout.svelte           # Layout global (RTL, fonts)
│       ├── 📄 +layout.ts               # Chargement données layout
│       ├── 📄 +page.svelte             # Page principale
│       ├── 📄 +page.ts                 # Chargement données page
│       └── 📄 +error.svelte            # Page d'erreur
│
├── 📂 scripts/                     # 🔧 SCRIPTS DE BUILD
│   ├── 📄 convert_model.py             # Conversion PyTorch → ONNX
│   ├── 📄 quantize_model.py            # Quantification du modèle
│   ├── 📄 test_model.py                # Test du modèle converti
│   └── 📄 download_model.sh            # Télécharger depuis HuggingFace
│
├── 📂 tests/                       # 🧪 TESTS
│   ├── 📄 store.test.ts                # Tests du store
│   ├── 📄 inference.test.ts            # Tests d'inférence
│   └── 📄 components.test.ts           # Tests de composants
│
└── 📂 docs/                        # 📚 DOCUMENTATION
    ├── 📄 ARCHITECTURE.md              # Ce fichier
    ├── 📄 SETUP.md                     # Guide d'installation
    ├── 📄 MODEL_CONVERSION.md          # Guide conversion ONNX
    ├── 📄 DEPLOYMENT.md                # Guide déploiement GitHub Pages
    └── 📄 CONTRIBUTING.md              # Guide de contribution
```

---

## 🗂️ Ordre de création des fichiers

### Phase 1: Configuration de base ⚙️

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 1 | `package.json` | Dépendances NPM | 🔜 À créer |
| 2 | `tsconfig.json` | Config TypeScript | 🔜 À créer |
| 3 | `svelte.config.js` | Config SvelteKit | 🔜 À créer |
| 4 | `vite.config.ts` | Config Vite | 🔜 À créer |
| 5 | `tailwind.config.js` | Config Tailwind | 🔜 À créer |
| 6 | `postcss.config.js` | Config PostCSS | 🔜 À créer |
| 7 | `.gitignore` | Fichiers ignorés | 🔜 À créer |
| 8 | `src/app.html` | Template HTML | 🔜 À créer |
| 9 | `src/app.css` | Styles globaux | 🔜 À créer |

### Phase 2: Store et Types 🔄

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 10 | `src/lib/store/index.ts` | Stores Svelte | ✅ CRÉÉ |
| 11 | `src/lib/types/index.ts` | Types TypeScript | 🔜 À créer |

### Phase 3: Utilitaires 🔧

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 12 | `src/lib/utils/constants.ts` | Constantes | 🔜 À créer |
| 13 | `src/lib/utils/tokenizer.ts` | Wrapper tokenizer | 🔜 À créer |
| 14 | `src/lib/utils/inference.ts` | Inférence ONNX | 🔜 À créer |
| 15 | `src/lib/utils/postprocess.ts` | Post-traitement | 🔜 À créer |
| 16 | `src/lib/utils/data.ts` | Module principal | 🔜 À créer |
| 17 | `src/lib/utils/mock_data.ts` | Données démo | 🔜 À créer |

### Phase 4: Layout et Pages 📄

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 18 | `src/routes/+layout.svelte` | Layout global | 🔜 À créer |
| 19 | `src/routes/+page.svelte` | Page principale | 🔜 À créer |
| 20 | `src/lib/components/layout/Header.svelte` | En-tête | 🔜 À créer |
| 21 | `src/lib/components/layout/LoadingScreen.svelte` | Chargement | 🔜 À créer |

### Phase 5: Composants d'entrée 📝

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 22 | `src/lib/components/input/InputForm.svelte` | Champ texte | 🔜 À créer |
| 23 | `src/lib/components/input/Examples.svelte` | Exemples | 🔜 À créer |
| 24 | `src/lib/components/controls/Temperature.svelte` | Température | 🔜 À créer |
| 25 | `src/lib/components/controls/SamplingToggle.svelte` | Top-k/p | 🔜 À créer |

### Phase 6: Visualisations 📊

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 26 | `src/lib/components/visualization/embedding/TokenList.svelte` | Tokens | 🔜 À créer |
| 27 | `src/lib/components/visualization/attention/AttentionMatrix.svelte` | Attention | 🔜 À créer |
| 28 | `src/lib/components/visualization/output/PredictionList.svelte` | Prédictions | 🔜 À créer |

### Phase 7: Article éducatif 📖

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 29 | `src/lib/components/article/Article.svelte` | Article complet | 🔜 À créer |

### Phase 8: Modèle ONNX 🧠

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 30 | `scripts/convert_model.py` | Script conversion | 🔜 À créer |
| 31 | `static/models/aragpt2-base/*` | Fichiers modèle | 🔜 À convertir |

---

## 📦 Dépendances NPM

```json
{
  "dependencies": {
    "@huggingface/transformers": "^3.0.0",
    "onnxruntime-web": "^1.18.0",
    "d3": "^7.9.0",
    "d3-scale": "^4.0.0",
    "d3-interpolate": "^3.0.0"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.5.0",
    "@sveltejs/adapter-static": "^3.0.0",
    "svelte": "^4.2.0",
    "vite": "^5.2.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/d3": "^7.4.0"
  }
}
```

---

## 🔗 Relations entre fichiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              +page.svelte                                    │
│                           (Page principale)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌───────────────────┐
│  InputForm    │         │  Visualizations │         │     Article       │
│  Examples     │         │                 │         │                   │
│  Controls     │         │  ┌───────────┐  │         │  ┌─────────────┐  │
└───────────────┘         │  │ Embedding │  │         │  │ Sections    │  │
        │                 │  ├───────────┤  │         │  │ arabes      │  │
        │                 │  │ Attention │  │         │  └─────────────┘  │
        │                 │  ├───────────┤  │         └───────────────────┘
        │                 │  │ MLP       │  │
        │                 │  ├───────────┤  │
        │                 │  │ Output    │  │
        │                 │  └───────────┘  │
        │                 └─────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STORE (index.ts)                                │
│  inputText, tokens, temperature, modelData, currentLayer, appState, etc.    │
└─────────────────────────────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────────────────────────────────────┐
│   tokenizer.ts    │     │                    inference.ts                    │
│   (Tokenisation)  │     │              (Inférence ONNX Runtime)              │
└───────────────────┘     └───────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        static/models/aragpt2-base/                           │
│           model.onnx  |  tokenizer.json  |  config.json  |  vocab.json       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Commandes pour commencer

```bash
# 1. Créer le projet
mkdir transformer-explainer-arabic
cd transformer-explainer-arabic

# 2. Initialiser avec SvelteKit
npm create svelte@latest .
# Choisir: Skeleton project, TypeScript, ESLint, Prettier

# 3. Installer les dépendances
npm install
npm install @huggingface/transformers onnxruntime-web d3
npm install -D tailwindcss postcss autoprefixer @types/d3

# 4. Initialiser Tailwind
npx tailwindcss init -p

# 5. Lancer le développement
npm run dev
```

---

## 📋 Checklist de progression

- [x] Architecture définie
- [x] Store Svelte créé
- [ ] Configuration projet (package.json, etc.)
- [ ] Types TypeScript
- [ ] Utilitaires (tokenizer, inference)
- [ ] Layout et pages
- [ ] Composants d'entrée
- [ ] Visualisations
- [ ] Article éducatif
- [ ] Conversion modèle ONNX
- [ ] Tests
- [ ] Déploiement GitHub Pages

---

## ❓ Prochaine étape

Quel fichier veux-tu créer maintenant ?

1. **Configuration** (package.json, tsconfig.json, etc.)
2. **Types TypeScript** (src/lib/types/)
3. **Utilitaires** (tokenizer.ts, inference.ts)
4. **Layout** (+layout.svelte, +page.svelte)
5. **Composants** (un par un)

Dis-moi ! 🎯
