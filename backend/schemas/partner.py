"""Schémas Pydantic — gestion des comptes partenaires par l'administrateur.

L'admin crée le compte (email RÉEL + mot de passe), le rattache à des lieux, et
peut le suspendre/réactiver. Le mot de passe n'est jamais renvoyé.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PartnerPlaceOut(BaseModel):
    """Lieu rattaché à un partenaire (vue allégée)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str


class PartnerCreate(BaseModel):
    """Corps de POST /api/admin/partners."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=255)
    # Lieux à rattacher au partenaire (owner_id). Optionnel : rattachement possible plus tard.
    place_ids: list[int] = []


class PartnerOut(BaseModel):
    """Compte partenaire exposé à l'admin (sans le mot de passe)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str | None
    is_active: bool
    created_at: datetime
    places: list[PartnerPlaceOut] = []
