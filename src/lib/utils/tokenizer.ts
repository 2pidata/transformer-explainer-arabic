// ═══════════════════════════════════════════════════════════════════════════
// src/lib/utils/tokenizer.ts
// Wrapper pour le tokenizer HuggingFace
// ═══════════════════════════════════════════════════════════════════════════

import { AutoTokenizer, type PreTrainedTokenizer } from '@huggingface/transformers';
import type { Token, TokenizationResult } from '$lib/types';
import { DEFAULT_MODEL_CONFIG, MODEL_PATHS } from './constants';

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

/** Instance du tokenizer */
let tokenizer: PreTrainedTokenizer | null = null;

/** État de chargement */
let isLoading = false;
let isLoaded = false;
let loadError: string | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialise le tokenizer
 * @param modelId - Identifiant HuggingFace du modèle (optionnel)
 * @param onProgress - Callback de progression (optionnel)
 */
export async function initTokenizer(
  modelId: string = DEFAULT_MODEL_CONFIG.modelId,
  onProgress?: (progress: number, message: string) => void
): Promise<PreTrainedTokenizer> {
  // Déjà chargé ?
  if (tokenizer && isLoaded) {
    return tokenizer;
  }

  // Déjà en cours de chargement ?
  if (isLoading) {
    // Attendre que le chargement se termine
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (tokenizer) return tokenizer;
    throw new Error(loadError || 'Erreur de chargement du tokenizer');
  }

  isLoading = true;
  loadError = null;

  try {
    onProgress?.(10, 'تحميل المُرمِّز...');  // "Chargement du tokenizer..."

    // Charger le tokenizer depuis HuggingFace
    tokenizer = await AutoTokenizer.from_pretrained(modelId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (progress: any) => {
        const percent = Math.round((progress.progress ?? 0) * 100);
        onProgress?.(percent, `تحميل: ${percent}%`);
      }
    });

    isLoaded = true;
    onProgress?.(100, 'تم تحميل المُرمِّز');  // "Tokenizer chargé"

    console.log(`✅ Tokenizer chargé: ${modelId}`);
    console.log(`   Taille du vocabulaire: ${tokenizer.model?.vocab?.length || 'N/A'}`);

    return tokenizer;

  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur chargement tokenizer:', loadError);
    throw error;

  } finally {
    isLoading = false;
  }
}

/**
 * Tokenise un texte
 * @param text - Texte à tokeniser
 * @returns Résultat de tokenisation
 */
export function tokenize(text: string): TokenizationResult {
  if (!tokenizer) {
    throw new Error('Tokenizer non initialisé. Appelez initTokenizer() d\'abord.');
  }

  // Encoder le texte
  const encoded = tokenizer.encode(text);
  
  // Convertir en tableau si nécessaire
  const ids: number[] = Array.isArray(encoded) 
    ? encoded 
    : Array.from(encoded as Iterable<number>);

  // Décoder chaque token individuellement pour avoir le texte
  const tokens: Token[] = ids.map((id, position) => {
    const tokenText = tokenizer!.decode([id], { skip_special_tokens: false });
    return {
      id,
      text: tokenText,
      position,
      isSpecial: isSpecialToken(id)
    };
  });

  return {
    ids,
    tokens,
    originalText: text,
    length: ids.length
  };
}

/**
 * Décode des IDs de tokens en texte
 * @param ids - Liste des IDs de tokens
 * @param skipSpecialTokens - Ignorer les tokens spéciaux
 * @returns Texte décodé
 */
export function decode(ids: number[], skipSpecialTokens: boolean = true): string {
  if (!tokenizer) {
    throw new Error('Tokenizer non initialisé');
  }

  return tokenizer.decode(ids, { skip_special_tokens: skipSpecialTokens });
}

/**
 * Décode un seul ID de token
 * @param id - ID du token
 * @returns Texte du token
 */
export function decodeToken(id: number): string {
  if (!tokenizer) {
    throw new Error('Tokenizer non initialisé');
  }

  return tokenizer.decode([id], { skip_special_tokens: false });
}

/**
 * Encode un texte en IDs (sans métadonnées)
 * @param text - Texte à encoder
 * @returns Liste des IDs
 */
export function encode(text: string): number[] {
  if (!tokenizer) {
    throw new Error('Tokenizer non initialisé');
  }

  const encoded = tokenizer.encode(text);
  return Array.isArray(encoded) ? encoded : Array.from(encoded as Iterable<number>);
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si un token est spécial (BOS, EOS, PAD, etc.)
 * @param tokenId - ID du token
 * @returns true si le token est spécial
 */
export function isSpecialToken(tokenId: number): boolean {
  if (!tokenizer) return false;

  // Récupérer les tokens spéciaux du tokenizer
  const t = tokenizer as any;
  const specialTokens = [
    t.bos_token_id,
    t.eos_token_id,
    t.pad_token_id,
    t.unk_token_id,
    t.sep_token_id,
    t.cls_token_id,
    t.mask_token_id,
  ].filter((id: any) => id !== null && id !== undefined);

  return specialTokens.includes(tokenId);
}

/**
 * Obtient les IDs des tokens spéciaux
 * @returns Objet avec les IDs des tokens spéciaux
 */
export function getSpecialTokenIds(): Record<string, number | null> {
  if (!tokenizer) {
    return {
      bos: null, eos: null, pad: null, unk: null
    };
  }

  const t = tokenizer as any;
  return {
    bos: t.bos_token_id ?? null,
    eos: t.eos_token_id ?? null,
    pad: t.pad_token_id ?? null,
    unk: t.unk_token_id ?? null,
    sep: t.sep_token_id ?? null,
    cls: t.cls_token_id ?? null,
    mask: t.mask_token_id ?? null,
  };
}

/**
 * Obtient la taille du vocabulaire
 * @returns Taille du vocabulaire
 */
export function getVocabSize(): number {
  if (!tokenizer) {
    return DEFAULT_MODEL_CONFIG.vocabSize;
  }

  // Essayer différentes méthodes pour obtenir la taille
  if (tokenizer.model?.vocab) {
    return Object.keys(tokenizer.model.vocab).length;
  }
  
  return DEFAULT_MODEL_CONFIG.vocabSize;
}

/**
 * Vérifie si le tokenizer est prêt
 * @returns true si le tokenizer est chargé
 */
export function isTokenizerReady(): boolean {
  return isLoaded && tokenizer !== null;
}

/**
 * Obtient l'état de chargement
 * @returns État actuel
 */
export function getTokenizerState(): { isLoading: boolean; isLoaded: boolean; error: string | null } {
  return { isLoading, isLoaded, error: loadError };
}

/**
 * Réinitialise le tokenizer
 */
export function resetTokenizer(): void {
  tokenizer = null;
  isLoaded = false;
  isLoading = false;
  loadError = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS POUR L'AFFICHAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formate un token pour l'affichage (gestion des espaces, caractères spéciaux)
 * @param tokenText - Texte du token
 * @returns Texte formaté pour l'affichage
 */
export function formatTokenForDisplay(tokenText: string): string {
  // Remplacer le caractère d'espace en début de token (GPT-2 style)
  let formatted = tokenText;
  
  // GPT-2 utilise 'Ġ' pour représenter un espace
  formatted = formatted.replace(/Ġ/g, ' ');
  
  // Certains tokenizers utilisent '▁' (underscore bas)
  formatted = formatted.replace(/▁/g, ' ');
  
  // Gérer les caractères de nouvelle ligne
  formatted = formatted.replace(/\n/g, '↵');
  formatted = formatted.replace(/\t/g, '→');
  
  // Si le token est vide après formatage, afficher un symbole
  if (formatted === '' || formatted === ' ') {
    formatted = '␣';  // Symbole pour espace
  }
  
  return formatted;
}

/**
 * Obtient la couleur d'un token selon sa position (pour visualisation)
 * @param position - Position du token
 * @param total - Nombre total de tokens
 * @returns Couleur HSL
 */
export function getTokenColor(position: number, total: number): string {
  // Dégradé de couleur basé sur la position
  const hue = (position / total) * 240;  // De rouge (0) à bleu (240)
  return `hsl(${hue}, 70%, 50%)`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  initTokenizer,
  tokenize,
  decode,
  decodeToken,
  encode,
  isSpecialToken,
  getSpecialTokenIds,
  getVocabSize,
  isTokenizerReady,
  getTokenizerState,
  resetTokenizer,
  formatTokenForDisplay,
  getTokenColor,
};
