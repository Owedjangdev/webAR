import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  Compass,
  KeyRound,
  Loader2,
  MapPin,
  QrCode,
  Share2,
  Trophy,
  XCircle,
} from 'lucide-react'

import { getHunt, getHuntProgress, validateHuntStep } from '../lib/api.js'
import { getSessionToken } from '../lib/huntSession.js'

/**
 * Template "treasure_hunt" — Chasse au trésor par QR (réf. Groove Jones, version
 * QR sans Niantic VPS). Parcours multi-étapes (N libre) à progression ANONYME :
 *
 * - charge la chasse (titre, indices) + la progression de la session ;
 * - affiche l'indice de l'étape courante + la barre de progression X/N ;
 * - valide une étape soit via `?step=CODE` (QR scanné sur place), soit via la
 *   SAISIE MANUELLE du code (repli si le scan ne marche pas) ;
 * - le serveur fait foi (anti-triche : ordre imposé) ;
 * - écran de récompense partageable à la fin ; reprise possible au rechargement.
 */
export default function TreasureHuntTemplate({ experienceId, place }) {
  const token = useMemo(() => getSessionToken(), [])
  const [, setSearchParams] = useSearchParams()

  const [phase, setPhase] = useState('loading') // 'loading' | 'ready' | 'error'
  const [hunt, setHunt] = useState(null)
  const [progress, setProgress] = useState(null) // { current_step, total_steps, completed, reward }
  const [error, setError] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [feedback, setFeedback] = useState(null) // { ok, message }
  const [submitting, setSubmitting] = useState(false)
  const [shareNote, setShareNote] = useState(null)
  const started = useRef(false)

  // Chargement initial : chasse + progression, puis validation auto si un code
  // est présent dans l'URL (QR d'étape scanné). Lancé une seule fois.
  useEffect(() => {
    if (started.current) return
    started.current = true

    let active = true
    ;(async () => {
      try {
        const [huntData, prog] = await Promise.all([
          getHunt(experienceId),
          getHuntProgress(experienceId, token),
        ])
        if (!active) return
        setHunt(huntData)

        const code = new URLSearchParams(window.location.search).get('step')
        if (code && !prog.completed) {
          const res = await validateHuntStep(experienceId, token, code)
          if (!active) return
          setProgress({
            current_step: res.current_step,
            total_steps: res.total_steps,
            completed: res.completed,
            reward: res.reward,
          })
          setFeedback({ ok: res.correct, message: res.message })
        } else {
          setProgress(prog)
        }
        if (active) setPhase('ready')
      } catch (err) {
        if (active) {
          setError(err.message)
          setPhase('error')
        }
      } finally {
        // Retire ?step de l'URL pour éviter une re-validation au rechargement.
        if (active && new URLSearchParams(window.location.search).has('step')) {
          setSearchParams(
            (prev) => {
              prev.delete('step')
              return prev
            },
            { replace: true },
          )
        }
      }
    })()

    return () => {
      active = false
    }
  }, [experienceId, token, setSearchParams])

  const submitCode = async (event) => {
    event.preventDefault()
    const code = manualCode.trim()
    if (!code || submitting) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await validateHuntStep(experienceId, token, code)
      setProgress({
        current_step: res.current_step,
        total_steps: res.total_steps,
        completed: res.completed,
        reward: res.reward,
      })
      setFeedback({ ok: res.correct, message: res.message })
      if (res.correct) setManualCode('')
    } catch (err) {
      setFeedback({ ok: false, message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const share = async () => {
    const text = `J'ai terminé la chasse « ${hunt?.title} »${place?.name ? ` à ${place.name}` : ''} ! 🏆`
    try {
      if (navigator.share) {
        await navigator.share({ title: hunt?.title ?? 'Chasse au trésor', text })
        setShareNote('Partagé')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setShareNote('Copié dans le presse-papier')
      }
    } catch {
      /* partage annulé : on n'affiche rien */
    }
  }

  if (phase === 'loading') {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm font-medium">Chargement de la chasse…</p>
        </div>
      </Screen>
    )
  }

  if (phase === 'error') {
    return (
      <Screen>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
        </div>
      </Screen>
    )
  }

  // ----- Chasse terminée : récompense -----
  if (progress.completed) {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-xl shadow-amber-500/30 motion-safe:animate-badge-pop">
            <Trophy className="h-10 w-10" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chasse terminée !</h1>
            <p className="mt-1 text-sm text-slate-500">
              {progress.total_steps}/{progress.total_steps} étapes · {hunt.title}
            </p>
          </div>
          <p className="rounded-2xl bg-brand-50 px-5 py-4 text-brand-800">{progress.reward}</p>

          {shareNote && (
            <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <CheckCircle2 className="h-4 w-4" /> {shareNote}
            </p>
          )}
          <button
            type="button"
            onClick={share}
            className="flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Share2 className="h-5 w-5" />
            Partager ma victoire
          </button>
        </div>
      </Screen>
    )
  }

  // ----- En cours : indice courant + barre + validation -----
  const currentHint = hunt.steps[progress.current_step]?.hint
  const stepNumber = progress.current_step + 1
  const pct = Math.round((progress.current_step / progress.total_steps) * 100)

  return (
    <Screen>
      <div className="space-y-5">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
            <Compass className="h-4 w-4" /> CHASSE AU TRÉSOR
          </div>
          <h1 className="mt-1 text-xl font-bold leading-tight text-slate-900">{hunt.title}</h1>
          {place?.name && (
            <p className="flex items-center gap-1 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {place.name}
            </p>
          )}
        </header>

        {/* Progression X/N */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Étape {stepNumber} sur {progress.total_steps}
            </span>
            <span>
              {progress.current_step}/{progress.total_steps}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Indice de l'étape courante */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Compass className="h-3.5 w-3.5" /> Indice
          </p>
          <p className="mt-2 text-base font-medium text-slate-800">{currentHint}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <QrCode className="h-3.5 w-3.5" /> Trouve et scanne le QR de cette étape, ou entre son code.
          </p>
        </div>

        {/* Feedback de validation */}
        {feedback && (
          <p
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              feedback.ok ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {feedback.message}
          </p>
        )}

        {/* Saisie manuelle du code (repli si le scan échoue) */}
        <form onSubmit={submitCode} className="space-y-2">
          <label htmlFor="hunt-code" className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <KeyRound className="h-3.5 w-3.5" /> Le scan ne marche pas ? Entre le code écrit sous le QR
          </label>
          <div className="flex gap-2">
            <input
              id="hunt-code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Ex. TR0NE"
              autoCapitalize="characters"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-wider text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={submitting || !manualCode.trim()}
              className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </Screen>
  )
}

/** Cadre commun : fond clair, carte centrée mobile-first (cohérent avec la marque). */
function Screen({ children }) {
  return (
    <main className="flex min-h-[100dvh] items-start justify-center bg-gradient-to-b from-white to-slate-100 p-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
