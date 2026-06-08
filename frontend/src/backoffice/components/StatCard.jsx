/**
 * Carte de statistique (KPI) du dashboard : icône + libellé + valeur.
 * Valeur calculée à partir des données réelles (pas de stat inventée).
 */
export default function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}
