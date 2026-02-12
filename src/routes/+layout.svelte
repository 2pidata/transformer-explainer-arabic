<script lang="ts">
  import '../app.css';
  import { theme, textDirection } from '$lib/store';
  
  // Appliquer le thème et la direction au chargement
  $: if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', $theme === 'dark');
    document.documentElement.dir = $textDirection;
    document.documentElement.lang = $textDirection === 'rtl' ? 'ar' : 'en';
  }
</script>

<svelte:head>
  <title>شارح المحوّل - Transformer Explainer</title>
  <meta name="description" content="أداة تفاعلية لتعلم كيفية عمل نماذج المحوّل (Transformer) مع دعم كامل للغة العربية" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
  <slot />
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  
  :global(body) {
    font-family: 'Noto Sans Arabic', 'Noto Kufi Arabic', sans-serif;
  }
</style>
