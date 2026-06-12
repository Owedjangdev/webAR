"""Endpoints de consultation pour le Lieu partenaire (préfixe /api/partner).

La dépendance require_partner est appliquée à TOUT le router : aucune route n'est
accessible sans un jeton valide de rôle 'partner' actif (401 sans jeton, 403 si
rôle insuffisant ou compte désactivé — scénario A2).

Principe de sécurité (scénario A3) : le périmètre est TOUJOURS dérivé de l'id du
partenaire authentifié (current.id), jamais d'un paramètre d'URL. Un partenaire ne
peut donc pas forcer l'accès aux données d'un autre lieu en manipulant l'URL.

Le partenaire est en lecture seule : il consulte ses lieux et expériences, il ne
crée/modifie rien (c'est l'administrateur qui gère).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_partner
from models import BackOfficeUser, Experience, Place
from schemas.admin import PlaceAdminOut
from schemas.experience import ExperienceSummary
from services import experience_service

router = APIRouter(
    prefix="/api/partner",
    tags=["partner"],
    dependencies=[Depends(require_partner)],
)


@router.get("/places", response_model=list[PlaceAdminOut])
def list_my_places(
    current: BackOfficeUser = Depends(require_partner),
    db: Session = Depends(get_db),
) -> list[Place]:
    """Liste les lieux rattachés au partenaire connecté (owner_id = current.id)."""
    return list(db.scalars(select(Place).where(Place.owner_id == current.id)).all())


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_my_experiences(
    current: BackOfficeUser = Depends(require_partner),
    db: Session = Depends(get_db),
) -> list[ExperienceSummary]:
    """Liste les expériences des lieux du partenaire (brouillons inclus).

    Filtrage par jointure Experience -> Place sur owner_id : seules les expériences
    des lieux possédés par ce partenaire remontent.
    """
    experiences = db.scalars(
        select(Experience)
        .join(Place, Experience.place_id == Place.id)
        .where(Place.owner_id == current.id)
    ).all()
    return [experience_service.to_summary(exp) for exp in experiences]
