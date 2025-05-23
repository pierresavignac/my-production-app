<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/progression/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/progression/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\ArrayOfRecordRef;
use ProgressionWebService\Credentials;
use ProgressionWebService\GetFilesDataRequest;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\RecordRef;
use ProgressionWebService\RecordType;

// Récupération des paramètres
$attachmentId = isset($_GET['id']) ? intval($_GET['id']) : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['filename']) ? $_GET['filename'] : null;

if (!$attachmentId || !$installationNumber) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'ID de pièce jointe et numéro d\'installation requis']);
    exit;
}

try {
    // Charger la configuration
    $config = require_once __DIR__ . '/progression/config.php';
    
    // Initialiser le service SOAP
    $baseUrl = $config['company']['url'];
    $serviceUrl = $baseUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    $service = new ProgressionPortType($config['soap']['options'], $wsdlUrl);
    $service->__setLocation($serviceUrl);
    
    // Connexion
    $credentials = new Credentials();
    $credentials->setUsername($config['auth']['username']);
    $credentials->setPassword($config['auth']['password']);
    $credentials->setDeviceId($config['auth']['device_id']);
    $credentials->setClientVersion($config['auth']['client_version']);
    
    $loginRequest = new LoginRequest($credentials);
    $loginResponse = $service->Login($loginRequest);
    
    if (!$loginResponse || !$loginResponse->getCredentials()) {
        throw new Exception('Échec de l\'authentification');
    }
    
    $credentials = $loginResponse->getCredentials();
    
    // Récupération des données de la pièce jointe
    $recordRef = new RecordRef();
    $recordRef->setId($attachmentId);
    $recordRef->setType(RecordType::TASK_ATTACHMENT);
    
    $recordRefs = new ArrayOfRecordRef();
    $recordRefs->setRecordRef([$recordRef]);
    
    $filesRequest = new GetFilesDataRequest();
    $filesRequest->setCredentials($credentials);
    $filesRequest->setRecordRefs($recordRefs);
    $filesRequest->setMaxSize(10 * 1024 * 1024); // 10 MB
    
    $filesResponse = $service->GetFilesData($filesRequest);
    
    if (!$filesResponse || !$filesResponse->getRecords() || !$filesResponse->getRecords()->getRecord()) {
        throw new Exception('Aucune donnée trouvée pour cette pièce jointe');
    }
    
    $fileData = $filesResponse->getRecords()->getRecord()[0];
    
    if (!$fileData->getData()) {
        throw new Exception('Pas de données disponibles pour ce fichier');
    }
    
    // Préparer le téléchargement
    $downloadName = $fileName ?: $fileData->getName();
    $contentType = $fileData->getContentType() ?: 'application/octet-stream';
    
    // S'assurer que les données sont correctement encodées en base64
    $data = $fileData->getData();
    // Nettoyer les caractères non-base64 si nécessaire
    $data = preg_replace('/[^A-Za-z0-9\/\+=]/', '', $data);
    $decodedData = base64_decode($data, true);
    
    // Configurer les en-têtes pour le téléchargement
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . strlen($decodedData));
    
    // Envoyer le contenu du fichier
    echo $decodedData;
    
    // Optionnellement, sauvegarder une copie du fichier
    $directory = './files/' . $installationNumber;
    if (!file_exists($directory)) {
        mkdir($directory, 0755, true);
    }
    
    // Vérifier que le décodage a fonctionné
    if ($decodedData === false) {
        // Si le décodage a échoué, tenter une autre approche
        error_log("Échec du décodage base64 pour {$downloadName}, tentative alternative");
        // Récupérer les données brutes sans tenter de décoder
        file_put_contents($directory . '/' . $downloadName . '.raw', $data);
        throw new Exception('Échec du décodage du fichier. Format non reconnu.');
    }
    
    file_put_contents($directory . '/' . $downloadName, $decodedData);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>