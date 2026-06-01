"""Schémas Pydantic v2 des réponses liées aux expériences.

ExperienceDetail reproduit STRICTEMENT le contrat JSON de la section 6 du CLAUDE.md.
Ne pas modifier sa structure sans accord écrit du binôme (contrat figé en S2).
"""

from pydantic import BaseModel, model_validator


class PlaceOut(BaseModel):
    """Lieu tel qu'exposé dans le contrat JSON : { "name", "city" }."""

    name: str
    city: str


class ExperienceAssets(BaseModel):
    """Bloc 'assets' du contrat JSON : URLs des médias de l'expérience."""

    overlay_image: str | None = None
    logo: str | None = None


# ---------------------------------------------------------------------------
# Schémas de REQUÊTE (POST / PUT). Ils valident le corps envoyé par l'admin.
# Ils sont distincts des schémas de RÉPONSE ci-dessus : la réponse reste figée
# par le contrat JSON (section 6), la requête est un détail d'implémentation.
# ---------------------------------------------------------------------------


class PlaceIn(BaseModel):
    """Lieu à créer en même temps que l'expérience (alternative à place_id)."""

    name: str
    city: str


class ExperienceCreate(BaseModel):
    """Corps de POST /api/experience.

    Le lieu est soit référencé via `place_id` (lieu existant), soit créé via
    l'objet `place` : exactement un des deux est requis (cf. _check_place).
    `public_id` est optionnel ; s'il est absent, il est généré automatiquement.
    """

    public_id: str | None = None
    template: str
    place_id: int | None = None
    place: PlaceIn | None = None
    assets: ExperienceAssets = ExperienceAssets()
    config: dict = {}
    active: bool = True

    @model_validator(mode="after")
    def _check_place(self) -> "ExperienceCreate":
        """Garantit qu'on fournit soit place_id, soit place — mais pas les deux."""
        if (self.place_id is None) == (self.place is None):
            raise ValueError("Fournir exactement un de 'place_id' ou 'place'.")
        return self


class ExperienceUpdate(BaseModel):
    """Corps de PUT /api/experience/{id} : mise à jour partielle.

    Tous les champs sont optionnels ; seuls les champs fournis sont modifiés.
    Le lieu (place) n'est pas modifiable ici : cela relève d'un endpoint /places
    dédié (séparation des responsabilités).
    """

    template: str | None = None
    config: dict | None = None
    assets: ExperienceAssets | None = None
    active: bool | None = None


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
