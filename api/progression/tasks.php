<?php
ob_start(); // Démarrer la temporisation de sortie tout au début

// tasks.php
ini_set('display_errors', 1); // Garder pour voir les erreurs fatales, mais filtrer les niveaux
// error_reporting(E_ALL);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE); // Masquer les dépréciations et notices

require_once '../cors.php';
// Ne pas inclure ../config.php ici, car ProgressionService charge son propre config.php
// require_once '../config.php'; 

header('Content-Type: application/json');

require_once 'ProgressionService.php';

try {
    // Récupérer le code depuis les paramètres GET
    $installationCode = $_GET['code'] ?? '';
    
    if (empty($installationCode)) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Code d\'installation manquant dans la requête.']);
        exit;
    }

    // Instancier le service Progression Live
    $progressionService = new ProgressionService();

    // Appeler la méthode pour récupérer les données de la tâche par son code
    $taskData = $progressionService->getTaskByCode($installationCode);

    // Si la tâche est trouvée, $taskData contiendra le tableau formaté
    // Si elle n'est pas trouvée ou s'il y a une erreur dans getTaskByCode, une Exception sera levée
    
    ob_end_clean(); // Nettoyer le tampon (supprime les messages Deprecated/Warning capturés)
    
    // Renvoyer les données récupérées avec succès
    http_response_code(200);
    header('Content-Type: application/json'); // Assurer que le header est défini APRES ob_end_clean
    echo json_encode([
        'success' => true,
        'data' => $taskData
    ]);

} catch (Exception $e) {
    ob_end_clean(); // Nettoyer aussi le tampon en cas d'erreur
    // Gérer les exceptions levées par ProgressionService (connexion, tâche non trouvée, etc.)
    // Déterminer le code HTTP approprié en fonction de l'erreur
    $httpCode = 500; // Erreur serveur par défaut
    $errorMessage = $e->getMessage();

    // Tenter de détecter une erreur "non trouvée"
    if (stripos($errorMessage, 'Aucune tâche trouvée') !== false || stripos($errorMessage, 'not found') !== false) {
        $httpCode = 404; // Not Found
    }
    // Ajouter d'autres détections d'erreurs spécifiques si nécessaire

    http_response_code($httpCode);
    header('Content-Type: application/json'); // Assurer que le header est défini APRES ob_end_clean
    echo json_encode([
        'success' => false,
        'message' => $errorMessage // Renvoyer le message d'erreur de ProgressionService
    ]);
}
?>