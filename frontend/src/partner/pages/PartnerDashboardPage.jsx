import { Camera, MapPin, ScanLine, Sparkles } from 'lucide-react'

import { displayNameFromEmail } from '../../lib/identity.js'
import { getEmail } from '../../lib/auth.js'
import { getPartnerExperiences, getPartnerPlaces, getPartnerStats } from '../../lib/partnerApi.js'
import PageHeader from '../../backoffice/components/PageHeader.jsx'
import StatCard from '../../backoffice/components/StatCard.jsx'
import StatusBadge from '../../backoffice/components/StatusBadge.jsx'
import { EmptyState, ErrorState, Loader } from '../../backoffice/components/feedback.jsx'
import { useApiResource } from '../../backoffice/hooks/useApiResource.js'

export default function PartnerDashboardPage() {
  const places = useApiResource(getPartnerPlaces)
  const experiences = useApiResource(getPartnerExperiences)
  const stats = useApiResource(getPartnerStats)

  if (places.loading || experiences.loading || stats.loading) return <Loader />
  if (places.error) return <ErrorState message={places.error} />
  if (experiences.error) return <ErrorState message={experiences.error} />

  const placeList = places.data ?? []
  const expList = experiences.data ?? []
  // A5 : les stats peuvent être indisponibles sans bloquer le reste du tableau.
  const statsData = stats.data

  // A4 : aucun lieu rattaché -> état vide invitant à contacter l'admin.
  if (placeList.length === 0) {
    return (
      <div>
        <PageHeader title={`Bonjour ${displayNameFromEmail(getEmail())}`} subtitle="Espace partenaire" />
        <EmptyState icon={MapPin} title="Aucun lieu rattaché à ton compte">
          Ton administrateur n'a pas encore associé de lieu à ton compte. Contacte-le pour
          commencer à suivre tes expériences.
        </EmptyState>
      </div>
    )
  }

  const recent = [...expList].slice(-5).reverse()

  return (
    <div>
      <PageHeader
        title={`Bonjour ${displayNameFromEmail(getEmail())}`}
        subtitle="Vue d'ensemble de tes lieux, expériences et de leur fréquentation."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Mes lieux" value={placeList.length} accent="brand" />
        <StatCard icon={Sparkles} label="Expériences" value={expList.length} accent="brand" />
        <StatCard icon={ScanLine} label="Scans" value={statsData?.total_scans ?? '—'} accent="emerald" />
        <StatCard icon={Camera} label="Captures" value={statsData?.total_captures ?? '—'} accent="amber" />
      </div>

      {stats.error && (
        <div className="mt-6">
          <ErrorState message="Données analytiques temporairement indisponibles." />
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Sparkles className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-800">Expériences récentes</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Aucune expérience pour l'instant sur tes lieux.
          </p>
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
