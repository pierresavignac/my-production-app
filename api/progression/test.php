<?php
// test.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'ProgressionService.php';

echo "<pre>\n";
echo "=== Test de connexion ProgressionLive ===\n\n";

// Vérification du dossier logs
$logsDir = __DIR__ . '/logs';
if (!file_exists($logsDir)) {
    echo "Création du dossier logs...\n";
    if (!mkdir($logsDir, 0777, true)) {
        echo "❌ ERREUR: Impossible de créer le dossier logs\n";
        die();
    }
}

// Vérification des permissions
if (!is_writable($logsDir)) {
    echo "❌ ERREUR: Le dossier logs n'est pas accessible en écriture\n";
    die();
}

// Test du fichier de log
$logFile = $logsDir . '/progression.log';
echo "Test d'écriture dans le fichier de log...\n";
if (!file_put_contents($logFile, date('Y-m-d H:i:s') . " Test d'écriture\n", FILE_APPEND)) {
    echo "❌ ERREUR: Impossible d'écrire dans le fichier de log\n";
    die();
}

// Vérification de la configuration
echo "Vérification de la configuration...\n";
if (!file_exists(__DIR__ . '/config.php')) {
    echo "❌ ERREUR: Fichier config.php manquant\n";
    die();
}

// Vérification des fichiers ProgressionWebServiceV2
echo "Vérification des fichiers ProgressionWebServiceV2...\n";
if (!file_exists(__DIR__ . '/ProgressionWebServiceV2/autoload.php')) {
    echo "❌ ERREUR: Dossier ProgressionWebServiceV2 manquant ou incomplet\n";
    die();
}

try {
    echo "Création du service...\n";
    $service = new ProgressionService();
    
    echo "Test de connexion...\n";
    $service->connect();
    
    echo "✅ Connexion réussie!\n\n";
    
    echo "Test de récupération d'une tâche...\n";
    $taskData = $service->getTaskByCode('INS010310');
    echo "✅ Données reçues:\n";
    print_r($taskData);

} catch (Exception $e) {
    echo "\n❌ ERREUR: " . $e->getMessage() . "\n";
    echo "\nStacktrace:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== Contenu du fichier log ===\n";
if (file_exists($logFile)) {
    echo file_get_contents($logFile);
} else {
    echo "Aucun fichier log trouvé\n";
}

echo "</pre>";