<?php
/**
 * Serveur de fichiers universel
 * 
 * Ce script sert un fichier en utilisant plusieurs techniques pour assurer l'intégrité binaire,
 * quel que soit l'encodage ou la corruption du fichier source.
 */

// Désactiver tous les tampons de sortie et la compression
@ini_set('output_buffering', 'Off');
@ini_set('zlib.output_compression', 'Off');
while (ob_get_level()) ob_end_clean();

// Journalisation
function logMsg($message) {
    error_log("[" . date('Y-m-d H:i:s') . "] $message", 3, __DIR__ . '/universal_file_server.log');
}

// En-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Paramètres
$ins = isset($_GET['ins']) ? $_GET['ins'] : '';
$file = isset($_GET['file']) ? $_GET['file'] : '';
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline';
$attempt = isset($_GET['attempt']) ? (int)$_GET['attempt'] : 1;

logMsg("Demande de fichier: ins=$ins, file=$file, mode=$mode, attempt=$attempt");

// Validation des paramètres
if (empty($ins) || empty($file)) {
    header('HTTP/1.1 400 Bad Request');
    logMsg("Erreur: Paramètres manquants");
    exit('Paramètres manquants');
}

// Sécurité: nettoyer les paramètres
$ins = preg_replace('/[^A-Za-z0-9]/', '', $ins);
$file = basename($file);

logMsg("Paramètres nettoyés: ins=$ins, file=$file");

// Chemins des fichiers
$insDir = __DIR__ . '/files/' . $ins;
$origPath = $insDir . '/' . $file;
$rawPath = $origPath . '.raw';

logMsg("Chemins: original=$origPath, raw=$rawPath");

// Dossier temporaire pour les fichiers traités
$tempDir = __DIR__ . '/../public/temp';
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0777, true);
    logMsg("Dossier temp créé: $tempDir");
}

// Nom de fichier unique pour éviter les collisions
$uniqueId = md5($ins . '_' . $file . '_' . time() . '_' . rand(1000, 9999));
$tempFile = $tempDir . '/' . $uniqueId . '_' . $file;

logMsg("Fichier temporaire: $tempFile");

// Fonction pour servir un fichier avec les bons en-têtes
function serveFile($filePath, $fileName, $mode = 'inline') {
    logMsg("Envoi du fichier: $filePath, mode=$mode");
    
    // Vérifier que le fichier existe
    if (!file_exists($filePath)) {
        header('HTTP/1.1 404 Not Found');
        logMsg("Erreur: Fichier introuvable: $filePath");
        exit("Fichier introuvable");
    }
    
    // Déterminer le type MIME
    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $contentType = 'application/octet-stream';
    
    switch ($extension) {
        case 'jpg': case 'jpeg': $contentType = 'image/jpeg'; break;
        case 'png': $contentType = 'image/png'; break;
        case 'gif': $contentType = 'image/gif'; break;
        case 'pdf': $contentType = 'application/pdf'; break;
    }
    
    $fileSize = filesize($filePath);
    
    logMsg("Type MIME: $contentType, Taille: $fileSize octets");
    
    // En-têtes HTTP
    header("Content-Type: $contentType");
    header("Content-Length: $fileSize");
    
    if ($mode === 'attachment') {
        header("Content-Disposition: attachment; filename=\"$fileName\"");
    } else {
        header("Content-Disposition: inline; filename=\"$fileName\"");
    }
    
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
    header("Expires: 0");
    
    // Lire et envoyer le fichier en mode binaire
    $handle = fopen($filePath, 'rb');
    if ($handle) {
        $sent = fpassthru($handle);
        fclose($handle);
        logMsg("Fichier envoyé avec succès: $sent octets");
        return true;
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        logMsg("Erreur: Impossible d'ouvrir le fichier pour lecture");
        exit("Erreur lors de l'ouverture du fichier");
    }
}

// Stratégie 1: Essayer d'abord le fichier original
if (file_exists($origPath) && $attempt <= 1) {
    logMsg("Tentative 1: Servir le fichier original");
    
    // Vérifier rapidement si le fichier semble être valide
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $origPath);
    finfo_close($finfo);
    
    logMsg("Type MIME du fichier original: $mime");
    
    // Si le MIME semble correct pour l'extension, servir directement
    $validMime = false;
    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    
    if (($extension === 'jpg' || $extension === 'jpeg') && $mime === 'image/jpeg') $validMime = true;
    elseif ($extension === 'png' && $mime === 'image/png') $validMime = true;
    elseif ($extension === 'pdf' && $mime === 'application/pdf') $validMime = true;
    
    if ($validMime) {
        serveFile($origPath, $file, $mode);
        exit;
    } else {
        logMsg("Le type MIME ne correspond pas à l'extension, poursuite à la tentative 2");
    }
}

// Stratégie 2: Essayer le fichier .raw
if (file_exists($rawPath) && $attempt <= 2) {
    logMsg("Tentative 2: Utiliser le fichier .raw");
    
    // Lire le contenu du fichier .raw
    $content = file_get_contents($rawPath);
    
    // Vérifier si c'est du base64
    if (preg_match('/^[A-Za-z0-9+\/=]+$/s', trim($content))) {
        logMsg("Fichier .raw semble être en base64, décodage");
        
        // Nettoyer les caractères non-base64
        $cleanContent = preg_replace('/[^A-Za-z0-9+\/=]/', '', $content);
        $decoded = base64_decode($cleanContent, true);
        
        if ($decoded !== false) {
            logMsg("Décodage base64 réussi");
            
            // Écrire le contenu décodé dans un fichier temporaire
            if (file_put_contents($tempFile, $decoded)) {
                logMsg("Fichier temporaire créé: $tempFile");
                
                // Servir le fichier temporaire
                serveFile($tempFile, $file, $mode);
                exit;
            } else {
                logMsg("Erreur: Impossible d'écrire le fichier temporaire");
            }
        } else {
            logMsg("Échec du décodage base64, poursuite à la tentative 3");
        }
    } else {
        logMsg("Fichier .raw n'est pas en base64, tentative d'utilisation directe");
        
        // Copier le fichier .raw dans un fichier temporaire
        if (copy($rawPath, $tempFile)) {
            logMsg("Fichier .raw copié dans: $tempFile");
            
            // Servir le fichier temporaire
            serveFile($tempFile, $file, $mode);
            exit;
        } else {
            logMsg("Erreur: Impossible de copier le fichier .raw");
        }
    }
}

// Stratégie 3: Rediriger vers le convertisseur binaire
if ($attempt <= 3) {
    logMsg("Tentative 3: Redirection vers le convertisseur binaire");
    
    // Construire l'URL du convertisseur
    $converterUrl = "http://{$_SERVER['HTTP_HOST']}/binary_converter.php?ins=$ins&file=$file";
    
    // Rediriger vers le convertisseur
    header("Location: $converterUrl");
    logMsg("Redirection vers: $converterUrl");
    exit;
}

// Si toutes les tentatives ont échoué, afficher une erreur
header('HTTP/1.1 500 Internal Server Error');
logMsg("Toutes les tentatives ont échoué");
echo "Impossible de servir le fichier après plusieurs tentatives.";
?>