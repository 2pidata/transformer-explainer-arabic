// ═══════════════════════════════════════════════════════════════════════════
// src/lib/utils/data.ts
// Module principal - Combine tokenizer et inférence
// ═══════════════════════════════════════════════════════════════════════════

import type { Token, Prediction, ModelData, InferenceResult, GenerationOptions } from '$lib/types';
import { initTokenizer, tokenize, isTokenizerReady, formatTokenForDisplay } from './tokenizer';
import { loadModel, generatePredictions, recalculatePredictions, isModelReady } from './inference';
import { DEFAULT_MODEL_CONFIG, DEFAULT_GENERATION_OPTIONS, MODEL_PATHS } from './constants';

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

let lastLogits: Float32Array | null = null;
let lastTokens: Token[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialise le tokenizer et le modèle
 * @param onProgress - Callback de progression
 */
export async function initialize(
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  try {
    // Étape 1: Charger le tokenizer (40%)
    onProgress?.(0, 'تحميل المُرمِّز...');
    await initTokenizer(DEFAULT_MODEL_CONFIG.modelId, (progress, msg) => {
      onProgress?.(progress * 0.4, msg);
    });

    // Étape 2: Charger le modèle (60%)
    onProgress?.(40, 'تحميل النموذج...');
    await loadModel(MODEL_PATHS.model, (progress, msg) => {
      onProgress?.(40 + progress * 0.6, msg);
    });

    onProgress?.(100, 'جاهز!');
    console.log('✅ Initialisation complète');

  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    throw error;
  }
}

/**
 * Vérifie si le système est prêt
 */
export function isReady(): boolean {
  return isTokenizerReady() && isModelReady();
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyse un texte et génère des prédictions
 * @param text - Texte à analyser
 * @param options - Options de génération
 * @returns Résultat complet de l'inférence
 */
export async function analyzeText(
  text: string,
  options: Partial<GenerationOptions> = {}
): Promise<InferenceResult> {
  if (!isReady()) {
    throw new Error('Le système n\'est pas initialisé. Appelez initialize() d\'abord.');
  }

  const startTime = performance.now();

  // Fusionner avec les options par défaut
  const opts: GenerationOptions = {
    ...DEFAULT_GENERATION_OPTIONS,
    ...options
  };

  // Tokeniser le texte
  const tokenization = tokenize(text);
  const tokens = tokenization.tokens;
  const tokenIds = tokenization.ids;

  // Exécuter l'inférence
  const result = await generatePredictions(tokenIds, opts);

  // Sauvegarder les logits pour recalcul
  lastLogits = result.logits;
  lastTokens = tokens;

  const endTime = performance.now();

  // Construire le résultat
  const inferenceResult: InferenceResult = {
    inputTokens: tokens,
    predictions: result.predictions,
    attentions: result.attentions || generateMockAttentions(tokens.length),
    logits: result.logits,
    inferenceTime: endTime - startTime,
    modelData: {
      embeddings: null,
      positionEmbeddings: null,
      finalEmbeddings: null,
      attentions: result.attentions || generateMockAttentions(tokens.length),
      queryMatrices: null,
      keyMatrices: null,
      valueMatrices: null,
      mlpIntermediates: null,
      mlpOutputs: null,
      logits: result.logits,
      allLogits: null,
      probabilities: null,
      predictions: result.predictions
    }
  };

  console.log(`📊 Analyse: ${tokens.length} tokens, ${result.predictions.length} prédictions, ${inferenceResult.inferenceTime.toFixed(0)}ms`);

  return inferenceResult;
}

/**
 * Recalcule les prédictions avec de nouveaux paramètres (sans ré-inférence)
 * @param options - Nouvelles options
 * @returns Nouvelles prédictions
 */
export function updatePredictions(
  options: Partial<GenerationOptions> = {}
): Prediction[] {
  if (!lastLogits) {
    throw new Error('Aucune inférence précédente. Appelez analyzeText() d\'abord.');
  }

  const opts: GenerationOptions = {
    ...DEFAULT_GENERATION_OPTIONS,
    ...options
  };

  return recalculatePredictions(lastLogits, opts);
}

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DE DÉMONSTRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère des données de démonstration (sans modèle)
 * @param text - Texte à analyser
 * @returns Résultat simulé
 */
export function generateDemoData(text: string): InferenceResult {
  // Tokenisation simulée pour l'arabe
  const words = text.split(/\s+/);
  const tokens: Token[] = words.map((word, i) => ({
    id: 1000 + i,
    text: i === 0 ? word : ' ' + word,
    position: i,
    isSpecial: false
  }));

  // Prédictions simulées
  const demoPredictions: Prediction[] = [
    { token: ' رؤية', tokenId: 6789, probability: 0.35, percentage: '35.0%', rank: 1 },
    { token: ' فهم', tokenId: 7890, probability: 0.25, percentage: '25.0%', rank: 2 },
    { token: ' تحليل', tokenId: 8901, probability: 0.15, percentage: '15.0%', rank: 3 },
    { token: ' استكشاف', tokenId: 9012, probability: 0.10, percentage: '10.0%', rank: 4 },
    { token: ' معرفة', tokenId: 123, probability: 0.08, percentage: '8.0%', rank: 5 },
  ];

  // Attentions simulées
  const attentions = generateMockAttentions(tokens.length);

  // Logits simulés
  const logits = new Float32Array(DEFAULT_MODEL_CONFIG.vocabSize);
  for (let i = 0; i < logits.length; i++) {
    logits[i] = Math.random() * 2 - 1;
  }

  return {
    inputTokens: tokens,
    predictions: demoPredictions,
    attentions,
    logits,
    inferenceTime: 0,
    modelData: {
      embeddings: null,
      positionEmbeddings: null,
      finalEmbeddings: null,
      attentions,
      queryMatrices: null,
      keyMatrices: null,
      valueMatrices: null,
      mlpIntermediates: null,
      mlpOutputs: null,
      logits,
      allLogits: null,
      probabilities: null,
      predictions: demoPredictions
    }
  };
}

/**
 * Génère des matrices d'attention simulées (masque causal)
 */
function generateMockAttentions(seqLength: number): number[][][][] {
  const numLayers = DEFAULT_MODEL_CONFIG.numLayers;
  const numHeads = DEFAULT_MODEL_CONFIG.numHeads;

  const attentions: number[][][][] = [];

  for (let layer = 0; layer < numLayers; layer++) {
    const layerAttention: number[][][] = [];

    for (let head = 0; head < numHeads; head++) {
      const headAttention: number[][] = [];

      for (let i = 0; i < seqLength; i++) {
        const row: number[] = [];
        
        for (let j = 0; j < seqLength; j++) {
          if (j > i) {
            // Masque causal: 0 pour les tokens futurs
            row.push(0);
          } else {
            // Valeur aléatoire pour les tokens passés/présent
            row.push(Math.random());
          }
        }
        
        // Normaliser la ligne (simuler softmax)
        const sum = row.reduce((a, b) => a + b, 0);
        headAttention.push(row.map(v => sum > 0 ? v / sum : 0));
      }

      layerAttention.push(headAttention);
    }

    attentions.push(layerAttention);
  }

  return attentions;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formate les tokens pour l'affichage
 */
export function formatTokensForDisplay(tokens: Token[]): Array<{ id: number; text: string; display: string; position: number }> {
  return tokens.map(token => ({
    id: token.id,
    text: token.text,
    display: formatTokenForDisplay(token.text),
    position: token.position
  }));
}

/**
 * Obtient les derniers tokens analysés
 */
export function getLastTokens(): Token[] {
  return lastTokens;
}

/**
 * Obtient les derniers logits
 */
export function getLastLogits(): Float32Array | null {
  return lastLogits;
}

/**
 * Réinitialise l'état
 */
export function reset(): void {
  lastLogits = null;
  lastTokens = [];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  initialize,
  isReady,
  analyzeText,
  updatePredictions,
  generateDemoData,
  formatTokensForDisplay,
  getLastTokens,
  getLastLogits,
  reset,
};
