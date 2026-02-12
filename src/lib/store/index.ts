// ═══════════════════════════════════════════════════════════════════════════
// src/store/index.ts
// Store Svelte pour Transformer Explainer Arabe (AraGPT2 / JAIS)
// ═══════════════════════════════════════════════════════════════════════════

import { writable, derived, get } from 'svelte/store';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES ET INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/** Token individuel avec ses métadonnées */
export interface Token {
  id: number;           // ID dans le vocabulaire
  text: string;         // Texte du token (ex: "البيانات")
  position: number;     // Position dans la séquence (0, 1, 2...)
}

/** Prédiction d'un token */
export interface Prediction {
  token: string;        // Texte du token prédit
  tokenId: number;      // ID du token
  probability: number;  // Probabilité (0-1)
  percentage: string;   // Pourcentage formaté (ex: "45.2%")
  rank: number;         // Rang (1, 2, 3...)
}

/** Données complètes du modèle après inférence */
export interface ModelData {
  // Embeddings
  embeddings: Float32Array | null;        // [seq_len, hidden_size]
  positionEmbeddings: Float32Array | null; // [seq_len, hidden_size]
  finalEmbeddings: Float32Array | null;    // embeddings + position
  
  // Attention (toutes les couches et têtes)
  attentions: number[][][][] | null;      // [num_layers, num_heads, seq_len, seq_len]
  
  // Valeurs QKV pour la visualisation
  queryMatrices: Float32Array[] | null;   // Q pour chaque couche
  keyMatrices: Float32Array[] | null;     // K pour chaque couche
  valueMatrices: Float32Array[] | null;   // V pour chaque couche
  
  // MLP
  mlpIntermediates: Float32Array[] | null; // Sorties intermédiaires MLP
  mlpOutputs: Float32Array[] | null;       // Sorties finales MLP
  
  // Sortie finale
  logits: Float32Array | null;            // [vocab_size] pour le dernier token
  allLogits: Float32Array | null;         // [seq_len, vocab_size]
  
  // Probabilités et prédictions
  probabilities: Float32Array | null;     // Après softmax
  predictions: Prediction[] | null;       // Top-K prédictions
}

/** Configuration du modèle */
export interface ModelConfig {
  name: string;              // Nom du modèle (ex: "AraGPT2-base")
  vocabSize: number;         // Taille du vocabulaire
  hiddenSize: number;        // Dimension cachée (768 pour GPT-2)
  numLayers: number;         // Nombre de couches (12 pour GPT-2, 24 pour JAIS)
  numHeads: number;          // Nombre de têtes d'attention
  mlpDimension: number;      // Dimension MLP (généralement 4 * hiddenSize)
  maxSequenceLength: number; // Longueur max de séquence
  language: 'ar' | 'en';     // Langue du modèle
}

/** État de l'application */
export interface AppState {
  isModelLoaded: boolean;
  isTokenizerLoaded: boolean;
  isInferenceRunning: boolean;
  loadingProgress: number;
  loadingMessage: string;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DU MODÈLE
// ═══════════════════════════════════════════════════════════════════════════

/** Configuration par défaut pour AraGPT2-base */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  name: 'AraGPT2-base',
  vocabSize: 64000,        // AraGPT2 a ~64K tokens
  hiddenSize: 768,
  numLayers: 12,
  numHeads: 12,
  mlpDimension: 3072,      // 768 * 4
  maxSequenceLength: 1024,
  language: 'ar'
};

/** Configuration alternative pour JAIS-590M */
export const JAIS_MODEL_CONFIG: ModelConfig = {
  name: 'JAIS-590M',
  vocabSize: 84992,
  hiddenSize: 768,
  numLayers: 24,           // JAIS a 24 couches
  numHeads: 12,
  mlpDimension: 3072,
  maxSequenceLength: 2048,
  language: 'ar'
};

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLES DE TEXTES ARABES
// ═══════════════════════════════════════════════════════════════════════════

export const ARABIC_EXAMPLES = [
  {
    id: 1,
    text: "تصوير البيانات يمكّن المستخدمين من",
    translation: "La visualisation des données permet aux utilisateurs de"
  },
  {
    id: 2,
    text: "الذكاء الاصطناعي هو مجال من",
    translation: "L'intelligence artificielle est un domaine de"
  },
  {
    id: 3,
    text: "تعلم الآلة يساعد الحاسوب على",
    translation: "L'apprentissage automatique aide l'ordinateur à"
  },
  {
    id: 4,
    text: "المحوّل هو بنية شبكة عصبية",
    translation: "Le Transformer est une architecture de réseau neuronal"
  },
  {
    id: 5,
    text: "مرحبا، أنا نموذج لغوي وأستطيع",
    translation: "Bonjour, je suis un modèle de langage et je peux"
  },
  {
    id: 6,
    text: "في يوم من الأيام كان هناك",
    translation: "Il était une fois, il y avait"
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STORES PRINCIPAUX
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Configuration du modèle
// ─────────────────────────────────────────────────────────────────────────────

/** Configuration actuelle du modèle */
export const modelConfig = writable<ModelConfig>(DEFAULT_MODEL_CONFIG);

// ─────────────────────────────────────────────────────────────────────────────
// Texte d'entrée et tokens
// ─────────────────────────────────────────────────────────────────────────────

/** Texte saisi par l'utilisateur */
export const inputText = writable<string>("تصوير البيانات يمكّن المستخدمين من");

/** Liste des tokens après tokenisation */
export const tokens = writable<Token[]>([]);

/** IDs des tokens (pour l'inférence) */
export const tokenIds = writable<number[]>([]);

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres de génération
// ─────────────────────────────────────────────────────────────────────────────

/** Température (contrôle la "créativité") */
export const temperature = writable<number>(0.8);

/** Valeur K pour top-k sampling */
export const topK = writable<number>(5);

/** Valeur P pour top-p (nucleus) sampling */
export const topP = writable<number>(0.9);

/** Méthode d'échantillonnage active */
export const samplingMethod = writable<'top-k' | 'top-p'>('top-k');

// ─────────────────────────────────────────────────────────────────────────────
// Données du modèle (résultats d'inférence)
// ─────────────────────────────────────────────────────────────────────────────

/** Données complètes après inférence */
export const modelData = writable<ModelData>({
  embeddings: null,
  positionEmbeddings: null,
  finalEmbeddings: null,
  attentions: null,
  queryMatrices: null,
  keyMatrices: null,
  valueMatrices: null,
  mlpIntermediates: null,
  mlpOutputs: null,
  logits: null,
  allLogits: null,
  probabilities: null,
  predictions: null
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation dans le modèle
// ─────────────────────────────────────────────────────────────────────────────

/** Couche actuellement affichée (0 à numLayers-1) */
export const currentLayer = writable<number>(0);

/** Tête d'attention actuellement affichée (0 à numHeads-1) */
export const currentHead = writable<number>(0);

/** Token actuellement survolé */
export const hoveredToken = writable<number | null>(null);

/** Token actuellement sélectionné */
export const selectedToken = writable<number | null>(null);

/** Index du token pour lequel afficher les détails d'attention */
export const attentionFocusToken = writable<number | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// État de l'application
// ─────────────────────────────────────────────────────────────────────────────

/** État de chargement et erreurs */
export const appState = writable<AppState>({
  isModelLoaded: false,
  isTokenizerLoaded: false,
  isInferenceRunning: false,
  loadingProgress: 0,
  loadingMessage: '',
  error: null
});

// ─────────────────────────────────────────────────────────────────────────────
// Interface utilisateur
// ─────────────────────────────────────────────────────────────────────────────

/** Afficher/masquer les détails d'embedding */
export const showEmbeddingDetails = writable<boolean>(false);

/** Afficher/masquer les détails d'attention */
export const showAttentionDetails = writable<boolean>(true);

/** Afficher/masquer les détails MLP */
export const showMLPDetails = writable<boolean>(false);

/** Afficher/masquer l'article éducatif */
export const showArticle = writable<boolean>(true);

/** Niveau de détail de la visualisation */
export const visualizationDetail = writable<'simple' | 'intermediate' | 'detailed'>('intermediate');

/** Thème de l'interface */
export const theme = writable<'light' | 'dark'>('light');

/** Direction du texte (RTL pour l'arabe) */
export const textDirection = writable<'rtl' | 'ltr'>('rtl');

// ═══════════════════════════════════════════════════════════════════════════
// STORES DÉRIVÉS (calculés automatiquement)
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Informations sur les tokens
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre de tokens dans la séquence actuelle */
export const tokenCount = derived(tokens, $tokens => $tokens.length);

/** Dernier token de la séquence */
export const lastToken = derived(tokens, $tokens => 
  $tokens.length > 0 ? $tokens[$tokens.length - 1] : null
);

// ─────────────────────────────────────────────────────────────────────────────
// Attention
// ─────────────────────────────────────────────────────────────────────────────

/** Matrice d'attention pour la couche et tête actuelles */
export const currentAttentionMatrix = derived(
  [modelData, currentLayer, currentHead],
  ([$modelData, $currentLayer, $currentHead]) => {
    if (!$modelData.attentions) return null;
    
    const attentions = $modelData.attentions;
    if ($currentLayer >= attentions.length) return null;
    if ($currentHead >= attentions[$currentLayer].length) return null;
    
    return attentions[$currentLayer][$currentHead];
  }
);

/** Poids d'attention pour le token survolé (ligne de la matrice) */
export const hoveredTokenAttention = derived(
  [currentAttentionMatrix, hoveredToken],
  ([$matrix, $hoveredToken]) => {
    if (!$matrix || $hoveredToken === null) return null;
    return $matrix[$hoveredToken] || null;
  }
);

/** Attention moyenne sur toutes les têtes pour la couche actuelle */
export const averageAttentionForLayer = derived(
  [modelData, currentLayer],
  ([$modelData, $currentLayer]) => {
    if (!$modelData.attentions) return null;
    
    const layerAttentions = $modelData.attentions[$currentLayer];
    if (!layerAttentions) return null;
    
    const numHeads = layerAttentions.length;
    const seqLen = layerAttentions[0].length;
    
    // Calculer la moyenne
    const avgMatrix: number[][] = Array(seqLen).fill(null).map(() => Array(seqLen).fill(0));
    
    for (let head = 0; head < numHeads; head++) {
      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < seqLen; j++) {
          avgMatrix[i][j] += layerAttentions[head][i][j] / numHeads;
        }
      }
    }
    
    return avgMatrix;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Prédictions
// ─────────────────────────────────────────────────────────────────────────────

/** Prédiction la plus probable */
export const topPrediction = derived(
  modelData,
  $modelData => {
    if (!$modelData.predictions || $modelData.predictions.length === 0) return null;
    return $modelData.predictions[0];
  }
);

/** Top 3 prédictions */
export const top3Predictions = derived(
  modelData,
  $modelData => {
    if (!$modelData.predictions) return [];
    return $modelData.predictions.slice(0, 3);
  }
);

/** Prédictions filtrées par top-k */
export const filteredPredictionsByTopK = derived(
  [modelData, topK],
  ([$modelData, $topK]) => {
    if (!$modelData.predictions) return [];
    return $modelData.predictions.slice(0, $topK);
  }
);

/** Prédictions filtrées par top-p */
export const filteredPredictionsByTopP = derived(
  [modelData, topP],
  ([$modelData, $topP]) => {
    if (!$modelData.predictions) return [];
    
    let cumulativeProb = 0;
    const filtered: Prediction[] = [];
    
    for (const pred of $modelData.predictions) {
      if (cumulativeProb >= $topP) break;
      filtered.push(pred);
      cumulativeProb += pred.probability;
    }
    
    return filtered;
  }
);

/** Prédictions selon la méthode d'échantillonnage active */
export const activePredictions = derived(
  [samplingMethod, filteredPredictionsByTopK, filteredPredictionsByTopP],
  ([$method, $topKPreds, $topPPreds]) => {
    return $method === 'top-k' ? $topKPreds : $topPPreds;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// État général
// ─────────────────────────────────────────────────────────────────────────────

/** Le modèle est-il prêt à être utilisé ? */
export const isReady = derived(
  appState,
  $appState => $appState.isModelLoaded && $appState.isTokenizerLoaded
);

/** Y a-t-il une opération en cours ? */
export const isBusy = derived(
  appState,
  $appState => $appState.isInferenceRunning || ($appState.loadingProgress > 0 && $appState.loadingProgress < 100)
);

/** Message d'état actuel */
export const statusMessage = derived(
  appState,
  $appState => {
    if ($appState.error) return `خطأ: ${$appState.error}`;  // Erreur en arabe
    if ($appState.isInferenceRunning) return 'جاري التحليل...';  // Analyse en cours
    if (!$appState.isModelLoaded) return `تحميل النموذج... ${$appState.loadingProgress}%`;  // Chargement
    if (!$appState.isTokenizerLoaded) return 'تحميل المُرمِّز...';  // Chargement tokenizer
    return 'جاهز';  // Prêt
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

/** Information sur la couche actuelle */
export const layerInfo = derived(
  [currentLayer, modelConfig],
  ([$currentLayer, $config]) => ({
    current: $currentLayer + 1,  // Affichage humain (1-indexé)
    total: $config.numLayers,
    label: `الطبقة ${$currentLayer + 1} من ${$config.numLayers}`  // "Couche X de Y" en arabe
  })
);

/** Information sur la tête actuelle */
export const headInfo = derived(
  [currentHead, modelConfig],
  ([$currentHead, $config]) => ({
    current: $currentHead + 1,
    total: $config.numHeads,
    label: `الرأس ${$currentHead + 1} من ${$config.numHeads}`  // "Tête X de Y" en arabe
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS (fonctions pour modifier les stores)
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur le texte
// ─────────────────────────────────────────────────────────────────────────────

/** Mettre à jour le texte d'entrée */
export function setInputText(text: string): void {
  inputText.set(text);
}

/** Ajouter un token au texte (quand on clique sur une prédiction) */
export function appendToken(token: string): void {
  inputText.update(current => current + token);
}

/** Charger un exemple */
export function loadExample(exampleId: number): void {
  const example = ARABIC_EXAMPLES.find(e => e.id === exampleId);
  if (example) {
    inputText.set(example.text);
  }
}

/** Effacer le texte */
export function clearText(): void {
  inputText.set('');
  tokens.set([]);
  tokenIds.set([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur les tokens
// ─────────────────────────────────────────────────────────────────────────────

/** Mettre à jour les tokens après tokenisation */
export function setTokens(newTokens: Token[]): void {
  tokens.set(newTokens);
  tokenIds.set(newTokens.map(t => t.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur les paramètres de génération
// ─────────────────────────────────────────────────────────────────────────────

/** Mettre à jour la température */
export function setTemperature(value: number): void {
  // Limiter entre 0.1 et 2.0
  const clamped = Math.max(0.1, Math.min(2.0, value));
  temperature.set(clamped);
}

/** Mettre à jour top-k */
export function setTopK(value: number): void {
  const clamped = Math.max(1, Math.min(50, Math.round(value)));
  topK.set(clamped);
}

/** Mettre à jour top-p */
export function setTopP(value: number): void {
  const clamped = Math.max(0.1, Math.min(1.0, value));
  topP.set(clamped);
}

/** Changer la méthode d'échantillonnage */
export function setSamplingMethod(method: 'top-k' | 'top-p'): void {
  samplingMethod.set(method);
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur les données du modèle
// ─────────────────────────────────────────────────────────────────────────────

/** Mettre à jour les données du modèle après inférence */
export function updateModelData(data: Partial<ModelData>): void {
  modelData.update(current => ({
    ...current,
    ...data
  }));
}

/** Mettre à jour uniquement les prédictions (après changement de température) */
export function updatePredictions(predictions: Prediction[]): void {
  modelData.update(current => ({
    ...current,
    predictions
  }));
}

/** Réinitialiser les données du modèle */
export function resetModelData(): void {
  modelData.set({
    embeddings: null,
    positionEmbeddings: null,
    finalEmbeddings: null,
    attentions: null,
    queryMatrices: null,
    keyMatrices: null,
    valueMatrices: null,
    mlpIntermediates: null,
    mlpOutputs: null,
    logits: null,
    allLogits: null,
    probabilities: null,
    predictions: null
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions de navigation
// ─────────────────────────────────────────────────────────────────────────────

/** Naviguer vers la couche précédente */
export function previousLayer(): void {
  currentLayer.update(l => Math.max(0, l - 1));
}

/** Naviguer vers la couche suivante */
export function nextLayer(): void {
  const config = get(modelConfig);
  currentLayer.update(l => Math.min(config.numLayers - 1, l + 1));
}

/** Aller à une couche spécifique */
export function goToLayer(layer: number): void {
  const config = get(modelConfig);
  const clamped = Math.max(0, Math.min(config.numLayers - 1, layer));
  currentLayer.set(clamped);
}

/** Naviguer vers la tête précédente */
export function previousHead(): void {
  currentHead.update(h => Math.max(0, h - 1));
}

/** Naviguer vers la tête suivante */
export function nextHead(): void {
  const config = get(modelConfig);
  currentHead.update(h => Math.min(config.numHeads - 1, h + 1));
}

/** Aller à une tête spécifique */
export function goToHead(head: number): void {
  const config = get(modelConfig);
  const clamped = Math.max(0, Math.min(config.numHeads - 1, head));
  currentHead.set(clamped);
}

/** Définir le token survolé */
export function setHoveredToken(index: number | null): void {
  hoveredToken.set(index);
}

/** Définir le token sélectionné */
export function setSelectedToken(index: number | null): void {
  selectedToken.set(index);
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur l'état de l'application
// ─────────────────────────────────────────────────────────────────────────────

/** Mettre à jour l'état de chargement */
export function setLoadingProgress(progress: number, message?: string): void {
  appState.update(state => ({
    ...state,
    loadingProgress: progress,
    loadingMessage: message || state.loadingMessage
  }));
}

/** Marquer le modèle comme chargé */
export function setModelLoaded(loaded: boolean): void {
  appState.update(state => ({
    ...state,
    isModelLoaded: loaded
  }));
}

/** Marquer le tokenizer comme chargé */
export function setTokenizerLoaded(loaded: boolean): void {
  appState.update(state => ({
    ...state,
    isTokenizerLoaded: loaded
  }));
}

/** Définir l'état d'inférence */
export function setInferenceRunning(running: boolean): void {
  appState.update(state => ({
    ...state,
    isInferenceRunning: running
  }));
}

/** Définir une erreur */
export function setError(error: string | null): void {
  appState.update(state => ({
    ...state,
    error
  }));
}

/** Réinitialiser l'état de l'application */
export function resetAppState(): void {
  appState.set({
    isModelLoaded: false,
    isTokenizerLoaded: false,
    isInferenceRunning: false,
    loadingProgress: 0,
    loadingMessage: '',
    error: null
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions sur l'interface
// ─────────────────────────────────────────────────────────────────────────────

/** Basculer l'affichage des détails d'embedding */
export function toggleEmbeddingDetails(): void {
  showEmbeddingDetails.update(v => !v);
}

/** Basculer l'affichage des détails d'attention */
export function toggleAttentionDetails(): void {
  showAttentionDetails.update(v => !v);
}

/** Basculer l'affichage des détails MLP */
export function toggleMLPDetails(): void {
  showMLPDetails.update(v => !v);
}

/** Basculer l'affichage de l'article */
export function toggleArticle(): void {
  showArticle.update(v => !v);
}

/** Changer le niveau de détail */
export function setVisualizationDetail(level: 'simple' | 'intermediate' | 'detailed'): void {
  visualizationDetail.set(level);
}

/** Basculer le thème */
export function toggleTheme(): void {
  theme.update(t => t === 'light' ? 'dark' : 'light');
}

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DE DÉMONSTRATION (pour tester sans le modèle)
// ═══════════════════════════════════════════════════════════════════════════

/** Charger des données de démonstration */
export function loadDemoData(): void {
  // Tokens de démonstration
  const demoTokens: Token[] = [
    { id: 1234, text: 'تصوير', position: 0 },
    { id: 2345, text: ' البيانات', position: 1 },
    { id: 3456, text: ' يمكّن', position: 2 },
    { id: 4567, text: ' المستخدمين', position: 3 },
    { id: 5678, text: ' من', position: 4 }
  ];
  
  tokens.set(demoTokens);
  tokenIds.set(demoTokens.map(t => t.id));
  
  // Matrice d'attention de démonstration (masque causal)
  const seqLen = demoTokens.length;
  const numLayers = 12;
  const numHeads = 12;
  
  const demoAttentions: number[][][][] = [];
  
  for (let layer = 0; layer < numLayers; layer++) {
    const layerAttention: number[][][] = [];
    
    for (let head = 0; head < numHeads; head++) {
      const headAttention: number[][] = [];
      
      for (let i = 0; i < seqLen; i++) {
        const row: number[] = [];
        for (let j = 0; j < seqLen; j++) {
          if (j > i) {
            // Masque causal: 0 pour les tokens futurs
            row.push(0);
          } else {
            // Valeur aléatoire pour les tokens passés/présent
            row.push(Math.random());
          }
        }
        // Normaliser la ligne (softmax simulé)
        const sum = row.reduce((a, b) => a + b, 0);
        headAttention.push(row.map(v => v / sum));
      }
      
      layerAttention.push(headAttention);
    }
    
    demoAttentions.push(layerAttention);
  }
  
  // Prédictions de démonstration
  const demoPredictions: Prediction[] = [
    { token: ' رؤية', tokenId: 6789, probability: 0.35, percentage: '35.0%', rank: 1 },
    { token: ' فهم', tokenId: 7890, probability: 0.25, percentage: '25.0%', rank: 2 },
    { token: ' تحليل', tokenId: 8901, probability: 0.15, percentage: '15.0%', rank: 3 },
    { token: ' استكشاف', tokenId: 9012, probability: 0.10, percentage: '10.0%', rank: 4 },
    { token: ' معرفة', tokenId: 123, probability: 0.08, percentage: '8.0%', rank: 5 },
    { token: ' اكتشاف', tokenId: 234, probability: 0.04, percentage: '4.0%', rank: 6 },
    { token: ' إنشاء', tokenId: 345, probability: 0.02, percentage: '2.0%', rank: 7 },
    { token: ' تطوير', tokenId: 456, probability: 0.01, percentage: '1.0%', rank: 8 }
  ];
  
  // Mettre à jour le store
  updateModelData({
    attentions: demoAttentions,
    predictions: demoPredictions
  });
  
  // Marquer comme chargé (mode démo)
  appState.set({
    isModelLoaded: true,
    isTokenizerLoaded: true,
    isInferenceRunning: false,
    loadingProgress: 100,
    loadingMessage: 'وضع العرض التوضيحي',  // "Mode démonstration" en arabe
    error: null
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/** Obtenir la valeur actuelle d'un store (utile en dehors de Svelte) */
export function getStoreValue<T>(store: import('svelte/store').Readable<T>): T {
  return get(store);
}

/** Réinitialiser tous les stores */
export function resetAllStores(): void {
  inputText.set("تصوير البيانات يمكّن المستخدمين من");
  tokens.set([]);
  tokenIds.set([]);
  temperature.set(0.8);
  topK.set(5);
  topP.set(0.9);
  samplingMethod.set('top-k');
  currentLayer.set(0);
  currentHead.set(0);
  hoveredToken.set(null);
  selectedToken.set(null);
  resetModelData();
  resetAppState();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Stores
  inputText,
  tokens,
  tokenIds,
  temperature,
  topK,
  topP,
  samplingMethod,
  modelData,
  modelConfig,
  currentLayer,
  currentHead,
  hoveredToken,
  selectedToken,
  appState,
  
  // Stores dérivés
  tokenCount,
  currentAttentionMatrix,
  topPrediction,
  activePredictions,
  isReady,
  isBusy,
  statusMessage,
  layerInfo,
  headInfo,
  
  // Actions
  setInputText,
  appendToken,
  loadExample,
  setTokens,
  setTemperature,
  setTopK,
  setTopP,
  updateModelData,
  updatePredictions,
  previousLayer,
  nextLayer,
  previousHead,
  nextHead,
  setHoveredToken,
  loadDemoData,
  resetAllStores
};
