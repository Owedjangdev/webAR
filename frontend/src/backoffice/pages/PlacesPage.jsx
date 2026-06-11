import { useEffect, useState } from 'react'
import { ImageIcon, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'

import { apiDelete, apiGet } from '../../lib/apiClient.js'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PlaceForm from '../components/PlaceForm.jsx'
import PlaceLogoForm from '../components/PlaceLogoForm.jsx'
import { useToast } from '../components/Toast.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchPlaces = () => apiGet('/api/admin/places')

export default function PlacesPage() {
  const { data, loading, error, reload } = useApiResource(fetchPlaces)
  const toast = useToast()
  const [partnersById, setPartnersById] = useState({})
  const [creating, setCreating] = useState(false)
  const [editPlace, setEditPlace] = useState(null)
  const [logoPlaceId, setLogoPlaceId] = useState(null)
  const [deletePlace, setDeletePlace] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Nom du partenaire propriétaire à afficher dans le tableau (owner_id -> nom).
  useEffect(() => {
    let active = true
    apiGet('/api/admin/partners')
      .then((partners) => {
        if (!active) return
        setPartnersById(Object.fromEntries(partners.map((p) => [p.id, p.name || p.email])))
      })
      .catch(() => active && setPartnersById({}))
    return () => {
      active = false
    }
  }, [])

  const confirmDelete = async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await apiDelete(`/api/admin/places/${deletePlace.id}`)
      setDeletePlace(null)
      reload()
      toast.success('Lieu supprimé')
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
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
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Partenaire</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((place) => (
                  <tr key={place.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-800">{place.name}</td>
                    <td className="px-6 py-4 text-slate-600">{place.city}</td>
                    <td className="px-6 py-4 text-slate-500">{place.type || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {place.owner_id ? (partnersById[place.owner_id] ?? 'Rattaché') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          icon={ImageIcon}
                          aria-label={`Logo de ${place.name}`}
                          title="Logo du lieu"
                          className="!px-2"
                          onClick={() => setLogoPlaceId(place.id)}
                        />
                        <Button
                          variant="ghost"
                          icon={Pencil}
                          aria-label={`Modifier ${place.name}`}
                          title="Modifier"
                          className="!px-2"
                          onClick={() => setEditPlace(place)}
                        />
                        <Button
                          variant="ghost"
                          icon={Trash2}
                          aria-label={`Supprimer ${place.name}`}
                          title="Supprimer"
                          className="!px-2 hover:!bg-red-50 hover:!text-red-600"
                          onClick={() => setDeletePlace(place)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <Modal open={creating} title="Ajouter un lieu" onClose={() => setCreating(false)}>
        <PlaceForm
          onSaved={() => {
            setCreating(false)
            reload()
            toast.success('Lieu créé avec succès')
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={editPlace !== null}
        title={`Modifier ${editPlace?.name ?? ''}`}
        onClose={() => setEditPlace(null)}
      >
        {editPlace && (
          <PlaceForm
            place={editPlace}
            onSaved={() => {
              setEditPlace(null)
              reload()
              toast.success('Lieu modifié')
            }}
            onCancel={() => setEditPlace(null)}
          />
        )}
      </Modal>

      <Modal
        open={logoPlaceId !== null}
        title="Logo du lieu"
        onClose={() => setLogoPlaceId(null)}
      >
        <PlaceLogoForm placeId={logoPlaceId} onClose={() => setLogoPlaceId(null)} />
      </Modal>

      <Modal open={deletePlace !== null} title="Supprimer le lieu" onClose={() => setDeletePlace(null)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Supprimer définitivement <strong>{deletePlace?.name}</strong> ? Un lieu portant des
            expériences ne peut pas être supprimé.
          </p>
          {deleteError && <ErrorState message={deleteError} />}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletePlace(null)}>
              Annuler
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
