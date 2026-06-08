"""Seed d'une chasse au trésor de démonstration (3 étapes) pour tester les routes.

Idempotent : ré-exécutable sans créer de doublon (clé public_id / chasse unique).
Prérequis : schéma migré (`alembic upgrade head`).

Usage (depuis backend/, venv actif) :
    python seed_hunt.py
"""

from sqlalchemy import select

from database import SessionLocal
from models import Experience, ExperienceStatus, Hunt, HuntStep, Place

# Expérience publique qui porte la chasse de démo.
_PUBLIC_ID = "hunt_demo"

# Étapes : (ordre, titre, indice, code encodé dans le QR de l'étape).
_STEPS: list[tuple[int, str, str, str]] = [
    (1, "Le palmier royal", "Trouve le grand palmier à l'entrée du site.", "PALMIER-01"),
    (2, "La fontaine", "Dirige-toi vers la fontaine centrale.", "FONTAINE-02"),
    (3, "La statue de l'Amazone", "La statue de l'Amazone garde le trésor.", "AMAZONE-03"),
]


def seed_hunt() -> None:
    """Crée (si absent) une expérience treasure_hunt publiée + sa chasse 3 étapes."""
    with SessionLocal() as db:
        experience = db.scalar(
            select(Experience).where(Experience.public_id == _PUBLIC_ID)
        )
        if experience is None:
            place = db.scalar(select(Place).where(Place.name == "Place de l'Amazone"))
            if place is None:
                place = Place(name="Place de l'Amazone", city="Cotonou")
                db.add(place)
                db.flush()
            experience = Experience(
                public_id=_PUBLIC_ID,
                place_id=place.id,
                template="treasure_hunt",
                config_json={"message": "Chasse au trésor de démonstration"},
                status=ExperienceStatus.published,
            )
            db.add(experience)
            db.flush()
        elif experience.status != ExperienceStatus.published:
            experience.status = ExperienceStatus.published

        hunt = db.scalar(select(Hunt).where(Hunt.experience_id == experience.id))
        if hunt is None:
            hunt = Hunt(
                experience_id=experience.id,
                title="Chasse au trésor de Cotonou",
                reward_message="Félicitations ! Tu as trouvé le trésor.",
            )
            db.add(hunt)
            db.flush()
            for order, title, hint, code in _STEPS:
                db.add(
                    HuntStep(
                        hunt_id=hunt.id,
                        step_order=order,
                        title=title,
                        hint=hint,
                        validation_code=code,
                    )
                )

        db.commit()
        print(
            f"✅ Chasse démo prête sur l'expérience '{_PUBLIC_ID}' "
            f"({len(hunt.steps)} étapes)."
        )


if __name__ == "__main__":
    seed_hunt()
