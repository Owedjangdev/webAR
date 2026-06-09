// Primitif de persistance : un drapeau booléen daté dans localStorage.
//
// Toute la logique de stockage (et son try/catch) vit ICI, une seule fois :
// en navigation privée ou si le storage est bloqué, on dégrade proprement
// (drapeau « non posé », jamais de crash — CLAUDE.md §11). Réutilisé par
// badgeStorage (badges) et discoveryStorage (objets découverts).

/** Vrai si le drapeau a déjà été posé pour cette clé. */
export function isFlagSet(key) {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

/**
 * Pose le drapeau (valeur = date ISO du moment).
 * @returns {boolean} true si la persistance a réussi, false si le storage est
 *   indisponible (l'appelant peut alors prévenir l'utilisateur).
 */
export function setFlag(key) {
  try {
    localStorage.setItem(key, new Date().toISOString())
    return true
  } catch {
    return false
  }
}
