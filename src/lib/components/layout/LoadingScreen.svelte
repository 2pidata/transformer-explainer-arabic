<script lang="ts">
  import { appState } from '$lib/store';
  import { ARABIC_LABELS } from '$lib/utils/constants';
  
  export let show = true;
</script>

{#if show}
  <div class="loading-overlay" transition:fade={{ duration: 300 }}>
    <div class="text-center">
      <!-- Spinner animé -->
      <div class="relative w-24 h-24 mx-auto mb-8">
        <!-- Cercle extérieur -->
        <div class="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        <!-- Cercle animé -->
        <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
        <!-- Icône centrale -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-3xl">🤖</span>
        </div>
      </div>
      
      <!-- Message -->
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        {ARABIC_LABELS.title}
      </h2>
      
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {$appState.loadingMessage || ARABIC_LABELS.loading}
      </p>
      
      <!-- Barre de progression -->
      {#if $appState.loadingProgress > 0}
        <div class="w-64 mx-auto">
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style="width: {$appState.loadingProgress}%"
            ></div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {$appState.loadingProgress}%
          </p>
        </div>
      {/if}
      
      <!-- Étapes de chargement -->
      <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center justify-center gap-2 mb-2">
          <span class="{$appState.isTokenizerLoaded ? 'text-green-500' : 'text-gray-400'}">
            {$appState.isTokenizerLoaded ? '✓' : '○'}
          </span>
          <span>تحميل المُرمِّز</span>
        </div>
        <div class="flex items-center justify-center gap-2">
          <span class="{$appState.isModelLoaded ? 'text-green-500' : 'text-gray-400'}">
            {$appState.isModelLoaded ? '✓' : '○'}
          </span>
          <span>تحميل النموذج</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<script context="module">
  import { fade } from 'svelte/transition';
</script>

<style>
  .loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
  }
  
  :global(.dark) .loading-overlay {
    background: rgba(17, 24, 39, 0.95);
  }
</style>
