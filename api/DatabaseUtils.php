<?php

/**
 * Vérifie si une colonne existe dans une table et l'ajoute si elle n'existe pas.
 *
 * @param PDO $pdo L'objet de connexion PDO.
 * @param string $tableName Le nom de la table.
 * @param string $columnName Le nom de la colonne.
 * @param string $columnDefinition La définition SQL complète de la colonne (ex: 'VARCHAR(255) DEFAULT NULL').
 */
function checkAndAddColumn(PDO $pdo, string $tableName, string $columnName, string $columnDefinition): void {
    try {
        // Récupère le nom de la base de données de la connexion PDO
        // Note: Cela suppose une connexion DSN typique "mysql:host=...;dbname=..."
        $dbName = $pdo->query('SELECT database()')->fetchColumn();
        
        if (!$dbName) {
            error_log("checkAndAddColumn: Impossible de déterminer le nom de la base de données.");
            return;
        }

        // Vérifie si la colonne existe déjà
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = :dbName 
               AND TABLE_NAME = :tableName 
               AND COLUMN_NAME = :columnName"
        );
        $stmt->execute([
            ':dbName' => $dbName,
            ':tableName' => $tableName,
            ':columnName' => $columnName
        ]);
        
        $columnExists = $stmt->fetchColumn() > 0;

        if (!$columnExists) {
            // La colonne n'existe pas, on l'ajoute
            $alterStmt = $pdo->prepare("ALTER TABLE `" . $tableName . "` ADD COLUMN `" . $columnName . "` " . $columnDefinition);
            $alterStmt->execute();
            error_log("Colonne '" . $columnName . "' ajoutée à la table '" . $tableName . "'.");
        } else {
            // error_log("Colonne '" . $columnName . "' existe déjà dans la table '" . $tableName . "'.");
        }

    } catch (Exception $e) {
        // Log l'erreur mais ne pas arrêter le script principal pour ça
        error_log("Erreur dans checkAndAddColumn pour " . $tableName . "." . $columnName . ": " . $e->getMessage());
    }
}

?> 