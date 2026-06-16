"""Logique métier des QR codes : construction d'URL, génération PNG, persistance.

Isole ici (et pas dans le router) toute la génération QR, pour rester propre et
réutilisable (CLAUDE.md section 18).
"""

from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode

import qrcode
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config import settings
from models import Experience, QrCode
from schemas.qr import QrCodeOut

# Dossier backend (chemin absolu, indépendant du répertoire d'où uvicorn est lancé).
_BACKEND_DIR = Path(__file__).resolve().parent.parent

# Route du frontend qui lit le paramètre ?id= (cf. App.jsx). Le host, lui, vient
# de la config (.env) : aucune URL n'est codée en dur.
_EXPERIENCE_PATH = "/webar"


def build_experience_url(public_id: str) -> str:
    """Construit l'URL publique de l'expérience encodée dans le QR code."""
    base = settings.frontend_base_url.rstrip("/")
    return f"{base}{_EXPERIENCE_PATH}?{urlencode({'id': public_id})}"


def build_step_url(public_id: str, code: str) -> str:
    """URL encodée dans le QR d'une ÉTAPE de chasse : /webar?id=...&step=CODE.

    Scanné sur place, ce QR ouvre l'app avec le code de l'étape, qui est validé
    automatiquement (cf. parcours chasse au trésor).
    """
    base = settings.frontend_base_url.rstrip("/")
    return f"{base}{_EXPERIENCE_PATH}?{urlencode({'id': public_id, 'step': code})}"


def qr_png_bytes(url: str) -> bytes:
    """Rend un QR code en PNG (octets en mémoire), sans rien persister.

    Utilisé pour servir à la volée les QR d'étapes (téléchargement/impression),
    sans créer de fichier ni de ligne en base.
    """
    buffer = BytesIO()
    qrcode.make(url).save(buffer, format="PNG")
    return buffer.getvalue()


def _relative_image_path(public_id: str) -> str:
    """Chemin du PNG relatif au dossier backend (valeur stockée en base)."""
    return f"static/qr/{public_id}.png"


def image_file_path(qr: QrCode) -> Path:
    """Chemin absolu du PNG sur le disque (pour servir le fichier)."""
    return _BACKEND_DIR / qr.image_path


def _get_experience_or_404(db: Session, public_id: str) -> Experience:
    """Retourne l'expérience d'identifiant public donné, ou 404."""
    experience = db.scalar(select(Experience).where(Experience.public_id == public_id))
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expérience '{public_id}' introuvable.",
        )
    return experience


def generate_qr(db: Session, public_id: str) -> QrCode:
    """Génère (ou régénère) le QR d'une expérience et upsert la ligne qr_codes.

    404 si l'expérience n'existe pas.
    """
    experience = _get_experience_or_404(db, public_id)
    experience_pk = experience.id
    url = build_experience_url(public_id)

    # Une seule source de vérité pour le chemin : relatif (BDD) et absolu (écriture)
    # dérivent du même helper.
    relative_path = _relative_image_path(public_id)
    image_path = _BACKEND_DIR / relative_path

    # Garantit l'existence du dossier de sortie (gère le cas où il manque).
    image_path.parent.mkdir(parents=True, exist_ok=True)
    qrcode.make(url).save(image_path)

    qr = db.scalar(select(QrCode).where(QrCode.experience_id == experience_pk))
    if qr is not None:
        qr.url = url
        qr.image_path = relative_path
        db.commit()
        db.refresh(qr)
        return qr

    qr = QrCode(experience_id=experience_pk, url=url, image_path=relative_path)
    db.add(qr)
    try:
        db.commit()
    except IntegrityError:
        # Course entre deux POST concurrents : la ligne a été créée entre-temps.
        # On repart de la ligne existante et on la met à jour (au lieu d'un 500).
        db.rollback()
        qr = db.scalar(select(QrCode).where(QrCode.experience_id == experience_pk))
        qr.url = url
        qr.image_path = relative_path
        db.commit()
    db.refresh(qr)
    return qr


def get_qr_or_404(db: Session, public_id: str) -> QrCode:
    """Retourne la ligne qr_codes de l'expérience, ou 404 si non encore générée."""
    experience = _get_experience_or_404(db, public_id)
    qr = db.scalar(select(QrCode).where(QrCode.experience_id == experience.id))
    if qr is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun QR code généré pour '{public_id}'. Lance d'abord POST /api/qr/{public_id}.",
        )
    return qr


def to_out(public_id: str, qr: QrCode) -> QrCodeOut:
    """Construit la réponse JSON décrivant le QR code généré."""
    return QrCodeOut(
        experience_id=public_id,
        url=qr.url,
        image_url=f"/api/qr/{public_id}",
    )
