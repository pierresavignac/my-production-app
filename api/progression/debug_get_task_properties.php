<?php
// api/progression/debug_get_properties.php (Renommé implicitement par l'usage)
ini_set('display_errors', 1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

ini_set('memory_limit', '256M');
set_time_limit(120);

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html><html><head><title>Debug Progression Properties</title></head><body>";
// Titre modifié
echo "<h1>Propriétés Brutes d'une Soumission (ou Tâche) ProgressionLive</h1>";

require_once __DIR__ . '/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/ProgressionWebServiceV2/Utils.php';
require_once __DIR__ . '/ProgressionService.php';

use ProgressionWebService\ArrayOfProperty;
use ProgressionWebService\Property;
use ProgressionWebService\RecordType; // Garder pour référence
use ProgressionWebService\SearchRecordsRequest;

// --- Configuration ---
// Message modifié pour accepter SOU ou INS
$recordCode = $_GET['code'] ?? null; 
// -------------------

if (empty($recordCode)) {
    // Message d'erreur modifié
    echo "<p style='color: red;'>Erreur : Veuillez spécifier un code (SOU ou INS) dans l'URL en ajoutant <strong>?code=VOTRE_CODE</strong></p>";
    echo "</body></html>";
    exit;
}

// Message modifié
echo "<p>Recherche des propriétés pour l'enregistrement : <strong>" . htmlspecialchars($recordCode) . "</strong></p>";

try {
    $progressionService = new ProgressionService();
    if (!$progressionService->connect()) {
         throw new Exception("Impossible de se connecter au service ProgressionLive.");
    }
    echo "<p style='color: green;'>Connecté à ProgressionLive avec succès.</p>";

    $config = require 'config.php';
    $credentials = $progressionService->getCredentials();
    if (!$credentials) {
         throw new Exception("Les credentials n'ont pas pu être récupérés après la connexion.");
    }

    $searchRequest = new SearchRecordsRequest();
    $searchRequest->setCredentials($credentials);
    // Utiliser RecordType::TASK comme stratégie
    $searchRequest->setRecordType(RecordType::TASK); 
    $searchRequest->setQuery('code = :code');

    $property = new Property();
    $property->setName('code');
    // Utiliser $recordCode
    $property->setValue(new SoapVar($recordCode, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema'));

    $properties = new ArrayOfProperty();
    $properties->setProperty([$property]);
    $searchRequest->setParameters($properties);

    // Message modifié
    echo "<p>Exécution de la recherche de l'enregistrement...</p>";
    $service = $progressionService->getSoapService();
    if (!$service) {
         throw new Exception("Le service SOAP n'a pas pu être récupéré.");
    }
    $response = $service->SearchRecords($searchRequest);
    echo "<p style='color: green;'>Recherche terminée.</p>";

    if (!$response || !$response->getRecords() || !$response->getRecords()->getRecord()) {
        // Message modifié
        echo "<p style='color: orange;'>Aucun enregistrement trouvé pour le code : " . htmlspecialchars($recordCode) . "</p>";
    } else {
        // Utiliser $record au lieu de $task
        $record = $response->getRecords()->getRecord()[0]; 

        // Message modifié
        echo "<h2>Données complètes trouvées pour l'enregistrement " . htmlspecialchars($record->getCode() ?? $recordCode) . ":</h2>";
        // Utiliser print_r pour afficher toute la structure de l'objet
        echo "<pre style='background-color: #f0f0f0; border: 1px solid #ccc; padding: 10px; white-space: pre-wrap; word-wrap: break-word;'>";
        print_r($record);
        echo "</pre>";
    }

} catch (SoapFault $sf) {
    echo "<h2 style='color: red;'>Erreur SOAP</h2>";
    echo "<p><strong>Message:</strong> " . htmlspecialchars($sf->getMessage()) . "</p>";
    if (isset($service)) {
     echo "<h3>Requête SOAP :</h3><pre>" . htmlspecialchars($service->__getLastRequestHeaders()) . "\n" . htmlspecialchars($service->__getLastRequest()) . "</pre>";
     echo "<h3>Réponse SOAP :</h3><pre>" . htmlspecialchars($service->__getLastResponseHeaders()) . "\n" . htmlspecialchars($service->__getLastResponse()) . "</pre>";
    }

} catch (Exception $e) {
    echo "<h2 style='color: red;'>Erreur Générale</h2>";
    echo "<p><strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Fichier:</strong> " . htmlspecialchars($e->getFile()) . " (Ligne: " . $e->getLine() . ")</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "</body></html>";

?> 