<?php
// --- Débogage Temporaire : Afficher TOUTES les erreurs --- 
ini_set('display_errors', 1); 
error_reporting(E_ALL); 
// --- Fin Débogage ---

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Fonction de logging
function userApiLog($message) {
    error_log("[users.php] " . $message);
}

userApiLog("Début script. Méthode: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    userApiLog("Réponse à la requête OPTIONS.");
    http_response_code(200);
    exit();
}

// --- Retrait du code de test simple ---
// echo json_encode(['success' => true, 'message' => 'Test API users.php OK', 'data' => []]);
// exit(); 

// --- Code original restauré avec logs --- 
userApiLog("Tentative d'inclusion de config.php");
require_once '../config.php';
userApiLog("config.php inclus.");

// Fonction pour gérer GET
function handleGetUserList($pdo) {
    userApiLog("Début handleGetUserList");
    try {
        userApiLog("Préparation de la requête SELECT...");
        $stmt = $pdo->query("
            SELECT 
                id,
                email,
                role,
                status,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at 
            FROM users 
            ORDER BY created_at DESC
        ");
        userApiLog("Requête SELECT exécutée.");

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        userApiLog("Données récupérées: " . count($users) . " utilisateurs.");

        userApiLog("Encodage JSON et envoi de la réponse GET...");
        echo json_encode([
            'success' => true,
            'data' => $users
        ]);
        userApiLog("Réponse GET envoyée.");

    } catch (Exception $e) {
        userApiLog("ERREUR CATCH GET: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la récupération des utilisateurs: ' . $e->getMessage()
        ]);
    }
}

// Fonction pour gérer PUT (Mise à jour)
function handleUpdateUser($pdo) {
    userApiLog("Début handleUpdateUser");
    $data = json_decode(file_get_contents('php://input'), true);
    userApiLog("Données reçues pour PUT: " . print_r($data, true));

    // Validation simple (à améliorer potentiellement)
    if (empty($data['id']) || empty($data['role']) || empty($data['status'])) {
        userApiLog("Erreur PUT: Données manquantes (id, role, ou status).");
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Données incomplètes.']);
        return;
    }

    // TODO: Ajouter validation des valeurs de role et status si nécessaire

    try {
        $sql = "UPDATE users SET role = :role, status = :status WHERE id = :id";
        userApiLog("Préparation de la requête UPDATE: " . $sql);
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
        
        userApiLog("Exécution de la requête UPDATE pour ID: " . $data['id']);
        $success = $stmt->execute();
        $rowCount = $stmt->rowCount(); // Nombre de lignes affectées
        userApiLog("Requête UPDATE terminée. Succès: " . ($success ? 'Oui' : 'Non') . ", Lignes affectées: " . $rowCount);

        if ($success && $rowCount > 0) {
            echo json_encode(['success' => true, 'message' => 'Utilisateur mis à jour avec succès.']);
        } elseif ($success && $rowCount === 0) {
            // Requête OK mais aucune ligne modifiée (peut-être les données étaient identiques)
             echo json_encode(['success' => true, 'message' => 'Aucune modification nécessaire.']);
        } else {
             userApiLog("Erreur lors de l\'exécution de l\'UPDATE.");
             throw new Exception("La mise à jour en base de données a échoué.");
        }

    } catch (Exception $e) {
        userApiLog("ERREUR CATCH PUT: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur lors de la mise à jour: ' . $e->getMessage()
        ]);
    }
}

// Fonction pour gérer DELETE (Suppression)
function handleDeleteUser($pdo) {
    userApiLog("Début handleDeleteUser");
    
    // Récupérer l'ID depuis les paramètres GET de l'URL
    if (empty($_GET['id'])) {
        userApiLog("Erreur DELETE: ID utilisateur manquant dans l'URL.");
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'ID utilisateur manquant.']);
        return;
    }
    $userId = filter_var($_GET['id'], FILTER_VALIDATE_INT);

    if ($userId === false) {
        userApiLog("Erreur DELETE: ID utilisateur invalide (" . $_GET['id'] . ").");
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'ID utilisateur invalide.']);
        return;
    }

    userApiLog("ID à supprimer: " . $userId);

    // Empêcher la suppression de soi-même (sécurité importante)
    // Il faudrait récupérer l'ID de l'utilisateur authentifié depuis le token
    // $authenticatedUserId = ... getUserIdFromToken() ...;
    // if ($userId === $authenticatedUserId) {
    //     userApiLog("Erreur DELETE: Tentative d'auto-suppression.");
    //     http_response_code(403); // Forbidden
    //     echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas supprimer votre propre compte.']);
    //     return;
    // }

    try {
        $sql = "DELETE FROM users WHERE id = :id";
        userApiLog("Préparation de la requête DELETE: " . $sql);
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        
        userApiLog("Exécution de la requête DELETE pour ID: " . $userId);
        $success = $stmt->execute();
        $rowCount = $stmt->rowCount();
        userApiLog("Requête DELETE terminée. Succès: " . ($success ? 'Oui' : 'Non') . ", Lignes affectées: " . $rowCount);

        if ($success && $rowCount > 0) {
            echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès.']);
        } elseif ($success && $rowCount === 0) {
             // Requête OK mais aucune ligne supprimée (l'ID n'existait pas ?)
             http_response_code(404); // Not Found
             echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
        } else {
             userApiLog("Erreur lors de l\'exécution du DELETE.");
             throw new Exception("La suppression en base de données a échoué.");
        }

    } catch (Exception $e) {
        userApiLog("ERREUR CATCH DELETE: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur lors de la suppression: ' . $e->getMessage()
        ]);
    }
}

// Fonction pour gérer POST (Ajout)
function handleCreateUser($pdo) {
    userApiLog("Début handleCreateUser");
    $data = json_decode(file_get_contents('php://input'), true);
    userApiLog("Données reçues pour POST: " . print_r($data, true));

    // Validation
    if (empty($data['email']) || empty($data['password']) || empty($data['role']) || empty($data['status'])) {
        userApiLog("Erreur POST: Données manquantes.");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données incomplètes (email, password, role, status requis).']);
        return;
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        userApiLog("Erreur POST: Email invalide.");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format d\'email invalide.']);
        return;
    }
    // TODO: Ajouter validation password (longueur?), role, status

    // Hachage du mot de passe (IMPORTANT)
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    if ($hashedPassword === false) {
         userApiLog("Erreur POST: Échec du hachage du mot de passe.");
         http_response_code(500);
         echo json_encode(['success' => false, 'message' => 'Erreur interne lors de la préparation du mot de passe.']);
         return;
    }
    userApiLog("Mot de passe haché.");

    try {
        // Vérifier si l'email existe déjà
        $checkSql = "SELECT id FROM users WHERE email = :email";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->bindParam(':email', $data['email']);
        $checkStmt->execute();
        if ($checkStmt->fetchColumn()) {
            userApiLog("Erreur POST: L'email existe déjà.");
            http_response_code(409); // Conflict
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
            return;
        }
        userApiLog("Email disponible.");

        // Insertion
        $sql = "INSERT INTO users (email, password, role, status, created_at) VALUES (:email, :password, :role, :status, NOW())";
        userApiLog("Préparation de la requête INSERT: " . $sql);
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':status', $data['status']);
        
        userApiLog("Exécution de la requête INSERT pour email: " . $data['email']);
        $success = $stmt->execute();
        $newUserId = $pdo->lastInsertId();

        if ($success) {
            userApiLog("Utilisateur ajouté avec succès. ID: " . $newUserId);
            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'Utilisateur ajouté avec succès.', 'id' => $newUserId]);
        } else {
            userApiLog("Erreur lors de l\'exécution de l\'INSERT.");
             throw new Exception("L\'ajout en base de données a échoué.");
        }

    } catch (Exception $e) {
        userApiLog("ERREUR CATCH POST: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur lors de l\'ajout: ' . $e->getMessage()
        ]);
    }
}

// --- Gestionnaire Principal --- 
try {
    userApiLog("Tentative de connexion PDO principale...");
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    userApiLog("Connexion PDO principale réussie.");

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGetUserList($pdo);
            break;
        case 'PUT':
            handleUpdateUser($pdo);
            break;
        case 'DELETE':
            handleDeleteUser($pdo);
            break;
        case 'POST':
            handleCreateUser($pdo);
            break;
        default:
            userApiLog("Méthode non autorisée: " . $method);
            http_response_code(405); // Method Not Allowed
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
            break;
    }

} catch (Exception $e) {
    // Gérer les erreurs de connexion PDO initiales
    userApiLog("ERREUR CATCH (Connexion PDO principale): " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()
    ]);
} 
?> 