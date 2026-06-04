"""Modèle ORM : table 'backoffice_users' (comptes admin / partenaire).

Authentification du backoffice (CLAUDE.md section 7). Le mot de passe n'est
JAMAIS stocké en clair : seul son hash bcrypt est persisté (cf. security.py).

Le rattachement d'un compte 'partner' à son périmètre (« ses lieux ») est
volontairement reporté aux semaines suivantes (routes partenaire) : ce modèle ne
porte donc, pour l'instant, que l'identité et le rôle.
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class UserRole(str, enum.Enum):
    """Rôles d'un compte backoffice (cf. acteurs UML, CLAUDE.md section 10)."""

    admin = "admin"
    partner = "partner"


class BackOfficeUser(Base):
    """Un compte du backoffice : administrateur ou lieu partenaire."""

    __tablename__ = "backoffice_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    # Hash bcrypt du mot de passe (jamais le mot de passe en clair).
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
