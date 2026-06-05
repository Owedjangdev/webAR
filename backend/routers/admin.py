"""Endpoints d'administration du backoffice (préfixe /api/admin, réservé admin).

La dépendance require_admin est appliquée à TOUT le router : aucune de ces routes
n'est accessible sans un jeton valide de rôle 'admin' (401 sans jeton, 403 sinon).
Règle métier : seul l'administrateur crée des lieux/expériences et les publie.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import Experience, ExperienceStatus, Place
from schemas.admin import (
    AdminExperienceCreate,
    AdminExperienceOut,
    PlaceAdminOut,
    PlaceCreate,
)
from schemas.experience import ExperienceCreate, ExperienceSummary
from services import experience_service, place_service

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


# ----------------------------- Lecture -------------------------------------


@router.get("/places", response_model=list[PlaceAdminOut])
def list_places(db: Session = Depends(get_db)) -> list[Place]:
    """Liste tous les lieux (réservé admin)."""
    return list(db.scalars(select(Place)).all())


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_experiences(db: Session = Depends(get_db)) -> list[ExperienceSummary]:
    """Liste toutes les expériences, brouillons inclus (réservé admin).

    Contrairement à GET /api/experiences (visiteur, publiées seulement), l'admin
    voit aussi les brouillons. Le `status` est renvoyé dans chaque résumé.
    """
    experiences = db.scalars(select(Experience)).all()
    return [experience_service.to_summary(exp) for exp in experiences]


# ----------------------------- Création ------------------------------------


@router.post("/places", response_model=PlaceAdminOut, status_code=status.HTTP_201_CREATED)
def create_admin_place(payload: PlaceCreate, db: Session = Depends(get_db)) -> Place:
    """Crée un lieu (réservé admin)."""
    return place_service.create_place(db, payload.name, payload.city)


@router.post(
    "/experiences",
    response_model=AdminExperienceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_experience(
    payload: AdminExperienceCreate, db: Session = Depends(get_db)
) -> Experience:
    """Crée une expérience en BROUILLON (réservé admin).

    Réutilise experience_service.create_experience : **404** si `place_id` inconnu,
    **409** si `public_id` déjà pris. Le `template` est validé par le schéma
    (**422** sinon). L'expérience est toujours créée en `draft` (publication via
    /publish).
    """
    return experience_service.create_experience(
        db,
        ExperienceCreate(
            public_id=payload.public_id,
            template=payload.template.value,
            place_id=payload.place_id,
            config=payload.config_json,
        ),
    )


# ------------------------- Publication / retrait ---------------------------


@router.put("/experiences/{public_id}/publish", response_model=AdminExperienceOut)
def publish_experience(public_id: str, db: Session = Depends(get_db)) -> Experience:
    """Publie une expérience (status='published'). **404** si inexistante."""
    return experience_service.set_status(db, public_id, ExperienceStatus.published)


@router.put("/experiences/{public_id}/unpublish", response_model=AdminExperienceOut)
def unpublish_experience(public_id: str, db: Session = Depends(get_db)) -> Experience:
    """Dépublie une expérience : retour en `draft` (**404** si inexistante).

    L'UML parle de « publier OU désactiver » : ici, dépublier = repasser en
    brouillon → l'expérience n'est plus chargeable par le visiteur.
    """
    return experience_service.set_status(db, public_id, ExperienceStatus.draft)
