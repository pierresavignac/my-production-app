<?php
// Désactiver l'affichage des erreurs
ini_set('display_errors', 0);
error_reporting(0);

// Gérer les en-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

// Si c'est une requête OPTIONS, on s'arrête ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Définir le type de contenu comme JSON
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

// Fonction de logging simplifiée
function writeLog($message) {
    error_log($message);
}

// Ajouter la colonne vacation_group_id si elle n'existe pas
try {
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS vacation_group_id VARCHAR(36) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS vacation_group_start_date DATE DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS vacation_group_end_date DATE DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS Sommaire TEXT DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS Description TEXT DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS representative VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS client_number VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS installation_number VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'En approbation'");
} catch(Exception $e) {
    error_log("Erreur lors de l'ajout des colonnes : " . $e->getMessage());
}

// Fonction pour valider le type d'événement
function isValidEventType($type) {
    $validTypes = ['installation', 'conge', 'maladie', 'formation', 'vacances'];
    return in_array(strtolower($type), $validTypes);
}

// Fonction pour gérer les requêtes GET
function handleGet($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                e.*,
                CONCAT(emp.first_name, ' ', emp.last_name) as employee_name,
                t1.id as technician1_id,
                CONCAT(t1.first_name, ' ', t1.last_name) as technician1_name,
                t2.id as technician2_id,
                CONCAT(t2.first_name, ' ', t2.last_name) as technician2_name,
                t3.id as technician3_id,
                CONCAT(t3.first_name, ' ', t3.last_name) as technician3_name,
                t4.id as technician4_id,
                CONCAT(t4.first_name, ' ', t4.last_name) as technician4_name,
                r.name as region_name
            FROM events e
            LEFT JOIN employees emp ON e.employee_id = emp.id
            LEFT JOIN employees t1 ON e.technician1_id = t1.id
            LEFT JOIN employees t2 ON e.technician2_id = t2.id
            LEFT JOIN employees t3 ON e.technician3_id = t3.id
            LEFT JOIN employees t4 ON e.technician4_id = t4.id
            LEFT JOIN regions r ON e.region_id = r.id
            ORDER BY e.date ASC, e.installation_time ASC
        ");
        
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedEvents = array_map(function($event) {
            // Normaliser le type d'événement
            $type = strtolower($event['type'] ?? '');
            switch($type) {
                case 'conge':
                case 'congé':
                    $type = 'Congé';
                    break;
                case 'maladie':
                    $type = 'Maladie';
                    break;
                case 'formation':
                    $type = 'Formation';
                    break;
                case 'vacances':
                    $type = 'Vacances';
                    break;
                case 'installation':
                    $type = 'Installation';
                    break;
                default:
                    $type = ucfirst($type);
            }

            // Champs communs à tous les événements
            $normalizedEvent = [
                'id' => $event['id'] ?? null,
                'date' => $event['date'] ?? null,
                'installation_time' => $event['installation_time'] ?? null,
                'type' => $type,
                'technician1_name' => $event['technician1_name'] ?? '',
                'technician2_name' => $event['technician2_name'] ?? '',
                'technician3_name' => $event['technician3_name'] ?? '',
                'technician4_name' => $event['technician4_name'] ?? '',
                'status' => $event['status'] ?? 'En approbation'
            ];

            // Ajouter les champs spécifiques uniquement pour les installations
            if ($type === 'Installation') {
                $normalizedEvent = array_merge($normalizedEvent, [
                    'full_name' => $event['full_name'] ?? $event['nom_complet'] ?? '',
                    'phone' => $event['phone'] ?? $event['telephone'] ?? '',
                    'address' => $event['address'] ?? $event['adresse'] ?? '',
                    'city' => $event['city'] ?? $event['ville'] ?? '',
                    'Sommaire' => $event['Sommaire'] ?? $event['sommaire'] ?? '',
                    'Description' => $event['Description'] ?? $event['description'] ?? '',
                    'equipment' => $event['equipment'] ?? $event['equipement'] ?? '',
                    'amount' => $event['amount'] ?? $event['montant'] ?? null,
                    'employee_name' => $event['employee_name'] ?? '',
                    'quote_number' => $event['quote_number'] ?? $event['numero_soumission'] ?? '',
                    'representative' => $event['representative'] ?? $event['representant'] ?? '',
                    'client_number' => $event['client_number'] ?? $event['numero_client'] ?? '',
                    'installation_number' => $event['installation_number'] ?? $event['numero_installation'] ?? '',
                    'region_name' => $event['region_name'] ?? '',
                    'region_id' => $event['region_id'] ?? null,
                    'employee_id' => $event['employee_id'] ?? null
                ]);
            }

            // Ajouter des logs pour le débogage
            error_log("Données brutes de l'événement : " . print_r($event, true));
            error_log("Événement normalisé : " . print_r($normalizedEvent, true));

            return $normalizedEvent;
        }, $events);
        
        echo json_encode([
            'success' => true,
            'data' => $formattedEvents
        ], JSON_UNESCAPED_UNICODE);

    } catch(Exception $e) {
        error_log("Erreur dans handleGet : " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erreur serveur",
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
        if (!isValidEventType($data['type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Type d\'événement invalide']);
            return;
        }

        // Normaliser le type d'événement
        $data['type'] = strtolower($data['type']);

        // Définir les valeurs par défaut
        $currentDate = date('Y-m-d');
        $defaultTime = '08:00:00';

        // Préparer les données pour l'insertion
        $eventData = [
            'type' => $data['type'],
            'date' => !empty($data['date']) ? $data['date'] : $currentDate,
            'installation_time' => !empty($data['installation_time']) ? $data['installation_time'] : $defaultTime,
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
            'status' => $data['status'] ?? 'En approbation'
        ];

        // Construire la requête SQL
        $sql = "INSERT INTO events (
            type, date, installation_time, full_name, phone, address, city,
            Sommaire, Description, equipment, amount,
            technician1_id, technician2_id, technician3_id, technician4_id,
            quote_number, representative, client_number, installation_number,
            status
        ) VALUES (
            :type, :date, :installation_time, :full_name, :phone, :address, :city,
            :Sommaire, :Description, :equipment, :amount,
            :technician1_id, :technician2_id, :technician3_id, :technician4_id,
            :quote_number, :representative, :client_number, :installation_number,
            :status
        )";

        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($eventData);

        if ($result) {
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

// Gérer les différents types de requêtes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleGet($pdo);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Vérifier si c'est une mise à jour ou une création
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['id']) && isset($data['mode']) && $data['mode'] === 'edit') {
        handleUpdate($pdo);
    } else {
        handlePost($pdo);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    handleDelete($pdo);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
}