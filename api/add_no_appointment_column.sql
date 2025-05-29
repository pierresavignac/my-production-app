-- Script pour ajouter le champ no_appointment à la table events
ALTER TABLE events 
ADD COLUMN no_appointment BOOLEAN DEFAULT false AFTER status;

-- Ajouter un index pour optimiser les requêtes sur ce champ
CREATE INDEX idx_no_appointment ON events(no_appointment);
