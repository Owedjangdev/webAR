export default function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  // Carte BLANCHE et neutre (style Aurora) : pas de fond ni de bordure teintés.
  // Seule l'icône garde une légère touche de couleur selon l'accent.
  const iconAccent =
    {
      brand: 'bg-brand-50 text-brand-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
    }[accent] ?? 'bg-brand-50 text-brand-600'

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconAccent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
