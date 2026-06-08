// Client API centralisé du backoffice.
// - Base URL via VITE_API_BASE_URL (jamais en dur), partagée avec le client visiteur.
// - Les appels /api/admin/* ajoutent automatiquement l'en-tête Authorization: Bearer.
// - Sur 401 (jeton absent/expiré), on déconnecte et on redirige vers le login.
// - Les erreurs FastAPI ({ detail }) sont remontées sous forme de message lisible.

import { API_BASE_URL } from './api.js'
import { clearSession, getToken } from './auth.js'

/** Transforme une réponse d'erreur FastAPI en message lisible (gère le 422). */
async function errorMessage(response) {
  let detail
  try {
    detail = (await response.json()).detail
  } catch {
    detail = null
  }
  if (Array.isArray(detail)) {
    // 422 : liste d'erreurs de validation -> on concatène les messages.
    return detail.map((e) => e.msg).join(' ; ')
  }
  return detail || `Erreur ${response.status}.`
}

/**
 * Connexion : POST /api/login. Pas de Bearer ni de redirection auto — un 401
 * signifie simplement « identifiants invalides » (affiché par la page login).
 * @returns {Promise<{access_token: string, token_type: string, role: string}>}
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (response.status === 401) {
    throw new Error('Identifiants invalides.')
  }
  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }
  return response.json()
}

/** Appel authentifié vers /api/admin/* (Bearer auto, déconnexion sur 401). */
async function adminRequest(method, path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken() ?? ''}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (response.status === 401) {
    // Jeton absent ou expiré -> on nettoie et on renvoie au login.
    clearSession()
    window.location.assign('/admin/login')
    throw new Error('Session expirée, reconnecte-toi.')
  }
  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

export const apiGet = (path) => adminRequest('GET', path)
export const apiPost = (path, body) => adminRequest('POST', path, body)
export const apiPut = (path, body) => adminRequest('PUT', path, body)
export const apiDelete = (path) => adminRequest('DELETE', path)

/**
 * Upload d'un fichier (multipart) vers le backend — utilisé pour le logo depuis
 * le bureau. ⚠️ L'endpoint `POST /api/admin/assets/upload` n'existe PAS encore
 * côté backend : le front est prêt, la route reste à ajouter (cf. rappel).
 */
export async function uploadAsset(file, { experienceId, placeId, type, altText } = {}) {
  const form = new FormData()
  form.append('file', file)
  if (experienceId) form.append('experience_id', experienceId)
  if (placeId) form.append('place_id', String(placeId))
  if (type) form.append('type', type)
  if (altText) form.append('alt_text', altText)

  const response = await fetch(`${API_BASE_URL}/api/admin/assets/upload`, {
    method: 'POST',
    // Pas de Content-Type manuel : le navigateur pose le boundary multipart.
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    body: form,
  })
  if (response.status === 401) {
    clearSession()
    window.location.assign('/admin/login')
    throw new Error('Session expirée, reconnecte-toi.')
  }
  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }
  return response.json()
}
