"""Endpoints REST du domaine 'expériences' (préfixe /api)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Experience, ExperienceStatus
from schemas.experience import (
    ExperienceCreate,
    ExperienceDetail,
    ExperienceSummary,
    ExperienceUpdate,
)
from services import experience_service

router = APIRouter(prefix="/api", tags=["experiences"])


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_published_experiences(db: Session = Depends(get_db)) -> list[ExperienceSummary]:
    """Liste les expériences publiées (seules visibles du visiteur)."""
    experiences = db.scalars(
        select(Experience).where(Experience.status == ExperienceStatus.published)
    ).all()
    return [experience_service.to_summary(exp) for exp in experiences]


@router.get("/experience/{experience_id}", response_model=ExperienceDetail)
def get_experience(experience_id: str, db: Session = Depends(get_db)) -> ExperienceDetail:
    """Retourne le contrat JSON complet d'une expérience (section 6).

    404 si aucune expérience ne correspond à cet identifiant public.
    """
    experience = db.scalar(
        select(Experience).where(Experience.public_id == experience_id)
    )
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expérience '{experience_id}' introuvable.",
        )
    # Un visiteur ne peut pas charger une expérience en brouillon : on répond 404
    # (on ne révèle pas son existence tant qu'elle n'est pas publiée).
    if experience.status != ExperienceStatus.published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cette expérience n'est pas disponible.",
        )
    return experience_service.to_detail(experience)


@router.post(
    "/experience",
    response_model=ExperienceDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_experience(
    payload: ExperienceCreate, db: Session = Depends(get_db)
) -> ExperienceDetail:
    """Crée une expérience (et son lieu/ses assets si nécessaire).

    Renvoie l'expérience créée au format du contrat JSON (section 6), code 201.
    409 si l'identifiant public fourni existe déjà ; 404 si le place_id est inconnu.
    """
    experience = experience_service.create_experience(db, payload)
    return experience_service.to_detail(experience)


@router.put("/experience/{experience_id}", response_model=ExperienceDetail)
def update_experience(
    experience_id: str, payload: ExperienceUpdate, db: Session = Depends(get_db)
) -> ExperienceDetail:
    """Met à jour une expérience existante (champs fournis seulement).

    Renvoie l'expérience à jour au format du contrat JSON (section 6).
    404 si l'identifiant public n'existe pas.
    """
    experience = experience_service.update_experience(db, experience_id, payload)
    return experience_service.to_detail(experience)
