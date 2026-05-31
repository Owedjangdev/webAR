"""Modèle ORM : table 'assets' (médias overlay/logo/badge/audio d'un lieu)."""

from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.place import Place


class AssetType(str, enum.Enum):
    """Types d'assets rattachés à un lieu (cf. schéma section 7 du CLAUDE.md)."""

    overlay = "overlay"
    logo = "logo"
    badge = "badge"
    audio = "audio"


class Asset(Base):
    """Un média (overlay, logo, badge, audio) rattaché à un lieu."""

    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id"), nullable=False)
    type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    place: Mapped[Place] = relationship(back_populates="assets")
