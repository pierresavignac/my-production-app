<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

header('Content-Type: application/json');
setCorsHeaders();

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Vérifier si la table users existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() === 0) {
        echo json_encode(['message' => 'La table users n\'existe pas. Création...']);
        
        // Créer la table users
        $sql = "CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            verification_token VARCHAR(255),
            reset_token VARCHAR(255),
            reset_token_expires DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        $pdo->exec($sql);
        
        // Créer l'utilisateur admin par défaut
        $email = 'pierre@garychartrand.com';
        $password = password_hash('A11gdb333!', PASSWORD_DEFAULT);
        $role = 'admin';
        $status = 'approved';
        
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$email, $password, $role, $status]);
        
        echo json_encode(['message' => 'Table users créée et utilisateur admin ajouté']);
    } else {
        // Vérifier les utilisateurs existants
        $stmt = $pdo->query("SELECT id, email, role, status FROM users");
        $users = $stmt->fetchAll();
        
        // Tester l'authentification
        $email = 'pierre@garychartrand.com';
        $password = 'A11gdb333!';
        
        $stmt = $pdo->prepare("SELECT id, email, password, role, status FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        $authResult = [
            'tableExists' => true,
            'users' => $users,
            'authTest' => [
                'email' => $email,
                'userFound' => $user ? true : false,
                'passwordValid' => $user && password_verify($password, $user['password']),
                'status' => $user ? $user['status'] : null,
                'role' => $user ? $user['role'] : null
            ]
        ];
        
        echo json_encode($authResult);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur : ' . $e->getMessage()]);
}
