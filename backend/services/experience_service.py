"""Logique métier des expériences : mapping ORM <-> contrat JSON et écritures.

Centralise ici (et nulle part ailleurs) :
- la sérialisation BDD -> contrat JSON (to_detail / to_summary), partagée par tous
  les endpoints pour garantir un format identique (contrat figé, section 6) ;
- la création et la mise à jour d'une expérience (POST / PUT), pour éviter toute
  duplication de logique entre les deux endpoints.

Les fonctions d'écriture lèvent des HTTPException (404/409) : cela garde le router
mince et centralise les messages d'erreur clairs exigés par les conventions.
"""

import re

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import Asset, AssetType, Experience, Place
from schemas.experience import (
    ExperienceAssets,
    ExperienceCreate,
    ExperienceDetail,
    ExperienceSummary,
    ExperienceUpdate,
    PlaceOut,
)

# Correspondance entre les clés du contrat JSON et les types d'assets en BDD.
# Une seule source de vérité, utilisée pour lire ET écrire les assets.
_ASSET_TYPE_BY_KEY: dict[str, AssetType] = {
    "overlay_image": AssetType.overlay,
    "logo": AssetType.logo,
}

# Identifiant public auto-généré : "exp_001", "exp_002"...
_PUBLIC_ID_PREFIX = "exp_"
_PUBLIC_ID_RE = re.compile(rf"^{_PUBLIC_ID_PREFIX}(\d+)$")


# ---------------------------------------------------------------------------
# Sérialisation ORM -> contrat JSON (lecture)
# ---------------------------------------------------------------------------


def _build_assets(assets: list[Asset]) -> ExperienceAssets:
    """Mappe les assets d'un lieu vers le bloc 'assets' du contrat JSON."""
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


# ---------------------------------------------------------------------------
# Helpers d'écriture (partagés par create / update)
# ---------------------------------------------------------------------------


def _generate_public_id(db: Session) -> str:
    """Génère le prochain identifiant public libre au format exp_NNN."""
    max_num = 0
    for (public_id,) in db.execute(select(Experience.public_id)).all():
        match = _PUBLIC_ID_RE.match(public_id)
        if match:
            max_num = max(max_num, int(match.group(1)))
    return f"{_PUBLIC_ID_PREFIX}{max_num + 1:03d}"


def _resolve_place(db: Session, payload: ExperienceCreate) -> Place:
    """Retourne le lieu référencé par place_id, ou crée le lieu fourni.

    404 si place_id est fourni mais introuvable.
    """
    if payload.place_id is not None:
        place = db.get(Place, payload.place_id)
        if place is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lieu (place_id={payload.place_id}) introuvable.",
            )
        return place

    place = Place(name=payload.place.name, city=payload.place.city)
    db.add(place)
    return place


def _apply_assets(place: Place, assets: ExperienceAssets) -> None:
    """Met à jour (upsert) les assets du lieu d'après le bloc 'assets' fourni.

    Un seul asset par type et par lieu : si une URL est fournie pour un type,
    l'asset existant est mis à jour, sinon il est créé. Les valeurs None sont
    ignorées (on ne supprime pas un asset existant).
    """
    existing_by_type = {asset.type: asset for asset in place.assets}
    for key, asset_type in _ASSET_TYPE_BY_KEY.items():
        url = getattr(assets, key)
        if url is None:
            continue
        asset = existing_by_type.get(asset_type)
        if asset is not None:
            asset.url = url
        else:
            place.assets.append(Asset(type=asset_type, url=url))


def _get_or_404(db: Session, public_id: str) -> Experience:
    """Retourne l'expérience d'identifiant public donné, ou 404."""
    experience = db.scalar(
        select(Experience).where(Experience.public_id == public_id)
    )
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expérience '{public_id}' introuvable.",
        )
    return experience


# ---------------------------------------------------------------------------
# Création / mise à jour
# ---------------------------------------------------------------------------


def create_experience(db: Session, payload: ExperienceCreate) -> Experience:
    """Crée une expérience (et son lieu/ses assets si nécessaire) puis la renvoie."""
    public_id = payload.public_id or _generate_public_id(db)
    if db.scalar(select(Experience).where(Experience.public_id == public_id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"L'identifiant '{public_id}' existe déjà.",
        )

    place = _resolve_place(db, payload)
    _apply_assets(place, payload.assets)

    experience = Experience(
        public_id=public_id,
        template=payload.template,
        config_json=payload.config,
        active=payload.active,
        place=place,
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


def update_experience(
    db: Session, public_id: str, payload: ExperienceUpdate
) -> Experience:
    """Met à jour une expérience existante (champs fournis seulement) puis la renvoie."""
    experience = _get_or_404(db, public_id)

    if payload.template is not None:
        experience.template = payload.template
    if payload.config is not None:
        experience.config_json = payload.config
    if payload.active is not None:
        experience.active = payload.active
    if payload.assets is not None:
        _apply_assets(experience.place, payload.assets)

    db.commit()
    db.refresh(experience)
    return experience
