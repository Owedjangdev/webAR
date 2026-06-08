---
name: code-quality
description: Règles obligatoires de refactoring et de qualité de code du projet WebAR. À utiliser DÈS QUE l'utilisateur écrit, modifie, relit ou nettoie du code (frontend React ou backend FastAPI), termine une tâche de code, ou demande une revue/amélioration. Impose code propre, DRY, petites unités à responsabilité unique, pas de code mort, lisibilité d'abord. Signaler et proposer une version propre plutôt que de produire du code brouillon.
---

# Refactoring & qualité de code — WebAR

> Le code doit rester **propre, lisible et refactorisé en permanence**. Exigence non négociable du projet.

À chaque fois que tu écris ou modifies du code :

- **Refactorise systématiquement** : pas de code dupliqué, pas de fonction qui fait trop de choses, pas de fichier fourre-tout.
- **Petites unités** : fonctions et composants courts, à responsabilité unique (un composant = une responsabilité).
- **Noms clairs** : variables, fonctions et fichiers nommés explicitement (en anglais pour le code ; commentaires en français acceptés).
- **DRY** : factorise le code répété dans des helpers (`frontend/src/lib/`, `backend/services/`).
- **Pas de code mort** : supprime ce qui ne sert pas ; pas de `console.log` ni de `print` de debug laissés dans le code livré.
- **Lisibilité d'abord** : si un bout de code n'est pas clair, refactorise-le ou commente-le, ne le laisse jamais en l'état.
- **Cohérence** : même structure et même style partout (templates dans `src/templates/`, routers par domaine, etc.).
- **Avant de finir une tâche** : relis le code produit et propose un refactoring si quelque chose peut être simplifié.
- **Boy-scout rule** : quand tu touches du code existant peu clair, améliore-le au passage, sans casser le comportement ni le contrat JSON.

Si une demande conduirait à du code peu clair ou dupliqué, **signale-le et propose une version propre** plutôt que de produire du code brouillon.

> Cohérent avec la revue CodeRabbit sur les Pull Requests : traiter ses remarques avant de merger.