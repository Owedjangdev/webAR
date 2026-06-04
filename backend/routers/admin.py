"""Endpoints d'administration du backoffice (préfixe /api/admin, réservé admin).

La dépendance require_admin est appliquée à TOUT le router : aucune de ces routes
n'est accessible sans un jeton valide de rôle 'admin' (401 sans jeton, 403 sinon).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import Experience, Place
from schemas.admin import PlaceAdminOut
from schemas.experience import ExperienceSummary
from services import experience_service

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/places", response_model=list[PlaceAdminOut])
def list_places(db: Session = Depends(get_db)) -> list[Place]:
    """Liste tous les lieux (réservé admin)."""
    return list(db.scalars(select(Place)).all())


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_experiences(db: Session = Depends(get_db)) -> list[ExperienceSummary]:
    """Liste toutes les expériences, actives ou non (réservé admin).

    Contrairement à GET /api/experiences (visiteur, actives seulement), l'admin
    voit aussi les expériences inactives.
    """
    experiences = db.scalars(select(Experience)).all()
    return [experience_service.to_summary(exp) for exp in experiences]
