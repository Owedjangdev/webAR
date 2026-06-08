import { Navigate } from 'react-router-dom'

import { getRole, isAuthenticated } from '../lib/auth.js'

/**
 * Garde de route du backoffice : n'autorise que les administrateurs connectés.
 * Sans jeton (ou rôle ≠ admin) -> redirection vers le login. Le rôle `partner`
 * aura son propre espace en S7 ; ici on l'aiguille simplement vers le login.
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated() || getRole() !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }
  return children
}
