import { Box, ScanLine } from 'lucide-react'

import ARTemplateShell from './ARTemplateShell.jsx'

/**
 * Template "object_ar" — Objet InteractifAR.
 * Zone distinctive : un viseur de scan pointé vers l'objet physique.
 */
export default function ObjectInteractiveTemplate({ place, config }) {
  return (
    <ARTemplateShell
      icon={Box}
      label="Objet Interactif AR"
      accentBg="bg-emerald-100"
      accentText="text-emerald-700"
      place={place}
      config={config}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Viseur de scan : cadre avec coins, objet au centre. */}
        <div className="relative flex aspect-square w-44 items-center justify-center rounded-2xl bg-slate-900">
          <span className="absolute left-2 top-2 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-emerald-400" />
          <span className="absolute right-2 top-2 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-emerald-400" />
          <span className="absolute bottom-2 left-2 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-emerald-400" />
          <span className="absolute bottom-2 right-2 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-emerald-400" />
          <Box className="h-14 w-14 text-emerald-300" />
        </div>

        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <ScanLine className="h-4 w-4 text-emerald-500" />
          Pointe la caméra vers l'objet pour lancer l'animation.
        </p>
      </div>
    </ARTemplateShell>
  )
}
