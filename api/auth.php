<?php
require_once 'config.php';
require_once __DIR__ . '/classes/JWT.php';

// Activation du reporting d'erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

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

try {
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

                $stmt = $pdo->prepare("SELECT id, email, password, role, status, verification_token, reset_token FROM users WHERE email = ?");
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
                    
                    // Générer un JWT
                    $jwtToken = JWT::encode([
                        'user_id' => $user['id'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'exp' => time() + (60 * 60 * 24) // 24 heures
                    ], JWT_SECRET);
                    
                    echo json_encode([
                        'success' => true,
                        'token' => $jwtToken,
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
                $verificationToken = bin2hex(random_bytes(32));
                
                $stmt = $pdo->prepare("INSERT INTO users (email, password, role, status, verification_token, created_at) VALUES (?, ?, 'user', 'pending', ?, NOW())");
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
} catch (Exception $e) {
    error_log("Erreur : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur interne du serveur']);
}
