-- Migration S4 (suite revue CodeRabbit) — un seul asset par TYPE et par propriétaire.
--
--   * Base NEUVE     -> rien à faire : create_all crée déjà ces contraintes.
--   * Base EXISTANTE -> exécuter ce script UNE fois, APRÈS 2026-06-03_assets_owner.sql
--     (et après avoir supprimé d'éventuels doublons de type, sinon l'ALTER échoue).
--
-- Note : les NULL étant distincts dans un index UNIQUE MySQL, ces contraintes
-- ne gênent pas l'autre propriétaire (un asset d'expérience a place_id = NULL,
-- un asset de lieu a experience_id = NULL).

ALTER TABLE assets
  ADD CONSTRAINT uq_asset_place_type UNIQUE (place_id, type),
  ADD CONSTRAINT uq_asset_experience_type UNIQUE (experience_id, type);
