"""Package des modèles ORM.

Importe tous les modèles pour qu'ils soient enregistrés sur Base.metadata
(nécessaire à la création des tables et aux relations entre modèles).
"""

from models.asset import Asset, AssetType
from models.experience import Experience
from models.place import Place

__all__ = ["Asset", "AssetType", "Experience", "Place"]
