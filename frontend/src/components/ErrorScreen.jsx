import { TriangleAlert } from 'lucide-react'

import ScreenLayout from './ScreenLayout.jsx'

/**
 * Écran d'erreur : expérience introuvable, route inconnue, API injoignable.
 */
export default function ErrorScreen({ message }) {
  return (
    <ScreenLayout>
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <TriangleAlert className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-800">Oups…</h1>
        <p className="mt-2 text-sm text-slate-500">
          {message ?? 'Cette page ou cette expérience est introuvable.'}
        </p>
      </div>
    </ScreenLayout>
  )
}
