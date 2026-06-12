import { Camera, Percent, ScanLine, TrendingUp } from 'lucide-react'

import { getPartnerStats } from '../../lib/partnerApi.js'
import PageHeader from '../../backoffice/components/PageHeader.jsx'
import StatCard from '../../backoffice/components/StatCard.jsx'
import { EmptyState, Loader } from '../../backoffice/components/feedback.jsx'
import { useApiResource } from '../../backoffice/hooks/useApiResource.js'
import { BarRow, LineChart } from '../components/charts.jsx'

export default function PartnerStatsPage() {
  const { data, loading, error } = useApiResource(getPartnerStats)

  if (loading) return <Loader />
  // A5 : panne/timeout des stats -> message dédié, pas d'écran cassé.
  if (error) {
    return (
      <div>
        <PageHeader title="Statistiques" subtitle="Fréquentation de tes expériences." />
        <EmptyState icon={TrendingUp} title="Données analytiques temporairement indisponibles">
          Réessaie dans un instant. Si le problème persiste, contacte ton administrateur.
        </EmptyState>
      </div>
    )
  }

  const stats = data
  const conversionPct = Math.round((stats.conversion_rate ?? 0) * 100)
  const hasData = stats.total_scans > 0 || stats.total_captures > 0
  const maxScans = Math.max(1, ...stats.by_experience.map((e) => e.scans))

  return (
    <div>
      <PageHeader
        title="Statistiques"
        subtitle="Scans et captures sur tes expériences (30 derniers jours pour la courbe)."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ScanLine} label="Total scans" value={stats.total_scans} accent="brand" />
        <StatCard icon={Camera} label="Total captures" value={stats.total_captures} accent="emerald" />
        <StatCard icon={Percent} label="Taux de capture" value={`${conversionPct} %`} accent="amber" />
        <StatCard
          icon={TrendingUp}
          label="Expériences suivies"
          value={stats.by_experience.length}
          accent="brand"
        />
      </div>

      {!hasData ? (
        <div className="mt-8">
          <EmptyState icon={TrendingUp} title="Pas encore de fréquentation">
            Dès que des visiteurs scanneront tes QR codes et captureront des souvenirs, les
            statistiques apparaîtront ici.
          </EmptyState>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-800">Évolution (30 jours)</h2>
            <LineChart data={stats.daily} />
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-slate-800">Scans par expérience</h2>
            <div className="divide-y divide-slate-50">
              {stats.by_experience.map((e) => (
                <BarRow
                  key={e.experience_id}
                  label={e.experience_id}
                  sublabel={`${e.place_name} · ${e.captures} capture${e.captures > 1 ? 's' : ''}`}
                  value={e.scans}
                  max={maxScans}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
