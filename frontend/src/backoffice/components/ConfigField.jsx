import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { DEFAULT_COLOR } from '../config/templateConfig.js'

/**
 * Rend UN champ de configuration à partir de sa définition (templateConfig.js).
 * Gère les types `text`, `textarea` et `color`. Réutilisable pour tous les
 * templates → aucune duplication de markup champ par champ.
 *
 * @param {object}   field    - définition { name, label, type, placeholder, required }
 * @param {string}   value    - valeur courante du champ
 * @param {string}   [error]  - message d'erreur inline (champ requis vide)
 * @param {function} onChange - reçoit la nouvelle valeur (string)
 */
export default function ConfigField({ field, value, error, onChange }) {
  const id = `config-${field.name}`
  const label = field.required ? `${field.label} *` : field.label

  if (field.type === 'color') {
    return (
      <FormField label={label} htmlFor={id}>
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="color"
            value={value || DEFAULT_COLOR}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200"
          />
          <span className="text-sm text-slate-500">{value || DEFAULT_COLOR}</span>
        </div>
      </FormField>
    )
  }

  return (
    <FormField label={label} htmlFor={id} error={error}>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          className={CONTROL_CLASS}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={CONTROL_CLASS}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FormField>
  )
}
