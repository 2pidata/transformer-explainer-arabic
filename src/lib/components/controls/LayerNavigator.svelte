<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    currentLayer, 
    currentHead, 
    modelConfig,
    layerInfo,
    headInfo,
    previousLayer,
    nextLayer,
    previousHead,
    nextHead,
    goToLayer,
    goToHead
  } from '$lib/store';
  
  const dispatch = createEventDispatcher();
  
  export let showHeadSelector: boolean = true;
  export let compact: boolean = false;
  
  function handleLayerChange(layer: number) {
    goToLayer(layer);
    dispatch('layerChange', { layer });
  }
  
  function handleHeadChange(head: number) {
    goToHead(head);
    dispatch('headChange', { head });
  }
</script>

<div class="space-y-4">
  <!-- Navigation des couches -->
  <div class="space-y-2">
    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
      الطبقة
    </label>
    
    <div class="flex items-center gap-2">
      <button
        on:click={previousLayer}
        disabled={$currentLayer === 0}
        class="layer-nav-btn"
        aria-label="الطبقة السابقة"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      
      {#if compact}
        <span class="layer-indicator flex-1 text-center">
          {$layerInfo.label}
        </span>
      {:else}
        <!-- Sélecteur de couche -->
        <div class="flex-1 flex gap-1 justify-center flex-wrap">
          {#each Array($modelConfig.numLayers) as _, i}
            <button
              on:click={() => handleLayerChange(i)}
              class="w-8 h-8 rounded-lg text-xs font-medium transition-colors
                     {$currentLayer === i 
                       ? 'bg-primary-600 text-white' 
                       : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}"
            >
              {i + 1}
            </button>
          {/each}
        </div>
      {/if}
      
      <button
        on:click={nextLayer}
        disabled={$currentLayer >= $modelConfig.numLayers - 1}
        class="layer-nav-btn"
        aria-label="الطبقة التالية"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Navigation des têtes -->
  {#if showHeadSelector}
    <div class="space-y-2">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
        رأس الانتباه
      </label>
      
      <div class="flex items-center gap-2">
        <button
          on:click={previousHead}
          disabled={$currentHead === 0}
          class="layer-nav-btn"
          aria-label="الرأس السابق"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        
        {#if compact}
          <span class="layer-indicator flex-1 text-center">
            {$headInfo.label}
          </span>
        {:else}
          <div class="flex-1 flex gap-1 justify-center flex-wrap">
            {#each Array($modelConfig.numHeads) as _, i}
              <button
                on:click={() => handleHeadChange(i)}
                class="w-8 h-8 rounded-lg text-xs font-medium transition-colors
                       {$currentHead === i 
                         ? 'bg-primary-600 text-white' 
                         : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}"
              >
                {i + 1}
              </button>
            {/each}
          </div>
        {/if}
        
        <button
          on:click={nextHead}
          disabled={$currentHead >= $modelConfig.numHeads - 1}
          class="layer-nav-btn"
          aria-label="الرأس التالي"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Info -->
  <div class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
    <p>
      <strong>الطبقة {$currentLayer + 1}:</strong> 
      {$currentLayer < 4 ? 'تعالج المعلومات الأساسية' : $currentLayer < 8 ? 'تبني العلاقات' : 'تفهم السياق العميق'}
    </p>
    <p class="mt-1">
      <strong>الرأس {$currentHead + 1}:</strong>
      كل رأس يركز على نوع مختلف من العلاقات
    </p>
  </div>
</div>

<style>
  .layer-nav-btn {
    @apply p-2 rounded-lg bg-gray-100 dark:bg-gray-800;
    @apply hover:bg-gray-200 dark:hover:bg-gray-700;
    @apply disabled:opacity-30 disabled:cursor-not-allowed;
    @apply transition-colors;
  }
</style>
