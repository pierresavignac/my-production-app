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
        $pdo->exec("ALTER TABLE employees ADD COLUMN is_technician BOOLEAN NOT NULL DEFAULT FALSE");
    }

    // Vérifier si la colonne active existe
    $stmt = $pdo->query("SHOW COLUMNS FROM employees LIKE 'active'");
    $columnExists = $stmt->fetch();
    writeLog("Vérification de la colonne active: " . print_r($columnExists, true));

    if (!$columnExists) {
        writeLog("Ajout de la colonne active");
        $pdo->exec("ALTER TABLE employees ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE");
    }

    // Désactiver tous les employés
    $stmt = $pdo->prepare("UPDATE employees SET active = 0");
    $stmt->execute();
    writeLog("Tous les employés ont été désactivés");

    // Liste des employés valides
    $employes = [
        ['name' => 'Becerra Luis', 'is_technician' => 1],
        ['name' => 'Diaz Jonathan', 'is_technician' => 1],
        ['name' => 'Diaz Thierry', 'is_technician' => 1],
        ['name' => 'Menard Yvon-Pierre', 'is_technician' => 1],
        ['name' => 'Sauvé Jean-François', 'is_technician' => 1],
        ['name' => 'Tremblay Patrice', 'is_technician' => 1],
        ['name' => 'Tremblay Benoit', 'is_technician' => 1],
        ['name' => 'Chartrand Gérard', 'is_technician' => 0],
        ['name' => 'Hebert Stefan', 'is_technician' => 0],
        ['name' => 'Pascal', 'is_technician' => 1],
        ['name' => 'Raby Isabelle', 'is_technician' => 0],
        ['name' => 'Savignac Pierre', 'is_technician' => 0],
        ['name' => 'Villeneuve André', 'is_technician' => 0]
    ];

    // Mettre à jour ou ajouter les employés
    foreach ($employes as $emp) {
        // Vérifier si l'employé existe déjà
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE name = ?");
        $stmt->execute([$emp['name']]);
        $existingEmployee = $stmt->fetch();

        if ($existingEmployee) {
            // Mettre à jour l'employé existant
            $stmt = $pdo->prepare("UPDATE employees SET active = 1, is_technician = ? WHERE id = ?");
            $stmt->execute([$emp['is_technician'], $existingEmployee['id']]);
            writeLog("Mise à jour de l'employé {$emp['name']}");
        } else {
            // Ajouter le nouvel employé
            $stmt = $pdo->prepare("INSERT INTO employees (name, is_technician, active) VALUES (?, ?, 1)");
            $stmt->execute([$emp['name'], $emp['is_technician']]);
            writeLog("Ajout de l'employé {$emp['name']}");
        }
    }

    // Récupérer le type de requête
    $type = isset($_GET['type']) ? $_GET['type'] : 'all';
    writeLog("Type de requête: " . $type);

    // Préparer la requête en fonction du type
    if ($type === 'technicians') {
        $query = "SELECT id, name FROM employees WHERE active = 1 AND is_technician = 1 ORDER BY name";
    } else {
        $query = "SELECT id, name, is_technician, active FROM employees ORDER BY name";
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