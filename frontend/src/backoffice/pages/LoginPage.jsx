import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Landmark, Loader2, LogIn } from 'lucide-react'

import { login } from '../../lib/apiClient.js'
import { getRole, isAuthenticated, saveSession } from '../../lib/auth.js'

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white ' +
  'outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
              <Landmark className="h-7 w-7" />
            </span>
            <h1 className="text-xl font-bold text-white">Landmark</h1>
            <p className="mt-1 text-sm text-slate-400">Connecte-toi à ton espace administrateur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="admin@webar.bj"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 outline-none transition-all duration-200 hover:shadow-brand-500/40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
