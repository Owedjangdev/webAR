// Source UNIQUE de vérité de la configuration des templates d'expérience.
//
// Pour chaque template : les champs config_json à saisir, et les assets requis
// pour qu'il fonctionne. Le formulaire de création ET le rappel d'assets lisent
// ce fichier — ne JAMAIS dupliquer cette info dans les composants.
//
// ⚠️ Les clés des champs (name) finissent telles quelles dans config_json :
// elles doivent rester cohérentes avec ce qu'attendent les templates frontend.

// Couleur par défaut raisonnable (bleu brand).
export const DEFAULT_COLOR = '#3B82F6'

// Champ couleur commun à tous les templates.
const colorField = { name: 'color', label: 'Couleur', type: 'color', required: false }

// Construit la définition d'un template « message + couleur » (cas le plus courant).
const messageTemplate = (label, messageLabel, placeholder, assets = null) => ({
  label,
  fields: [
    { name: 'message', label: messageLabel, type: 'text', placeholder, required: true },
    colorField,
  ],
  requiresAssets: assets !== null,
  assetsNeeded: assets ?? [],
})

// Définition par template (clé = valeur envoyée à l'API dans `template`).
export const TEMPLATE_CONFIG = {
  selfie_ar: messageTemplate(
    'Selfie AR',
    'Message (texte souvenir)',
    'Souvenir au Palmier',
    ['overlay_image', 'logo'],
  ),
  badge: messageTemplate(
    'Badge de lieu',
    'Message (texte de déblocage)',
    'Badge débloqué !',
    ['logo'],
  ),
  object_ar: {
    label: 'Objet AR',
    fields: [
      { name: 'title', label: 'Nom (produit / plat)', type: 'text', placeholder: 'Poulet braisé', required: true },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Spécialité de la maison…', required: false },
      { name: 'price', label: 'Prix', type: 'text', placeholder: '3500 FCFA', required: false },
      colorField,
    ],
    requiresAssets: false,
    assetsNeeded: [],
  },
  treasure_hunt: {
    label: 'Chasse au trésor',
    fields: [
      { name: 'reward_message', label: 'Message de récompense (finale)', type: 'text', placeholder: 'Bravo, tu as trouvé le trésor !', required: true },
      colorField,
    ],
    requiresAssets: false,
    assetsNeeded: [],
  },
  guide_narratif: {
    label: 'Guide narratif',
    fields: [
      { name: 'title', label: 'Nom du guide', type: 'text', placeholder: 'Kossi, gardien du palais', required: false },
      { name: 'narration', label: 'Récit (texte de narration)', type: 'textarea', placeholder: "Raconte l'histoire du lieu…", required: true },
      colorField,
    ],
    // Personnage et audio sont optionnels (repli avatar + texte) : pas bloquant
    // pour publier, conformément au statut « simplifié » du template.
    requiresAssets: false,
    assetsNeeded: [],
  },
  capsule_collective: messageTemplate('Capsule collective', 'Message', 'Laisse un mot pour les prochains visiteurs…'),
  portal_ar: messageTemplate('Portail AR', 'Message', 'Franchis le portail…'),
}

// Repli pour un template non reconnu : message + couleur, sans assets (ne plante pas).
export const FALLBACK_CONFIG = {
  label: 'Template',
  fields: [
    { name: 'message', label: 'Message', type: 'text', placeholder: '', required: false },
    colorField,
  ],
  requiresAssets: false,
  assetsNeeded: [],
}

// Libellés lisibles des assets, pour le rappel après création.
const ASSET_LABELS = {
  overlay_image: 'Overlay (image AR superposée)',
  logo: 'Logo',
  character: 'Personnage 2D (guide)',
  narration_audio: 'Audio de narration',
}

/** Clés de templates connues, pour alimenter la liste déroulante (ordre stable). */
export const TEMPLATE_KEYS = Object.keys(TEMPLATE_CONFIG)

/** Config d'un template (repli sûr si le template est inconnu). */
export function getTemplateConfig(template) {
  return TEMPLATE_CONFIG[template] ?? FALLBACK_CONFIG
}

/** Libellé lisible d'un asset requis (ex. "overlay_image" → "Overlay …"). */
export function assetLabel(key) {
  return ASSET_LABELS[key] ?? key
}
