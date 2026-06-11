"""Logique métier des lieux (réservée à l'admin) : CRUD + rattachement partenaire.

Un lieu peut être rattaché à un partenaire (`owner_id`). Les écritures valident
que le propriétaire fourni est bien un compte 'partner'. La suppression refuse un
lieu qui porte encore des expériences (évite une cascade destructrice implicite).
"""

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models import Asset, BackOfficeUser, Experience, Place, UserRole
from schemas.admin import PlaceCreate, PlaceUpdate


def _get_or_404(db: Session, place_id: int) -> Place:
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lieu (id={place_id}) introuvable.",
        )
    return place


def _validate_owner(db: Session, owner_id: int | None) -> None:
    """Vérifie que `owner_id` (si fourni) désigne bien un compte partenaire."""
    if owner_id is None:
        return
    owner = db.get(BackOfficeUser, owner_id)
    if owner is None or owner.role != UserRole.partner:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Le propriétaire (owner_id={owner_id}) n'est pas un partenaire valide.",
        )


def create_place(db: Session, payload: PlaceCreate) -> Place:
    """Crée un lieu (POST /api/admin/places)."""
    _validate_owner(db, payload.owner_id)
    place = Place(
        name=payload.name,
        city=payload.city,
        type=payload.type,
        address=payload.address,
        description=payload.description,
        owner_id=payload.owner_id,
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def update_place(db: Session, place_id: int, payload: PlaceUpdate) -> Place:
    """Met à jour un lieu (champs fournis seulement). 404 si inconnu."""
    place = _get_or_404(db, place_id)
    data = payload.model_dump(exclude_unset=True)

    if "owner_id" in data:
        _validate_owner(db, data["owner_id"])

    for field, value in data.items():
        setattr(place, field, value)

    db.commit()
    db.refresh(place)
    return place


def delete_place(db: Session, place_id: int) -> None:
    """Supprime un lieu. 404 si inconnu ; 409 s'il porte encore des expériences.

    On supprime au préalable les assets de NIVEAU LIEU (sinon contrainte FK).
    """
    place = _get_or_404(db, place_id)

    has_experiences = db.scalar(
        select(Experience.id).where(Experience.place_id == place_id).limit(1)
    )
    if has_experiences is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lieu non supprimable : des expériences y sont rattachées. "
            "Supprime-les d'abord.",
        )

    db.execute(delete(Asset).where(Asset.place_id == place_id))
    db.delete(place)
    db.commit()
