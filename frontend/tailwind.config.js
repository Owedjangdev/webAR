/** @type {import('tailwindcss').Config} */
// Configuration Tailwind v3.4 (classique). NE PAS migrer en v4 : la cible
// navigateur est Chrome >= 80 (CLAUDE.md section 3).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Couleurs de marque issues de la maquette (bleu principal #2563EB).
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      // Animation "égaliseur" des barres de chargement.
      keyframes: {
        equalize: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        equalize: 'equalize 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
