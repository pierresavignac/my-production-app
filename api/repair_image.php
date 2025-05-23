<?php
// Script pour réparer les images problématiques
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Paramètres
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['file']) ? $_GET['file'] : null;
$format = isset($_GET['format']) ? strtolower($_GET['format']) : 'jpg';
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline';

// Validation des paramètres
if (!$installationNumber || !$fileName) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Numéro d'installation et nom de fichier requis";
    exit;
}

// Nettoyer les paramètres
$installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);
$fileName = basename($fileName);

// Chemins des fichiers
$sourcePath = __DIR__ . '/files/' . $installationNumber . '/' . $fileName;
$rawPath = $sourcePath . '.raw';

// Vérifier si les fichiers existent
if (!file_exists($sourcePath) && !file_exists($rawPath)) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Fichiers source introuvables";
    exit;
}

// Fonction pour essayer de décoder le contenu Base64
function tryDecodeBase64($data) {
    // Tentative 1: Décodage standard
    $decoded = base64_decode($data, true);
    if ($decoded !== false) {
        return $decoded;
    }
    
    // Tentative 2: Nettoyage puis décodage
    $cleaned = preg_replace('/[^A-Za-z0-9+\/=]/', '', $data);
    $decoded = base64_decode($cleaned, true);
    if ($decoded !== false) {
        return $decoded;
    }
    
    // Tentative 3: Forcer le décodage (moins sûr)
    return base64_decode($data, false);
}

// Fonction pour réparer une image avec GD
function repairImage($imageData, $format = 'jpg') {
    // Créer une image à partir des données
    $image = imagecreatefromstring($imageData);
    
    if ($image === false) {
        return false;
    }
    
    // Créer un nouveau tampon pour l'image réparée
    ob_start();
    
    // Enregistrer l'image dans le format spécifié
    $success = false;
    switch ($format) {
        case 'jpg':
        case 'jpeg':
            $success = imagejpeg($image, null, 90);
            break;
        case 'png':
            $success = imagepng($image, null, 9);
            break;
        case 'gif':
            $success = imagegif($image);
            break;
        case 'webp':
            $success = imagewebp($image, null, 80);
            break;
        default:
            $success = imagejpeg($image, null, 90);
    }
    
    // Si l'enregistrement a réussi, récupérer les données
    if ($success) {
        $repairedData = ob_get_contents();
        ob_end_clean();
        imagedestroy($image);
        return $repairedData;
    }
    
    // Nettoyage et retour en cas d'échec
    ob_end_clean();
    imagedestroy($image);
    return false;
}

// Contenu de l'image à réparer
$imageData = null;

// Essayer d'abord le fichier source
if (file_exists($sourcePath)) {
    $content = file_get_contents($sourcePath);
    
    // Vérifier si le contenu semble être du Base64
    if (preg_match('/^[A-Za-z0-9+\/=]+$/', trim($content))) {
        $decoded = tryDecodeBase64($content);
        if ($decoded !== false) {
            $imageData = $decoded;
        }
    } else {
        // Si ce n'est pas du Base64, utiliser directement
        $imageData = $content;
    }
}

// Si on n'a pas encore d'image valide, essayer le fichier .raw
if (($imageData === null || strlen($imageData) < 100) && file_exists($rawPath)) {
    $content = file_get_contents($rawPath);
    $decoded = tryDecodeBase64($content);
    if ($decoded !== false) {
        $imageData = $decoded;
    }
}

// Si on a toujours pas de données d'image
if ($imageData === null) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Impossible d'extraire les données d'image valides";
    exit;
}

// Essayer de réparer l'image
$repairedImage = repairImage($imageData, $format);

if ($repairedImage === false) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Erreur: Impossible de réparer l'image";
    exit;
}

// Déterminer le type MIME
switch ($format) {
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
    case 'webp':
        $contentType = 'image/webp';
        break;
    default:
        $contentType = 'image/jpeg';
}

// Configurer les en-têtes pour l'affichage ou le téléchargement
header('Content-Type: ' . $contentType);
header('Content-Length: ' . strlen($repairedImage));

if ($mode === 'inline') {
    header('Content-Disposition: inline; filename="repaired_' . $fileName . '"');
} else {
    header('Content-Disposition: attachment; filename="repaired_' . $fileName . '"');
}

// Désactiver le cache
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

// Servir l'image réparée
echo $repairedImage;

// Sauvegarder l'image réparée dans un dossier temporaire pour utilisation future
try {
    $tempDir = __DIR__ . '/../public/temp/';
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0755, true);
    }
    
    $repairFileName = 'repaired_' . time() . '_' . $fileName;
    $repairPath = $tempDir . $repairFileName;
    
    file_put_contents($repairPath, $repairedImage);
} catch (Exception $e) {
    // Ne pas interrompre la réponse si la sauvegarde échoue
    error_log('Erreur lors de la sauvegarde de l\'image réparée: ' . $e->getMessage());
}
?>