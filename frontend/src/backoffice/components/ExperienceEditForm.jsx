import { useEffect, useState } from 'react'

import { API_BASE_URL } from '../../lib/api.js'
import { apiPut } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

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
 * Modifie une expérience (template + config). PUT /api/experience/{id}.
 *
 * Pré-remplit message/couleur depuis le contrat public — disponible seulement
 * si l'expérience est PUBLIÉE (un brouillon répond 404). ⚠️ Un pré-remplissage
 * fiable des brouillons nécessitera une route admin GET /api/admin/experiences/{id}
 * (à ajouter côté backend).
 */
export default function ExperienceEditForm({ experience, onSaved, onCancel }) {
  const [template, setTemplate] = useState(experience.template)
  const [message, setMessage] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`${API_BASE_URL}/api/experience/${experience.experience_id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.config) {
          setMessage(data.config.message ?? '')
          if (data.config.color) setColor(data.config.color)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [experience.experience_id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    setSubmitting(true)
    try {
      await apiPut(`/api/experience/${experience.experience_id}`, {
        template,
        config: { message: message.trim(), color },
      })
      onSaved()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Template" htmlFor="edit-template">
        <select
          id="edit-template"
          className={CONTROL_CLASS}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          {TEMPLATES.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Message (config)" htmlFor="edit-message">
        <input
          id="edit-message"
          className={CONTROL_CLASS}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Souvenir au Palmier"
        />
      </FormField>

      <FormField label="Couleur (config)" htmlFor="edit-color">
        <div className="flex items-center gap-3">
          <input
            id="edit-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200"
          />
          <span className="text-sm text-slate-500">{color}</span>
        </div>
      </FormField>

      {apiError && <ErrorState message={apiError} />}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
