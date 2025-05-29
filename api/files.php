<?php
// Pas d'espace avant cette ligne
// Activer le rapport d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);

// En-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Paramètres
$ins = isset($_GET['ins']) ? $_GET['ins'] : '';
$file = isset($_GET['file']) ? $_GET['file'] : '';
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline';

// Validation
if (empty($ins) || empty($file)) {
    header('HTTP/1.1 400 Bad Request');
    exit('Paramètres manquants');
}

// Sécurité
$ins = preg_replace('/[^A-Z0-9]/i', '', $ins);
$file = basename($file);

// Chemin du fichier
$filePath = __DIR__ . '/files/' . $ins . '/' . $file;

// Vérifier l'existence du fichier
if (!file_exists($filePath)) {
    header('HTTP/1.1 404 Not Found');
    exit('Fichier non trouvé: ' . $filePath);
}

// Déterminer le type MIME
$extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt' => 'text/plain',
    'csv' => 'text/csv',
];
$contentType = isset($mimeTypes[$extension]) ? $mimeTypes[$extension] : 'application/octet-stream';

// Taille du fichier
$fileSize = filesize($filePath);

// Suppression de tous les tampons de sortie
while (ob_get_level()) {
    ob_end_clean();
}

// En-têtes de réponse
header('Content-Type: ' . $contentType);
header('Content-Length: ' . $fileSize);
header('Content-Disposition: ' . ($mode === 'inline' ? 'inline' : 'attachment') . '; filename="' . $file . '"');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Désactiver la compression
if (function_exists('apache_setenv')) {
    apache_setenv('no-gzip', '1');
}
ini_set('zlib.output_compression', 'Off');

// Ouverture et lecture du fichier en binaire
$handle = fopen($filePath, 'rb');
if (!$handle) {
    header('HTTP/1.1 500 Internal Server Error');
    exit("Impossible d'ouvrir le fichier");
}

// Lecture par morceaux pour éviter les problèmes de mémoire
while (!feof($handle)) {
    echo fread($handle, 8192); // Lire par blocs de 8 Ko
    flush(); // Envoyer immédiatement au navigateur
}

fclose($handle);
exit;
?>