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

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi import Path as PathParam
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_partner
from models import BackOfficeUser, Experience, Place
from schemas.admin import PlaceAdminOut
from schemas.experience import ExperienceSummary
from schemas.hunt import HuntAdminDetail
from schemas.stats import PartnerStatsOut
from services import analytics_service, experience_service, hunt_service, qr_service


def _owned_experience_or_404(
    db: Session, current: BackOfficeUser, public_id: str
) -> Experience:
    """Retourne l'expérience SI elle appartient à un lieu du partenaire (scénario A3).

    404 sinon : on ne révèle pas l'existence d'une expérience d'un autre partenaire.
    """
    experience = db.scalar(
        select(Experience)
        .join(Place, Experience.place_id == Place.id)
        .where(Experience.public_id == public_id, Place.owner_id == current.id)
    )
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expérience introuvable ou non rattachée à ton compte.",
        )
    return experience

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


@router.get("/stats", response_model=PartnerStatsOut)
def my_stats(
    current: BackOfficeUser = Depends(require_partner),
    db: Session = Depends(get_db),
) -> PartnerStatsOut:
    """Statistiques agrégées des lieux/expériences du partenaire connecté.

    Totaux scans/captures, taux de conversion, détail par expérience et série
    quotidienne (graphiques). Agrégation filtrée sur owner_id = current.id (A3).
    """
    return analytics_service.partner_stats(db, current.id)


# ----------------- Chasse au trésor : QR à télécharger/imprimer ------------


@router.get("/hunt/{public_id}", response_model=HuntAdminDetail)
def my_hunt(
    public_id: str,
    current: BackOfficeUser = Depends(require_partner),
    db: Session = Depends(get_db),
) -> HuntAdminDetail:
    """Détail de la chasse d'une de SES expériences (titre, récompense, étapes +
    codes) pour télécharger/imprimer les QR. 404 si l'expérience n'est pas à lui."""
    _owned_experience_or_404(db, current, public_id)
    return hunt_service.get_hunt_admin(db, public_id)


@router.get("/hunt/{public_id}/step/{step_order}/qr.png")
def my_step_qr(
    public_id: str,
    step_order: int = PathParam(ge=1),
    current: BackOfficeUser = Depends(require_partner),
    db: Session = Depends(get_db),
) -> Response:
    """PNG du QR d'une étape d'une de SES chasses (à coller sur place).

    Réservé au partenaire propriétaire ; anti-cache car le QR contient le code
    secret de l'étape.
    """
    _owned_experience_or_404(db, current, public_id)
    code = hunt_service.get_step_code(db, public_id, step_order)
    png = qr_service.qr_png_bytes(qr_service.build_step_url(public_id, code))
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "no-store, private"},
    )
