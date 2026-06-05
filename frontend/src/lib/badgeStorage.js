// Persistance du déblocage des badges (gamification sans compte visiteur).
// Un badge débloqué est mémorisé dans localStorage par expérience, pour
// distinguer la 1ʳᵉ visite (gain de points) d'un retour (pas de re-gain).
//
// Tout est encapsulé ici (un seul point d'accès au storage) et protégé par
// try/catch : en navigation privée ou si le storage est bloqué, on dégrade
// proprement (on considère « non débloqué », sans planter — CLAUDE.md §11).

const KEY_PREFIX = 'badge_unlocked_'

const keyFor = (experienceId) => `${KEY_PREFIX}${experienceId}`

/** Indique si le badge de cette expérience a déjà été débloqué. */
export function isBadgeUnlocked(experienceId) {
  if (!experienceId) return false
  try {
    return localStorage.getItem(keyFor(experienceId)) !== null
  } catch {
    return false
  }
}

/**
 * Enregistre le déblocage du badge (date ISO).
 * @returns {boolean} true si la persistance a réussi, false si le storage est
 *   indisponible (l'appelant peut alors prévenir l'utilisateur).
 */
export function unlockBadge(experienceId) {
  if (!experienceId) return false
  try {
    localStorage.setItem(keyFor(experienceId), new Date().toISOString())
    return true
  } catch {
    return false
  }
}
