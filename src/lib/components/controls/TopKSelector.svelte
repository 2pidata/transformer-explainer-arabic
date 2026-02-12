<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { topK } from '$lib/store';
  import { PARAMETER_LIMITS } from '$lib/utils/constants';
  
  const dispatch = createEventDispatcher();
  const { min, max, step } = PARAMETER_LIMITS.topK;
  
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    dispatch('change', { value });
  }
  
  function increment() {
    if ($topK < max) {
      dispatch('change', { value: $topK + step });
    }
  }
  
  function decrement() {
    if ($topK > min) {
      dispatch('change', { value: $topK - step });
    }
  }
</script>

<div class="space-y-3">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <label for="topk-input" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Top-K
    </label>
    <span class="text-xs text-gray-500 dark:text-gray-400">
      عدد الخيارات المعروضة
    </span>
  </div>
  
  <!-- Input avec boutons -->
  <div class="flex items-center gap-2">
    <button
      on:click={decrement}
      disabled={$topK <= min}
      class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
      </svg>
    </button>
    
    <input
      id="topk-input"
      type="number"
      class="flex-1 text-center font-bold text-lg py-2 rounded-lg border border-gray-300 dark:border-gray-600 
             bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      {min}
      {max}
      {step}
      value={$topK}
      on:change={handleChange}
    />
    
    <button
      on:click={increment}
      disabled={$topK >= max}
      class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
    </button>
  </div>
  
  <!-- Slider rapide -->
  <input
    type="range"
    class="slider w-full"
    {min}
    {max}
    {step}
    value={$topK}
    on:input={handleChange}
  />
  
  <!-- Info -->
  <p class="text-xs text-gray-500 dark:text-gray-400">
    يعرض أعلى {$topK} توقعات احتمالاً
  </p>
</div>
