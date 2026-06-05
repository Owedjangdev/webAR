// Helpers canvas partagés entre les captures (selfie, badge…) — DRY (§18).

/**
 * Exporte un canvas en PNG (dataURL). Renvoie `null` si le canvas est « tainté »
 * par un asset cross-origin sans en-tête CORS : `toDataURL` lève alors une
 * erreur de sécurité. L'appelant affiche un fallback clair plutôt que de planter.
 */
export function toPngDataUrl(canvas) {
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
