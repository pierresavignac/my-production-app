<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

try {
    // Test de l'extension SOAP
    if (!extension_loaded('soap')) {
        throw new Exception('Extension SOAP non chargée');
    }
    echo "Extension SOAP OK\n";

    // Chargement de la configuration
    $config = require_once __DIR__ . '/config.php';
    echo "Configuration chargée\n";

    // Configuration du service SOAP
    $serverUrl = "https://{$config['company_domain']}.progressionlive.com";
    $serviceUrl = $serverUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    echo "URLs configurées:\n";
    echo "Server URL: " . $serverUrl . "\n";
    echo "Service URL: " . $serviceUrl . "\n";
    echo "WSDL URL: " . $wsdlUrl . "\n";

    // Test d'accès au WSDL
    $wsdlContent = @file_get_contents($wsdlUrl);
    if ($wsdlContent === false) {
        throw new Exception("Impossible d'accéder au WSDL. Erreur: " . error_get_last()['message']);
    }
    echo "WSDL accessible\n";

    // Options pour le service SOAP
    $options = [
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        'connection_timeout' => 30,
        'stream_context' => stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ])
    ];

    // Test de création du client SOAP
    $client = new SoapClient($wsdlUrl, $options);
    echo "Client SOAP créé\n";

    // Test des fonctions disponibles
    $functions = $client->__getFunctions();
    echo "Fonctions disponibles:\n";
    print_r($functions);

} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
