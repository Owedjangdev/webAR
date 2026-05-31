/**
 * Fond d'écran commun à tous les écrans : dégradé clair + halos diffus,
 * contenu centré, largeur mobile-first. (Direction artistique de la maquette.)
 */
export default function ScreenLayout({ children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-100 p-6">
      {/* Halos décoratifs en arrière-plan. */}
      <div className="pointer-events-none absolute -left-16 top-12 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative w-full max-w-sm">{children}</div>
    </main>
  )
}
