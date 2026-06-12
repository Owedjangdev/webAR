"""Package des modèles ORM.

Importe tous les modèles pour qu'ils soient enregistrés sur Base.metadata
(nécessaire à la création des tables et aux relations entre modèles).
"""

from models.anonymous_session import AnonymousSession
from models.asset import Asset, AssetType
from models.backoffice_user import BackOfficeUser, UserRole
from models.experience import Experience, ExperienceStatus
from models.experience_event import EventType, ExperienceEvent
from models.hunt import Hunt, HuntStep
from models.place import Place
from models.qr_code import QrCode

__all__ = [
    "AnonymousSession",
    "Asset",
    "AssetType",
    "BackOfficeUser",
    "EventType",
    "Experience",
    "ExperienceEvent",
    "ExperienceStatus",
    "Hunt",
    "HuntStep",
    "Place",
    "QrCode",
    "UserRole",
]
