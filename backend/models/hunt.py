"""Modèles ORM : chasse au trésor (`hunts`) et ses étapes (`hunt_steps`).

Une chasse est rattachée à UNE expérience dont `template = 'treasure_hunt'`
(relation 1:1 via `experience_id` UNIQUE). Ses étapes sont ordonnées par
`step_order` et chacune porte un `validation_code` (encodé dans le QR de l'étape)
— ce code n'est JAMAIS exposé au visiteur (cf. schéma de réponse Pydantic).
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.experience import Experience


class Hunt(Base):
    """Une chasse au trésor multi-étapes rattachée à une expérience (1:1)."""

    __tablename__ = "hunts"

    id: Mapped[int] = mapped_column(primary_key=True)
    # UNIQUE : une expérience treasure_hunt a exactement une chasse.
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id"), unique=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Message / récompense affiché une fois la dernière étape validée.
    reward_message: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    experience: Mapped[Experience] = relationship(back_populates="hunt")
    # Étapes ordonnées ; supprimées avec la chasse (la chasse possède ses étapes).
    steps: Mapped[list[HuntStep]] = relationship(
        back_populates="hunt",
        order_by="HuntStep.step_order",
        cascade="all, delete-orphan",
    )


class HuntStep(Base):
    """Une étape ordonnée d'une chasse, validée en scannant son `validation_code`."""

    __tablename__ = "hunt_steps"
    __table_args__ = (
        # Un ordre unique par chasse (pas deux étapes n°2).
        UniqueConstraint("hunt_id", "step_order", name="uq_hunt_step_order"),
        # Un code = une seule étape dans la chasse (validation sans ambiguïté).
        UniqueConstraint("hunt_id", "validation_code", name="uq_hunt_step_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    hunt_id: Mapped[int] = mapped_column(ForeignKey("hunts.id"), nullable=False)
    step_order: Mapped[int] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Indice affiché au visiteur pour trouver l'étape suivante.
    hint: Mapped[str] = mapped_column(String(500), nullable=False)
    # Code encodé dans le QR de l'étape — JAMAIS renvoyé au visiteur.
    validation_code: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    hunt: Mapped[Hunt] = relationship(back_populates="steps")
