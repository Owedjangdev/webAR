import { CheckCircle2, Circle, MapPin, Trophy } from 'lucide-react'

import ARTemplateShell from './ARTemplateShell.jsx'

// Étapes de démonstration (squelette). La vraie progression viendra plus tard
// via localStorage (CLAUDE.md section 9), alimentée par le backend.
const DEMO_STEPS = [
  { label: 'Étape 1 — Entrée du lieu', done: true },
  { label: 'Étape 2 — Salle principale', done: true },
  { label: 'Étape 3 — Indice caché', done: false },
  { label: 'Récompense finale', done: false },
]

/**
 * Template "treasure_hunt" — Chasse au Trésor QR (parcours multi-étapes).
 * Zone distinctive : la liste des étapes avec leur état d'avancement.
 */
export default function TreasureHuntTemplate({ place, config }) {
  const doneCount = DEMO_STEPS.filter((step) => step.done).length

  return (
    <ARTemplateShell
      icon={Trophy}
      label="Chasse au Trésor QR"
      accentBg="bg-rose-100"
      accentText="text-rose-700"
      place={place}
      config={config}
    >
      <div className="space-y-4">
        <p className="text-center text-sm text-slate-500">
          {doneCount} / {DEMO_STEPS.length} étapes validées
        </p>

        <ol className="space-y-2">
          {DEMO_STEPS.map((step, index) => {
            const isReward = index === DEMO_STEPS.length - 1
            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  step.done ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-rose-500" />
                ) : isReward ? (
                  <Trophy className="h-5 w-5 shrink-0 text-slate-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                )}
                <span className="text-sm font-medium">{step.label}</span>
              </li>
            )
          })}
        </ol>

        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5" /> Scanne le prochain QR code pour avancer.
        </p>
      </div>
    </ARTemplateShell>
  )
}
