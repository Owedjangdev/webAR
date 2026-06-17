"""Couche d'accès base de données : engine, session et classe de base ORM."""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

_BACKEND_DIR = Path(__file__).resolve().parent


def build_connect_args() -> dict:
    """Arguments de connexion du driver. Active le TLS vérifié par CA si DB_SSL_CA
    est défini — requis par les bases managées type Aiven. Sans cette variable
    (MySQL local en dev), connexion simple sans TLS. Réutilisé par Alembic."""
    if not settings.db_ssl_ca:
        return {}
    ca_path = Path(settings.db_ssl_ca)
    if not ca_path.is_absolute():
        ca_path = _BACKEND_DIR / ca_path
    return {"ssl": {"ca": str(ca_path)}}


# Engine SQLAlchemy : point de connexion unique vers MySQL.
# pool_pre_ping=True teste la connexion avant chaque usage et évite les erreurs
# "MySQL server has gone away" quand une connexion du pool a expiré.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.sql_echo,
    connect_args=build_connect_args(),
)

# Fabrique de sessions : une session = une unité de travail (transaction).
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Classe de base des modèles ORM (style SQLAlchemy 2.0)."""


def get_db() -> Generator[Session, None, None]:
    """Dépendance FastAPI : fournit une session BDD puis la ferme proprement."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
