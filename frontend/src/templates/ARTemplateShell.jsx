import PlaceHeading from '../components/PlaceHeading.jsx'
import ScreenLayout from '../components/ScreenLayout.jsx'

/**
 * Cadre commun à TOUS les templates AR (base réutilisable, par composition).
 *
 * Affiche les éléments partagés du contrat JSON (section 6) :
 *  - un badge d'identité du template (icône + libellé, couleur d'accent) ;
 *  - le lieu (nom + ville) via PlaceHeading ;
 *  - le message de configuration (config.message) s'il est présent.
 *
 * La zone propre à chaque template est passée en `children` : c'est le seul
 * endroit qui change d'un template à l'autre, ce qui évite toute duplication.
 *
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} props.icon - icône du template.
 * @param {string} props.label - libellé lisible du template (ex. "Selfie Souvenir AR").
 * @param {string} props.accentBg - classes Tailwind du fond du badge (ex. "bg-amber-100").
 * @param {string} props.accentText - classes Tailwind du texte/icône du badge.
 * @param {{name: string, city: string}} props.place - lieu (contrat section 6).
 * @param {{message?: string, color?: string}} [props.config] - configuration libre.
 * @param {React.ReactNode} props.children - zone distinctive du template.
 */
export default function ARTemplateShell({
  icon: Icon,
  label,
  accentBg,
  accentText,
  place,
  config,
  children,
}) {
  return (
    <ScreenLayout>
      <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100">
        {/* Badge d'identité du template : rend chaque template reconnaissable. */}
        <span
          className={`mx-auto flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accentBg} ${accentText}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </span>

        <div className="mt-5">
          <PlaceHeading place={place} />
        </div>

        {config?.message && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
            {config.message}
          </p>
        )}

        {/* Zone distinctive propre au template. */}
        <div className="mt-6">{children}</div>
      </div>
    </ScreenLayout>
  )
}
