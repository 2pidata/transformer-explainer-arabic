<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    tokens, 
    currentAttentionMatrix, 
    currentLayer, 
    currentHead,
    hoveredToken,
    layerInfo,
    headInfo,
    setHoveredToken
  } from '$lib/store';
  import Heatmap from '../shared/Heatmap.svelte';
  import ColorScale from '../shared/ColorScale.svelte';
  import LayerNavigator from '../../controls/LayerNavigator.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let width: number = 350;
  export let height: number = 350;
  export let showControls: boolean = true;
  export let showColorScale: boolean = true;
  export let compact: boolean = false;
  
  // Labels des tokens pour la matrice
  $: tokenLabels = $tokens.map(t => formatToken(t.text));
  
  function formatToken(text: string): string {
    let formatted = text.replace(/Ġ/g, ' ').replace(/▁/g, ' ').trim();
    return formatted || '␣';
  }
  
  function handleCellHover(event: CustomEvent) {
    const { row, col, value } = event.detail;
    setHoveredToken(row);
    dispatch('cellHover', { row, col, value, sourceToken: $tokens[row], targetToken: $tokens[col] });
  }
  
  function handleCellLeave() {
    setHoveredToken(null);
    dispatch('cellLeave');
  }
  
  function handleCellClick(event: CustomEvent) {
    dispatch('cellClick', event.detail);
  }
</script>

<div class="attention-matrix-container">
  <!-- En-tête -->
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
      مصفوفة الانتباه
    </h3>
    
    {#if !compact}
      <div class="flex items-center gap-2 text-sm">
        <span class="layer-indicator">{$layerInfo.label}</span>
        <span class="layer-indicator">{$headInfo.label}</span>
      </div>
    {/if}
  </div>
  
  <!-- Contrôles de navigation -->
  {#if showControls}
    <div class="mb-4">
      <LayerNavigator compact={compact} />
    </div>
  {/if}
  
  <!-- Matrice -->
  <div class="relative">
    {#if $currentAttentionMatrix && $tokens.length > 0}
      <div class="flex justify-center">
        <Heatmap
          data={$currentAttentionMatrix}
          rowLabels={tokenLabels}
          colLabels={tokenLabels}
          {width}
          {height}
          colorScheme="blues"
          showValues={!compact && $tokens.length <= 8}
          animated={true}
          on:cellHover={handleCellHover}
          on:cellLeave={handleCellLeave}
          on:cellClick={handleCellClick}
        />
      </div>
      
      <!-- Légende -->
      {#if showColorScale}
        <div class="mt-4 flex justify-center">
          <ColorScale 
            width={200} 
            colorScheme="blues"
            minLabel="٠٪ (لا انتباه)"
            maxLabel="١٠٠٪ (انتباه كامل)"
          />
        </div>
      {/if}
      
      <!-- Explication -->
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <p class="mb-2">
          <strong>كيف تقرأ المصفوفة:</strong>
        </p>
        <ul class="list-disc list-inside space-y-1 text-xs">
          <li>كل صف يمثل كلمة في النص (المصدر)</li>
          <li>كل عمود يمثل كلمة ينتبه إليها (الهدف)</li>
          <li>اللون الداكن = انتباه قوي</li>
          <li>المثلث العلوي فارغ = لا يمكن رؤية المستقبل</li>
        </ul>
      </div>
    {:else}
      <div class="flex items-center justify-center h-64 text-gray-400">
        <div class="text-center">
          <span class="text-4xl mb-2 block">📊</span>
          <p>أدخل نصاً لرؤية مصفوفة الانتباه</p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Highlight du token survolé -->
  {#if $hoveredToken !== null && $tokens[$hoveredToken]}
    <div class="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
      <p class="text-sm">
        <strong>الكلمة المحددة:</strong>
        <span class="font-bold text-primary-700 dark:text-primary-300 mx-2">
          {formatToken($tokens[$hoveredToken].text)}
        </span>
        <span class="text-gray-500">
          (الموضع: {$hoveredToken})
        </span>
      </p>
      
      {#if $currentAttentionMatrix}
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          تنتبه بشكل أكبر إلى: 
          {#each getTopAttentions($currentAttentionMatrix[$hoveredToken], tokenLabels, 3) as item, i}
            <span class="font-medium">{item.label}</span> ({item.value}%){i < 2 ? '، ' : ''}
          {/each}
        </p>
      {/if}
    </div>
  {/if}
</div>

<script context="module" lang="ts">
  function getTopAttentions(row: number[], labels: string[], n: number) {
    if (!row) return [];
    
    const indexed = row.map((value, index) => ({ value, index, label: labels[index] }));
    indexed.sort((a, b) => b.value - a.value);
    
    return indexed.slice(0, n).map(item => ({
      ...item,
      value: (item.value * 100).toFixed(0)
    }));
  }
</script>

<style>
  .attention-matrix-container {
    @apply bg-white dark:bg-gray-800 rounded-xl p-4;
  }
</style>
