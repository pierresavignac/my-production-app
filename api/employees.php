<?php
// Activer l'affichage des erreurs dans le log
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.log');

// Gérer les en-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Si c'est une requête OPTIONS, on s'arrête ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Fonction de logging
function writeLog($message) {
    error_log(date('Y-m-d H:i:s') . ' - ' . print_r($message, true));
}

try {
    // Vérifier la connexion
    if (!isset($pdo)) {
        throw new Exception("La connexion à la base de données n'est pas établie");
    }

    // Vérifier si la colonne is_technician existe
    $stmt = $pdo->query("SHOW COLUMNS FROM employees LIKE 'is_technician'");
    $columnExists = $stmt->fetch();
    writeLog("Vérification de la colonne is_technician: " . print_r($columnExists, true));

    if (!$columnExists) {
        writeLog("Ajout de la colonne is_technician");
        // Ajouter la colonne si elle n'existe pas
        $pdo->exec("ALTER TABLE employees ADD COLUMN is_technician BOOLEAN NOT NULL DEFAULT FALSE");
    }

    // Vérifier si la colonne active existe
    $stmt = $pdo->query("SHOW COLUMNS FROM employees LIKE 'active'");
    $columnExists = $stmt->fetch();
    writeLog("Vérification de la colonne active: " . print_r($columnExists, true));

    if (!$columnExists) {
        writeLog("Ajout de la colonne active");
        // Ajouter la colonne si elle n'existe pas
        $pdo->exec("ALTER TABLE employees ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE");
    }

    // Désactiver tous les employés
    $stmt = $pdo->prepare("UPDATE employees SET active = 0");
    $stmt->execute();
    writeLog("Tous les employés ont été désactivés");

    // Supprimer uniquement Thierry Menard
    $stmt = $pdo->prepare("DELETE FROM employees WHERE first_name = 'Thierry' AND last_name = 'Menard'");
    $stmt->execute();
    writeLog("Suppression de Thierry Menard");

    // Liste des techniciens valides
    $techniciens = [
        ['first_name' => 'Luis', 'last_name' => 'Becerra'],
        ['first_name' => 'Jonathan', 'last_name' => 'Diaz'],
        ['first_name' => 'Thierry', 'last_name' => 'Diaz'],
        ['first_name' => 'Yvon-Pierre', 'last_name' => 'Menard'],
        ['first_name' => 'Jean-François', 'last_name' => 'Sauvé'],
        ['first_name' => 'Patrice', 'last_name' => 'Tremblay'],
        ['first_name' => 'Benoit', 'last_name' => 'Tremblay']
    ];

    // Mettre à jour ou ajouter les techniciens
    foreach ($techniciens as $tech) {
        // Vérifier si le technicien existe déjà
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE first_name = ? AND last_name = ?");
        $stmt->execute([$tech['first_name'], $tech['last_name']]);
        $existingEmployee = $stmt->fetch();

        if ($existingEmployee) {
            // Mettre à jour le technicien existant
            $stmt = $pdo->prepare("UPDATE employees SET active = 1, is_technician = 1 WHERE id = ?");
            $stmt->execute([$existingEmployee['id']]);
            writeLog("Mise à jour du technicien {$tech['first_name']} {$tech['last_name']}");
        } else {
            // Ajouter le nouveau technicien
            $stmt = $pdo->prepare("INSERT INTO employees (first_name, last_name, is_technician, active) VALUES (?, ?, 1, 1)");
            $stmt->execute([$tech['first_name'], $tech['last_name']]);
            writeLog("Ajout du technicien {$tech['first_name']} {$tech['last_name']}");
        }
    }

    // Récupérer le type de requête (tous les employés ou seulement les techniciens)
    $type = isset($_GET['type']) ? $_GET['type'] : 'all';
    writeLog("Type de requête: " . $type);

    // Préparer la requête en fonction du type
    if ($type === 'technicians') {
        $query = "
            SELECT 
                id,
                first_name,
                last_name
            FROM employees 
            WHERE active = 1 AND is_technician = 1 
            ORDER BY first_name, last_name
        ";
    } else {
        $query = "
            SELECT 
                id,
                first_name,
                last_name,
                is_technician,
                active
            FROM employees 
            ORDER BY first_name, last_name
        ";
    }

    writeLog("Requête SQL: " . $query);

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    writeLog("Nombre d'employés trouvés: " . count($employees));
    writeLog("Employés trouvés: " . print_r($employees, true));

    echo json_encode($employees);

} catch (Exception $e) {
    writeLog("Erreur: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}