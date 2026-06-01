import { useState } from 'react'
import { Camera, CameraOff, ShieldCheck } from 'lucide-react'

import CameraStage from '../components/CameraStage.jsx'
import { CameraStatus, useCamera } from '../hooks/useCamera.js'
import ARTemplateShell from './ARTemplateShell.jsx'

// Messages d'aide selon l'échec d'accès caméra (fallbacks, CLAUDE.md section 11).
const STATUS_HINT = {
  [CameraStatus.DENIED]:
    'Accès refusé. Réautorise la caméra dans les réglages du navigateur, ou continue sans caméra.',
  [CameraStatus.UNAVAILABLE]:
    'Caméra indisponible (HTTPS requis sur mobile). Tu peux continuer sans caméra.',
}

/**
 * Template "selfie_ar" — Selfie Souvenir AR.
 * Zone distinctive : la caméra (frontale) sur laquelle viendra l'overlay + le logo.
 * Réutilise le hook useCamera et le composant CameraStage de la semaine 1.
 */
export default function SelfieSouvenirTemplate({ place, config }) {
  const { status, stream, start, stop } = useCamera()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const hint = STATUS_HINT[status]

  return (
    <ARTemplateShell
      icon={Camera}
      label="Selfie Souvenir AR"
      accentBg="bg-brand-50"
      accentText="text-brand-600"
      place={place}
      config={config}
    >
      {status === CameraStatus.ACTIVE ? (
        <CameraStage stream={stream} place={place} config={config} onStop={stop} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <Camera className="h-10 w-10 text-brand-500" />
          <p className="text-sm text-slate-500">Zone caméra — prends ton selfie souvenir.</p>

          {hint && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>
          )}

          {withoutCamera ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <CameraOff className="h-3.5 w-3.5" /> Mode sans caméra
            </p>
          ) : (
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={start}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
              >
                Autoriser la caméra
              </button>
              <button
                type="button"
                onClick={() => setWithoutCamera(true)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-slate-50"
              >
                Continuer sans caméra
              </button>
            </div>
          )}

          <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            Aucune image n'est enregistrée sans ton accord : la caméra sert uniquement à l'affichage.
          </p>
        </div>
      )}
    </ARTemplateShell>
  )
}
