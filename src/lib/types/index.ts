// ═══════════════════════════════════════════════════════════════════════════
// src/lib/types/index.ts
// Types TypeScript pour Transformer Explainer Arabe
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/** Token individuel avec ses métadonnées */
export interface Token {
  /** ID dans le vocabulaire du modèle */
  id: number;
  /** Texte du token (peut inclure des espaces) */
  text: string;
  /** Position dans la séquence (0-indexed) */
  position: number;
  /** Token spécial (BOS, EOS, PAD, etc.) */
  isSpecial?: boolean;
}

/** Résultat de tokenisation */
export interface TokenizationResult {
  /** Liste des IDs de tokens */
  ids: number[];
  /** Liste des tokens avec métadonnées */
  tokens: Token[];
  /** Texte original */
  originalText: string;
  /** Nombre de tokens */
  length: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRÉDICTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Prédiction d'un token suivant */
export interface Prediction {
  /** Texte du token prédit */
  token: string;
  /** ID du token dans le vocabulaire */
  tokenId: number;
  /** Probabilité (0 à 1) */
  probability: number;
  /** Pourcentage formaté (ex: "45.2%") */
  percentage: string;
  /** Rang de la prédiction (1 = meilleur) */
  rank: number;
  /** Log-probabilité */
  logProb?: number;
}

/** Options de génération */
export interface GenerationOptions {
  /** Température (0.1 à 2.0) */
  temperature: number;
  /** Nombre de tokens à considérer pour top-k */
  topK: number;
  /** Seuil de probabilité cumulative pour top-p */
  topP: number;
  /** Méthode d'échantillonnage */
  samplingMethod: 'top-k' | 'top-p' | 'greedy';
  /** Pénalité de répétition */
  repetitionPenalty?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODÈLE ET INFÉRENCE
// ═══════════════════════════════════════════════════════════════════════════

/** Configuration du modèle */
export interface ModelConfig {
  /** Nom du modèle (ex: "AraGPT2-base") */
  name: string;
  /** Identifiant HuggingFace */
  modelId: string;
  /** Taille du vocabulaire */
  vocabSize: number;
  /** Dimension cachée (768 pour GPT-2) */
  hiddenSize: number;
  /** Nombre de couches */
  numLayers: number;
  /** Nombre de têtes d'attention */
  numHeads: number;
  /** Dimension de chaque tête */
  headDim: number;
  /** Dimension du MLP (généralement 4 * hiddenSize) */
  mlpDimension: number;
  /** Longueur maximale de séquence */
  maxSequenceLength: number;
  /** Langue du modèle */
  language: 'ar' | 'en' | 'multi';
  /** Type d'architecture */
  architecture: 'gpt2' | 'gpt-neo' | 'llama' | 'other';
}

/** Données du modèle après inférence */
export interface ModelData {
  // === Embeddings ===
  /** Embeddings des tokens [seq_len, hidden_size] */
  embeddings: Float32Array | null;
  /** Embeddings positionnels [seq_len, hidden_size] */
  positionEmbeddings: Float32Array | null;
  /** Embeddings finaux (tokens + position) */
  finalEmbeddings: Float32Array | null;

  // === Attention ===
  /** Matrices d'attention [num_layers, num_heads, seq_len, seq_len] */
  attentions: number[][][][] | null;
  /** Matrices Query pour chaque couche */
  queryMatrices: Float32Array[] | null;
  /** Matrices Key pour chaque couche */
  keyMatrices: Float32Array[] | null;
  /** Matrices Value pour chaque couche */
  valueMatrices: Float32Array[] | null;

  // === MLP ===
  /** Sorties intermédiaires du MLP (après activation) */
  mlpIntermediates: Float32Array[] | null;
  /** Sorties finales du MLP */
  mlpOutputs: Float32Array[] | null;

  // === Sortie ===
  /** Logits pour le dernier token [vocab_size] */
  logits: Float32Array | null;
  /** Logits pour tous les tokens [seq_len, vocab_size] */
  allLogits: Float32Array | null;
  /** Probabilités après softmax */
  probabilities: Float32Array | null;
  /** Top-K prédictions */
  predictions: Prediction[] | null;
}

/** Résultat d'inférence complet */
export interface InferenceResult {
  /** Tokens d'entrée */
  inputTokens: Token[];
  /** Prédictions */
  predictions: Prediction[];
  /** Matrices d'attention */
  attentions: number[][][][];
  /** Logits bruts */
  logits: Float32Array;
  /** Temps d'inférence (ms) */
  inferenceTime: number;
  /** Données complètes du modèle */
  modelData: ModelData;
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAT DE L'APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

/** État de chargement */
export interface LoadingState {
  /** Le modèle est-il chargé ? */
  isModelLoaded: boolean;
  /** Le tokenizer est-il chargé ? */
  isTokenizerLoaded: boolean;
  /** Une inférence est-elle en cours ? */
  isInferenceRunning: boolean;
  /** Progression du chargement (0-100) */
  loadingProgress: number;
  /** Message de chargement actuel */
  loadingMessage: string;
  /** Erreur éventuelle */
  error: string | null;
}

/** État de l'interface utilisateur */
export interface UIState {
  /** Couche actuellement affichée (0 à numLayers-1) */
  currentLayer: number;
  /** Tête actuellement affichée (0 à numHeads-1) */
  currentHead: number;
  /** Token survolé */
  hoveredToken: number | null;
  /** Token sélectionné */
  selectedToken: number | null;
  /** Afficher les détails d'embedding */
  showEmbeddingDetails: boolean;
  /** Afficher les détails d'attention */
  showAttentionDetails: boolean;
  /** Afficher les détails MLP */
  showMLPDetails: boolean;
  /** Afficher l'article éducatif */
  showArticle: boolean;
  /** Niveau de détail de visualisation */
  visualizationDetail: 'simple' | 'intermediate' | 'detailed';
  /** Thème */
  theme: 'light' | 'dark' | 'system';
  /** Direction du texte */
  textDirection: 'rtl' | 'ltr';
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUALISATION
// ═══════════════════════════════════════════════════════════════════════════

/** Configuration de la matrice d'attention */
export interface AttentionMatrixConfig {
  /** Largeur en pixels */
  width: number;
  /** Hauteur en pixels */
  height: number;
  /** Marge */
  margin: { top: number; right: number; bottom: number; left: number };
  /** Échelle de couleur */
  colorScale: 'blues' | 'viridis' | 'plasma' | 'custom';
  /** Afficher les labels */
  showLabels: boolean;
  /** Afficher les valeurs */
  showValues: boolean;
  /** Animation */
  animated: boolean;
}

/** Données pour une cellule de la matrice */
export interface AttentionCell {
  /** Ligne (token source) */
  row: number;
  /** Colonne (token cible) */
  col: number;
  /** Valeur d'attention (0-1) */
  value: number;
  /** Token source */
  sourceToken: string;
  /** Token cible */
  targetToken: string;
}

/** Configuration du graphique de probabilités */
export interface ProbabilityChartConfig {
  /** Largeur */
  width: number;
  /** Hauteur */
  height: number;
  /** Nombre de barres à afficher */
  maxBars: number;
  /** Couleur des barres */
  barColor: string;
  /** Afficher les pourcentages */
  showPercentages: boolean;
  /** Orientation */
  orientation: 'horizontal' | 'vertical';
}

/** Couleurs pour les visualisations */
export interface ColorPalette {
  /** Couleur primaire */
  primary: string;
  /** Couleur secondaire */
  secondary: string;
  /** Couleur d'accent */
  accent: string;
  /** Gradient pour l'attention (faible) */
  attentionLow: string;
  /** Gradient pour l'attention (élevé) */
  attentionHigh: string;
  /** Couleur positive (embedding) */
  positive: string;
  /** Couleur négative (embedding) */
  negative: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLES ET CONTENU
// ═══════════════════════════════════════════════════════════════════════════

/** Exemple de texte arabe */
export interface ArabicExample {
  /** Identifiant unique */
  id: number;
  /** Texte en arabe */
  text: string;
  /** Traduction française */
  translation: string;
  /** Catégorie */
  category?: 'tech' | 'general' | 'story' | 'science';
  /** Description */
  description?: string;
}

/** Section de l'article éducatif */
export interface ArticleSection {
  /** Identifiant */
  id: string;
  /** Titre en arabe */
  titleAr: string;
  /** Titre en français */
  titleFr: string;
  /** Contenu en arabe (HTML) */
  contentAr: string;
  /** Composant de visualisation associé */
  visualizationComponent?: string;
  /** Ordre d'affichage */
  order: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉVÉNEMENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Événement de changement de token */
export interface TokenChangeEvent {
  /** Type d'événement */
  type: 'hover' | 'select' | 'click';
  /** Index du token */
  tokenIndex: number;
  /** Token concerné */
  token: Token;
}

/** Événement de changement de couche/tête */
export interface LayerChangeEvent {
  /** Nouveau numéro de couche */
  layer: number;
  /** Nouveau numéro de tête */
  head: number;
}

/** Événement de prédiction */
export interface PredictionEvent {
  /** Prédiction sélectionnée */
  prediction: Prediction;
  /** Action */
  action: 'append' | 'replace';
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/** Plage de valeurs */
export interface Range {
  min: number;
  max: number;
}

/** Position 2D */
export interface Position {
  x: number;
  y: number;
}

/** Dimensions */
export interface Dimensions {
  width: number;
  height: number;
}

/** Marges */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

