import { useState } from 'react'
import { Award, Lock } from 'lucide-react'

import ARTemplateShell from './ARTemplateShell.jsx'

/**
 * Template "badge" — Badge de Lieu (gamification).
 * Zone distinctive : un médaillon de badge à débloquer.
 */
export default function BadgeTemplate({ place, config }) {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <ARTemplateShell
      icon={Award}
      label="Badge de Lieu"
      accentBg="bg-amber-100"
      accentText="text-amber-700"
      place={place}
      config={config}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Médaillon : verrouillé (gris) puis débloqué (doré). */}
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full ring-4 ${
            unlocked
              ? 'bg-amber-100 text-amber-600 ring-amber-200'
              : 'bg-slate-100 text-slate-400 ring-slate-200'
          }`}
        >
          {unlocked ? <Award className="h-12 w-12" /> : <Lock className="h-10 w-10" />}
        </div>

        <p className="text-sm text-slate-500">
          {unlocked ? `Badge « ${place.name} » débloqué !` : 'Badge à débloquer'}
        </p>

        {!unlocked && (
          <button
            type="button"
            onClick={() => setUnlocked(true)}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-110"
          >
            Débloquer le badge
          </button>
        )}
      </div>
    </ARTemplateShell>
  )
}
