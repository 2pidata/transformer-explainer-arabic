// ═══════════════════════════════════════════════════════════════════════════
// src/lib/utils/postprocess.ts
// Fonctions de post-traitement pour les logits
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SOFTMAX ET TEMPÉRATURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Applique la fonction softmax sur un tableau de logits
 * @param logits - Tableau de logits
 * @returns Tableau de probabilités (somme = 1)
 */
export function softmax(logits: Float32Array | number[]): Float32Array {
  const arr = logits instanceof Float32Array ? logits : new Float32Array(logits);
  const result = new Float32Array(arr.length);

  // Trouver le max pour la stabilité numérique
  let maxVal = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxVal) maxVal = arr[i];
  }

  // Calculer exp(x - max) et la somme
  let sumExp = 0;
  for (let i = 0; i < arr.length; i++) {
    result[i] = Math.exp(arr[i] - maxVal);
    sumExp += result[i];
  }

  // Normaliser
  for (let i = 0; i < arr.length; i++) {
    result[i] /= sumExp;
  }

  return result;
}

/**
 * Applique la température aux logits
 * @param logits - Tableau de logits
 * @param temperature - Température (0.1 à 2.0)
 * @returns Logits modifiés
 */
export function applyTemperature(
  logits: Float32Array | number[], 
  temperature: number
): Float32Array {
  const arr = logits instanceof Float32Array ? logits : new Float32Array(logits);
  const result = new Float32Array(arr.length);

  const temp = Math.max(0.01, temperature);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i] / temp;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP-K SAMPLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sélectionne les K tokens avec les plus hautes probabilités
 * @param probabilities - Tableau de probabilités
 * @param k - Nombre de tokens à retourner
 * @returns Indices des K meilleurs tokens
 */
export function topKSampling(
  probabilities: Float32Array | number[], 
  k: number
): number[] {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  const indexed: Array<{ index: number; prob: number }> = [];
  for (let i = 0; i < arr.length; i++) {
    indexed.push({ index: i, prob: arr[i] });
  }

  indexed.sort((a, b) => b.prob - a.prob);

  return indexed.slice(0, k).map(item => item.index);
}

/**
 * Obtient les probabilités des K meilleurs tokens
 */
export function getTopKWithProbs(
  probabilities: Float32Array | number[],
  k: number
): Array<{ index: number; probability: number }> {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  const indexed: Array<{ index: number; probability: number }> = [];
  for (let i = 0; i < arr.length; i++) {
    indexed.push({ index: i, probability: arr[i] });
  }

  indexed.sort((a, b) => b.probability - a.probability);

  return indexed.slice(0, k);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP-P (NUCLEUS) SAMPLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sélectionne les tokens dont la probabilité cumulée atteint P
 */
export function topPSampling(
  probabilities: Float32Array | number[],
  p: number,
  maxK: number = 50
): number[] {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  const indexed: Array<{ index: number; prob: number }> = [];
  for (let i = 0; i < arr.length; i++) {
    indexed.push({ index: i, prob: arr[i] });
  }
  indexed.sort((a, b) => b.prob - a.prob);

  const selected: number[] = [];
  let cumulativeProb = 0;

  for (const item of indexed) {
    if (cumulativeProb >= p && selected.length > 0) break;
    if (selected.length >= maxK) break;
    
    selected.push(item.index);
    cumulativeProb += item.prob;
  }

  return selected;
}

/**
 * Obtient les tokens pour top-p avec leurs probabilités
 */
export function getTopPWithProbs(
  probabilities: Float32Array | number[],
  p: number,
  maxK: number = 50
): Array<{ index: number; probability: number; cumulativeProbability: number }> {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  const indexed: Array<{ index: number; prob: number }> = [];
  for (let i = 0; i < arr.length; i++) {
    indexed.push({ index: i, prob: arr[i] });
  }
  indexed.sort((a, b) => b.prob - a.prob);

  const selected: Array<{ index: number; probability: number; cumulativeProbability: number }> = [];
  let cumulativeProb = 0;

  for (const item of indexed) {
    if (cumulativeProb >= p && selected.length > 0) break;
    if (selected.length >= maxK) break;
    
    cumulativeProb += item.prob;
    selected.push({
      index: item.index,
      probability: item.prob,
      cumulativeProbability: cumulativeProb
    });
  }

  return selected;
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉCHANTILLONNAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Échantillonne un token selon les probabilités
 */
export function sampleFromProbabilities(probabilities: Float32Array | number[]): number {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < arr.length; i++) {
    cumulative += arr[i];
    if (random < cumulative) {
      return i;
    }
  }

  return arr.length - 1;
}

/**
 * Échantillonne parmi les top-k tokens
 */
export function sampleTopK(probabilities: Float32Array | number[], k: number): number {
  const topK = getTopKWithProbs(probabilities, k);
  const sum = topK.reduce((acc, item) => acc + item.probability, 0);
  
  const random = Math.random() * sum;
  let cumulative = 0;

  for (const item of topK) {
    cumulative += item.probability;
    if (random < cumulative) {
      return item.index;
    }
  }

  return topK[0].index;
}

/**
 * Échantillonne parmi les top-p tokens
 */
export function sampleTopP(probabilities: Float32Array | number[], p: number): number {
  const topP = getTopPWithProbs(probabilities, p);
  const sum = topP.reduce((acc, item) => acc + item.probability, 0);
  
  const random = Math.random() * sum;
  let cumulative = 0;

  for (const item of topP) {
    cumulative += item.probability;
    if (random < cumulative) {
      return item.index;
    }
  }

  return topP[0].index;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcule l'entropie d'une distribution
 */
export function calculateEntropy(probabilities: Float32Array | number[]): number {
  const arr = probabilities instanceof Float32Array ? probabilities : new Float32Array(probabilities);
  
  let entropy = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) {
      entropy -= arr[i] * Math.log2(arr[i]);
    }
  }
  
  return entropy;
}

/**
 * Normalise un tableau de valeurs
 */
export function normalize(values: Float32Array | number[]): Float32Array {
  const arr = values instanceof Float32Array ? values : new Float32Array(values);
  const result = new Float32Array(arr.length);
  
  const sum = arr.reduce((a, b) => a + b, 0);
  
  if (sum === 0) {
    const uniform = 1 / arr.length;
    result.fill(uniform);
  } else {
    for (let i = 0; i < arr.length; i++) {
      result[i] = arr[i] / sum;
    }
  }
  
  return result;
}

/**
 * Applique une pénalité de répétition
 */
export function applyRepetitionPenalty(
  logits: Float32Array,
  previousTokens: number[],
  penalty: number = 1.0
): Float32Array {
  if (penalty === 1.0) return logits;
  
  const result = new Float32Array(logits);
  
  for (const tokenId of previousTokens) {
    if (tokenId < result.length) {
      if (result[tokenId] > 0) {
        result[tokenId] /= penalty;
      } else {
        result[tokenId] *= penalty;
      }
    }
  }
  
  return result;
}

/**
 * Formate une probabilité en pourcentage
 */
export function formatProbability(probability: number, decimals: number = 1): string {
  return (probability * 100).toFixed(decimals) + '%';
}

/**
 * Formate une probabilité en arabe
 */
export function formatProbabilityArabic(probability: number): string {
  const percentage = (probability * 100).toFixed(1);
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return percentage.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]) + '٪';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  softmax,
  applyTemperature,
  topKSampling,
  topPSampling,
  getTopKWithProbs,
  getTopPWithProbs,
  sampleFromProbabilities,
  sampleTopK,
  sampleTopP,
  calculateEntropy,
  normalize,
  applyRepetitionPenalty,
  formatProbability,
  formatProbabilityArabic,
};
