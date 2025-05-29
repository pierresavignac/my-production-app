<?php
// Script pour créer la base de données et les tables si elles n'existent pas

echo "=== Configuration de la base de données Calendar ===\n\n";

// Paramètres de connexion
$host = 'localhost';
$user = 'root';
$passwords = ['root', '', '123456', 'password']; // Mots de passe courants à essayer

$dbname = 'local_calendar_db';
$pdo = null;

// Essayer différents mots de passe
foreach ($passwords as $pass) {
    try {
        echo "Tentative de connexion avec le mot de passe: " . ($pass ? '***' : '(vide)') . "\n";
        $pdo = new PDO("mysql:host=$host", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "✅ Connexion réussie!\n\n";
        $correct_password = $pass;
        break;
    } catch (PDOException $e) {
        echo "❌ Échec\n";
    }
}

if (!$pdo) {
    echo "\n❌ Impossible de se connecter à MySQL.\n";
    echo "Vérifiez que:\n";
    echo "1. MySQL est démarré (MAMP/XAMPP/MySQL local)\n";
    echo "2. L'utilisateur 'root' existe\n";
    echo "3. Le mot de passe est correct\n";
    exit(1);
}

// Créer la base de données si elle n'existe pas
try {
    echo "Création de la base de données '$dbname' si elle n'existe pas...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de données prête\n\n";
    
    // Se connecter à la base de données
    $pdo->exec("USE `$dbname`");
    
    // Créer la table events si elle n'existe pas
    echo "Création de la table 'events' si elle n'existe pas...\n";
    $sql = file_get_contents(__DIR__ . '/database.sql');
    if ($sql) {
        $pdo->exec($sql);
        echo "✅ Tables créées avec succès\n\n";
    }
    
    // Mettre à jour le fichier config.php avec le bon mot de passe
    echo "Mise à jour du fichier config.php...\n";
    $configFile = __DIR__ . '/config.php';
    $config = file_get_contents($configFile);
    $config = preg_replace("/define\('DB_PASS', '.*?'\);/", "define('DB_PASS', '$correct_password');", $config);
    file_put_contents($configFile, $config);
    echo "✅ Configuration mise à jour\n\n";
    
    echo "=== Installation terminée avec succès! ===\n";
    echo "Vous pouvez maintenant exécuter:\n";
    echo "php add_no_appointment_column.php\n";
    
} catch (PDOException $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}
