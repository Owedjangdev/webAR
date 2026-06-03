"""Schémas Pydantic v2 des assets (corps de POST + réponse)."""

from typing import Annotated

from pydantic import BaseModel, Field, HttpUrl, model_validator

from models import AssetType


class AssetCreate(BaseModel):
    """Corps de POST /api/assets.

    L'asset est rattaché soit à une **expérience** (`experience_id`, identifiant
    public ex. "exp_001"), soit à un **lieu** (`place_id`, entier) : exactement un
    des deux est requis. `url` est validée (format URL) et `type` doit appartenir
    à l'énumération autorisée (sinon 422).
    """

    experience_id: Annotated[str, Field(min_length=1)] | None = None
    place_id: Annotated[int, Field(gt=0)] | None = None
    type: AssetType
    url: HttpUrl
    alt_text: str | None = None

    @model_validator(mode="after")
    def _check_owner(self) -> "AssetCreate":
        """Garantit qu'on fournit soit experience_id, soit place_id — pas les deux."""
        if (self.experience_id is None) == (self.place_id is None):
            raise ValueError("Fournir exactement un de 'experience_id' ou 'place_id'.")
        return self


class AssetOut(BaseModel):
    """Asset tel que renvoyé par l'API."""

    id: int
    experience_id: str | None  # identifiant public de l'expérience (ex. "exp_001")
    place_id: int | None
    type: AssetType
    url: str
    alt_text: str | None
