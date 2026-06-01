"""Schémas Pydantic v2 des réponses liées aux QR codes."""

from pydantic import BaseModel


class QrCodeOut(BaseModel):
    """Réponse de POST /api/qr/{experience_id} : infos du QR code généré."""

    experience_id: str  # identifiant public de l'expérience (ex. "exp_001")
    url: str  # URL publique encodée dans le QR
    image_url: str  # URL d'accès à l'image PNG (endpoint GET /api/qr/{id})
