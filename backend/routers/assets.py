"""Endpoints REST du domaine 'assets' (préfixe /api)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.asset import AssetCreate, AssetOut
from services import asset_service

router = APIRouter(prefix="/api", tags=["assets"])


@router.post("/assets", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)) -> AssetOut:
    """Ajoute un asset à une expérience ou à un lieu.

    404 si l'expérience/le lieu référencé n'existe pas ; 422 si le `type` ou l'`url`
    sont invalides (validation Pydantic). Renvoie l'asset créé (code 201).
    """
    asset = asset_service.create_asset(db, payload)
    return asset_service.to_out(asset)


@router.get("/assets/{experience_id}", response_model=list[AssetOut])
def list_assets(experience_id: str, db: Session = Depends(get_db)) -> list[AssetOut]:
    """Liste les assets d'une expérience (404 si l'expérience n'existe pas)."""
    assets = asset_service.list_for_experience(db, experience_id)
    return [asset_service.to_out(asset) for asset in assets]
