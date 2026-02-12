<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let title: string = '';
  export let message: string = '';
  export let dismissible: boolean = true;
  
  const dispatch = createEventDispatcher();
  
  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
  };
  
  function dismiss() {
    dispatch('dismiss');
  }
</script>

<div class="rounded-lg border p-4 {colors[type]}" role="alert">
  <div class="flex items-start gap-3">
    <span class="text-xl flex-shrink-0">{icons[type]}</span>
    
    <div class="flex-1">
      {#if title}
        <h4 class="font-bold mb-1">{title}</h4>
      {/if}
      <p class="text-sm">{message}</p>
      <slot />
    </div>
    
    {#if dismissible}
      <button 
        on:click={dismiss}
        class="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="إغلاق"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    {/if}
  </div>
</div>
