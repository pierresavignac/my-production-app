<?php
// tasks.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

require_once 'ProgressionService.php';

function returnResponse($success, $message = '', $data = [], $debug = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'debug' => isset($debug['error']) ? $debug['error'] : $debug
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (!isset($_GET['code'])) {
        returnResponse(false, 'Le code d\'installation est requis', [], [], 400);
    }

    $code = $_GET['code'];
    if (!preg_match('/^INS\d{6}$/', $code)) {
        returnResponse(false, 'Format de code d\'installation invalide (format attendu: INS######)', [], [], 400);
    }

    $service = new ProgressionService();
    
    // Test de connexion explicite
    if (!$service->connect()) {
        returnResponse(false, 'Échec de la connexion au service', [], [], 500);
    }
    
    $taskData = $service->getTaskByCode($code);
    
    if (empty($taskData)) {
        returnResponse(false, 'Aucune donnée trouvée pour ce code', [], [], 404);
    }
    
    returnResponse(true, 'Données récupérées avec succès', $taskData);

} catch (Exception $e) {
    $errorDetails = [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    
    returnResponse(false, 'Erreur: ' . $e->getMessage(), [], $errorDetails, 500);
}