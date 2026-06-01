import { Focus, Loader2 } from 'lucide-react'

import BrandHeader from './BrandHeader.jsx'
import LoadingBars from './LoadingBars.jsx'
import ScreenLayout from './ScreenLayout.jsx'

/**
 * Écran de chargement de l'expérience (pendant l'appel à l'API).
 */
export default function LoadingScreen() {
  return (
    <ScreenLayout>
      <div className="flex flex-col items-center gap-12 py-12 text-center">
        <BrandHeader />

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <Loader2 className="absolute h-16 w-16 animate-spin text-brand-500" />
            <Focus className="h-6 w-6 text-brand-400" />
          </div>
          <p className="text-sm text-slate-500">Chargement de votre expérience AR…</p>
        </div>

        <LoadingBars />
      </div>
    </ScreenLayout>
  )
}
