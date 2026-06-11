import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

const EMAIL_RE = /^\S+@\S+\.\S+$/

/**
 * Formulaire de création d'un compte partenaire (POST /api/admin/partners).
 * L'admin saisit l'email RÉEL + un mot de passe (à communiquer au partenaire) et
 * peut rattacher des lieux. Le mot de passe est volontairement en clair à l'écran
 * (l'admin doit pouvoir le transmettre).
 */
export default function PartnerForm({ onCreated, onCancel }) {
  const [places, setPlaces] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [placeIds, setPlaceIds] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Charge les lieux pour le rattachement (cases à cocher).
  useEffect(() => {
    let active = true
    apiGet('/api/admin/places')
      .then((data) => active && setPlaces(data))
      .catch((err) => active && setApiError(err.message))
    return () => {
      active = false
    }
  }, [])

  const togglePlace = (id) =>
    setPlaceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    const nextErrors = {
      email: EMAIL_RE.test(email.trim()) ? undefined : 'Email valide requis.',
      password: password.length >= 8 ? undefined : 'Mot de passe : 8 caractères minimum.',
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    setSubmitting(true)
    try {
      await apiPost('/api/admin/partners', {
        email: email.trim(),
        password,
        name: name.trim() || null,
        place_ids: placeIds,
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
      <FormField
        label="Email du partenaire"
        htmlFor="partner-email"
        error={errors.email}
        hint="Email réel — sert d'identifiant de connexion"
      >
        <input
          id="partner-email"
          type="email"
          autoComplete="off"
          className={CONTROL_CLASS}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@restaurant.bj"
          autoFocus
        />
      </FormField>

      <FormField
        label="Mot de passe"
        htmlFor="partner-password"
        error={errors.password}
        hint="À communiquer au partenaire (visible volontairement)"
      >
        <input
          id="partner-password"
          type="text"
          autoComplete="off"
          className={CONTROL_CLASS}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caractères minimum"
        />
      </FormField>

      <FormField label="Nom du contact (optionnel)" htmlFor="partner-name">
        <input
          id="partner-name"
          className={CONTROL_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Restaurant Le Palmier"
        />
      </FormField>

      <FormField label="Lieux rattachés (optionnel)" htmlFor="partner-places">
        {places.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun lieu disponible — tu pourras rattacher plus tard.</p>
        ) : (
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-3">
            {places.map((place) => (
              <label
                key={place.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={placeIds.includes(place.id)}
                  onChange={() => togglePlace(place.id)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {place.name} <span className="text-slate-400">({place.city})</span>
              </label>
            ))}
          </div>
        )}
      </FormField>

      {apiError && <ErrorState message={apiError} />}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          Créer le partenaire
        </Button>
      </div>
    </form>
  )
}
