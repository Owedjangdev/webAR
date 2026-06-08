import { Loader2, TriangleAlert } from 'lucide-react'

export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <TriangleAlert className="h-5 w-5 shrink-0 text-red-500" />
      {message}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <div>
        <p className="font-semibold text-slate-600">{title}</p>
        {children && <p className="mt-1 max-w-sm text-sm text-slate-400">{children}</p>}
      </div>
      {action}
    </div>
  )
}
