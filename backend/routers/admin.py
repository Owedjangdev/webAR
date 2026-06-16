"""Endpoints d'administration du backoffice (préfixe /api/admin, réservé admin).

La dépendance require_admin est appliquée à TOUT le router : aucune de ces routes
n'est accessible sans un jeton valide de rôle 'admin' (401 sans jeton, 403 sinon).
Règle métier : seul l'administrateur crée des lieux/expériences et les publie.
"""

import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    Request,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import AssetType, BackOfficeUser, Experience, ExperienceStatus, Place
from schemas.admin import (
    AdminExperienceCreate,
    AdminExperienceOut,
    PasswordChange,
    PlaceAdminOut,
    PlaceCreate,
    PlaceUpdate,
)
from security import hash_password, verify_password
from schemas.asset import AssetCreate, AssetOut
from schemas.experience import ExperienceCreate, ExperienceSummary
from schemas.hunt import HuntAdminDetail, HuntUpsert
from schemas.partner import PartnerCreate, PartnerOut
from services import (
    asset_service,
    experience_service,
    hunt_service,
    partner_service,
    place_service,
    qr_service,
)

# Dossier de stockage des fichiers uploadés (servi sous /static/uploads).
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "uploads"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 Mo

# Formats autorisés par type d'asset (garde A2 : refuser un format non supporté).
_ALLOWED_EXTENSIONS: dict[AssetType, set[str]] = {
    AssetType.overlay: {".png", ".jpg", ".jpeg", ".webp"},
    AssetType.logo: {".png", ".jpg", ".jpeg", ".webp", ".svg"},
    AssetType.badge: {".png", ".jpg", ".jpeg", ".webp"},
    AssetType.image: {".png", ".jpg", ".jpeg", ".webp", ".gif"},
    AssetType.audio: {".mp3", ".ogg", ".wav", ".m4a"},
    AssetType.model: {".glb"},  # modèle 3D self-contained (object_ar)
}

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
    """Crée un lieu (réservé admin). 422 si `owner_id` n'est pas un partenaire valide."""
    return place_service.create_place(db, payload)


@router.put("/places/{place_id}", response_model=PlaceAdminOut)
def update_admin_place(
    place_id: int, payload: PlaceUpdate, db: Session = Depends(get_db)
) -> Place:
    """Met à jour un lieu (champs fournis) + rattachement partenaire (`owner_id`).

    **404** si le lieu n'existe pas ; **422** si `owner_id` n'est pas un partenaire.
    """
    return place_service.update_place(db, place_id, payload)


@router.delete("/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_place(place_id: int, db: Session = Depends(get_db)) -> None:
    """Supprime un lieu. **404** si inconnu ; **409** s'il porte des expériences."""
    place_service.delete_place(db, place_id)


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


# ----------------------------- Partenaires ---------------------------------


@router.get("/partners", response_model=list[PartnerOut])
def list_admin_partners(db: Session = Depends(get_db)) -> list:
    """Liste les comptes partenaires et leurs lieux rattachés (réservé admin)."""
    return partner_service.list_partners(db)


@router.post("/partners", response_model=PartnerOut, status_code=status.HTTP_201_CREATED)
def create_admin_partner(payload: PartnerCreate, db: Session = Depends(get_db)):
    """Crée un compte partenaire (email réel + mot de passe), rattaché à ses lieux.

    **409** si l'email existe déjà ; **404** si un `place_id` à rattacher est inconnu.
    """
    return partner_service.create_partner(db, payload)


@router.put("/partners/{partner_id}/activate", response_model=PartnerOut)
def activate_admin_partner(partner_id: int, db: Session = Depends(get_db)):
    """Réactive un compte partenaire suspendu. **404** si inexistant."""
    return partner_service.set_partner_active(db, partner_id, True)


@router.put("/partners/{partner_id}/deactivate", response_model=PartnerOut)
def deactivate_admin_partner(partner_id: int, db: Session = Depends(get_db)):
    """Suspend un compte partenaire (il ne peut plus se connecter). **404** si inexistant."""
    return partner_service.set_partner_active(db, partner_id, False)


# ------------------------------- Compte ------------------------------------


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    current: BackOfficeUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    """Change le mot de passe du compte connecté.

    **400** si le mot de passe actuel est incorrect. Le nouveau est haché (bcrypt).
    """
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect.",
        )
    current.password_hash = hash_password(payload.new_password)
    db.commit()


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


# ----------------- Chasse au trésor (configuration + QR étapes) ------------


@router.get("/hunt/{public_id}", response_model=HuntAdminDetail)
def get_admin_hunt(public_id: str, db: Session = Depends(get_db)) -> HuntAdminDetail:
    """Détail de la chasse d'une expérience (codes inclus, pour générer les QR).

    **422** si l'expérience n'est pas une chasse ; **404** si aucune chasse n'est
    encore configurée (le front affiche alors un formulaire vide).
    """
    return hunt_service.get_hunt_admin(db, public_id)


@router.put("/hunt/{public_id}", response_model=HuntAdminDetail)
def upsert_admin_hunt(
    public_id: str, payload: HuntUpsert, db: Session = Depends(get_db)
) -> HuntAdminDetail:
    """Crée ou remplace la chasse (1..N étapes). Les codes sont auto-générés et
    conservés par ordre pour ne pas invalider les QR déjà imprimés. **404**
    expérience inconnue ; **422** si elle n'est pas une chasse."""
    return hunt_service.upsert_hunt(db, public_id, payload)


@router.get("/hunt/{public_id}/step/{step_order}/qr.png")
def admin_step_qr(
    public_id: str,
    step_order: int = Path(ge=1),
    db: Session = Depends(get_db),
) -> Response:
    """Image PNG du QR d'une étape (encode /webar?id=...&step=CODE), à imprimer.

    Réservé admin : ce QR contient le code secret de l'étape — il ne doit pas être
    public (sinon on validerait la chasse sans se déplacer). 404 si étape inconnue.
    """
    code = hunt_service.get_step_code(db, public_id, step_order)
    png = qr_service.qr_png_bytes(qr_service.build_step_url(public_id, code))
    # no-store/private : le QR contient le code secret → on interdit toute mise en
    # cache (navigateur/proxy) pour limiter les fuites.
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "no-store, private"},
    )


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

    # Garde A2 : format de fichier supporté pour ce type d'asset.
    suffix = Path(file.filename or "").suffix.lower()
    allowed = _ALLOWED_EXTENSIONS.get(type, set())
    if suffix not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Format non supporté pour un asset '{type.value}'. "
            f"Formats autorisés : {', '.join(sorted(allowed))}.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux (max 10 Mo).",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
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
