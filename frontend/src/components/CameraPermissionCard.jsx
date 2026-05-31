import { Camera, Focus, MapPin, ShieldCheck } from 'lucide-react'

import PlaceHeading from './PlaceHeading.jsx'

// Indication affichée selon l'échec d'accès caméra (CLAUDE.md section 11).
const STATUS_HINT = {
  denied:
    "Accès refusé. Réautorise la caméra dans les réglages du navigateur, ou continue sans caméra.",
  unavailable:
    "Caméra indisponible sur cet appareil/navigateur (HTTPS requis). Tu peux continuer sans caméra.",
}

/**
 * Carte de demande d'autorisation caméra (maquette « Autorisation Caméra »).
 */
export default function CameraPermissionCard({ place, status, onAllow, onContinueWithout }) {
  const hint = STATUS_HINT[status]

  return (
    <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100">
      <PlaceHeading place={place} />

      {/* Cluster d'icônes : caméra centrale + badges scan AR et localisation. */}
      <div className="relative mx-auto mt-6 flex h-28 w-28 items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50">
          <Camera className="h-10 w-10 text-brand-600" />
        </div>
        <span className="absolute -right-1 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-100">
          <Focus className="h-4 w-4 text-brand-600" />
        </span>
        <span className="absolute -left-1 bottom-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-100">
          <MapPin className="h-4 w-4 text-brand-600" />
        </span>
      </div>

      <h2 className="mt-6 text-center text-lg font-bold text-slate-800">
        Autorisez l'accès à la caméra pour vivre l'expérience
      </h2>
      <p className="mt-2 text-center text-sm text-slate-500">
        Découvrez les monuments historiques en réalité augmentée à travers votre objectif.
      </p>

      {hint && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
          {hint}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onAllow}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
        >
          <Focus className="h-5 w-5" />
          Autoriser la caméra
        </button>
        <button
          type="button"
          onClick={onContinueWithout}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-brand-600 transition hover:bg-slate-50"
        >
          Continuer sans caméra
        </button>
      </div>

      {/* Note de confidentialité. */}
      <div className="mt-5 flex gap-3 rounded-xl bg-slate-50 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-xs leading-relaxed text-slate-500">
          Votre vie privée nous tient à cœur. Nous n'enregistrons ni ne stockons aucune image
          de votre caméra sans votre consentement explicite. L'accès est uniquement utilisé pour
          l'affichage AR.
        </p>
      </div>
    </div>
  )
}
