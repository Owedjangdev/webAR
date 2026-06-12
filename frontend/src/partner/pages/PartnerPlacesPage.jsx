import { MapPin, Sparkles } from 'lucide-react'

import { getPartnerExperiences, getPartnerPlaces } from '../../lib/partnerApi.js'
import PageHeader from '../../backoffice/components/PageHeader.jsx'
import StatusBadge from '../../backoffice/components/StatusBadge.jsx'
import { EmptyState, ErrorState, Loader } from '../../backoffice/components/feedback.jsx'
import { useApiResource } from '../../backoffice/hooks/useApiResource.js'

export default function PartnerPlacesPage() {
  const places = useApiResource(getPartnerPlaces)
  const experiences = useApiResource(getPartnerExperiences)

  if (places.loading || experiences.loading) return <Loader />
  if (places.error) return <ErrorState message={places.error} />
  if (experiences.error) return <ErrorState message={experiences.error} />

  const placeList = places.data ?? []
  const expList = experiences.data ?? []

  // Regroupe les expériences par nom de lieu (la liste partenaire est filtrée
  // côté backend : tout ce qui remonte appartient déjà au partenaire).
  const expByPlace = expList.reduce((acc, exp) => {
    const key = exp.place?.name ?? '—'
    ;(acc[key] ??= []).push(exp)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Mes lieux"
        subtitle="Tes lieux et les expériences AR qui leur sont associées (consultation)."
      />

      {placeList.length === 0 ? (
        <EmptyState icon={MapPin} title="Aucun lieu rattaché à ton compte">
          Contacte ton administrateur pour qu'il associe un lieu à ton compte.
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {placeList.map((place) => {
            const exps = expByPlace[place.name] ?? []
            return (
              <section
                key={place.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-bold text-slate-800">{place.name}</h2>
                        <p className="text-sm text-slate-500">
                          {place.city}
                          {place.type ? ` · ${place.type}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {exps.length} expérience{exps.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {place.address && <p className="mt-3 text-sm text-slate-500">{place.address}</p>}
                  {place.description && (
                    <p className="mt-1 text-sm text-slate-400">{place.description}</p>
                  )}
                </div>

                {exps.length === 0 ? (
                  <p className="px-6 py-6 text-center text-sm text-slate-400">
                    Aucune expérience sur ce lieu pour l'instant.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {exps.map((exp) => (
                      <li
                        key={exp.experience_id}
                        className="flex items-center justify-between gap-3 px-6 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Sparkles className="h-4 w-4 shrink-0 text-slate-300" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{exp.experience_id}</p>
                            <p className="truncate text-xs text-slate-400">{exp.template}</p>
                          </div>
                        </div>
                        <StatusBadge status={exp.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
