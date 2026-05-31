import { CameraOff } from 'lucide-react'

import PlaceHeading from './PlaceHeading.jsx'

/**
 * Affichage simple de l'expérience sans caméra (fallback « Continuer sans caméra »).
 * Montre le lieu, le message et le template de l'expérience.
 */
export default function NoCameraCard({ experience, onEnableCamera }) {
  const { place, template, config } = experience

  return (
    <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100">
      <PlaceHeading place={place} />

      {config?.message && (
        <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-center text-slate-700">
          {config.message}
        </p>
      )}

      <dl className="mt-4 flex items-center justify-between text-sm">
        <dt className="text-slate-400">Template</dt>
        <dd className="font-mono text-slate-700">{template}</dd>
      </dl>

      <button
        type="button"
        onClick={onEnableCamera}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
      >
        Activer la caméra
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <CameraOff className="h-3.5 w-3.5" /> Mode sans caméra
      </p>
    </div>
  )
}
