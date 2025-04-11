<?php
require_once 'config.php';

try {
    // Créer la table technicians si elle n'existe pas
    $sql = "
    CREATE TABLE IF NOT EXISTS technicians (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    echo "Table technicians créée avec succès\n";
    
} catch(PDOException $e) {
    echo "Erreur lors de la création des tables : " . $e->getMessage() . "\n";
} 