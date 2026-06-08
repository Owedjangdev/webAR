"""Script de seed : insère des données de test variées (semaine 2).

Usage (depuis backend/, avec le .env configuré et le venv actif) :
    python seed.py

Insère 3 lieux et 5 expériences couvrant les 4 templates obligatoires
(selfie_ar, badge, object_ar, treasure_hunt), avec leurs assets.
Objectif : permettre au frontend de tester la sélection automatique de template.

Idempotent : un lieu (name + city) ou une expérience (public_id) déjà présent
n'est pas recréé. Relancer le script ne crée donc pas de doublon.
"""

from sqlalchemy import select

from database import SessionLocal
from models import Asset, AssetType, Experience, ExperienceStatus, Place

_CDN = "https://cdn.example.com"

# Lieux de test, indexés par une clé interne réutilisée par les expériences.
# Chaque lieu porte ses propres assets (overlay/logo/badge) → assets variés
# d'un lieu à l'autre, ce qui permet au frontend de tester plusieurs cas.
PLACES: dict[str, dict] = {
    "palmier": {
        "name": "Restaurant Le Palmier",
        "city": "Cotonou",
        "assets": [
            (AssetType.overlay, f"{_CDN}/palmier.png"),
            (AssetType.logo, f"{_CDN}/palmier_logo.png"),
        ],
    },
    "honme": {
        "name": "Musée Honmé",
        "city": "Porto-Novo",
        "assets": [
            (AssetType.overlay, f"{_CDN}/honme_overlay.png"),
            (AssetType.logo, f"{_CDN}/honme_logo.png"),
            (AssetType.badge, f"{_CDN}/honme_badge.png"),
        ],
    },
    "amazone": {
        "name": "Place de l'Amazone",
        "city": "Cotonou",
        "assets": [
            (AssetType.logo, f"{_CDN}/amazone_logo.png"),
            (AssetType.badge, f"{_CDN}/amazone_badge.png"),
        ],
    },
}

# Expériences de test : 5 expériences couvrant les 4 templates obligatoires.
EXPERIENCES: list[dict] = [
    {
        "public_id": "exp_001",
        "place": "palmier",
        "template": "selfie_ar",
        "config": {"message": "Souvenir au Palmier", "color": "#FFAA00"},
    },
    {
        "public_id": "exp_002",
        "place": "honme",
        "template": "object_ar",
        "config": {"message": "Découvrez le trône royal", "color": "#7B3F00"},
    },
    {
        "public_id": "exp_003",
        "place": "honme",
        "template": "badge",
        "config": {"message": "Badge Visiteur du Musée Honmé", "color": "#1B998B"},
    },
    {
        "public_id": "exp_004",
        "place": "amazone",
        "template": "treasure_hunt",
        "config": {"message": "Chasse au trésor de l'Amazone", "color": "#E63946"},
    },
    {
        "public_id": "exp_005",
        "place": "amazone",
        "template": "selfie_ar",
        "config": {"message": "Selfie devant l'Amazone", "color": "#457B9D"},
    },
]


def _get_or_create_places(db) -> dict[str, Place]:
    """Crée les lieux manquants (avec leurs assets) et renvoie {clé: Place}."""
    places: dict[str, Place] = {}
    for key, data in PLACES.items():
        place = db.scalar(
            select(Place).where(Place.name == data["name"], Place.city == data["city"])
        )
        if place is None:
            place = Place(name=data["name"], city=data["city"])
            place.assets = [Asset(type=t, url=url) for t, url in data["assets"]]
            db.add(place)
        places[key] = place
    return places


def _create_missing_experiences(db, places: dict[str, Place]) -> int:
    """Crée les expériences absentes (par public_id) ; renvoie le nombre créé."""
    created = 0
    for exp in EXPERIENCES:
        if db.scalar(select(Experience).where(Experience.public_id == exp["public_id"])):
            continue
        db.add(
            Experience(
                public_id=exp["public_id"],
                template=exp["template"],
                config_json=exp["config"],
                # Données de démo : publiées d'emblée pour rester visibles au visiteur.
                status=ExperienceStatus.published,
                place=places[exp["place"]],
            )
        )
        created += 1
    return created


def seed() -> None:
    """Insère les données de test manquantes.

    Prérequis : le schéma doit déjà exister (lancer `alembic upgrade head`
    avant ce script — c'est Alembic qui gère les tables, plus create_all).
    """
    with SessionLocal() as db:
        places = _get_or_create_places(db)
        created = _create_missing_experiences(db, places)
        db.commit()

    print(
        f"Seed OK : {len(PLACES)} lieux garantis, {created} expérience(s) créée(s), "
        f"{len(EXPERIENCES)} au total."
    )


if __name__ == "__main__":
    seed()
