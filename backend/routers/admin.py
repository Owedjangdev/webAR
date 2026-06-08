"""Endpoints d'administration du backoffice (préfixe /api/admin, réservé admin).

La dépendance require_admin est appliquée à TOUT le router : aucune de ces routes
n'est accessible sans un jeton valide de rôle 'admin' (401 sans jeton, 403 sinon).
Règle métier : seul l'administrateur crée des lieux/expériences et les publie.
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import AssetType, Experience, ExperienceStatus, Place
from schemas.admin import (
    AdminExperienceCreate,
    AdminExperienceOut,
    PlaceAdminOut,
    PlaceCreate,
)
from schemas.asset import AssetCreate, AssetOut
from schemas.experience import ExperienceCreate, ExperienceSummary
from services import asset_service, experience_service, place_service

# Dossier de stockage des fichiers uploadés (servi sous /static/uploads).
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "uploads"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 Mo

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


# ----------------------------- Lecture -------------------------------------


@router.get("/places", response_model=list[PlaceAdminOut])
def list_places(db: Session = Depends(get_db)) -> list[Place]:
    """Liste tous les lieux (réservé admin)."""
    return list(db.scalars(select(Place)).all())


@router.get("/experiences", response_model=list[ExperienceSummary])
def list_experiences(db: Session = Depends(get_db)) -> list[ExperienceSummary]:
    """Liste toutes les expériences, brouillons inclus (réservé admin).

    Contrairement à GET /api/experiences (visiteur, publiées seulement), l'admin
    voit aussi les brouillons. Le `status` est renvoyé dans chaque résumé.
    """
    experiences = db.scalars(select(Experience)).all()
    return [experience_service.to_summary(exp) for exp in experiences]


# ----------------------------- Création ------------------------------------


@router.post("/places", response_model=PlaceAdminOut, status_code=status.HTTP_201_CREATED)
def create_admin_place(payload: PlaceCreate, db: Session = Depends(get_db)) -> Place:
    """Crée un lieu (réservé admin)."""
    return place_service.create_place(db, payload.name, payload.city)


@router.post(
    "/experiences",
    response_model=AdminExperienceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_experience(
    payload: AdminExperienceCreate, db: Session = Depends(get_db)
) -> Experience:
    """Crée une expérience en BROUILLON (réservé admin).

    Réutilise experience_service.create_experience : **404** si `place_id` inconnu,
    **409** si `public_id` déjà pris. Le `template` est validé par le schéma
    (**422** sinon). L'expérience est toujours créée en `draft` (publication via
    /publish).
    """
    return experience_service.create_experience(
        db,
        ExperienceCreate(
            public_id=payload.public_id,
            template=payload.template.value,
            place_id=payload.place_id,
            config=payload.config_json,
        ),
    )


# ------------------------- Publication / retrait ---------------------------


@router.put("/experiences/{public_id}/publish", response_model=AdminExperienceOut)
def publish_experience(public_id: str, db: Session = Depends(get_db)) -> Experience:
    """Publie une expérience (status='published'). **404** si inexistante."""
    return experience_service.set_status(db, public_id, ExperienceStatus.published)


@router.put("/experiences/{public_id}/unpublish", response_model=AdminExperienceOut)
def unpublish_experience(public_id: str, db: Session = Depends(get_db)) -> Experience:
    """Dépublie une expérience : retour en `draft` (**404** si inexistante).

    L'UML parle de « publier OU désactiver » : ici, dépublier = repasser en
    brouillon → l'expérience n'est plus chargeable par le visiteur.
    """
    return experience_service.set_status(db, public_id, ExperienceStatus.draft)


# --------------------- Détail / suppression d'expérience -------------------


@router.get("/experiences/{public_id}", response_model=AdminExperienceOut)
def get_admin_experience(public_id: str, db: Session = Depends(get_db)) -> Experience:
    """Détail d'une expérience (toutes ses colonnes, brouillon inclus) — édition."""
    return experience_service.get_or_404(db, public_id)


@router.delete("/experiences/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_experience(public_id: str, db: Session = Depends(get_db)) -> None:
    """Supprime une expérience et ses assets / QR code. **404** si inexistante."""
    experience_service.delete_experience(db, public_id)


# ----------------------------- Upload d'asset (fichier) --------------------


@router.post("/assets/upload", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    request: Request,
    file: UploadFile = File(...),
    type: AssetType = Form(...),
    experience_id: str | None = Form(None),
    place_id: int | None = Form(None),
    alt_text: str | None = Form(None),
    db: Session = Depends(get_db),
) -> AssetOut:
    """Upload un fichier (logo / overlay / image / audio…) et l'attache à une
    expérience OU un lieu (exactement un des deux). Le fichier est stocké dans
    `static/uploads/` et servi sous `/static/uploads/`.
    """
    if (experience_id is None) == (place_id is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fournir exactement un de 'experience_id' ou 'place_id'.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux (max 10 Mo).",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "").suffix.lower()
    filename = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(content)

    # URL absolue servie par le backend (ex. http://localhost:8000/static/uploads/x.png).
    url = f"{str(request.base_url).rstrip('/')}/static/uploads/{filename}"

    # Si la création de l'asset échoue (404 lieu/expérience, 422, erreur BDD),
    # on supprime le fichier déjà écrit pour ne pas laisser d'orphelin sur disque.
    try:
        asset = asset_service.create_asset(
            db,
            AssetCreate(
                experience_id=experience_id,
                place_id=place_id,
                type=type,
                url=url,
                alt_text=alt_text,
            ),
        )
    except Exception:
        file_path.unlink(missing_ok=True)
        raise

    return asset_service.to_out(asset)
