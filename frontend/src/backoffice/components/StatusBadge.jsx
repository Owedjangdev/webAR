const STYLES = {
  published: { label: 'Publiée', dot: 'bg-brand-500', className: 'bg-brand-50 text-brand-700 ring-brand-600/20' },
  draft: { label: 'Brouillon', dot: 'bg-amber-500', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
}

export default function StatusBadge({ status }) {
  const { label, dot, className } = STYLES[status] ?? {
    label: status,
    dot: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-600 ring-slate-600/20',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
