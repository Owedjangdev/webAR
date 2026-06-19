import { useState } from 'react'
import { Images } from 'lucide-react'

import { apiGet } from '../../lib/apiClient.js'
import AssetManager from '../components/AssetManager.jsx'
import FormField, { CONTROL_CLASS } from '../components/FormField.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchExperiences = () => apiGet('/api/admin/experiences')

export default function AssetsPage() {
  const { data, loading, error } = useApiResource(fetchExperiences)
  const [selected, setSelected] = useState('')

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle="Gère les médias (overlay, logo, image, audio, badge, modèle 3D .glb) d'une expérience."
      />

      {loading && <Loader />}
      {error && <ErrorState message={error} />}

      {!loading &&
        !error &&
        (data.length === 0 ? (
          <EmptyState icon={Images} title="Aucune expérience">
            Crée d'abord une expérience pour y attacher des assets.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <FormField label="Choisis une expérience" htmlFor="assets-exp">
                <select
                  id="assets-exp"
                  className={CONTROL_CLASS}
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">— Sélectionner une expérience —</option>
                  {data.map((exp) => (
                    <option key={exp.experience_id} value={exp.experience_id}>
                      {exp.experience_id} — {exp.place?.name} ({exp.template})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {selected ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <AssetManager experienceId={selected} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Sélectionne une expérience ci-dessus pour voir et ajouter ses assets.
              </p>
            )}
          </div>
        ))}
    </div>
  )
}
