import { createElement } from 'react'

import { resolveTemplate } from '../templates/registry.js'

/**
 * Chargeur dynamique de template AR.
 * Lit le champ `template` du contrat JSON (CLAUDE.md section 6), résout le
 * composant correspondant via le registre, puis l'instancie avec les props
 * communes (place, assets, config). Chaque template gère ensuite sa propre
 * zone (caméra, badge, scan d'objet, étapes...) et son propre ScreenLayout.
 *
 * On passe par `createElement` car le composant est choisi dynamiquement à
 * partir de la donnée : la règle react-compiler interdit une balise JSX
 * `<Variable />` dont le type provient d'un appel de fonction.
 */
export default function ExperienceScreen({ experience }) {
  const { experience_id, template, place, assets, config } = experience

  // experience_id est exposé en `experienceId` : certains templates (ex. Badge)
  // en ont besoin comme clé de persistance (localStorage). Les autres l'ignorent.
  return createElement(resolveTemplate(template), {
    experienceId: experience_id,
    template,
    place,
    assets,
    config,
  })
}
