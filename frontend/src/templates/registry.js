import BadgeTemplate from './BadgeTemplate.jsx'
import ObjectInteractiveTemplate from './ObjectInteractiveTemplate.jsx'
import SelfieSouvenirTemplate from './SelfieSouvenirTemplate.jsx'
import TreasureHuntTemplate from './TreasureHuntTemplate.jsx'
import UnknownTemplate from './UnknownTemplate.jsx'

/**
 * Registre des templates AR : clé `template` du contrat JSON (CLAUDE.md section 6)
 * -> composant React à instancier.
 *
 * Pour ajouter un template, il suffit d'ajouter une ligne ici : aucune logique
 * de sélection à modifier ailleurs (principe ouvert/fermé, pas de `switch` dispersé).
 */
const TEMPLATE_REGISTRY = {
  selfie_ar: SelfieSouvenirTemplate,
  badge: BadgeTemplate,
  object_ar: ObjectInteractiveTemplate,
  treasure_hunt: TreasureHuntTemplate,
}

/**
 * Résout le composant à afficher à partir de la clé `template`.
 * Retourne UnknownTemplate (cas par défaut) si la clé est absente ou inconnue,
 * pour ne jamais casser l'affichage face à une expérience non gérée.
 *
 * @param {string} [template] - clé `template` reçue du backend.
 * @returns {import('react').ComponentType<{place: object, assets?: object, config?: object, template?: string}>}
 */
export function resolveTemplate(template) {
  return TEMPLATE_REGISTRY[template] ?? UnknownTemplate
}
