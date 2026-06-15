"""Endpoint d'authentification du backoffice (préfixe /api)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import LoginRequest, TokenResponse
from security import create_access_token
from services import auth_service

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authentifie un compte backoffice et renvoie un JWT + son rôle.

    auth_service.authenticate lève une HTTPException explicite selon le cas
    (401 identifiant/mot de passe, 403 compte désactivé) ; « mauvais espace »
    (onglet) est traité comme un identifiant incorrect, sans rien révéler.
    """
    user = auth_service.authenticate(db, payload.email, payload.password, payload.space)
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, role=user.role)
