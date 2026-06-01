// Hauteurs relatives des barres (motif "égaliseur" de la maquette).
const BAR_HEIGHTS = [16, 24, 32, 24, 16]

/**
 * Barres animées facon égaliseur, indiquant le chargement.
 */
export default function LoadingBars() {
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="w-1.5 origin-bottom rounded-full bg-brand-400 animate-equalize"
          style={{ height, animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </div>
  )
}
