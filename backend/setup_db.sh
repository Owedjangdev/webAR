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

# Lit DATABASE_URL puis extrait user / password / nom de base.
# Format attendu : mysql+pymysql://USER:PASS@HOST:PORT/DB
url=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)
after_proto=${url#*://}          # USER:PASS@HOST:PORT/DB
credentials=${after_proto%@*}    # USER:PASS
host_part=${after_proto##*@}     # HOST:PORT/DB
db_user=${credentials%%:*}
db_pass=${credentials#*:}
db_name=${host_part##*/}

# Mot de passe root MySQL (saisi sans écho, défini à l'installation de MySQL).
read -rsp "Mot de passe root MySQL : " root_pass
echo

echo "Configuration de la base '${db_name}' et de l'utilisateur '${db_user}'..."

mysql -u root -p"${root_pass}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${db_name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';
ALTER USER '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "OK : base + utilisateur prêts (mot de passe aligné sur le .env)."
