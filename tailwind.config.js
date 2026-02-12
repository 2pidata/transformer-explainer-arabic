/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  
  // Support mode sombre
  darkMode: 'class',
  
  theme: {
    extend: {
      // Polices arabes
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'Noto Kufi Arabic', 'Arial', 'sans-serif'],
        'amiri': ['Amiri', 'serif'],
        'mono': ['IBM Plex Mono', 'Consolas', 'monospace']
      },
      
      // Couleurs personnalisées pour les visualisations
      colors: {
        // Couleurs principales
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Couleurs pour l'attention (heatmap)
        'attention': {
          'low': '#f0f9ff',
          'medium': '#60a5fa',
          'high': '#1e3a8a',
        },
        
        // Couleurs pour les embeddings
        'embedding': {
          'positive': '#10b981',
          'negative': '#ef4444',
          'neutral': '#6b7280',
        },
        
        // Couleurs pour les probabilités
        'probability': {
          'high': '#22c55e',
          'medium': '#eab308',
          'low': '#ef4444',
        },
        
        // Couleurs spécifiques tokens
        'token': {
          'bg': '#e0f2fe',
          'border': '#0284c7',
          'hover': '#bae6fd',
          'selected': '#0ea5e9',
        }
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      
      // Espacements RTL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Tailles pour les matrices d'attention
      width: {
        'matrix-sm': '200px',
        'matrix-md': '300px',
        'matrix-lg': '400px',
      },
      height: {
        'matrix-sm': '200px',
        'matrix-md': '300px',
        'matrix-lg': '400px',
      },
      
      // Z-index
      zIndex: {
        'tooltip': '100',
        'popover': '200',
        'modal': '300',
        'loading': '400',
      },
      
      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      
      // Box shadow
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
