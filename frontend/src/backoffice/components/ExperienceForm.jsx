import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

// Les 7 templates autorisés (cf. CLAUDE.md section 9). Le backend revalide (422).
const TEMPLATES = [
  'selfie_ar',
  'badge',
  'object_ar',
  'treasure_hunt',
  'guide_narratif',
  'capsule_collective',
  'portal_ar',
]

/**
 * Formulaire de création d'une expérience (POST /api/admin/experiences).
 * Le lieu vient d'une liste déroulante (lieux existants), le template d'une
 * liste fermée, et message/color sont assemblés en config_json. L'expérience
 * est créée en `draft` (forcé par le backend).
 */
export default function ExperienceForm({ onCreated, onCancel }) {
  const [places, setPlaces] = useState([])
  const [publicId, setPublicId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [template, setTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Charge les lieux pour le menu déroulant.
  useEffect(() => {
    let active = true
    apiGet('/api/admin/places')
      .then((data) => active && setPlaces(data))
      .catch((err) => active && setApiError(err.message))
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    const nextErrors = {
      publicId: publicId.trim() ? undefined : "L'identifiant public est requis.",
      placeId: placeId ? undefined : 'Choisis un lieu.',
      template: template ? undefined : 'Choisis un template.',
    }
    setErrors(nextErrors)
    if (nextErrors.publicId || nextErrors.placeId || nextErrors.template) return

    setSubmitting(true)
    try {
      await apiPost('/api/admin/experiences', {
        public_id: publicId.trim(),
        place_id: Number(placeId),
        template,
        config_json: { message: message.trim(), color },
      })
      onCreated()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Identifiant public" htmlFor="exp-public-id" error={errors.publicId} hint="ex. exp_010">
        <input
          id="exp-public-id"
          className={CONTROL_CLASS}
          value={publicId}
          onChange={(e) => setPublicId(e.target.value)}
          placeholder="exp_010"
          autoFocus
        />
      </FormField>

      <FormField label="Lieu" htmlFor="exp-place" error={errors.placeId}>
        <select
          id="exp-place"
          className={CONTROL_CLASS}
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          <option value="">— Choisir un lieu —</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name} ({place.city})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Template" htmlFor="exp-template" error={errors.template}>
        <select
          id="exp-template"
          className={CONTROL_CLASS}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          <option value="">— Choisir un template —</option>
          {TEMPLATES.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Message (config)" htmlFor="exp-message" hint="Affiché dans l'expérience">
        <input
          id="exp-message"
          className={CONTROL_CLASS}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Souvenir au Palmier"
        />
      </FormField>

      <FormField label="Couleur (config)" htmlFor="exp-color">
        <div className="flex items-center gap-3">
          <input
            id="exp-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200"
          />
          <span className="text-sm text-slate-500">{color}</span>
        </div>
      </FormField>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        L'expérience sera créée en <strong>brouillon</strong> ; tu pourras la publier ensuite.
      </p>

      {apiError && <ErrorState message={apiError} />}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          Créer l'expérience
        </Button>
      </div>
    </form>
  )
}
