import { Navigate } from 'react-router-dom'

import { getRole, isAuthenticated } from '../lib/auth.js'

/**
 * Garde de route du backoffice, paramétrée par le rôle attendu.
 * Sans jeton, ou si le rôle ne correspond pas, on redirige vers le login partagé.
 * Un partenaire ne peut donc pas atteindre /admin/* et inversement (cf. A3).
 *
 * @param {'admin'|'partner'} [role='admin'] - rôle requis pour la branche.
 */
export default function ProtectedRoute({ children, role = 'admin' }) {
  if (!isAuthenticated() || getRole() !== role) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}
