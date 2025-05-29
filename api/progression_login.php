<?php
// Activer le logging pour débogage
function logToFile($message, $data = []) {
    $logFile = __DIR__ . '/logs/progression_login.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
    
    // S'assurer que le répertoire logs existe
    if (!is_dir(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

logToFile("Début progression_login.php");

// En-têtes CORS directs pour tout permettre
header('Content-Type: application/json');

// Autoriser toutes les origines
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token, X-Requested-With, Accept, Authorization');

// Gestion préliminaire pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    logToFile("Requête OPTIONS préliminaire");
    http_response_code(200);
    exit;
}

// Traitement des requêtes POST uniquement
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    logToFile("Méthode non autorisée", ['method' => $_SERVER['REQUEST_METHOD']]);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer les données JSON de la requête
$rawInput = file_get_contents('php://input');
logToFile("Données brutes reçues", ['raw' => $rawInput]);

$data = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    logToFile("Erreur parsing JSON", ['error' => json_last_error_msg()]);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données JSON invalides: ' . json_last_error_msg()]);
    exit;
}

// Vérifier les données requises
if (!isset($data['username']) || !isset($data['password']) || !isset($data['domain'])) {
    logToFile("Paramètres manquants", [
        'username_present' => isset($data['username']),
        'password_present' => isset($data['password']),
        'domain_present' => isset($data['domain'])
    ]);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
    exit;
}

// Sanitizer les entrées
$username = filter_var($data['username'], FILTER_SANITIZE_EMAIL);
$password = $data['password']; // Ne pas filtrer le mot de passe qui peut contenir des caractères spéciaux
// Utiliser htmlspecialchars au lieu de FILTER_SANITIZE_STRING (déprécié)
$domain = htmlspecialchars($data['domain'], ENT_QUOTES, 'UTF-8');

logToFile("Paramètres validés", [
    'username' => $username, 
    'domain' => $domain,
    'password_length' => strlen($password)
]);

// Chemins des fichiers de configuration
$configFile = __DIR__ . '/progression/config.php';
$configExampleFile = __DIR__ . '/progression/config.example.php';

logToFile("Fichiers de configuration", [
    'config' => $configFile,
    'example' => $configExampleFile,
    'config_exists' => file_exists($configFile),
    'example_exists' => file_exists($configExampleFile)
]);

// Vérifier si le fichier exemple existe, sinon on ne peut pas continuer
if (!file_exists($configExampleFile)) {
    logToFile("Fichier de configuration exemple non trouvé");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Fichier de configuration exemple non trouvé']);
    exit;
}

// Charger la configuration exemple
$configExample = require $configExampleFile;

// Créer une nouvelle configuration basée sur l'exemple
$newConfig = $configExample;
$newConfig['company']['domain'] = $domain;
$newConfig['company']['url'] = "https://{$domain}.progressionlive.com";
$newConfig['auth']['username'] = $username;
$newConfig['auth']['password'] = $password;

// Tester la connexion à ProgressionLive
require_once __DIR__ . '/progression/ProgressionWebServiceV2/autoload.php';

use ProgressionWebService\Credentials;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;

try {
    // Initialiser le service SOAP avec la nouvelle configuration
    $baseUrl = $newConfig['company']['url'];
    $serviceUrl = $baseUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    logToFile("Configuration SOAP", [
        'baseUrl' => $baseUrl,
        'serviceUrl' => $serviceUrl,
        'wsdlUrl' => $wsdlUrl
    ]);
    
    $options = $newConfig['soap']['options'];
    
    logToFile("Création du service SOAP");
    $service = new ProgressionPortType($options, $wsdlUrl);
    $service->__setLocation($serviceUrl);
    
    // Créer les informations d'identification
    logToFile("Création des credentials");
    $credentials = new Credentials();
    $credentials->setUsername($username);
    $credentials->setPassword($password);
    $credentials->setDeviceId($newConfig['auth']['device_id']);
    $credentials->setClientVersion($newConfig['auth']['client_version']);
    
    // Essayer de se connecter
    logToFile("Tentative de connexion à ProgressionLive");
    $loginRequest = new LoginRequest($credentials);
    
    try {
        $loginResponse = $service->Login($loginRequest);
        logToFile("Réponse de connexion reçue");
        
        if (!$loginResponse) {
            logToFile("Échec: Réponse de connexion vide");
            throw new Exception('Réponse de connexion vide');
        }
        
        if (!$loginResponse->getCredentials()) {
            logToFile("Échec: Aucun credential retourné");
            throw new Exception('Aucun identifiant retourné par le service');
        }
        
        logToFile("Connexion réussie, sauvegarde de la configuration");
    } catch (SoapFault $sf) {
        logToFile("SoapFault lors de la connexion", [
            'code' => $sf->getCode(),
            'message' => $sf->getMessage(),
            'faultstring' => isset($sf->faultstring) ? $sf->faultstring : null
        ]);
        throw new Exception('Erreur SOAP: ' . $sf->getMessage());
    }
    
    // La connexion a réussi, sauvegarder la configuration
    $configContent = "<?php\n// config.php - Généré automatiquement\n\nreturn " . var_export($newConfig, true) . ";";
    
    try {
        $result = file_put_contents($configFile, $configContent);
        
        if ($result === false) {
            logToFile("Erreur lors de l'écriture du fichier de configuration", [
                'path' => $configFile,
                'writable' => is_writable(dirname($configFile))
            ]);
            throw new Exception('Impossible d\'écrire le fichier de configuration');
        }
        
        logToFile("Configuration sauvegardée avec succès", [
            'path' => $configFile,
            'size' => filesize($configFile)
        ]);
    } catch (Exception $writeError) {
        logToFile("Exception lors de l'écriture du fichier", [
            'error' => $writeError->getMessage()
        ]);
        throw new Exception('Erreur lors de la sauvegarde de la configuration: ' . $writeError->getMessage());
    }
    
    // Retourner succès
    $successResponse = [
        'success' => true,
        'message' => 'Connexion réussie à ProgressionLive',
        'username' => $username,
        'domain' => $domain
    ];
    
    logToFile("Connexion réussie, réponse", $successResponse);
    echo json_encode($successResponse);
    
} catch (Exception $e) {
    // En cas d'erreur, retourner un message d'erreur
    logToFile("Exception finale attrapée", [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    http_response_code(401);
    $errorResponse = [
        'success' => false,
        'message' => 'Erreur d\'authentification: ' . $e->getMessage()
    ];
    echo json_encode($errorResponse);
}