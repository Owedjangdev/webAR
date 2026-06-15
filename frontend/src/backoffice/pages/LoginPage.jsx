import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Landmark, Loader2, LogIn, ShieldCheck, Store } from 'lucide-react'

import { login } from '../../lib/apiClient.js'
import { getRole, isAuthenticated, saveSession } from '../../lib/auth.js'

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 ' +
  'outline-none transition-all duration-200 placeholder:text-slate-400 ' +
  'focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50'

// Espace cible par rôle (le rôle réel renvoyé par l'API fait foi).
const HOME = { admin: '/admin/dashboard', partner: '/partner/dashboard' }

// Onglets de sélection de l'espace.
const SPACES = [
  { role: 'admin', label: 'Administrateur', icon: ShieldCheck, placeholder: 'admin@visitar.bj' },
  { role: 'partner', label: 'Partenaire', icon: Store, placeholder: 'partenaire@exemple.bj' },
]

// Validation email côté client (le formulaire est en noValidate) : on contrôle
// nous-mêmes pour afficher un message EN FRANÇAIS, et non celui (en anglais) que
// renverrait la validation Pydantic du backend.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const [space, setSpace] = useState('admin') // espace choisi via le sélecteur
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Déjà connecté : on redirige directement vers l'espace du rôle courant.
  if (isAuthenticated() && HOME[getRole()]) {
    return <Navigate to={HOME[getRole()]} replace />
  }

  const current = SPACES.find((s) => s.role === space)

  const selectSpace = (role) => {
    setSpace(role)
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    // Garde-fous en français avant l'appel API (sinon Pydantic renvoie un message
    // en anglais, ex. « value is not a valid email address… »).
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.')
      return
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Veuillez saisir une adresse email valide.')
      return
    }

    setSubmitting(true)
    try {
      // Le backend exige que le rôle corresponde à l'espace choisi : un mauvais
      // onglet échoue avec « Identifiant incorrect. » (aucune fuite). On se
      // contente d'afficher le message renvoyé et de rediriger selon le rôle.
      const { access_token, role } = await login(trimmedEmail, password, space)
      saveSession(access_token, role, email)
      navigate(HOME[role], { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-50/80 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
              <Landmark className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">VisitAR Benin</h1>
            <p className="mt-1 text-sm text-slate-500">Connecte-toi à ton espace</p>
          </div>

          {/* Sélecteur d'espace : Administrateur / Partenaire. */}
          <div
            role="tablist"
            aria-label="Choisir l'espace"
            className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
          >
            {SPACES.map(({ role, label, icon: Icon }) => {
              const active = space === role
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectSpace(role)}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    active
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
                placeholder={current.placeholder}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
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
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white shadow-md shadow-brand-500/25 outline-none transition-all duration-200 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">WebAR Backoffice · VisitAR Benin</p>
        </div>
      </div>
    </main>
  )
}
