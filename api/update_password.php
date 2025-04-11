<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Mettre à jour le mot de passe
    $email = 'pierre@garychartrand.com';
    $newPassword = 'A11gdb333!';
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $result = $stmt->execute([$hashedPassword, $email]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Mot de passe mis à jour avec succès']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Échec de la mise à jour du mot de passe']);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur : ' . $e->getMessage()]);
}
