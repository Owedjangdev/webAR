---
name: database-schema
description: Schéma de base de données MySQL du projet WebAR — tables places, experiences, qr_codes, assets, backoffice_users, hunts, anonymous_sessions, plus les décisions actées (status enum, asset lié au lieu OU à l'expérience). À utiliser DÈS QUE l'utilisateur crée ou modifie un modèle ORM SQLAlchemy, écrit une migration Alembic, définit une table, une colonne ou une relation entre entités, ou travaille avec MySQL Workbench / le dump SQL. Le diagramme de classes UML fait foi sur le design.
---

# Schéma base de données MySQL — WebAR

> Outil de gestion : **MySQL Workbench** (gratuit) pour créer/visualiser les tables, exécuter du SQL et **exporter le dump `.sql`** (livrable n°3 : 5 expériences / 3 lieux). Moteur : MySQL 8. Connexion backend via SQLAlchemy (driver PyMySQL ou mysqlclient), URL dans `.env` (`DATABASE_URL`).
> Migrations de schéma via **Alembic** (versionné dans Git). Workbench sert surtout à inspecter les données et générer le dump final.

> ⚠️ **Le diagramme de classes UML fait foi sur le design** (entités, attributs, relations). Consulter l'UML AVANT de coder une tâche structurante. En cas de conflit cahier des charges ↔ UML, signaler et trancher avec le binôme, puis acter la décision.

## Tables de base (cahier des charges)

- **places** : `id` PK AI, `name` VARCHAR(255) NOT NULL, `city` VARCHAR(100) NOT NULL, `created_at` DATETIME DEFAULT NOW()
- **experiences** : `id` PK AI, `public_id` VARCHAR(50) UNIQUE (ex. "exp_001"), `place_id` FK→places.id, `template` VARCHAR(50) NOT NULL, `config_json` JSON NOT NULL, `status` ENUM('draft','published') NOT NULL DEFAULT 'draft'
- **qr_codes** : `id` PK AI, `experience_id` FK→experiences.id, `url` VARCHAR(500) NOT NULL, `image_path` VARCHAR(500)
- **assets** : `id` PK AI, `place_id` FK→places.id NULL, `experience_id` FK→experiences.id NULL (**exactement un des deux**), `type` ENUM(overlay/logo/badge/image/audio) NOT NULL, `url` VARCHAR(500) NOT NULL, `alt_text` VARCHAR(255) NULL (accessibilité)

## Tables additionnelles (backoffice + gamification)

- **backoffice_users** : `id` PK, `email` UNIQUE, `password_hash` (bcrypt), `role` ENUM(`admin`/`partner`), `created_at`. **Implémenté en S5.** Le lien d'un compte `partner` vers ses lieux est **reporté** (on livre d'abord l'auth + routes admin ; le périmètre partenaire sera modélisé avec les routes `/api/partner/*`).
- **hunts**, **hunt_steps** : chasse au trésor multi-étapes
- **anonymous_sessions** : progression visiteur sans compte

## ✅ Décision actée (S5) — status enum

L'ancien `active` (TINYINT) est **remplacé** par `status ENUM('draft','published')` (l'UML fait foi). Migration : `backend/migrations/2026-06-05_experience_status.sql` (active=1 → `published`, active=0 → `draft`).
- Une expérience est **créée en `draft`**, publiée via `PUT /api/admin/experiences/{public_id}/publish`.
- Le **visiteur ne charge que les `published`** (un `draft` répond **404** « non disponible »).

## ✅ Décision actée (S4) — asset lié au lieu OU à l'expérience

Un asset est lié **soit à un LIEU (`place_id`), soit à une EXPÉRIENCE (`experience_id`)** : les deux colonnes existent (nullable), **exactement une** est remplie. Concilie le cahier des charges (`place_id`) ET l'UML (`experience_id`).
- Asset de **lieu** = partagé par toutes ses expériences (ex. logo).
- Asset d'**expérience** = propre à elle (ex. overlay), **prioritaire** lors de la fusion.
- Types = `overlay/logo/badge/image/audio` (union cahier + UML) ; champ `alt_text` ajouté (accessibilité, UML).

> Le **contrat JSON reste figé** : `assets = {overlay_image, logo}`. Les types `badge/image/audio` sont gérés via `/api/assets` mais **ne remontent pas** dans `GET /api/experience/{id}` tant que le contrat n'est pas étendu en accord binôme.

## Conventions backend BDD

- Accès BDD **uniquement via SQLAlchemy** (jamais de SQL brut → pas d'injection).
- Modèles ORM style SQLAlchemy 2.0 (`Mapped[...]`).
- Secrets / `DATABASE_URL` dans `.env` (jamais versionné), fournir `.env.example`.