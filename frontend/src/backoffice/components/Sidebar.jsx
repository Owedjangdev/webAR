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
  X,
} from 'lucide-react'

import { clearSession, getRole } from '../../lib/auth.js'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/places', label: 'Lieux', icon: MapPin },
  { to: '/admin/experiences', label: 'Expériences', icon: Sparkles },
  { to: '/admin/assets', label: 'Assets', icon: Images },
  { to: '/admin/qr', label: 'Génération QR', icon: QrCode },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

/**
 * Navigation latérale du backoffice : en-tête de marque, liens de section et
 * carte utilisateur. Fixe sur desktop (lg), tiroir coulissant sur mobile.
 */
export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const role = getRole()

  const logout = () => {
    clearSession()
    navigate('/admin/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-300 ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
    }`

  return (
    <>
      {/* Fond sombre (mobile) quand le tiroir est ouvert. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* En-tête de marque : pastille logo + nom. */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold text-slate-800">Landmark</p>
              <p className="text-xs text-slate-400">Backoffice admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation. */}
        <nav className="flex-1 px-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
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

        {/* Pied : carte utilisateur + déconnexion. */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              A
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-700">Administrateur</p>
              <p className="truncate text-xs capitalize text-slate-400">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
