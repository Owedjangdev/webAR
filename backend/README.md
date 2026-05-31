# Backend WebAR — FastAPI + SQLAlchemy + MySQL

API REST de la plateforme WebAR par QR code. Voir `../CLAUDE.md` pour le cadrage
complet (stack, contrat JSON, schéma BDD, endpoints, conventions).

## Stack

- **FastAPI** (`fastapi[standard]`) + **Uvicorn**
- **SQLAlchemy 2.0** (style `Mapped[...]`) + **PyMySQL**
- **Pydantic v2** / **pydantic-settings**
- **MySQL 8**
- Python **3.12+**

## Structure

```
backend/
├── main.py            ← app FastAPI + CORS + inclusion des routers
├── config.py          ← lecture de la config depuis .env (pydantic-settings)
├── database.py        ← engine, session, Base ORM, dépendance get_db
├── models/            ← modèles ORM (place, experience, asset)
├── schemas/           ← schémas Pydantic (contrat JSON)
├── services/          ← logique métier (mapping ORM -> contrat)
├── routers/           ← endpoints REST (un fichier par domaine)
├── seed.py            ← insère les données de test (exp_001)
├── setup_db.sh        ← crée base + utilisateur MySQL depuis le .env
├── requirements.txt
└── .env.example       ← modèle de configuration (.env n'est PAS versionné)
```

## Installation et lancement (pas à pas)

### 1. Créer la base et l'utilisateur MySQL

Deux options, au choix.

**Option A — script automatique (recommandé).** Le script lit `DATABASE_URL`
dans ton `.env` et crée la base + l'utilisateur avec le bon mot de passe :

```bash
bash setup_db.sh        # demande le mot de passe root MySQL
```

**Option B — à la main dans MySQL Workbench** (ou `sudo mysql`). Exécute :

```sql
CREATE DATABASE webar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'webar_user'@'localhost' IDENTIFIED BY 'TON_MOT_DE_PASSE';
GRANT ALL PRIVILEGES ON webar.* TO 'webar_user'@'localhost';
FLUSH PRIVILEGES;
```

> Dans Workbench, connecte-toi ensuite avec **Username `webar_user`**,
> ton mot de passe, **Default Schema `webar`**.

### 2. Configurer le `.env`

```bash
cp .env.example .env
```

Édite `.env` et renseigne `DATABASE_URL` avec le même mot de passe qu'à l'étape 1 :

```
DATABASE_URL=mysql+pymysql://webar_user:TON_MOT_DE_PASSE@localhost:3306/webar
```

> ⚠️ Mot de passe **alphanumérique** de préférence : les caractères `@ : / # '`
> cassent l'URL de connexion. `.env` n'est jamais versionné (voir `.gitignore`).

### 3. Environnement virtuel + dépendances

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Insérer les données de test

```bash
python seed.py          # crée le lieu "Le Palmier" + exp_001 (idempotent)
```

### 5. Lancer le serveur

```bash
uvicorn main:app --reload --port 8000
```

- API : http://localhost:8000
- **Swagger (doc interactive)** : http://localhost:8000/docs

## Endpoints disponibles (semaine 1)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/experience/{id}` | Contrat JSON complet d'une expérience (404 si introuvable) |
| GET | `/api/experiences` | Liste des expériences actives |
| GET | `/` | Health check |

Exemple (le cœur du système, consommé par le frontend) :

```bash
curl http://localhost:8000/api/experience/exp_001
```

## Notes de conception

- **`public_id`** : la table `experiences` a une clé primaire interne `id` (entier)
  **et** un identifiant public `public_id` (ex. `"exp_001"`) = le champ `experience_id`
  du contrat JSON. À confirmer avec le binôme et figer dans le contrat en S2.
- En dev, les tables sont créées au démarrage (`Base.metadata.create_all`).
  En production, le schéma sera géré par **Alembic** (cf. CLAUDE.md section 3).
