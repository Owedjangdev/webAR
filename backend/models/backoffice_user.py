"""Modèle ORM : table 'backoffice_users' (comptes admin / partenaire).

Authentification du backoffice (CLAUDE.md section 7). Le mot de passe n'est
JAMAIS stocké en clair : seul son hash bcrypt est persisté (cf. security.py).

Un compte 'partner' possède 0..N lieux (relation UML « possède », via
Place.owner_id). `is_active` permet à l'admin de suspendre/réactiver un compte.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.place import Place


class UserRole(str, enum.Enum):
    """Rôles d'un compte backoffice (cf. acteurs UML, CLAUDE.md section 10)."""

    admin = "admin"
    partner = "partner"


class BackOfficeUser(Base):
    """Un compte du backoffice : administrateur ou lieu partenaire."""

    __tablename__ = "backoffice_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    # Nom affiché du compte (contact partenaire). Optionnel (cf. diagramme de classes).
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Hash bcrypt du mot de passe (jamais le mot de passe en clair).
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    # Compte actif ? L'admin peut suspendre un partenaire (scénarios A2/A3).
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("1")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Lieux possédés (pour un compte 'partner') — UML « possède » (1 → 0..N).
    places: Mapped[list[Place]] = relationship(back_populates="owner")
