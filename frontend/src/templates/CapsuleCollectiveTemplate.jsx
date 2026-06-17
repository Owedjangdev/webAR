import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CameraOff, HelpCircle, MapPin, ShieldCheck, SwitchCamera, Users } from 'lucide-react'

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

const GROUP_HINT =
  'Rassemblez-vous dans le cadre, souriez, puis appuyez sur le cercle. Changez de caméra pour un selfie ou pour filmer le groupe.'

/**
 * Template "capsule_collective" — Capsule Collective (état de l'art : Coca-Cola
 * #Refreshwherevs). Caméra (frontale OU arrière, au choix) + cadre commun du lieu
 * superposé + message collectif → photo de GROUPE capturée et partagée (WhatsApp
 * via Web Share). Cadre = `assets.overlay_image` ; repli propre si absent.
 */
export default function CapsuleCollectiveTemplate({ experienceId, place, assets, config }) {
  const { status, stream, facingMode, start, stop, flip } = useCamera()
  const { capture } = useCanvas()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const [souvenir, setSouvenir] = useState(null)
  const [lastCapture, setLastCapture] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const logoRef = useRef(null)

  const isFront = facingMode === FacingMode.FRONT

  const handleCapture = () => {
    const image = capture(videoRef.current, {
      overlay: assets?.overlay_image ? overlayRef.current : null,
      logo: assets?.logo ? logoRef.current : null,
      message: config?.message,
      mirror: isFront, // selfie de groupe : miroir comme l'aperçu
    })
    if (image) {
      setLastCapture(image)
      trackCapture(experienceId)
    }
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

  // 2) Caméra active : photo de groupe plein écran.
  if (status === CameraStatus.ACTIVE) {
    return (
      <GroupCamera
        videoRef={videoRef}
        overlayRef={overlayRef}
        logoRef={logoRef}
        stream={stream}
        mirror={isFront}
        place={place}
        assets={assets}
        config={config}
        captureError={captureError}
        lastCapture={lastCapture}
        onCapture={handleCapture}
        onOpenLast={() => setSouvenir(lastCapture)}
        onFlip={flip}
        onClose={stop}
      />
    )
  }

  // 3) Permission / fallback : carte centrée commune aux templates.
  return (
    <ARTemplateShell
      icon={Users}
      label="Capsule Collective"
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
 * Vue caméra plein écran pour la photo de groupe : vidéo, cadre commun, barre
 * d'actions, miniature de la dernière photo, obturateur central et flip caméra.
 */
function GroupCamera({
  videoRef,
  overlayRef,
  logoRef,
  stream,
  mirror,
  place,
  assets,
  config,
  captureError,
  lastCapture,
  onCapture,
  onOpenLast,
  onFlip,
  onClose,
}) {
  const [overlayOk, setOverlayOk] = useState(true)
  const [showHint, setShowHint] = useState(false)

  // Branche le flux sur le <video> au montage, nettoie au démontage / changement.
  useEffect(() => {
    const video = videoRef.current
    if (video && stream) video.srcObject = stream
    return () => {
      if (video) video.srcObject = null
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

      {/* Cadre commun du lieu (caché s'il ne charge pas — fallback asset manquant). */}
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

      {/* Logo chargé en CORS (caché) : inclus dans l'image capturée. */}
      {assets?.logo && (
        <img ref={logoRef} src={assets.logo} alt="" crossOrigin="anonymous" className="hidden" />
      )}

      {/* Voiles dégradés haut/bas : lisibilité des contrôles. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/75 to-transparent" />

      {/* Barre du haut : retour, badge lieu, aide + flip caméra. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <IconButton label="Fermer la caméra" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>

        <PlaceBadge place={place} assets={assets} />

        <div className="flex flex-col items-end gap-2">
          <IconButton label="Aide" active={showHint} onClick={() => setShowHint((open) => !open)}>
            <HelpCircle className="h-5 w-5" />
          </IconButton>
          <IconButton label="Changer de caméra (selfie / arrière)" onClick={onFlip}>
            <SwitchCamera className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      {showHint && (
        <p className="absolute inset-x-0 top-24 mx-auto max-w-[85%] rounded-2xl bg-black/60 px-4 py-2.5 text-center text-sm text-white shadow-lg backdrop-blur">
          {GROUP_HINT}
        </p>
      )}

      {/* Bas : message collectif, erreur éventuelle, puis barre d'action. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10">
        {captureError && (
          <p className="rounded-xl bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            Capture impossible : le cadre n'autorise pas l'export (CORS).
          </p>
        )}
        {config?.message && (
          <p className="max-w-[80%] rounded-full bg-black/45 px-4 py-2 text-center text-sm font-medium text-white backdrop-blur">
            {config.message}
          </p>
        )}

        <div className="flex w-full items-center justify-between">
          <CaptureThumbnail image={lastCapture} onClick={onOpenLast} />
          <ShutterButton onClick={onCapture} />
          {/* Espace miroir pour garder l'obturateur centré. */}
          <span className="h-14 w-14" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

/** Gros bouton obturateur central (anneau blanc + pastille animée à l'appui). */
function ShutterButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Capturer la photo de groupe"
      className="group flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-[5px] border-white/85 p-1.5 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="h-full w-full rounded-full bg-white shadow-inner transition-transform duration-150 group-active:scale-75" />
    </button>
  )
}

/** Miniature de la dernière photo (rouvre le souvenir) ou espace réservé. */
function CaptureThumbnail({ image, onClick }) {
  if (!image) return <span className="h-14 w-14" aria-hidden="true" />
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Revoir la dernière photo de groupe"
      className="h-14 w-14 cursor-pointer overflow-hidden rounded-2xl border-2 border-white/85 shadow-lg outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
    >
      <img src={image} alt="" className="h-full w-full object-cover" />
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
function PermissionPrompt({ status, withoutCamera, onAllow, onContinueWithout }) {
  const hint = STATUS_HINT[status]

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <Users className="h-10 w-10 text-brand-500" />
      <p className="text-sm text-slate-500">
        Réunissez le groupe et immortalisez l'instant avec le cadre du lieu, à partager ensemble.
      </p>

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
            Prendre la photo de groupe
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
        Aucune image n'est enregistrée sans votre accord : la caméra sert uniquement à l'affichage.
      </p>
    </div>
  )
}
