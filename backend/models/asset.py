"""Modèle ORM : table 'assets' (médias overlay/logo/badge/image/audio).

Un asset est rattaché SOIT à un lieu (`place_id`), SOIT à une expérience
(`experience_id`) — exactement un des deux (cf. CLAUDE.md section 7, décision S4 :
cahier des charges `place_id` + UML `experience_id` conciliés).
"""

from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.experience import Experience
    from models.place import Place


class AssetType(str, enum.Enum):
    """Types d'assets (union cahier des charges + UML, cf. section 7)."""

    overlay = "overlay"
    logo = "logo"
    badge = "badge"
    image = "image"
    audio = "audio"


class Asset(Base):
    """Un média rattaché à un lieu OU à une expérience (exactement un des deux)."""

    __tablename__ = "assets"
    __table_args__ = (
        # Garantit qu'exactement un des deux liens est renseigné (XOR).
        CheckConstraint(
            "(place_id IS NULL) <> (experience_id IS NULL)",
            name="ck_asset_exactly_one_owner",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    place_id: Mapped[int | None] = mapped_column(ForeignKey("places.id"), nullable=True)
    experience_id: Mapped[int | None] = mapped_column(
        ForeignKey("experiences.id"), nullable=True
    )
    type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    # Texte alternatif (accessibilité, cf. UML).
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)

    place: Mapped[Place | None] = relationship(back_populates="assets")
    experience: Mapped[Experience | None] = relationship(back_populates="assets")
