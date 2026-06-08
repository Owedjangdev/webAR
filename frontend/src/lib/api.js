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
