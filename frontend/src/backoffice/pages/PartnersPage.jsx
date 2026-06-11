import { useState } from 'react'
import { PauseCircle, PlayCircle, Plus, Users } from 'lucide-react'

import { apiGet, apiPut } from '../../lib/apiClient.js'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PartnerForm from '../components/PartnerForm.jsx'
import { useToast } from '../components/Toast.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchPartners = () => apiGet('/api/admin/partners')

export default function PartnersPage() {
  const { data, loading, error, reload } = useApiResource(fetchPartners)
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [rowError, setRowError] = useState(null)

  const toggleActive = async (partner) => {
    setRowError(null)
    setTogglingId(partner.id)
    try {
      const action = partner.is_active ? 'deactivate' : 'activate'
      await apiPut(`/api/admin/partners/${partner.id}/${action}`)
      reload()
      toast.success(partner.is_active ? 'Partenaire suspendu' : 'Partenaire réactivé')
    } catch (err) {
      setRowError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Partenaires"
        subtitle="Crée et gère les comptes des lieux partenaires (email réel + mot de passe)."
        action={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Créer un partenaire
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
            icon={Users}
            title="Aucun partenaire"
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Créer un partenaire
              </Button>
            }
          >
            Crée le premier compte partenaire : c'est l'admin qui fournit l'email et le mot de passe.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Lieux</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((partner) => (
                  <tr key={partner.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-800">{partner.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{partner.email}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {partner.places.length === 0
                        ? '—'
                        : partner.places.map((p) => p.name).join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip active={partner.is_active} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Button
                          variant={partner.is_active ? 'outline' : 'primary'}
                          icon={partner.is_active ? PauseCircle : PlayCircle}
                          loading={togglingId === partner.id}
                          onClick={() => toggleActive(partner)}
                          className="!px-3 !py-1.5"
                        >
                          {partner.is_active ? 'Suspendre' : 'Réactiver'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <Modal open={creating} title="Créer un partenaire" onClose={() => setCreating(false)}>
        <PartnerForm
          onCreated={() => {
            setCreating(false)
            reload()
            toast.success('Partenaire créé')
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  )
}

/** Pastille de statut du compte : Actif (vert) ou Suspendu (rouge). */
function StatusChip({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {active ? 'Actif' : 'Suspendu'}
    </span>
  )
}
