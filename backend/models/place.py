"""Modèle ORM : table 'places' (lieux physiques)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.asset import Asset
    from models.backoffice_user import BackOfficeUser
    from models.experience import Experience


class Place(Base):
    """Un lieu physique (restaurant, musée...) hébergeant des expériences AR."""

    __tablename__ = "places"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    # Champs descriptifs du lieu (diagramme de classes). Optionnels.
    type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Partenaire propriétaire du lieu (NULL si non encore rattaché) — UML « possède ».
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("backoffice_users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    owner: Mapped[BackOfficeUser | None] = relationship(back_populates="places")
    experiences: Mapped[list[Experience]] = relationship(back_populates="place")
    assets: Mapped[list[Asset]] = relationship(back_populates="place")
