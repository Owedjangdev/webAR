import { ArrowLeft, Headset, Info, RefreshCw, ScanLine, TriangleAlert } from 'lucide-react'

// Adresse de support (à configurer au déploiement).
const SUPPORT_EMAIL = 'support@landmark-discovery.app'

const DEFAULT_MESSAGE =
  "Nous n'avons pas pu charger les données de ce monument. Veuillez vérifier " +
  'votre connexion ou scanner à nouveau le code.'
const DEFAULT_TIP =
  "Assurez-vous que l'objectif de votre caméra est propre et que vous êtes bien éclairé."

/**
 * Écran d'erreur visiteur (ex. expérience introuvable, API injoignable).
 * Illustration + message + conseil rapide + actions « Réessayer » / support.
 */
export default function ErrorScreen({
  title = 'Expérience introuvable',
  message = DEFAULT_MESSAGE,
  tip = DEFAULT_TIP,
  onRetry,
}) {
  const handleRetry =
    onRetry ??
    (() => {
      // Pas d'appelant avec onRetry : on évite de recharger la même URL en échec.
      if (window.history.length > 1) {
        window.history.back()
        return
      }
      window.location.assign('/webar')
    })

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-100">
      {/* En-tête de marque. */}
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Retour"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-brand-600 outline-none transition hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-brand-600">VisitAR Benin</span>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Illustration + badge d'alerte. */}
        <div className="relative mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-[2rem] bg-brand-50">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white shadow ring-1 ring-slate-100">
            <ScanLine className="h-14 w-14 text-brand-400" />
          </div>
          <span className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30">
            <TriangleAlert className="h-5 w-5 text-white" />
          </span>
        </div>

        <h1 className="mt-7 text-center text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-500">
          {message}
        </p>

        {/* Conseil rapide. */}
        {tip && (
          <div className="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <Info className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-semibold text-slate-800">Conseil rapide</p>
              <p className="text-slate-500">{tip}</p>
            </div>
          </div>
        )}

        {/* Actions (poussées en bas de l'écran). */}
        <div className="mt-auto space-y-3 pt-8">
          <button
            type="button"
            onClick={handleRetry}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <RefreshCw className="h-5 w-5" />
            Réessayer
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-brand-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Headset className="h-5 w-5" />
            Contacter le support
          </a>
        </div>
      </div>
    </main>
  )
}
