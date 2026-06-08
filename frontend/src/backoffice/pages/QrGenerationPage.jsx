import { useState } from 'react'
import { CheckCircle2, Copy, Download, QrCode, RefreshCw } from 'lucide-react'

import { API_BASE_URL } from '../../lib/api.js'
import { apiGet, apiPost } from '../../lib/apiClient.js'
import Button from '../components/Button.jsx'
import FormField, { CONTROL_CLASS } from '../components/FormField.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { EmptyState, ErrorState, Loader } from '../components/feedback.jsx'
import { useApiResource } from '../hooks/useApiResource.js'

const fetchExperiences = () => apiGet('/api/admin/experiences')

/**
 * Page Génération QR : on choisit une expérience, le QR est (re)généré
 * (POST /api/qr/{id}), on voit son URL publique + l'aperçu PNG (GET /api/qr/{id})
 * et on le télécharge à imprimer. Inspiré de la maquette « Génération QR ».
 */
export default function QrGenerationPage() {
  const { data, loading, error } = useApiResource(fetchExperiences)
  const [selected, setSelected] = useState('')
  const [qr, setQr] = useState(null) // { experience_id, url, image_url }
  const [genError, setGenError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [imgVersion, setImgVersion] = useState(0)
  const [copied, setCopied] = useState(false)

  const generate = async (experienceId) => {
    setGenError(null)
    setGenerating(true)
    try {
      const result = await apiPost(`/api/qr/${experienceId}`)
      setQr(result)
      setImgVersion((v) => v + 1) // force le rechargement de l'image
    } catch (err) {
      setGenError(err.message)
      setQr(null)
    } finally {
      setGenerating(false)
    }
  }

  const handleSelect = (experienceId) => {
    setSelected(experienceId)
    setQr(null)
    setGenError(null)
    if (experienceId) generate(experienceId)
  }

  const copyUrl = () => {
    if (!qr) return
    navigator.clipboard?.writeText(qr.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const imgSrc = selected ? `${API_BASE_URL}/api/qr/${selected}?v=${imgVersion}` : null

  return (
    <div>
      <PageHeader
        title="Génération QR"
        subtitle="Génère et télécharge le QR code d'une expérience, prêt à imprimer."
      />

      {loading && <Loader />}
      {error && <ErrorState message={error} />}

      {!loading &&
        !error &&
        (data.length === 0 ? (
          <EmptyState icon={QrCode} title="Aucune expérience">
            Crée d'abord une expérience pour générer son QR code.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Configuration */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="mb-4 text-lg font-bold text-slate-800">Configuration</h2>
              <FormField label="Sélectionner une expérience" htmlFor="qr-exp">
                <select
                  id="qr-exp"
                  className={CONTROL_CLASS}
                  value={selected}
                  onChange={(e) => handleSelect(e.target.value)}
                >
                  <option value="">— Sélectionner une expérience —</option>
                  {data.map((exp) => (
                    <option key={exp.experience_id} value={exp.experience_id}>
                      {exp.experience_id} — {exp.place?.name}
                    </option>
                  ))}
                </select>
              </FormField>

              {genError && (
                <div className="mt-4">
                  <ErrorState message={genError} />
                </div>
              )}

              {qr && (
                <div className="mt-5 space-y-4">
                  <FormField label="URL publique de l'expérience" htmlFor="qr-url">
                    <div className="flex gap-2">
                      <input id="qr-url" readOnly value={qr.url} className={`${CONTROL_CLASS} flex-1`} />
                      <Button variant="outline" icon={Copy} onClick={copyUrl} className="!px-3">
                        {copied ? 'Copié' : 'Copier'}
                      </Button>
                    </div>
                  </FormField>

                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="font-medium">Statut : prêt à imprimer</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`${API_BASE_URL}/api/qr/${selected}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
                    >
                      <Download className="h-5 w-5" />
                      Télécharger PNG
                    </a>
                    <Button variant="outline" icon={RefreshCw} loading={generating} onClick={() => generate(selected)}>
                      Régénérer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Aperçu */}
            <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-6 ring-1 ring-slate-100">
              {generating && <Loader label="Génération…" />}
              {!generating && imgSrc && (
                <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200">
                  <img src={imgSrc} alt={`QR code de ${selected}`} className="mx-auto h-56 w-56" />
                  <p className="mt-4 font-semibold text-slate-800">Scannez pour explorer</p>
                  <p className="text-sm text-slate-500">{selected}</p>
                </div>
              )}
              {!generating && !imgSrc && (
                <p className="text-sm text-slate-400">Sélectionne une expérience pour voir son QR.</p>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
