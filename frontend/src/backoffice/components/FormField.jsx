// Champ de formulaire : libellé lié (htmlFor) + contrôle (children) + erreur.
// Le contrôle (input/select/textarea) est passé en `children` et stylé avec
// CONTROL_CLASS pour une apparence cohérente partout (DRY, accessibilité).

export const CONTROL_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 ' +
  'outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50'

export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
