import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { apiGet, apiPost, uploadAsset } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import FormField, { CONTROL_CLASS } from './FormField.jsx'
import { useToast } from './Toast.jsx'
import { ErrorState, Loader } from './feedback.jsx'

const ASSET_TYPES = ['overlay', 'logo', 'badge', 'image', 'audio']

export default function AssetManager({ experienceId }) {
  const toast = useToast()
  const [assets, setAssets] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [type, setType] = useState('overlay')
  const [source, setSource] = useState('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [altText, setAltText] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setAssets(null)
    setLoadError(null)
    apiGet(`/api/assets/${experienceId}`)
      .then((data) => active && setAssets(data))
      .catch((err) => active && setLoadError(err.message))
    return () => {
      active = false
    }
  }, [experienceId, reloadKey])

  const handleAdd = async (event) => {
    event.preventDefault()
    setFormError(null)
    if (source === 'url' && !url.trim()) {
      setFormError("L'URL de l'asset est requise.")
      return
    }
    if (source === 'file' && !file) {
      setFormError('Choisis un fichier.')
      return
    }
    setSubmitting(true)
    try {
      if (source === 'file') {
        await uploadAsset(file, { experienceId, type, altText: altText.trim() || undefined })
      } else {
        await apiPost('/api/assets', {
          experience_id: experienceId,
          type,
          url: url.trim(),
          alt_text: altText.trim() || null,
        })
      }
      setUrl('')
      setFile(null)
      setAltText('')
      setReloadKey((k) => k + 1)
      toast.success('Asset ajouté')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Assets actuels</h3>
        {loadError && <ErrorState message={loadError} />}
        {!loadError && assets === null && <Loader label="Chargement des assets…" />}
        {!loadError &&
          assets &&
          (assets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-400">
              Aucun asset pour l'instant.
            </p>
          ) : (
            <ul className="space-y-2">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {asset.type}
                    </span>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                    >
                      {asset.url}
                    </a>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      asset.place_id
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {asset.place_id ? 'Lieu (hérité)' : 'Expérience'}
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </section>

      <form onSubmit={handleAdd} className="space-y-4 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-bold text-slate-700">Ajouter un asset</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" htmlFor="asset-type">
            <select
              id="asset-type"
              className={CONTROL_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ASSET_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Texte alternatif" htmlFor="asset-alt" hint="accessibilité (optionnel)">
            <input
              id="asset-alt"
              className={CONTROL_CLASS}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSource('url')}
            className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              source === 'url'
                ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Par URL
          </button>
          <button
            type="button"
            onClick={() => setSource('file')}
            className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              source === 'file'
                ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Depuis le bureau
          </button>
        </div>

        {source === 'url' ? (
          <FormField label="URL de l'asset" htmlFor="asset-url" hint="https://…">
            <input
              id="asset-url"
              type="url"
              className={CONTROL_CLASS}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://cdn.exemple.com/overlay.png"
            />
          </FormField>
        ) : (
          <FormField
            label="Fichier"
            htmlFor="asset-file"
            hint="Upload depuis ton ordinateur."
          >
            <input
              id="asset-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 file:transition-colors hover:file:bg-brand-100"
            />
          </FormField>
        )}
        {formError && <ErrorState message={formError} />}
        <div className="flex justify-end">
          <Button type="submit" icon={Plus} loading={submitting}>
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  )
}
