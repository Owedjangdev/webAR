"""Modèle ORM : table 'experience_events' (analytics scans / captures).

Chaque ligne = un événement anonyme déclenché par un visiteur sur une expérience :
- `scan`    : l'expérience a été ouverte (au démarrage, via le QR code) ;
- `capture` : un souvenir a été capturé.

Sert à alimenter les statistiques du partenaire (GET /api/partner/stats). Aucune
donnée personnelle n'est stockée — uniquement le type d'événement et l'horodatage.

NB : non présent au diagramme de classes initial (analytics) → schéma acté avec le
binôme, à reporter au diagramme (cf. CLAUDE.md section 10, point 9).
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.experience import Experience


class EventType(str, enum.Enum):
    """Type d'événement analytique."""

    scan = "scan"
    capture = "capture"


class ExperienceEvent(Base):
    """Un événement (scan ou capture) rattaché à une expérience."""

    __tablename__ = "experience_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    # ondelete CASCADE : les events sont des données jetables, supprimées avec
    # l'expérience (filet de sécurité ; delete_experience les retire aussi).
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    experience: Mapped[Experience] = relationship()
