import { useCallback, useRef } from 'react'

// Borne la résolution de l'image exportée : l'encodage toDataURL coûte avec le
// nombre de pixels. Plafonner le grand côté garde la capture rapide (<= 2 s,
// CLAUDE.md section 12) tout en restant net pour un souvenir.
const MAX_CAPTURE_DIMENSION = 1280

/**
 * Dessine le logo du lieu en badge circulaire, en haut à gauche de l'image.
 */
function drawLogo(ctx, canvas, logo) {
  const size = Math.round(canvas.width * 0.13)
  const margin = Math.round(canvas.width * 0.04)
  const cx = margin + size / 2
  const cy = margin + size / 2

  ctx.save()
  // Pastille blanche de fond (lisibilité par-dessus la vidéo).
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fill()
  // Clip circulaire puis logo en "cover".
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2)
  ctx.clip()
  const ratio = Math.max(size / logo.naturalWidth, size / logo.naturalHeight)
  const w = logo.naturalWidth * ratio
  const h = logo.naturalHeight * ratio
  ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h)
  ctx.restore()
}

/**
 * Dessine une légende (message souvenir) lisible en bas de l'image capturée.
 */
function drawCaption(ctx, canvas, text) {
  const padding = Math.round(canvas.width * 0.04)
  const fontSize = Math.round(canvas.width * 0.05)

  ctx.font = `600 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const textWidth = ctx.measureText(text).width
  const boxWidth = Math.min(canvas.width - padding, textWidth + padding * 2)
  const boxHeight = fontSize + padding
  const centerX = canvas.width / 2
  const bottomY = canvas.height - padding

  // Bandeau sombre semi-transparent pour la lisibilité par-dessus la vidéo.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(centerX - boxWidth / 2, bottomY - boxHeight, boxWidth, boxHeight)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, centerX, bottomY - padding / 2)
}

/**
 * Hook de capture : compose la frame vidéo (+ overlay décoratif + message) sur
 * un canvas hors écran et renvoie une image PNG (dataURL).
 *
 * Le canvas n'est créé/utilisé qu'à la capture : l'aperçu live reste du DOM,
 * ce qui est plus léger sur Android entry-level (CLAUDE.md section 12).
 */
export function useCanvas() {
  const canvasRef = useRef(null)

  const capture = useCallback((video, { overlay, logo, message, mirror = false } = {}) => {
    if (!video?.videoWidth) {
      return null
    }

    // Downscale si la vidéo dépasse la borne (les drawImage suivants s'adaptent
    // automatiquement aux dimensions du canvas).
    const scale = Math.min(1, MAX_CAPTURE_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
    const canvas = canvasRef.current ?? (canvasRef.current = document.createElement('canvas'))
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')

    // Caméra frontale : on capture en miroir, comme l'aperçu (selfie naturel).
    ctx.save()
    if (mirror) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Overlay décoratif (seulement s'il est bien chargé).
    if (overlay?.complete && overlay.naturalWidth > 0) {
      ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
    }

    // Logo du lieu (badge), seulement s'il est bien chargé.
    if (logo?.complete && logo.naturalWidth > 0) {
      drawLogo(ctx, canvas, logo)
    }

    if (message) {
      drawCaption(ctx, canvas, message)
    }

    try {
      return canvas.toDataURL('image/png')
    } catch {
      // toDataURL échoue si un asset cross-origin sans en-tête CORS a "tainté"
      // le canvas. On renvoie null : l'appelant affiche un fallback clair.
      return null
    }
  }, [])

  return { capture }
}
