---
name: api-endpoints
description: Endpoints API REST du projet WebAR (préfixe /api) et acteurs/permissions (visiteur, admin, partenaire). À utiliser DÈS QUE l'utilisateur crée, modifie ou débogue un endpoint FastAPI, un router, une route admin/partner, gère l'authentification JWT, les codes HTTP, ou définit qui a le droit d'accéder à quoi. Ne jamais inventer d'endpoint : se référer à cette liste, sinon demander au binôme.
---

# Endpoints API REST — WebAR

Préfixe `/api`. **Documentation Swagger obligatoire** (chaque endpoint testé dans Swagger avant intégration frontend).

## Endpoints publics / cœur du système

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

## Endpoints backoffice (implémentés en S5)

Réservés admin — **401** sans jeton, **403** si non-admin :
- `POST /api/login` (renvoie **JWT + rôle**)
- `GET /api/admin/places`
- `GET /api/admin/experiences`
- `POST /api/admin/places`
- `POST /api/admin/experiences` (créée en **draft**)
- `PUT /api/admin/experiences/{public_id}/publish` & `…/unpublish`

## Endpoints additionnels (à intégrer plus tard)

- `GET /api/partner/*` (filtré par `partner_id`)
- `GET /api/hunt/{experience_id}`
- `POST /api/hunt/step/validate`

## Acteurs et permissions (UML)

- **Visiteur** : scanner QR, autoriser caméra, vivre l'expérience, capturer, partager. **Aucun compte requis.**
- **Administrateur** : se connecter, créer/modifier/publier expériences, générer QR, gérer lieux, comptes partenaires, assets.
- **Lieu partenaire** : se connecter, consulter **uniquement** ses lieux/expériences/QR/stats (filtrage par `partner_id` ; accès aux données d'un autre lieu → **refusé**).

## Conventions backend (RÈGLE STRICTE)

- **Validation Pydantic v2 sur TOUS les POST/PUT.**
- Erreurs HTTP claires : **404** (introuvable), **422** (données invalides), **401** (non authentifié), **403** (non autorisé).
- CORS strict : seules les origines React connues.
- **Ne jamais inventer d'endpoint ou de champ JSON.** Se référer à cette liste et au contrat JSON figé, sinon demander au binôme.
- Authentification : JWT, `JWT_SECRET` en `.env`, dépendances `get_current_user` / `require_admin`.