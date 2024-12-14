<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuration du fuseau horaire
date_default_timezone_set('America/Montreal');

// Headers pour l'affichage HTML
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\Credentials;
use ProgressionWebService\SearchRecordsRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\ArrayOfProperty;
use ProgressionWebService\Property;
use ProgressionWebService\RecordType;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\Utils;

// Code d'installation de test
$testCode = isset($_GET['code']) ? $_GET['code'] : 'INS010310';

echo "<h1>Test de connexion ProgressionLive</h1>";
echo "<pre>";

try {
    echo " Initialisation du test...\n";
    
    // Configuration
    $config = [
        'company_domain' => 'garychartrand',
        'username' => 'pierre@garychartrand.com',
        'password' => 'A11gdb333!'
    ];

    echo " Configuration chargée\n";

    // Créer les credentials
    $credentials = new Credentials(
        null, // SessionID
        'TEST_DEVICE', // DeviceID
        '1.0', // ClientVersion
        $config['username'],
        $config['password']
    );

    echo " Credentials créés\n";

    // Configurer le client SOAP
    $soapOptions = [
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'connection_timeout' => 10,
        'default_socket_timeout' => 10,
        'stream_context' => stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ],
            'http' => [
                'timeout' => 10,
                'user_agent' => 'PHP SOAP Client'
            ]
        ])
    ];

    echo " Création du client SOAP...\n";

    // Créer le client SOAP
    $serverUrl = 'https://' . $config['company_domain'] . '.progressionlive.com';
    $serviceUrl = $serverUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    echo " Tentative de connexion à : $wsdlUrl\n";
    
    // Test d'accès au WSDL
    $ctx = stream_context_create(['ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true
    ]]);
    
    echo " Vérification de l'accès au WSDL...\n";
    $wsdlContent = @file_get_contents($wsdlUrl, false, $ctx);
    
    if ($wsdlContent === false) {
        throw new Exception("Impossible d'accéder au WSDL. Erreur : " . error_get_last()['message']);
    }
    
    echo " WSDL accessible\n";
    
    // Créer le client SOAP avec le WSDL vérifié
    $client = new ProgressionPortType($soapOptions, $wsdlUrl);
    $client->__setLocation($serviceUrl);
    
    echo " Client SOAP créé\n";

    // Effectuer le login
    echo " Tentative de connexion...\n";
    $loginResponse = $client->Login(new LoginRequest($credentials));
    $credentials = $loginResponse->getCredentials();
    echo " Connexion réussie\n";

    // Créer la requête de recherche
    $searchRequest = new SearchRecordsRequest();
    $searchRequest->setCredentials($credentials);  // Utiliser les credentials de la session
    $searchRequest->setRecordType(RecordType::TASK);
    
    // Configurer les propriétés de recherche
    $properties = new ArrayOfProperty();
    $codeProperty = new Property();
    $codeProperty->name = 'Code';
    $codeProperty->value = $testCode;
    $properties->setProperty([$codeProperty]);
    $searchRequest->setParameters($properties);

    echo " Requête de recherche créée\n";
    echo " Recherche de la tâche $testCode...\n";

    // Effectuer la recherche
    $searchResponse = $client->SearchRecords($searchRequest);

    echo " Réponse reçue du serveur\n";
    
    if (!$searchResponse->SearchRecordsResult->records || count($searchResponse->SearchRecordsResult->records->Record) === 0) {
        echo " Aucune tâche trouvée avec le code $testCode\n";
    } else {
        echo " Tâche trouvée!\n\n";
        
        // Récupérer la première tâche trouvée
        $task = $searchResponse->SearchRecordsResult->records->Record[0];
        
        echo "Détails de la tâche:\n";
        echo "==================\n";
        
        // Extraire les informations de la tâche
        $taskData = Utils::extractTaskData($task);
        
        // Afficher les informations
        echo "Nom du client: " . $taskData['customer']['name'] . "\n";
        echo "Téléphone: " . $taskData['customer']['phoneNumber'] . "\n";
        echo "Adresse: " . $taskData['customer']['address']['street'] . "\n";
        echo "Ville: " . $taskData['customer']['address']['city'] . "\n";
        echo "Description: " . $taskData['description'] . "\n";
        if (isset($taskData['summary'])) {
            echo "Résumé: " . $taskData['summary'] . "\n";
        }
        if (isset($taskData['amount'])) {
            echo "Montant: " . $taskData['amount'] . "\n";
        }
    }

    echo "\n Test terminé avec succès\n";

} catch (Exception $e) {
    echo " ERREUR: " . $e->getMessage() . "\n";
    echo "\nTrace de l'erreur:\n";
    echo $e->getTraceAsString() . "\n";
    
    if (isset($client)) {
        echo "\nDernière requête SOAP:\n";
        var_dump($client->__getLastRequest());
        echo "\nDernière réponse SOAP:\n";
        var_dump($client->__getLastResponse());
    }
}

echo "</pre>";

// Ajouter un formulaire pour tester d'autres codes
echo '<form method="GET">
    <p>
        <label>Tester un autre code d\'installation:</label><br>
        <input type="text" name="code" value="' . htmlspecialchars($testCode) . '" placeholder="INS######">
        <input type="submit" value="Tester">
    </p>
</form>';
