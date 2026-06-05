import { useEffect, useRef, useState } from 'react'
import { Award, Check, Download, Share2, Sparkles } from 'lucide-react'

import { renderBadgeCard } from '../lib/badgeImage.js'
import { isBadgeUnlocked, unlockBadge } from '../lib/badgeStorage.js'
import { downloadSouvenir, shareSouvenir } from '../lib/souvenir.js'
import ARTemplateShell from './ARTemplateShell.jsx'

const DEFAULT_POINTS = 50
const FILENAME = 'badge.png'

/**
 * Template "badge" — Badge de Lieu (gamification, SANS caméra).
 * Affiche un médaillon débloqué avec animation, gère 1ʳᵉ visite / retour via
 * localStorage, et permet de partager/télécharger la carte du badge (image).
 */
export default function BadgeTemplate({ experienceId, place, assets, config }) {
  // 1ʳᵉ visite capturée UNE fois au montage (avant persistance), pour rester
  // stable pendant toute la session même après l'enregistrement localStorage.
  const [firstVisit] = useState(() => !isBadgeUnlocked(experienceId))
  const [badgeOk, setBadgeOk] = useState(true) // asset badge chargé sans erreur
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [notice, setNotice] = useState(null)
  const [sharing, setSharing] = useState(false)
  const badgeImgRef = useRef(null)

  const points = config?.points ?? DEFAULT_POINTS
  const hasBadgeImg = Boolean(assets?.badge) && badgeOk

  // Persiste le déblocage à la première visite (effet de bord, hors rendu).
  useEffect(() => {
    if (firstVisit && !unlockBadge(experienceId)) {
      setStorageBlocked(true)
    }
  }, [firstVisit, experienceId])

  // Construit l'image partageable de la carte du badge (null si export impossible).
  const buildImage = () =>
    renderBadgeCard({
      badgeImg: hasBadgeImg ? badgeImgRef.current : null,
      placeName: place.name,
      city: place.city,
      points,
    })

  const handleShare = async () => {
    const image = buildImage()
    if (!image) {
      setNotice("Image du badge indisponible (l'asset n'autorise pas l'export).")
      return
    }
    setSharing(true)
    try {
      const result = await shareSouvenir(image, {
        title: `Badge ${place.name}`,
        text: `J'ai débloqué le badge « ${place.name} » sur Landmark Discovery !`,
        filename: FILENAME,
      })
      if (result === 'shared') setNotice('Badge partagé')
      else if (result === 'downloaded') setNotice('Partage indisponible — badge téléchargé')
      else setNotice(null)
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = () => {
    const image = buildImage()
    if (!image) {
      setNotice("Image du badge indisponible (l'asset n'autorise pas l'export).")
      return
    }
    downloadSouvenir(image, FILENAME)
    setNotice('Badge téléchargé')
  }

  return (
    <ARTemplateShell
      icon={Award}
      label="Badge de Lieu"
      accentBg="bg-amber-100"
      accentText="text-amber-700"
      place={place}
      config={config}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Médaillon doré + halo qui éclate à la 1ʳᵉ visite. */}
        <div className="relative flex items-center justify-center">
          {firstVisit && (
            <span
              aria-hidden="true"
              className="absolute h-36 w-36 rounded-full bg-amber-300/60 blur-2xl motion-safe:animate-badge-burst"
            />
          )}
          <div
            className={`relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-white shadow-xl shadow-amber-500/40 ring-4 ring-amber-100 ${
              firstVisit ? 'motion-safe:animate-badge-pop' : 'motion-safe:animate-rise-in'
            }`}
          >
            {hasBadgeImg ? (
              <img
                ref={badgeImgRef}
                src={assets.badge}
                alt={`Badge ${place.name}`}
                crossOrigin="anonymous"
                onError={() => setBadgeOk(false)}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Award className="h-16 w-16 drop-shadow-sm" />
                {/* Liseré interne + reflet : rendu « médaille » soigné (statique). */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-white/25"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-3 left-5 h-12 w-12 rounded-full bg-white/30 blur-md"
                />
              </>
            )}
          </div>
        </div>

        {/* Titre + sous-titre selon 1ʳᵉ visite ou retour. */}
        <div className="motion-safe:animate-rise-in">
          <h2 className="text-xl font-bold text-slate-800">
            {firstVisit ? 'Badge débloqué !' : 'Content de vous revoir !'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {firstVisit ? 'Bravo, tu viens de débloquer ce badge.' : 'Tu as déjà débloqué ce badge.'}
          </p>
        </div>

        {/* Points : chip dorée marquée à la 1ʳᵉ visite, version sobre au retour. */}
        <span
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold motion-safe:animate-rise-in ${
            firstVisit
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {firstVisit ? `+${points} points de découverte` : 'Points déjà gagnés'}
        </span>

        {/* Fallback : storage indisponible (navigation privée…). */}
        {storageBlocked && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">
            Stockage indisponible : ce badge ne sera pas mémorisé pour ta prochaine visite.
          </p>
        )}

        {/* Confirmation après partage / téléchargement. */}
        {notice && (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
            <Check className="h-4 w-4" />
            {notice}
          </p>
        )}

        {/* Partage / téléchargement de la carte du badge (logique réutilisée du Selfie). */}
        <div className="flex w-full gap-3">
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
      </div>
    </ARTemplateShell>
  )
}
