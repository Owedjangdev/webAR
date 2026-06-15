import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Info, KeyRound, LogOut, ShieldCheck } from 'lucide-react'

import { apiPost } from '../../lib/apiClient.js'
import { clearSession, getEmail, getRole } from '../../lib/auth.js'
import { displayNameFromEmail } from '../../lib/identity.js'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import FormField, { CONTROL_CLASS } from '../components/FormField.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { ErrorState } from '../components/feedback.jsx'
import { useToast } from '../components/Toast.jsx'

const ROLE_LABEL = { admin: 'Administrateur', partner: 'Partenaire' }

export default function SettingsPage() {
  const navigate = useNavigate()
  const email = getEmail()
  const role = getRole()

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Ton compte, ta sécurité et les infos de la plateforme." />

      <div className="max-w-2xl space-y-6">
        {/* --- Profil --- */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar key={email ?? 'anon'} email={email} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-800">
                {displayNameFromEmail(email)}
              </p>
              <p className="truncate text-sm text-slate-500">{email ?? '—'}</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {ROLE_LABEL[role] ?? role ?? '—'}
            </span>
          </div>
        </section>

        {/* --- Sécurité : changement de mot de passe --- */}
        <ChangePasswordCard />

        {/* --- À propos --- */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Info className="h-4 w-4 text-slate-400" />
            À propos
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Plateforme" value="VisitAR Benin — WebAR par QR code" />
            <Row label="Environnement" value={import.meta.env.MODE} capitalize />
            <Row label="Navigateur cible" value="Chrome ≥ 80 (mobile entry-level)" />
          </dl>
        </section>

        {/* --- Déconnexion --- */}
        <section className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-700">Session</h2>
            <p className="mt-0.5 text-sm text-slate-400">Te déconnecter de l'espace administrateur.</p>
          </div>
          <Button variant="outline" icon={LogOut} onClick={logout}>
            Déconnexion
          </Button>
        </section>
      </div>
    </div>
  )
}

/** Ligne clé/valeur de la carte « À propos ». */
function Row({ label, value, capitalize = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`font-medium text-slate-700 ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
    </div>
  )
}

/** Carte « Sécurité » : formulaire fonctionnel de changement de mot de passe. */
function ChangePasswordCard() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    const nextErrors = {
      current: current ? undefined : 'Mot de passe actuel requis.',
      next: next.length >= 8 ? undefined : 'Au moins 8 caractères.',
      confirm: confirm === next ? undefined : 'Les mots de passe ne correspondent pas.',
    }
    setErrors(nextErrors)
    if (nextErrors.current || nextErrors.next || nextErrors.confirm) return

    setSubmitting(true)
    try {
      await apiPost('/api/admin/change-password', {
        current_password: current,
        new_password: next,
      })
      reset()
      toast.success('Mot de passe modifié')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <KeyRound className="h-4 w-4 text-slate-400" />
        Sécurité — changer le mot de passe
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <FormField label="Mot de passe actuel" htmlFor="pwd-current" error={errors.current}>
          <input
            id="pwd-current"
            type="password"
            autoComplete="current-password"
            className={CONTROL_CLASS}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nouveau mot de passe" htmlFor="pwd-new" error={errors.next} hint="8 caractères min.">
            <input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              className={CONTROL_CLASS}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </FormField>
          <FormField label="Confirmer" htmlFor="pwd-confirm" error={errors.confirm}>
            <input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              className={CONTROL_CLASS}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FormField>
        </div>

        {apiError && <ErrorState message={apiError} />}

        <div className="flex justify-end">
          <Button type="submit" icon={Check} loading={submitting}>
            Mettre à jour
          </Button>
        </div>
      </form>
    </section>
  )
}
