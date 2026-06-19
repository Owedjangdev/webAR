"""Point d'entrée de l'API WebAR : application FastAPI, CORS et routers."""

from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from routers import admin, assets, auth, experiences, hunt, partner, qr

# Le schéma de base est géré par Alembic (plus de create_all au démarrage) :
# appliquer les migrations avec `alembic upgrade head` avant de lancer l'API.

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

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Renvoie une 500 propre AVEC l'en-tête CORS. Sans ce handler, une erreur
    interne (ex. base injoignable) sort sans en-tête CORS et le navigateur l'affiche
    comme un faux problème « Access-Control-Allow-Origin manquant », masquant la
    vraie cause. On repose l'en-tête manuellement selon l'origine autorisée."""
    origin = request.headers.get("origin")
    headers: dict[str, str] = {}
    if origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=500,
        content={"detail": "Le service est momentanément indisponible. Réessaie dans un instant."},
        headers=headers,
    )


app.include_router(experiences.router)
app.include_router(qr.router)
app.include_router(assets.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(partner.router)
app.include_router(hunt.router)

# Sert les fichiers statiques (QR PNG générés, assets uploadés) sous /static.
app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).resolve().parent / "static"),
    name="static",
)


@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    """Vérifie que l'API répond (utile pour un test rapide ou un monitoring)."""
    return {"status": "ok", "service": "webar-api"}


@app.get("/healthz", tags=["health"])
def healthz(db: Session = Depends(get_db)) -> dict[str, str]:
    """Sonde de disponibilité qui TOUCHE la base (SELECT 1). À pinger toutes les
    ~10 min (UptimeRobot/cron) pour garder Render ET Aiven éveillés et éviter les
    500 au réveil. 500 propre (avec CORS) si la base est injoignable."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}
