import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'

// Résolution carrée exportée (bornée pour tenir la capture <= 2s, CLAUDE.md section 12).
const OUTPUT_SIZE = 1080
const MIN_ZOOM = 1
const MAX_ZOOM = 4
// Part du plus petit côté de la scène occupée par la fenêtre de cadrage.
const FRAME_RATIO = 0.82

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// Borne la position de l'image pour que la fenêtre de cadrage reste toujours
// entièrement couverte (l'image se déplace, le cadre est fixe).
function clampOffset(off, dispW, dispH, frameLeft, frameTop, frame) {
  return {
    x: Math.min(frameLeft, Math.max(frameLeft + frame - dispW, off.x)),
    y: Math.min(frameTop, Math.max(frameTop + frame - dispH, off.y)),
  }
}

/**
 * Éditeur d'ajustement du souvenir, façon « photo de profil ».
 * L'image remplit l'écran (assombrie autour) ; on la fait glisser à un doigt et
 * on zoome en écartant deux doigts (pinch) — molette en secours sur ordinateur.
 * 0 dépendance, compatible Chrome >= 80.
 */
export default function CropEditor({ image, onRetake }) {
  const stageRef = useRef(null)
  const imgRef = useRef(null)
  const pointersRef = useRef(new Map()) // pointerId -> position client
  const gestureRef = useRef(null) // geste en cours (pan / pinch)
  const centeredRef = useRef(false)

  const [natural, setNatural] = useState(null) // dimensions naturelles { w, h }
  const [stage, setStage] = useState({ w: 0, h: 0 }) // taille de la scène en px
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // coin haut-gauche de l'image

  // Miroirs en ref : lus dans les gestes sans dépendre des closures d'état.
  const zoomRef = useRef(zoom)
  const offsetRef = useRef(offset)
  zoomRef.current = zoom
  offsetRef.current = offset

  // Charge l'image source pour connaître ses dimensions naturelles.
  useEffect(() => {
    centeredRef.current = false
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = image
  }, [image])

  // Mesure la scène (au montage et au redimensionnement).
  useEffect(() => {
    const measure = () => {
      if (stageRef.current) {
        setStage({ w: stageRef.current.clientWidth, h: stageRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Fenêtre de cadrage : carré centré dans la scène.
  const frame = stage.w && stage.h ? Math.round(Math.min(stage.w, stage.h) * FRAME_RATIO) : 0
  const frameLeft = (stage.w - frame) / 2
  const frameTop = (stage.h - frame) / 2

  // Géométrie : baseScale fait couvrir la fenêtre (object-cover) au zoom 1.
  const baseScale = natural && frame ? Math.max(frame / natural.w, frame / natural.h) : 1
  const scale = baseScale * zoom
  const dispW = natural ? natural.w * scale : 0
  const dispH = natural ? natural.h * scale : 0

  // Centre l'image une fois prête, puis re-borne à chaque changement d'échelle.
  useEffect(() => {
    if (!natural || !frame) return
    if (!centeredRef.current) {
      centeredRef.current = true
      setOffset({ x: frameLeft + (frame - dispW) / 2, y: frameTop + (frame - dispH) / 2 })
    } else {
      setOffset((current) => clampOffset(current, dispW, dispH, frameLeft, frameTop, frame))
    }
  }, [natural, frame, dispW, dispH, frameLeft, frameTop])

  // Convertit des coordonnées client en coordonnées locales à la scène.
  const toLocal = (clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  // Applique un zoom autour d'un point focal (le contenu sous les doigts reste stable).
  const applyZoom = (focal, targetZoom, startZoom, startOffset) => {
    if (!natural) return
    const z = clampZoom(targetZoom)
    const ratio = z / startZoom
    const off = {
      x: focal.x - (focal.x - startOffset.x) * ratio,
      y: focal.y - (focal.y - startOffset.y) * ratio,
    }
    const dW = natural.w * baseScale * z
    const dH = natural.h * baseScale * z
    setZoom(z)
    setOffset(clampOffset(off, dW, dH, frameLeft, frameTop, frame))
  }

  // (Re)démarre le geste selon le nombre de doigts posés.
  const startGesture = () => {
    const points = [...pointersRef.current.values()]
    if (points.length === 1) {
      gestureRef.current = {
        mode: 'pan',
        startX: points[0].x,
        startY: points[0].y,
        baseOffset: offsetRef.current,
      }
    } else if (points.length >= 2) {
      gestureRef.current = {
        mode: 'pinch',
        startDist: distance(points[0], points[1]),
        startZoom: zoomRef.current,
        startOffset: offsetRef.current,
        focal: toLocal(
          (points[0].x + points[1].x) / 2,
          (points[0].y + points[1].y) / 2,
        ),
      }
    }
  }

  const onPointerDown = (event) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture?.(event.pointerId)
    startGesture()
  }

  const onPointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const gesture = gestureRef.current
    if (!gesture) return

    if (gesture.mode === 'pan') {
      const next = {
        x: gesture.baseOffset.x + (event.clientX - gesture.startX),
        y: gesture.baseOffset.y + (event.clientY - gesture.startY),
      }
      setOffset(clampOffset(next, dispW, dispH, frameLeft, frameTop, frame))
    } else if (gesture.mode === 'pinch') {
      const points = [...pointersRef.current.values()]
      if (points.length < 2) return
      const dist = distance(points[0], points[1])
      applyZoom(
        gesture.focal,
        gesture.startZoom * (dist / gesture.startDist),
        gesture.startZoom,
        gesture.startOffset,
      )
    }
  }

  const onPointerUp = (event) => {
    pointersRef.current.delete(event.pointerId)
    // Ne libère la capture que si cet élément la détient (évite NotFoundError
    // sur pointercancel / pointerleave où le pointeur n'a pas/plus la capture).
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (pointersRef.current.size >= 1) {
      startGesture() // ex. on relâche un doigt après un pinch -> on repasse en pan
    } else {
      gestureRef.current = null
    }
  }

  // Zoom à la molette (confort de test sur ordinateur ; le mobile utilise le pinch).
  const onWheel = (event) => {
    if (!natural || !frame) return
    const focal = toLocal(event.clientX, event.clientY)
    const ratio = event.deltaY < 0 ? 1.08 : 1 / 1.08
    applyZoom(focal, zoomRef.current * ratio, zoomRef.current, offsetRef.current)
  }

  // Exporte la zone cadrée en PNG carré et déclenche le téléchargement.
  const handleDownload = () => {
    const img = imgRef.current
    if (!img || !frame) return
    const srcSize = frame / scale
    const srcX = (frameLeft - offset.x) / scale
    const srcY = (frameTop - offset.y) / scale

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'souvenir.png'
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Scène : image plein écran, glisser à un doigt + pinch à deux doigts. */}
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        className="relative min-h-0 flex-1 cursor-move touch-none select-none overflow-hidden"
      >
        <img
          src={image}
          alt="Souvenir à ajuster"
          draggable={false}
          style={{
            width: dispW || undefined,
            height: dispH || undefined,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
          className="pointer-events-none absolute left-0 top-0 max-w-none"
        />

        {/* Fenêtre de cadrage : extérieur assombri (astuce box-shadow). */}
        {frame > 0 && (
          <div
            className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80"
            style={{
              left: frameLeft,
              top: frameTop,
              width: frame,
              height: frame,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            }}
          />
        )}

        <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm text-white/80">
          Glisse pour déplacer · écarte deux doigts pour zoomer
        </p>
      </div>

      {/* Actions : télécharger le cadrage / reprendre la photo. */}
      <div className="flex items-center justify-center gap-3 px-6 pt-4">
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 font-semibold text-white shadow-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white"
        >
          <Download className="h-5 w-5" />
          Télécharger
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        >
          <RotateCcw className="h-5 w-5" />
          Reprendre
        </button>
      </div>
    </div>
  )
}
