import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../lib/apiClient.js'
import {
  DEFAULT_COLOR,
  TEMPLATE_KEYS,
  getTemplateConfig,
} from '../config/templateConfig.js'
import Button from './Button.jsx'
import ConfigField from './ConfigField.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { ErrorState } from './feedback.jsx'

/** Valeurs initiales des champs config d'un template (couleur = défaut, reste vide). */
function initialConfig(template) {
  const config = {}
  for (const field of getTemplateConfig(template).fields) {
    config[field.name] = field.type === 'color' ? DEFAULT_COLOR : ''
  }
  return config
}

/**
 * Formulaire de création d'une expérience (POST /api/admin/experiences).
 *
 * Les champs communs (public_id, lieu, template) sont fixes ; la section
 * « Configuration » s'adapte DYNAMIQUEMENT au template choisi (cf.
 * templateConfig.js, source unique de vérité). L'expérience est créée en `draft`.
 *
 * @param {function} onCreated - appelé après succès avec { template, publicId }
 * @param {function} onCancel  - ferme le formulaire sans créer
 */
export default function ExperienceForm({ onCreated, onCancel }) {
  const [places, setPlaces] = useState([])
  const [publicId, setPublicId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [template, setTemplate] = useState('')
  const [config, setConfig] = useState({})
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

  const templateFields = template ? getTemplateConfig(template).fields : []

  // Vrai si l'admin a déjà saisi un champ config (hors couleur) → on prévient
  // avant d'écraser ces valeurs en changeant de template.
  const isConfigDirty = () =>
    templateFields.some((f) => f.type !== 'color' && (config[f.name] ?? '').trim() !== '')

  const handleTemplateChange = (next) => {
    if (next === template) return
    if (
      template &&
      isConfigDirty() &&
      !window.confirm('Les données de configuration saisies seront perdues. Continuer ?')
    ) {
      return // on garde le template précédent (le select est contrôlé → revient seul)
    }
    setTemplate(next)
    setConfig(next ? initialConfig(next) : {})
    setErrors((prev) => ({ ...prev, template: undefined, config: {} }))
  }

  const setConfigField = (name, value) =>
    setConfig((prev) => ({ ...prev, [name]: value }))

  // Assemble config_json : uniquement les champs du template, sans champ vide.
  const buildConfigJson = () => {
    const result = {}
    for (const field of templateFields) {
      const value = config[field.name]
      if (field.type === 'color') {
        result[field.name] = value || DEFAULT_COLOR
      } else if ((value ?? '').trim() !== '') {
        result[field.name] = value.trim()
      }
    }
    return result
  }

  const validate = () => {
    const base = {
      publicId: publicId.trim() ? undefined : "L'identifiant public est requis.",
      placeId: placeId ? undefined : 'Choisis un lieu.',
      template: template ? undefined : 'Choisis un template.',
    }
    const configErrors = {}
    for (const field of templateFields) {
      if (field.required && !(config[field.name] ?? '').trim()) {
        configErrors[field.name] = `${field.label} est requis.`
      }
    }
    const next = { ...base, config: configErrors }
    setErrors(next)
    const hasBase = base.publicId || base.placeId || base.template
    return !hasBase && Object.keys(configErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await apiPost('/api/admin/experiences', {
        public_id: publicId.trim(),
        place_id: Number(placeId),
        template,
        config_json: buildConfigJson(),
      })
      onCreated({ template, publicId: publicId.trim() })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* --- Champs communs --- */}
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
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">— Choisir un template —</option>
          {TEMPLATE_KEYS.map((key) => (
            <option key={key} value={key}>
              {getTemplateConfig(key).label} ({key})
            </option>
          ))}
        </select>
      </FormField>

      {/* --- Section Configuration : dynamique selon le template --- */}
      {template && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Configuration — {getTemplateConfig(template).label}
          </p>
          {templateFields.map((field) => (
            <ConfigField
              key={field.name}
              field={field}
              value={config[field.name] ?? ''}
              error={errors.config?.[field.name]}
              onChange={(value) => setConfigField(field.name, value)}
            />
          ))}

          {/* Aperçu live du config_json assemblé (pédagogique, léger). */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">Aperçu config_json</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
              {JSON.stringify(buildConfigJson(), null, 2)}
            </pre>
          </div>
        </div>
      )}

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
