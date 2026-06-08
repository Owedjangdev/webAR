import { Loader2, TriangleAlert } from 'lucide-react'

/** Indicateur de chargement centré (réservé l'espace, évite les sauts de mise en page). */
export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/** Bloc d'erreur (message API clair). */
export function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <TriangleAlert className="h-5 w-5 shrink-0" />
      {message}
    </div>
  )
}

/** État vide : message + action éventuelle (au lieu d'un écran blanc). */
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      {Icon && <Icon className="h-10 w-10 text-slate-300" />}
      <p className="font-semibold text-slate-600">{title}</p>
      {children && <p className="max-w-sm text-sm text-slate-400">{children}</p>}
      {action}
    </div>
  )
}
