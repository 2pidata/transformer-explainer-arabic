import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  // Optimisations pour ONNX Runtime
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    host: true,
    // Headers pour ONNX Runtime (SharedArrayBuffer)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  
  // Configuration de build
  build: {
    target: 'es2022',
    // Augmenter la limite pour les gros modèles
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('onnxruntime-web')) return 'onnx';
          if (id.includes('d3-') || id.includes('/d3/')) return 'd3';
          if (id.includes('@huggingface/transformers')) return 'transformers';
        }
      }
    }
  },
  
  // Définitions globales
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },

  // Configuration pour les workers (ONNX)
  worker: {
    format: 'es'
  }
});
