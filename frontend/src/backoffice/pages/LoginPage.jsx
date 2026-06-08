import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'

import { login } from '../../lib/apiClient.js'
import { getRole, isAuthenticated, saveSession } from '../../lib/auth.js'
import FormField, { CONTROL_CLASS } from '../components/FormField.jsx'

/**
 * Page de connexion du backoffice (POST /api/login).
 * Succès admin -> dashboard ; partner -> message (espace prévu en S7) ;
 * échec -> « Identifiants invalides ».
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Déjà connecté en admin : inutile de réafficher le login.
  if (isAuthenticated() && getRole() === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { access_token, role } = await login(email, password)
      if (role !== 'admin') {
        // Aiguillage par rôle : l'espace partenaire arrive en S7 (non codé ici).
        setError("L'espace partenaire n'est pas encore disponible (prévu semaine 7).")
        return
      }
      saveSession(access_token, role)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100">
        <div className="mb-6 text-center">
          <p className="text-xl font-bold text-brand-600">Landmark Backoffice</p>
          <p className="mt-1 text-sm text-slate-500">Connecte-toi à ton espace administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CONTROL_CLASS}
              placeholder="admin@webar.bj"
            />
          </FormField>

          <FormField label="Mot de passe" htmlFor="password">
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={CONTROL_CLASS}
              placeholder="••••••••"
            />
          </FormField>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
