<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { tokens, hoveredToken, selectedToken, setHoveredToken, setSelectedToken } from '$lib/store';
  import type { Token } from '$lib/types';
  
  const dispatch = createEventDispatcher();
  
  export let interactive: boolean = true;
  export let showIds: boolean = false;
  export let showPositions: boolean = true;
  export let colorByPosition: boolean = true;
  
  function formatToken(text: string): string {
    let formatted = text.replace(/Ġ/g, '·').replace(/▁/g, '·');
    if (formatted === '' || formatted === ' ') return '␣';
    return formatted;
  }
  
  function getTokenColor(position: number, total: number): string {
    if (!colorByPosition) return '';
    const hue = (position / Math.max(total - 1, 1)) * 200 + 200; // Bleu à violet
    return `hsl(${hue}, 70%, 95%)`;
  }
  
  function getTokenBorderColor(position: number, total: number): string {
    if (!colorByPosition) return '';
    const hue = (position / Math.max(total - 1, 1)) * 200 + 200;
    return `hsl(${hue}, 70%, 50%)`;
  }
  
  function handleMouseEnter(index: number) {
    if (interactive) {
      setHoveredToken(index);
      dispatch('tokenHover', { index, token: $tokens[index] });
    }
  }
  
  function handleMouseLeave() {
    if (interactive) {
      setHoveredToken(null);
      dispatch('tokenLeave');
    }
  }
  
  function handleClick(index: number) {
    if (interactive) {
      setSelectedToken($selectedToken === index ? null : index);
      dispatch('tokenClick', { index, token: $tokens[index] });
    }
  }
</script>

<div class="token-list-container">
  <div class="flex justify-between items-center mb-3">
    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
      الرموز (Tokens)
    </h3>
    <span class="text-sm text-gray-500 dark:text-gray-400">
      {$tokens.length} رمز
    </span>
  </div>
  
  {#if $tokens.length > 0}
    <div class="flex flex-wrap gap-2" dir="rtl">
      {#each $tokens as token, index}
        <button
          class="token-item"
          class:hovered={$hoveredToken === index}
          class:selected={$selectedToken === index}
          style="
            background-color: {colorByPosition ? getTokenColor(index, $tokens.length) : ''};
            border-color: {colorByPosition ? getTokenBorderColor(index, $tokens.length) : ''};
          "
          on:mouseenter={() => handleMouseEnter(index)}
          on:mouseleave={handleMouseLeave}
          on:click={() => handleClick(index)}
          disabled={!interactive}
        >
          <!-- Position -->
          {#if showPositions}
            <span class="token-position">{index}</span>
          {/if}
          
          <!-- Texte du token -->
          <span class="token-text">{formatToken(token.text)}</span>
          
          <!-- ID -->
          {#if showIds}
            <span class="token-id">#{token.id}</span>
          {/if}
        </button>
      {/each}
    </div>
    
    <!-- Détails du token sélectionné -->
    {#if $selectedToken !== null && $tokens[$selectedToken]}
      <div class="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
        <h4 class="font-medium text-sm mb-2">تفاصيل الرمز:</h4>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt class="text-gray-600 dark:text-gray-400">النص:</dt>
          <dd class="font-mono">{$tokens[$selectedToken].text}</dd>
          
          <dt class="text-gray-600 dark:text-gray-400">المعرّف:</dt>
          <dd class="font-mono">{$tokens[$selectedToken].id}</dd>
          
          <dt class="text-gray-600 dark:text-gray-400">الموضع:</dt>
          <dd>{$selectedToken}</dd>
        </dl>
      </div>
    {/if}
  {:else}
    <div class="text-center py-8 text-gray-400">
      <span class="text-3xl block mb-2">📝</span>
      <p>أدخل نصاً لرؤية الرموز</p>
    </div>
  {/if}
  
  <!-- Légende -->
  {#if $tokens.length > 0 && colorByPosition}
    <div class="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
      <div class="flex items-center gap-1">
        <span class="w-4 h-4 rounded" style="background: hsl(200, 70%, 95%); border: 1px solid hsl(200, 70%, 50%);"></span>
        <span>بداية</span>
      </div>
      <span>←</span>
      <div class="flex items-center gap-1">
        <span class="w-4 h-4 rounded" style="background: hsl(400, 70%, 95%); border: 1px solid hsl(400, 70%, 50%);"></span>
        <span>نهاية</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .token-list-container {
    @apply bg-white dark:bg-gray-800 rounded-xl p-4;
  }
  
  .token-item {
    @apply inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg;
    @apply border-2 border-gray-200 dark:border-gray-600;
    @apply bg-gray-50 dark:bg-gray-700;
    @apply text-sm font-medium;
    @apply transition-all duration-150;
    @apply cursor-pointer select-none;
  }
  
  .token-item:hover:not(:disabled) {
    @apply shadow-md;
    transform: translateY(-2px);
  }
  
  .token-item.hovered {
    @apply ring-2 ring-primary-400 ring-offset-1;
  }
  
  .token-item.selected {
    @apply bg-primary-100 dark:bg-primary-900 border-primary-500;
  }
  
  .token-item:disabled {
    @apply cursor-default;
  }
  
  .token-position {
    @apply text-xs text-gray-400 dark:text-gray-500 font-mono;
    min-width: 1rem;
  }
  
  .token-text {
    @apply text-gray-800 dark:text-gray-200;
  }
  
  .token-id {
    @apply text-xs text-gray-400 dark:text-gray-500 font-mono;
  }
</style>
