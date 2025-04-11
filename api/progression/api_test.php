<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

try {
    // Test simple pour vérifier que l'API fonctionne
    $response = [
        'success' => true,
        'message' => 'API test endpoint working',
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => PHP_VERSION,
        'soap_enabled' => extension_loaded('soap'),
        'error_log_path' => __DIR__ . '/error.log'
    ];
    
    error_log("Test API called: " . json_encode($response));
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Test API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
