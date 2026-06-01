"""Logique métier des QR codes : construction d'URL, génération PNG, persistance.

Isole ici (et pas dans le router) toute la génération QR, pour rester propre et
réutilisable (CLAUDE.md section 18).
"""

from pathlib import Path
from urllib.parse import urlencode

import qrcode
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import Experience, QrCode
from schemas.qr import QrCodeOut

# Chemins absolus (indépendants du répertoire d'où uvicorn est lancé).
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_QR_DIR = _BACKEND_DIR / "static" / "qr"

# Route du frontend qui lit le paramètre ?id= (cf. App.jsx). Le host, lui, vient
# de la config (.env) : aucune URL n'est codée en dur.
_EXPERIENCE_PATH = "/webar"


def build_experience_url(public_id: str) -> str:
    """Construit l'URL publique de l'expérience encodée dans le QR code."""
    base = settings.frontend_base_url.rstrip("/")
    return f"{base}{_EXPERIENCE_PATH}?{urlencode({'id': public_id})}"


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
    url = build_experience_url(public_id)

    # Garantit l'existence du dossier de sortie (gère le cas où il manque).
    _QR_DIR.mkdir(parents=True, exist_ok=True)
    qrcode.make(url).save(_QR_DIR / f"{public_id}.png")

    relative_path = _relative_image_path(public_id)
    qr = db.scalar(select(QrCode).where(QrCode.experience_id == experience.id))
    if qr is None:
        qr = QrCode(experience_id=experience.id, url=url, image_path=relative_path)
        db.add(qr)
    else:
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
