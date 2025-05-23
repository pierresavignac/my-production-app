<?php
// Script robuste pour la visualisation directe de tous types de fichiers
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Réglages supplémentaires pour PHP 
ini_set('max_execution_time', 120); // 2 minutes
ini_set('memory_limit', '256M');    // 256 MB

// Désactiver tout tampon de sortie pour éviter les problèmes avec les fichiers binaires
while (ob_get_level()) ob_end_clean();

// Autoriser CORS pour tous les domaines (à adapter selon votre politique de sécurité)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

// Paramètres
$fileId = isset($_GET['id']) ? intval($_GET['id']) : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['name']) ? $_GET['name'] : null;
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline'; // 'inline' pour visualisation, 'download' pour téléchargement

// Validation des paramètres
if (!$installationNumber) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Numéro d'installation requis";
    exit;
}

if (!$fileId && !$fileName) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: ID de fichier ou nom de fichier requis";
    exit;
}

// Nettoyer le numéro d'installation pour sécurité
$installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);

// Si un nom de fichier est fourni, essayer d'abord de servir depuis le cache local
if ($fileName) {
    $localPath = __DIR__ . '/files/' . $installationNumber . '/' . basename($fileName);
    
    if (file_exists($localPath)) {
        // Déterminer le type MIME
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
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
            case 'webp':
                $contentType = 'image/webp';
                break;
            case 'svg':
                $contentType = 'image/svg+xml';
                break;
            case 'txt':
                $contentType = 'text/plain';
                break;
            default:
                $contentType = 'application/octet-stream';
        }
        
        // Lire le fichier
        $fileContent = file_get_contents($localPath);
        
        // Configurer les en-têtes
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . filesize($localPath));
        
        if ($mode === 'inline') {
            header('Content-Disposition: inline; filename="' . basename($fileName) . '"');
        } else {
            header('Content-Disposition: attachment; filename="' . basename($fileName) . '"');
        }
        
        // Désactiver le cache
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() - 1) . ' GMT');
        
        // Envoyer le fichier
        echo $fileContent;
        exit;
    }
}

// Si on arrive ici, soit le fichier n'est pas en cache local, soit seul l'ID a été fourni
// Dans les deux cas on va utiliser le service ProgressionLive

// Charger les composants nécessaires pour ProgressionLive
require_once __DIR__ . '/progression/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/progression/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\ArrayOfRecordRef;
use ProgressionWebService\Credentials;
use ProgressionWebService\GetFilesDataRequest;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\RecordRef;
use ProgressionWebService\RecordType;

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
    $recordRef->setId($fileId);
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

    // Récupérer les informations sur le fichier
    $fileName = $fileData->getName() ?: $fileName ?: 'file_' . $fileId;
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Décodage base64 des données
    $encodedData = $fileData->getData();
    $fileContent = base64_decode($encodedData);
    
    // Créer le répertoire de cache si nécessaire
    $cacheDir = __DIR__ . '/files/' . $installationNumber;
    if (!file_exists($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    // Sauvegarder le fichier pour les futures requêtes
    $localPath = $cacheDir . '/' . basename($fileName);
    file_put_contents($localPath, $fileContent);
    
    // Déterminer le type MIME
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
        case 'webp':
            $contentType = 'image/webp';
            break;
        case 'svg':
            $contentType = 'image/svg+xml';
            break;
        case 'txt':
            $contentType = 'text/plain';
            break;
        default:
            $contentType = $fileData->getContentType() ?: 'application/octet-stream';
    }
    
    // Configurer les en-têtes
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($fileContent));
    
    if ($mode === 'inline') {
        header('Content-Disposition: inline; filename="' . basename($fileName) . '"');
    } else {
        header('Content-Disposition: attachment; filename="' . basename($fileName) . '"');
    }
    
    // Désactiver le cache
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() - 1) . ' GMT');
    
    // Envoyer le fichier
    echo $fileContent;
    
} catch (Exception $e) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Erreur: ' . $e->getMessage();
    error_log('Erreur dans direct_file_viewer.php: ' . $e->getMessage());
}
?>