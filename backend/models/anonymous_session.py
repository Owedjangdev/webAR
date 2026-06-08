"""Modèle ORM : progression ANONYME d'un visiteur sur une chasse (sans compte).

Aucune table utilisateur, aucun email/mot de passe : un `session_token` opaque
(UUID généré côté client, stocké en localStorage) identifie une *progression de
jeu*, pas une personne. Une ligne = la progression d'un visiteur sur une chasse.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.hunt import Hunt


class AnonymousSession(Base):
    """Progression d'un visiteur anonyme sur une chasse (une par token et chasse)."""

    __tablename__ = "anonymous_sessions"
    __table_args__ = (
        # Une seule progression par visiteur (token) et par chasse.
        UniqueConstraint("session_token", "hunt_id", name="uq_session_token_hunt"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Identifiant anonyme opaque (UUID côté client). Indexé pour la recherche.
    session_token: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    hunt_id: Mapped[int] = mapped_column(ForeignKey("hunts.id"), nullable=False)
    # Nombre d'étapes déjà validées (0 = pas commencé ; prochaine = current_step + 1).
    current_step: Mapped[int] = mapped_column(
        nullable=False, default=0, server_default=text("0")
    )
    completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    hunt: Mapped[Hunt] = relationship()
