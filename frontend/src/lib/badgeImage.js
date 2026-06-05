// Génère l'image partageable de la carte du badge (rendu sur un canvas hors
// écran → PNG dataURL). On réutilise ensuite shareSouvenir / downloadSouvenir
// (lib/souvenir.js) comme pour le selfie : aucune duplication de la logique de
// partage/téléchargement (CLAUDE.md §18).

import { toPngDataUrl } from './canvas.js'

const W = 800
const H = 1000

/** Tracé d'un rectangle à coins arrondis (ctx.roundRect absent sur Chrome < 99). */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Étoile à 5 branches (visuel par défaut quand aucun asset badge n'est fourni). */
function drawStar(ctx, cx, cy, outer, inner, color) {
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

/** Réduit la police jusqu'à ce que le texte tienne dans maxWidth. */
function fitFont(ctx, text, maxWidth, basePx, weight) {
  let px = basePx
  ctx.font = `${weight} ${px}px sans-serif`
  while (px > 20 && ctx.measureText(text).width > maxWidth) {
    px -= 4
    ctx.font = `${weight} ${px}px sans-serif`
  }
  return px
}

/**
 * Dessine la carte du badge et renvoie un PNG (dataURL), ou null si l'export
 * échoue (asset badge cross-origin sans CORS — canvas tainté).
 *
 * @param {object} opts
 * @param {HTMLImageElement|null} [opts.badgeImg] - image du badge déjà chargée (CORS), sinon étoile.
 * @param {string} opts.placeName
 * @param {string} [opts.city]
 * @param {number} opts.points
 * @param {string} [opts.title]
 */
export function renderBadgeCard({ badgeImg, placeName, city, points, title = 'Badge débloqué' }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fond dégradé doré.
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#fbbf24') // amber-400
  bg.addColorStop(1, '#d97706') // amber-600
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  // En-tête de marque.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = '600 26px sans-serif'
  ctx.fillText('LANDMARK DISCOVERY', W / 2, 92)

  // Médaillon : disque blanc + image du badge (cover) ou étoile par défaut.
  const cx = W / 2
  const cy = 360
  const radius = 150
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  if (badgeImg?.complete && badgeImg.naturalWidth > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius - 12, 0, Math.PI * 2)
    ctx.clip()
    const ratio = Math.max((radius * 2) / badgeImg.naturalWidth, (radius * 2) / badgeImg.naturalHeight)
    const w = badgeImg.naturalWidth * ratio
    const h = badgeImg.naturalHeight * ratio
    ctx.drawImage(badgeImg, cx - w / 2, cy - h / 2, w, h)
    ctx.restore()
  } else {
    drawStar(ctx, cx, cy, 92, 38, '#f59e0b') // amber-500
  }

  // Titre.
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 56px sans-serif'
  ctx.fillText(title, cx, 600)

  // Lieu (police ajustée si trop long) + ville.
  const namePx = fitFont(ctx, placeName, W - 120, 44, '700')
  ctx.font = `700 ${namePx}px sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(placeName, cx, 668)

  if (city) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = '500 30px sans-serif'
    ctx.fillText(city, cx, 712)
  }

  // Pastille des points.
  const label = `+${points} points de découverte`
  ctx.font = '700 32px sans-serif'
  const pillW = ctx.measureText(label).width + 80
  const pillH = 72
  const pillY = 800
  roundRectPath(ctx, (W - pillW) / 2, pillY, pillW, pillH, pillH / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = '#b45309' // amber-700
  ctx.fillText(label, cx, pillY + pillH / 2 + 11)

  return toPngDataUrl(canvas)
}
