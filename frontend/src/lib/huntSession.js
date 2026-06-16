// Jeton anonyme de session de jeu (chasse au trésor), persisté en localStorage.
//
// Il identifie une PROGRESSION (pas une personne) : c'est le `session_token`
// envoyé au backend (cf. AnonymousSession). Persisté → on reprend la chasse là où
// on s'était arrêté, même après avoir fermé l'onglet. Aucune donnée personnelle.

const KEY = 'webar_hunt_session'

// Repli si localStorage est indisponible (navigation privée…) : un jeton en
// mémoire, stable pour la session courante (pas de reprise après rechargement,
// mais le jeu fonctionne).
let memoryToken = null

function newToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Jeton de session anonyme (créé une fois, puis réutilisé). */
export function getSessionToken() {
  try {
    let token = localStorage.getItem(KEY)
    if (!token) {
      token = newToken()
      localStorage.setItem(KEY, token)
    }
    return token
  } catch {
    if (!memoryToken) memoryToken = newToken()
    return memoryToken
  }
}
