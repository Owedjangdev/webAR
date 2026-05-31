"""Script de seed : insère les données de test de la semaine 1.

Usage (depuis backend/, avec le .env configuré et le venv actif) :
    python seed.py

Insère le lieu "Restaurant Le Palmier" (Cotonou), ses assets (overlay + logo)
et l'expérience de test exp_001 (template selfie_ar).
Idempotent : relancer le script ne crée pas de doublon de exp_001.
"""

from sqlalchemy import select

from database import Base, SessionLocal, engine
from models import Asset, AssetType, Experience, Place


def seed() -> None:
    """Crée les tables si besoin puis insère les données de test (si absentes)."""
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if db.scalar(select(Experience).where(Experience.public_id == "exp_001")):
            print("exp_001 existe déjà — aucune insertion.")
            return

        place = Place(name="Restaurant Le Palmier", city="Cotonou")
        place.assets = [
            Asset(type=AssetType.overlay, url="https://cdn.example.com/palmier.png"),
            Asset(type=AssetType.logo, url="https://cdn.example.com/palmier_logo.png"),
        ]
        place.experiences = [
            Experience(
                public_id="exp_001",
                template="selfie_ar",
                config_json={"message": "Souvenir au Palmier", "color": "#FFAA00"},
                active=True,
            )
        ]
        db.add(place)
        db.commit()
        print("Seed OK : Restaurant Le Palmier + exp_001 (selfie_ar) insérés.")


if __name__ == "__main__":
    seed()
