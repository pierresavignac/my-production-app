-- 1. Ajouter une nouvelle colonne name
ALTER TABLE employees ADD COLUMN name VARCHAR(255);

-- 2. Mettre à jour la colonne name avec la concaténation de last_name et first_name
UPDATE employees SET name = CONCAT(last_name, ' ', first_name);

-- 3. Supprimer les anciennes colonnes
ALTER TABLE employees DROP COLUMN first_name, DROP COLUMN last_name; 