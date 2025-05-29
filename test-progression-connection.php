<?php
// test-progression-connection.php
// Script de test pour vérifier la connexion à ProgressionLive

header('Content-Type: text/html; charset=utf-8');

// Configuration actuelle
$config = require __DIR__ . '/api/progression/config.php';

echo "<!DOCTYPE html>
<html>
<head>
    <title>Test Connexion ProgressionLive</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        .config { background: #f0f0f0; padding: 10px; margin: 10px 0; }
        pre { background: #f8f8f8; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test de connexion ProgressionLive</h1>";

echo "<h2>Configuration actuelle :</h2>";
echo "<div class='config'>";
echo "<p><strong>Domaine :</strong> " . htmlspecialchars($config['company']['domain']) . "</p>";
echo "<p><strong>URL :</strong> " . htmlspecialchars($config['company']['url']) . "</p>";
echo "<p><strong>Utilisateur :</strong> " . htmlspecialchars($config['auth']['username']) . "</p>";
echo "<p><strong>Mot de passe :</strong> " . str_repeat('*', strlen($config['auth']['password'] ?? '')) . "</p>";
echo "</div>";

// Test de connexion direct
echo "<h2>Test de connexion :</h2>";

try {
    require_once __DIR__ . '/api/progression/ProgressionWebServiceV2/autoload.php';
    
    use ProgressionWebService\Credentials;
    use ProgressionWebService\LoginRequest;
    use ProgressionWebService\ProgressionPortType;
    
    $baseUrl = $config['company']['url'];
    $serviceUrl = $baseUrl . '/server/ws/v2/ProgressionWebService';
    $wsdlUrl = $serviceUrl . '?wsdl';
    
    echo "<p class='info'>URL du service : $serviceUrl</p>";
    
    // Test 1: Vérifier l'accès au WSDL
    echo "<h3>1. Test d'accès au WSDL :</h3>";
    $ch = curl_init($wsdlUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "<p class='success'>✓ WSDL accessible (HTTP $httpCode)</p>";
    } else {
        echo "<p class='error'>✗ Erreur d'accès au WSDL (HTTP $httpCode)</p>";
    }
    
    // Test 2: Connexion SOAP
    echo "<h3>2. Test de connexion SOAP :</h3>";
    
    $options = $config['soap']['options'];
    $service = new ProgressionPortType($options, $wsdlUrl);
    $service->__setLocation($serviceUrl);
    
    $credentials = new Credentials();
    $credentials->setUsername($config['auth']['username']);
    $credentials->setPassword($config['auth']['password']);
    $credentials->setDeviceId($config['auth']['device_id']);
    $credentials->setClientVersion($config['auth']['client_version']);
    
    $loginRequest = new LoginRequest($credentials);
    
    try {
        $loginResponse = $service->Login($loginRequest);
        
        if ($loginResponse && $loginResponse->getCredentials()) {
            echo "<p class='success'>✓ Connexion réussie!</p>";
            echo "<p>Session ID: " . htmlspecialchars($loginResponse->getCredentials()->getSessionId()) . "</p>";
        } else {
            echo "<p class='error'>✗ Échec de connexion - Réponse vide</p>";
        }
    } catch (SoapFault $e) {
        echo "<p class='error'>✗ Erreur SOAP : " . htmlspecialchars($e->getMessage()) . "</p>";
        if (strpos($e->getMessage(), 'Bad credentials') !== false) {
            echo "<p class='error'>Les identifiants sont incorrects. Vérifiez :</p>";
            echo "<ul>";
            echo "<li>Le nom de domaine : <strong>" . htmlspecialchars($config['company']['domain']) . "</strong></li>";
            echo "<li>L'adresse email : <strong>" . htmlspecialchars($config['auth']['username']) . "</strong></li>";
            echo "<li>Le mot de passe</li>";
            echo "</ul>";
        }
    }
    
} catch (Exception $e) {
    echo "<p class='error'>✗ Erreur : " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</body></html>";
