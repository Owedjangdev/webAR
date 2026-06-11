"""Logique métier des comptes partenaires (création / gestion par l'admin).

Centralise ici : création d'un compte 'partner' (hash du mot de passe),
rattachement à des lieux (Place.owner_id) et suspension/réactivation.
Le router reste mince ; les messages d'erreur (404/409) sont définis ici.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import BackOfficeUser, Place, UserRole
from schemas.partner import PartnerCreate
from security import hash_password


def _get_partner_or_404(db: Session, partner_id: int) -> BackOfficeUser:
    """Récupère un compte 'partner' par id, ou lève 404 (un admin n'est pas un partenaire)."""
    partner = db.get(BackOfficeUser, partner_id)
    if partner is None or partner.role != UserRole.partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partenaire introuvable.",
        )
    return partner


def _assign_places(db: Session, partner: BackOfficeUser, place_ids: list[int]) -> None:
    """Rattache des lieux au partenaire (owner_id). 404 si un id est inconnu."""
    places = list(db.scalars(select(Place).where(Place.id.in_(place_ids))).all())
    missing = set(place_ids) - {place.id for place in places}
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lieu(x) introuvable(s) : {sorted(missing)}.",
        )
    for place in places:
        place.owner_id = partner.id


def list_partners(db: Session) -> list[BackOfficeUser]:
    """Liste tous les comptes partenaires."""
    return list(
        db.scalars(select(BackOfficeUser).where(BackOfficeUser.role == UserRole.partner)).all()
    )


def create_partner(db: Session, payload: PartnerCreate) -> BackOfficeUser:
    """Crée un compte partenaire (email réel + mot de passe haché), rattaché à ses lieux.

    409 si l'email est déjà utilisé ; 404 si un lieu à rattacher est inconnu.
    """
    existing = db.scalar(
        select(BackOfficeUser).where(BackOfficeUser.email == payload.email)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"L'email '{payload.email}' est déjà utilisé.",
        )

    partner = BackOfficeUser(
        email=str(payload.email),
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=UserRole.partner,
        is_active=True,
    )
    db.add(partner)
    db.flush()  # obtient partner.id avant le rattachement des lieux

    if payload.place_ids:
        _assign_places(db, partner, payload.place_ids)

    db.commit()
    db.refresh(partner)
    return partner


def set_partner_active(db: Session, partner_id: int, active: bool) -> BackOfficeUser:
    """Active (réactive) ou suspend un partenaire (scénarios A2/A3)."""
    partner = _get_partner_or_404(db, partner_id)
    partner.is_active = active
    db.commit()
    db.refresh(partner)
    return partner
