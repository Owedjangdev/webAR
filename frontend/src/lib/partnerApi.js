// Surface API de l'espace partenaire (lecture seule).
// Réutilise apiGet (Bearer auto + redirection login sur 401) : les routes
// /api/partner/* renvoient UNIQUEMENT les données du partenaire connecté
// (filtrées côté backend par owner_id, cf. scénario A3).

import { apiGet } from './apiClient.js'

/** Lieux rattachés au partenaire connecté. */
export const getPartnerPlaces = () => apiGet('/api/partner/places')

/** Expériences des lieux du partenaire (brouillons inclus). */
export const getPartnerExperiences = () => apiGet('/api/partner/experiences')

/** Statistiques agrégées (totaux, par expérience, série quotidienne). */
export const getPartnerStats = () => apiGet('/api/partner/stats')
