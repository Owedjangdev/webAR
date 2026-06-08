import { useState } from 'react'

import { apiPost } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { useToast } from './Toast.jsx'
import { ErrorState } from './feedback.jsx'

/**
 * Définit (ou remplace) le logo d'un lieu : POST /api/assets avec place_id et
 * type='logo'. Au succès : notification + fermeture de la modale.
 */
export default function PlaceLogoForm({ placeId, onClose }) {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (!url.trim()) {
      setError("L'URL du logo est requise.")
      return
    }
    setSubmitting(true)
    try {
      await apiPost('/api/assets', { place_id: placeId, type: 'logo', url: url.trim() })
      toast.success('Logo du lieu enregistré')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="URL du logo"
        htmlFor="place-logo-url"
        hint="https://… (PNG/JPG). Remplace le logo existant ; partagé par les expériences du lieu."
      >
        <input
          id="place-logo-url"
          type="url"
          className={CONTROL_CLASS}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://cdn.exemple.com/logo.png"
          autoFocus
        />
      </FormField>
      {error && <ErrorState message={error} />}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          Enregistrer le logo
        </Button>
      </div>
    </form>
  )
}
