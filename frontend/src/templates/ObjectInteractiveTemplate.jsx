import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Box, CameraOff, Check, Hand, MapPin, ScanLine, ShieldCheck } from 'lucide-react'

import { CameraStatus, FacingMode, useCamera } from '../hooks/useCamera.js'
import { useCanvas } from '../hooks/useCanvas.js'
import { trackCapture } from '../lib/api.js'
import { isObjectDiscovered, markObjectDiscovered } from '../lib/discoveryStorage.js'
import SouvenirScreen from '../components/SouvenirScreen.jsx'
import ARTemplateShell from './ARTemplateShell.jsx'
import ObjectARScene from './ObjectARScene.jsx'
import ObjectModelViewer from './ObjectModelViewer.jsx'

// Couleur d'accent par défaut (émeraude) : identité visuelle du template object_ar.
const DEFAULT_ACCENT = '#10B981'

// Messages d'aide selon l'échec d'accès caméra (fallbacks, cf. ar-templates).
const STATUS_HINT = {
  [CameraStatus.DENIED]:
    'Accès refusé. Réautorise la caméra dans les réglages, ou découvre l’objet sans caméra.',
  [CameraStatus.UNAVAILABLE]:
    'Caméra indisponible (HTTPS requis sur mobile). Tu peux continuer sans caméra.',
}

/** Dérive les infos produit du config_json, avec des valeurs de repli sûres. */
function readProduct(place, config) {
  return {
    title: config?.title?.trim() || place?.name || 'Objet',
    description: config?.description?.trim() || config?.message?.trim() || '',
    price: config?.price?.trim() || '',
    color: config?.color || DEFAULT_ACCENT,
  }
}

/**
 * Template "object_ar" — Objet InteractifAR (cible : restauration).
 * Le visiteur pointe la caméra arrière vers l'objet physique, tape l'écran pour
 * révéler une fiche produit (title/description/price), peut capturer la vue, et
 * voit un indicateur « Découvert » au retour (persisté en localStorage).
 */
/**
 * Aiguillage du template object_ar :
 * - si l'expérience fournit un modèle 3D (`assets.model`) → viewer rotatif (à la
 *   AR Code : on fait tourner le vrai objet) ;
 * - sinon → expérience caméra interactive (CameraObjectExperience, historique).
 * Le branchement est ici (et pas via des hooks conditionnels) pour respecter les
 * règles des hooks : chaque sous-composant possède ses propres hooks.
 */
export default function ObjectInteractiveTemplate(props) {
  if (props.assets?.model) {
    return <ObjectModelViewer {...props} />
  }
  return <CameraObjectExperience {...props} />
}

function CameraObjectExperience({ experienceId, place, assets, config }) {
  const { status, stream, start, stop } = useCamera()
  const { capture } = useCanvas()
  const product = readProduct(place, config)

  const [withoutCamera, setWithoutCamera] = useState(false)
  const [souvenir, setSouvenir] = useState(null) // image capturée (null = pas de capture)
  const [captureError, setCaptureError] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [discovered, setDiscovered] = useState(() => isObjectDiscovered(experienceId))
  const [has3d, setHas3d] = useState(false) // couche 3D three.js réellement active

  const videoRef = useRef(null)
  const logoRef = useRef(null)
  const glCanvasRef = useRef(null) // canvas WebGL partagé (rendu 3D + capture)

  // Stable : évite de relancer la scène 3D à chaque rendu.
  const handle3dStatus = useCallback((status) => setHas3d(status === 'active'), [])

  // Marque l'objet « découvert » la première fois que la fiche est consultée.
  const markDiscoveredOnce = () => {
    if (!discovered) {
      markObjectDiscovered(experienceId)
      setDiscovered(true)
    }
  }

  // Ouvre/ferme la fiche au tap ; la 1ʳᵉ ouverture déclenche la découverte.
  const toggleCard = () => {
    setCardOpen((open) => {
      if (!open) markDiscoveredOnce()
      return !open
    })
  }

  const handleCapture = () => {
    // La fiche HTML n'est pas rasterisable sans lib lourde : on incruste le nom
    // (et le prix) en légende via useCanvas, par-dessus la vue caméra + logo.
    const caption = product.price ? `${product.title} — ${product.price}` : product.title
    const image = capture(videoRef.current, {
      overlayCanvas: has3d ? glCanvasRef.current : null, // inclut le rendu 3D si actif
      logo: assets?.logo ? logoRef.current : null,
      message: caption,
      mirror: false, // caméra arrière : pas de miroir
    })
    if (image) {
      trackCapture(experienceId) // souvenir capturé : compté pour les stats partenaire
    }
    setSouvenir(image)
    setCaptureError(image === null)
  }

  // 1) Souvenir capturé : aperçu + partage / téléchargement (écran réutilisé).
  if (souvenir) {
    return (
      <SouvenirScreen
        image={souvenir}
        place={place}
        config={config}
        onRetake={() => setSouvenir(null)}
      />
    )
  }

  // 2) Caméra active : présentation interactive plein écran.
  if (status === CameraStatus.ACTIVE) {
    return (
      <LiveObjectView
        videoRef={videoRef}
        logoRef={logoRef}
        glCanvasRef={glCanvasRef}
        stream={stream}
        place={place}
        assets={assets}
        product={product}
        cardOpen={cardOpen}
        discovered={discovered}
        captureError={captureError}
        onToggleCard={toggleCard}
        onCapture={handleCapture}
        on3dStatus={handle3dStatus}
        onClose={stop}
      />
    )
  }

  // 3) Permission / fallback : carte centrée commune aux templates.
  return (
    <ARTemplateShell
      icon={Box}
      label="Objet Interactif AR"
      accentBg="bg-emerald-100"
      accentText="text-emerald-700"
      place={place}
      config={config}
    >
      {withoutCamera ? (
        <div className="w-full space-y-3">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <CameraOff className="h-3.5 w-3.5" /> Mode sans caméra
          </p>
          <ProductCardBody product={product} />
        </div>
      ) : (
        <PermissionPrompt
          status={status}
          onAllow={() => start(FacingMode.BACK)}
          onContinueWithout={() => {
            markDiscoveredOnce()
            setWithoutCamera(true)
          }}
        />
      )}
    </ARTemplateShell>
  )
}

/** Vue caméra arrière plein écran : vidéo, logo, surface tactile + fiche, capture. */
function LiveObjectView({
  videoRef,
  logoRef,
  glCanvasRef,
  stream,
  place,
  assets,
  product,
  cardOpen,
  discovered,
  captureError,
  onToggleCard,
  onCapture,
  on3dStatus,
  onClose,
}) {
  // Branche le flux sur le <video> au montage, nettoie au démontage.
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
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      {/* Couche 3D procédurale (three.js, lazy) par-dessus la caméra. Si WebGL
          absent / échec : ne rend rien d'actif, le reste du template fonctionne. */}
      <ObjectARScene color={product.color} canvasRef={glCanvasRef} onStatusChange={on3dStatus} />

      {/* Logo chargé en CORS (caché) : sert à l'inclure dans l'image capturée. */}
      {assets?.logo && (
        <img ref={logoRef} src={assets.logo} alt="" crossOrigin="anonymous" className="hidden" />
      )}

      {/* Voiles dégradés haut/bas : lisibilité des contrôles par-dessus la vidéo. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Surface tactile : un tap ouvre/ferme la fiche (feedback pulse à l'appui). */}
      <button
        type="button"
        onClick={onToggleCard}
        aria-label={cardOpen ? 'Fermer la fiche produit' : 'Découvrir l’objet'}
        className="absolute inset-0 z-10 outline-none transition active:bg-white/5"
      >
        {!cardOpen && <TapIndicator />}
        <ProductOverlay open={cardOpen} product={product} />
      </button>

      {/* Barre du haut (au-dessus de la surface tactile) : retour, lieu/logo, découverte. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <IconButton label="Fermer la caméra" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <PlaceBadge place={place} assets={assets} />
        {discovered ? <DiscoveredBadge /> : <span className="h-11 w-11" aria-hidden="true" />}
      </div>

      {/* Bas : erreur éventuelle + obturateur de capture. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        {captureError && (
          <p className="rounded-xl bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            Capture impossible : un asset protégé bloque l'export (CORS).
          </p>
        )}
        <ShutterButton onClick={onCapture} accent={product.color} />
      </div>
    </div>
  )
}

/** Indicateur invitant au tap (visible tant que la fiche est fermée). */
function TapIndicator() {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-44 flex flex-col items-center gap-3">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/60 backdrop-blur motion-safe:animate-pulse">
        <Hand className="h-7 w-7 text-white" />
      </span>
      <span className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
        Tapez pour découvrir
      </span>
    </span>
  )
}

/** Fiche produit en overlay animé (scale + fade) par-dessus la caméra. */
function ProductOverlay({ open, product }) {
  return (
    <span
      className={`pointer-events-none absolute inset-0 flex items-center justify-center p-6 transition-all duration-300 ${
        open ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}
    >
      <span className="w-full max-w-sm">
        <ProductCardBody product={product} />
      </span>
    </span>
  )
}

/** Contenu de la fiche produit (réutilisé : overlay caméra + fallback sans caméra). */
function ProductCardBody({ product }) {
  const { title, description, price, color } = product
  return (
    <span className="block overflow-hidden rounded-3xl bg-white/95 text-left shadow-2xl ring-1 ring-black/5 backdrop-blur">
      {/* Liseré d'accent (config.color). */}
      <span className="block h-1.5 w-full" style={{ backgroundColor: color }} />
      <span className="block space-y-2 p-5">
        <span className="flex items-start justify-between gap-3">
          <span className="text-xl font-bold leading-tight text-slate-900">{title}</span>
          {price && (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {price}
            </span>
          )}
        </span>
        {description && (
          <span className="block text-sm leading-relaxed text-slate-600">{description}</span>
        )}
      </span>
    </span>
  )
}

/** Badge discret « Découvert » (objet déjà consulté au moins une fois). */
function DiscoveredBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow backdrop-blur">
      <Check className="h-3.5 w-3.5" /> Découvert
    </span>
  )
}

/** Badge d'identité du lieu : logo (ou icône par défaut si absent/non chargé) + nom. */
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
        <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
      )}
      <span className="truncate">{place?.name ?? 'Lieu'}</span>
    </span>
  )
}

/** Obturateur central : anneau à la couleur d'accent + pastille animée à l'appui. */
function ShutterButton({ onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Capturer la vue"
      style={{ borderColor: accent }}
      className="group flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-[5px] p-1.5 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="h-full w-full rounded-full bg-white shadow-inner transition-transform duration-150 group-active:scale-75" />
    </button>
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

/** Invite d'autorisation caméra + fallbacks (refus / indisponible / sans caméra). */
function PermissionPrompt({ status, onAllow, onContinueWithout }) {
  const hint = STATUS_HINT[status]

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <ScanLine className="h-10 w-10 text-emerald-500" />
      <p className="text-sm text-slate-500">
        Pointe la caméra vers l'objet pour découvrir sa présentation.
      </p>

      {hint && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>}

      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={onAllow}
          className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Autoriser la caméra
        </button>
        <button
          type="button"
          onClick={onContinueWithout}
          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Continuer sans caméra
        </button>
      </div>

      <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        La caméra sert uniquement à l'affichage : aucune image n'est enregistrée sans ton accord.
      </p>
    </div>
  )
}
