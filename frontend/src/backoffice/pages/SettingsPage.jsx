import { useNavigate } from 'react-router-dom'
import { LogOut, Server, ShieldCheck, User } from 'lucide-react'

import { API_BASE_URL } from '../../lib/api.js'
import { clearSession, getRole } from '../../lib/auth.js'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'

/**
 * Page Settings : informations RÉELLES du compte/API + déconnexion.
 * (Le changement de mot de passe nécessitera une route backend, à venir.)
 */
export default function SettingsPage() {
  const navigate = useNavigate()
  const role = getRole()

  const logout = () => {
    clearSession()
    navigate('/admin/login', { replace: true })
  }

  const rows = [
    { icon: User, label: 'Compte', value: 'Administrateur' },
    { icon: ShieldCheck, label: 'Rôle', value: role },
    { icon: Server, label: 'API', value: API_BASE_URL },
  ]

  return (
    <div>
      <PageHeader title="Settings" subtitle="Paramètres de ton espace administrateur." />

      <div className="max-w-2xl space-y-6">
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="truncate font-medium capitalize text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Sécurité</h2>
          <p className="mt-1 text-sm text-slate-400">
            Le changement de mot de passe sera disponible bientôt (route backend à venir).
          </p>
          <div className="mt-3">
            <Button variant="ghost" disabled>
              Changer le mot de passe (bientôt)
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
          <h2 className="text-sm font-semibold text-red-700">Session</h2>
          <p className="mt-1 text-sm text-red-600/80">Se déconnecter de l'espace administrateur.</p>
          <div className="mt-3">
            <Button variant="danger" icon={LogOut} onClick={logout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
