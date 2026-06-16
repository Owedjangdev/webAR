import { useEffect, useState } from 'react'
import { Compass, Plus, QrCode, Save, Trash2 } from 'lucide-react'

import { apiGet, apiPost, apiPut } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import HuntQrCodes from './HuntQrCodes.jsx'
import { ErrorState, Loader } from './feedback.jsx'
import { useToast } from './Toast.jsx'

const EMPTY_STEP = { title: '', hint: '' }

/**
 * Constructeur de chasse au trésor (admin) pour une expérience treasure_hunt :
 * - configure titre, récompense et un nombre LIBRE d'étapes (indice par indice) ;
 * - enregistre (PUT /api/admin/hunt/{id}, codes auto-générés côté serveur) ;
 * - affiche ensuite les QR à imprimer (départ + 1 par étape) via HuntQrCodes.
 */
export default function HuntBuilder({ experienceId }) {
  const toast = useToast()
  const [phase, setPhase] = useState('loading') // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState(null)
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [savedVersion, setSavedVersion] = useState(0) // 0 = pas encore enregistré ; change -> recharge les QR

  // Charge la chasse existante (ou formulaire vide si pas encore configurée).
  useEffect(() => {
    let active = true
    apiGet(`/api/admin/hunt/${experienceId}`)
      .then((hunt) => {
        if (!active) return
        setTitle(hunt.title)
        setReward(hunt.reward_message)
        setSteps(hunt.steps.map((s) => ({ title: s.title, hint: s.hint })))
        setSavedVersion(1)
        setPhase('ready')
      })
      .catch((err) => {
        if (!active) return
        if (/aucune chasse/i.test(err.message)) {
          setPhase('ready') // pas encore de chasse : formulaire vide
        } else {
          setLoadError(err.message)
          setPhase('error')
        }
      })
    return () => {
      active = false
    }
  }, [experienceId])

  const updateStep = (index, field, value) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  const addStep = () => setSteps((prev) => [...prev, { ...EMPTY_STEP }])
  const removeStep = (index) => setSteps((prev) => prev.filter((_, i) => i !== index))

  const save = async () => {
    setFormError(null)
    const cleanSteps = steps.map((s) => ({ title: s.title.trim(), hint: s.hint.trim() }))
    if (!title.trim() || !reward.trim()) {
      setFormError('Le titre et le message de récompense sont requis.')
      return
    }
    if (cleanSteps.length === 0 || cleanSteps.some((s) => !s.title || !s.hint)) {
      setFormError('Chaque étape doit avoir un titre et un indice (au moins 1 étape).')
      return
    }
    setSaving(true)
    try {
      await apiPut(`/api/admin/hunt/${experienceId}`, {
        title: title.trim(),
        reward_message: reward.trim(),
        steps: cleanSteps,
      })
      await apiPost(`/api/qr/${experienceId}`) // garantit l'existence du QR de départ
      setSavedVersion((v) => v + 1) // recharge la section QR
      toast.success('Chasse enregistrée')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'loading') return <Loader label="Chargement de la chasse…" />
  if (phase === 'error') return <ErrorState message={loadError} />

  return (
    <div className="space-y-6">
      {/* --- Configuration --- */}
      <section className="space-y-4">
        <FormField label="Titre de la chasse" htmlFor="hunt-title">
          <input
            id="hunt-title"
            className={CONTROL_CLASS}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Le trésor des rois d'Abomey"
          />
        </FormField>
        <FormField label="Message de récompense (fin de chasse)" htmlFor="hunt-reward">
          <input
            id="hunt-reward"
            className={CONTROL_CLASS}
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Ex. Bravo ! Tu as percé le secret des rois 👑"
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Étapes ({steps.length})</p>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                    <Compass className="h-3.5 w-3.5" /> Étape {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1}
                    aria-label={`Supprimer l'étape ${index + 1}`}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  className={`${CONTROL_CLASS} mb-2`}
                  value={step.title}
                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                  placeholder="Titre (ex. Le trône royal)"
                />
                <input
                  className={CONTROL_CLASS}
                  value={step.hint}
                  onChange={(e) => updateStep(index, 'hint', e.target.value)}
                  placeholder="Indice pour trouver le QR (ex. Cherche près du trône)"
                />
              </div>
            ))}
          </div>
          <Button variant="outline" icon={Plus} onClick={addStep} className="mt-3">
            Ajouter une étape
          </Button>
        </div>

        {formError && <ErrorState message={formError} />}

        <div className="flex justify-end">
          <Button icon={Save} loading={saving} onClick={save}>
            Enregistrer la chasse
          </Button>
        </div>
      </section>

      {/* --- QR à imprimer (après enregistrement) --- */}
      {savedVersion > 0 && (
        <section className="border-t border-slate-100 pt-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <QrCode className="h-4 w-4 text-brand-600" /> QR codes à imprimer
          </h3>
          <HuntQrCodes key={savedVersion} experienceId={experienceId} basePath="/api/admin/hunt" />
        </section>
      )}
    </div>
  )
}
