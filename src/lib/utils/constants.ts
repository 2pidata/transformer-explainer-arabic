// ═══════════════════════════════════════════════════════════════════════════
// src/lib/utils/constants.ts
// Constantes et configuration pour Transformer Explainer Arabe
// ═══════════════════════════════════════════════════════════════════════════

import type { ModelConfig, ArabicExample, ColorPalette, AttentionMatrixConfig } from '$lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DES MODÈLES
// ═══════════════════════════════════════════════════════════════════════════

/** Configuration pour AraGPT2-base (modèle par défaut) */
export const ARAGPT2_CONFIG: ModelConfig = {
  name: 'AraGPT2-base',
  modelId: 'aubmindlab/aragpt2-base',
  vocabSize: 64000,
  hiddenSize: 768,
  numLayers: 12,
  numHeads: 12,
  headDim: 64,  // 768 / 12
  mlpDimension: 3072,  // 768 * 4
  maxSequenceLength: 1024,
  language: 'ar',
  architecture: 'gpt2'
};

/** Configuration pour AraGPT2-medium */
export const ARAGPT2_MEDIUM_CONFIG: ModelConfig = {
  name: 'AraGPT2-medium',
  modelId: 'aubmindlab/aragpt2-medium',
  vocabSize: 64000,
  hiddenSize: 1024,
  numLayers: 24,
  numHeads: 16,
  headDim: 64,
  mlpDimension: 4096,
  maxSequenceLength: 1024,
  language: 'ar',
  architecture: 'gpt2'
};

/** Configuration pour JAIS-590M */
export const JAIS_CONFIG: ModelConfig = {
  name: 'JAIS-590M',
  modelId: 'core42/jais-590m',
  vocabSize: 84992,
  hiddenSize: 1024,
  numLayers: 24,
  numHeads: 16,
  headDim: 64,
  mlpDimension: 4096,
  maxSequenceLength: 2048,
  language: 'ar',
  architecture: 'gpt2'
};

/** Configuration par défaut */
export const DEFAULT_MODEL_CONFIG = ARAGPT2_CONFIG;

/** Liste des modèles disponibles */
export const AVAILABLE_MODELS: ModelConfig[] = [
  ARAGPT2_CONFIG,
  // ARAGPT2_MEDIUM_CONFIG,  // Décommenter si disponible
  // JAIS_CONFIG,            // Décommenter si disponible
];

// ═══════════════════════════════════════════════════════════════════════════
// CHEMINS DES FICHIERS
// ═══════════════════════════════════════════════════════════════════════════

/** Chemin de base pour les modèles */
export const MODELS_BASE_PATH = '/models';

/** Chemins pour AraGPT2-base */
export const MODEL_PATHS = {
  model: `${MODELS_BASE_PATH}/aragpt2-base/model.onnx`,
  modelQuantized: `${MODELS_BASE_PATH}/aragpt2-base/model_quantized.onnx`,
  tokenizer: `${MODELS_BASE_PATH}/aragpt2-base/tokenizer.json`,
  tokenizerConfig: `${MODELS_BASE_PATH}/aragpt2-base/tokenizer_config.json`,
  config: `${MODELS_BASE_PATH}/aragpt2-base/config.json`,
  vocab: `${MODELS_BASE_PATH}/aragpt2-base/vocab.json`,
  merges: `${MODELS_BASE_PATH}/aragpt2-base/merges.txt`,
  specialTokens: `${MODELS_BASE_PATH}/aragpt2-base/special_tokens_map.json`,
};

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLES DE TEXTES ARABES
// ═══════════════════════════════════════════════════════════════════════════

export const ARABIC_EXAMPLES: ArabicExample[] = [
  // Technologie
  {
    id: 1,
    text: "تصوير البيانات يمكّن المستخدمين من",
    translation: "La visualisation des données permet aux utilisateurs de",
    category: 'tech',
    description: "Exemple sur la visualisation de données"
  },
  {
    id: 2,
    text: "الذكاء الاصطناعي هو مجال من",
    translation: "L'intelligence artificielle est un domaine de",
    category: 'tech',
    description: "Introduction à l'IA"
  },
  {
    id: 3,
    text: "تعلم الآلة يساعد الحاسوب على",
    translation: "L'apprentissage automatique aide l'ordinateur à",
    category: 'tech',
    description: "Machine Learning"
  },
  {
    id: 4,
    text: "المحوّل هو بنية شبكة عصبية تستخدم",
    translation: "Le Transformer est une architecture de réseau de neurones qui utilise",
    category: 'tech',
    description: "Architecture Transformer"
  },
  
  // Général
  {
    id: 5,
    text: "مرحبا، أنا نموذج لغوي وأستطيع",
    translation: "Bonjour, je suis un modèle de langage et je peux",
    category: 'general',
    description: "Salutation"
  },
  {
    id: 6,
    text: "اللغة العربية هي لغة جميلة",
    translation: "La langue arabe est une belle langue",
    category: 'general',
    description: "Sur la langue arabe"
  },
  
  // Histoires
  {
    id: 7,
    text: "في يوم من الأيام كان هناك",
    translation: "Il était une fois, il y avait",
    category: 'story',
    description: "Début de conte"
  },
  {
    id: 8,
    text: "ذهب الولد إلى المدرسة ثم",
    translation: "Le garçon est allé à l'école puis",
    category: 'story',
    description: "Histoire simple"
  },
  
  // Science
  {
    id: 9,
    text: "الشمس هي نجم يقع في مركز",
    translation: "Le soleil est une étoile située au centre",
    category: 'science',
    description: "Astronomie"
  },
  {
    id: 10,
    text: "الماء يتكون من ذرتي هيدروجين",
    translation: "L'eau est composée de deux atomes d'hydrogène",
    category: 'science',
    description: "Chimie"
  }
];

/** Texte par défaut */
export const DEFAULT_INPUT_TEXT = ARABIC_EXAMPLES[0].text;

// ═══════════════════════════════════════════════════════════════════════════
// PARAMÈTRES PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════

/** Valeurs par défaut pour la génération */
export const DEFAULT_GENERATION_OPTIONS = {
  temperature: 0.8,
  topK: 5,
  topP: 0.9,
  samplingMethod: 'top-k' as const,
  repetitionPenalty: 1.0,
};

/** Limites des paramètres */
export const PARAMETER_LIMITS = {
  temperature: { min: 0.1, max: 2.0, step: 0.1 },
  topK: { min: 1, max: 50, step: 1 },
  topP: { min: 0.1, max: 1.0, step: 0.05 },
  repetitionPenalty: { min: 1.0, max: 2.0, step: 0.1 },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DES VISUALISATIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Configuration par défaut de la matrice d'attention */
export const DEFAULT_ATTENTION_CONFIG: AttentionMatrixConfig = {
  width: 300,
  height: 300,
  margin: { top: 50, right: 20, bottom: 20, left: 50 },
  colorScale: 'blues',
  showLabels: true,
  showValues: false,
  animated: true,
};

/** Palette de couleurs */
export const COLOR_PALETTE: ColorPalette = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  accent: '#10b981',
  attentionLow: '#f0f9ff',
  attentionHigh: '#1e3a8a',
  positive: '#22c55e',
  negative: '#ef4444',
};

/** Tailles de matrice selon le nombre de tokens */
export const MATRIX_SIZES = {
  small: { maxTokens: 6, size: 200 },
  medium: { maxTokens: 12, size: 300 },
  large: { maxTokens: 20, size: 400 },
};

// ═══════════════════════════════════════════════════════════════════════════
// LABELS ET TEXTES EN ARABE
// ═══════════════════════════════════════════════════════════════════════════

export const ARABIC_LABELS = {
  // Interface principale
  title: 'شارح المحوّل',
  subtitle: 'تعلم كيف يعمل نموذج GPT',
  inputPlaceholder: 'اكتب نصاً بالعربية...',
  generateButton: 'توليد',
  clearButton: 'مسح',
  
  // Sections
  embedding: 'التضمين',
  attention: 'الانتباه الذاتي',
  mlp: 'الشبكة العصبية',
  output: 'المخرجات',
  
  // Contrôles
  temperature: 'درجة الحرارة',
  topK: 'أعلى K',
  topP: 'أعلى P',
  layer: 'الطبقة',
  head: 'الرأس',
  
  // Navigation
  previous: 'السابق',
  next: 'التالي',
  layerOf: 'الطبقة {current} من {total}',
  headOf: 'الرأس {current} من {total}',
  
  // États
  loading: 'جاري التحميل...',
  loadingModel: 'تحميل النموذج...',
  loadingTokenizer: 'تحميل المُرمِّز...',
  analyzing: 'جاري التحليل...',
  ready: 'جاهز',
  error: 'خطأ',
  
  // Article
  articleTitle: 'كيف يعمل المحوّل؟',
  whatIsTransformer: 'ما هو المحوّل؟',
  howItWorks: 'كيف يعمل؟',
  tokenization: 'الترميز',
  embeddingExplain: 'شرح التضمين',
  attentionExplain: 'شرح الانتباه',
  mlpExplain: 'شرح الشبكة العصبية',
  outputExplain: 'شرح المخرجات',
  
  // Exemples
  examples: 'أمثلة',
  tryExample: 'جرب هذا المثال',
  
  // Probabilités
  probability: 'الاحتمال',
  predictions: 'التوقعات',
  nextToken: 'الكلمة التالية',
  
  // Tooltips
  tokenTooltip: 'الرمز: {token}\nالمعرف: {id}\nالموضع: {position}',
  attentionTooltip: 'الانتباه من "{source}" إلى "{target}": {value}',
  predictionTooltip: 'انقر لإضافة هذه الكلمة',
};

// ═══════════════════════════════════════════════════════════════════════════
// LABELS EN FRANÇAIS (pour référence)
// ═══════════════════════════════════════════════════════════════════════════

export const FRENCH_LABELS = {
  title: 'Transformer Explainer',
  subtitle: 'Apprenez comment fonctionne GPT',
  inputPlaceholder: 'Écrivez un texte en arabe...',
  generateButton: 'Générer',
  clearButton: 'Effacer',
  
  embedding: 'Embedding',
  attention: 'Self-Attention',
  mlp: 'Réseau de neurones',
  output: 'Sortie',
  
  temperature: 'Température',
  topK: 'Top K',
  topP: 'Top P',
  layer: 'Couche',
  head: 'Tête',
  
  loading: 'Chargement...',
  ready: 'Prêt',
  error: 'Erreur',
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION ONNX RUNTIME
// ═══════════════════════════════════════════════════════════════════════════

export const ONNX_CONFIG = {
  // Providers par ordre de préférence
  executionProviders: ['wasm', 'cpu'],
  
  // Options de session
  sessionOptions: {
    graphOptimizationLevel: 'all' as const,
    executionMode: 'sequential' as const,
    enableCpuMemArena: true,
    enableMemPattern: true,
  },
  
  // Noms des tenseurs
  tensorNames: {
    inputIds: 'input_ids',
    attentionMask: 'attention_mask',
    logits: 'logits',
    attentions: 'attentions',
    hiddenStates: 'hidden_states',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION ET TIMING
// ═══════════════════════════════════════════════════════════════════════════

export const ANIMATION_CONFIG = {
  /** Délai de debounce pour l'input (ms) */
  inputDebounce: 300,
  
  /** Durée des transitions CSS (ms) */
  transitionDuration: 200,
  
  /** Durée de l'animation d'attention (ms) */
  attentionAnimationDuration: 500,
  
  /** Délai avant affichage du tooltip (ms) */
  tooltipDelay: 200,
  
  /** Durée de l'animation de la barre de probabilité (ms) */
  probabilityBarDuration: 300,
};

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Modèles
  DEFAULT_MODEL_CONFIG,
  AVAILABLE_MODELS,
  MODEL_PATHS,
  
  // Exemples
  ARABIC_EXAMPLES,
  DEFAULT_INPUT_TEXT,
  
  // Paramètres
  DEFAULT_GENERATION_OPTIONS,
  PARAMETER_LIMITS,
  
  // Visualisation
  DEFAULT_ATTENTION_CONFIG,
  COLOR_PALETTE,
  MATRIX_SIZES,
  
  // Labels
  ARABIC_LABELS,
  
  // Config
  ONNX_CONFIG,
  ANIMATION_CONFIG,
  BREAKPOINTS,
};
