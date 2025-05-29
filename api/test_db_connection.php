<?php
// Script de test pour vérifier la connexion à la base de données

require_once 'config.php';

echo "Configuration de la base de données:\n";
echo "Host: " . DB_HOST . "\n";
echo "Database: " . DB_NAME . "\n";
echo "User: " . DB_USER . "\n";
echo "Password: " . (DB_PASS ? '***' : '(vide)') . "\n\n";

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connexion réussie!\n\n";
    
    // Vérifier si la table events existe
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables existantes:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Vérifier la structure de la table events si elle existe
    if (in_array('events', $tables)) {
        echo "\nColonnes de la table 'events':\n";
        $columns = $pdo->query("SHOW COLUMNS FROM events")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $column) {
            echo "- {$column['Field']} ({$column['Type']})\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Erreur de connexion : " . $e->getMessage() . "\n";
    echo "\nVérifiez que:\n";
    echo "1. MySQL est démarré\n";
    echo "2. La base de données '" . DB_NAME . "' existe\n";
    echo "3. L'utilisateur '" . DB_USER . "' a les permissions nécessaires\n";
}
