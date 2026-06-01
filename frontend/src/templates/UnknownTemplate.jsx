import { HelpCircle } from 'lucide-react'

import ARTemplateShell from './ARTemplateShell.jsx'

/**
 * Cas par défaut : le champ `template` du JSON ne correspond à aucun template connu.
 * On affiche quand même le lieu et la clé reçue pour faciliter le diagnostic.
 */
export default function UnknownTemplate({ place, config, template }) {
  return (
    <ARTemplateShell
      icon={HelpCircle}
      label="Template inconnu"
      accentBg="bg-slate-100"
      accentText="text-slate-600"
      place={place}
      config={config}
    >
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm text-slate-500">
          Aucun affichage n'est défini pour le template :
        </p>
        <p className="mt-2 font-mono text-sm font-semibold text-slate-700">
          {template ?? '(non précisé)'}
        </p>
      </div>
    </ARTemplateShell>
  )
}
