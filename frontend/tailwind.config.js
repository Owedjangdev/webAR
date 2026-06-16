/** @type {import('tailwindcss').Config} */
// Configuration Tailwind v3.4 (classique). NE PAS migrer en v4 : la cible
// navigateur est Chrome >= 80 (CLAUDE.md section 3).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Palette de marque INDIGO (réf. dashboard « Aurora ») — propagée partout
      // via les classes brand-*. Bleu roi/indigo sur fond clair gris-bleu.
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Fond clair de l'application (gris-bleu très pâle, comme Aurora).
        canvas: '#f3f4fb',
      },
      // Animations (transform/opacity uniquement → GPU, fluides sur mobile faible).
      keyframes: {
        // Égaliseur des barres de chargement.
        equalize: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        // Déblocage du badge : apparition avec léger rebond.
        'badge-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Halo doré qui éclate une fois puis s'estompe (pas d'animation infinie).
        'badge-burst': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '40%': { transform: 'scale(1.25)', opacity: '0.7' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        // Texte/éléments qui montent en fondu.
        'rise-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        equalize: 'equalize 1s ease-in-out infinite',
        // 'both' garde l'état final ; courbe à rebond pour le pop.
        'badge-pop': 'badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'badge-burst': 'badge-burst 1.1s ease-out both',
        'rise-in': 'rise-in 0.5s ease-out 0.15s both',
      },
    },
  },
  plugins: [],
}
