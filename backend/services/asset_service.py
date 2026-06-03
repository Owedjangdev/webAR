"""Logique métier des assets : création et liste (rattachés à un lieu ou une expérience)."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Asset, Experience, Place
from schemas.asset import AssetCreate, AssetOut


def _experience_or_404(db: Session, public_id: str) -> Experience:
    """Retourne l'expérience d'identifiant public donné, ou 404."""
    experience = db.scalar(select(Experience).where(Experience.public_id == public_id))
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expérience '{public_id}' introuvable.",
        )
    return experience


def create_asset(db: Session, payload: AssetCreate) -> Asset:
    """Ajoute (ou met à jour) l'asset d'un type pour une expérience OU un lieu.

    Un seul asset par type et par propriétaire : si un asset de ce type existe
    déjà pour cette cible, son URL/alt_text sont mis à jour (upsert). 404 si la
    cible (expérience/lieu) est inconnue.
    """
    if payload.experience_id is not None:
        experience = _experience_or_404(db, payload.experience_id)
        asset = db.scalar(
            select(Asset).where(
                Asset.experience_id == experience.id, Asset.type == payload.type
            )
        ) or Asset(experience_id=experience.id)
    else:
        place = db.get(Place, payload.place_id)
        if place is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lieu (place_id={payload.place_id}) introuvable.",
            )
        asset = db.scalar(
            select(Asset).where(
                Asset.place_id == payload.place_id, Asset.type == payload.type
            )
        ) or Asset(place_id=payload.place_id)

    asset.type = payload.type
    asset.url = str(payload.url)
    asset.alt_text = payload.alt_text

    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def list_for_experience(db: Session, public_id: str) -> list[Asset]:
    """Liste les assets qui s'appliquent à une expérience : les siens (niveau
    expérience) + ceux hérités de son lieu (niveau lieu). 404 si inconnue.

    Dédupliqués par id (un asset n'a qu'un propriétaire, mais on sécurise).
    """
    experience = _experience_or_404(db, public_id)
    seen: set[int] = set()
    assets: list[Asset] = []
    for asset in (*experience.assets, *experience.place.assets):
        if asset.id not in seen:
            seen.add(asset.id)
            assets.append(asset)
    return assets


def to_out(asset: Asset) -> AssetOut:
    """Construit la réponse d'un asset (expérience exposée par son identifiant public)."""
    return AssetOut(
        id=asset.id,
        experience_id=asset.experience.public_id if asset.experience_id else None,
        place_id=asset.place_id,
        type=asset.type,
        url=asset.url,
        alt_text=asset.alt_text,
    )
