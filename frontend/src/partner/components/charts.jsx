// Graphiques SVG maison, sans dépendance (cible Chrome >= 80, mobile entry-level).
// - LineChart : série temporelle à deux courbes (scans / captures).
// - BarRow    : barre horizontale proportionnelle (détail par expérience).

const BRAND = '#4f46e5' // scans (indigo de marque)
const EMERALD = '#10b981' // captures

/**
 * Courbe d'évolution à deux séries sur un repère normalisé (viewBox 0..100 x
 * 0..H). Le SVG est responsive (largeur 100 %), les coordonnées sont calculées
 * sur une grille fixe — pas de mesure DOM nécessaire.
 *
 * @param {{date:string,scans:number,captures:number}[]} data
 */
export function LineChart({ data }) {
  const H = 40 // hauteur logique du tracé (le viewBox vaut 100 x 48 avec marge)
  const PAD_BOTTOM = 8
  const points = data ?? []

  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Aucune donnée à afficher.</p>
  }

  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.scans, p.captures)))
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 0

  // Construit la suite de points "x,y" d'une série pour un <polyline>.
  const toLine = (key) =>
    points
      .map((p, i) => {
        const x = points.length > 1 ? i * stepX : 50
        const y = H - (p[key] / maxValue) * H
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')

  const labelDates = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]]

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${H + PAD_BOTTOM}`}
        preserveAspectRatio="none"
        className="h-44 w-full"
        role="img"
        aria-label="Évolution des scans et captures"
      >
        {/* Lignes de repère horizontales (0 %, 50 %, 100 %).
            vectorEffect=non-scaling-stroke : épaisseur en pixels réels malgré le
            viewBox étiré (preserveAspectRatio=none) → traits fins et nets. */}
        {[0, 0.5, 1].map((r) => (
          <line
            key={r}
            x1="0"
            x2="100"
            y1={H - r * H}
            y2={H - r * H}
            stroke="#eef0f6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polyline
          fill="none"
          stroke={BRAND}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={toLine('scans')}
        />
        <polyline
          fill="none"
          stroke={EMERALD}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={toLine('captures')}
        />
      </svg>

      {/* Étiquettes de dates (début / milieu / fin). */}
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        {labelDates.map((p, i) => (
          <span key={i}>{formatDay(p.date)}</span>
        ))}
      </div>

      {/* Légende. */}
      <div className="mt-3 flex items-center justify-center gap-5 text-xs font-medium text-slate-600">
        <Legend color={BRAND} label="Scans" />
        <Legend color={EMERALD} label="Captures" />
      </div>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

/** Barre horizontale proportionnelle (valeur / max), pour un classement. */
export function BarRow({ label, sublabel, value, max, color = BRAND }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-40 min-w-0">
        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
        {sublabel && <p className="truncate text-xs text-slate-400">{sublabel}</p>}
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-700">{value}</span>
    </div>
  )
}

/** "2026-06-12" -> "12 juin". */
function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
