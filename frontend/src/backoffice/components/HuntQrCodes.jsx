import { useEffect, useRef, useState } from 'react'
import { Download, Flag, Loader2, Printer } from 'lucide-react'

import { API_BASE_URL } from '../../lib/api.js'
import { apiGet, apiGetObjectUrl } from '../../lib/apiClient.js'
import Button from './Button.jsx'
import { ErrorState, Loader } from './feedback.jsx'

/**
 * Affiche les QR d'une chasse à imprimer : départ + 1 par étape (avec son code
 * en clair pour le repli « saisie manuelle »). Partagé entre l'admin et le
 * partenaire via `basePath` (les QR d'étapes sont protégés par auth -> chargés
 * en blob). Optionnellement imprimable (bouton + styles print).
 *
 * @param {string} basePath - '/api/admin/hunt' (admin) ou '/api/partner/hunt'.
 */
export default function HuntQrCodes({ experienceId, basePath, printable = false }) {
  const [phase, setPhase] = useState('loading') // 'loading' | 'ready' | 'error' | 'none'
  const [error, setError] = useState(null)
  const [hunt, setHunt] = useState(null)
  const [qrUrls, setQrUrls] = useState({})
  const objectUrls = useRef([])

  useEffect(() => {
    let active = true
    const urls = objectUrls.current
    ;(async () => {
      try {
        const data = await apiGet(`${basePath}/${experienceId}`)
        if (!active) return
        setHunt(data)
        const entries = await Promise.all(
          data.steps.map(async (step) => {
            const url = await apiGetObjectUrl(`${basePath}/${experienceId}/step/${step.step_order}/qr.png`)
            urls.push(url)
            return [step.step_order, url]
          }),
        )
        if (!active) return
        setQrUrls(Object.fromEntries(entries))
        setPhase('ready')
      } catch (err) {
        if (!active) return
        // 404 = chasse pas encore configurée par l'admin.
        if (/aucune chasse/i.test(err.message)) setPhase('none')
        else {
          setError(err.message)
          setPhase('error')
        }
      }
    })()
    return () => {
      active = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      objectUrls.current = []
    }
  }, [experienceId, basePath])

  if (phase === 'loading') return <Loader label="Préparation des QR…" />
  if (phase === 'error') return <ErrorState message={error} />
  if (phase === 'none') {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        Aucune chasse configurée pour cette expérience. L'administrateur doit d'abord la créer.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {printable && (
        <div className="flex items-center justify-between print:hidden">
          <p className="text-sm text-slate-500">
            Imprime et colle le départ à l'entrée, chaque étape à l'endroit de son indice.
          </p>
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>
            Imprimer la feuille
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QrTile
          label="Départ — à l'entrée"
          sub="Lance la chasse"
          start
          img={`${API_BASE_URL}/api/qr/${experienceId}`}
          downloadHref={`${API_BASE_URL}/api/qr/${experienceId}`}
          downloadName={`${experienceId}-depart.png`}
        />
        {hunt.steps.map((step) => (
          <QrTile
            key={step.step_order}
            label={`Étape ${step.step_order} — ${step.title}`}
            sub={step.hint}
            code={step.validation_code}
            img={qrUrls[step.step_order]}
            downloadHref={qrUrls[step.step_order]}
            downloadName={`${experienceId}-etape-${step.step_order}.png`}
          />
        ))}
      </div>
    </div>
  )
}

/** Une tuile QR (départ ou étape) : image + libellé + code + téléchargement. */
function QrTile({ label, sub, code, img, downloadHref, downloadName, start = false }) {
  return (
    <div className="flex flex-col break-inside-avoid rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-800">
        {start ? <Flag className="h-4 w-4 text-brand-600" /> : null}
        {label}
      </p>
      {sub && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{sub}</p>}
      <div className="my-3 flex justify-center">
        {img ? (
          <img src={img} alt={`QR ${label}`} className="h-36 w-36 rounded-lg bg-white p-1 ring-1 ring-slate-100" />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      {code && (
        <p className="mb-3 font-mono text-sm font-bold tracking-widest text-slate-700">Code : {code}</p>
      )}
      {downloadHref && (
        <a
          href={downloadHref}
          download={downloadName}
          className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-400 print:hidden"
        >
          <Download className="h-4 w-4" /> Télécharger
        </a>
      )}
    </div>
  )
}
