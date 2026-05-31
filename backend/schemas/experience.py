"""Schémas Pydantic v2 des réponses liées aux expériences.

ExperienceDetail reproduit STRICTEMENT le contrat JSON de la section 6 du CLAUDE.md.
Ne pas modifier sa structure sans accord écrit du binôme (contrat figé en S2).
"""

from pydantic import BaseModel


class PlaceOut(BaseModel):
    """Lieu tel qu'exposé dans le contrat JSON : { "name", "city" }."""

    name: str
    city: str


class ExperienceAssets(BaseModel):
    """Bloc 'assets' du contrat JSON : URLs des médias de l'expérience."""

    overlay_image: str | None = None
    logo: str | None = None


class ExperienceDetail(BaseModel):
    """Contrat JSON complet renvoyé par GET /api/experience/{id} (section 6)."""

    experience_id: str
    template: str
    place: PlaceOut
    assets: ExperienceAssets
    config: dict


class ExperienceSummary(BaseModel):
    """Résumé d'expérience pour la liste GET /api/experiences.

    Cette liste n'est pas figée par le contrat (section 6) : forme libre, allégée.
    """

    experience_id: str
    template: str
    place: PlaceOut
    active: bool
