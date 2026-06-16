import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Store } from 'lucide-react'

import { ToastProvider } from '../backoffice/components/Toast.jsx'
import PartnerSidebar from './components/PartnerSidebar.jsx'

export default function PartnerLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas">
        <PartnerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Store className="h-3.5 w-3.5" />
              </span>
              <span className="font-bold text-slate-800">VisitAR Benin</span>
            </div>
          </header>

          <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
