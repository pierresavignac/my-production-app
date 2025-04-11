<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'db_connect.php';
require_once 'logging.php';

try {
    $pdo = getConnection();
    writeToLog("Début du nettoyage des employés");

    // 1. Désactiver tous les employés
    $stmt = $pdo->prepare("UPDATE employees SET active = 0");
    $stmt->execute();
    writeToLog("Tous les employés ont été désactivés");

    // 2. Supprimer les doublons et les entrées incorrectes
    $stmt = $pdo->prepare("DELETE FROM employees WHERE last_name = 'Trembly' OR last_name = 'Menard'");
    $stmt->execute();
    writeToLog("Suppression des entrées incorrectes");

    // 3. Ajouter les employés corrects
    $techniciens = [
        ['first_name' => 'Benoit', 'last_name' => 'Tremblay'],
        ['first_name' => 'Thierry', 'last_name' => 'Diaz']
    ];

    foreach ($techniciens as $tech) {
        // Vérifier si l'employé existe déjà
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE first_name = ? AND last_name = ?");
        $stmt->execute([$tech['first_name'], $tech['last_name']]);
        $existingEmployee = $stmt->fetch();

        if ($existingEmployee) {
            // Mettre à jour l'employé existant
            $stmt = $pdo->prepare("UPDATE employees SET active = 1, is_technician = 1 WHERE id = ?");
            $stmt->execute([$existingEmployee['id']]);
            writeToLog("Mise à jour de l'employé {$tech['first_name']} {$tech['last_name']}");
        } else {
            // Ajouter le nouvel employé
            $stmt = $pdo->prepare("INSERT INTO employees (first_name, last_name, is_technician, active) VALUES (?, ?, 1, 1)");
            $stmt->execute([$tech['first_name'], $tech['last_name']]);
            writeToLog("Ajout du nouvel employé {$tech['first_name']} {$tech['last_name']}");
        }
    }

    // 4. Vérifier le résultat
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE active = 1");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Nettoyage terminé',
        'employees' => $result
    ]);

} catch (PDOException $e) {
    writeToLog("Erreur lors du nettoyage des employés: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
