"""Endpoints REST du domaine 'qr' : génération et accès aux QR codes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from schemas.qr import QrCodeOut
from services import qr_service

router = APIRouter(prefix="/api/qr", tags=["qr"])


@router.post(
    "/{experience_id}",
    response_model=QrCodeOut,
    status_code=status.HTTP_201_CREATED,
)
def create_qr(experience_id: str, db: Session = Depends(get_db)) -> QrCodeOut:
    """Génère (ou régénère) le QR code d'une expérience.

    Encode l'URL publique de l'expérience, sauvegarde le PNG dans static/qr/ et
    enregistre/met à jour la ligne qr_codes. Renvoie les infos du QR (code 201).
    404 si l'expérience n'existe pas.
    """
    qr = qr_service.generate_qr(db, experience_id)
    return qr_service.to_out(experience_id, qr)


@router.get("/{experience_id}")
def get_qr_image(experience_id: str, db: Session = Depends(get_db)) -> FileResponse:
    """Retourne l'image PNG du QR code d'une expérience.

    404 si aucun QR n'a encore été généré (ou si le fichier est absent du disque).
    """
    qr = qr_service.get_qr_or_404(db, experience_id)
    path = qr_service.image_file_path(qr)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fichier QR manquant pour '{experience_id}'. Relance POST /api/qr/{experience_id}.",
        )
    return FileResponse(path, media_type="image/png", filename=f"{experience_id}.png")
