<?php
require_once 'config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Vérifier si la table existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "La table 'users' existe.\n\n";
        
        // Afficher la structure de la table
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll();
        
        echo "Structure de la table :\n";
        foreach ($columns as $column) {
            echo "{$column['Field']} - {$column['Type']} - {$column['Null']} - {$column['Key']} - {$column['Default']}\n";
        }
        
        // Compter le nombre d'utilisateurs
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch();
        echo "\nNombre d'utilisateurs : {$count['count']}\n";
        
        // Afficher les rôles distincts
        $stmt = $pdo->query("SELECT DISTINCT role FROM users");
        $roles = $stmt->fetchAll();
        echo "\nRôles existants :\n";
        foreach ($roles as $role) {
            echo "- {$role['role']}\n";
        }
    } else {
        echo "La table 'users' n'existe pas.";
    }
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}
?>
