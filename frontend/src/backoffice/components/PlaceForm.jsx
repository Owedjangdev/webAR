import { useState } from 'react'

import { apiPost } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

/**
 * Formulaire de création d'un lieu (POST /api/admin/places).
 * Validation côté client (champs requis) + remontée des erreurs API.
 * `onCreated` est appelé au succès (le parent ferme la modale et recharge).
 */
export default function PlaceForm({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    const nextErrors = {
      name: name.trim() ? undefined : 'Le nom est requis.',
      city: city.trim() ? undefined : 'La ville est requise.',
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.city) return

    setSubmitting(true)
    try {
      await apiPost('/api/admin/places', { name: name.trim(), city: city.trim() })
      onCreated()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Nom du lieu" htmlFor="place-name" error={errors.name}>
        <input
          id="place-name"
          className={CONTROL_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, name: name.trim() ? undefined : 'Le nom est requis.' }))}
          placeholder="Place de l'Amazone"
          autoFocus
        />
      </FormField>

      <FormField label="Ville" htmlFor="place-city" error={errors.city}>
        <input
          id="place-city"
          className={CONTROL_CLASS}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, city: city.trim() ? undefined : 'La ville est requise.' }))}
          placeholder="Cotonou"
        />
      </FormField>

      {apiError && <ErrorState message={apiError} />}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          Créer le lieu
        </Button>
      </div>
    </form>
  )
}
