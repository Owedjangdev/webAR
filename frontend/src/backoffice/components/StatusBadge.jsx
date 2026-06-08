// Pastille de statut d'expérience. La couleur n'est PAS le seul indicateur
// (le libellé texte est toujours présent — accessibilité).
const STYLES = {
  published: { label: 'Publiée', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  draft: { label: 'Brouillon', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
}

export default function StatusBadge({ status }) {
  const { label, className } = STYLES[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
