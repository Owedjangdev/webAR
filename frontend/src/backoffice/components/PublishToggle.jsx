/**
 * Interrupteur de publication d'une expérience : OFF = brouillon, ON = publiée.
 * Un clic bascule l'état (publish / unpublish). Le libellé texte accompagne
 * toujours la couleur (l'état ne dépend pas que de la couleur — accessibilité).
 */
export default function PublishToggle({ published, loading, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={published ? 'Dépublier l’expérience' : 'Publier l’expérience'}
      disabled={loading}
      onClick={onToggle}
      className={`group inline-flex items-center gap-2 outline-none ${loading ? '' : 'cursor-pointer'}`}
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-brand-300 ${
          published ? 'bg-emerald-500' : 'bg-slate-300'
        } ${loading ? 'opacity-60' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            published ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      <span
        className={`text-xs font-semibold ${published ? 'text-emerald-700' : 'text-slate-500'}`}
      >
        {loading ? '…' : published ? 'Publiée' : 'Brouillon'}
      </span>
    </button>
  )
}
