// Persistance de l'état « objet découvert » (template object_ar), sans compte
// visiteur. Mémorise par expérience qu'au moins une fois la fiche produit a été
// consultée → permet d'afficher un indicateur « Découvert ✓ » au retour.
//
// Même primitif de stockage que les badges (lib/localFlag) : zéro duplication.

import { isFlagSet, setFlag } from './localFlag.js'

const KEY_PREFIX = 'object_discovered_'

const keyFor = (experienceId) => `${KEY_PREFIX}${experienceId}`

/** Indique si l'objet de cette expérience a déjà été découvert (fiche ouverte). */
export function isObjectDiscovered(experienceId) {
  return experienceId ? isFlagSet(keyFor(experienceId)) : false
}

/**
 * Marque l'objet comme découvert.
 * @returns {boolean} true si la persistance a réussi, false si indisponible.
 */
export function markObjectDiscovered(experienceId) {
  return experienceId ? setFlag(keyFor(experienceId)) : false
}
