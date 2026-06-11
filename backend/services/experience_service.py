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
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from models import (
    Asset,
    AssetType,
    BackOfficeUser,
    Experience,
    ExperienceStatus,
    Place,
    QrCode,
)
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

# Libellé « contrat » d'un type d'asset (inverse), pour les messages d'erreur.
_KEY_BY_ASSET_TYPE: dict[AssetType, str] = {v: k for k, v in _ASSET_TYPE_BY_KEY.items()}

# Assets OBLIGATOIRES pour qu'un template fonctionne (garde A4 à la publication).
# Miroir de templateConfig (front) ; un template absent = aucun asset requis.
_REQUIRED_ASSET_TYPES: dict[str, set[AssetType]] = {
    "selfie_ar": {AssetType.overlay, AssetType.logo},
    "badge": {AssetType.logo},
}

# Identifiant public auto-généré : "exp_001", "exp_002"...
_PUBLIC_ID_PREFIX = "exp_"
_PUBLIC_ID_RE = re.compile(rf"^{_PUBLIC_ID_PREFIX}(\d+)$")


# ---------------------------------------------------------------------------
# Sérialisation ORM -> contrat JSON (lecture)
# ---------------------------------------------------------------------------


def _build_assets(experience: Experience) -> ExperienceAssets:
    """Construit le bloc 'assets' du contrat en fusionnant les assets du LIEU
    puis de l'EXPÉRIENCE (l'expérience est prioritaire)."""
    url_by_type: dict[AssetType, str] = {}
    for asset in experience.place.assets:  # niveau lieu (partagé entre expériences)
        url_by_type[asset.type] = asset.url
    for asset in experience.assets:  # niveau expérience (prioritaire)
        url_by_type[asset.type] = asset.url
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
        assets=_build_assets(experience),
        config=experience.config_json,
    )


def to_summary(experience: Experience) -> ExperienceSummary:
    """Construit un résumé d'expérience pour la liste GET /api/experiences."""
    return ExperienceSummary(
        experience_id=experience.public_id,
        template=experience.template,
        place=_place_out(experience),
        status=experience.status,
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


def _apply_assets(experience: Experience, assets: ExperienceAssets) -> None:
    """Upsert les assets de NIVEAU EXPÉRIENCE d'après le bloc 'assets' du contrat.

    Un seul asset par type et par expérience : si une URL est fournie pour un type,
    l'asset existant est mis à jour, sinon il est créé. Les valeurs None sont
    ignorées (on ne supprime pas un asset existant).
    """
    existing_by_type = {asset.type: asset for asset in experience.assets}
    for key, asset_type in _ASSET_TYPE_BY_KEY.items():
        url = getattr(assets, key)
        if url is None:
            continue
        asset = existing_by_type.get(asset_type)
        if asset is not None:
            asset.url = url
        else:
            experience.assets.append(Asset(type=asset_type, url=url))


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


def _ensure_place_owner_active(db: Session, place: Place) -> None:
    """Garde A3 : refuse un lieu dont le partenaire propriétaire est suspendu.

    Un lieu non rattaché (owner_id NULL) est toujours accepté.
    """
    if place.owner_id is None:
        return
    owner = db.get(BackOfficeUser, place.owner_id)
    if owner is not None and not owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le partenaire propriétaire de ce lieu est suspendu. "
            "Choisis un autre lieu ou réactive le partenaire.",
        )


def _missing_required_assets(experience: Experience) -> list[str]:
    """Garde A4 : libellés des assets obligatoires manquants pour publier.

    Fusionne les assets du LIEU et de l'EXPÉRIENCE (comme le contrat visiteur).
    Liste vide => publication autorisée.
    """
    required = _REQUIRED_ASSET_TYPES.get(experience.template, set())
    if not required:
        return []
    available = {asset.type for asset in experience.place.assets}
    available |= {asset.type for asset in experience.assets}
    missing = required - available
    return sorted(_KEY_BY_ASSET_TYPE.get(asset_type, asset_type.value) for asset_type in missing)


def create_experience(db: Session, payload: ExperienceCreate) -> Experience:
    """Crée une expérience (et son lieu/ses assets si nécessaire) puis la renvoie."""
    public_id = payload.public_id or _generate_public_id(db)
    if db.scalar(select(Experience).where(Experience.public_id == public_id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"L'identifiant '{public_id}' existe déjà.",
        )

    place = _resolve_place(db, payload)
    _ensure_place_owner_active(db, place)  # garde A3
    experience = Experience(
        public_id=public_id,
        template=payload.template,
        config_json=payload.config,
        # Règle métier : une expérience est TOUJOURS créée en brouillon, puis
        # publiée explicitement via set_status (route /publish).
        status=ExperienceStatus.draft,
        place=place,
    )
    _apply_assets(experience, payload.assets)

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
    if payload.assets is not None:
        _apply_assets(experience, payload.assets)

    db.commit()
    db.refresh(experience)
    return experience


def set_status(db: Session, public_id: str, new_status: ExperienceStatus) -> Experience:
    """Change le statut d'une expérience (publier / dépublier).

    404 si l'expérience n'existe pas. Utilisé par les routes admin /publish et
    /unpublish.
    """
    experience = _get_or_404(db, public_id)

    # Garde A4 : on ne publie pas une expérience à qui il manque des assets requis.
    if new_status == ExperienceStatus.published:
        missing = _missing_required_assets(experience)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Publication impossible : assets requis manquants ({', '.join(missing)}).",
            )

    experience.status = new_status
    db.commit()
    db.refresh(experience)
    return experience


def get_or_404(db: Session, public_id: str) -> Experience:
    """Retourne l'expérience d'identifiant public donné, ou 404 (usage admin)."""
    return _get_or_404(db, public_id)


def delete_experience(db: Session, public_id: str) -> None:
    """Supprime une expérience et ses dépendances (assets, QR code). 404 si inconnue.

    On retire d'abord les lignes liées (clés étrangères) pour éviter une erreur
    d'intégrité, puis l'expérience elle-même.
    """
    experience = _get_or_404(db, public_id)
    db.execute(delete(Asset).where(Asset.experience_id == experience.id))
    db.execute(delete(QrCode).where(QrCode.experience_id == experience.id))
    db.delete(experience)
    db.commit()
