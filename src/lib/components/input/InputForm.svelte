<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { inputText, isBusy, tokens } from '$lib/store';
  import { ARABIC_LABELS } from '$lib/utils/constants';
  
  const dispatch = createEventDispatcher();
  
  let textareaElement: HTMLTextAreaElement;
  
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    dispatch('input', { text: target.value });
  }
  
  function handleKeydown(event: KeyboardEvent) {
    // Ctrl+Enter pour générer
    if (event.ctrlKey && event.key === 'Enter') {
      dispatch('generate');
    }
  }
  
  function clearInput() {
    dispatch('clear');
  }
  
  export function focus() {
    textareaElement?.focus();
  }
</script>

<div class="relative">
  <!-- Label -->
  <label for="input-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    أدخل نصاً بالعربية
  </label>
  
  <!-- Textarea -->
  <div class="relative">
    <textarea
      bind:this={textareaElement}
      id="input-text"
      value={$inputText}
      on:input={handleInput}
      on:keydown={handleKeydown}
      class="input-arabic w-full h-32 resize-none pr-4 pl-12"
      placeholder={ARABIC_LABELS.inputPlaceholder}
      dir="rtl"
      disabled={$isBusy}
    ></textarea>
    
    <!-- Indicateur de chargement -->
    {#if $isBusy}
      <div class="absolute top-3 left-3">
        <div class="loading-spinner w-5 h-5"></div>
      </div>
    {/if}
    
    <!-- Bouton effacer -->
    {#if $inputText.length > 0 && !$isBusy}
      <button
        on:click={clearInput}
        class="absolute top-3 left-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="مسح"
      >
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    {/if}
  </div>
  
  <!-- Infos -->
  <div class="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
    <span>
      {$tokens.length} رمز
    </span>
    <span class="text-xs">
      Ctrl+Enter للتوليد
    </span>
  </div>
</div>
