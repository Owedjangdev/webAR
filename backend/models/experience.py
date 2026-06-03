"""Modèle ORM : table 'experiences' (expériences AR rattachées à un lieu)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.asset import Asset
    from models.place import Place


class Experience(Base):
    """Une expérience AR : un template + une configuration JSON, rattachés à un lieu."""

    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Identifiant public stable exposé au frontend (= "experience_id" du contrat JSON),
    # ex. "exp_001". Distinct de la clé primaire interne 'id'.
    public_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id"), nullable=False)
    template: Mapped[str] = mapped_column(String(50), nullable=False)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    place: Mapped[Place] = relationship(back_populates="experiences")
    # Assets propres à cette expérience (overlay/logo/... ; cf. asset.py).
    assets: Mapped[list[Asset]] = relationship(back_populates="experience")
