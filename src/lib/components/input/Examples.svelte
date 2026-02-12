<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ARABIC_EXAMPLES } from '$lib/utils/constants';
  import type { ArabicExample } from '$lib/types';
  
  const dispatch = createEventDispatcher();
  
  export let maxExamples: number = 6;
  export let showCategories: boolean = false;
  
  // Grouper par catégorie si nécessaire
  $: examples = ARABIC_EXAMPLES.slice(0, maxExamples);
  
  $: groupedExamples = showCategories 
    ? groupByCategory(ARABIC_EXAMPLES)
    : null;
  
  function groupByCategory(items: ArabicExample[]) {
    const groups: Record<string, ArabicExample[]> = {};
    for (const item of items) {
      const cat = item.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }
  
  const categoryLabels: Record<string, string> = {
    tech: 'تقنية',
    general: 'عام',
    story: 'قصص',
    science: 'علوم'
  };
  
  function selectExample(example: ArabicExample) {
    dispatch('select', { example });
  }
</script>

<div class="space-y-4">
  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
    أمثلة جاهزة
  </h3>
  
  {#if showCategories && groupedExamples}
    <!-- Affichage par catégorie -->
    {#each Object.entries(groupedExamples) as [category, items]}
      <div class="space-y-2">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400">
          {categoryLabels[category] || category}
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each items as example}
            <button
              on:click={() => selectExample(example)}
              class="group relative px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 
                     rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 
                     transition-colors text-right"
              title={example.translation}
            >
              <span class="text-gray-800 dark:text-gray-200">
                {example.text.slice(0, 30)}{example.text.length > 30 ? '...' : ''}
              </span>
              
              <!-- Tooltip au survol -->
              <span class="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs 
                          bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 
                          transition-opacity whitespace-nowrap pointer-events-none z-10">
                {example.translation}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <!-- Affichage simple -->
    <div class="flex flex-wrap gap-2">
      {#each examples as example}
        <button
          on:click={() => selectExample(example)}
          class="group relative px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 
                 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 
                 border border-transparent hover:border-primary-300 dark:hover:border-primary-700
                 transition-all text-right"
          title={example.translation}
        >
          <span class="text-gray-800 dark:text-gray-200">
            {example.text.slice(0, 25)}{example.text.length > 25 ? '...' : ''}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
