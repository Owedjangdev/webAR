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

export default function QrGenerationPage() {
  const { data, loading, error } = useApiResource(fetchExperiences)
  const [selected, setSelected] = useState('')
  const [qr, setQr] = useState(null)
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
      setImgVersion((v) => v + 1)
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-800">Configuration</h2>
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

                  <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
                    Statut : prêt à imprimer
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`${API_BASE_URL}/api/qr/${selected}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/30 hover:brightness-110"
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

            <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100 p-8">
              {generating && <Loader label="Génération…" />}
              {!generating && imgSrc && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
                  <img src={imgSrc} alt={`QR code de ${selected}`} className="mx-auto h-56 w-56" />
                  <p className="mt-5 font-semibold text-slate-800">Scannez pour explorer</p>
                  <p className="mt-0.5 text-sm text-slate-400">{selected}</p>
                </div>
              )}
              {!generating && !imgSrc && (
                <div className="text-center">
                  <QrCode className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-400">Sélectionne une expérience pour voir son QR.</p>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
