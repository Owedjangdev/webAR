"""Endpoints REST de la chasse au trésor (préfixe /api) — PUBLICS (visiteur).

Aucune authentification : la progression est anonyme (session_token côté client).
Distinct du backoffice (/api/admin/*) et du contrat JSON figé des expériences.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.hunt import HuntDetail, StepValidationRequest, StepValidationResponse
from services import hunt_service

router = APIRouter(prefix="/api", tags=["hunt"])


@router.get("/hunt/{experience_id}", response_model=HuntDetail)
def get_hunt(experience_id: str, db: Session = Depends(get_db)) -> HuntDetail:
    """Retourne la chasse d'une expérience : titre, étapes ordonnées, total.

    Les `validation_code` ne sont jamais inclus (cf. schemas.hunt).
    404 si l'expérience n'existe pas / n'est pas publiée / n'est pas une chasse.
    """
    hunt = hunt_service.get_published_hunt(db, experience_id)
    return hunt_service.to_detail(hunt)


@router.post("/hunt/step/validate", response_model=StepValidationResponse)
def validate_step(
    payload: StepValidationRequest, db: Session = Depends(get_db)
) -> StepValidationResponse:
    """Valide une étape scannée pour une session anonyme (progression dans l'ordre).

    Crée la session au premier scan. Avance si le code correspond à l'étape
    attendue ; refuse (sans avancer) un code erroné ou hors séquence ; renvoie la
    récompense finale quand la dernière étape est validée.
    404 si la chasse n'existe pas / n'est pas disponible.
    """
    return hunt_service.validate_step(
        db, payload.experience_id, payload.session_token, payload.code
    )
