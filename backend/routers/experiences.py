"""Endpoints REST du domaine 'expériences' (préfixe /api)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Experience
from schemas.experience import ExperienceDetail, ExperienceSummary
from services import experience_service

router = APIRouter(prefix="/api", tags=["experiences"])


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_active_experiences(db: Session = Depends(get_db)) -> list[ExperienceSummary]:
    """Liste les expériences actives (active = True)."""
    experiences = db.scalars(
        select(Experience).where(Experience.active.is_(True))
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
    return experience_service.to_detail(experience)
