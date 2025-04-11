<?php
require_once 'cors.php'; // Garder pour les en-têtes CORS
require_once 'config.php'; // Inclure la configuration MySQL ($pdo)

header('Content-Type: application/json');

// La validation de token peut être réactivée si nécessaire pour la prod
// require_once 'validate_token.php';
// $tokenData = validateToken();
// if (!$tokenData) {
//     http_response_code(401);
//     echo json_encode(['success' => false, 'message' => 'Token manquant ou invalide']);
//     exit;
// }

try {
    // Utiliser la connexion $pdo définie dans config.php
    // Supprimer : Connexion SQLite, CREATE TABLE, INSERT INTO données de test

    // Requête pour obtenir les techniciens actifs depuis la table employees
    // (Adapter les noms de colonnes si nécessaire selon votre dump SQL)
    $query = "SELECT id, name 
              FROM employees 
              WHERE is_technician = 1 AND active = 1 
              ORDER BY name";
    
    $stmt = $pdo->query($query);
    $technicians = $stmt->fetchAll(); // $pdo utilise FETCH_ASSOC par défaut (défini dans config.php)

    // La mise en forme n'est plus nécessaire si on sélectionne id et name
    // Si le format de la table employees est différent (ex: first_name, last_name),
    // il faudra réactiver et adapter le formatage ici.

    echo json_encode([
        'success' => true,
        'data' => $technicians
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Erreur serveur : " . $e->getMessage()
    ]);
    exit;
}
?> 