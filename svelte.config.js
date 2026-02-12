import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Preprocess pour TypeScript et PostCSS
  preprocess: vitePreprocess(),

  kit: {
    // Adapter static pour GitHub Pages
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/transformer-explainer-arabic' : ''
    },
    
    // Alias pour les imports
    alias: {
      '$lib': './src/lib',
      '$components': './src/lib/components',
      '$store': './src/lib/store',
      '$utils': './src/lib/utils',
      '$types': './src/lib/types'
    },

    // Prerender toutes les pages
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config;
