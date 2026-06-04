"""Endpoint d'authentification du backoffice (préfixe /api)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import LoginRequest, TokenResponse
from security import create_access_token
from services import auth_service

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authentifie un compte backoffice et renvoie un JWT + son rôle.

    401 si l'email est inconnu OU le mot de passe incorrect (message volontairement
    générique : on ne révèle pas lequel des deux est faux).
    """
    user = auth_service.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides.",
        )
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, role=user.role)
