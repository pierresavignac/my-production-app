<?php
require_once 'config.php';

header('Content-Type: application/json');
setCorsHeaders();

// Activation du reporting d'erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Vérification du token et du rôle admin
function verifyAdminAccess($pdo) {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

    error_log("Token reçu: " . ($token ? "oui" : "non"));
    if (!$token) {
        error_log("Pas de token d'autorisation");
        return false;
    }

    try {
        list($header, $payload, $signature) = explode('.', $token);
        $payload_data = json_decode(base64_decode($payload), true);
        error_log("Données du payload: " . print_r($payload_data, true));

        if (!$payload_data) {
            error_log("Impossible de décoder le payload du token");
            return false;
        }

        // Vérifier si l'utilisateur est admin
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$payload_data['user_id']]);
        $user = $stmt->fetch();
        
        error_log("Rôle de l'utilisateur: " . ($user ? $user['role'] : "non trouvé"));
        return $user && $user['role'] === 'admin';
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification du token: " . $e->getMessage());
        return false;
    }
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    if (!verifyAdminAccess($pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès non autorisé']);
        exit;
    }

    // Récupérer les données POST pour les requêtes POST
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    error_log("Données reçues: " . print_r($data, true));

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Liste tous les utilisateurs
        $stmt = $pdo->query("SELECT id, email, role, status, installation_status FROM users ORDER BY id DESC");
        $users = $stmt->fetchAll();
        echo json_encode($users);
    }
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($data['action'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Action non spécifiée']);
            exit;
        }

        switch ($data['action']) {
            case 'create':
                if (empty($data['email']) || empty($data['password'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email et mot de passe requis']);
                    exit;
                }

                // Vérifier si l'email existe déjà
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Cet email est déjà utilisé']);
                    exit;
                }

                // Générer un token unique
                $token = bin2hex(random_bytes(32));

                // Hasher le mot de passe
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

                // Insérer le nouvel utilisateur avec le token
                $stmt = $pdo->prepare("
                    INSERT INTO users (email, password, role, status, installation_status, token) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $data['email'],
                    $hashedPassword,
                    $data['role'] ?? 'user',
                    $data['status'] ?? 'pending',
                    $data['installation_status'] ?? 'En approbation',
                    $token
                ]);

                echo json_encode(['success' => true]);
                break;

            case 'update':
                if (empty($data['id'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID utilisateur requis']);
                    exit;
                }

                error_log("Données de mise à jour reçues : " . print_r($data, true));

                // Construire la requête de mise à jour
                $updateFields = [];
                $params = [];

                if (!empty($data['email'])) {
                    $updateFields[] = "email = ?";
                    $params[] = $data['email'];
                }

                if (!empty($data['password'])) {
                    $updateFields[] = "password = ?";
                    $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
                    
                    // Générer un nouveau token lors du changement de mot de passe
                    $updateFields[] = "token = ?";
                    $params[] = bin2hex(random_bytes(32));
                }

                if (isset($data['role'])) {
                    $updateFields[] = "role = ?";
                    $params[] = $data['role'];
                }

                if (isset($data['status'])) {
                    $updateFields[] = "status = ?";
                    $params[] = $data['status'];
                }

                if (isset($data['installation_status'])) {
                    $updateFields[] = "installation_status = ?";
                    $params[] = $data['installation_status'];
                }

                if (empty($updateFields)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Aucun champ à mettre à jour']);
                    exit;
                }

                // Ajouter l'ID à la fin des paramètres
                $params[] = $data['id'];

                $sql = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
                error_log("Requête SQL : " . $sql);
                error_log("Paramètres : " . print_r($params, true));

                $stmt = $pdo->prepare($sql);
                $result = $stmt->execute($params);

                if (!$result) {
                    error_log("Erreur lors de l'exécution de la requête UPDATE : " . print_r($stmt->errorInfo(), true));
                    throw new Exception("Erreur lors de la mise à jour de l'utilisateur");
                }

                if ($stmt->rowCount() === 0) {
                    error_log("Aucune ligne mise à jour");
                    http_response_code(404);
                    echo json_encode(['error' => 'Utilisateur non trouvé']);
                    exit;
                }

                echo json_encode(['success' => true]);
                break;

            case 'delete':
                if (empty($data['id'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID utilisateur requis']);
                    exit;
                }

                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$data['id']]);

                echo json_encode(['success' => true]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non valide']);
                break;
        }
    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
    }

} catch (PDOException $e) {
    error_log("Erreur PDO : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
} catch (Exception $e) {
    error_log("Erreur : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
