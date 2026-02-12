# 🚀 Guide de déploiement - شارح المحوّل

## 📋 Prérequis

- Node.js 18+ (recommandé: 20)
- npm ou pnpm
- Git
- Compte GitHub

---

## 🏃 Installation locale

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/transformer-explainer-arabic.git
cd transformer-explainer-arabic
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer en mode développement

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## 🧠 Conversion du modèle ONNX (Optionnel)

Le projet fonctionne en **mode démo** sans modèle réel. Pour utiliser le vrai modèle AraGPT2:

### 1. Installer les dépendances Python

```bash
pip install transformers optimum onnx onnxruntime
```

### 2. Convertir le modèle

```bash
python scripts/convert_model.py --model aragpt2-base --quantize --test
```

### 3. Copier les fichiers

Les fichiers seront générés dans `static/models/aragpt2-base/`:
- `model.onnx` ou `model_quantized.onnx`
- `tokenizer.json`
- `config.json`
- `vocab.json`

**⚠️ Note:** Le modèle ONNX fait ~500MB (ou ~125MB quantifié). Il est exclu de Git.

---

## 🌐 Déploiement sur GitHub Pages

### Méthode 1: Automatique (GitHub Actions)

Le fichier `.github/workflows/deploy.yml` est déjà configuré!

#### Étapes:

1. **Créer le repo GitHub**
   ```bash
   gh repo create transformer-explainer-arabic --public
   ```

2. **Pousser le code**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

3. **Activer GitHub Pages**
   - Aller dans Settings > Pages
   - Source: **GitHub Actions**

4. **Attendre le déploiement**
   - Le workflow se déclenche automatiquement
   - Voir l'onglet "Actions" pour le statut

5. **Accéder au site**
   - URL: `https://VOTRE_USERNAME.github.io/transformer-explainer-arabic`

### Méthode 2: Manuelle

```bash
# Build
npm run build

# Le dossier 'build' contient le site statique
# Vous pouvez le déployer sur n'importe quel hébergeur
```

---

## ⚙️ Configuration

### Changer le nom du repo

Si votre repo a un nom différent, modifiez `svelte.config.js`:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '/VOTRE-NOM-DE-REPO' : ''
}
```

### Héberger le modèle séparément

Pour les gros modèles, vous pouvez:

1. **Utiliser un CDN** (Cloudflare R2, AWS S3, etc.)
2. **HuggingFace Spaces**
3. **GitHub Releases** (pour fichiers < 2GB)

Modifiez `src/lib/utils/constants.ts`:

```typescript
export const MODEL_PATHS = {
  model: 'https://votre-cdn.com/models/model.onnx',
  tokenizer: 'https://votre-cdn.com/models/tokenizer.json',
  // ...
};
```

---

## 🔧 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualiser le build |
| `npm run check` | Vérifier TypeScript |
| `npm run lint` | Linter le code |

---

## 📁 Structure des fichiers importants

```
transformer-explainer-arabic/
├── .github/
│   └── workflows/
│       └── deploy.yml      # ← Déploiement automatique
├── src/
│   ├── lib/
│   │   ├── components/     # ← Composants Svelte
│   │   ├── store/          # ← État global
│   │   └── utils/          # ← Logique (tokenizer, inference)
│   └── routes/
│       └── +page.svelte    # ← Page principale
├── static/
│   └── models/             # ← Fichiers ONNX (non Git)
├── scripts/
│   └── convert_model.py    # ← Conversion modèle
├── svelte.config.js        # ← Config SvelteKit
└── package.json
```

---

## 🐛 Résolution de problèmes

### Erreur "SharedArrayBuffer not available"

ONNX Runtime nécessite des headers spéciaux. En production sur GitHub Pages, ça fonctionne. En local:

```javascript
// vite.config.ts - déjà configuré
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
}
```

### Le modèle ne charge pas

1. Vérifiez que les fichiers sont dans `static/models/`
2. Vérifiez la console pour les erreurs CORS
3. En mode démo, le modèle n'est pas nécessaire

### Build échoue sur GitHub Actions

1. Vérifiez les logs dans l'onglet "Actions"
2. Assurez-vous que `package-lock.json` est commité
3. Node.js 20 est requis

---

## 📊 Performance

### Optimisations incluses:

- ✅ Code splitting (ONNX, D3, Transformers séparés)
- ✅ Lazy loading des composants
- ✅ Quantification du modèle (INT8)
- ✅ Preload des ressources critiques

### Tailles approximatives:

| Ressource | Taille |
|-----------|--------|
| Bundle JS | ~500KB |
| CSS | ~50KB |
| Modèle ONNX (quantifié) | ~125MB |
| Tokenizer | ~2MB |

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amélioration`)
3. Commit (`git commit -m 'Ajout de fonctionnalité'`)
4. Push (`git push origin feature/amélioration`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE)

---

<div align="center">

**Fait avec ❤️ pour la communauté tech arabe**

[2pidata](https://2pidata.com)

</div>
