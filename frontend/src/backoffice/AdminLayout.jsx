import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'

import Sidebar from './components/Sidebar.jsx'
import { ToastProvider } from './components/Toast.jsx'

/**
 * Coquille du backoffice : sidebar + zone de contenu (Outlet), enveloppée dans
 * le ToastProvider (notifications accessibles depuis toutes les pages admin).
 * Sur mobile, une barre supérieure avec un bouton « menu » ouvre la sidebar.
 */
export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Décalé à droite de la sidebar sur desktop. */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-brand-600">Landmark Backoffice</span>
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      </div>
    </ToastProvider>
  )
}
