"""Stockage des médias (assets) sur Cloudinary : upload + suppression.

Configuré depuis CLOUDINARY_URL (.env en dev, variable d'env sur Render). Si la
variable est absente, le backend retombe sur le stockage disque local
(cf. routers/admin.py) — pratique en dev sans compte Cloudinary.

Pourquoi Cloudinary : sur un hébergeur au disque éphémère (Render), les fichiers
uploadés localement ne survivent pas aux redéploiements ; Cloudinary fournit un
stockage permanent + CDN. Les images y sont servies avec CORS (*) -> la capture
souvenir (canvas.toDataURL) reste exportable.
"""

from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader

from config import settings
from models import AssetType

# Tous les médias du projet sont rangés sous ce dossier Cloudinary.
_FOLDER = "webar"
_configured = False

# resource_type Cloudinary selon le type d'asset : image, audio/vidéo, ou brut.
_RESOURCE_TYPE: dict[AssetType, str] = {
    AssetType.overlay: "image",
    AssetType.logo: "image",
    AssetType.badge: "image",
    AssetType.image: "image",
    AssetType.audio: "video",  # Cloudinary classe l'audio dans 'video'
    AssetType.model: "raw",  # .glb : fichier binaire brut
}


def is_enabled() -> bool:
    """Vrai si CLOUDINARY_URL est configuré (sinon repli disque local)."""
    return bool(settings.cloudinary_url)


def resource_type_for(asset_type: AssetType) -> str:
    """resource_type Cloudinary correspondant au type d'asset."""
    return _RESOURCE_TYPE.get(asset_type, "auto")


def _ensure_configured() -> None:
    """Configure le SDK une seule fois en parsant CLOUDINARY_URL.

    On parse explicitement l'URL (au lieu de compter sur la lecture auto de la
    variable d'environnement par le SDK, qui dépend de l'ordre des imports).
    """
    global _configured
    if _configured:
        return
    parsed = urlparse(settings.cloudinary_url)
    cloudinary.config(
        cloud_name=parsed.hostname,
        api_key=parsed.username,
        api_secret=parsed.password,
        secure=True,
    )
    _configured = True


def upload(content: bytes, *, public_id: str, resource_type: str = "image") -> dict:
    """Upload des octets vers Cloudinary. Retourne {url, public_id, resource_type}."""
    _ensure_configured()
    result = cloudinary.uploader.upload(
        content,
        folder=_FOLDER,
        public_id=public_id,
        resource_type=resource_type,
        overwrite=True,
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "resource_type": result.get("resource_type", resource_type),
    }


def destroy(public_id: str, resource_type: str = "image") -> None:
    """Supprime un média (rollback si l'attache de l'asset échoue). Best-effort."""
    _ensure_configured()
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
    except Exception:
        pass  # nettoyage opportuniste : ne jamais masquer l'erreur d'origine
