// ═══════════════════════════════════════════════════════════════════════════
// src/lib/utils/inference.ts
// Inférence ONNX Runtime pour Transformer Explainer Arabe
// ═══════════════════════════════════════════════════════════════════════════

import * as ort from 'onnxruntime-web';
import type { InferenceSession, Tensor } from 'onnxruntime-web';
import type { ModelData, Prediction, GenerationOptions } from '$lib/types';
import { DEFAULT_MODEL_CONFIG, MODEL_PATHS, ONNX_CONFIG } from './constants';
import { softmax, topKSampling, topPSampling, applyTemperature } from './postprocess';
import { decodeToken } from './tokenizer';

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

/** Session ONNX */
let session: InferenceSession | null = null;

/** État de chargement */
let isLoading = false;
let isLoaded = false;
let loadError: string | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configure ONNX Runtime
 */
function configureONNX(): void {
  // Configurer les chemins WASM
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
  
  // Configurer les threads (désactivé pour compatibilité)
  ort.env.wasm.numThreads = 1;
  
  // Désactiver SIMD si problèmes de compatibilité
  // ort.env.wasm.simd = false;
  
  console.log('🔧 ONNX Runtime configuré');
}

/**
 * Charge le modèle ONNX
 * @param modelPath - Chemin vers le fichier .onnx (optionnel)
 * @param onProgress - Callback de progression (optionnel)
 */
export async function loadModel(
  modelPath: string = MODEL_PATHS.model,
  onProgress?: (progress: number, message: string) => void
): Promise<InferenceSession> {
  // Déjà chargé ?
  if (session && isLoaded) {
    return session;
  }

  // Déjà en cours de chargement ?
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (session) return session;
    throw new Error(loadError || 'Erreur de chargement du modèle');
  }

  isLoading = true;
  loadError = null;

  try {
    configureONNX();
    
    onProgress?.(10, 'تحميل النموذج...');  // "Chargement du modèle..."

    // Options de session
    const sessionOptions: ort.InferenceSession.SessionOptions = {
      executionProviders: ONNX_CONFIG.executionProviders,
      graphOptimizationLevel: 'all',
      executionMode: 'sequential',
    };

    onProgress?.(30, 'تهيئة ONNX Runtime...');

    // Charger la session
    session = await ort.InferenceSession.create(modelPath, sessionOptions);

    isLoaded = true;
    onProgress?.(100, 'تم تحميل النموذج');  // "Modèle chargé"

    // Logger les informations du modèle
    console.log('✅ Modèle ONNX chargé');
    console.log('   Entrées:', session.inputNames);
    console.log('   Sorties:', session.outputNames);

    return session;

  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur chargement modèle:', loadError);
    throw error;

  } finally {
    isLoading = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INFÉRENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Exécute l'inférence sur des IDs de tokens
 * @param inputIds - IDs des tokens d'entrée
 * @returns Résultats bruts de l'inférence
 */
export async function runInference(inputIds: number[]): Promise<ort.InferenceSession.OnnxValueMapType> {
  if (!session) {
    throw new Error('Modèle non chargé. Appelez loadModel() d\'abord.');
  }

  const seqLength = inputIds.length;

  // Créer le tenseur d'entrée
  // GPT-2 attend des int64, mais on utilise BigInt64Array
  const inputTensor = new ort.Tensor(
    'int64',
    BigInt64Array.from(inputIds.map(id => BigInt(id))),
    [1, seqLength]  // [batch_size, sequence_length]
  );

  // Créer le masque d'attention (tous à 1 pour l'instant)
  const attentionMask = new ort.Tensor(
    'int64',
    BigInt64Array.from(Array(seqLength).fill(BigInt(1))),
    [1, seqLength]
  );

  // Préparer les feeds selon les entrées du modèle
  const feeds: Record<string, Tensor> = {};
  
  if (session.inputNames.includes('input_ids')) {
    feeds['input_ids'] = inputTensor;
  }
  if (session.inputNames.includes('attention_mask')) {
    feeds['attention_mask'] = attentionMask;
  }

  // Exécuter l'inférence
  const startTime = performance.now();
  const results = await session.run(feeds);
  const endTime = performance.now();

  console.log(`⚡ Inférence: ${(endTime - startTime).toFixed(2)}ms`);

  return results;
}

/**
 * Exécute l'inférence complète et retourne les données du modèle
 * @param inputIds - IDs des tokens d'entrée
 * @param options - Options de génération
 * @returns Données complètes du modèle
 */
export async function generatePredictions(
  inputIds: number[],
  options: Partial<GenerationOptions> = {}
): Promise<{
  predictions: Prediction[];
  logits: Float32Array;
  attentions: number[][][][] | null;
  inferenceTime: number;
}> {
  const startTime = performance.now();

  // Options par défaut
  const { 
    temperature = 0.8, 
    topK = 5, 
    topP = 0.9,
    samplingMethod = 'top-k' 
  } = options;

  // Exécuter l'inférence
  const results = await runInference(inputIds);

  // Extraire les logits
  const logitsOutput = results['logits'] || results[Object.keys(results)[0]];
  if (!logitsOutput) {
    throw new Error('Pas de logits dans la sortie du modèle');
  }

  const logitsData = logitsOutput.data as Float32Array;
  const vocabSize = DEFAULT_MODEL_CONFIG.vocabSize;
  const seqLength = inputIds.length;

  // Extraire les logits du dernier token
  const lastTokenLogits = new Float32Array(vocabSize);
  const offset = (seqLength - 1) * vocabSize;
  
  for (let i = 0; i < vocabSize; i++) {
    lastTokenLogits[i] = logitsData[offset + i] || 0;
  }

  // Appliquer la température
  const scaledLogits = applyTemperature(lastTokenLogits, temperature);

  // Calculer les probabilités (softmax)
  const probabilities = softmax(scaledLogits);

  // Obtenir les prédictions selon la méthode
  let topIndices: number[];
  
  if (samplingMethod === 'top-p') {
    topIndices = topPSampling(probabilities, topP, topK);
  } else {
    topIndices = topKSampling(probabilities, topK);
  }

  // Construire les prédictions
  const predictions: Prediction[] = topIndices.map((tokenId, rank) => ({
    token: decodeToken(tokenId),
    tokenId,
    probability: probabilities[tokenId],
    percentage: (probabilities[tokenId] * 100).toFixed(1) + '%',
    rank: rank + 1,
    logProb: Math.log(probabilities[tokenId] + 1e-10)
  }));

  // Extraire les attentions si disponibles
  let attentions: number[][][][] | null = null;
  
  if (results['attentions']) {
    attentions = extractAttentions(results['attentions'], seqLength);
  }

  const endTime = performance.now();

  return {
    predictions,
    logits: lastTokenLogits,
    attentions,
    inferenceTime: endTime - startTime
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION DES DONNÉES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extrait les matrices d'attention du tenseur de sortie
 * @param attentionsTensor - Tenseur des attentions
 * @param seqLength - Longueur de la séquence
 * @returns Matrices d'attention [layers, heads, seq, seq]
 */
function extractAttentions(
  attentionsTensor: Tensor,
  seqLength: number
): number[][][][] {
  const data = attentionsTensor.data as Float32Array;
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
          // Calculer l'index dans le tenseur plat
          const idx = 
            layer * (numHeads * seqLength * seqLength) +
            head * (seqLength * seqLength) +
            i * seqLength +
            j;
          
          row.push(data[idx] || 0);
        }
        
        headAttention.push(row);
      }

      layerAttention.push(headAttention);
    }

    attentions.push(layerAttention);
  }

  return attentions;
}

/**
 * Recalcule les prédictions avec de nouveaux paramètres (sans ré-inférence)
 * @param logits - Logits bruts
 * @param options - Nouvelles options
 * @returns Nouvelles prédictions
 */
export function recalculatePredictions(
  logits: Float32Array,
  options: Partial<GenerationOptions> = {}
): Prediction[] {
  const { 
    temperature = 0.8, 
    topK = 5, 
    topP = 0.9,
    samplingMethod = 'top-k' 
  } = options;

  // Appliquer la température
  const scaledLogits = applyTemperature(logits, temperature);

  // Calculer les probabilités
  const probabilities = softmax(scaledLogits);

  // Obtenir les indices
  let topIndices: number[];
  
  if (samplingMethod === 'top-p') {
    topIndices = topPSampling(probabilities, topP, topK);
  } else {
    topIndices = topKSampling(probabilities, topK);
  }

  // Construire les prédictions
  return topIndices.map((tokenId, rank) => ({
    token: decodeToken(tokenId),
    tokenId,
    probability: probabilities[tokenId],
    percentage: (probabilities[tokenId] * 100).toFixed(1) + '%',
    rank: rank + 1,
    logProb: Math.log(probabilities[tokenId] + 1e-10)
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si le modèle est prêt
 */
export function isModelReady(): boolean {
  return isLoaded && session !== null;
}

/**
 * Obtient l'état de chargement
 */
export function getModelState(): { isLoading: boolean; isLoaded: boolean; error: string | null } {
  return { isLoading, isLoaded, error: loadError };
}

/**
 * Réinitialise le modèle
 */
export async function resetModel(): Promise<void> {
  if (session) {
    // Libérer les ressources
    // session.release() n'existe pas dans toutes les versions
  }
  session = null;
  isLoaded = false;
  isLoading = false;
  loadError = null;
}

/**
 * Obtient les informations sur le modèle chargé
 */
export function getModelInfo(): { inputNames: readonly string[]; outputNames: readonly string[] } | null {
  if (!session) return null;

  return {
    inputNames: session.inputNames,
    outputNames: session.outputNames
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  loadModel,
  runInference,
  generatePredictions,
  recalculatePredictions,
  isModelReady,
  getModelState,
  resetModel,
  getModelInfo,
};
