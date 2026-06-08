export default function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  const accents = {
    brand: {
      card: 'from-brand-500/5 to-transparent',
      icon: 'bg-brand-100 text-brand-600',
      border: 'border-brand-100',
    },
    emerald: {
      card: 'from-emerald-500/5 to-transparent',
      icon: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      card: 'from-amber-500/5 to-transparent',
      icon: 'bg-amber-100 text-amber-600',
      border: 'border-amber-100',
    },
  }
  const a = accents[accent]
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${a.border} ${a.card}`}
    >
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.icon}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )
}
