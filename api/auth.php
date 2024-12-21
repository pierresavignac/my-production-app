<?php
require_once 'config.php';

// Activation du reporting d'erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Configuration CORS spécifique pour le domaine de production
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = [
        'https://app.vivreenliberte.org',
        'http://localhost:5173',  // Pour le développement local
        'http://localhost'        // Pour le développement local
    ];
    
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer la requête OPTIONS préliminaire
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

function generateToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateJWT($user_id, $email, $role) {
    $secret_key = "votre_clé_secrète_à_changer"; // À changer en production
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    
    $payload = json_encode([
        'user_id' => $user_id,
        'email' => $email,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24) // 24 heures
    ]);
    
    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode($payload);
    
    $signature = hash_hmac('sha256', 
        $base64UrlHeader . "." . $base64UrlPayload, 
        $secret_key, 
        true
    );
    
    $base64UrlSignature = base64url_encode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

try {
    error_log("Tentative de connexion à la base de données...");
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    error_log("Connexion à la base de données réussie");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        error_log("Données reçues: " . $input);
        
        $data = json_decode($input, true);
        $action = isset($data['action']) ? $data['action'] : '';
        error_log("Action demandée: " . $action);

        switch ($action) {
            case 'login':
                $email = $data['email'] ?? '';
                $password = $data['password'] ?? '';
                error_log("Tentative de connexion pour l'email: " . $email);

                if (empty($email) || empty($password)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
                    exit;
                }

                $stmt = $pdo->prepare("SELECT id, email, password, role, status FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                error_log("Utilisateur trouvé: " . ($user ? "oui" : "non"));

                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
                    exit;
                }

                if ($user['status'] !== 'approved') {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'error' => 'Compte non approuvé. Veuillez vérifier votre email ou contacter l\'administrateur.']);
                    exit;
                }

                if (password_verify($password, $user['password'])) {
                    error_log("Mot de passe vérifié avec succès");
                    $token = generateJWT($user['id'], $user['email'], $user['role']);
                    echo json_encode([
                        'success' => true,
                        'token' => $token,
                        'user' => [
                            'id' => $user['id'],
                            'email' => $user['email'],
                            'role' => $user['role']
                        ]
                    ]);
                } else {
                    error_log("Échec de la vérification du mot de passe");
                    http_response_code(401);
                    echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
                }
                break;

            case 'register':
                $email = $data['email'] ?? '';
                $password = $data['password'] ?? '';

                if (empty($email) || empty($password)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
                    exit;
                }

                // Vérifier si l'email existe déjà
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Cet email est déjà utilisé']);
                    exit;
                }

                // Créer le nouvel utilisateur
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $verificationToken = generateToken();
                
                $stmt = $pdo->prepare("INSERT INTO users (email, password, verification_token, status) VALUES (?, ?, ?, 'pending')");
                if ($stmt->execute([$email, $hashedPassword, $verificationToken])) {
                    echo json_encode(['success' => true, 'message' => 'Inscription réussie. Veuillez vérifier votre email.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Erreur lors de l\'inscription']);
                }
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Action non valide']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    }
} catch (PDOException $e) {
    error_log("Erreur PDO détaillée : " . $e->getMessage());
    error_log("Trace : " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Erreur de connexion à la base de données',
        'details' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Erreur générale : " . $e->getMessage());
    error_log("Trace : " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Erreur interne du serveur',
        'details' => $e->getMessage()
    ]);
}
