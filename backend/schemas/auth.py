"""Schémas Pydantic de l'authentification backoffice (validation des requêtes
et forme des réponses)."""

from pydantic import BaseModel, EmailStr, Field

from models import UserRole


class LoginRequest(BaseModel):
    """Corps de POST /api/login : email + mot de passe (+ espace visé).

    `space` = l'espace choisi sur la page de connexion (onglet Admin/Partenaire).
    S'il est fourni, le backend exige que le rôle du compte corresponde : sinon la
    connexion échoue avec le MÊME message qu'un identifiant inconnu (on ne révèle
    jamais qu'un identifiant est valide mais destiné à l'autre espace).
    """

    email: EmailStr
    password: str = Field(min_length=1)
    space: UserRole | None = None


class TokenResponse(BaseModel):
    """Réponse de login : jeton JWT à présenter en Bearer + rôle de l'utilisateur."""

    access_token: str
    token_type: str = "bearer"
    role: UserRole
