<?php
date_default_timezone_set('America/Montreal');

// Configuration de base
error_reporting(E_ALL & ~E_DEPRECATED);  // Ignorer les avertissements de dépréciation
ini_set('display_errors', 1);

// Headers pour CORS et JSON
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once __DIR__ . '/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\Credentials;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\SearchRecordsRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\ArrayOfProperty;
use ProgressionWebService\Property;
use ProgressionWebService\RecordType;
use ProgressionWebService\Utils;

// Fonction pour retourner une réponse JSON
function returnResponse($success, $message = '', $data = [], $debug = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'debug' => $debug
    ], JSON_PRETTY_PRINT);
    exit;
}

// Fonction pour retourner une erreur
function returnError($message, $debug = [], $httpCode = 500) {
    returnResponse(false, $message, [], $debug, $httpCode);
}

try {
    // Configuration
    $config = [
        'company_domain' => 'garychartrand',
        'username' => 'pierre@garychartrand.com',
        'password' => 'A11gdb333!'
    ];

    $debug = [
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'query_string' => $_SERVER['QUERY_STRING'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'script_name' => $_SERVER['SCRIPT_NAME'],
        'get_params' => $_GET,
        'config' => [
            'company_domain' => $config['company_domain'],
            'username' => $config['username']
        ]
    ];

    // Construction des URLs
    $serverUrl = "https://{$config['company_domain']}.progressionlive.com";
    $serviceUrl = $serverUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';

    $debug['urls'] = [
        'serverUrl' => $serverUrl,
        'serviceUrl' => $serviceUrl,
        'wsdlUrl' => $wsdlUrl
    ];

    // Configuration du client SOAP
    $opts = array(
        'connection_timeout' => 30,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        'trace' => true
    );

    // Initialisation du service
    $service = new ProgressionPortType($opts, $wsdlUrl);
    $service->__setLocation($serviceUrl);
    $debug['service'] = 'Service SOAP initialisé';

    // Préparation des credentials
    $credentials = new Credentials();
    $credentials->setUsername($config['username']);
    $credentials->setPassword($config['password']);

    // Connexion
    $loginResponse = $service->Login(new LoginRequest($credentials));
    $credentials = $loginResponse->getCredentials();
    $debug['login'] = 'Connexion réussie';

    // Vérification du paramètre code
    if (!isset($_GET['code'])) {
        returnError("Code de tâche manquant", $debug, 400);
    }

    $taskCode = $_GET['code'];
    $debug['task_code'] = $taskCode;

    // Recherche de la tâche selon l'exemple searchTask.php
    $searchRequest = new SearchRecordsRequest();
    $searchRequest->setCredentials($credentials);
    $searchRequest->setRecordType(RecordType::TASK);
    $searchRequest->setQuery('code = :code');
    
    // Paramètres de recherche
    $params = new ArrayOfProperty();
    $codeParam = new Property();
    $codeParam->setName('code');
    $codeParam->setValue(new \SoapVar($taskCode, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema'));
    $params->setProperty(array($codeParam));
    $searchRequest->setParameters($params);

    // Exécution de la recherche
    $searchResponse = $service->SearchRecords($searchRequest);
    $debug['search_response'] = 'Requête de recherche effectuée';

    if (!$searchResponse || !$searchResponse->getRecords()) {
        returnResponse(true, '', ['task' => null], $debug);
    }

    // Récupération du premier enregistrement
    $record = $searchResponse->getRecords()->getRecord();
    if (is_array($record)) {
        $record = $record[0];
    }

    // Récupération des propriétés et métadonnées
    $clientProperties = [];
    $allProperties = [];
    
    // Vérification des propriétés standard
    if ($record->getProperties() && $record->getProperties()->getProperty()) {
        $properties = $record->getProperties()->getProperty();
        if (is_array($properties)) {
            foreach ($properties as $property) {
                $clientProperties[$property->getName()] = $property->getValue();
                $allProperties['properties'][$property->getName()] = $property->getValue();
            }
        } else {
            $clientProperties[$properties->getName()] = $properties->getValue();
            $allProperties['properties'][$properties->getName()] = $properties->getValue();
        }
    }
    
    // Vérification des métadonnées
    if ($record->getMetas() && $record->getMetas()->getProperty()) {
        $metas = $record->getMetas()->getProperty();
        if (is_array($metas)) {
            foreach ($metas as $meta) {
                $clientProperties[$meta->getName()] = $meta->getValue();
                $allProperties['metas'][$meta->getName()] = $meta->getValue();
            }
        } else {
            $clientProperties[$metas->getName()] = $metas->getValue();
            $allProperties['metas'][$metas->getName()] = $metas->getValue();
        }
    }

    // Formatage de la réponse
    $taskData = Utils::formatTaskResponse($record);
    if (!$taskData) {
        returnResponse(true, '', ['task' => null], $debug);
    }

    // Ajout des propriétés brutes pour le débogage
    $debug['raw_record'] = [
        'properties' => $record->getProperties() ? Utils::propertiesToArray($record->getProperties()) : [],
        'metas' => $record->getMetas() ? Utils::propertiesToArray($record->getMetas()) : [],
        'task_data' => $taskData,
        'record_data' => [
            'id' => $record->getId(),
            'code' => $record->getCode(),
            'summary' => $record->getSummary(),
            'description' => $record->getDescription(),
            'clientAddress' => $record->getClientAddress() ? Utils::addressToArray($record->getClientAddress()) : [],
            'nodeAddress' => $record->getNodeAddress() ? Utils::addressToArray($record->getNodeAddress()) : null
        ]
    ];

    $debug['client_properties'] = $clientProperties;
    $debug['record_properties'] = $record->getProperties() ? Utils::propertiesToArray($record->getProperties()) : [];
    $debug['record_metas'] = $record->getMetas() ? Utils::propertiesToArray($record->getMetas()) : [];
    $debug['all_properties'] = $allProperties;
    $debug['task_id'] = $record->getId();

    // Construction de la réponse
    $response = [
        'task' => [
            'code' => $record->getCode(),
            'client' => [
                'nom' => $taskData['client']['name'] ?? null,
                'telephone' => $taskData['client']['phone'] ?? null,
                'adresse' => $taskData['client']['adresse'] ?? null,
                'ville' => $taskData['client']['ville'] ?? null,
                'province' => $taskData['client']['province'] ?? null,
                'code_postal' => $taskData['client']['code_postal'] ?? null
            ],
            'installation' => $taskData['installation'] ?? null,
            'sommaire' => $taskData['summary'] ?? null,
            'description' => $taskData['description'] ?? null,
            'montant' => $taskData['task']['price'] ?? null,
            'po' => $clientProperties['info.po'] ?? null,
            'representant' => $clientProperties['soumission.rep'] ?? null,
            'debug_properties' => $clientProperties
        ]
    ];

    returnResponse(true, 'Tâche trouvée', $response, $debug);

} catch (Exception $e) {
    returnError($e->getMessage(), $debug);
}