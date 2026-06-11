import { useEffect, useState } from 'react'

import { apiGet, apiPost, apiPut } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

/**
 * Formulaire de création OU d'édition d'un lieu.
 * - Sans `place` : POST /api/admin/places (création).
 * - Avec `place` : PUT /api/admin/places/{id} (édition partielle).
 *
 * Gère les champs descriptifs (type/adresse/description) et le rattachement à un
 * partenaire propriétaire (`owner_id`). `onSaved` est appelé au succès.
 */
export default function PlaceForm({ place = null, onSaved, onCancel }) {
  const isEdit = place !== null
  const [partners, setPartners] = useState([])
  const [name, setName] = useState(place?.name ?? '')
  const [city, setCity] = useState(place?.city ?? '')
  const [type, setType] = useState(place?.type ?? '')
  const [address, setAddress] = useState(place?.address ?? '')
  const [description, setDescription] = useState(place?.description ?? '')
  const [ownerId, setOwnerId] = useState(place?.owner_id != null ? String(place.owner_id) : '')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Charge les partenaires pour la liste « propriétaire ».
  useEffect(() => {
    let active = true
    apiGet('/api/admin/partners')
      .then((data) => active && setPartners(data))
      .catch(() => active && setPartners([]))
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    const nextErrors = {
      name: name.trim() ? undefined : 'Le nom est requis.',
      city: city.trim() ? undefined : 'La ville est requise.',
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.city) return

    const body = {
      name: name.trim(),
      city: city.trim(),
      type: type.trim() || null,
      address: address.trim() || null,
      description: description.trim() || null,
      owner_id: ownerId ? Number(ownerId) : null,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await apiPut(`/api/admin/places/${place.id}`, body)
      } else {
        await apiPost('/api/admin/places', body)
      }
      onSaved()
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
          placeholder="Place de l'Amazone"
          autoFocus
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ville" htmlFor="place-city" error={errors.city}>
          <input
            id="place-city"
            className={CONTROL_CLASS}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cotonou"
          />
        </FormField>
        <FormField label="Type" htmlFor="place-type" hint="restaurant, musée…">
          <input
            id="place-type"
            className={CONTROL_CLASS}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="restaurant"
          />
        </FormField>
      </div>

      <FormField label="Adresse" htmlFor="place-address">
        <input
          id="place-address"
          className={CONTROL_CLASS}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Boulevard de la Marina"
        />
      </FormField>

      <FormField label="Description" htmlFor="place-description">
        <textarea
          id="place-description"
          rows={2}
          className={CONTROL_CLASS}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Quelques mots sur le lieu…"
        />
      </FormField>

      <FormField label="Partenaire propriétaire" htmlFor="place-owner" hint="Optionnel">
        <select
          id="place-owner"
          className={CONTROL_CLASS}
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        >
          <option value="">— Aucun —</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name || partner.email}
            </option>
          ))}
        </select>
      </FormField>

      {apiError && <ErrorState message={apiError} />}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Enregistrer' : 'Créer le lieu'}
        </Button>
      </div>
    </form>
  )
}
