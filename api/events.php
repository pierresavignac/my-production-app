<?php
// Désactiver l'affichage des erreurs
ini_set('display_errors', 0);
error_reporting(0);

// Gérer les en-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS `Numéro de soumission` VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS representative VARCHAR(100) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS client_number VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS installation_number VARCHAR(50) DEFAULT NULL");
} catch(Exception $e) {
    error_log("Erreur lors de l'ajout des colonnes de groupe de vacances : " . $e->getMessage());
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
            return [
                'id' => $event['id'] ?? null,
                'date' => $event['date'] ?? null,
                'installation_time' => $event['installation_time'] ?? null,
                'type' => $event['type'] ?? null,
                'full_name' => $event['full_name'] ?? '',
                'phone' => $event['phone'] ?? '',
                'address' => $event['address'] ?? '',
                'city' => $event['city'] ?? '',
                'Sommaire' => $event['Sommaire'] ?? '',
                'Description' => $event['Description'] ?? '',
                'equipment' => $event['equipment'] ?? '',
                'amount' => $event['amount'] ?? null,
                'employee_name' => $event['employee_name'] ?? '',
                'technician1_id' => $event['technician1_id'] ?? null,
                'technician2_id' => $event['technician2_id'] ?? null,
                'technician3_id' => $event['technician3_id'] ?? null,
                'technician4_id' => $event['technician4_id'] ?? null,
                'technician1_name' => $event['technician1_name'] ?? '',
                'technician2_name' => $event['technician2_name'] ?? '',
                'technician3_name' => $event['technician3_name'] ?? '',
                'technician4_name' => $event['technician4_name'] ?? '',
                'region_name' => $event['region_name'] ?? '',
                'region_id' => $event['region_id'] ?? null,
                'employee_id' => $event['employee_id'] ?? null,
                'quote_number' => $event['quote_number'] ?? '',
                'representative' => $event['representative'] ?? '',
                'client_number' => $event['client_number'] ?? '',
                'installation_number' => $event['installation_number'] ?? '',
                'vacation_group_id' => $event['vacation_group_id'] ?? null,
                'vacation_group_start_date' => $event['vacation_group_start_date'] ?? null,
                'vacation_group_end_date' => $event['vacation_group_end_date'] ?? null
            ];
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
        // Lire le contenu brut du corps de la requête
        $rawData = file_get_contents('php://input');
        writeLog("=== DÉBUT DEBUG INSERTION ===");
        writeLog("1. Données brutes reçues : " . $rawData);
        
        // Décoder les données JSON
        $data = json_decode($rawData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
        }
        
        writeLog("2. Données décodées : " . print_r($data, true));

        // Vérifier les champs requis pour une installation
        if (isset($data['type']) && $data['type'] === 'installation') {
            writeLog("Validation des champs pour une installation");
            $requiredFields = [
                'date', 'installation_time', 'full_name', 'phone', 'address',
                'city', 'equipment', 'amount', 'installation_number', 'quote_number'
            ];
            
            $missingFields = [];
            foreach ($requiredFields as $field) {
                $value = isset($data[$field]) ? $data[$field] : null;
                writeLog("Vérification du champ '$field': " . var_export($value, true));
                
                $isEmpty = false;
                if ($value === null || $value === '') {
                    $isEmpty = true;
                } else if (is_string($value)) {
                    $isEmpty = trim($value) === '';
                } else if (is_numeric($value)) {
                    $isEmpty = floatval($value) === 0.0;
                }
                
                if ($isEmpty) {
                    writeLog("Le champ '$field' est vide ou manquant");
                    $missingFields[] = $field;
                } else {
                    writeLog("Le champ '$field' est valide: " . var_export($value, true));
                }
            }
            
            if (!empty($missingFields)) {
                $errorMsg = "Champs requis manquants : " . implode(', ', $missingFields);
                writeLog("ERREUR: " . $errorMsg);
                writeLog("Données reçues : " . print_r($data, true));
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $errorMsg,
                    'debug' => [
                        'received_data' => $data,
                        'missing_fields' => $missingFields,
                        'validation_details' => array_map(function($field) use ($data) {
                            return [
                                'field' => $field,
                                'value' => isset($data[$field]) ? $data[$field] : null,
                                'type' => isset($data[$field]) ? gettype($data[$field]) : 'undefined'
                            ];
                        }, $missingFields)
                    ]
                ]);
                return;
            }
            
            writeLog("Tous les champs requis sont présents et valides");
        }

        // Préparer les paramètres avec vérification d'existence et nettoyage
        $params = [
            ':type' => isset($data['type']) ? trim($data['type']) : null,
            ':date' => isset($data['date']) ? trim($data['date']) : null,
            ':full_name' => isset($data['full_name']) ? trim($data['full_name']) : null,
            ':phone' => isset($data['phone']) ? trim($data['phone']) : null,
            ':address' => isset($data['address']) ? trim($data['address']) : null,
            ':installation_time' => isset($data['installation_time']) ? trim($data['installation_time']) : null,
            ':city' => isset($data['city']) ? trim($data['city']) : null,
            ':Sommaire' => isset($data['Sommaire']) ? trim($data['Sommaire']) : null,
            ':Description' => isset($data['Description']) ? trim($data['Description']) : null,
            ':equipment' => isset($data['equipment']) ? trim($data['equipment']) : null,
            ':amount' => isset($data['amount']) ? floatval($data['amount']) : null,
            ':technician1_id' => !empty($data['technician1_id']) ? intval($data['technician1_id']) : null,
            ':technician2_id' => !empty($data['technician2_id']) ? intval($data['technician2_id']) : null,
            ':technician3_id' => !empty($data['technician3_id']) ? intval($data['technician3_id']) : null,
            ':technician4_id' => !empty($data['technician4_id']) ? intval($data['technician4_id']) : null,
            ':employee_id' => !empty($data['employee_id']) ? intval($data['employee_id']) : null,
            ':region_id' => !empty($data['region_id']) ? intval($data['region_id']) : null,
            ':vacation_group_id' => null,
            ':vacation_group_start_date' => null,
            ':vacation_group_end_date' => null,
            ':numero_soumission' => isset($data['quote_number']) ? trim($data['quote_number']) : null,
            ':quote_number' => isset($data['quote_number']) ? trim($data['quote_number']) : null,
            ':representative' => isset($data['representative']) ? trim($data['representative']) : null,
            ':client_number' => isset($data['client_number']) ? trim($data['client_number']) : null,
            ':installation_number' => isset($data['installation_number']) ? trim($data['installation_number']) : null
        ];

        writeLog("3. Paramètres préparés : " . print_r($params, true));

        // Insérer les données dans la base de données
        $sql = "INSERT INTO events (
            type, date, full_name, phone, address, installation_time, city,
            Sommaire, Description, equipment, amount,
            technician1_id, technician2_id, technician3_id, technician4_id,
            employee_id, region_id, vacation_group_id,
            vacation_group_start_date, vacation_group_end_date,
            numero_soumission, quote_number, representative, client_number,
            installation_number
        ) VALUES (
            :type, :date, :full_name, :phone, :address, :installation_time, :city,
            :Sommaire, :Description, :equipment, :amount,
            :technician1_id, :technician2_id, :technician3_id, :technician4_id,
            :employee_id, :region_id, :vacation_group_id,
            :vacation_group_start_date, :vacation_group_end_date,
            :numero_soumission, :quote_number, :representative, :client_number,
            :installation_number
        )";

        writeLog("4. Requête SQL préparée : " . $sql);
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            $eventId = $pdo->lastInsertId();
            writeLog("5. Insertion réussie. ID de l'événement : " . $eventId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Événement créé avec succès',
                'data' => ['id' => $eventId]
            ]);
        } else {
            throw new Exception("Erreur lors de l'insertion dans la base de données");
        }
        
    } catch (Exception $e) {
        writeLog("ERREUR: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la création de l\'événement: ' . $e->getMessage(),
            'debug' => [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]
        ]);
    }
}

// Gérer les différents types de requêtes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleGet($pdo);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handlePost($pdo);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
}