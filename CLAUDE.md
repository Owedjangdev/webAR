# CLAUDE.md — Plateforme WebAR par QR code

> Fichier de mémoire projet pour Claude Code (VS Code).
> Lis ce fichier avant toute action. Il fait foi sur la stack, l'architecture, le contrat JSON et les conventions.
> En cas de conflit entre une demande et ce fichier, signale-le avant d'agir.

---

## 1. Le projet en une phrase

Un visiteur scanne un QR code dans un lieu physique → le frontend charge une expérience depuis l'API → la caméra s'active → le visiteur vit une expérience de réalité augmentée → il capture un souvenir → il le partage (WhatsApp) ou le télécharge. Un backoffice permet à l'admin de gérer lieux/expériences/assets/QR codes, et au partenaire de consulter uniquement ses propres données.

- **Type** : projet de fin de licence Génie Logiciel (Bénin, 2024-2025)
- **Équipe** : 2 étudiants (Frontend + Backend), Épiphane = chef de projet sur les deux parties
- **Durée** : 8 semaines
- **Cible** : Android entry-level, Chrome ≥ 80, **sans installation**, y compris appareils non certifiés ARCore

---

## 2. État d'avancement actuel

> **⚠️ NOUS SOMMES EN SEMAINE 5.** Les bases sont solides ; on sécurise le backoffice (authentification) et on a finalisé le souvenir frontend.
>
> **Fait (S1 → S5) :**
> - **S1** — Frontend React + Vite + Tailwind v3.4 (pages chargement / expérience / erreur, hook `useCamera`). Backend FastAPI + SQLAlchemy + MySQL, `GET /api/experiences` et `GET /api/experience/{id}`, CORS. Intégration front↔back validée.
> - **S2** — CRUD expériences (`POST` / `PUT /api/experience`) ; côté frontend, **chargeur de templates dynamique** (registre lisant le champ `template`).
> - **S3** — Génération de **QR codes** (`POST` / `GET /api/qr/{id}`, table `qr_codes`) ; template **Selfie SouvenirAR** complet (caméra, overlay, capture, recadrage pinch-to-zoom).
> - **S4** — Gestion des **assets** : asset lié à un **lieu OU une expérience** (cf. section 7), `POST /api/assets` (upsert, un par type) + `GET /api/assets/{id}`, champ `alt_text`, types `overlay/logo/badge/image/audio`. Revue CORS.
> - **S5** — **Authentification backoffice** : modèle `BackOfficeUser` (email, mot de passe **haché bcrypt**, rôle `admin`/`partner`), `POST /api/login` renvoyant un **JWT + le rôle**, dépendances `get_current_user` / `require_admin`, routes protégées `GET /api/admin/places` & `/api/admin/experiences` (**401** sans jeton, **403** si non-admin) ; `JWT_SECRET` en `.env`. Le rattachement d'un compte *partner* à ses lieux est **reporté** aux semaines suivantes (routes partenaire). Côté frontend : souvenir partageable finalisé (Web Share API + repli téléchargement, écran d'erreur), `CropEditor` retiré (PR #10/#12 mergées).
>
> Jalon courant : React sur `localhost:5173`, FastAPI sur `localhost:8000`, MySQL connecté, les deux communiquent ; backoffice protégé par JWT.
>
> ✅ Le **contrat JSON** (section 6) est **figé** (depuis la S2) : `assets = {overlay_image, logo}`.

Met à jour cette section au fil de l'avancement.

---

## 3. Stack technique (versions récentes — mai 2026)

> Le cahier des charges date de 2024-2025 et indiquait React 18 / Tailwind 3 / Vite 5. On vise désormais les **dernières versions stables**. Versions vérifiées en mai 2026 :

| Couche | Techno | Version cible | Rôle |
|---|---|---|---|
| Frontend UI | React + ReactDOM | **19.2.x** | Composants par template, état caméra, routing |
| Style | Tailwind CSS | **3.4.x** (compatible Chrome ≥ 80) | Mobile-first, bundle minimal |
| Build | Vite | **8.x** | Build React + HMR (plugin `@vitejs/plugin-react`) |
| Routing | React Router | **7.x** | Routing frontend si besoin |
| Backend API | FastAPI | **0.136.x** (`fastapi[standard]`) | API REST, validation Pydantic v2, génération QR |
| ORM | SQLAlchemy | **2.0.4x** | Modèles ORM (style 2.0 `Mapped[...]`), async possible |
| Validation | Pydantic | **v2** | Schémas de validation |
| Migrations | Alembic | dernière stable | Migrations de schéma MySQL |
| Base de données | MySQL | **8.x** | Lieux, expériences, QR codes, assets (JSON natif) |
| Outil BDD (GUI) | MySQL Workbench | dernière stable (gratuit) | Gestion visuelle de la base : créer/voir les tables, exécuter du SQL, exporter le dump `.sql` |
| Driver MySQL | PyMySQL ou mysqlclient | dernière stable | Connexion SQLAlchemy ↔ MySQL |
| Serveur ASGI | Uvicorn | **0.3x** | Sert FastAPI |
| Génération QR | qrcode + Pillow | dernière stable | QR codes PNG |
| Runtime | Node.js | **24 LTS** / Python **3.12 ou 3.13** | Environnements |

**Toujours installer la dernière version stable** (`npm install react@latest`, `pip install -U fastapi`), puis **épingler les versions exactes** une fois testées (`package-lock.json`, versions figées dans `requirements.txt`).

> ⚠️ **Cible de build navigateur.** React 19 et Vite 8 sont récents, mais leur sortie par défaut peut viser des navigateurs trop modernes. Comme la cible est **Chrome ≥ 80**, configurer explicitement la cible de build dans `vite.config.js` (option `build.target`, ex. `'es2020'` / `'chrome80'`) et tester réellement sur un Android ancien. Si un comportement casse sur Chrome 80, c'est cette cible de build qu'il faut ajuster en priorité.

> ✅ **Décision actée — Tailwind v3.4 (pas v4).**
> La cible navigateur du projet est **Chrome ≥ 80 sur Android entry-level** (argument d'inclusivité central du cahier des charges). Tailwind v4 exige Chrome 111+ (`@property`, `color-mix()`) et est donc **exclu**. On reste sur **Tailwind CSS v3.4.x**, compatible avec les navigateurs anciens.
> Configuration v3 classique : `tailwind.config.js` + directives `@tailwind base; @tailwind components; @tailwind utilities;` dans le CSS (NE PAS utiliser la syntaxe v4 `@import "tailwindcss"` ni le plugin `@tailwindcss/vite`).
> Ne pas proposer de migration vers Tailwind v4 sans changer d'abord la cible navigateur du cahier des charges (décision binôme).

**Ne propose jamais une autre stack** (pas de PHP, pas d'Express, pas de Vue, etc.) sans le signaler explicitement.

---

## 4. Structure du monorepo (cible)

```
webar/
├── CLAUDE.md                  ← ce fichier
├── README.md
├── frontend/                  ← React + Vite + Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── pages/
│       │   ├── ExperiencePage.jsx       ← page visiteur principale (lit ?id=)
│       │   └── ErrorPage.jsx
│       ├── hooks/
│       │   ├── useCamera.js             ← getUserMedia
│       │   └── useCanvas.js             ← rendu + capture
│       ├── templates/                   ← 1 composant par template AR (isolés)
│       │   ├── SelfieARTemplate.jsx
│       │   ├── BadgeTemplate.jsx
│       │   ├── ObjectARTemplate.jsx
│       │   ├── TreasureTemplate.jsx
│       │   ├── GuideNarratifTemplate.jsx
│       │   ├── CapsuleCollectiveTemplate.jsx
│       │   └── PortalARTemplate.jsx
│       ├── backoffice/                  ← interfaces admin + partenaire
│       └── lib/                         ← appels API, helpers
└── backend/                   ← FastAPI + SQLAlchemy + MySQL
    ├── main.py                ← point d'entrée + CORS
    ├── requirements.txt
    ├── .env                   ← NON versionné (DATABASE_URL, etc.)
    ├── .env.example
    ├── database.py            ← engine + session SQLAlchemy
    ├── models/                ← modèles ORM
    ├── schemas/               ← Pydantic
    ├── routers/               ← endpoints REST (un fichier par domaine)
    ├── services/
    │   └── qr_service.py      ← génération QR (lib python qrcode)
    └── static/                ← assets, overlays, logos, QR PNG
```

---

## 5. Architecture globale

Deux composants reliés par un **contrat JSON standardisé et figé en S2**.

- **Frontend (React)** : `ExperiencePage.jsx` lit `?id=` dans l'URL → appelle `GET /api/experience/{id}` → instancie le template correspondant → `useCamera` (getUserMedia) → `useCanvas` compose vidéo + overlays → capture → Web Share API.
- **Backend (FastAPI)** : `main.py` + CORS, `routers/` (8 endpoints), `models/` (SQLAlchemy/MySQL), `services/qr_service.py`, `static/`.

Boucle fondamentale : **Un lieu → Une expérience AR → Un souvenir → Un partage.**

---

## 6. ⚠️ CONTRAT JSON (figé en S2 — NE PAS MODIFIER sans accord)

C'est l'interface obligatoire backend ↔ frontend. Toute modification unilatérale casse l'intégration.

```json
{
  "experience_id": "exp_001",
  "template": "selfie_ar",
  "place": { "name": "Restaurant Le Palmier", "city": "Cotonou" },
  "assets": {
    "overlay_image": "https://cdn.../palmier.png",
    "logo": "https://cdn.../palmier_logo.png"
  },
  "config": { "message": "Souvenir au Palmier", "color": "#FFAA00" }
}
```

Règles :
- Le frontend lit `template` pour choisir le composant à instancier.
- Le frontend ne consomme **jamais** de données fictives en production : toujours les endpoints réels.
- Toute évolution du schéma → validation écrite des deux étudiants, puis mise à jour de ce fichier.

---

## 7. Schéma base de données MySQL

> Outil de gestion : **MySQL Workbench** (logiciel gratuit) pour créer/visualiser les tables, exécuter du SQL et **exporter le dump `.sql`** (livrable n°3 : 5 expériences / 3 lieux). Le moteur reste MySQL 8. Le backend s'y connecte via SQLAlchemy (driver PyMySQL ou mysqlclient), URL dans `.env` (`DATABASE_URL`).
> Les migrations de schéma se font idéalement via **Alembic** (versionné dans Git), Workbench servant surtout à inspecter les données et générer le dump final.

> Le cahier des charges décrit 4 tables de base. Le plan de travail et les diagrammes UML ajoutent l'authentification backoffice (rôles admin/partner), les QR codes, la chasse au trésor et les sessions anonymes. À cadrer avec le binôme avant migration.

**Tables de base (cahier des charges) :**

- **places** : `id` PK AI, `name` VARCHAR(255) NOT NULL, `city` VARCHAR(100) NOT NULL, `created_at` DATETIME DEFAULT NOW()
- **experiences** : `id` PK AI, `public_id` VARCHAR(50) UNIQUE (ex. "exp_001"), `place_id` FK→places.id, `template` VARCHAR(50) NOT NULL, `config_json` JSON NOT NULL, `status` ENUM('draft','published') NOT NULL DEFAULT 'draft'
- **qr_codes** : `id` PK AI, `experience_id` FK→experiences.id, `url` VARCHAR(500) NOT NULL, `image_path` VARCHAR(500)
- **assets** : `id` PK AI, `place_id` FK→places.id NULL, `experience_id` FK→experiences.id NULL (**exactement un des deux**), `type` ENUM(overlay/logo/badge/image/audio) NOT NULL, `url` VARCHAR(500) NOT NULL, `alt_text` VARCHAR(255) NULL (accessibilité)

**Tables additionnelles (backoffice + gamification, à confirmer) :**

- **backoffice_users** : `id` PK, `email` UNIQUE, `password_hash` (bcrypt), `role` ENUM(`admin`/`partner`), `created_at`. **Implémenté en S5.** Le lien d'un compte `partner` vers ses lieux est **reporté** (décision binôme S5 : on livre d'abord l'auth + les routes admin ; le périmètre partenaire sera modélisé avec les routes `/api/partner/*`).
- **hunts**, **hunt_steps** : chasse au trésor multi-étapes
- **anonymous_sessions** : progression visiteur sans compte

> ✅ **Décision actée (S5).** L'ancien `active` (TINYINT) est **remplacé** par `status ENUM('draft','published')` (l'UML fait foi). Migration : `backend/migrations/2026-06-05_experience_status.sql` (active=1 → `published`, active=0 → `draft`). Une expérience est **créée en `draft`**, publiée via `PUT /api/admin/experiences/{public_id}/publish` ; le **visiteur ne charge que les `published`** (un `draft` répond **404** « non disponible »).

> ✅ **Décision actée (semaine 4 — cahier des charges + diagramme UML conciliés).** Un asset est lié **soit à un LIEU (`place_id`), soit à une EXPÉRIENCE (`experience_id`)** : les deux colonnes existent (nullable), **exactement une** est remplie. Cela respecte **à la fois** le cahier des charges (qui prévoyait `place_id`) **et** l'UML (qui prévoit `experience_id`). Asset de **lieu** = partagé par toutes ses expériences (ex. logo) ; asset d'**expérience** = propre à elle (ex. overlay), **prioritaire** lors de la fusion. Types = `overlay/logo/badge/image/audio` (union : `badge` du cahier + `image` de l'UML) ; champ `alt_text` ajouté (accessibilité, UML).
> Le **contrat JSON (section 6) reste figé** : `assets = {overlay_image, logo}`. Les types `badge/image/audio` sont gérés via les endpoints `/api/assets` mais **ne remontent pas** dans `GET /api/experience/{id}` tant que le contrat n'est pas étendu **en accord binôme**.

---

## 8. Endpoints API REST

Préfixe `/api`. Documentation Swagger obligatoire (testée avant intégration frontend).

| Méthode | Endpoint | Description | Acteur |
|---|---|---|---|
| GET | `/api/experience/{id}` | JSON complet de l'expérience — cœur du système | React (démarrage) |
| GET | `/api/experiences` | Liste des expériences actives | Admin / React |
| POST | `/api/experience` | Crée une expérience | Admin |
| PUT | `/api/experience/{id}` | Met à jour la configuration | Admin |
| GET | `/api/qr/{id}` | Image QR PNG prête à imprimer | Admin |
| GET | `/api/places` | Liste des lieux | Admin |
| POST | `/api/places` | Ajoute un lieu | Admin |
| POST | `/api/assets/upload` | Upload overlay / logo / badge | Admin |

Endpoints backoffice **implémentés en S5** (réservés admin — **401** sans jeton, **403** si non-admin) : `POST /api/login` (renvoie **JWT + rôle**), `GET /api/admin/places`, `GET /api/admin/experiences`, `POST /api/admin/places`, `POST /api/admin/experiences` (créée en **draft**), `PUT /api/admin/experiences/{public_id}/publish` & `…/unpublish`.

Endpoints additionnels (à intégrer plus tard) : `GET /api/partner/*` (filtré par `partner_id`), `GET /api/hunt/{experience_id}`, `POST /api/hunt/step/validate`.

---

## 9. Les 7 templates AR

Chaque template = **un composant React indépendant et isolé** dans `src/templates/`, instancié selon le champ `template` du JSON.

| # | Nom | `template` (clé JSON) | Statut | Description |
|---|---|---|---|---|
| 1 | Selfie SouvenirAR | `selfie_ar` | **Obligatoire** | Caméra frontale + overlay + logo + message → photo souvenir |
| 2 | Badge de Lieu | `badge` | **Obligatoire** | Badge numérique animé débloqué (gamification) |
| 3 | Objet InteractifAR | `object_ar` | **Obligatoire** | QR sur objet physique → animation/présentation |
| 4 | Chasse au Trésor QR | `treasure_hunt` | **Obligatoire** | Parcours multi-étapes, progression localStorage, récompense finale |
| 5 | Guide NarratifAR | `guide_narratif` | Simplifié | Personnage 2D + narration audio/texte |
| 6 | Capsule Collective | `capsule_collective` | Simplifié | Photo de groupe, cadre commun, partage WhatsApp |
| 7 | Portail AR | `portal_ar` | Simplifié | Fenêtre virtuelle vers une autre scène |

> Confirme les clés exactes de `template` avec le binôme et fige-les dans le contrat JSON.
> Priorité absolue aux 4 templates obligatoires. Les 4 templates simplifiés sont sacrifiables si retard.

---

## 10. Acteurs et cas d'usage (UML)

Trois acteurs :

- **Visiteur** : scanner QR, autoriser caméra, vivre l'expérience, capturer, partager. Aucun compte requis.
- **Administrateur** : se connecter, créer/modifier/publier expériences, générer QR, gérer lieux, comptes partenaires, assets.
- **Lieu partenaire** : se connecter, consulter **uniquement** ses lieux/expériences/QR/stats (filtrage par `partner_id`, accès aux données d'un autre lieu → refusé).

Flux critiques documentés : scan→expérience→partage, créer/modifier une expérience, générer un QR, tableau de bord partenaire, boucle chasse au trésor.

---

## 11. Conventions de code

**Frontend :**
- Un template = un composant isolé dans `src/templates/`, jamais de logique template hors de ce dossier.
- Hooks dédiés : `useCamera` (getUserMedia), `useCanvas` (rendu + `canvas.toDataURL()` pour la capture).
- Mobile-first Tailwind. Pas de CSS externe lourd.
- Toujours gérer les fallbacks : caméra refusée (mode sans caméra + message), Web Share API absente (bouton téléchargement), asset manquant, expérience introuvable.
- Lire `experience_id` / `id` depuis l'URL.

**Backend :**
- Validation Pydantic sur **tous** les POST/PUT.
- Accès BDD uniquement via SQLAlchemy (jamais de SQL brut → pas d'injection).
- Erreurs HTTP claires : 404 (introuvable), 422 (données invalides).
- Secrets dans `.env` (jamais versionné) ; fournir `.env.example`.
- CORS strict : seules les origines React connues.
- Tout endpoint testé dans Swagger avant intégration.

**Général :**
- Git : branches par fonctionnalité.
- Ne jamais toucher au contrat JSON sans validation écrite des deux étudiants.

---

## 12. Exigences de performance (à respecter dans toute optimisation)

| Contrainte | Max | Mesure |
|---|---|---|
| Chargement expérience | 3 s | Du scan QR à l'affichage caméra + overlay |
| Capture image | 2 s | Du clic Capturer à l'image finale |
| Flux complet | 10 s | Du scan QR au partage WhatsApp |
| Disponibilité API | > 99 % | En conditions terrain |

Leviers : PNG compressés, lazy loading, bundle Tailwind minimal.

---

## 13. Sécurité & contraintes

- HTTPS obligatoire en prod (`getUserMedia` exige une origine sécurisée).
- Backend déployé sur URL publique accessible depuis mobile.
- `.env` non versionné ; CORS strict ; Pydantic partout ; ORM pour éviter l'injection SQL.

---

## 14. Livrables (rappel)

Code source (frontend + backend), app déployée (URL publique), dump MySQL peuplé (5 expériences / 3 lieux), 5 QR codes PNG 300 dpi imprimables, doc technique, doc utilisateur, rapport de tests (≥ 2 Android), démo live.

**Critère de validation finale :** la boucle QR → scan → expérience AR → capture → partage WhatsApp fonctionne de bout en bout sur un Android réel dans un lieu réel, et les 4 templates obligatoires sont fonctionnels.

---

## 15. Intégration Figma → VS Code (à compléter)

> Épiphane veut connecter son lien Figma dans VS Code. Section à remplir une fois le lien fourni.
> Pistes : extension officielle « Figma for VS Code », ou Figma Dev Mode + MCP, ou export des tokens/SVG.
> ⚠️ Le code généré depuis Figma doit être réécrit en composants React + Tailwind conformes aux conventions ci-dessus (pas de CSS inline brut copié tel quel).

---

## 16. ⚠️ Workflow Git & versioning (RÈGLE OBLIGATOIRE)

> Discipline de versioning du projet. **Une fonctionnalité = une branche dédiée = un push = un merge.** Frontend et backend ont des branches séparées.

### Principe central

- **Jamais de travail directement sur `main`.** `main` ne reçoit que du code testé, via merge.
- **Chaque nouvelle fonctionnalité = sa propre branche**, créée à partir de `main` à jour.
- Quand une fonctionnalité est **terminée et testée** : commit → push de la branche → merge dans `main` (via Pull Request de préférence).
- **Claude Code doit RAPPELER systématiquement** ces étapes : « cette fonctionnalité est finie → crée une branche si pas déjà fait, commit, push, puis merge ». Ne jamais laisser du travail non commité s'accumuler.

### Séparation frontend / backend (branches préfixées)

Le frontend et le backend versionnent **séparément**, chacun ses branches, ses push, ses merges :

- Branches frontend : **`frontend/<nom-fonctionnalite>`** — ex. `frontend/selfie-template`, `frontend/use-camera-hook`
- Branches backend : **`backend/<nom-fonctionnalite>`** — ex. `backend/crud-experiences`, `backend/qr-generation`
- Chacun ne touche que ses propres branches. On ne push pas sur les branches de l'autre.
- Les deux fusionnent vers le même `main` (le monorepo a un seul `main`), mais via des branches distinctes pour éviter les conflits.

### Cycle de travail pour CHAQUE fonctionnalité

```bash
# 1. Partir d'un main à jour
git checkout main
git pull origin main

# 2. Créer la branche de la fonctionnalité (préfixe frontend/ ou backend/)
git checkout -b frontend/selfie-template      # ou backend/crud-experiences

# 3. Travailler, puis commiter par petits incréments clairs
git add .
git commit -m "feat(frontend): squelette SelfieARTemplate"

# 4. Pousser la branche sur GitHub
git push -u origin frontend/selfie-template

# 5. Fonctionnalité finie et testée → ouvrir une Pull Request sur GitHub.
#    CodeRabbit poste sa revue automatique. Traiter les remarques, puis Merge via l'interface GitHub.
#    (Préférer la PR au merge local pour que CodeRabbit s'exécute.)

# 6. Récupérer le main à jour en local après le merge
git checkout main
git pull origin main

# 7. (optionnel) supprimer la branche fusionnée
git branch -d frontend/selfie-template
git push origin --delete frontend/selfie-template
```

### Convention de messages de commit

Format : `type(scope): description courte`

- **types** : `feat` (nouvelle fonctionnalité), `fix` (correction), `refactor`, `docs`, `style`, `test`, `chore`
- **scope** : `frontend` ou `backend` (ou plus précis : `frontend/templates`, `backend/qr`)
- Exemples : `feat(backend): endpoint GET /api/experience/{id}`, `fix(frontend): fallback Web Share API`, `refactor(backend): extraction qr_service`

### Le « plugin GitHub » dans VS Code

- Le suivi se fait via l'onglet **Source Control** de VS Code (icône branches), ou l'extension **GitHub Pull Requests** pour gérer les PR sans quitter l'éditeur.
- ⚠️ Aucun plugin ne détecte automatiquement qu'une fonctionnalité est « finie ». C'est la **convention ci-dessus** + les rappels de Claude Code qui garantissent push et merge réguliers. VS Code montre le nombre de changements non commités/non poussés : ne jamais le laisser gonfler.

### Revue de code automatique — CodeRabbit

Le dépôt est connecté à **CodeRabbit** (IA de revue de code). Conséquence sur le workflow :

- **Toujours merger via Pull Request sur GitHub**, jamais par `git merge` direct sur `main` — sinon CodeRabbit ne s'exécute pas.
- Cycle correct : push de la branche → « Compare & pull request » sur GitHub → CodeRabbit poste sa revue → corriger si nécessaire → **Merge**.
- Lire et traiter les commentaires de CodeRabbit avant de merger (c'est un second regard sur la qualité et les bugs, cohérent avec la règle de refactoring section 18).

### .gitignore (à créer dès le départ)

Le `.gitignore` doit au minimum exclure : `node_modules/`, `dist/`, `.env`, `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `.vscode/` (selon préférence), et les fichiers de build. **`.env` ne doit JAMAIS être poussé** (fournir `.env.example` à la place).

---

## 17. Démarrage : créer le dépôt et premier push

> À faire une seule fois, au tout début. Adapter `EPIPHANE/webar` à ton vrai compte/nom de repo.

```bash
# 1. Sur GitHub : créer un nouveau dépôt VIDE (sans README, sans .gitignore auto)
#    Nom suggéré : webar

# 2. En local, à la racine du monorepo
cd chemin/vers/webar
git init
git branch -M main

# 3. Créer .gitignore et CLAUDE.md (ce fichier) AVANT le premier commit
#    (voir .gitignore section 16)

# 4. Premier commit
git add .
git commit -m "chore: initialisation du monorepo WebAR + CLAUDE.md"

# 5. Connecter le dépôt distant et pousser main
git remote add origin https://github.com/EPIPHANE/webar.git
git push -u origin main

# 6. Ensuite, plus JAMAIS de commit direct sur main :
#    chaque fonctionnalité passe par une branche frontend/* ou backend/*
#    (voir le cycle section 16)
```

Astuce : protéger `main` sur GitHub (Settings → Branches → branch protection) pour forcer le passage par Pull Request — recommandé en binôme.

---

## 18. ⚠️ Refactoring & qualité de code (RÈGLE OBLIGATOIRE)

> Le code doit rester **propre, lisible et refactorisé en permanence**. C'est une exigence non négociable de ce projet.

À chaque fois que tu écris ou modifies du code :

- **Refactorise** systématiquement : pas de code dupliqué, pas de fonction qui fait trop de choses, pas de fichier fourre-tout.
- **Petites unités** : fonctions et composants courts, à responsabilité unique (un composant = une responsabilité).
- **Noms clairs** : variables, fonctions et fichiers nommés explicitement (en anglais pour le code, commentaires en français acceptés).
- **DRY** : factorise le code répété dans des helpers (`frontend/src/lib/`, `backend/services/`).
- **Pas de code mort** : supprime ce qui ne sert pas, pas de `console.log` ni de `print` de debug laissés dans le code livré.
- **Lisibilité d'abord** : si un bout de code n'est pas clair, refactorise-le ou commente-le, ne le laisse jamais en l'état.
- **Cohérence** : respecte la même structure et le même style partout (templates dans `src/templates/`, routers par domaine, etc.).
- **Avant de finir une tâche** : relis le code produit et propose un refactoring si quelque chose peut être simplifié.
- **Quand tu touches du code existant peu clair** : améliore-le au passage (boy-scout rule), sans casser le comportement ni le contrat JSON.

Si une demande conduirait à du code peu clair ou dupliqué, **signale-le et propose une version propre** plutôt que de produire du code brouillon.

---

## 19. Comment Claude Code doit travailler sur ce repo

1. Respecter strictement la stack (section 3) et le contrat JSON (section 6).
2. Ne jamais inventer d'endpoint ou de champ JSON : se référer aux sections 6 et 8, sinon demander.
3. Frontend et backend doivent rester testables ensemble à chaque fin de semaine.
4. Signaler toute ambiguïté (ex. `active` vs `status`, clés de templates) plutôt que de trancher seul.
5. Tenir à jour la section 2 (avancement) et la section 15 (Figma).
6. **Refactoriser systématiquement** (section 16) : code propre, lisible, sans duplication, à chaque modification.
7. **Utiliser les dernières versions stables** des dépendances (section 3), puis les épingler une fois testées. Vérifier la compatibilité navigateur (cible Chrome ≥ 80) avant d'adopter une version majeure.
8. **Respecter le workflow Git** (section 16) : jamais de commit direct sur `main`, une branche `frontend/*` ou `backend/*` par fonctionnalité, et **rappeler à Épiphane de commit/push/merger** dès qu'une fonctionnalité est terminée.
9. **Consulter les diagrammes (UML) AVANT de coder une tâche structurante** (modèle, relation entre entités, endpoint). Le **diagramme de classes fait foi sur le design** (entités, attributs, relations). Si le diagramme pertinent n'est pas fourni avec la tâche, **le demander à Épiphane avant de coder**. Objectif : éviter les contradictions design ↔ implémentation (ex. asset lié au lieu vs à l'expérience — tranché en S4 par l'UML : lié à l'expérience). En cas de conflit entre le cahier des charges (section 7) et l'UML, **le signaler et trancher avec le binôme**, puis acter la décision ici.