"""Schémas Pydantic de l'authentification backoffice (validation des requêtes
et forme des réponses)."""

from pydantic import BaseModel, EmailStr, Field

from models import UserRole


class LoginRequest(BaseModel):
    """Corps de POST /api/login : email + mot de passe."""

    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    """Réponse de login : jeton JWT à présenter en Bearer + rôle de l'utilisateur."""

    access_token: str
    token_type: str = "bearer"
    role: UserRole
