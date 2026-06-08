# Migrations SQL héritées (S4–S5) — **historique, ne plus exécuter**

Ces scripts SQL datés ont été appliqués **à la main** (MySQL Workbench) avant
l'adoption d'Alembic :

- `2026-06-03_assets_owner.sql` — asset lié à un lieu **OU** une expérience (XOR).
- `2026-06-03_assets_unique_type.sql` — un seul asset par type et par propriétaire.
- `2026-06-05_experience_status.sql` — statut `draft` / `published` (remplace `active`).

Leur effet est **déjà intégré** dans la baseline Alembic
(`alembic/versions/…_baseline_schema_existant.py`). On les garde uniquement pour
la traçabilité. **Ne plus les rejouer.**

---

## Workflow Alembic (à partir de maintenant)

Le schéma est géré par **Alembic** (plus de `create_all` au démarrage).

```bash
cd backend

# Appliquer les migrations (install neuve OU mise à jour) :
.venv/bin/alembic upgrade head

# Après avoir modifié un modèle ORM, générer une migration :
.venv/bin/alembic revision --autogenerate -m "description courte"
# → RELIRE le fichier généré (MySQL : vérifier ENUM / server_default) avant upgrade.

# Vérifier que base et modèles sont synchro (utile en CI / avant commit) :
.venv/bin/alembic check

# État courant / historique :
.venv/bin/alembic current
.venv/bin/alembic history
```

### Mise en place initiale d'une base neuve
```bash
.venv/bin/alembic upgrade head     # crée le schéma
.venv/bin/python create_admin.py   # crée le compte admin
.venv/bin/python seed.py           # données de démo (optionnel)
```

> ⚠️ MySQL : Alembic `autogenerate` détecte mal certains `server_default`
> (`CURRENT_TIMESTAMP` vs `now()`). `compare_server_default` est donc désactivé
> dans `alembic/env.py` ; fixer les défauts explicitement dans les migrations.
