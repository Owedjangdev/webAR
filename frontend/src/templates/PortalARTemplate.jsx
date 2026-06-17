import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CameraOff, DoorOpen, HelpCircle, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

import { CameraStatus, FacingMode, useCamera } from '../hooks/useCamera.js'
import { useCanvas } from '../hooks/useCanvas.js'
import { trackCapture } from '../lib/api.js'
import SouvenirScreen from '../components/SouvenirScreen.jsx'
import ARTemplateShell from './ARTemplateShell.jsx'

// Messages d'aide selon l'échec d'accès caméra (fallbacks, CLAUDE.md section 11).
const STATUS_HINT = {
  [CameraStatus.DENIED]:
    'Accès refusé. Réautorise la caméra dans les réglages du navigateur, ou continue sans caméra.',
  [CameraStatus.UNAVAILABLE]:
    'Caméra indisponible (HTTPS requis sur mobile). Tu peux continuer sans caméra.',
}

const HINT =
  'Pointe la caméra autour de toi : le portail s’ouvre sur une autre scène. Appuie sur le cercle pour capturer.'

/**
 * Template "portal_ar" — Portail AR (état de l'art : AR Code Portal, simplifié).
 * Caméra arrière (monde réel) + une « porte » virtuelle au centre ouvrant sur une
 * autre scène (image 2D configurable, PAS de photo 360°). Effet de profondeur par
 * composition Canvas (porte arrondie + zoom lent + anneau lumineux) → capture +
 * partage. La scène = `assets.overlay_image` ; absente -> portail voilé (repli).
 */
export default function PortalARTemplate({ experienceId, place, assets, config }) {
  const { status, stream, start, stop } = useCamera()
  const { capture } = useCanvas()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const [souvenir, setSouvenir] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const videoRef = useRef(null)
  const sceneRef = useRef(null)

  const scene = assets?.overlay_image

  const handleCapture = () => {
    const image = capture(videoRef.current, {
      // scène chargée -> on la passe ; sinon `true` = portail voilé (anneau seul).
      portal: scene && sceneRef.current ? sceneRef.current : true,
      message: config?.message,
      mirror: false, // caméra arrière : pas de miroir
    })
    if (image) trackCapture(experienceId)
    setSouvenir(image)
    setCaptureError(image === null)
  }

  // 1) Souvenir capturé : aperçu + partage / téléchargement / reprise.
  if (souvenir) {
    return (
      <SouvenirScreen
        image={souvenir}
        place={place}
        config={config}
        onRetake={() => {
          setSouvenir(null)
          setCaptureError(false)
        }}
      />
    )
  }

  // 2) Caméra active : scène AR plein écran avec le portail.
  if (status === CameraStatus.ACTIVE) {
    return (
      <PortalScene
        videoRef={videoRef}
        sceneRef={sceneRef}
        stream={stream}
        place={place}
        assets={assets}
        scene={scene}
        config={config}
        captureError={captureError}
        onCapture={handleCapture}
        onClose={stop}
      />
    )
  }

  // 3) Mode sans caméra : aperçu de la scène du portail (sans capture).
  if (withoutCamera) {
    return (
      <ARTemplateShell
        icon={DoorOpen}
        label="Portail AR"
        accentBg="bg-brand-50"
        accentText="text-brand-600"
        place={place}
        config={config}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <PortalWindow scene={scene} className="h-64 w-44" />
          {config?.message && <p className="text-sm text-slate-500">{config.message}</p>}
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <CameraOff className="h-3.5 w-3.5" /> Mode sans caméra — souvenir photo indisponible
          </p>
        </div>
      </ARTemplateShell>
    )
  }

  // 4) Permission / invite : carte centrée commune aux templates.
  return (
    <ARTemplateShell
      icon={DoorOpen}
      label="Portail AR"
      accentBg="bg-brand-50"
      accentText="text-brand-600"
      place={place}
      config={config}
    >
      <PermissionPrompt
        status={status}
        onAllow={() => start(FacingMode.BACK)}
        onContinueWithout={() => setWithoutCamera(true)}
      />
    </ARTemplateShell>
  )
}

/**
 * Scène AR plein écran : flux caméra arrière (monde réel) + porte du portail au
 * centre ouvrant sur la scène de destination + obturateur pour capturer.
 */
function PortalScene({
  videoRef,
  sceneRef,
  stream,
  place,
  assets,
  scene,
  config,
  captureError,
  onCapture,
  onClose,
}) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video && stream) video.srcObject = stream
    return () => {
      if (video) video.srcObject = null
    }
  }, [videoRef, stream])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-contain bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      {/* Porte du portail, centrée, ouvrant sur la scène de destination. */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[12vh]">
        <PortalWindow scene={scene} sceneRef={sceneRef} className="h-[62vh] w-[64vw] max-w-sm" />
      </div>

      {/* Voiles dégradés haut/bas : lisibilité des contrôles. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/75 to-transparent" />

      {/* Barre du haut : retour, badge lieu, aide. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <IconButton label="Fermer la caméra" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <PlaceBadge place={place} assets={assets} />
        <IconButton label="Aide" active={showHint} onClick={() => setShowHint((open) => !open)}>
          <HelpCircle className="h-5 w-5" />
        </IconButton>
      </div>

      {showHint && (
        <p className="absolute inset-x-0 top-24 mx-auto max-w-[85%] rounded-2xl bg-black/60 px-4 py-2.5 text-center text-sm text-white shadow-lg backdrop-blur">
          {HINT}
        </p>
      )}

      {/* Bas : message, erreur éventuelle, puis obturateur. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10">
        {captureError && (
          <p className="rounded-xl bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            Capture impossible : la scène n'autorise pas l'export (CORS).
          </p>
        )}
        {config?.message && (
          <p className="max-w-[80%] rounded-full bg-black/45 px-4 py-2 text-center text-sm font-medium text-white backdrop-blur">
            {config.message}
          </p>
        )}
        <ShutterButton onClick={onCapture} />
      </div>
    </div>
  )
}

/**
 * La « fenêtre » du portail : forme de porte arrondie ouvrant sur la scène (zoom
 * lent), avec anneau lumineux. Si la scène est absente ou ne charge pas, un fond
 * voilé indigo est affiché (repli — pas de crash).
 */
function PortalWindow({ scene, sceneRef, className = '' }) {
  const [sceneOk, setSceneOk] = useState(true)
  const showScene = Boolean(scene) && sceneOk

  return (
    <div
      className={`relative overflow-hidden rounded-[10vw] ring-2 ring-brand-300 shadow-[0_0_45px_rgba(99,102,241,0.6)] motion-safe:animate-rise-in ${className}`}
    >
      {showScene ? (
        <img
          ref={sceneRef}
          src={scene}
          alt="Scène du portail"
          crossOrigin="anonymous"
          onError={() => setSceneOk(false)}
          className="h-full w-full object-cover motion-safe:animate-portal-drift"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 via-brand-500 to-brand-900">
          <Sparkles className="h-10 w-10 text-white/80 motion-safe:animate-portal-drift" />
        </div>
      )}
      {/* Vignette interne : renforce l'effet de profondeur du passage. */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]" />
    </div>
  )
}

/** Gros bouton obturateur central (anneau blanc + pastille animée à l'appui). */
function ShutterButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Capturer le souvenir"
      className="group flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-[5px] border-white/85 p-1.5 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="h-full w-full rounded-full bg-white shadow-inner transition-transform duration-150 group-active:scale-75" />
    </button>
  )
}

/** Badge d'identité du lieu : logo (ou icône par défaut) + nom. */
function PlaceBadge({ place, assets }) {
  const [logoOk, setLogoOk] = useState(true)
  const showLogo = Boolean(assets?.logo) && logoOk

  return (
    <span className="flex max-w-[55%] items-center gap-2 truncate rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow backdrop-blur">
      {showLogo ? (
        <img
          src={assets.logo}
          alt=""
          onError={() => setLogoOk(false)}
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
      )}
      <span className="truncate">{place.name}</span>
    </span>
  )
}

/** Petit bouton rond translucide pour la barre caméra (état « actif » optionnel). */
function IconButton({ label, onClick, active = false, children }) {
  const tone = active ? 'bg-white text-brand-700' : 'bg-black/40 text-white hover:bg-black/55'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full outline-none backdrop-blur transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 ${tone}`}
    >
      {children}
    </button>
  )
}

/** Invite d'autorisation caméra + fallbacks (refus / indisponible / sans caméra). */
function PermissionPrompt({ status, onAllow, onContinueWithout }) {
  const hint = STATUS_HINT[status]

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <DoorOpen className="h-10 w-10 text-brand-500" />
      <p className="text-sm text-slate-500">
        Ouvre un portail vers une autre scène, superposé à ton décor réel.
      </p>

      {hint && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>}

      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={onAllow}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <DoorOpen className="h-5 w-5" />
          Ouvrir le portail
        </button>
        <button
          type="button"
          onClick={onContinueWithout}
          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Continuer sans caméra
        </button>
      </div>

      <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        La caméra sert uniquement à afficher le portail dans ton décor : aucune image n'est
        enregistrée sans ton accord.
      </p>
    </div>
  )
}
