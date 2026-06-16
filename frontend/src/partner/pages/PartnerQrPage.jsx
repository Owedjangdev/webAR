import { useState } from 'react'
import { Compass, Download, QrCode } from 'lucide-react'

import { API_BASE_URL } from '../../lib/api.js'
import { getPartnerExperiences } from '../../lib/partnerApi.js'
import Button from '../../backoffice/components/Button.jsx'
import HuntQrCodes from '../../backoffice/components/HuntQrCodes.jsx'
import Modal from '../../backoffice/components/Modal.jsx'
import PageHeader from '../../backoffice/components/PageHeader.jsx'
import StatusBadge from '../../backoffice/components/StatusBadge.jsx'
import { EmptyState, ErrorState, Loader } from '../../backoffice/components/feedback.jsx'
import { useApiResource } from '../../backoffice/hooks/useApiResource.js'

export default function PartnerQrPage() {
  const { data, loading, error } = useApiResource(getPartnerExperiences)
  const [huntExpId, setHuntExpId] = useState(null) // chasse dont on affiche les QR

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />

  const expList = data ?? []

  return (
    <div>
      <PageHeader
        title="Mes QR codes"
        subtitle="Consulte et télécharge les QR codes de tes expériences, prêts à imprimer."
      />

      {expList.length === 0 ? (
        <EmptyState icon={QrCode} title="Aucune expérience">
          Aucune expérience n'est encore associée à tes lieux.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {expList.map((exp) => (
            <QrCard key={exp.experience_id} experience={exp} onOpenHunt={setHuntExpId} />
          ))}
        </div>
      )}

      {/* Tous les QR d'une chasse (départ + étapes) + impression. */}
      <Modal
        open={huntExpId !== null}
        title={`QR de la chasse — ${huntExpId ?? ''}`}
        onClose={() => setHuntExpId(null)}
      >
        {huntExpId && (
          <HuntQrCodes experienceId={huntExpId} basePath="/api/partner/hunt" printable />
        )}
      </Modal>
    </div>
  )
}

/** Carte d'une expérience : aperçu du QR de départ + téléchargement, et pour une
 *  chasse, un accès aux QR de toutes les étapes (à imprimer). */
function QrCard({ experience, onOpenHunt }) {
  const [unavailable, setUnavailable] = useState(false)
  const id = experience.experience_id
  const isHunt = experience.template === 'treasure_hunt'
  const imgSrc = `${API_BASE_URL}/api/qr/${id}`

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        {unavailable ? (
          <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400">
            <QrCode className="h-8 w-8" />
            <span className="px-2 text-xs">QR pas encore généré</span>
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={`QR code de ${id}`}
            className="h-40 w-40 rounded-xl bg-white p-2 shadow"
            onError={() => setUnavailable(true)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{id}</p>
            <p className="truncate text-sm text-slate-500">{experience.place?.name}</p>
          </div>
          <StatusBadge status={experience.status} />
        </div>

        {unavailable ? (
          <p className="mt-auto text-xs text-slate-400">
            Demande à ton administrateur de générer le QR de cette expérience.
          </p>
        ) : (
          <a
            href={imgSrc}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/30 hover:brightness-110"
          >
            <Download className="h-4 w-4" />
            QR de départ
          </a>
        )}

        {isHunt && (
          <Button variant="outline" icon={Compass} onClick={() => onOpenHunt(id)} className="w-full">
            QR de la chasse (départ + étapes)
          </Button>
        )}
      </div>
    </div>
  )
}
