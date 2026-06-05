"""Package des modèles ORM.

Importe tous les modèles pour qu'ils soient enregistrés sur Base.metadata
(nécessaire à la création des tables et aux relations entre modèles).
"""

from models.asset import Asset, AssetType
from models.backoffice_user import BackOfficeUser, UserRole
from models.experience import Experience, ExperienceStatus
from models.place import Place
from models.qr_code import QrCode

__all__ = [
    "Asset",
    "AssetType",
    "BackOfficeUser",
    "Experience",
    "ExperienceStatus",
    "Place",
    "QrCode",
    "UserRole",
]
