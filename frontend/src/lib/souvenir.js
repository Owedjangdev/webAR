// Helpers de partage / téléchargement du souvenir capturé.
// Web Share API quand elle est disponible (partage natif vers WhatsApp & co.),
// sinon repli sur le téléchargement. Logique factorisée ici (pas de duplication
// entre les boutons Partager / Télécharger — CLAUDE.md section 18).

/** Convertit un dataURL en File (nécessaire pour partager un fichier image). */
async function dataUrlToFile(dataUrl, filename) {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

/** Déclenche le téléchargement de l'image souvenir sur l'appareil. */
export function downloadSouvenir(dataUrl, filename = 'souvenir.png') {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

/**
 * Partage l'image souvenir via la Web Share API (avec fichier si possible,
 * cible WhatsApp / apps natives). Repli sur le téléchargement si l'API n'est
 * pas disponible ou ne peut pas partager de fichier.
 *
 * @returns {Promise<'shared' | 'cancelled' | 'downloaded'>} résultat, pour que
 *   l'appelant affiche le bon message de confirmation.
 */
export async function shareSouvenir(dataUrl, { title, text, filename = 'souvenir.png' } = {}) {
  if (navigator.canShare) {
    let file = null
    try {
      file = await dataUrlToFile(dataUrl, filename)
    } catch {
      file = null
    }
    if (file && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text })
        return 'shared'
      } catch (error) {
        // L'utilisateur a fermé la feuille de partage : on s'arrête là.
        if (error?.name === 'AbortError') {
          return 'cancelled'
        }
        // Autre erreur : on bascule sur le repli ci-dessous.
      }
    }
  }

  // Repli (Web Share API absente ou partage de fichier impossible).
  downloadSouvenir(dataUrl, filename)
  return 'downloaded'
}
