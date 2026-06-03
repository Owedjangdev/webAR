"""Point d'entrée de l'API WebAR : application FastAPI, CORS et routers."""

import models  # noqa: F401  (enregistre les modèles sur Base.metadata)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
from routers import assets, experiences, qr

# Crée les tables manquantes au démarrage (pratique en dev S1).
# En production, le schéma sera géré par Alembic (cf. CLAUDE.md section 3).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WebAR API",
    description="API backend de la plateforme WebAR par QR code (semaine 1).",
    version="0.1.0",
)

# CORS strict : seules les origines React connues (.env CORS_ORIGINS) sont
# autorisées, et uniquement les méthodes/headers réellement utilisés par le front.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # origines explicites, jamais "*"
    allow_credentials=False,  # pas de cookies/session pour l'instant
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # OPTIONS = préflight
    allow_headers=["Content-Type", "Authorization"],  # JSON + futur token d'auth
)

app.include_router(experiences.router)
app.include_router(qr.router)
app.include_router(assets.router)


@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    """Vérifie que l'API répond (utile pour un test rapide ou un monitoring)."""
    return {"status": "ok", "service": "webar-api"}
