<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

header('Content-Type: application/json');
setCorsHeaders();

$email = 'pierre@garychartrand.com';
$password = 'A11gdb333!';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Récupérer l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Générer un JWT
        $payload = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'exp' => time() + (60 * 60) // Expire dans 1 heure
        ];

        echo json_encode([
            'success' => true,
            'message' => 'Test de connexion réussi',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'status' => $user['status']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Identifiants invalides',
            'debug' => [
                'userExists' => $user ? true : false,
                'passwordValid' => $user ? password_verify($password, $user['password']) : false
            ]
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur : ' . $e->getMessage()]);
}
