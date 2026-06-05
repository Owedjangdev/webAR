-- Migration S5 — statut d'expérience `draft` / `published` (remplace `active`).
-- Cf. CLAUDE.md section 7 (conciliation cahier des charges `active` ↔ UML statut).
--
-- Quand l'appliquer :
--   * Base NEUVE     -> rien à faire : `Base.metadata.create_all` crée déjà la
--     table `experiences` avec la colonne `status` (ENUM draft/published).
--   * Base EXISTANTE (table créée avant, avec la colonne `active`)
--     -> exécuter ce script UNE fois (MySQL Workbench, connecté en webar_user)
--        pour migrer sans perdre les données.
--
-- Effet : ajoute `status`, convertit l'ancien `active` (1 -> published, 0 -> draft),
--         puis supprime `active`. À exécuter dans l'ordre.

-- 1) Nouvelle colonne (brouillon par défaut).
ALTER TABLE experiences
  ADD COLUMN status ENUM('draft', 'published') NOT NULL DEFAULT 'draft' AFTER config_json;

-- 2) Reprise des données existantes depuis `active`.
UPDATE experiences SET status = 'published' WHERE active = 1;
UPDATE experiences SET status = 'draft'     WHERE active = 0;

-- 3) Suppression de l'ancienne colonne.
ALTER TABLE experiences DROP COLUMN active;
