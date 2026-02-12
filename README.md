# شارح المحوّل - Transformer Explainer Arabic

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Arabic](https://img.shields.io/badge/language-Arabic-orange.svg)

**أداة تفاعلية لتعلم كيفية عمل نماذج المحوّل (Transformer) مع دعم كامل للغة العربية**

[العربية](#العربية) | [English](#english) | [Français](#français)

</div>

---

## العربية

### 🎯 ما هو هذا المشروع؟

شارح المحوّل هو أداة تعليمية تفاعلية تساعدك على فهم كيفية عمل نماذج اللغة مثل GPT. يمكنك:

- ✨ كتابة نص بالعربية ورؤية كيف يتم تقسيمه إلى رموز
- 🔍 مشاهدة مصفوفات الانتباه الذاتي بشكل مرئي
- 📊 رؤية توقعات النموذج للكلمة التالية
- 🎛️ تغيير درجة الحرارة ومعاملات أخرى

### 🚀 التشغيل السريع

```bash
# استنساخ المشروع
git clone https://github.com/2pidata/transformer-explainer-arabic.git
cd transformer-explainer-arabic

# تثبيت التبعيات
npm install

# تشغيل وضع التطوير
npm run dev
```

ثم افتح المتصفح على `http://localhost:5173`

---

## English

### 🎯 What is this project?

Transformer Explainer Arabic is an interactive educational tool that helps you understand how language models like GPT work. You can:

- ✨ Write Arabic text and see how it gets tokenized
- 🔍 Visualize self-attention matrices
- 📊 See the model's predictions for the next token
- 🎛️ Adjust temperature and other parameters

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/2pidata/transformer-explainer-arabic.git
cd transformer-explainer-arabic

# Install dependencies
npm install

# Run development server
npm run dev
```

Then open your browser at `http://localhost:5173`

### 📁 Project Structure

```
transformer-explainer-arabic/
├── src/
│   ├── lib/
│   │   ├── store/          # Svelte stores (state management)
│   │   ├── utils/          # Tokenizer, inference, post-processing
│   │   ├── components/     # Svelte components
│   │   └── types/          # TypeScript types
│   └── routes/             # SvelteKit pages
├── static/
│   └── models/             # ONNX model files
├── scripts/                # Model conversion scripts
└── docs/                   # Documentation
```

### 🧠 Models Supported

| Model | Parameters | Language | Status |
|-------|-----------|----------|--------|
| AraGPT2-base | 135M | Arabic | ✅ Default |
| AraGPT2-medium | 370M | Arabic | 🔜 |
| JAIS-590M | 590M | Arabic | 🔜 |

### 🔧 Model Conversion

To convert a model to ONNX format:

```bash
# Install Python dependencies
pip install transformers optimum onnx onnxruntime

# Convert AraGPT2-base
python scripts/convert_model.py --model aragpt2-base --quantize --test
```

### 📦 Dependencies

**Runtime:**
- `@huggingface/transformers` - Tokenization
- `onnxruntime-web` - Browser inference
- `d3` - Visualizations

**Development:**
- `svelte` + `sveltekit` - Framework
- `tailwindcss` - Styling
- `typescript` - Type safety

---

## Français

### 🎯 Qu'est-ce que ce projet ?

Transformer Explainer Arabic est un outil éducatif interactif pour comprendre le fonctionnement des modèles de langage comme GPT. Vous pouvez :

- ✨ Écrire du texte en arabe et voir comment il est tokenisé
- 🔍 Visualiser les matrices d'attention
- 📊 Voir les prédictions du modèle pour le token suivant
- 🎛️ Ajuster la température et d'autres paramètres

### 🚀 Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/2pidata/transformer-explainer-arabic.git
cd transformer-explainer-arabic

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez ensuite votre navigateur sur `http://localhost:5173`

### 🎓 Concepts expliqués

1. **Tokenisation** - Comment le texte est découpé en unités
2. **Embedding** - Comment les tokens sont convertis en vecteurs
3. **Self-Attention** - Comment le modèle "regarde" les autres mots
4. **MLP** - Le réseau de neurones qui transforme les représentations
5. **Softmax** - Comment les probabilités sont calculées
6. **Température** - Comment contrôler la "créativité" du modèle

---

## 🏗️ Development

### Build for production

```bash
npm run build
npm run preview
```

### Deploy to GitHub Pages

```bash
# Build with correct base path
npm run build

# The build output is in the 'build' folder
# Push to gh-pages branch
```

### Run tests

```bash
npm run test
npm run check
```

---

## 🙏 Credits

- Inspired by [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) from Georgia Tech
- [AraGPT2](https://github.com/aub-mind/arabert) by AUB MIND Lab
- [Transformers.js](https://github.com/xenova/transformers.js) by Xenova

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ par **Miloud Belarebia** | [2PiData](https://2pidata.com) | [contact@2pidata.fr](mailto:contact@2pidata.fr)

</div>
