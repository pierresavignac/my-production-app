<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connect.php';

try {
    $conn = getConnection();
    
    // Récupérer tous les équipements
    $stmt = $conn->prepare("SELECT id, name FROM equipment ORDER BY name");
    $stmt->execute();
    
    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($equipment);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la récupération des équipements: ' . $e->getMessage()]);
}

$conn = null;
