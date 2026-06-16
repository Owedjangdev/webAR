// Client API du backend WebAR.
// L'URL de base est surchargeable via VITE_API_BASE_URL (déploiement),
// sinon on vise le backend FastAPI local sur le port 8000.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * Récupère le contrat JSON complet d'une expérience (cf. CLAUDE.md section 6).
 * @param {string} experienceId - identifiant public, ex. "exp_001".
 * @returns {Promise<object>} le JSON de l'expérience.
 * @throws {Error} si l'expérience est introuvable ou l'API injoignable.
 */
export async function fetchExperience(experienceId) {
  const response = await fetch(`${API_BASE_URL}/api/experience/${experienceId}`)

  if (response.status === 404) {
    throw new Error('Expérience introuvable.')
  }
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status}).`)
  }
  return response.json()
}

/**
 * Tracking analytique (alimente les statistiques du partenaire).
 *
 * Volontairement « fire-and-forget » : on n'interrompt JAMAIS le parcours
 * visiteur si l'enregistrement échoue (réseau, expérience non publiée...). Les
 * erreurs sont avalées. `keepalive` autorise l'envoi même si la page se ferme.
 */
function trackEvent(experienceId, kind) {
  if (!experienceId) return
  fetch(`${API_BASE_URL}/api/experience/${experienceId}/${kind}`, {
    method: 'POST',
    keepalive: true,
  }).catch(() => {})
}

/** Enregistre un scan (ouverture de l'expérience via le QR code). */
export function trackScan(experienceId) {
  trackEvent(experienceId, 'scan')
}

/** Enregistre une capture de souvenir. */
export function trackCapture(experienceId) {
  trackEvent(experienceId, 'capture')
}

// --------------------------------------------------------------------------
// Chasse au trésor (template treasure_hunt) — endpoints publics visiteur.
// --------------------------------------------------------------------------

/** Charge la chasse d'une expérience : titre, étapes (indices), total. */
export async function getHunt(experienceId) {
  const response = await fetch(`${API_BASE_URL}/api/hunt/${experienceId}`)
  if (response.status === 404) {
    throw new Error('Aucune chasse au trésor disponible pour cette expérience.')
  }
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status}).`)
  }
  return response.json()
}

/** Progression de la session anonyme (pour reprendre au bon endroit). */
export async function getHuntProgress(experienceId, sessionToken) {
  const query = new URLSearchParams({ session_token: sessionToken })
  const response = await fetch(`${API_BASE_URL}/api/hunt/${experienceId}/progress?${query}`)
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status}).`)
  }
  return response.json()
}

/** Valide un code d'étape (scanné ou saisi) pour la session anonyme. */
export async function validateHuntStep(experienceId, sessionToken, code) {
  const response = await fetch(`${API_BASE_URL}/api/hunt/step/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experience_id: experienceId, session_token: sessionToken, code }),
  })
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status}).`)
  }
  return response.json()
}
