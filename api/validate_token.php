<?php
require_once 'config.php';
require_once __DIR__ . '/classes/JWT.php';

header('Content-Type: application/json');

// Configuration CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = [
        'https://app.vivreenliberte.org',
        'http://localhost:5173',
        'http://localhost'
    ];
    
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function validateToken($outputJson = true) {
    error_log('Début de la validation du token');
    
    $headers = getallheaders();
    error_log('Headers reçus: ' . print_r($headers, true));
    
    if (!isset($headers['Authorization']) && !isset($headers['authorization'])) {
        error_log('Pas d\'en-tête Authorization');
        return [
            'success' => false,
            'error' => 'Token manquant'
        ];
    }
    
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : $headers['authorization'];
    $token = str_replace('Bearer ', '', $authHeader);
    error_log('Token reçu: ' . $token);
    
    if (empty($token)) {
        error_log('Token vide');
        return [
            'success' => false,
            'error' => 'Token vide'
        ];
    }
    
    try {
        // Vérification du fichier jwt_secret.php
        $jwt_file = __DIR__ . '/jwt_secret.php';
        error_log('Chemin du fichier jwt_secret.php: ' . $jwt_file);
        
        if (!file_exists($jwt_file)) {
            error_log('Fichier jwt_secret.php manquant');
            return [
                'success' => false,
                'error' => 'Configuration manquante'
            ];
        }
        
        require_once $jwt_file;
        error_log('JWT_SECRET défini: ' . (defined('JWT_SECRET') ? 'oui' : 'non'));
        
        if (!defined('JWT_SECRET')) {
            error_log('JWT_SECRET non défini');
            return [
                'success' => false,
                'error' => 'Configuration incomplète'
            ];
        }
        
        // Décodage du token
        error_log('Tentative de décodage du token...');
        $decoded = JWT::decode($token, JWT_SECRET);
        error_log('Token décodé avec succès: ' . print_r($decoded, true));
        
        // Vérification de l'expiration
        if (isset($decoded['exp'])) {
            error_log('Expiration du token: ' . date('Y-m-d H:i:s', $decoded['exp']));
            error_log('Heure actuelle: ' . date('Y-m-d H:i:s', time()));
            
            if ($decoded['exp'] < time()) {
                error_log('Token expiré');
                return [
                    'success' => false,
                    'error' => 'Token expiré'
                ];
            }
        }
        
        // Vérifier si l'utilisateur existe toujours dans la base de données
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("SELECT id, email, role, status FROM users WHERE id = ? AND status = 'approved'");
            $stmt->execute([$decoded['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                error_log('Utilisateur non trouvé ou non approuvé');
                return [
                    'success' => false,
                    'error' => 'Utilisateur non valide'
                ];
            }
            
            return [
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ];
            
        } catch (PDOException $e) {
            error_log('Erreur base de données: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Erreur de base de données'
            ];
        }
        
    } catch (Exception $e) {
        error_log('Erreur de validation du token: ' . $e->getMessage());
        error_log('Trace: ' . $e->getTraceAsString());
        return [
            'success' => false,
            'error' => 'Token invalide'
        ];
    }
}

// Validation du token et envoi de la réponse
$result = validateToken();
echo json_encode($result); 