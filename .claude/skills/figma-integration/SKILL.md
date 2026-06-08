---
name: figma-integration
description: Intégration Figma → VS Code pour le projet WebAR (maquettes vers composants React + Tailwind). À utiliser DÈS QUE l'utilisateur mentionne Figma, un lien de maquette, l'import d'un design, Figma Dev Mode, l'export de tokens/SVG, ou veut transformer une maquette en code. Le code généré depuis Figma doit être réécrit en composants React + Tailwind conformes aux conventions du projet.
---

# Intégration Figma → VS Code — WebAR

> Section à compléter une fois le lien Figma fourni par Épiphane.

## Pistes d'intégration

- Extension officielle **« Figma for VS Code »**.
- **Figma Dev Mode + MCP** (serveur MCP Figma pour exposer le design à l'éditeur/agent).
- Export manuel des **tokens / SVG** depuis Figma.

## ⚠️ Règle de conversion (STRICTE)

Le code généré depuis Figma **doit être réécrit** en composants React + Tailwind conformes aux conventions du projet :
- Pas de CSS inline brut copié tel quel.
- Mobile-first Tailwind v3.4, pas de CSS externe lourd.
- Respecter l'isolation des templates (`src/templates/`) et la structure du frontend.
- Cible navigateur Chrome ≥ 80 : pas d'utilitaires Tailwind v4 ni de propriétés CSS modernes non supportées.

## À remplir quand le lien est fourni

- Lien Figma du projet : _(à compléter)_
- Méthode retenue (extension / Dev Mode MCP / export) : _(à compléter)_
- Mapping écrans Figma → pages/composants React : _(à compléter)_