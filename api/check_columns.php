<?php
require_once 'config.php';

try {
    // Vérifier si la table events existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'events'");
    $tableExists = $stmt->fetch();
    
    if (!$tableExists) {
        echo "La table 'events' n'existe pas!\n";
        exit;
    }

    // Obtenir toutes les colonnes
    $stmt = $pdo->query("SHOW COLUMNS FROM events");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Colonnes de la table events:\n\n";
    foreach ($columns as $column) {
        echo "Nom: " . $column['Field'] . "\n";
        echo "Type: " . $column['Type'] . "\n";
        echo "Null: " . $column['Null'] . "\n";
        echo "Default: " . ($column['Default'] === null ? "NULL" : $column['Default']) . "\n";
        echo "------------------------\n";
    }

} catch(Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
