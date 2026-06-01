import { useCallback, useRef } from 'react'

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

  const capture = useCallback((video, { overlay, message, mirror = false } = {}) => {
    if (!video?.videoWidth) {
      return null
    }

    const canvas = canvasRef.current ?? (canvasRef.current = document.createElement('canvas'))
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
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
