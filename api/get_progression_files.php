<?php
// En-têtes CORS directs pour tout permettre
// Assurons-nous qu'il n'y a pas d'avertissements PHP qui s'affichent
error_reporting(E_ERROR);
ini_set('display_errors', 0);
header('Content-Type: application/json');

// Autoriser toutes les origines
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token, X-Requested-With, Accept, Authorization');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Activer le logging pour débogage
function logToFile($message, $data = []) {
    $logFile = __DIR__ . '/progression_files_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Charger les fichiers nécessaires
require_once __DIR__ . '/progression/ProgressionWebServiceV2/autoload.php';

// Vérifier si le fichier de configuration existe
$configFile = __DIR__ . '/progression/config.php';
if (!file_exists($configFile)) {
    logToFile("Fichier de configuration introuvable", ['path' => $configFile]);
    echo json_encode([
        'success' => false,
        'error' => 'login_required',
        'message' => 'Veuillez vous connecter à ProgressionLive',
        'data' => []
    ]);
    exit;
}

// Charger la configuration
require $configFile;

use ProgressionWebService\ArrayOfProperty;
use ProgressionWebService\ArrayOfRecordRef;
use ProgressionWebService\Credentials;
use ProgressionWebService\GetFilesDataRequest;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\Property;
use ProgressionWebService\RecordRef;
use ProgressionWebService\RecordType;
use ProgressionWebService\SearchRecordsRequest;

// Gestion préliminaire pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Pour les tests en ligne de commande ou les appels directs
if (isset($argv[1]) && !empty($argv[1])) {
    $_GET['ins'] = $argv[1];
}

if (!isset($_GET['ins']) || empty($_GET['ins'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Numéro d\'installation requis'
    ]);
    exit;
}

$installationNumber = $_GET['ins'];

// Aucune donnée statique - toutes les données sont récupérées directement depuis ProgressionLive
logToFile("Utilisation des données réelles de ProgressionLive");

logToFile("Démarrage de la requête pour l'installation", ['ins' => $installationNumber]);

try {
    // Charger la configuration
    $configFile = __DIR__ . '/progression/config.php';
    if (!file_exists($configFile)) {
        logToFile("Fichier de configuration non trouvé: " . $configFile);
        
        // Renvoyer un message demandant la connexion
        echo json_encode([
            'success' => false,
            'error' => 'login_required',
            'message' => 'Veuillez vous connecter à ProgressionLive',
            'data' => []
        ]);
        exit;
    }
    
    $config = require $configFile;
    logToFile("Configuration chargée");
    
    // Vérifier que le tableau de configuration contient les clés nécessaires
    if (!is_array($config) || !isset($config['company']) || !isset($config['company']['url']) || 
        !isset($config['auth']) || empty($config['auth']['username']) || empty($config['auth']['password'])) {
        logToFile("Configuration invalide ou identifiants manquants");
        
        // Renvoyer un message demandant la connexion
        echo json_encode([
            'success' => false,
            'error' => 'login_required',
            'message' => 'Veuillez vous connecter à ProgressionLive avec des identifiants valides',
            'data' => []
        ]);
        exit;
    }
    
    // Désactiver temporairement ce retour anticipé pour tester l'intégration complète
    // avec le service ProgressionLive. Décommenter si nécessaire pour revenir
    // au mode de test sans connexion.
    /*
    if (!isset($_GET['test'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Connexion au service de progression impossible pour le moment',
            'data' => []
        ]);
        exit;
    }
    */

    // Configurer les URLs du service SOAP
    $baseUrl = $config['company']['url'];
    $serviceUrl = $baseUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    logToFile("URLs du service", ['baseUrl' => $baseUrl, 'serviceUrl' => $serviceUrl]);
    
    logToFile("Création du service SOAP");
    $options = $config['soap']['options'] ?? [
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'stream_context' => stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ])
    ];
    
    $service = new ProgressionPortType($options, $wsdlUrl);
    $service->__setLocation($serviceUrl);
    logToFile("Service SOAP créé");
    
    // Authentification
    $credentials = new Credentials();
    $credentials->setUsername($config['auth']['username']);
    $credentials->setPassword($config['auth']['password']);
    $credentials->setDeviceId($config['auth']['device_id'] ?? 'WEB_SERVICE');
    $credentials->setClientVersion($config['auth']['client_version'] ?? '1.0');
    logToFile("Informations d'identification créées", ['username' => $config['auth']['username']]);
    
    try {
        logToFile("Tentative de connexion");
        $loginRequest = new LoginRequest($credentials);
        $loginResponse = $service->Login($loginRequest);
        
        if (!$loginResponse || !$loginResponse->getCredentials()) {
            throw new Exception('Échec de l\'authentification');
        }
        
        logToFile("Connexion réussie");
    } catch (Exception $e) {
        logToFile("Erreur lors de la connexion", ['error' => $e->getMessage()]);
        throw $e;
    }
    
    $credentials = $loginResponse->getCredentials();
    
    // Rechercher la tâche par code d'installation
    try {
        logToFile("Recherche de la tâche", ['installation' => $installationNumber]);
        $searchRequest = new SearchRecordsRequest();
        $searchRequest->setCredentials($credentials);
        $searchRequest->setRecordType(RecordType::TASK);
        $searchRequest->setQuery('code = :code');
        
        $property = new Property();
        $property->setName('code');
        $property->setValue(new \SoapVar($installationNumber, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema'));
        
        $properties = new ArrayOfProperty();
        $properties->setProperty([$property]);
        $searchRequest->setParameters($properties);
        
        logToFile("Envoi de la requête SearchRecords");
        $response = $service->SearchRecords($searchRequest);
        logToFile("Réponse de SearchRecords reçue");
    } catch (Exception $e) {
        logToFile("Erreur lors de la recherche de tâche", ['error' => $e->getMessage()]);
        throw $e;
    }
    
    if (!$response || !$response->getRecords() || !$response->getRecords()->getRecord()) {
        logToFile("Aucune tâche trouvée pour cette installation");
        
        // Retourner un tableau vide si aucune tâche n'est trouvée
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    $task = $response->getRecords()->getRecord()[0];
    logToFile("Tâche trouvée", ['task_id' => $task->getId()]);
    
    // Rechercher les pièces jointes pour cette tâche
    try {
        logToFile("Recherche des pièces jointes");
        $searchAttachmentsRequest = new SearchRecordsRequest();
        $searchAttachmentsRequest->setCredentials($credentials);
        $searchAttachmentsRequest->setRecordType(RecordType::TASK_ATTACHMENT);
        $searchAttachmentsRequest->setQuery('parent.id = :parentId');
        
        $property = new Property();
        $property->setName('parentId');
        $property->setValue(new \SoapVar($task->getId(), XSD_INT, 'int', 'http://www.w3.org/2001/XMLSchema'));
        
        $properties = new ArrayOfProperty();
        $properties->setProperty([$property]);
        $searchAttachmentsRequest->setParameters($properties);
        
        logToFile("Envoi de la requête pour les pièces jointes", [
            'task_id' => $task->getId(),
            'request' => [
                'parentId' => $task->getId(),
                'recordType' => RecordType::TASK_ATTACHMENT,
                'query' => 'parent.id = :parentId'
            ]
        ]);
        
        try {
            $attachmentsResponse = $service->SearchRecords($searchAttachmentsRequest);
            logToFile("Réponse reçue pour les pièces jointes", [
                'has_records' => $attachmentsResponse !== null && method_exists($attachmentsResponse, 'getRecords'),
                'response_type' => gettype($attachmentsResponse)
            ]);
            
            // Dump détaillé de la réponse pour debug
            if (isset($attachmentsResponse)) {
                logToFile("Structure de la réponse", [
                    'methods' => get_class_methods($attachmentsResponse),
                    'properties' => get_object_vars($attachmentsResponse)
                ]);
            }
        } catch (Exception $e) {
            logToFile("Exception lors de la requête des pièces jointes", [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    } catch (Exception $e) {
        logToFile("Erreur lors de la recherche des pièces jointes", ['error' => $e->getMessage()]);
        throw $e;
    }
    
    $attachments = [];
    
    // Analyse détaillée de la réponse pour comprendre sa structure
    logToFile("Analyse de la réponse pour les pièces jointes", [
        'reponse_null' => $attachmentsResponse === null,
        'has_getRecords_method' => method_exists($attachmentsResponse, 'getRecords'),
        'response_class' => get_class($attachmentsResponse)
    ]);
    
    // Vérifier plusieurs structures possibles de la réponse
    $hasAttachments = false;
    $files = null;
    
    try {
        if ($attachmentsResponse && method_exists($attachmentsResponse, 'getRecords')) {
            $records = $attachmentsResponse->getRecords();
            logToFile("Records obtenus", ['records_null' => $records === null]);
            
            if ($records) {
                if (method_exists($records, 'getRecord')) {
                    $recordsArray = $records->getRecord();
                    if (is_array($recordsArray) && count($recordsArray) > 0) {
                        $files = $recordsArray;
                        $hasAttachments = true;
                        logToFile("Pièces jointes trouvées via getRecord()", ['count' => count($files)]);
                    }
                } else if (property_exists($records, 'Record')) {
                    $recordsArray = $records->Record;
                    if (is_array($recordsArray) && count($recordsArray) > 0) {
                        $files = $recordsArray;
                        $hasAttachments = true;
                        logToFile("Pièces jointes trouvées via ->Record", ['count' => count($files)]);
                    }
                } else if (property_exists($records, 'record')) {
                    $recordsArray = $records->record;
                    if (is_array($recordsArray) && count($recordsArray) > 0) {
                        $files = $recordsArray;
                        $hasAttachments = true;
                        logToFile("Pièces jointes trouvées via ->record", ['count' => count($files)]);
                    }
                }
            }
        }
        
        // Si des fichiers ont été trouvés, les formater
        if ($hasAttachments && $files) {
            foreach ($files as $file) {
                logToFile("Traitement du fichier", [
                    'file_class' => get_class($file),
                    'file_methods' => get_class_methods($file),
                    'file_properties' => get_object_vars($file)
                ]);
                
                try {
                    $fileId = method_exists($file, 'getId') ? $file->getId() : 
                             (property_exists($file, 'Id') ? $file->Id : 
                             (property_exists($file, 'id') ? $file->id : null));
                    
                    $fileName = method_exists($file, 'getName') ? $file->getName() : 
                               (property_exists($file, 'Name') ? $file->Name : 
                               (property_exists($file, 'name') ? $file->name : 'Fichier_' . $fileId));
                    
                    $fileSize = method_exists($file, 'getSize') ? $file->getSize() : 
                               (property_exists($file, 'Size') ? $file->Size : 
                               (property_exists($file, 'size') ? $file->size : 0));
                    
                    // N'ajouter que si on a au moins un ID
                    if ($fileId) {
                        $attachments[] = [
                            'id' => $fileId,
                            'name' => $fileName,
                            'size' => $fileSize,
                            'isTargetFile' => false
                        ];
                    }
                } catch (Exception $e) {
                    logToFile("Erreur lors du traitement d'un fichier", [
                        'error' => $e->getMessage(),
                        'file' => json_encode($file)
                    ]);
                }
            }
        } else {
            logToFile("Aucune pièce jointe trouvée selon aucune des structures attendues");
        }
    } catch (Exception $e) {
        logToFile("Exception lors de l'analyse des pièces jointes", [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
    
    // Log final du résultat
    logToFile("Résultat final de la recherche de pièces jointes", [
        'count' => count($attachments),
        'attachments' => $attachments
    ]);
    
    if (empty($attachments)) {
        logToFile("Aucune pièce jointe trouvée");
    }
    
    logToFile("Réponse finale", ['files_count' => count($attachments)]);
    echo json_encode([
        'success' => true,
        'data' => $attachments
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, retourner un message d'erreur et un tableau vide
    logToFile("Exception attrapée", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    
    // Aucun fichier fictif, juste un message d'erreur
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'data' => []
    ]);
}
?>