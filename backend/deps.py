"""Dépendances FastAPI d'authentification, réutilisables sur les routes protégées.

- get_current_user : lit le jeton Bearer, le vérifie, renvoie l'utilisateur.
- require_admin    : exige en plus le rôle 'admin'.
- require_partner  : exige le rôle 'partner' ET un compte actif (is_active).

401 si jeton absent/invalide/expiré ; 403 si authentifié mais rôle insuffisant
ou compte désactivé (scénario A2 : un partenaire suspendu pendant sa navigation).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import BackOfficeUser, UserRole
from security import decode_access_token

# auto_error=False : on gère nous-mêmes le 401 (message homogène) si jeton absent.
_bearer = HTTPBearer(auto_error=False)

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentification requise ou jeton invalide.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> BackOfficeUser:
    """Renvoie l'utilisateur authentifié à partir du jeton Bearer, ou lève 401."""
    if credentials is None:
        raise _UNAUTHENTICATED

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _UNAUTHENTICATED

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise _UNAUTHENTICATED

    user = db.get(BackOfficeUser, user_id)
    if user is None:
        raise _UNAUTHENTICATED
    return user


def require_admin(user: BackOfficeUser = Depends(get_current_user)) -> BackOfficeUser:
    """Autorise uniquement les comptes de rôle 'admin' (403 sinon)."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return user


def require_partner(user: BackOfficeUser = Depends(get_current_user)) -> BackOfficeUser:
    """Autorise uniquement les comptes 'partner' actifs.

    Refuse (403) un compte d'un autre rôle, ou un partenaire désactivé par l'admin
    même si son jeton est encore valide (scénario A2 : révocation des droits en
    cours de navigation, message explicite « Compte désactivé »).
    """
    if user.role != UserRole.partner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux partenaires.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé. Contactez l'administrateur.",
        )
    return user
