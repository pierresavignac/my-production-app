<?php
// Script pour ajouter la colonne no_appointment à la table events

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connexion à la base de données réussie.\n";
    
    // Vérifier si la colonne existe déjà
    $checkColumn = $pdo->query("SHOW COLUMNS FROM events LIKE 'no_appointment'");
    if ($checkColumn->rowCount() > 0) {
        echo "La colonne 'no_appointment' existe déjà.\n";
        exit;
    }
    
    // Ajouter la colonne no_appointment
    $sql = "ALTER TABLE events ADD COLUMN no_appointment BOOLEAN DEFAULT false AFTER status";
    $pdo->exec($sql);
    echo "Colonne 'no_appointment' ajoutée avec succès.\n";
    
    // Ajouter un index pour optimiser les requêtes
    $sql = "CREATE INDEX idx_no_appointment ON events(no_appointment)";
    $pdo->exec($sql);
    echo "Index 'idx_no_appointment' créé avec succès.\n";
    
    echo "\nMise à jour de la base de données terminée avec succès!\n";
    
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
    exit(1);
}
