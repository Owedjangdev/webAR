# Déploiement WebAR — 100 % gratuit (Aiven + Render + Vercel)

Architecture :

```
Frontend (build Vite)  →  Vercel       (HTTPS auto)
Backend  (FastAPI)     →  Render        (HTTPS auto)
Base     (MySQL 8)     →  Aiven         (always free)
```

> ⚠️ Ordre important : **Aiven d'abord** (la base), **puis Render** (a besoin de l'URL de la base), **puis Vercel** (a besoin de l'URL de l'API), **puis** on revient sur Render pour autoriser l'URL Vercel (CORS).

---

## Phase 2 — Base MySQL sur Aiven

1. Crée un compte sur **aiven.io** (sans carte bancaire).
2. **Create service → MySQL → plan Free**. Région la plus proche (Europe).
3. Une fois le service « Running », onglet **Overview / Connection information**, récupère :
   - `host`, `port`, `user` (souvent `avnadmin`), `password`, `database` (souvent `defaultdb`).
   - Télécharge le **CA Certificate** (`ca.pem`).
4. Compose l'URL pour SQLAlchemy/PyMySQL :
   ```
   mysql+pymysql://avnadmin:MOT_DE_PASSE@HOST:PORT/defaultdb
   ```
5. Place `ca.pem` dans `backend/certs/ca.pem` (dossier à créer). Il sera utilisé via `DATABASE_SSL_CA`.

> Le schéma sera créé automatiquement par Alembic au 1ᵉʳ démarrage de Render
> (`alembic upgrade head`). Pas besoin de créer les tables à la main.

---

## Phase 3 — Backend sur Render

1. Crée un compte sur **render.com** (connecté à ton GitHub).
2. **New → Blueprint**, sélectionne le repo `webAR` → Render lit `render.yaml`.
   (Ou **New → Web Service** manuel : Root Directory = `backend`, Build = `pip install -r requirements.txt`, Start = `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`.)
3. Renseigne les variables d'environnement (onglet **Environment**) :
   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | l'URL Aiven (phase 2) |
   | `DATABASE_SSL_CA` | `certs/ca.pem` |
   | `JWT_SECRET` | `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `CORS_ORIGINS` | (temporaire) `http://localhost:5173` — on mettra l'URL Vercel en phase 5 |
   | `FRONTEND_BASE_URL` | (idem, à mettre à jour) |
4. Déploie. Render te donne une URL type `https://webar-api.onrender.com`.
5. Vérifie : ouvre `https://webar-api.onrender.com/docs` (Swagger).
6. **Crée le compte admin** une fois : en local, mets l'URL Aiven dans ton `.env`, puis
   `python create_admin.py` (et `python seed.py` / `python seed_hunt.py` pour des données de démo).

> ⚠️ Free tier : l'API **s'endort** après ~15 min d'inactivité (1ᵉʳ appel ~50 s).
> ⚠️ Disque **éphémère** : les logos uploadés et QR PNG générés sont perdus à chaque
> redéploiement. Acceptable pour une démo (on régénère).

---

## Phase 4 — Frontend sur Vercel

1. Crée un compte sur **vercel.com** (connecté à GitHub).
2. **Add New → Project**, importe `webAR`.
3. **Root Directory = `frontend`** (Vercel détecte Vite : build `npm run build`, output `dist`).
4. Variable d'environnement :
   | Variable | Valeur |
   |---|---|
   | `VITE_API_BASE_URL` | l'URL Render (ex. `https://webar-api.onrender.com`) |
5. Déploie. Vercel te donne une URL type `https://webar.vercel.app`.
   (`vercel.json` gère déjà le routing SPA : un refresh sur `/admin/...` ne fait pas 404.)

---

## Phase 5 — Relier les deux (CORS)

1. Retourne sur **Render → Environment** et mets à jour :
   - `CORS_ORIGINS` = `https://webar.vercel.app`
   - `FRONTEND_BASE_URL` = `https://webar.vercel.app`
2. Render redéploie. Le frontend Vercel peut maintenant appeler l'API sans erreur CORS.

---

## Checklist finale
- [ ] `https://webar-api.onrender.com/docs` répond.
- [ ] Connexion au back-office depuis l'URL Vercel (admin créé en phase 3).
- [ ] Caméra OK sur mobile (HTTPS Vercel ✓).
- [ ] QR généré pointe vers l'URL Vercel publique.
