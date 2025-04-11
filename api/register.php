<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

// Récupérer et décoder les données JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email et mot de passe requis']);
    exit();
}

// Validation de l'email
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Format d\'email invalide']);
    exit();
}

// Validation du mot de passe
if (strlen($data['password']) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Le mot de passe doit contenir au moins 6 caractères']);
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8",
        $db_user,
        $db_pass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet email est déjà utilisé']);
        exit();
    }

    // Hasher le mot de passe
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    // Insérer le nouvel utilisateur
    $stmt = $pdo->prepare('
        INSERT INTO users (email, password, role, status, created_at) 
        VALUES (?, ?, ?, ?, NOW())
    ');
    
    $stmt->execute([
        $email,
        $hashedPassword,
        'user',
        'pending'
    ]);

    echo json_encode(['message' => 'Compte créé avec succès']);

} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la création du compte']);
}
