<?php
// Script pour réparer et convertir des images problématiques
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=UTF-8');

echo "<html><head><title>Réparateur d'images</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .info { color: blue; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
    .container { max-width: 900px; margin: 0 auto; }
    .button { 
        display: inline-block; 
        padding: 10px 15px; 
        background: #007bff; 
        color: white; 
        text-decoration: none; 
        border-radius: 5px; 
        margin: 10px 0;
    }
    .result-image {
        max-width: 100%;
        border: 1px solid #ddd;
        margin: 10px 0;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .form-group {
        margin-bottom: 15px;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    input, select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
    }
    .image-container {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin: 20px 0;
    }
    .image-box {
        flex: 1;
        min-width: 300px;
        border: 1px solid #ddd;
        padding: 10px;
        border-radius: 5px;
    }
    h2 {
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
</style>";
echo "</head><body><div class='container'>";
echo "<h1>Réparateur d'images avancé</h1>";

// Paramètres
$installationNumber = isset($_GET['ins']) ? $_GET['ins'] : null;
$fileName = isset($_GET['file']) ? $_GET['file'] : null;
$format = isset($_GET['format']) ? strtolower($_GET['format']) : 'jpg';
$action = isset($_GET['action']) ? $_GET['action'] : 'analyze';

// Formulaire pour les paramètres
echo "<form method='get' action=''>";
echo "<div class='form-group'>";
echo "<label for='ins'>Numéro d'installation:</label>";
echo "<input type='text' id='ins' name='ins' value='" . htmlspecialchars($installationNumber ?? '') . "' placeholder='Ex: INS011658' required>";
echo "</div>";
echo "<div class='form-group'>";
echo "<label for='file'>Nom du fichier:</label>";
echo "<input type='text' id='file' name='file' value='" . htmlspecialchars($fileName ?? '') . "' placeholder='Ex: EMPL_EXT.jpg' required>";
echo "</div>";
echo "<div class='form-group'>";
echo "<label for='format'>Format de sortie:</label>";
echo "<select id='format' name='format'>";
$formats = ['jpg', 'png', 'gif', 'webp'];
foreach ($formats as $f) {
    $selected = ($f === $format) ? 'selected' : '';
    echo "<option value='$f' $selected>" . strtoupper($f) . "</option>";
}
echo "</select>";
echo "</div>";
echo "<div class='form-group'>";
echo "<label for='action'>Action:</label>";
echo "<select id='action' name='action'>";
$actions = [
    'analyze' => 'Analyser seulement',
    'convert' => 'Convertir l\'image',
    'force_convert' => 'Forcer la conversion (même si pas d\'image valide)',
    'view' => 'Voir l\'image directement'
];
foreach ($actions as $key => $label) {
    $selected = ($key === $action) ? 'selected' : '';
    echo "<option value='$key' $selected>$label</option>";
}
echo "</select>";
echo "</div>";
echo "<input type='submit' value='Exécuter' class='button'>";
echo "</form>";

// Fonction pour nettoyer les chemins et prévenir les injections
function sanitizePath($path) {
    $path = str_replace(['../', '..\\'], '', $path);
    return $path;
}

// Si les paramètres nécessaires sont présents
if ($installationNumber && $fileName) {
    echo "<h2>Traitement du fichier</h2>";
    
    // Nettoyer les paramètres
    $installationNumber = preg_replace('/[^A-Za-z0-9]/', '', $installationNumber);
    $fileName = sanitizePath($fileName);
    
    // Chemins des fichiers
    $sourcePath = __DIR__ . '/files/' . $installationNumber . '/' . $fileName;
    $rawPath = $sourcePath . '.raw';
    
    echo "<p><strong>Fichier source:</strong> " . htmlspecialchars($sourcePath) . "</p>";
    
    // Vérifier si les fichiers existent
    if (!file_exists($sourcePath) && !file_exists($rawPath)) {
        echo "<p class='error'>Erreur: Fichiers source introuvables</p>";
        echo "</div></body></html>";
        exit;
    }
    
    // Fonction pour essayer de décoder le contenu Base64
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
    
    // Contenu de l'image à réparer
    $imageData = null;
    $decodingMethod = '';
    
    // Essayer d'abord le fichier source
    if (file_exists($sourcePath)) {
        $content = file_get_contents($sourcePath);
        
        if ($content === false) {
            echo "<p class='error'>Erreur: Impossible de lire le fichier source</p>";
        } else {
            echo "<p>Taille du fichier source: " . number_format(strlen($content)) . " octets</p>";
            
            // Vérifier si le contenu semble être du Base64
            $isBase64 = preg_match('/^[A-Za-z0-9+\/=]+$/', trim($content));
            echo "<p>Détection base64: " . ($isBase64 ? "<span class='success'>OUI</span>" : "<span class='info'>NON</span>") . "</p>";
            
            if ($isBase64) {
                $result = tryDecodeBase64($content);
                if ($result['success']) {
                    $imageData = $result['data'];
                    $decodingMethod = $result['method'];
                    echo "<p class='success'>Décodage base64 réussi (méthode: {$decodingMethod}). Taille: " . number_format(strlen($imageData)) . " octets</p>";
                } else {
                    echo "<p class='error'>Échec du décodage base64.</p>";
                }
            } else {
                $imageData = $content;
                $decodingMethod = 'direct';
                echo "<p class='info'>Fichier traité directement (pas de décodage base64 nécessaire)</p>";
            }
        }
    }
    
    // Si on n'a pas encore d'image valide, essayer le fichier .raw
    if (($imageData === null || strlen($imageData) < 100) && file_exists($rawPath)) {
        echo "<p>Fichier .raw trouvé, tentative avec ce fichier...</p>";
        $content = file_get_contents($rawPath);
        if ($content !== false) {
            echo "<p>Taille du fichier .raw: " . number_format(strlen($content)) . " octets</p>";
            $result = tryDecodeBase64($content);
            if ($result['success']) {
                $imageData = $result['data'];
                $decodingMethod = $result['method'] . ' (depuis .raw)';
                echo "<p class='success'>Décodage base64 du fichier .raw réussi (méthode: {$result['method']}). Taille: " . number_format(strlen($imageData)) . " octets</p>";
            } else {
                echo "<p class='error'>Échec du décodage du fichier .raw.</p>";
            }
        } else {
            echo "<p class='error'>Impossible de lire le fichier .raw</p>";
        }
    }
    
    // Si on a toujours pas de données d'image
    if ($imageData === null && $action !== 'force_convert') {
        echo "<p class='error'>Aucune donnée d'image valide extraite. Utilisez l'option 'Forcer la conversion' pour tenter de récupérer l'image quand même.</p>";
        echo "</div></body></html>";
        exit;
    }
    
    // Analyse de l'image
    if ($action === 'analyze' || $action === 'convert' || $action === 'force_convert') {
        echo "<h2>Analyse</h2>";
        
        // Tenter de détecter le type de l'image
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->buffer($imageData);
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
            'WebP' => [
                'sig' => "RIFF",
                'offset' => 0,
                'mime' => 'image/webp'
            ]
        ];
        
        $detectedFormat = "Format inconnu";
        foreach ($signatures as $formatName => $sig) {
            if (strpos($imageData, $sig['sig']) === $sig['offset']) {
                $detectedFormat = $formatName;
                echo "<p class='success'>Format d'image détecté: {$formatName}</p>";
                break;
            }
        }
        
        if ($detectedFormat === "Format inconnu") {
            echo "<p class='error'>Aucune signature d'image valide détectée dans les données.</p>";
            
            if ($action !== 'force_convert') {
                echo "<p>Pour forcer la conversion même sans image valide, utilisez l'option 'Forcer la conversion'.</p>";
                if ($action !== 'convert') {
                    echo "</div></body></html>";
                    exit;
                }
            }
        }
    }
    
    // Conversion de l'image
    if ($action === 'convert' || $action === 'force_convert' || $action === 'view') {
        // Fonction pour réparer et convertir l'image
        function convertImage($imageData, $outputFormat = 'jpg', $quality = 90) {
            try {
                // Essayer de créer une image à partir des données
                $image = @imagecreatefromstring($imageData);
                
                if ($image === false) {
                    // Si échec, essayer de créer une image vide avec les données en base64 comme texte
                    $width = 800;
                    $height = 600;
                    $tempImage = imagecreatetruecolor($width, $height);
                    
                    // Fond blanc
                    $white = imagecolorallocate($tempImage, 255, 255, 255);
                    imagefill($tempImage, 0, 0, $white);
                    
                    // Texte explicatif
                    $textColor = imagecolorallocate($tempImage, 255, 0, 0);
                    $text = "Image non valide - Données binaires converties";
                    imagestring($tempImage, 5, 20, 20, $text, $textColor);
                    
                    // Texte supplémentaire
                    $text2 = "Format détecté: " . (strpos($imageData, "\xFF\xD8\xFF") === 0 ? "JPEG (corrompu)" : "Inconnu");
                    imagestring($tempImage, 3, 20, 50, $text2, $textColor);
                    
                    $image = $tempImage;
                }
                
                // Obtenir les dimensions
                $width = imagesx($image);
                $height = imagesy($image);
                
                // Créer une nouvelle image pour la conversion
                $newImage = imagecreatetruecolor($width, $height);
                
                // Pour PNG et WebP, préserver la transparence
                if ($outputFormat === 'png' || $outputFormat === 'webp') {
                    imagealphablending($newImage, false);
                    imagesavealpha($newImage, true);
                    $transparent = imagecolorallocatealpha($newImage, 0, 0, 0, 127);
                    imagefilledrectangle($newImage, 0, 0, $width, $height, $transparent);
                }
                
                // Copier l'image source vers la nouvelle
                imagecopy($newImage, $image, 0, 0, 0, 0, $width, $height);
                
                // Démarrer la capture de sortie
                ob_start();
                
                // Encoder selon le format demandé
                $success = false;
                switch ($outputFormat) {
                    case 'jpg':
                    case 'jpeg':
                        $success = imagejpeg($newImage, null, $quality);
                        break;
                    case 'png':
                        $success = imagepng($newImage, null, 9); // 0-9, 9 étant la meilleure compression
                        break;
                    case 'gif':
                        $success = imagegif($newImage);
                        break;
                    case 'webp':
                        $success = imagewebp($newImage, null, $quality);
                        break;
                    default:
                        $success = imagejpeg($newImage, null, $quality);
                }
                
                // Récupérer les données et nettoyer
                $convertedData = $success ? ob_get_contents() : false;
                ob_end_clean();
                
                // Libérer la mémoire
                imagedestroy($image);
                imagedestroy($newImage);
                
                return [
                    'success' => $success,
                    'data' => $convertedData,
                    'width' => $width,
                    'height' => $height
                ];
            } catch (Exception $e) {
                if (isset($image) && $image !== false) {
                    imagedestroy($image);
                }
                if (isset($newImage) && $newImage !== false) {
                    imagedestroy($newImage);
                }
                return [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        // Conversion de l'image
        $convertResult = convertImage($imageData, $format);
        
        if ($action === 'view' && $convertResult['success']) {
            // Définir les en-têtes pour afficher l'image directement
            switch ($format) {
                case 'jpg':
                case 'jpeg':
                    header('Content-Type: image/jpeg');
                    break;
                case 'png':
                    header('Content-Type: image/png');
                    break;
                case 'gif':
                    header('Content-Type: image/gif');
                    break;
                case 'webp':
                    header('Content-Type: image/webp');
                    break;
                default:
                    header('Content-Type: image/jpeg');
            }
            echo $convertResult['data'];
            exit;
        }
        
        if ($convertResult['success']) {
            echo "<p class='success'>Conversion réussie! Dimensions: {$convertResult['width']} x {$convertResult['height']} pixels</p>";
            
            // Sauvegarder l'image convertie
            $tempDir = __DIR__ . '/../public/temp/';
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            
            $timestamp = time();
            $convertedFileName = "fixed_{$timestamp}_{$installationNumber}_{$fileName}";
            if (pathinfo($convertedFileName, PATHINFO_EXTENSION) !== $format) {
                $convertedFileName = pathinfo($convertedFileName, PATHINFO_FILENAME) . '.' . $format;
            }
            
            $convertedFilePath = $tempDir . $convertedFileName;
            
            if (file_put_contents($convertedFilePath, $convertResult['data']) !== false) {
                echo "<p class='success'>Image sauvegardée: " . htmlspecialchars($convertedFilePath) . "</p>";
                
                // URL pour accéder à l'image
                $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];
                $imageUrl = $baseUrl . '/temp/' . $convertedFileName;
                
                echo "<div class='image-container'>";
                echo "<div class='image-box'>";
                echo "<h3>Image convertie</h3>";
                echo "<p><a href='{$imageUrl}' target='_blank'>Voir en plein écran</a></p>";
                echo "<img src='{$imageUrl}' class='result-image' alt='Image convertie'>";
                echo "</div>";
                
                // Créer une version pour le visualiseur
                echo "<div class='image-box'>";
                echo "<h3>Actions</h3>";
                echo "<p><a href='{$imageUrl}' download class='button'>Télécharger l'image convertie</a></p>";
                
                $viewerUrl = "{$baseUrl}/file-proxy-viewer.html?file=" . urlencode($convertedFileName) . "&ins=temp";
                echo "<p><a href='{$viewerUrl}' target='_blank' class='button'>Ouvrir dans le visualiseur</a></p>";
                
                // Lien pour voir directement avec l'action view
                $viewUrl = $_SERVER['PHP_SELF'] . "?ins={$installationNumber}&file={$fileName}&format={$format}&action=view";
                echo "<p><a href='{$viewUrl}' target='_blank' class='button'>Voir l'image directement</a></p>";
                
                echo "</div>";
                echo "</div>";
            } else {
                echo "<p class='error'>Erreur: Impossible de sauvegarder l'image convertie.</p>";
            }
        } else {
            $errorMsg = isset($convertResult['error']) ? $convertResult['error'] : "Raison inconnue";
            echo "<p class='error'>Échec de la conversion de l'image: {$errorMsg}</p>";
        }
    }
}

echo "</div></body></html>";
?>