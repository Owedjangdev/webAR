"""Point d'entrée de l'API WebAR : application FastAPI, CORS et routers."""

import models  # noqa: F401  (enregistre les modèles sur Base.metadata)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
from routers import experiences, qr

# Crée les tables manquantes au démarrage (pratique en dev S1).
# En production, le schéma sera géré par Alembic (cf. CLAUDE.md section 3).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WebAR API",
    description="API backend de la plateforme WebAR par QR code (semaine 1).",
    version="0.1.0",
)

# CORS strict : seules les origines React connues sont autorisées (cf. .env).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experiences.router)
app.include_router(qr.router)


@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    """Vérifie que l'API répond (utile pour un test rapide ou un monitoring)."""
    return {"status": "ok", "service": "webar-api"}
