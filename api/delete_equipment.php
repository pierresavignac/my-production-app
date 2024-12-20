<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
    
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        throw new Exception('ID de l\'équipement invalide');
    }
    
    // Vérifier si l'équipement est utilisé dans des installations
    $stmt = $conn->prepare("SELECT COUNT(*) FROM events WHERE equipment = (SELECT name FROM equipment WHERE id = ?)");
    $stmt->execute([$data['id']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet équipement est utilisé dans des installations et ne peut pas être supprimé']);
        exit;
    }
    
    // Supprimer l'équipement
    $stmt = $conn->prepare("DELETE FROM equipment WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Équipement non trouvé');
    }
    
    echo json_encode(['message' => 'Équipement supprimé avec succès']);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn = null;
