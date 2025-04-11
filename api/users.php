<?php
// Activer le logging des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.log');

// Gérer les CORS de manière dynamique
$allowedOrigins = [
    'https://app.vivreenliberte.org',
    'http://localhost:5173',
    'http://localhost'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://app.vivreenliberte.org');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Gérer les requêtes OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'validate_token.php';

try {
    error_log("Début du traitement de la requête users.php");
    
    // Récupérer le token de l'en-tête Authorization
    $headers = getallheaders();
    error_log("Headers reçus: " . print_r($headers, true));
    
    if (!isset($headers['Authorization'])) {
        throw new Exception('Token manquant');
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    error_log("Token reçu: " . $token);
    
    // Vérifier le token
    $tokenData = validateToken(false);
    error_log("Résultat de la validation du token: " . print_r($tokenData, true));

    if (!$tokenData['success']) {
        throw new Exception($tokenData['error'] ?? 'Token invalide');
    }

    // Vérifier si l'utilisateur est admin
    if ($tokenData['user']['role'] !== 'admin') {
        throw new Exception('Accès refusé - Rôle admin requis');
    }

    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Récupérer tous les utilisateurs
    $stmt = $pdo->query("
        SELECT 
            id,
            email,
            role,
            status,
            created_at,
            last_login
        FROM users 
        ORDER BY created_at DESC
    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Nettoyer les données avant l'encodage JSON
    $cleanUsers = array_map(function($user) {
        return array_map(function($value) {
            return is_string($value) ? utf8_encode($value) : $value;
        }, $user);
    }, $users);

    error_log("Utilisateurs trouvés (après nettoyage): " . print_r($cleanUsers, true));

    $jsonResponse = json_encode([
        'success' => true,
        'data' => $cleanUsers
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

    if ($jsonResponse === false) {
        throw new Exception("Erreur d'encodage JSON: " . json_last_error_msg());
    }

    error_log("Réponse JSON: " . $jsonResponse);
    echo $jsonResponse;

} catch (Exception $e) {
    error_log("Erreur dans users.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    $errorResponse = json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

    if ($errorResponse === false) {
        error_log("Erreur d'encodage JSON de l'erreur: " . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Erreur interne du serveur']);
    } else {
        echo $errorResponse;
    }
}
