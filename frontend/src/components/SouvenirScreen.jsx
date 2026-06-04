import { useState } from 'react'
import { ArrowLeft, Calendar, Check, Download, MapPin, RotateCcw, Share2, Sparkles } from 'lucide-react'

import { downloadSouvenir, shareSouvenir } from '../lib/souvenir.js'

const FILENAME = 'souvenir.png'

// Date du jour formatée en français (ex. "24 octobre 2023").
const TODAY = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Écran du souvenir capturé : aperçu de l'image + partage / téléchargement /
 * reprise. Le message du lieu est déjà incrusté dans l'image (useCanvas) : on
 * ne le réaffiche donc pas par-dessus la photo, seulement les métadonnées.
 */
export default function SouvenirScreen({ image, place, config, onRetake }) {
  const [notice, setNotice] = useState(null)
  const [sharing, setSharing] = useState(false)

  const shareText = place
    ? `Souvenir à ${place.name}, ${place.city}`
    : (config?.message ?? 'Mon souvenir')

  const handleShare = async () => {
    setSharing(true)
    try {
      const result = await shareSouvenir(image, {
        title: config?.message ?? 'Mon souvenir',
        text: shareText,
        filename: FILENAME,
      })
      if (result === 'shared') setNotice('Souvenir partagé')
      else if (result === 'downloaded') setNotice('Partage indisponible — souvenir téléchargé')
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = () => {
    downloadSouvenir(image, FILENAME)
    setNotice('Souvenir téléchargé')
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-100">
      {/* En-tête de marque. */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onRetake}
          aria-label="Retour à la caméra"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-brand-600 outline-none transition hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-brand-600">Landmark Discovery</span>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 space-y-5 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Titre de réussite. */}
        <div className="flex items-center gap-2.5 pt-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <Sparkles className="h-5 w-5 text-brand-600" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-800">Ton souvenir est prêt</h1>
            <p className="text-sm text-slate-500">Partage-le ou garde-le précieusement.</p>
          </div>
        </div>

        {/* Carte aperçu : la photo porte déjà le logo + le message incrustés. */}
        <figure className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-slate-200">
          {place?.city && (
            <figcaption className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {place.city}
            </figcaption>
          )}
          <img src={image} alt="Ton selfie souvenir" className="w-full object-cover" />
        </figure>

        {/* Métadonnées sous la photo (pas de texte par-dessus l'image). */}
        {place && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-brand-600" />
              {place.name}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" />
              {TODAY}
            </span>
          </div>
        )}

        {/* Confirmation après partage / téléchargement. */}
        {notice && (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-center text-sm font-medium text-brand-700">
            <Check className="h-4 w-4" />
            {notice}
          </p>
        )}

        {/* Actions principales. */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-5 w-5" />
            {sharing ? 'Partage…' : 'Partager'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-brand-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download className="h-5 w-5" />
            Télécharger
          </button>
        </div>

        {/* Reprendre la photo. */}
        <button
          type="button"
          onClick={onRetake}
          className="mx-auto flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 outline-none transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <RotateCcw className="h-4 w-4" />
          Reprendre la photo
        </button>
      </div>
    </main>
  )
}
