<?php
// Activation du reporting d'erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuration de la base de données LOCALE
define('DB_HOST', 'localhost'); // ou l'IP/nom d'hôte de votre serveur MySQL
define('DB_NAME', 'local_calendar_db'); // <--- Correction ici
define('DB_USER', 'root'); // L'utilisateur local
define('DB_PASS', ''); // Essayer avec un mot de passe VIDE

// Génération d'une clé JWT sécurisée si elle n'existe pas
if (!defined('JWT_SECRET')) {
    $jwt_file = __DIR__ . '/jwt_secret.php';
    if (file_exists($jwt_file)) {
        require_once $jwt_file;
    } else {
        $new_key = bin2hex(random_bytes(32));
        file_put_contents($jwt_file, "<?php define('JWT_SECRET', '$new_key'); ?>");
        define('JWT_SECRET', $new_key);
    }
}

// Chargement de la classe JWT
require_once __DIR__ . '/classes/JWT.php';

// Configuration CORS commune
define('CORS_ORIGIN', '*');

// Fonction commune pour les headers CORS
function setCorsHeaders() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache pour 1 jour
    header('Content-Type: application/json; charset=utf-8');

    // Gérer les requêtes OPTIONS pour le preflight
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        }
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        }
        exit(0);
    }
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    // Configuration de PDO pour lever des exceptions en cas d'erreur
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // En cas d'erreur de connexion, afficher un message et arrêter le script
    // En production, loguer l'erreur au lieu de l'afficher
    error_log("Erreur de connexion : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base de données']);
    exit;
}
?> 