"""Logique métier des lieux (création réservée à l'admin)."""

from sqlalchemy.orm import Session

from models import Place


def create_place(db: Session, name: str, city: str) -> Place:
    """Crée un lieu et le renvoie (utilisé par POST /api/admin/places)."""
    place = Place(name=name, city=city)
    db.add(place)
    db.commit()
    db.refresh(place)
    return place
