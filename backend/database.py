"""Couche d'accès base de données : engine, session et classe de base ORM."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

# Connexion chiffrée (TLS) si un certificat CA est fourni (hébergeur managé type
# Aiven). En local, database_ssl_ca est vide → connexion standard, inchangée.
_connect_args = (
    {"ssl": {"ca": settings.database_ssl_ca}} if settings.database_ssl_ca else {}
)

# Engine SQLAlchemy : point de connexion unique vers MySQL.
# pool_pre_ping=True teste la connexion avant chaque usage et évite les erreurs
# "MySQL server has gone away" quand une connexion du pool a expiré.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.sql_echo,
    connect_args=_connect_args,
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
