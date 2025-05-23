<?php
// Outil de décodage avancé pour les fichiers binaires problématiques
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Paramètres
$sourceFile = isset($_GET['source']) ? $_GET['source'] : null;
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['file']) ? $_GET['file'] : null;
$output = isset($_GET['output']) ? $_GET['output'] : 'browser'; // 'browser' ou 'file'

header('Content-Type: text/html; charset=UTF-8');
echo "<html><head><title>Décodeur de fichiers binaires</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .info { color: blue; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
    .container { max-width: 800px; margin: 0 auto; }
    .button { 
        display: inline-block; 
        padding: 10px 15px; 
        background: #007bff; 
        color: white; 
        text-decoration: none; 
        border-radius: 5px; 
        margin: 10px 0;
    }
</style>";
echo "</head><body><div class='container'>";
echo "<h1>Décodeur de fichiers binaires avancé</h1>";

// Fonction pour nettoyer les chemins et prévenir les injections
function sanitizePath($path) {
    // Supprimer tout caractère qui pourrait permettre une traversée de répertoire
    $path = str_replace(['../', '..\\'], '', $path);
    return $path;
}

// Si nous avons un fichier source spécifié directement
if ($sourceFile) {
    $sourceFile = sanitizePath($sourceFile);
    $sourceFilePath = __DIR__ . '/' . $sourceFile;
    $fileName = basename($sourceFile);
} 
// Sinon, utiliser le numéro d'installation et le nom de fichier
elseif ($installationNumber && $fileName) {
    $installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);
    $fileName = sanitizePath($fileName);
    $sourceFilePath = __DIR__ . '/files/' . $installationNumber . '/' . $fileName;
} else {
    echo "<p class='error'>Erreur: Paramètres manquants. Vous devez spécifier soit 'source', soit 'ins' et 'file'.</p>";
    echo "</div></body></html>";
    exit;
}

// Vérifier si le fichier source existe
if (!file_exists($sourceFilePath)) {
    echo "<p class='error'>Erreur: Le fichier source n'existe pas: " . htmlspecialchars($sourceFilePath) . "</p>";
    echo "</div></body></html>";
    exit;
}

// Vérifier si un fichier .raw existe à côté
$rawFilePath = $sourceFilePath . '.raw';
$hasRawFile = file_exists($rawFilePath);

echo "<p>Source: " . htmlspecialchars($sourceFilePath) . "</p>";
if ($hasRawFile) {
    echo "<p class='info'>Fichier .raw trouvé: " . htmlspecialchars($rawFilePath) . "</p>";
}

// Lecture du fichier source
$fileContent = file_get_contents($sourceFilePath);
if ($fileContent === false) {
    echo "<p class='error'>Erreur: Impossible de lire le fichier source.</p>";
    echo "</div></body></html>";
    exit;
}

$fileSize = strlen($fileContent);
echo "<p>Taille du fichier source: " . number_format($fileSize) . " octets</p>";

// Vérifier si le contenu semble être encodé en base64
$isBase64 = preg_match('/^[A-Za-z0-9+\/=]+$/', trim($fileContent)) === 1;
echo "<p>Détection base64: " . ($isBase64 ? "<span class='success'>OUI</span>" : "<span class='info'>NON</span>") . "</p>";

// Si un fichier .raw existe, essayer de l'utiliser aussi
$rawContent = null;
if ($hasRawFile) {
    $rawContent = file_get_contents($rawFilePath);
    if ($rawContent !== false) {
        echo "<p>Taille du fichier .raw: " . number_format(strlen($rawContent)) . " octets</p>";
    } else {
        echo "<p class='error'>Erreur: Impossible de lire le fichier .raw.</p>";
    }
}

// Générer le nom du fichier de sortie
$timestamp = time();
$outputFileName = "decoded_{$timestamp}_" . basename($fileName);
$publicDir = __DIR__ . '/../public/temp/';
$outputFilePath = $publicDir . $outputFileName;

// S'assurer que le répertoire de sortie existe
if (!file_exists($publicDir)) {
    if (!mkdir($publicDir, 0755, true)) {
        echo "<p class='error'>Erreur: Impossible de créer le répertoire de sortie.</p>";
        echo "</div></body></html>";
        exit;
    }
}

// Fonctions de décodage avancées
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

// Si le fichier semble être encodé en base64
if ($isBase64) {
    echo "<p>Tentative de décodage base64...</p>";
    $result = tryDecodeBase64($fileContent);
    if ($result['success']) {
        $decodedData = $result['data'];
        $decodingMethod = $result['method'];
        echo "<p class='success'>Décodage base64 réussi (méthode: {$decodingMethod}). Taille: " . number_format(strlen($decodedData)) . " octets</p>";
    } else {
        echo "<p class='error'>Échec de toutes les tentatives de décodage base64.</p>";
    }
}

// Si nous avons un fichier .raw, essayer aussi
if ($rawContent !== null && ($decodedData === null || strlen($decodedData) < 1000)) {
    echo "<p>Tentative de décodage du fichier .raw...</p>";
    $result = tryDecodeBase64($rawContent);
    if ($result['success']) {
        $decodedData = $result['data'];
        $decodingMethod = $result['method'] . ' (depuis .raw)';
        echo "<p class='success'>Décodage base64 du fichier .raw réussi (méthode: {$result['method']}). Taille: " . number_format(strlen($decodedData)) . " octets</p>";
    } else {
        echo "<p class='error'>Échec de toutes les tentatives de décodage du fichier .raw.</p>";
    }
}

// Si aucun décodage n'a fonctionné et que le fichier ne semble pas être en base64
if ($decodedData === null && !$isBase64) {
    echo "<p class='info'>Le fichier ne semble pas être encodé en base64, utilisation directe du contenu.</p>";
    $decodedData = $fileContent;
    $decodingMethod = 'direct';
}

// Si nous avons des données décodées
if ($decodedData !== null) {
    // Détection du type MIME
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($decodedData);
    echo "<p>Type MIME détecté: " . htmlspecialchars($detectedMime) . "</p>";
    
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
    
    $detectedFormat = "Format inconnu";
    foreach ($signatures as $format => $sig) {
        if (strpos($decodedData, $sig['sig']) === $sig['offset']) {
            $detectedFormat = $format;
            echo "<p class='success'>Format détecté: {$format}</p>";
            // Si le MIME type n'est pas conforme à la signature, corriger
            if ($detectedMime != $sig['mime']) {
                echo "<p class='info'>Correction du type MIME: {$detectedMime} -> {$sig['mime']}</p>";
                $detectedMime = $sig['mime'];
            }
            break;
        }
    }
    
    if ($detectedFormat === "Format inconnu") {
        echo "<p class='error'>Aucune signature de fichier connue détectée.</p>";
    }
    
    // Écriture du fichier décodé
    if (file_put_contents($outputFilePath, $decodedData) !== false) {
        echo "<p class='success'>Décodage réussi! " . number_format(strlen($decodedData)) . " octets écrits dans: " . htmlspecialchars($outputFilePath) . "</p>";
        
        // URL pour accéder au fichier
        $baseUrl = isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ? 'https' : 'http';
        $baseUrl .= '://' . $_SERVER['HTTP_HOST'];
        $fileUrl = $baseUrl . '/temp/' . $outputFileName;
        
        echo "<p>URL d'accès: <a href='{$fileUrl}' target='_blank'>" . htmlspecialchars($fileUrl) . "</a></p>";
        
        // Si l'option de sortie est 'browser', rediriger
        if ($output === 'browser') {
            echo "<p>Ouverture du fichier dans une nouvelle fenêtre...</p>";
            echo "<script>window.open('{$fileUrl}', '_blank');</script>";
        }
        
        // Fournir un iframe pour prévisualiser le fichier
        echo "<div style='margin: 20px 0;'>";
        echo "<h3>Prévisualisation:</h3>";
        if (strpos($detectedMime, 'image/') === 0) {
            echo "<img src='{$fileUrl}' style='max-width: 100%; max-height: 500px; border: 1px solid #ddd;' />";
        } elseif ($detectedMime === 'application/pdf') {
            echo "<iframe src='{$fileUrl}' style='width: 100%; height: 500px; border: 1px solid #ddd;'></iframe>";
        } else {
            echo "<p>Pas de prévisualisation disponible pour ce type de fichier.</p>";
        }
        echo "</div>";
        
        // Ajouter un lien direct pour télécharger
        echo "<p><a href='{$fileUrl}' download class='button'>Télécharger le fichier décodé</a></p>";
        
        // Ajouter un lien pour ouvrir le fichier dans notre visualiseur
        $viewerUrl = $baseUrl . '/file-proxy-viewer.html?file=' . urlencode($outputFileName) . '&ins=temp';
        echo "<p><a href='{$viewerUrl}' target='_blank' class='button'>Ouvrir dans le visualiseur</a></p>";
    } else {
        echo "<p class='error'>Erreur: Impossible d'écrire le fichier de sortie.</p>";
    }
} else {
    echo "<p class='error'>Aucune donnée à écrire. Toutes les méthodes de décodage ont échoué.</p>";
}

echo "</div></body></html>";
?>