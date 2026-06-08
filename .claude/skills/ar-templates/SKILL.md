---
name: ar-templates
description: Les 7 templates AR du projet WebAR (selfie_ar, badge, object_ar, treasure_hunt, guide_narratif, capsule_collective, portal_ar). À utiliser DÈS QUE l'utilisateur crée, modifie ou débogue un composant template AR, ajoute un nouveau type d'expérience, travaille dans src/templates/, ou doit savoir quelle clé `template` correspond à quel composant. Donne les clés JSON exactes, le statut (obligatoire/simplifié) et les conventions d'isolation des templates.
---

# Les 7 templates AR — WebAR

Chaque template = **un composant React indépendant et isolé** dans `src/templates/`, instancié selon le champ `template` du contrat JSON.

## Tableau des templates

| # | Nom | clé `template` (JSON) | Statut | Description |
|---|---|---|---|---|
| 1 | Selfie SouvenirAR | `selfie_ar` | **Obligatoire** | Caméra frontale + overlay + logo + message → photo souvenir |
| 2 | Badge de Lieu | `badge` | **Obligatoire** | Badge numérique animé débloqué (gamification) |
| 3 | Objet InteractifAR | `object_ar` | **Obligatoire** | QR sur objet physique → animation/présentation |
| 4 | Chasse au Trésor QR | `treasure_hunt` | **Obligatoire** | Parcours multi-étapes, progression localStorage, récompense finale |
| 5 | Guide NarratifAR | `guide_narratif` | Simplifié | Personnage 2D + narration audio/texte |
| 6 | Capsule Collective | `capsule_collective` | Simplifié | Photo de groupe, cadre commun, partage WhatsApp |
| 7 | Portail AR | `portal_ar` | Simplifié | Fenêtre virtuelle vers une autre scène |

## Priorités

- **Priorité absolue aux 4 templates obligatoires** (`selfie_ar`, `badge`, `object_ar`, `treasure_hunt`).
- Les 4 templates simplifiés (`guide_narratif`, `capsule_collective`, `portal_ar`) sont **sacrifiables** si retard.
- Confirmer les clés exactes de `template` avec le binôme et les figer dans le contrat JSON avant de coder.

## Emplacement des fichiers

```
frontend/src/templates/
├── SelfieARTemplate.jsx
├── BadgeTemplate.jsx
├── ObjectARTemplate.jsx
├── TreasureTemplate.jsx
├── GuideNarratifTemplate.jsx
├── CapsuleCollectiveTemplate.jsx
└── PortalARTemplate.jsx
```

## Conventions d'isolation (RÈGLE STRICTE)

- **Un template = un composant isolé** dans `src/templates/`. **Jamais** de logique template hors de ce dossier.
- Le composant est instancié dynamiquement selon le champ `template` lu dans le JSON renvoyé par `GET /api/experience/{id}` (registre/chargeur de templates dynamique mis en place en S2).
- Hooks réutilisables partagés (PAS dupliqués par template) :
  - `useCamera` (getUserMedia) — `frontend/src/hooks/`
  - `useCanvas` (rendu + `canvas.toDataURL()` pour la capture) — `frontend/src/hooks/`
- Mobile-first Tailwind, pas de CSS externe lourd.

## Fallbacks obligatoires (chaque template doit les gérer)

- Caméra refusée → mode sans caméra + message clair.
- Web Share API absente → bouton téléchargement de repli.
- Asset manquant → dégradation propre, pas de crash.
- Expérience introuvable → écran d'erreur.

## Lien avec le contrat JSON

Le frontend lit le champ `template` pour choisir le composant. Le composant consomme `assets` (`overlay_image`, `logo`) et `config` du JSON. **Ne jamais** consommer de données fictives en production : toujours les endpoints réels.