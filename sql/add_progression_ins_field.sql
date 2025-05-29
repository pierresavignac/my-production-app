-- Ajout du champ progression_ins à la table events
-- Ce champ stocke le numéro d'installation ProgressionLive (format INS000123)
ALTER TABLE events ADD COLUMN progression_ins VARCHAR(20) DEFAULT NULL;

-- Ajout d'un index pour améliorer les performances de recherche
CREATE INDEX idx_progression_ins ON events(progression_ins);
