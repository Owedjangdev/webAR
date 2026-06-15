"""Logique métier de l'authentification (hors du router, cf. conventions §18)."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import BackOfficeUser, UserRole
from security import verify_password

# Messages de connexion. Distincts pour aider l'utilisateur légitime (mot de passe
# vs identifiant), MAIS « mauvais espace » réutilise volontairement le message
# « identifiant incorrect » pour ne jamais révéler qu'un compte valide existe sur
# l'autre espace (onglet). Compromis assumé : pour un backoffice interne (comptes
# créés par l'admin, pas d'inscription publique), distinguer email/mot de passe
# est acceptable et plus professionnel.
_INVALID_IDENTIFIER = "Identifiant incorrect."
_INVALID_PASSWORD = "Mot de passe incorrect."
_DISABLED_ACCOUNT = "Ce compte a été désactivé. Contactez votre administrateur."


def authenticate(
    db: Session,
    email: str,
    password: str,
    space: UserRole | None = None,
) -> BackOfficeUser:
    """Authentifie un compte backoffice, ou lève une HTTPException explicite.

    Ordre des contrôles (le rôle AVANT le mot de passe) pour que « mauvais espace »
    soit indistinct d'un « identifiant inconnu » : on ne confirme jamais qu'un
    couple identifiant/mot de passe est valide quand l'espace ne correspond pas.

    - 401 « Identifiant incorrect. »     : email inconnu OU espace (onglet) erroné.
    - 401 « Mot de passe incorrect. »    : email connu mais mot de passe faux.
    - 403 « Ce compte a été désactivé… » : compte suspendu par l'admin (A2).
    """
    user = db.scalar(select(BackOfficeUser).where(BackOfficeUser.email == email))
    if user is None or (space is not None and user.role != space):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_IDENTIFIER)
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_PASSWORD)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=_DISABLED_ACCOUNT)
    return user
