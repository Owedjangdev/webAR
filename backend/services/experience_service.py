"""Transformation des modèles ORM vers les schémas du contrat JSON.

Centralise le mapping BDD -> contrat pour éviter toute duplication entre endpoints.
"""

from models import Asset, AssetType, Experience
from schemas.experience import (
    ExperienceAssets,
    ExperienceDetail,
    ExperienceSummary,
    PlaceOut,
)


def _build_assets(assets: list[Asset]) -> ExperienceAssets:
    """Mappe les assets d'un lieu vers le bloc 'assets' du contrat JSON.

    Correspondance types BDD -> clés du contrat : overlay -> overlay_image, logo -> logo.
    """
    url_by_type = {asset.type: asset.url for asset in assets}
    return ExperienceAssets(
        overlay_image=url_by_type.get(AssetType.overlay),
        logo=url_by_type.get(AssetType.logo),
    )


def _place_out(experience: Experience) -> PlaceOut:
    """Construit le bloc 'place' du contrat à partir du lieu de l'expérience."""
    return PlaceOut(name=experience.place.name, city=experience.place.city)


def to_detail(experience: Experience) -> ExperienceDetail:
    """Construit le contrat JSON complet (section 6) à partir d'une expérience ORM."""
    return ExperienceDetail(
        experience_id=experience.public_id,
        template=experience.template,
        place=_place_out(experience),
        assets=_build_assets(experience.place.assets),
        config=experience.config_json,
    )


def to_summary(experience: Experience) -> ExperienceSummary:
    """Construit un résumé d'expérience pour la liste GET /api/experiences."""
    return ExperienceSummary(
        experience_id=experience.public_id,
        template=experience.template,
        place=_place_out(experience),
        active=experience.active,
    )
