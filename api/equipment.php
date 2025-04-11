<?php
require_once 'cors.php';
require_once 'config.php'; // Utiliser la connexion $pdo de MySQL

header('Content-Type: application/json');

try {
    // Utiliser $pdo de config.php
    // Supprimer : Connexion SQLite, CREATE TABLE, INSERT INTO données de test

    // Récupérer tous les équipements depuis MySQL
    $stmt = $pdo->query('SELECT id, name FROM equipment ORDER BY name');
    $equipment = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $equipment
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Erreur serveur : " . $e->getMessage()
    ]);
} 