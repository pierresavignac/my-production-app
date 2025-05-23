<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Réglages supplémentaires pour PHP 
ini_set('max_execution_time', 120); // 2 minutes
ini_set('memory_limit', '256M');    // 256 MB

require_once __DIR__ . '/progression/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/progression/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\ArrayOfRecordRef;
use ProgressionWebService\Credentials;
use ProgressionWebService\GetFilesDataRequest;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\RecordRef;
use ProgressionWebService\RecordType;

// Désactiver tout tampon de sortie
while (ob_get_level()) ob_end_clean();

// Autoriser CORS pour les requêtes - spécifique à l'environnement local
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://app.vivreenliberte.org'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173'); // Origine par défaut
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

// Récupération des paramètres
$attachmentId = isset($_GET['id']) ? intval($_GET['id']) : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'attachment'; // Par défaut en téléchargement

if (!$attachmentId) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: ID de pièce jointe requis (utilisez le paramètre id)";
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
    $filesRequest->setMaxSize(20 * 1024 * 1024); // 20 MB
    
    $filesResponse = $service->GetFilesData($filesRequest);
    
    if (!$filesResponse || !$filesResponse->getRecords() || !$filesResponse->getRecords()->getRecord()) {
        throw new Exception('Aucune donnée trouvée pour cette pièce jointe');
    }
    
    $fileData = $filesResponse->getRecords()->getRecord()[0];
    
    if (!$fileData->getData()) {
        throw new Exception('Pas de données disponibles pour ce fichier');
    }

    // Informations sur le fichier
    $fileName = $fileData->getName();
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Méthode simplifiée de décodage - plus compatible avec tous les navigateurs
    $encodedData = $fileData->getData();
    $fileContent = base64_decode($encodedData);
    
    if ($fileContent === false) {
        // Nettoyer les données et réessayer
        $cleanData = preg_replace('/[^A-Za-z0-9\/\+=]/', '', $encodedData);
        $fileContent = base64_decode($cleanData);
        
        if ($fileContent === false) {
            throw new Exception('Échec du décodage du fichier');
        }
    }
    
    // Sauvegarder une copie locale avant tout
    if ($installationNumber) {
        try {
            $directory = __DIR__ . '/files/' . $installationNumber;
            if (!file_exists($directory)) {
                if (!mkdir($directory, 0755, true)) {
                    error_log("Impossible de créer le répertoire: $directory");
                }
            }
            
            if (is_writable($directory) || is_writable(__DIR__ . '/files/')) {
                $localPath = $directory . '/' . $fileName;
                file_put_contents($localPath, $fileContent);
                
                // Si c'est un PDF, on sauvegarde également les données brutes pour diagnostic
                if ($fileExtension === 'pdf') {
                    file_put_contents($localPath . '.raw', $encodedData);
                }
                
                error_log("Fichier sauvegardé localement dans: $localPath");
            } else {
                error_log("Le répertoire n'est pas accessible en écriture: $directory");
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la sauvegarde locale: " . $e->getMessage());
            // Continuer sans interrompre le téléchargement
        }
    }
    
    // Déterminer le type MIME approprié
    switch ($fileExtension) {
        case 'pdf':
            $contentType = 'application/pdf';
            break;
        case 'jpg':
        case 'jpeg':
            $contentType = 'image/jpeg';
            break;
        case 'png':
            $contentType = 'image/png';
            break;
        case 'gif':
            $contentType = 'image/gif';
            break;
        default:
            // Utiliser le type fourni par l'API ou un type générique
            $contentType = $fileData->getContentType() ?: 'application/octet-stream';
    }
    
    // Configuration des en-têtes HTTP optimisés pour Safari
    header('Content-Type: ' . $contentType);
    
    if ($mode === 'inline') {
        header('Content-Disposition: inline; filename="' . $fileName . '"');
    } else {
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
    }
    
    header('Content-Length: ' . strlen($fileContent));
    header('Accept-Ranges: bytes');
    
    // Désactiver toute mise en cache pour Safari
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    
    // Éviter la mise en cache agressive de Safari
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() - 1) . ' GMT');
    
    // Servir le fichier directement
    echo $fileContent;
    
} catch (Exception $e) {
    // En cas d'erreur, renvoyer un message simple et lisible
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Erreur: ' . $e->getMessage();
    error_log('Erreur de téléchargement: ' . $e->getMessage());
}
?>