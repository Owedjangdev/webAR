-- Migration S4 — assets liés à un LIEU OU une EXPÉRIENCE (cf. CLAUDE.md section 7).
--
-- Quand l'appliquer :
--   * Base NEUVE  -> rien à faire : `Base.metadata.create_all` crée déjà la
--     table assets au bon format au démarrage.
--   * Base EXISTANTE (table assets déjà créée en S1 avec place_id NOT NULL)
--     -> exécuter ce script UNE fois (Workbench, connecté en webar_user) pour
--        migrer sans perdre les données.
--
-- Effet : place_id devient nullable, + experience_id (FK), + alt_text,
--         enum étendu (image), contrainte « exactement un owner ».

ALTER TABLE assets
  MODIFY COLUMN place_id INT NULL,
  ADD COLUMN experience_id INT NULL AFTER place_id,
  ADD COLUMN alt_text VARCHAR(255) NULL,
  MODIFY COLUMN type ENUM('overlay', 'logo', 'badge', 'image', 'audio') NOT NULL,
  ADD CONSTRAINT fk_assets_experience FOREIGN KEY (experience_id) REFERENCES experiences (id),
  ADD CONSTRAINT ck_asset_exactly_one_owner CHECK ((place_id IS NULL) <> (experience_id IS NULL));
