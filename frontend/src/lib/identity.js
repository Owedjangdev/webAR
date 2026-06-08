// Helpers d'identité du backoffice : dérivent un nom affichable, des initiales
// et l'URL d'avatar Gravatar à partir de l'email du compte connecté.
//
// Rappel : on ne peut PAS récupérer la photo Google d'un Gmail sans OAuth.
// Gravatar est le standard « photo associée à un email » : il renvoie la photo
// si l'email en a une, sinon un 404 (cf. d=404) → on retombe sur les initiales.

/** Découpe la partie locale de l'email en mots (séparateurs . _ -). */
function localParts(email) {
  return email.split('@')[0].split(/[._-]+/).filter(Boolean)
}

/** Nom affichable dérivé de l'email (ex. "epiphane.houehanou" → "Epiphane Houehanou"). */
export function displayNameFromEmail(email) {
  if (!email) return 'Administrateur'
  return localParts(email)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

/** Initiales (1 à 2 lettres) dérivées de l'email, pour l'avatar de repli. */
export function initialsFromEmail(email) {
  if (!email) return '?'
  const parts = localParts(email)
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)
  return letters.toUpperCase()
}

/** Hex SHA-256 d'une chaîne (Web Crypto, async). */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * URL Gravatar de l'email. `d=404` : si aucun avatar n'existe, l'image renvoie
 * 404 → le composant Avatar retombe sur les initiales (onError).
 * @param {string} email
 * @param {number} [size=80] - taille en px (80 = net en rétina pour un 40px).
 * @returns {Promise<string>}
 */
export async function gravatarUrl(email, size = 80) {
  const hash = await sha256Hex(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}
