"""asset type model (object_ar 3d glb)

Revision ID: f35483f7db6b
Revises: c57343cda026
Create Date: 2026-06-15 16:36:49.345634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f35483f7db6b'
down_revision: Union[str, Sequence[str], None] = 'c57343cda026'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Valeurs de l'ENUM assets.type avant / après l'ajout de 'model'.
_ENUM_WITH_MODEL = "ENUM('overlay','logo','badge','image','audio','model')"
_ENUM_WITHOUT_MODEL = "ENUM('overlay','logo','badge','image','audio')"


def upgrade() -> None:
    """Ajoute la valeur 'model' à l'ENUM MySQL de assets.type (modèle 3D object_ar)."""
    op.execute(f"ALTER TABLE assets MODIFY COLUMN type {_ENUM_WITH_MODEL} NOT NULL")


def downgrade() -> None:
    """Retire 'model' de l'ENUM (échoue si des assets de ce type existent encore)."""
    op.execute(f"ALTER TABLE assets MODIFY COLUMN type {_ENUM_WITHOUT_MODEL} NOT NULL")
