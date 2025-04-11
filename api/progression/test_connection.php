<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('memory_limit', '256M');

require_once __DIR__ . '/ProgressionWebServiceV2/bootstrap.php';
require_once __DIR__ . '/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\Credentials;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;

try {
    echo "Démarrage du test de connexion...\n";
    
    // Chargement de la configuration
    $config = require_once __DIR__ . '/config.php';
    echo "Configuration chargée.\n";
    
    // Configuration du service SOAP
    $serverUrl = "http://{$config['company_domain']}.progressionlive.com";
    $serviceUrl = $serverUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    echo "URLs configurées:\n";
    echo "Server URL: $serverUrl\n";
    echo "Service URL: $serviceUrl\n";
    echo "WSDL URL: $wsdlUrl\n";
    
    // Options pour le service SOAP
    $options = [
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_DISK,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        'connection_timeout' => 30,
        'compression' => SOAP_COMPRESSION_ACCEPT | SOAP_COMPRESSION_GZIP,
        'stream_context' => stream_context_create([
            'http' => [
                'timeout' => 30
            ]
        ])
    ];
    
    echo "Création du service SOAP...\n";
    // Création du service SOAP
    $service = new ProgressionPortType($options, $wsdlUrl);
    echo "Service SOAP créé.\n";
    
    echo "Préparation des credentials...\n";
    // Création des credentials
    $credentials = new Credentials();
    $credentials->setUsername($config['username']);
    $credentials->setPassword($config['password']);
    
    echo "Préparation de la requête de login...\n";
    // Création de la requête de login
    $loginRequest = new LoginRequest();
    $loginRequest->setCredentials($credentials);
    
    echo "Tentative de connexion...\n";
    // Test de connexion
    $loginResponse = $service->Login($loginRequest);
    
    echo "Connexion réussie!\n";
    $sessionCredentials = $loginResponse->getCredentials();
    echo "Session ID: " . $sessionCredentials->getSessionID() . "\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
    
    if (isset($service)) {
        echo "\nDernière requête SOAP:\n" . $service->__getLastRequest() . "\n";
        echo "\nDernière réponse SOAP:\n" . $service->__getLastResponse() . "\n";
    }
}
