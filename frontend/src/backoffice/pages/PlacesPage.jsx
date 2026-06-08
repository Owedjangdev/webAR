import { useState } from 'react'
import { ImageIcon, MapPin, Plus } from 'lucide-react'

import { apiGet } from '../../lib/apiClient.js'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PlaceForm from '../components/PlaceForm.jsx'
import PlaceLogoForm from '../components/PlaceLogoForm.jsx'
import { useToast } from '../components/Toast.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchPlaces = () => apiGet('/api/admin/places')

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function PlacesPage() {
  const { data, loading, error, reload } = useApiResource(fetchPlaces)
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [logoPlaceId, setLogoPlaceId] = useState(null)

  const handleCreated = () => {
    setCreating(false)
    reload()
    toast.success('Lieu créé avec succès')
  }

  return (
    <div>
      <PageHeader
        title="Lieux"
        subtitle="Les lieux physiques qui hébergent les expériences."
        action={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Ajouter un lieu
          </Button>
        }
      />

      {loading && <Loader />}
      {error && <ErrorState message={error} />}

      {!loading &&
        !error &&
        (data.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Aucun lieu"
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Ajouter un lieu
              </Button>
            }
          >
            Crée ton premier lieu pour y rattacher des expériences.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Ville</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Créé le</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Logo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((place) => (
                  <tr key={place.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-800">{place.name}</td>
                    <td className="px-6 py-4 text-slate-600">{place.city}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(place.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        icon={ImageIcon}
                        onClick={() => setLogoPlaceId(place.id)}
                        className="!px-3 !py-1.5"
                      >
                        Logo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <Modal open={creating} title="Ajouter un lieu" onClose={() => setCreating(false)}>
        <PlaceForm onCreated={handleCreated} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal
        open={logoPlaceId !== null}
        title="Logo du lieu"
        onClose={() => setLogoPlaceId(null)}
      >
        <PlaceLogoForm placeId={logoPlaceId} onClose={() => setLogoPlaceId(null)} />
      </Modal>
    </div>
  )
}
