import { Activity, CheckCircle2, MapPin, Sparkles } from 'lucide-react'

import { apiGet } from '../../lib/apiClient.js'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchPlaces = () => apiGet('/api/admin/places')
const fetchExperiences = () => apiGet('/api/admin/experiences')

export default function DashboardPage() {
  const places = useApiResource(fetchPlaces)
  const experiences = useApiResource(fetchExperiences)

  if (places.loading || experiences.loading) return <Loader />
  if (places.error) return <ErrorState message={places.error} />
  if (experiences.error) return <ErrorState message={experiences.error} />

  const placeList = places.data ?? []
  const expList = experiences.data ?? []
  const publishedCount = expList.filter((exp) => exp.status === 'published').length
  const recent = [...expList].slice(-5).reverse()

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Vue d'ensemble de tes lieux et expériences." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MapPin} label="Lieux" value={placeList.length} accent="brand" />
        <StatCard icon={Sparkles} label="Expériences" value={expList.length} accent="brand" />
        <StatCard icon={CheckCircle2} label="Publiées" value={publishedCount} accent="brand" />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Activity className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-800">Expériences récentes</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Aucune expérience pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((exp) => (
              <li
                key={exp.experience_id}
                className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/80"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{exp.experience_id}</p>
                  <p className="truncate text-sm text-slate-500">
                    {exp.place?.name} · <span className="text-slate-400">{exp.template}</span>
                  </p>
                </div>
                <StatusBadge status={exp.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
