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

/** Liste des lieux (GET /api/admin/places) + création + logo via modales. */
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
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Créé le</th>
                  <th className="px-5 py-3 text-right font-medium">Logo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((place) => (
                  <tr key={place.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{place.name}</td>
                    <td className="px-5 py-3 text-slate-600">{place.city}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(place.created_at)}</td>
                    <td className="px-5 py-3 text-right">
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
