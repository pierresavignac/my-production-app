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

// Autoriser CORS pour les requêtes de prévisualisation
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

// Récupération des paramètres
$attachmentId = isset($_GET['id']) ? intval($_GET['id']) : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'attachment'; // Par défaut en téléchargement

if (!$attachmentId) {
    header('Content-Type: text/plain');
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

    // IMPORTANT: Les données sont en base64, il faut les décoder avant de les renvoyer
    $data = $fileData->getData();
    
    // Tout d'abord, déterminons le type de fichier
    $fileName = $fileData->getName();
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Debug - Enregistrer les informations sur le fichier
    $debugInfo = [
        'attachment_id' => $attachmentId,
        'installation_number' => $installationNumber,
        'file_name' => $fileName,
        'file_extension' => $fileExtension, 
        'content_type' => $fileData->getContentType(),
        'data_length' => strlen($data)
    ];
    error_log("DEBUG - Informations sur le fichier: " . json_encode($debugInfo));
    
    // Essayer différentes approches de décodage
    $decodingMethods = [
        // Première tentative - décodage standard après nettoyage
        function($d) {
            return base64_decode(preg_replace('/[^A-Za-z0-9\/\+=]/', '', $d), true);
        },
        // Deuxième tentative - remplacer les espaces par +
        function($d) {
            return base64_decode(str_replace(' ', '+', $d), true);
        },
        // Troisième tentative - conversion spéciale pour les caractères URL encodés
        function($d) {
            return base64_decode(urldecode($d), true);
        },
        // Quatrième tentative - décodage sans validation stricte
        function($d) {
            return base64_decode($d, false);
        },
        // Cinquième tentative - utiliser un filtre PHP
        function($d) {
            $temp = tempnam(sys_get_temp_dir(), 'b64');
            file_put_contents($temp, $d);
            $result = file_get_contents("php://filter/read=convert.base64-decode/resource=$temp");
            unlink($temp);
            return $result;
        },
        // Dernière tentative - utiliser les données brutes sans décodage
        function($d) {
            return $d;
        }
    ];
    
    // Essayer chaque méthode jusqu'à ce qu'une fonctionne
    $fileContent = false;
    foreach ($decodingMethods as $index => $method) {
        $fileContent = $method($data);
        if ($fileContent !== false && !empty($fileContent)) {
            error_log("Décodage réussi avec la méthode #$index pour le fichier ID: $attachmentId");
            break;
        }
    }
    
    // Si tout échoue, utiliser les données brutes
    if ($fileContent === false || empty($fileContent)) {
        error_log("Tous les décodages ont échoué pour le fichier ID: $attachmentId - Utilisation des données brutes");
        $fileContent = $data;
    }
    
    // Vérifier que le fichier contient des données valides
    if (empty($fileContent)) {
        error_log("Erreur: Contenu vide pour le fichier ID: $attachmentId");
        header('Content-Type: text/plain');
        echo "Erreur: Le fichier obtenu est vide";
        exit;
    }
    
    // Définir le type MIME correct en fonction de l'extension
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
            $contentType = $fileData->getContentType() ?: 'application/octet-stream';
    }
    
    // Configurer les en-têtes pour la visualisation ou le téléchargement
    header('Content-Type: ' . $contentType);
    
    // Déterminer le mode (téléchargement ou visualisation)
    if ($mode === 'inline') {
        // Mode visualisation - Content-Disposition: inline
        header('Content-Disposition: inline; filename="' . $fileName . '"');
        
        // Pour éviter les problèmes de type de contenu
        header('X-Content-Type-Options: nosniff');
    } else {
        // Mode téléchargement - Content-Disposition: attachment
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
    }
    
    header('Content-Length: ' . strlen($fileContent));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Envoyer le contenu du fichier directement
    echo $fileContent;
    flush();
    
    // Optionnellement, sauvegarder une copie du fichier localement
    if ($installationNumber) {
        try {
            $directory = './files/' . $installationNumber;
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            file_put_contents($directory . '/' . $fileName, $fileContent);
            
            // Si le fichier est un PDF, créer également une copie brute pour diagnostic
            if (strtolower(pathinfo($fileName, PATHINFO_EXTENSION)) === 'pdf') {
                file_put_contents($directory . '/' . $fileName . '.raw', $data);
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la sauvegarde locale: " . $e->getMessage());
            // Continuer sans interrompre le téléchargement
        }
    }
    
} catch (Exception $e) {
    header('Content-Type: text/plain');
    echo 'Erreur: ' . $e->getMessage();
}
?>