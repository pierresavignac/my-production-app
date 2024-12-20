<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connect.php';

// Si c'est une requête OPTIONS, on arrête ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $conn = getConnection();
    
    // Récupérer les données envoyées
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        throw new Exception('Le nom de l\'équipement est requis');
    }
    
    // Vérifier si l'équipement existe déjà
    $stmt = $conn->prepare("SELECT COUNT(*) FROM equipment WHERE name = ?");
    $stmt->execute([$data['name']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet équipement existe déjà']);
        exit;
    }
    
    // Ajouter le nouvel équipement
    $stmt = $conn->prepare("INSERT INTO equipment (name) VALUES (?)");
    $stmt->execute([$data['name']]);
    
    $newId = $conn->lastInsertId();
    
    echo json_encode([
        'id' => $newId,
        'name' => $data['name'],
        'message' => 'Équipement ajouté avec succès'
    ]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn = null;
