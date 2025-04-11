-- 1. Sauvegarder les données existantes
CREATE TEMPORARY TABLE temp_employees AS 
SELECT id, CONCAT(last_name, ' ', first_name) as name, active, is_technician 
FROM employees;

-- 2. Supprimer les anciennes colonnes et ajouter la nouvelle
ALTER TABLE employees 
    DROP COLUMN first_name,
    DROP COLUMN last_name,
    ADD COLUMN name VARCHAR(255) NOT NULL;

-- 3. Restaurer les données
UPDATE employees e 
INNER JOIN temp_employees t ON e.id = t.id 
SET e.name = t.name;

-- 4. Supprimer la table temporaire
DROP TEMPORARY TABLE IF EXISTS temp_employees; 