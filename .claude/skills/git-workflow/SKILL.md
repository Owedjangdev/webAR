---
name: git-workflow
description: Workflow Git et versioning obligatoire du projet WebAR — branches frontend/* et backend/*, Conventional Commits, Pull Requests avec revue CodeRabbit, initialisation du dépôt. À utiliser DÈS QUE l'utilisateur commit, push, crée une branche, ouvre une PR, merge, termine une fonctionnalité, ou initialise le dépôt Git. Rappeler systématiquement ces étapes quand une fonctionnalité est finie.
---

# Workflow Git & versioning — WebAR

> Discipline de versioning du projet. **Une fonctionnalité = une branche dédiée = un push = un merge.** Frontend et backend ont des branches séparées.

## Principe central

- **Jamais de travail directement sur `main`.** `main` ne reçoit que du code testé, via merge.
- **Chaque nouvelle fonctionnalité = sa propre branche**, créée à partir de `main` à jour.
- Quand une fonctionnalité est **terminée et testée** : commit → push de la branche → merge dans `main` (via Pull Request de préférence).
- **RAPPELER systématiquement** ces étapes : « cette fonctionnalité est finie → crée une branche si pas déjà fait, commit, push, puis merge ». Ne jamais laisser du travail non commité s'accumuler.

## Séparation frontend / backend (branches préfixées)

Le frontend et le backend versionnent **séparément**, chacun ses branches, ses push, ses merges :

- Branches frontend : **`frontend/<nom-fonctionnalite>`** — ex. `frontend/selfie-template`, `frontend/use-camera-hook`
- Branches backend : **`backend/<nom-fonctionnalite>`** — ex. `backend/crud-experiences`, `backend/qr-generation`
- Chacun ne touche que ses propres branches. On ne push pas sur les branches de l'autre.
- Les deux fusionnent vers le même `main` (monorepo à un seul `main`), via des branches distinctes pour éviter les conflits.

## Cycle de travail pour CHAQUE fonctionnalité

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

## Convention de messages de commit

Format : `type(scope): description courte`

- **types** : `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- **scope** : `frontend` ou `backend` (ou plus précis : `frontend/templates`, `backend/qr`)
- Exemples : `feat(backend): endpoint GET /api/experience/{id}`, `fix(frontend): fallback Web Share API`, `refactor(backend): extraction qr_service`

> Règle de fréquence : **ne pas commit systématiquement** ; regrouper en incréments cohérents et clairs.

## Suivi dans VS Code

- Suivi via l'onglet **Source Control** de VS Code, ou l'extension **GitHub Pull Requests** pour gérer les PR sans quitter l'éditeur.
- ⚠️ Aucun plugin ne détecte qu'une fonctionnalité est « finie ». C'est la convention ci-dessus + les rappels qui garantissent push et merge réguliers. Ne jamais laisser gonfler le nombre de changements non commités/non poussés.

## Revue de code automatique — CodeRabbit

Le dépôt est connecté à **CodeRabbit** (IA de revue de code) :

- **Toujours merger via Pull Request sur GitHub**, jamais par `git merge` direct sur `main` — sinon CodeRabbit ne s'exécute pas.
- Cycle correct : push de la branche → « Compare & pull request » → CodeRabbit poste sa revue → corriger si nécessaire → **Merge**.
- Lire et traiter les commentaires de CodeRabbit avant de merger.

## .gitignore (à créer dès le départ)

Doit au minimum exclure : `node_modules/`, `dist/`, `.env`, `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `.vscode/` (selon préférence), fichiers de build. **`.env` ne doit JAMAIS être poussé** (fournir `.env.example` à la place).

## Initialisation du dépôt (une seule fois, au début)

> Adapter `EPIPHANE/webar` au vrai compte/nom de repo.

```bash
# 1. Sur GitHub : créer un dépôt VIDE (sans README, sans .gitignore auto). Nom : webar
# 2. En local, à la racine du monorepo
cd chemin/vers/webar
git init
git branch -M main
# 3. Créer .gitignore et CLAUDE.md AVANT le premier commit
# 4. Premier commit
git add .
git commit -m "chore: initialisation du monorepo WebAR + CLAUDE.md"
# 5. Connecter le distant et pousser
git remote add origin https://github.com/Owedjangdev/webAR/
git push -u origin main
# 6. Ensuite : plus JAMAIS de commit direct sur main
```

Astuce : protéger `main` sur GitHub (Settings → Branches → branch protection) pour forcer le passage par PR.