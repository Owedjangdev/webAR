import { NavLink, useNavigate } from 'react-router-dom'
import {
  Images,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  QrCode,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import { clearSession, getEmail, getRole } from '../../lib/auth.js'
import { displayNameFromEmail } from '../../lib/identity.js'
import Avatar from './Avatar.jsx'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/places', label: 'Lieux', icon: MapPin },
  { to: '/admin/partners', label: 'Partenaires', icon: Users },
  { to: '/admin/experiences', label: 'Expériences', icon: Sparkles },
  { to: '/admin/assets', label: 'Assets', icon: Images },
  { to: '/admin/qr', label: 'Génération QR', icon: QrCode },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const role = getRole()
  const email = getEmail()

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  // Sidebar claire (réf. Aurora) : actif = pilule indigo pleine, inactif = gris
  // avec survol doux.
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-300 ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold text-slate-900">VisitAR Benin</p>
              <p className="text-xs text-slate-400">Backoffice</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <div className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose} className={linkClass}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar key={email ?? 'anon'} email={email} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayNameFromEmail(email)}
              </p>
              <p className="truncate text-xs text-slate-400">{email ?? role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 outline-none transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
