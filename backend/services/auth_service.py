"""Logique métier de l'authentification (hors du router, cf. conventions §18)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import BackOfficeUser
from security import verify_password


def authenticate(db: Session, email: str, password: str) -> BackOfficeUser | None:
    """Renvoie l'utilisateur si l'email existe ET que le mot de passe correspond,
    sinon None.

    On ne distingue pas « email inconnu » de « mot de passe faux » : l'appelant
    renvoie un message générique (pas de fuite d'information sur les comptes).
    """
    user = db.scalar(select(BackOfficeUser).where(BackOfficeUser.email == email))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
