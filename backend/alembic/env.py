from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Configuration du projet : on réutilise la même URL et les mêmes modèles que
# l'application (source de vérité unique), au lieu de dupliquer dans alembic.ini.
from config import settings
from database import Base
import models  # noqa: F401  (importe tous les modèles → les enregistre sur Base.metadata)

# Objet de configuration Alembic (valeurs de alembic.ini).
config = context.config

# URL de connexion : par défaut celle de l'app (settings/.env, jamais en dur).
# Override ponctuel possible via `alembic -x db_url=...` (ex. base jetable pour
# générer une baseline). Sert uniquement à l'outillage, pas à la prod.
_db_url = context.get_x_argument(as_dictionary=True).get("db_url") or settings.database_url
config.set_main_option("sqlalchemy.url", _db_url)

# Logging configuré par le fichier .ini.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Métadonnées cibles pour l'autogenerate : toutes les tables des modèles ORM.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Migrations en mode 'offline' (génère le SQL sans connexion DBAPI)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        # compare_server_default désactivé : sur MySQL, Alembic signale à tort
        # func.now() (modèle) ≠ CURRENT_TIMESTAMP (base reflétée) → faux positifs.
        # Les server_default réels sont fixés explicitement dans les migrations.
        compare_server_default=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Migrations en mode 'online' (connexion réelle à MySQL)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            # Voir note ci-dessus : désactivé pour éviter les faux positifs MySQL.
            compare_server_default=False,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
