import { useEffect, useRef, useState } from 'react'
import { Box, Camera, CameraOff, Loader2, MapPin, Move3d, RotateCcw, ShieldCheck } from 'lucide-react'

import { CameraStatus, FacingMode, useCamera } from '../hooks/useCamera.js'
import { useCanvas } from '../hooks/useCanvas.js'
import { trackCapture } from '../lib/api.js'
import SouvenirScreen from '../components/SouvenirScreen.jsx'

/** Dérive nom / description / prix du config_json, avec des replis sûrs. */
function readProduct(place, config) {
  return {
    title: config?.title?.trim() || place?.name || 'Objet',
    description: config?.description?.trim() || config?.message?.trim() || '',
    price: config?.price?.trim() || '',
  }
}

/**
 * Template object_ar (modèle 3D en AR) — après le scan, on demande la caméra
 * ARRIÈRE, puis le vrai modèle .glb de l'objet/plat s'affiche PAR-DESSUS la
 * caméra (réalité augmentée, à la AR Code) : le visiteur le fait tourner, voit
 * son nom + sa description, et capture un souvenir de l'objet dans son décor.
 *
 * Utilisé quand l'expérience fournit `assets.model` (sinon ObjectInteractiveTemplate).
 * three.js + le viewer sont chargés en LAZY (import dynamique de lib/objectScene).
 */
export default function ObjectModelViewer({ experienceId, place, assets, config }) {
  const { stream, status, start } = useCamera()
  const { capture } = useCanvas()
  const videoRef = useRef(null)
  const glCanvasRef = useRef(null)
  const [modelPhase, setModelPhase] = useState('loading') // 'loading' | 'ready' | 'error'
  const [souvenir, setSouvenir] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const product = readProduct(place, config)

  const cameraActive = status === CameraStatus.ACTIVE

  // Branche le flux caméra sur le <video> quand il est actif.
  useEffect(() => {
    const video = videoRef.current
    if (video && stream) video.srcObject = stream
    return () => {
      if (video) video.srcObject = null
    }
  }, [stream, cameraActive])

  // Monte le viewer 3D (transparent, par-dessus la caméra) une fois la caméra active.
  useEffect(() => {
    if (!cameraActive) return undefined
    let active = true
    let viewer = null
    import('../lib/objectScene.js')
      .then(({ createModelViewer }) => {
        if (!active || !glCanvasRef.current) return
        try {
          viewer = createModelViewer(glCanvasRef.current, {
            modelUrl: assets.model,
            onLoaded: () => active && setModelPhase('ready'),
            onError: () => active && setModelPhase('error'),
          })
        } catch {
          if (active) setModelPhase('error')
        }
      })
      .catch(() => active && setModelPhase('error'))
    return () => {
      active = false
      viewer?.dispose()
    }
  }, [cameraActive, assets.model])

  const handleCapture = () => {
    const image = capture(videoRef.current, {
      overlayCanvas: glCanvasRef.current, // la couche 3D (le modèle) par-dessus la vidéo
      message: product.title,
      mirror: false, // caméra arrière : pas de miroir
    })
    if (image) {
      setSouvenir(image)
      trackCapture(experienceId) // souvenir capturé : compté pour les stats partenaire
    } else {
      setCaptureError(true)
    }
  }

  // Souvenir capturé : écran de partage / téléchargement réutilisé.
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

  // Caméra non encore active : demande d'autorisation (ou repli si refus).
  if (!cameraActive) {
    return (
      <PermissionScreen
        status={status}
        product={product}
        place={place}
        onAllow={() => start(FacingMode.BACK)}
      />
    )
  }

  // Caméra active : objet 3D en AR.
  return (
    <main className="fixed inset-0 z-50 overflow-hidden overscroll-contain bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      {/* Couche 3D transparente (OrbitControls : glisser = tourner, pince = zoom). */}
      <canvas ref={glCanvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* Voiles dégradés pour la lisibilité des contrôles. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

      {/* En-tête : lieu. */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <MapPin className="h-3.5 w-3.5" />
          {place?.name}
          {place?.city ? ` · ${place.city}` : ''}
        </span>
      </header>

      {/* Chargement du modèle par-dessus la caméra. */}
      {modelPhase === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium backdrop-blur">
            Chargement de l'objet 3D…
          </p>
        </div>
      )}

      {/* Indice d'interaction (quand le modèle est prêt). */}
      {modelPhase === 'ready' && (
        <p className="pointer-events-none absolute left-1/2 top-[18%] z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
          <Move3d className="h-3.5 w-3.5" />
          Glisse pour tourner l'objet
        </p>
      )}

      {/* Bas : panneau nom/description + capture. */}
      <div className="absolute inset-x-0 bottom-0 z-20 space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {captureError && (
          <p className="mx-auto max-w-md rounded-xl bg-red-500/90 px-4 py-2 text-center text-sm font-medium text-white">
            Capture impossible sur cet appareil.
          </p>
        )}
        {modelPhase === 'error' && (
          <p className="mx-auto max-w-md rounded-xl bg-amber-500/90 px-4 py-2 text-center text-sm font-medium text-white">
            L'objet 3D n'a pas pu se charger — vérifie ta connexion.
          </p>
        )}

        <div className="mx-auto max-w-md rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">{product.title}</h1>
              {place?.name && <p className="truncate text-xs text-slate-400">{place.name}</p>}
            </div>
            {product.price && (
              <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                {product.price}
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-2 max-h-20 overflow-y-auto text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}

          <button
            type="button"
            onClick={handleCapture}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Camera className="h-5 w-5" />
            Capturer un souvenir
          </button>
        </div>
      </div>
    </main>
  )
}

/** Écran d'autorisation caméra (avant l'AR) + repli si refus/indisponible. */
function PermissionScreen({ status, product, place, onAllow }) {
  const denied = status === CameraStatus.DENIED || status === CameraStatus.UNAVAILABLE
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-white to-slate-100 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {denied ? <CameraOff className="h-7 w-7" /> : <Box className="h-7 w-7" />}
        </span>
        <h1 className="text-xl font-bold text-slate-900">{product.title}</h1>
        {place?.name && <p className="mt-0.5 text-sm text-slate-500">{place.name}</p>}

        {denied ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Accès caméra refusé ou indisponible (HTTPS requis sur mobile). Réautorise la caméra
            dans ton navigateur pour voir l'objet en réalité augmentée.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Active la caméra arrière pour voir l'objet en 3D dans ton décor, le tourner et
            capturer un souvenir.
          </p>
        )}

        <button
          type="button"
          onClick={onAllow}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {denied ? <RotateCcw className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          {denied ? 'Réessayer' : 'Activer la caméra'}
        </button>
      </div>
    </main>
  )
}
