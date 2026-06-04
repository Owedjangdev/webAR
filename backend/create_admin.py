"""Script : crée (ou met à jour) un compte ADMIN de test, mot de passe HACHÉ.

Le mot de passe n'est jamais saisi en clair dans la ligne de commande ni stocké
tel quel : il est lu en mode masqué puis haché (bcrypt) avant insertion.

Usage (depuis backend/, venv actif et .env configuré) :
    python create_admin.py                 # demande l'email puis le mot de passe (masqué)
    python create_admin.py admin@webar.bj  # email en argument, mot de passe demandé

Idempotent : si l'email existe déjà, on met à jour son mot de passe et son rôle.
"""

import getpass
import sys

from sqlalchemy import select

import models  # noqa: F401  (enregistre les modèles sur Base.metadata)
from database import Base, SessionLocal, engine
from models import BackOfficeUser, UserRole
from security import hash_password


def main() -> None:
    # S'assure que la table backoffice_users existe (utile au premier lancement).
    Base.metadata.create_all(bind=engine)

    email = sys.argv[1] if len(sys.argv) > 1 else input("Email admin : ").strip()
    password = getpass.getpass("Mot de passe : ")
    if not email or not password:
        sys.exit("Email et mot de passe sont obligatoires.")

    db = SessionLocal()
    try:
        user = db.scalar(select(BackOfficeUser).where(BackOfficeUser.email == email))
        if user is None:
            user = BackOfficeUser(
                email=email,
                password_hash=hash_password(password),
                role=UserRole.admin,
            )
            db.add(user)
            action = "créé"
        else:
            user.password_hash = hash_password(password)
            user.role = UserRole.admin
            action = "mis à jour"
        db.commit()
        print(f"✅ Compte admin {action} : {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
