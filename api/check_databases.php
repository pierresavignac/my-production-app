<?php
// Script pour vérifier quelle base de données contient les événements

echo "=== Vérification des bases de données ===\n\n";

// Configuration 1: db_connect.php
echo "1. Test avec db_connect.php (vivreenl_production):\n";
$db_host = 'localhost';
$db_name = 'vivreenl_production';
$db_user = 'vivreenl_user';
$db_pass = 'Vl2023!';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        echo "❌ Connexion échouée: " . $conn->connect_error . "\n";
    } else {
        echo "✅ Connexion réussie\n";
        $result = $conn->query("SELECT COUNT(*) as count FROM events");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "   Nombre d'événements: " . $row['count'] . "\n";
        } else {
            echo "   ❌ Table 'events' non trouvée\n";
        }
        $conn->close();
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n";

// Configuration 2: config.php original
echo "2. Test avec config.php original (local_calendar_db):\n";
$db_host2 = 'localhost';
$db_name2 = 'local_calendar_db';
$db_user2 = 'root';
$db_pass2 = 'root';

try {
    $pdo = new PDO("mysql:host=$db_host2;dbname=$db_name2", $db_user2, $db_pass2);
    echo "✅ Connexion réussie\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM events");
    if ($stmt) {
        $count = $stmt->fetchColumn();
        echo "   Nombre d'événements: $count\n";
    }
} catch (PDOException $e) {
    echo "❌ Connexion échouée: " . $e->getMessage() . "\n";
}

echo "\n";
echo "=== Conclusion ===\n";
echo "Utilisez la base de données qui contient vos événements.\n";
