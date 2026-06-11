"""Schémas Pydantic du backoffice admin : réponses ET corps de création.

Distincts des schémas visiteur : l'admin voit l'`id` interne et crée les entités.
Le contrat JSON visiteur (section 6) reste figé et n'est pas impacté.
"""

import enum
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models import ExperienceStatus


class TemplateKey(str, enum.Enum):
    """Clés de template autorisées (CLAUDE.md section 9).

    Utilisée à la création d'expérience : toute autre valeur est rejetée par la
    validation Pydantic (422), sans requête en base.
    """

    selfie_ar = "selfie_ar"
    badge = "badge"
    object_ar = "object_ar"
    treasure_hunt = "treasure_hunt"
    guide_narratif = "guide_narratif"
    capsule_collective = "capsule_collective"
    portal_ar = "portal_ar"


class PlaceCreate(BaseModel):
    """Corps de POST /api/admin/places."""

    name: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    type: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    description: str | None = None
    # Partenaire propriétaire (optionnel ; rattachement possible plus tard).
    owner_id: int | None = None


class PlaceUpdate(BaseModel):
    """Corps de PUT /api/admin/places/{id} : mise à jour partielle.

    Tous les champs sont optionnels ; seuls ceux fournis sont modifiés.
    `owner_id` peut valoir un id de partenaire (rattacher) — pour détacher, on
    ne le fournit simplement pas (la modification explicite à NULL n'est pas gérée ici).
    """

    name: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    type: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    description: str | None = None
    owner_id: int | None = None


class PlaceAdminOut(BaseModel):
    """Lieu exposé à l'admin (id + created_at, en plus du contrat visiteur)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str
    type: str | None = None
    address: str | None = None
    description: str | None = None
    owner_id: int | None = None
    created_at: datetime


class AdminExperienceCreate(BaseModel):
    """Corps de POST /api/admin/experiences.

    Le statut n'est PAS choisi par le client : l'expérience est toujours créée en
    `draft`, puis publiée via /publish (règle métier).
    """

    public_id: str = Field(min_length=1, max_length=50)
    place_id: int
    template: TemplateKey
    config_json: dict = {}


class AdminExperienceOut(BaseModel):
    """Expérience telle qu'enregistrée en base (colonnes réelles, dont le statut)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    place_id: int
    template: str
    config_json: dict
    status: ExperienceStatus
