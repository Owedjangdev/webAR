import { useCallback, useRef } from 'react'

import { toPngDataUrl } from '../lib/canvas.js'

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
 * Dessine le personnage 2D (template guide_narratif) ancré en BAS et centré,
 * en conservant ses proportions — reproduit sa position à l'écran pour que le
 * souvenir capturé corresponde à ce que voit le visiteur.
 */
function drawCharacter(ctx, canvas, character) {
  const targetH = Math.round(canvas.height * 0.62)
  const ratio = targetH / character.naturalHeight
  const w = character.naturalWidth * ratio
  const x = Math.round((canvas.width - w) / 2)
  const y = canvas.height - targetH
  ctx.drawImage(character, x, y, w, targetH)
}

/** Rectangle à coins arrondis (via arcTo : compatible Chrome >= 80, pas de roundRect). */
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Dessine le portail (template portal_ar) : une « porte » arrondie au centre,
 * à travers laquelle on voit la scène de destination (image), entourée d'un
 * anneau lumineux. Reproduit l'effet affiché à l'écran dans le souvenir capturé.
 * `scene` peut être null -> seul l'anneau (portail voilé) est dessiné.
 */
function drawPortal(ctx, canvas, scene) {
  const pw = canvas.width * 0.64
  const ph = canvas.height * 0.62
  const x = (canvas.width - pw) / 2
  const y = canvas.height * 0.12
  const r = pw * 0.16

  // Scène de destination, découpée dans la forme du portail (cover).
  if (scene?.complete && scene.naturalWidth > 0) {
    ctx.save()
    roundRect(ctx, x, y, pw, ph, r)
    ctx.clip()
    const ratio = Math.max(pw / scene.naturalWidth, ph / scene.naturalHeight)
    const sw = scene.naturalWidth * ratio
    const sh = scene.naturalHeight * ratio
    ctx.drawImage(scene, x + (pw - sw) / 2, y + (ph - sh) / 2, sw, sh)
    ctx.restore()
  }

  // Anneau lumineux du portail (indigo brand + halo).
  ctx.save()
  roundRect(ctx, x, y, pw, ph, r)
  ctx.lineWidth = Math.max(4, canvas.width * 0.012)
  ctx.strokeStyle = '#a5b4fc'
  ctx.shadowColor = '#6366f1'
  ctx.shadowBlur = canvas.width * 0.05
  ctx.stroke()
  ctx.restore()
}

/** Découpe un texte en lignes tenant dans maxWidth (retour à la ligne par mots). */
function wrapLines(ctx, text, maxWidth, maxLines) {
  const lines = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word
    // On garde au moins un mot par ligne, même s'il dépasse (rare).
    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  // Limite le nombre de lignes : la dernière est tronquée avec une ellipse.
  if (lines.length > maxLines) {
    lines.length = maxLines
    let last = lines[maxLines - 1]
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1).trimEnd()
    }
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

/**
 * Dessine la légende (message souvenir) lisible EN BAS, centrée et retournée à la
 * ligne dans un bandeau arrondi — ne déborde jamais de la largeur de l'image.
 */
function drawCaption(ctx, canvas, text) {
  const margin = Math.round(canvas.width * 0.05)
  const fontSize = Math.round(canvas.width * 0.045)
  const lineHeight = Math.round(fontSize * 1.3)
  const padX = Math.round(fontSize * 0.8)
  const padY = Math.round(fontSize * 0.55)
  const maxTextWidth = canvas.width - margin * 2 - padX * 2

  ctx.font = `600 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = wrapLines(ctx, text.trim(), maxTextWidth, 3)
  if (lines.length === 0) return

  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width))
  const boxWidth = Math.min(canvas.width - margin * 2, widest + padX * 2)
  const boxHeight = lines.length * lineHeight + padY * 2
  const centerX = canvas.width / 2
  const boxTop = canvas.height - margin - boxHeight
  const boxLeft = centerX - boxWidth / 2

  // Bandeau arrondi sombre (lisibilité par-dessus la vidéo / l'overlay).
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  roundRect(ctx, boxLeft, boxTop, boxWidth, boxHeight, Math.round(boxHeight * 0.3))
  ctx.fill()

  // Lignes centrées, du haut du bandeau vers le bas.
  ctx.fillStyle = '#ffffff'
  const firstLineY = boxTop + padY + lineHeight / 2
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, firstLineY + index * lineHeight)
  })
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

  const capture = useCallback((video, { overlay, overlayCanvas, character, portal, logo, message, mirror = false } = {}) => {
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

    // Couche 3D (canvas WebGL, ex. template object_ar) : dessinée telle quelle,
    // sans miroir, par-dessus la vidéo. Ignorée si absente (autres templates).
    if (overlayCanvas?.width > 0 && overlayCanvas?.height > 0) {
      ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)
    }

    // Personnage 2D (template guide_narratif), ancré en bas comme à l'écran.
    if (character?.complete && character.naturalWidth > 0) {
      drawCharacter(ctx, canvas, character)
    }

    // Portail (template portal_ar) : porte arrondie + scène + anneau lumineux.
    // `portal === true` -> portail voilé (scène absente, anneau seul).
    if (portal) {
      drawPortal(ctx, canvas, portal === true ? null : portal)
    }

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

    // Export PNG (null si le canvas a été tainté par un asset cross-origin
    // sans CORS — garde factorisée dans lib/canvas).
    return toPngDataUrl(canvas)
  }, [])

  return { capture }
}
