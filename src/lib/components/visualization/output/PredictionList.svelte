<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { activePredictions, temperature, topK, samplingMethod } from '$lib/store';
  import type { Prediction } from '$lib/types';
  
  const dispatch = createEventDispatcher();
  
  export let maxItems: number = 10;
  export let showRank: boolean = true;
  export let interactive: boolean = true;
  export let animated: boolean = true;
  
  function handlePredictionClick(prediction: Prediction) {
    if (interactive) {
      dispatch('select', { prediction });
    }
  }
  
  function getBarColor(probability: number): string {
    if (probability > 0.3) return 'from-green-500 to-green-600';
    if (probability > 0.1) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-400 to-gray-500';
  }
  
  function formatToken(text: string): string {
    let formatted = text.replace(/Ġ/g, ' ').replace(/▁/g, ' ');
    if (formatted.startsWith(' ')) {
      return '␣' + formatted.slice(1);
    }
    return formatted || '␣';
  }
</script>

<div class="prediction-list-container">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
      التوقعات
    </h3>
    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
      {$samplingMethod === 'top-k' ? `Top-${$topK}` : `Top-P`}
    </span>
  </div>
  
  {#if $activePredictions.length > 0}
    <div class="space-y-2">
      {#each $activePredictions.slice(0, maxItems) as prediction, index (prediction.tokenId)}
        <button
          class="prediction-item"
          class:interactive
          on:click={() => handlePredictionClick(prediction)}
          style="animation-delay: {animated ? index * 50 : 0}ms"
        >
          <!-- Rang -->
          {#if showRank}
            <span class="prediction-rank">
              {prediction.rank}
            </span>
          {/if}
          
          <!-- Token -->
          <span class="prediction-token" dir="rtl">
            {formatToken(prediction.token)}
          </span>
          
          <!-- Barre et pourcentage -->
          <div class="prediction-bar-container">
            <div class="prediction-bar-bg">
              <div 
                class="prediction-bar bg-gradient-to-l {getBarColor(prediction.probability)}"
                style="width: {prediction.probability * 100}%"
              ></div>
            </div>
            <span class="prediction-percentage">
              {prediction.percentage}
            </span>
          </div>
          
          <!-- Icône click -->
          {#if interactive}
            <span class="prediction-action">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </span>
          {/if}
        </button>
      {/each}
    </div>
    
    <!-- Explication -->
    <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
      <p class="mb-1">
        <strong>درجة الحرارة:</strong> {$temperature.toFixed(1)}
        {$temperature < 0.5 ? '(دقيق)' : $temperature > 1.2 ? '(إبداعي)' : '(متوازن)'}
      </p>
      <p class="text-xs">
        انقر على أي توقع لإضافته إلى النص
      </p>
    </div>
  {:else}
    <div class="text-center py-8 text-gray-400">
      <span class="text-3xl block mb-2">🎯</span>
      <p>أدخل نصاً لرؤية التوقعات</p>
    </div>
  {/if}
</div>

<style>
  .prediction-list-container {
    @apply bg-white dark:bg-gray-800 rounded-xl p-4;
  }
  
  .prediction-item {
    @apply w-full flex items-center gap-3 p-3 rounded-lg;
    @apply bg-gray-50 dark:bg-gray-700;
    @apply transition-all duration-150;
    animation: slideIn 0.3s ease-out forwards;
    opacity: 0;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .prediction-item.interactive {
    @apply cursor-pointer;
  }
  
  .prediction-item.interactive:hover {
    @apply bg-primary-50 dark:bg-primary-900/30;
    transform: translateX(-4px);
  }
  
  .prediction-rank {
    @apply w-6 h-6 flex items-center justify-center;
    @apply bg-gray-200 dark:bg-gray-600 rounded-full;
    @apply text-xs font-bold text-gray-600 dark:text-gray-300;
  }
  
  .prediction-token {
    @apply flex-shrink-0 min-w-[60px] font-bold text-lg;
    @apply text-gray-800 dark:text-gray-200;
  }
  
  .prediction-bar-container {
    @apply flex-1 flex items-center gap-2;
  }
  
  .prediction-bar-bg {
    @apply flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
  }
  
  .prediction-bar {
    @apply h-full rounded-full transition-all duration-500;
  }
  
  .prediction-percentage {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400 tabular-nums;
    min-width: 50px;
    text-align: left;
  }
  
  .prediction-action {
    @apply text-gray-400 dark:text-gray-500;
    @apply opacity-0 transition-opacity;
  }
  
  .prediction-item:hover .prediction-action {
    @apply opacity-100 text-primary-500;
  }
</style>
