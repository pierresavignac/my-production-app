<?php
// Script simplifié pour servir directement les images locales
ini_set('display_errors', 1);
error_reporting(E_ALL);

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

// Paramètres
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['file']) ? $_GET['file'] : null;
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline';

if (!$installationNumber || !$fileName) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Numéro d'installation et nom de fichier requis";
    exit;
}

// Sécurité: empêcher la traversée de répertoire
$fileName = basename($fileName);
$installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);

// Chemin du fichier
$filePath = __DIR__ . '/files/' . $installationNumber . '/' . $fileName;

// Vérifier que le fichier existe
if (!file_exists($filePath)) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Fichier introuvable";
    error_log("Fichier introuvable: $filePath");
    exit;
}

// Obtenir l'extension et définir le type MIME
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
switch ($fileExtension) {
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
    case 'pdf':
        $contentType = 'application/pdf';
        break;
    default:
        $contentType = 'application/octet-stream';
}

// Lire le fichier
$fileContent = file_get_contents($filePath);
if ($fileContent === false) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Impossible de lire le fichier";
    error_log("Impossible de lire le fichier: $filePath");
    exit;
}

// Définir les en-têtes HTTP
header('Content-Type: ' . $contentType);
header('Content-Length: ' . filesize($filePath));

if ($mode === 'inline') {
    header('Content-Disposition: inline; filename="' . $fileName . '"');
} else {
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
}

// Désactiver toute mise en cache
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: ' . gmdate('D, d M Y H:i:s', time() - 1) . ' GMT');

// Servir le fichier
echo $fileContent;
?>