import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Images, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'

import { apiDelete, apiGet, apiPut } from '../../lib/apiClient.js'
import { assetLabel, getTemplateConfig } from '../config/templateConfig.js'
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

export default function ExperiencesPage() {
  const { data, loading, error, reload } = useApiResource(fetchExperiences)
  const toast = useToast()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [assetReminder, setAssetReminder] = useState(null)
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
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Identifiant</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Lieu</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Template</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Publication</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((exp) => (
                  <tr key={exp.experience_id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-800">{exp.experience_id}</td>
                    <td className="px-6 py-4 text-slate-600">{exp.place?.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {exp.template}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PublishToggle
                        published={exp.status === 'published'}
                        loading={publishingId === exp.experience_id}
                        onToggle={() => togglePublish(exp)}
                      />
                    </td>
                    <td className="px-6 py-4">
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

      <Modal open={creating} title="Créer une expérience" onClose={() => setCreating(false)}>
        <ExperienceForm
          onCreated={({ template, publicId }) => {
            setCreating(false)
            reload()
            const config = getTemplateConfig(template)
            // Templates avec assets requis → rappel actionnable ; sinon, simple succès.
            if (config.requiresAssets) {
              setAssetReminder({ publicId, assetsNeeded: config.assetsNeeded })
            } else {
              toast.success('Expérience créée en draft.')
            }
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={assetsExpId !== null}
        title={`Assets — ${assetsExpId ?? ''}`}
        onClose={() => setAssetsExpId(null)}
      >
        {assetsExpId && <AssetManager experienceId={assetsExpId} />}
      </Modal>

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

      <Modal
        open={assetReminder !== null}
        title="Expérience créée — assets requis"
        onClose={() => setAssetReminder(null)}
      >
        {assetReminder && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ✅ L'expérience <strong>{assetReminder.publicId}</strong> a été créée en{' '}
              <strong>brouillon</strong>. Ce template a besoin d'assets pour fonctionner
              correctement.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Assets à ajouter :</p>
              <ul className="mt-1 list-inside list-disc text-sm text-amber-700">
                {assetReminder.assetsNeeded.map((key) => (
                  <li key={key}>{assetLabel(key)}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500">
              Tu pourras publier l'expérience une fois les assets ajoutés.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssetReminder(null)}>
                Plus tard
              </Button>
              <Button
                icon={Images}
                onClick={() => {
                  setAssetReminder(null)
                  navigate('/admin/assets')
                }}
              >
                Aller aux Assets
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
