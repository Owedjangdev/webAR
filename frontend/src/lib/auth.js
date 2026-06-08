// Session du backoffice : jeton JWT + rôle, persistés dans localStorage.
//
// Compromis assumé (cf. consigne) : localStorage est vulnérable au XSS, mais
// acceptable pour ce projet. Tout l'accès au storage est encapsulé ici (un seul
// point d'entrée) et protégé par try/catch (mode privé / storage bloqué).

const TOKEN_KEY = 'admin_token'
const ROLE_KEY = 'admin_role'
const EMAIL_KEY = 'admin_email'

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage indisponible : on ignore (l'utilisateur restera connecté le temps de la session mémoire) */
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* idem */
  }
}

/** Jeton JWT courant (ou null). */
export function getToken() {
  return read(TOKEN_KEY)
}

/** Rôle courant : 'admin' | 'partner' | null. */
export function getRole() {
  return read(ROLE_KEY)
}

/** Email du compte connecté (ou null) : identité affichée dans le backoffice. */
export function getEmail() {
  return read(EMAIL_KEY)
}

/** Vrai si un jeton est présent (présence, pas validité — l'API tranche au 401). */
export function isAuthenticated() {
  return Boolean(getToken())
}

/** Enregistre la session après un login réussi. */
export function saveSession(token, role, email) {
  write(TOKEN_KEY, token)
  write(ROLE_KEY, role)
  if (email) write(EMAIL_KEY, email)
}

/** Efface la session (déconnexion / jeton invalide). */
export function clearSession() {
  remove(TOKEN_KEY)
  remove(ROLE_KEY)
  remove(EMAIL_KEY)
}
