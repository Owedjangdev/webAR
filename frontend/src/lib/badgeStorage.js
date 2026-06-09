// Persistance du déblocage des badges (gamification sans compte visiteur).
// Un badge débloqué est mémorisé dans localStorage par expérience, pour
// distinguer la 1ʳᵉ visite (gain de points) d'un retour (pas de re-gain).
//
// La logique de stockage est factorisée dans lib/localFlag (pas de duplication).

import { isFlagSet, setFlag } from './localFlag.js'

const KEY_PREFIX = 'badge_unlocked_'

const keyFor = (experienceId) => `${KEY_PREFIX}${experienceId}`

/** Indique si le badge de cette expérience a déjà été débloqué. */
export function isBadgeUnlocked(experienceId) {
  return experienceId ? isFlagSet(keyFor(experienceId)) : false
}

/**
 * Enregistre le déblocage du badge.
 * @returns {boolean} true si la persistance a réussi, false si le storage est
 *   indisponible (l'appelant peut alors prévenir l'utilisateur).
 */
export function unlockBadge(experienceId) {
  return experienceId ? setFlag(keyFor(experienceId)) : false
}
