"""Modèle ORM : table 'qr_codes' (un QR code par expérience)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.experience import Experience


class QrCode(Base):
    """QR code d'une expérience : URL publique encodée + chemin du PNG généré.

    Un seul QR par expérience (experience_id unique) : régénérer un QR met à jour
    la ligne existante plutôt que d'en créer une seconde.
    """

    __tablename__ = "qr_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id"), unique=True, nullable=False
    )
    # URL publique de l'expérience encodée dans le QR (ex. https://.../webar?id=exp_001).
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    # Chemin du fichier PNG généré sur le serveur (ex. static/qr/exp_001.png).
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relation unidirectionnelle (pas de back_populates) : QrCode connaît son
    # expérience, sans imposer de modification au modèle Experience.
    experience: Mapped[Experience] = relationship()
