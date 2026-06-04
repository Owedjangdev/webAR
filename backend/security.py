"""Sécurité backoffice : hachage des mots de passe (bcrypt) et jetons JWT.

Centralise tout ce qui touche aux secrets, en un seul endroit (DRY) :
- hash_password / verify_password : bcrypt, jamais de mot de passe en clair ;
- create_access_token / decode_access_token : JWT signé avec settings.jwt_secret.

Aucune dépendance FastAPI ici : module réutilisable et testable isolément.
"""

from __future__ import annotations

import datetime as dt

import bcrypt
import jwt

from config import settings

# bcrypt n'exploite que les 72 premiers octets et lève une erreur au-delà
# (bcrypt >= 4.1). On tronque donc de façon cohérente au hachage ET à la
# vérification pour rester robuste quelle que soit la longueur saisie.
_BCRYPT_MAX_BYTES = 72


def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Renvoie le hash bcrypt (avec sel aléatoire) d'un mot de passe en clair."""
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Vérifie un mot de passe en clair contre son hash bcrypt."""
    return bcrypt.checkpw(_to_bytes(password), password_hash.encode("utf-8"))


def create_access_token(*, subject: str, role: str) -> str:
    """Crée un JWT signé portant l'identifiant utilisateur (sub) et son rôle."""
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": str(subject),
        "role": role,
        "iat": now,
        "exp": now + dt.timedelta(minutes=settings.jwt_expires_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Décode et vérifie un JWT. Renvoie le payload, ou None si invalide/expiré."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
