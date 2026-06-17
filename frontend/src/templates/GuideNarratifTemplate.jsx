import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Camera,
  CameraOff,
  HelpCircle,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

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

const DEFAULT_NARRATION =
  "Bienvenue ! Je suis ton guide pour ce lieu. Approche-toi et laisse-moi te raconter son histoire."

/**
 * Template "guide_narratif" — Guide NarratifAR (état de l'art : HeritageSite AR,
 * version simplifiée). Caméra arrière + personnage 2D superposé au décor réel +
 * narration (texte + audio optionnel) + capture souvenir. PAS de dialogue
 * interactif ni de jeu de piste (cf. cahier des charges : template simplifié).
 *
 * Assets du contrat consommés : `character` (image du personnage, optionnel,
 * repli avatar par défaut) et `narration_audio` (audio, optionnel : sans lui, la
 * narration reste en texte — « audio OU texte »).
 */
export default function GuideNarratifTemplate({ experienceId, place, assets, config }) {
  const { status, stream, start, stop } = useCamera()
  const { capture } = useCanvas()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const [souvenir, setSouvenir] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const videoRef = useRef(null)
  const characterRef = useRef(null)

  const narration = config?.narration?.trim() || DEFAULT_NARRATION
  const guideName = config?.title?.trim() || 'Guide du lieu'

  const handleCapture = () => {
    const image = capture(videoRef.current, {
      character: assets?.character ? characterRef.current : null,
      message: config?.title?.trim() || place.name,
      mirror: false, // caméra arrière : pas d'effet miroir
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

  // 2) Caméra active : scène AR plein écran avec personnage + narration.
  if (status === CameraStatus.ACTIVE) {
    return (
      <GuideScene
        videoRef={videoRef}
        characterRef={characterRef}
        stream={stream}
        place={place}
        assets={assets}
        guideName={guideName}
        narration={narration}
        captureError={captureError}
        onCapture={handleCapture}
        onClose={stop}
      />
    )
  }

  // 3) Mode sans caméra : narration lisible/écoutable, sans capture (pas de flux).
  if (withoutCamera) {
    return (
      <ARTemplateShell
        icon={BookOpen}
        label="Guide NarratifAR"
        accentBg="bg-brand-50"
        accentText="text-brand-600"
        place={place}
        config={config}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <GuideAvatar character={assets?.character} name={guideName} />
          <NarrationCard guideName={guideName} narration={narration} audioSrc={assets?.narration_audio} compact />
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
      icon={BookOpen}
      label="Guide NarratifAR"
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
 * Scène AR plein écran : flux caméra arrière + personnage 2D ancré en bas +
 * carte de narration (texte + audio) + obturateur pour capturer le souvenir.
 */
function GuideScene({
  videoRef,
  characterRef,
  stream,
  place,
  assets,
  guideName,
  narration,
  captureError,
  onCapture,
  onClose,
}) {
  const [showHint, setShowHint] = useState(false)

  // Branche le flux sur le <video> au montage, nettoie au démontage.
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

      {/* Personnage 2D superposé, ancré en bas et centré (repli avatar si absent). */}
      <CharacterLayer character={assets?.character} characterRef={characterRef} name={guideName} />

      {/* Voiles dégradés haut/bas : lisibilité des contrôles par-dessus la vidéo. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/80 to-transparent" />

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
        <p className="absolute inset-x-0 top-24 mx-auto max-w-[80%] rounded-2xl bg-black/60 px-4 py-2.5 text-center text-sm text-white shadow-lg backdrop-blur">
          Écoute ou lis le récit du guide, puis appuie sur le cercle pour capturer ton souvenir.
        </p>
      )}

      {/* Bas : carte de narration puis obturateur. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10">
        {captureError && (
          <p className="rounded-xl bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            Capture impossible : le personnage n'autorise pas l'export (CORS).
          </p>
        )}
        <NarrationCard guideName={guideName} narration={narration} audioSrc={assets?.narration_audio} />
        <ShutterButton onClick={onCapture} />
      </div>
    </div>
  )
}

/** Couche personnage : image 2D (cachée tant que pas chargée), repli avatar. */
function CharacterLayer({ character, characterRef, name }) {
  const [imgOk, setImgOk] = useState(true)
  const showImg = Boolean(character) && imgOk

  if (showImg) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <img
          ref={characterRef}
          src={character}
          alt={name}
          crossOrigin="anonymous"
          onError={() => setImgOk(false)}
          className="h-[62vh] w-auto max-w-[90%] object-contain drop-shadow-2xl motion-safe:animate-rise-in"
        />
      </div>
    )
  }

  // Repli : avatar générique flottant (asset manquant — pas de crash).
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
      <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-2xl ring-4 ring-white/40 motion-safe:animate-rise-in">
        <UserRound className="h-14 w-14" />
      </span>
    </div>
  )
}

/** Avatar du guide pour le mode sans caméra (image ou icône par défaut). */
function GuideAvatar({ character, name }) {
  const [imgOk, setImgOk] = useState(true)
  const showImg = Boolean(character) && imgOk

  return (
    <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-600 shadow-md ring-4 ring-brand-100">
      {showImg ? (
        <img
          src={character}
          alt={name}
          onError={() => setImgOk(false)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="h-14 w-14" />
      )}
    </span>
  )
}

/**
 * Carte de narration : nom du guide + récit (défilable) + bouton lecture audio
 * (au tap : l'autoplay est bloqué sur mobile). Sans audio, narration texte seule.
 */
function NarrationCard({ guideName, narration, audioSrc, compact = false }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [audioOk, setAudioOk] = useState(true)
  const hasAudio = Boolean(audioSrc) && audioOk

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => setAudioOk(false))
    }
  }

  return (
    <div
      className={`w-full max-w-md rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur ${
        compact ? '' : 'mx-auto'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800">
          <BookOpen className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{guideName}</span>
        </span>
        {hasAudio && (
          <button
            type="button"
            onClick={toggleAudio}
            aria-label={playing ? 'Mettre la narration en pause' : 'Écouter la narration'}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white outline-none transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Écouter'}
          </button>
        )}
      </div>
      <p className="max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {narration}
      </p>
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setAudioOk(false)}
        />
      )}
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
      <BookOpen className="h-10 w-10 text-brand-500" />
      <p className="text-sm text-slate-500">
        Pointe la caméra vers le décor : ton guide apparaît et te raconte l'histoire du lieu.
      </p>

      {hint && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>}

      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={onAllow}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Camera className="h-5 w-5" />
          Lancer le guide
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
        La caméra sert uniquement à afficher le guide dans le décor : aucune image n'est enregistrée
        sans ton accord.
      </p>
    </div>
  )
}
