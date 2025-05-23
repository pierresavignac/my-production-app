<?php
// Script pour traiter les fichiers binaires problématiques et les copier dans le dossier public
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Paramètres
$sourceFile = isset($_GET['source']) ? $_GET['source'] : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['file']) ? $_GET['file'] : null;
$fileId = isset($_GET['id']) ? $_GET['id'] : null;

// Validation des paramètres
if ((!$sourceFile && (!$installationNumber || !$fileName)) && !$fileId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
    exit;
}

// Fonction pour nettoyer les chemins
function sanitizePath($path) {
    $path = str_replace(['../', '..\\'], '', $path);
    return $path;
}

// Déterminer le chemin source
$sourceFilePath = null;
$rawFilePath = null;

if ($sourceFile) {
    $sourceFile = sanitizePath($sourceFile);
    $sourceFilePath = __DIR__ . '/' . $sourceFile;
    $fileName = basename($sourceFile);
} 
elseif ($installationNumber && $fileName) {
    $installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);
    $fileName = sanitizePath($fileName);
    $sourceFilePath = __DIR__ . '/files/' . $installationNumber . '/' . $fileName;
    $rawFilePath = $sourceFilePath . '.raw';
}
elseif ($fileId && $installationNumber) {
    // Rechercher tous les fichiers correspondant à cet ID dans le dossier de l'installation
    $directory = __DIR__ . '/files/' . $installationNumber . '/';
    if (is_dir($directory)) {
        $files = scandir($directory);
        foreach ($files as $file) {
            if (strpos($file, $fileId . '_') === 0 || $file === $fileId) {
                $sourceFilePath = $directory . $file;
                $fileName = $file;
                break;
            }
        }
    }
    
    if (!$sourceFilePath) {
        // Si on n'a pas trouvé, on peut essayer de charger depuis l'API
        // Cette partie pourrait être implémentée pour charger depuis ProgressionLive
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Fichier non trouvé pour cet ID']);
        exit;
    }
}

// Vérifier si le fichier source existe
if (!file_exists($sourceFilePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Fichier source introuvable: ' . $sourceFilePath]);
    exit;
}

// Vérifier si un fichier .raw existe
if (!$rawFilePath) {
    $rawFilePath = $sourceFilePath . '.raw';
}
$hasRawFile = file_exists($rawFilePath);

// Lecture du fichier source
$fileContent = file_get_contents($sourceFilePath);
if ($fileContent === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Impossible de lire le fichier source']);
    exit;
}

// Vérifier si le contenu semble être encodé en base64
$isBase64 = preg_match('/^[A-Za-z0-9+\/=]+$/', trim($fileContent)) === 1;

// Lire le fichier raw si disponible
$rawContent = null;
if ($hasRawFile) {
    $rawContent = file_get_contents($rawFilePath);
}

// Fonctions de décodage
function tryDecodeBase64($data) {
    // Tentative 1: Décodage standard
    $decoded = base64_decode($data, true);
    if ($decoded !== false) {
        return ['success' => true, 'data' => $decoded, 'method' => 'standard'];
    }
    
    // Tentative 2: Nettoyage puis décodage
    $cleaned = preg_replace('/[^A-Za-z0-9+\/=]/', '', $data);
    $decoded = base64_decode($cleaned, true);
    if ($decoded !== false) {
        return ['success' => true, 'data' => $decoded, 'method' => 'cleaned'];
    }
    
    // Tentative 3: Forcer le décodage (moins sûr)
    $decoded = base64_decode($data, false);
    if ($decoded !== false) {
        return ['success' => true, 'data' => $decoded, 'method' => 'forced'];
    }
    
    return ['success' => false];
}

// Tentatives de décodage
$decodedData = null;
$decodingMethod = '';
$log = [];

// Si le fichier semble être encodé en base64
if ($isBase64) {
    $log[] = "Tentative de décodage base64...";
    $result = tryDecodeBase64($fileContent);
    if ($result['success']) {
        $decodedData = $result['data'];
        $decodingMethod = $result['method'];
        $log[] = "Décodage base64 réussi (méthode: {$decodingMethod}). Taille: " . strlen($decodedData) . " octets";
    } else {
        $log[] = "Échec de toutes les tentatives de décodage base64.";
    }
}

// Si nous avons un fichier .raw, essayer aussi
if ($rawContent !== null && ($decodedData === null || strlen($decodedData) < 1000)) {
    $log[] = "Tentative de décodage du fichier .raw...";
    $result = tryDecodeBase64($rawContent);
    if ($result['success']) {
        $decodedData = $result['data'];
        $decodingMethod = $result['method'] . ' (depuis .raw)';
        $log[] = "Décodage base64 du fichier .raw réussi (méthode: {$result['method']}). Taille: " . strlen($decodedData) . " octets";
    } else {
        $log[] = "Échec de toutes les tentatives de décodage du fichier .raw.";
    }
}

// Si aucun décodage n'a fonctionné et que le fichier ne semble pas être en base64
if ($decodedData === null && !$isBase64) {
    $log[] = "Le fichier ne semble pas être encodé en base64, utilisation directe du contenu.";
    $decodedData = $fileContent;
    $decodingMethod = 'direct';
}

// Si nous avons des données décodées
if ($decodedData !== null) {
    // Détection du type MIME
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($decodedData);
    $log[] = "Type MIME détecté: " . $detectedMime;
    
    // Vérification des signatures de fichiers courants
    $signatures = [
        'JPEG' => [
            'sig' => "\xFF\xD8\xFF",
            'offset' => 0,
            'mime' => 'image/jpeg'
        ],
        'PNG' => [
            'sig' => "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A",
            'offset' => 0,
            'mime' => 'image/png'
        ],
        'GIF' => [
            'sig' => "GIF8",
            'offset' => 0,
            'mime' => 'image/gif'
        ],
        'PDF' => [
            'sig' => "%PDF-",
            'offset' => 0,
            'mime' => 'application/pdf'
        ]
    ];
    
    $detectedFormat = null;
    foreach ($signatures as $format => $sig) {
        if (strpos($decodedData, $sig['sig']) === $sig['offset']) {
            $detectedFormat = $format;
            $log[] = "Format détecté: {$format}";
            // Si le MIME type n'est pas conforme à la signature, corriger
            if ($detectedMime != $sig['mime']) {
                $log[] = "Correction du type MIME: {$detectedMime} -> {$sig['mime']}";
                $detectedMime = $sig['mime'];
            }
            break;
        }
    }
    
    if ($detectedFormat === null) {
        $log[] = "Aucune signature de fichier connue détectée.";
    }
    
    // Générer un nom de fichier unique
    $timestamp = time();
    $uniquePrefix = "binary_{$timestamp}_";
    $outputFileName = $uniquePrefix . basename($fileName);
    $publicDir = __DIR__ . '/../public/temp/';
    $outputFilePath = $publicDir . $outputFileName;
    
    // S'assurer que le répertoire de sortie existe
    if (!file_exists($publicDir)) {
        if (!mkdir($publicDir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Impossible de créer le répertoire de sortie', 'log' => $log]);
            exit;
        }
    }
    
    // Écriture du fichier décodé
    if (file_put_contents($outputFilePath, $decodedData) !== false) {
        $log[] = "Décodage réussi! " . strlen($decodedData) . " octets écrits dans: " . $outputFilePath;
        
        // URL pour accéder au fichier
        $baseUrl = isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ? 'https' : 'http';
        $baseUrl .= '://' . $_SERVER['HTTP_HOST'];
        $fileUrl = $baseUrl . '/temp/' . $outputFileName;
        
        // Réponse JSON avec informations complètes
        echo json_encode([
            'success' => true,
            'log' => $log,
            'file' => [
                'name' => $outputFileName,
                'originalName' => $fileName,
                'path' => $outputFilePath,
                'url' => $fileUrl,
                'size' => strlen($decodedData),
                'mime' => $detectedMime,
                'format' => $detectedFormat,
                'decodingMethod' => $decodingMethod
            ],
            'viewerUrl' => $baseUrl . '/file-proxy-viewer.html?file=' . urlencode($outputFileName) . '&ins=temp'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Impossible d\'écrire le fichier de sortie', 'log' => $log]);
    }
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Aucune donnée à écrire. Toutes les méthodes de décodage ont échoué.', 'log' => $log]);
}
?>