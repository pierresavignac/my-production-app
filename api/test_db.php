<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$db   = 'vivreenl_prod_calendar';
$user = 'vivreenl_username_prod_calendar';
$pass = 'pachYv-9mybmo-bagmeh';
$charset = 'utf8mb4';

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connexion réussie!";
    
    // Tester la connexion avec une requête simple
    $stmt = $pdo->query("SELECT DATABASE()");
    $result = $stmt->fetch();
    echo "\nBase de données actuelle : " . $result['DATABASE()'];
    
} catch(PDOException $e) {
    echo "Erreur de connexion : " . $e->getMessage();
}
