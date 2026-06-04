"""Schémas Pydantic des réponses d'administration (backoffice).

Distincts des schémas visiteur : l'admin a le droit de voir l'`id` interne des
entités (le contrat JSON visiteur, lui, reste figé — section 6).
"""

from pydantic import BaseModel, ConfigDict


class PlaceAdminOut(BaseModel):
    """Lieu exposé à l'admin (avec son id, contrairement au contrat visiteur)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str
