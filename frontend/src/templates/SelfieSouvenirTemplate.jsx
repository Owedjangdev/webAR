import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Download,
  MapPin,
  RotateCcw,
  ShieldCheck,
  SwitchCamera,
} from 'lucide-react'

import { CameraStatus, FacingMode, useCamera } from '../hooks/useCamera.js'
import { useCanvas } from '../hooks/useCanvas.js'
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
 * Caméra plein écran + overlay décoratif + logo/lieu + message + capture.
 * Toute la logique média est dans les hooks useCamera / useCanvas.
 */
export default function SelfieSouvenirTemplate({ place, assets, config }) {
  const { status, stream, facingMode, start, stop, flip } = useCamera()
  const { capture } = useCanvas()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const videoRef = useRef(null)
  const overlayRef = useRef(null)

  const isFront = facingMode === FacingMode.FRONT

  const handleCapture = () => {
    const image = capture(videoRef.current, {
      overlay: assets?.overlay_image ? overlayRef.current : null,
      message: config?.message,
      mirror: isFront,
    })
    setCapturedImage(image)
    setCaptureError(image === null)
  }

  // 1) Aperçu du souvenir capturé (partage complet : semaine 4).
  if (capturedImage) {
    return <CapturePreview image={capturedImage} onRetake={() => setCapturedImage(null)} />
  }

  // 2) Caméra active : expérience plein écran.
  if (status === CameraStatus.ACTIVE) {
    return (
      <LiveCamera
        videoRef={videoRef}
        overlayRef={overlayRef}
        stream={stream}
        mirror={isFront}
        place={place}
        assets={assets}
        config={config}
        captureError={captureError}
        onCapture={handleCapture}
        onFlip={flip}
        onClose={stop}
      />
    )
  }

  // 3) Permission / fallback : carte centrée commune aux templates.
  return (
    <ARTemplateShell
      icon={Camera}
      label="Selfie Souvenir AR"
      accentBg="bg-brand-50"
      accentText="text-brand-600"
      place={place}
      config={config}
    >
      <PermissionPrompt
        status={status}
        withoutCamera={withoutCamera}
        onAllow={() => start(FacingMode.FRONT)}
        onContinueWithout={() => setWithoutCamera(true)}
      />
    </ARTemplateShell>
  )
}

/**
 * Vue caméra plein écran : vidéo, overlay, badge lieu, flip, message, capture.
 */
function LiveCamera({
  videoRef,
  overlayRef,
  stream,
  mirror,
  place,
  assets,
  config,
  captureError,
  onCapture,
  onFlip,
  onClose,
}) {
  const [overlayOk, setOverlayOk] = useState(true)

  // Branche le flux sur l'élément <video> une fois monté, et nettoie la
  // référence au démontage / changement de flux (pas de référence périmée).
  useEffect(() => {
    const video = videoRef.current
    if (video && stream) {
      video.srcObject = stream
    }
    return () => {
      if (video) {
        video.srcObject = null
      }
    }
  }, [videoRef, stream])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-contain bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
      />

      {/* Overlay décoratif (caché s'il ne se charge pas — fallback asset manquant). */}
      {assets?.overlay_image && overlayOk && (
        <img
          ref={overlayRef}
          src={assets.overlay_image}
          alt=""
          crossOrigin="anonymous"
          onError={() => setOverlayOk(false)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Voiles dégradés haut/bas : lisibilité des contrôles par-dessus la vidéo. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Barre du haut : retour, badge lieu, changement de caméra. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <IconButton label="Fermer la caméra" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <PlaceBadge place={place} assets={assets} />
        <IconButton label="Changer de caméra" onClick={onFlip}>
          <SwitchCamera className="h-5 w-5" />
        </IconButton>
      </div>

      {/* Bas : message souvenir, erreur éventuelle, puis bouton obturateur. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
        {captureError && (
          <p className="rounded-xl bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            Capture impossible : l'overlay n'autorise pas l'export (CORS).
          </p>
        )}
        {config?.message && (
          <p className="max-w-[80%] rounded-full bg-black/45 px-4 py-2 text-center text-sm text-white backdrop-blur">
            {config.message}
          </p>
        )}

        <button
          type="button"
          onClick={onCapture}
          aria-label="Capturer le souvenir"
          className="group mt-1 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-[5px] border-white/80 p-1.5 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="h-full w-full rounded-full bg-white shadow-inner transition-transform duration-150 group-active:scale-75" />
        </button>
      </div>
    </div>
  )
}

/** Badge d'identité du lieu : logo (ou icône par défaut si absent/non chargé) + nom. */
function PlaceBadge({ place, assets }) {
  const [logoOk, setLogoOk] = useState(true)
  const showLogo = Boolean(assets?.logo) && logoOk

  return (
    <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow backdrop-blur">
      {showLogo ? (
        <img
          src={assets.logo}
          alt=""
          onError={() => setLogoOk(false)}
          className="h-5 w-5 rounded-full object-cover"
        />
      ) : (
        <MapPin className="h-4 w-4 text-brand-600" />
      )}
      {place.name}
    </span>
  )
}

/** Petit bouton rond translucide pour la barre caméra. */
function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white outline-none backdrop-blur transition hover:bg-black/55 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {children}
    </button>
  )
}

/** Aperçu plein écran du souvenir capturé (télécharger / reprendre). */
function CapturePreview({ image, onRetake }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <img src={image} alt="Souvenir capturé" className="min-h-0 flex-1 object-contain" />
      <div className="flex items-center justify-center gap-3 bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <a
          href={image}
          download="souvenir.png"
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 font-semibold text-white shadow-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white"
        >
          <Download className="h-5 w-5" />
          Télécharger
        </a>
        <button
          type="button"
          onClick={onRetake}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        >
          <RotateCcw className="h-5 w-5" />
          Reprendre
        </button>
      </div>
    </div>
  )
}

/** Invite d'autorisation caméra + fallbacks (refus / indisponible / sans caméra). */
function PermissionPrompt({ status, withoutCamera, onAllow, onContinueWithout }) {
  const hint = STATUS_HINT[status]

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <Camera className="h-10 w-10 text-brand-500" />
      <p className="text-sm text-slate-500">Prends ton selfie souvenir avec l'overlay du lieu.</p>

      {hint && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>}

      {withoutCamera ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <CameraOff className="h-3.5 w-3.5" /> Mode sans caméra
        </p>
      ) : (
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={onAllow}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Autoriser la caméra
          </button>
          <button
            type="button"
            onClick={onContinueWithout}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500"
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
  )
}
