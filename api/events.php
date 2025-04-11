<?php
require_once 'cors.php'; // Utiliser la configuration CORS centralisée

// --- Débogage Temporaire : Afficher TOUTES les erreurs --- 
ini_set('display_errors', 1); 
error_reporting(E_ALL); 
// --- Fin Débogage ---

// Configurer le fuseau horaire pour Montréal
date_default_timezone_set('America/Montreal');

// Supprimer le bloc CORS en dur
/*
// Gérer les en-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Si c'est une requête OPTIONS, on s'arrête ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
*/

// Définir le type de contenu comme JSON
// header('Content-Type: application/json; charset=utf-8'); // cors.php le fait déjà si besoin ? (à vérifier)
// En fait, cors.php ne définit PAS Content-Type, donc on doit le garder
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
require_once 'DatabaseUtils.php'; // Inclure le fichier avec les fonctions utilitaires DB

// Fonction de logging simplifiée
function writeLog($message) {
    // Utiliser error_log est préférable car il écrit dans le log PHP du serveur
    error_log(date('[Y-m-d H:i:s]') . " " . $message);
}

// Utiliser les fonctions utilitaires pour vérifier et ajouter les colonnes
checkAndAddColumn($pdo, 'events', 'vacation_group_id', 'VARCHAR(36) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'vacation_group_start_date', 'DATE DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'vacation_group_end_date', 'DATE DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'full_name', 'VARCHAR(255) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'phone', 'VARCHAR(20) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'address', 'VARCHAR(255) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'Sommaire', 'TEXT DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'Description', 'TEXT DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'quote_number', 'VARCHAR(50) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'representative', 'VARCHAR(100) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'client_number', 'VARCHAR(50) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'installation_number', 'VARCHAR(50) DEFAULT NULL');
checkAndAddColumn($pdo, 'events', 'status', 'VARCHAR(50) DEFAULT \'En approbation\'');

// Fonction pour valider le type d'événement
function isValidEventType($type) {
    $validTypes = ['installation', 'conge', 'maladie', 'formation', 'vacances'];
    return in_array(strtolower($type), $validTypes);
}

// Fonction pour gérer les requêtes GET
function handleGet($pdo) {
    writeLog("Début handleGet"); // Log début
    try {
        $sql = "
            SELECT 
                e.*,
                t1.name as technician1_name,
                t2.name as technician2_name,
                t3.name as technician3_name,
                t4.name as technician4_name
            FROM events e
            LEFT JOIN employees t1 ON e.technician1_id = t1.id AND t1.active = 1
            LEFT JOIN employees t2 ON e.technician2_id = t2.id AND t2.active = 1
            LEFT JOIN employees t3 ON e.technician3_id = t3.id AND t3.active = 1
            LEFT JOIN employees t4 ON e.technician4_id = t4.id AND t4.active = 1
            ORDER BY e.date, e.installation_time
        ";
        writeLog("SQL pour GET: " . $sql);

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        writeLog(count($events) . " événements récupérés de la DB.");
        
        $formattedEvents = array_map(function($event) {
            $startDateTime = null;
            $endDateTime = null;
            $startISO = null;
            $endISO = null;

            try {
                // Construire la date/heure de début
                $startStr = $event['date'] . ' ' . ($event['installation_time'] ?? '00:00:00');
                $startDateTime = new DateTime($startStr, new DateTimeZone('America/Montreal')); // Spécifier le fuseau horaire
                
                // Calculer la date/heure de fin (suppose 2h par défaut si non spécifié)
                $endDateTime = (clone $startDateTime)->modify('+2 hours'); 

                // Formater en ISO 8601 (compatible avec JavaScript `new Date()`)
                $startISO = $startDateTime->format(DateTime::ATOM); // Format ISO 8601 (ex: 2025-03-28T08:00:00-04:00)
                $endISO = $endDateTime->format(DateTime::ATOM);
                 
            } catch (Exception $dateEx) {
                 writeLog("Erreur DateTime pour event ID " . ($event['id'] ?? 'N/A') . ": " . $dateEx->getMessage());
                 // Les valeurs ISO resteront null
            }

            // Décodage JSON pour les particularités, avec gestion d'erreur
            $particularities_decoded = null;
            if (isset($event['particularities']) && is_string($event['particularities'])) {
                $particularities_decoded = json_decode($event['particularities'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    writeLog("Erreur de décodage JSON pour particularities (event ID: " . ($event['id'] ?? 'N/A') . "): " . json_last_error_msg());
                    $particularities_decoded = null; // Réinitialiser en cas d'erreur
                }
            }
            // Assurer que c'est un tableau ou un objet vide par défaut
            $particularities_array = is_array($particularities_decoded) ? $particularities_decoded : [];

            return [
                'id' => $event['id'] ?? null,
                'type' => $event['type'] ?? null,
                'date' => $event['date'] ?? null,
                'installation_time' => $event['installation_time'] ?? null,
                'status' => $event['status'] ?? null,
                'full_name' => $event['full_name'] ?? null,
                'phone' => $event['phone'] ?? null,
                'address' => $event['address'] ?? null,
                'city' => $event['city'] ?? null,
                'installation_number' => $event['installation_number'] ?? null,
                'client_number' => $event['client_number'] ?? null,
                'quote_number' => $event['quote_number'] ?? null,
                'representative' => $event['representative'] ?? null,
                'equipment' => $event['equipment'] ?? null,
                'amount' => $event['amount'] ?? null,
                'Sommaire' => $event['Sommaire'] ?? null,
                'Description' => $event['Description'] ?? null,
                'technician1_id' => $event['technician1_id'] ?? null,
                'technician2_id' => $event['technician2_id'] ?? null,
                'technician3_id' => $event['technician3_id'] ?? null,
                'technician4_id' => $event['technician4_id'] ?? null,
                'technician1_name' => $event['technician1_name'] ?? null,
                'technician2_name' => $event['technician2_name'] ?? null,
                'technician3_name' => $event['technician3_name'] ?? null,
                'technician4_name' => $event['technician4_name'] ?? null,
                'region_id' => $event['region_id'] ?? null,
                'employee_id' => $event['employee_id'] ?? null,
                
                // --- Ajout des champs de la feuille de travail --- 
                'floor' => $event['floor'] ?? null,
                // Assurer que has_visit est un booléen (la DB stocke 0/1)
                'has_visit' => isset($event['has_visit']) ? (bool)$event['has_visit'] : null,
                'visitor_name' => $event['visitor_name'] ?? null,
                'house_type' => $event['house_type'] ?? null,
                'aluminum1' => $event['aluminum1'] ?? null,
                'length_count1' => isset($event['length_count1']) ? (int)$event['length_count1'] : null,
                'aluminum2' => $event['aluminum2'] ?? null,
                'length_count2' => isset($event['length_count2']) ? (int)$event['length_count2'] : null,
                'support_type' => $event['support_type'] ?? null,
                'electric_panel' => $event['electric_panel'] ?? null,
                // Assurer que has_panel_space est un booléen
                'has_panel_space' => isset($event['has_panel_space']) ? (bool)$event['has_panel_space'] : null,
                'basement' => $event['basement'] ?? null,
                'installation_type' => $event['installation_type'] ?? null,
                'sub_installation_type' => $event['sub_installation_type'] ?? null,
                // Renvoyer l'objet/tableau PHP décodé
                'particularities' => $particularities_array, 
                'sketch_data' => $event['sketch_data'] ?? null,
                // --- Fin ajout --- 
                
                'title' => '[' . ucfirst($event['type'] ?? 'N/A') . '] ' . ($event['full_name'] ?? 'N/A') . ' (' . ($event['installation_number'] ?? 'N/A') . ')', 
                'start' => $startISO, 
                'end' => $endISO,       
                'allDay' => false 
            ];
        }, $events);
        
        // Filtrer les événements qui n'ont pas pu avoir de date start/end valide
        $validFormattedEvents = array_filter($formattedEvents, function($ev) {
            return $ev['start'] !== null && $ev['end'] !== null;
        });
        
        writeLog(count($validFormattedEvents) . " événements formatés valides pour le calendrier.");

        echo json_encode([
            'success' => true,
            'data' => array_values($validFormattedEvents) // Renvoyer un tableau indexé
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        writeLog("Fin handleGet - Réponse envoyée.");

    } catch(Exception $e) {
        writeLog("ERREUR dans handleGet : " . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erreur serveur lors de la récupération des événements",
            'details' => $e->getMessage()
        ]);
    }
}

// Fonction pour gérer les requêtes POST
function handlePost($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        writeLog("Données reçues: " . json_encode($data));

        // Valider les données requises
        if (!isset($data['type'])) {
            throw new Exception("Le type d'événement est requis");
        }

        // Valider le type d'événement
        $validTypes = ['installation', 'conge', 'maladie', 'formation', 'vacances'];
        if (!in_array($data['type'], $validTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Type d\'événement invalide']);
            return;
        }

        // Préparer les données pour l'insertion
        $eventData = [
            'type' => $data['type'],
            'date' => $data['date'] ?? date('Y-m-d'),
            'installation_time' => $data['installation_time'] ?? '08:00:00',
            'full_name' => $data['full_name'] ?? '',
            'phone' => $data['phone'] ?? '',
            'address' => $data['address'] ?? '',
            'city' => $data['city'] ?? '',
            'equipment' => $data['equipment'] ?? '',
            'amount' => (isset($data['amount']) && $data['amount'] === '') ? '0.00' : ($data['amount'] ?? '0.00'),
            'technician1_id' => (isset($data['technician1_id']) && $data['technician1_id'] === '') ? null : ($data['technician1_id'] ?? null),
            'technician2_id' => (isset($data['technician2_id']) && $data['technician2_id'] === '') ? null : ($data['technician2_id'] ?? null),
            'technician3_id' => (isset($data['technician3_id']) && $data['technician3_id'] === '') ? null : ($data['technician3_id'] ?? null),
            'technician4_id' => (isset($data['technician4_id']) && $data['technician4_id'] === '') ? null : ($data['technician4_id'] ?? null),
            'Sommaire' => $data['Sommaire'] ?? '',
            'Description' => $data['Description'] ?? '',
            'client_number' => (isset($data['client_number']) && $data['client_number'] === '') ? null : ($data['client_number'] ?? null),
            'quote_number' => (isset($data['quote_number']) && $data['quote_number'] === '') ? null : ($data['quote_number'] ?? null),
            'representative' => (isset($data['representative']) && $data['representative'] === '') ? null : ($data['representative'] ?? null),
            'installation_number' => (isset($data['installation_number']) && $data['installation_number'] === '') ? null : ($data['installation_number'] ?? null),
            'status' => $data['status'] ?? 'En approbation'
        ];

        // Construire la requête SQL
        $sql = "INSERT INTO events (
            type, date, installation_time, full_name, phone, 
            address, city, equipment, amount, 
            technician1_id, technician2_id, technician3_id, technician4_id,
            Sommaire, Description, client_number, quote_number, 
            representative, installation_number, status
        ) VALUES (
            :type, :date, :installation_time, :full_name, :phone,
            :address, :city, :equipment, :amount,
            :technician1_id, :technician2_id, :technician3_id, :technician4_id,
            :Sommaire, :Description, :client_number, :quote_number,
            :representative, :installation_number, :status
        )";

        $stmt = $pdo->prepare($sql);
        
        // Loguer les données juste avant l'exécution
        writeLog("Données pour execute() : " . json_encode($eventData));
        
        $success = $stmt->execute($eventData);

        if ($success) {
            $id = $pdo->lastInsertId();
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Événement créé avec succès',
                'id' => $id
            ]);
        } else {
            throw new Exception("Erreur lors de la création de l'événement");
        }
    } catch (Exception $e) {
        writeLog("ERREUR POST: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Fonction pour gérer les requêtes POST de mise à jour
function handleUpdate($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        writeLog("Données de mise à jour reçues: " . json_encode($data));

        if (!isset($data['id'])) {
            throw new Exception("L'ID de l'événement est requis pour la mise à jour");
        }

        // Vérifier si l'événement existe
        $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
        $stmt->execute([$data['id']]);
        if (!$stmt->fetch()) {
            throw new Exception("Événement non trouvé");
        }

        // Préparer les données pour la mise à jour
        $eventData = [
            'id' => $data['id'],
            'type' => $data['type'] ?? 'installation',
            'date' => $data['date'] ?? date('Y-m-d'),
            'installation_time' => $data['installation_time'] ?? '08:00:00',
            'full_name' => $data['full_name'] ?? '',
            'phone' => $data['phone'] ?? '',
            'address' => $data['address'] ?? '',
            'city' => $data['city'] ?? '',
            'Sommaire' => $data['Sommaire'] ?? '',
            'Description' => $data['Description'] ?? '',
            'equipment' => $data['equipment'] ?? '',
            'amount' => $data['amount'] ?? '0.00',
            'technician1_id' => $data['technician1_id'] ?? null,
            'technician2_id' => $data['technician2_id'] ?? null,
            'technician3_id' => $data['technician3_id'] ?? null,
            'technician4_id' => $data['technician4_id'] ?? null,
            'quote_number' => $data['quote_number'] ?? '',
            'representative' => $data['representative'] ?? '',
            'client_number' => $data['client_number'] ?? '',
            'installation_number' => $data['installation_number'] ?? '',
            'status' => $data['status'] ?? $data['installation_status'] ?? 'En approbation'
        ];

        // Construire la requête SQL de mise à jour
        $sql = "UPDATE events SET 
            type = :type,
            date = :date,
            installation_time = :installation_time,
            full_name = :full_name,
            phone = :phone,
            address = :address,
            city = :city,
            Sommaire = :Sommaire,
            Description = :Description,
            equipment = :equipment,
            amount = :amount,
            technician1_id = :technician1_id,
            technician2_id = :technician2_id,
            technician3_id = :technician3_id,
            technician4_id = :technician4_id,
            quote_number = :quote_number,
            representative = :representative,
            client_number = :client_number,
            installation_number = :installation_number,
            status = :status
            WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($eventData);

        if ($result) {
            // Récupérer l'événement mis à jour
            $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
            $stmt->execute([$data['id']]);
            $updatedEvent = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'message' => 'Événement mis à jour avec succès',
                'data' => $updatedEvent
            ]);
        } else {
            throw new Exception("Erreur lors de la mise à jour de l'événement");
        }
    } catch (Exception $e) {
        writeLog("ERREUR UPDATE: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Fonction pour gérer les requêtes DELETE
function handleDelete($pdo) {
    try {
        // Récupérer l'ID de l'événement à supprimer
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if (!$id) {
            throw new Exception("ID de l'événement non spécifié");
        }

        // Préparer et exécuter la requête de suppression
        $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Événement supprimé avec succès'
            ]);
        } else {
            throw new Exception("Erreur lors de la suppression de l'événement");
        }
    } catch (Exception $e) {
        writeLog("ERREUR DELETE: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erreur lors de la suppression de l'événement: " . $e->getMessage()
        ]);
    }
}

// Fonction pour nettoyer les événements invalides
function cleanInvalidEvents($pdo) {
    try {
        // Supprimer les événements avec une date invalide (1969-12-31)
        $sql = "DELETE FROM events WHERE date = '1969-12-31'";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute();

        if ($result) {
            writeLog("Nettoyage des événements invalides réussi");
            return true;
        } else {
            writeLog("Erreur lors du nettoyage des événements invalides");
            return false;
        }
    } catch (Exception $e) {
        writeLog("ERREUR lors du nettoyage: " . $e->getMessage());
        return false;
    }
}

// Nettoyer les événements invalides au démarrage
cleanInvalidEvents($pdo);

// Fonction pour gérer les requêtes PUT
function handlePut($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Données JSON invalides: " . json_last_error_msg());
        }
        
        writeLog("Données reçues pour PUT: " . json_encode($data));

        // Valider l'ID
        if (empty($data['id'])) {
            throw new Exception("L'ID de l'événement est requis pour la mise à jour");
        }
        $id = $data['id'];

        // Préparer les données pour la mise à jour (champs existants + nouveaux)
        // Initialiser le tableau des champs et des valeurs
        $fields = [];
        $updateData = [':id' => $id];
        
        // Liste des champs attendus (existants + nouveaux)
        $allowedFields = [
            'type', 'date', 'installation_time', 'status', 'full_name', 'phone', 'address',
             'installation_number', 'client_number', 'quote_number', 'representative', 'equipment',
             'amount', 'Sommaire', 'Description', 'technician1_id', 'technician2_id', 'technician3_id',
             'technician4_id', 'region_id', 'employee_id',
            // Nouveaux champs worksheet
            'floor', 'has_visit', 'visitor_name', 'house_type', 'aluminum1', 'length_count1',
             'aluminum2', 'length_count2', 'support_type', 'electric_panel', 'has_panel_space',
             'basement', 'installation_type', 'sub_installation_type', 'particularities', 'sketch_data'
        ];

        // Parcourir les données reçues et construire la requête dynamiquement
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                 // Gérer les cas spécifiques (booléens, JSON, NULL si vide)
                 $value = $data[$field];
                 $placeholder = ':' . $field;
                 
                 if (in_array($field, ['technician1_id', 'technician2_id', 'technician3_id', 'technician4_id', 'region_id', 'employee_id']) && $value === '') {
                     $value = null; // Mettre à NULL si vide pour les clés étrangères
                 } elseif ($field === 'has_visit' || $field === 'has_panel_space') {
                     $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE); // Convertir en booléen ou NULL
                 } elseif ($field === 'particularities') {
                      // Encoder en JSON seulement si c'est un tableau/objet
                      $value = is_array($value) || is_object($value) ? json_encode($value) : null; 
                 } // Ajouter d'autres conversions si nécessaire (ex: amount -> float)

                $fields[] = "`$field` = $placeholder";
                $updateData[$placeholder] = $value;
            }
        }

        // Si aucun champ à mettre à jour (en dehors de l'ID), ne rien faire
        if (empty($fields)) {
             writeLog("Aucun champ à mettre à jour pour l'ID: " . $id);
             echo json_encode(['success' => true, 'message' => 'Aucune donnée à mettre à jour.']);
             return;
         }

        // Construire la requête SQL UPDATE
        $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = :id";
        writeLog("SQL pour PUT: " . $sql);
        writeLog("Données pour execute() PUT: " . json_encode($updateData));

        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute($updateData);

        if ($success) {
            // Vérifier si des lignes ont été affectées
            $rowCount = $stmt->rowCount();
            writeLog($rowCount . " ligne(s) affectée(s) pour l'ID: " . $id);
            if ($rowCount > 0) {
                 echo json_encode(['success' => true, 'message' => 'Événement mis à jour avec succès']);
             } else {
                 // Aucune ligne affectée, peut-être que l'ID n'existait pas ou les données étaient identiques
                 echo json_encode(['success' => true, 'message' => 'Aucune modification effectuée (données identiques ou ID non trouvé?).']);
             } 
        } else {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Erreur lors de la mise à jour de l'événement: " . ($errorInfo[2] ?? 'Erreur inconnue'));
        }
    } catch (Exception $e) {
        writeLog("ERREUR PUT: " . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erreur serveur lors de la mise à jour de l'événement",
            'details' => $e->getMessage()
        ]);
    }
}

// Gérer les différentes méthodes HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        break;
}