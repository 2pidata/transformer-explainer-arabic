# المساهمة في شارح المحوّل | Contributing

<div dir="rtl">

## كيفية المساهمة

شكراً لاهتمامك بالمساهمة في مشروع شارح المحوّل! نرحب بجميع المساهمات.

### الخطوات

1. **انسخ المشروع (Fork)**: انقر على زر "Fork" في أعلى الصفحة
2. **استنسخ نسختك**:
   ```bash
   git clone https://github.com/اسم-حسابك/transformer-explainer-arabic.git
   cd transformer-explainer-arabic
   ```
3. **أنشئ فرعاً جديداً**:
   ```bash
   git checkout -b feature/اسم-الميزة
   ```
4. **ثبّت التبعيات**:
   ```bash
   npm install
   npm run dev
   ```
5. **أجرِ تعديلاتك** واختبرها
6. **ارفع التعديلات**:
   ```bash
   git add .
   git commit -m "وصف التعديل"
   git push origin feature/اسم-الميزة
   ```
7. **أنشئ طلب دمج (Pull Request)**

### قواعد المساهمة

- **اللغة العربية الفصحى**: جميع واجهات المستخدم يجب أن تكون بالعربية الفصحى (ليس بالدارجة)
- **RTL أولاً**: تأكد من دعم الاتجاه من اليمين لليسار
- **التعليقات**: يمكن كتابة التعليقات البرمجية بالإنجليزية أو الفرنسية أو العربية
- **الاختبار**: تأكد من أن `npm run check` و `npm run build` يعملان بنجاح

### أنواع المساهمات المرحب بها

- تصحيح الترجمة العربية
- إضافة أمثلة نصية جديدة
- تحسين التصورات المرئية (Visualizations)
- إضافة دعم لنماذج عربية جديدة
- تحسين التوثيق
- إصلاح الأخطاء
- تحسين إمكانية الوصول (Accessibility)

</div>

---

## How to Contribute (English)

### Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/transformer-explainer-arabic.git
   cd transformer-explainer-arabic
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies**:
   ```bash
   npm install
   npm run dev
   ```
5. **Make your changes** and test them
6. **Commit and push**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Guidelines

- **Arabic UI**: All user-facing text must be in Modern Standard Arabic (not dialect)
- **RTL First**: Ensure Right-to-Left layout support
- **Type Safety**: Use TypeScript types, run `npm run check` before submitting
- **Build Check**: Ensure `npm run build` succeeds
- **Commits**: Write clear commit messages

### Types of Contributions Welcome

- Arabic translation improvements
- New Arabic text examples
- Visualization enhancements
- Support for new Arabic language models
- Documentation improvements
- Bug fixes
- Accessibility improvements
- Performance optimizations

### Tech Stack

- **Framework**: SvelteKit + TypeScript
- **Styling**: Tailwind CSS (RTL support)
- **ML**: ONNX Runtime Web + HuggingFace Transformers.js
- **Visualization**: D3.js

### Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run check      # TypeScript check
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Comment Contribuer (Francais)

1. Forkez le projet
2. Clonez votre fork
3. Creez une branche (`git checkout -b feature/ma-fonctionnalite`)
4. Faites vos modifications
5. Verifiez avec `npm run check` et `npm run build`
6. Commitez et poussez
7. Creez une Pull Request

### Regles

- L'interface utilisateur doit etre en **arabe standard moderne**
- Le code doit respecter le support **RTL** (droite-a-gauche)
- Les commentaires peuvent etre en francais, anglais ou arabe
