import { useEffect, useRef, useState } from 'react'
import { Box, Camera, Info, Loader2, MapPin, Move3d } from 'lucide-react'

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
 * Template object_ar (modèle 3D) — le visiteur fait TOURNER un vrai modèle .glb
 * de l'objet/plat, avec son nom et sa description. Utilisé quand l'expérience
 * fournit `assets.model` ; sinon c'est ObjectInteractiveTemplate (caméra) qui rend.
 *
 * three.js + le viewer sont chargés en LAZY (import dynamique de lib/objectScene)
 * → aucun poids sur le bundle des autres templates.
 */
export default function ObjectModelViewer({ experienceId, place, assets, config }) {
  const canvasRef = useRef(null)
  const viewerRef = useRef(null)
  const [phase, setPhase] = useState('loading') // 'loading' | 'ready' | 'error'
  const [souvenir, setSouvenir] = useState(null)
  const [captureError, setCaptureError] = useState(false)
  const product = readProduct(place, config)

  useEffect(() => {
    let active = true
    let viewer = null
    import('../lib/objectScene.js')
      .then(({ createModelViewer }) => {
        if (!active || !canvasRef.current) return
        try {
          viewer = createModelViewer(canvasRef.current, {
            modelUrl: assets.model,
            onLoaded: () => active && setPhase('ready'),
            onError: () => active && setPhase('error'),
          })
          viewerRef.current = viewer
        } catch {
          if (active) setPhase('error') // WebGL absent / contexte refusé
        }
      })
      .catch(() => active && setPhase('error'))

    return () => {
      active = false
      viewer?.dispose()
      viewerRef.current = null
    }
  }, [assets.model])

  const handleCapture = () => {
    const image = viewerRef.current?.capturePng() ?? null
    if (image) {
      setSouvenir(image)
      trackCapture(experienceId) // souvenir capturé : compté pour les stats partenaire
    } else {
      setCaptureError(true)
    }
  }

  // Souvenir capturé : on réutilise l'écran de partage/téléchargement.
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

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-slate-900">
      {/* Canvas 3D plein écran (OrbitControls : glisser = tourner, pincer = zoom). */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* En-tête : lieu. */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <MapPin className="h-3.5 w-3.5" />
          {place?.name}
          {place?.city ? ` · ${place.city}` : ''}
        </span>
      </header>

      {/* Chargement. */}
      {phase === 'loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900/70 text-slate-200">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm font-medium">Chargement du modèle 3D…</p>
        </div>
      )}

      {/* Erreur / 3D indisponible : repli sur les infos produit. */}
      {phase === 'error' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-6 text-center shadow-xl backdrop-blur">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Box className="h-6 w-6" />
            </span>
            <h1 className="text-lg font-bold text-slate-800">{product.title}</h1>
            {product.price && <p className="mt-0.5 font-semibold text-emerald-600">{product.price}</p>}
            {product.description && (
              <p className="mt-2 text-sm text-slate-500">{product.description}</p>
            )}
            <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-400">
              L'aperçu 3D n'est pas disponible sur cet appareil.
            </p>
          </div>
        </div>
      )}

      {/* Vue prête : indice + panneau nom/description + capture. */}
      {phase === 'ready' && (
        <>
          {/* Indice d'interaction. */}
          <p className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 translate-y-[5.5rem] flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
            <Move3d className="h-3.5 w-3.5" />
            Glisse pour tourner · pince pour zoomer
          </p>

          <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {captureError && (
              <p className="mx-auto max-w-md rounded-xl bg-red-500/90 px-4 py-2 text-center text-sm font-medium text-white">
                Capture impossible sur cet appareil.
              </p>
            )}

            {/* Panneau nom + description (toujours visible pour « vivre » l'objet). */}
            <div className="mx-auto max-w-md rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-slate-800">{product.title}</h1>
                  {place?.name && (
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Info className="h-3 w-3" /> {place.name}
                    </p>
                  )}
                </div>
                {product.price && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                    {product.price}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="mt-2 max-h-24 overflow-y-auto text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              {/* Capture du souvenir (la vue 3D courante). */}
              <button
                type="button"
                onClick={handleCapture}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Camera className="h-5 w-5" />
                Capturer un souvenir
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
