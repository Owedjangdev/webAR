#!/usr/bin/env bash
# ============================================================
# Crée la base et l'utilisateur MySQL à partir de DATABASE_URL (.env).
# Garantit que le mot de passe MySQL = celui du .env (aucun décalage possible).
#
# Usage (demande le mot de passe root MySQL, jamais affiché) :
#     bash setup_db.sh
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Erreur : fichier .env introuvable dans $(pwd)." >&2
  exit 1
fi

# Le parsing de DATABASE_URL est délégué à Python (stdlib urllib) :
# - décode les caractères %XX (ex. %40 -> @) comme le fait SQLAlchemy ;
# - valide les identifiants (user / base) pour écarter toute injection ;
# - échappe le littéral mot de passe avant de l'insérer dans le SQL.
sql=$(python3 - <<'PYEOF'
import re
import sys
from urllib.parse import unquote, urlsplit

url = None
with open(".env", encoding="utf-8") as env_file:
    for line in env_file:
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip()
            break

if not url:
    sys.exit("DATABASE_URL absent du .env")

parts = urlsplit(url)
db_user = unquote(parts.username or "")
db_pass = unquote(parts.password or "")
db_name = (parts.path or "").lstrip("/")

if not db_user or not db_name:
    sys.exit("Impossible d'extraire l'utilisateur ou la base depuis DATABASE_URL")

# Identifiants : on n'échappe pas, on refuse tout ce qui sort de [A-Za-z0-9_].
if not re.fullmatch(r"[A-Za-z0-9_]+", db_name):
    sys.exit(f"Nom de base invalide (caractères autorisés : A-Z a-z 0-9 _) : {db_name!r}")
if not re.fullmatch(r"[A-Za-z0-9_]+", db_user):
    sys.exit(f"Nom d'utilisateur invalide (caractères autorisés : A-Z a-z 0-9 _) : {db_user!r}")


def sql_literal(value: str) -> str:
    """Échappe une chaîne pour un littéral SQL ('...' MySQL)."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


password = sql_literal(db_pass)
print(f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
      "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
print(f"CREATE USER IF NOT EXISTS '{db_user}'@'localhost' IDENTIFIED BY '{password}';")
print(f"ALTER USER '{db_user}'@'localhost' IDENTIFIED BY '{password}';")
print(f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO '{db_user}'@'localhost';")
print("FLUSH PRIVILEGES;")
PYEOF
)

# Mot de passe root MySQL (saisi sans écho, défini à l'installation de MySQL).
read -rsp "Mot de passe root MySQL : " root_pass
echo

echo "Configuration de la base et de l'utilisateur applicatif..."
printf '%s\n' "$sql" | mysql -u root -p"${root_pass}"

echo "OK : base + utilisateur prêts (mot de passe aligné sur le .env)."
