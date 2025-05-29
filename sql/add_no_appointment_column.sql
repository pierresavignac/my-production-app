-- Ajouter la colonne no_appointment à la table events
ALTER TABLE events ADD COLUMN no_appointment TINYINT(1) DEFAULT 0 AFTER status;

-- Ajouter un commentaire pour documenter l'utilisation de la colonne
ALTER TABLE events MODIFY COLUMN no_appointment TINYINT(1) DEFAULT 0 COMMENT 'Si 1, la tâche est sans rendez-vous et n\'apparaît pas dans le calendrier';