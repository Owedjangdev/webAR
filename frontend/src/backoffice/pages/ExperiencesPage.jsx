import { useState } from 'react'
import { Images, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'

import { apiDelete, apiGet, apiPut } from '../../lib/apiClient.js'
import AssetManager from '../components/AssetManager.jsx'
import Button from '../components/Button.jsx'
import ExperienceEditForm from '../components/ExperienceEditForm.jsx'
import ExperienceForm from '../components/ExperienceForm.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PublishToggle from '../components/PublishToggle.jsx'
import { useToast } from '../components/Toast.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchExperiences = () => apiGet('/api/admin/experiences')

/**
 * Liste des expériences : identifiant, lieu, template, statut. Actions par ligne :
 * gérer les assets, modifier, supprimer, publier (brouillons). Création via modale.
 */
export default function ExperiencesPage() {
  const { data, loading, error, reload } = useApiResource(fetchExperiences)
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [assetsExpId, setAssetsExpId] = useState(null)
  const [editExp, setEditExp] = useState(null)
  const [deleteExp, setDeleteExp] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [publishingId, setPublishingId] = useState(null)
  const [rowError, setRowError] = useState(null)

  const togglePublish = async (exp) => {
    setRowError(null)
    setPublishingId(exp.experience_id)
    try {
      const action = exp.status === 'published' ? 'unpublish' : 'publish'
      await apiPut(`/api/admin/experiences/${exp.experience_id}/${action}`)
      reload()
      toast.success(action === 'publish' ? 'Expérience publiée' : 'Expérience dépubliée')
    } catch (err) {
      setRowError(err.message)
    } finally {
      setPublishingId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await apiDelete(`/api/admin/experiences/${deleteExp.experience_id}`)
      setDeleteExp(null)
      reload()
      toast.success('Expérience supprimée')
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Expériences"
        subtitle="Crée, modifie, publie et gère tes expériences AR."
        action={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Créer une expérience
          </Button>
        }
      />

      {rowError && (
        <div className="mb-4">
          <ErrorState message={rowError} />
        </div>
      )}

      {loading && <Loader />}
      {error && <ErrorState message={error} />}

      {!loading &&
        !error &&
        (data.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Aucune expérience"
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Créer une expérience
              </Button>
            }
          >
            Crée ta première expérience (elle démarrera en brouillon).
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Identifiant</th>
                  <th className="px-5 py-3 font-medium">Lieu</th>
                  <th className="px-5 py-3 font-medium">Template</th>
                  <th className="px-5 py-3 font-medium">Publication</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((exp) => (
                  <tr key={exp.experience_id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{exp.experience_id}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.place?.name}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.template}</td>
                    <td className="px-5 py-3">
                      <PublishToggle
                        published={exp.status === 'published'}
                        loading={publishingId === exp.experience_id}
                        onToggle={() => togglePublish(exp)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          icon={Images}
                          aria-label={`Assets de ${exp.experience_id}`}
                          title="Gérer les assets"
                          className="!px-2"
                          onClick={() => setAssetsExpId(exp.experience_id)}
                        />
                        <Button
                          variant="ghost"
                          icon={Pencil}
                          aria-label={`Modifier ${exp.experience_id}`}
                          title="Modifier"
                          className="!px-2"
                          onClick={() => setEditExp(exp)}
                        />
                        <Button
                          variant="ghost"
                          icon={Trash2}
                          aria-label={`Supprimer ${exp.experience_id}`}
                          title="Supprimer"
                          className="!px-2 hover:!bg-red-50 hover:!text-red-600"
                          onClick={() => setDeleteExp(exp)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Création */}
      <Modal open={creating} title="Créer une expérience" onClose={() => setCreating(false)}>
        <ExperienceForm
          onCreated={() => {
            setCreating(false)
            reload()
            toast.success('Expérience créée avec succès')
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      {/* Assets */}
      <Modal
        open={assetsExpId !== null}
        title={`Assets — ${assetsExpId ?? ''}`}
        onClose={() => setAssetsExpId(null)}
      >
        {assetsExpId && <AssetManager experienceId={assetsExpId} />}
      </Modal>

      {/* Modification */}
      <Modal
        open={editExp !== null}
        title={`Modifier ${editExp?.experience_id ?? ''}`}
        onClose={() => setEditExp(null)}
      >
        {editExp && (
          <ExperienceEditForm
            experience={editExp}
            onSaved={() => {
              setEditExp(null)
              reload()
              toast.success('Expérience modifiée')
            }}
            onCancel={() => setEditExp(null)}
          />
        )}
      </Modal>

      {/* Suppression */}
      <Modal
        open={deleteExp !== null}
        title="Supprimer l'expérience"
        onClose={() => setDeleteExp(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Supprimer définitivement <strong>{deleteExp?.experience_id}</strong> ? Cette action est
            irréversible.
          </p>
          {deleteError && <ErrorState message={deleteError} />}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteExp(null)}>
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
