<?php
require_once 'config.php';

try {
    // Obtenir la structure de la table
    $stmt = $pdo->prepare("DESCRIBE events");
    $stmt->execute();
    $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Structure de la table events:\n\n";
    foreach ($structure as $column) {
        echo "Colonne: " . $column['Field'] . "\n";
        echo "Type: " . $column['Type'] . "\n";
        echo "Null: " . $column['Null'] . "\n";
        echo "Default: " . $column['Default'] . "\n";
        echo "------------------------\n";
    }

} catch(Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>
