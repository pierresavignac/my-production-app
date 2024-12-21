<?php
require_once 'config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Récupérer la structure de la table users
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();

    // Vérifier si la table existe et a la bonne structure
    $requiredColumns = [
        'id' => 'INT',
        'email' => 'VARCHAR',
        'password' => 'VARCHAR',
        'role' => 'VARCHAR',
        'status' => 'VARCHAR',
        'verification_token' => 'VARCHAR',
        'reset_token' => 'VARCHAR',
        'reset_token_expires' => 'DATETIME',
        'created_at' => 'TIMESTAMP'
    ];

    $missingColumns = [];
    $existingColumns = [];

    foreach ($columns as $column) {
        $existingColumns[$column['Field']] = strtoupper($column['Type']);
    }

    foreach ($requiredColumns as $column => $type) {
        if (!isset($existingColumns[$column])) {
            $missingColumns[] = $column;
        }
    }

    if (empty($missingColumns)) {
        echo "La table users a tous les champs requis.\n";
        echo "\nStructure actuelle de la table :\n";
        foreach ($columns as $column) {
            echo "{$column['Field']} ({$column['Type']})\n";
        }
    } else {
        echo "Colonnes manquantes : " . implode(', ', $missingColumns) . "\n";
        echo "\nCréation des colonnes manquantes...\n";

        foreach ($missingColumns as $column) {
            $type = $requiredColumns[$column];
            $sql = "ALTER TABLE users ADD COLUMN ";
            switch ($column) {
                case 'id':
                    $sql .= "id INT AUTO_INCREMENT PRIMARY KEY";
                    break;
                case 'email':
                    $sql .= "email VARCHAR(255) NOT NULL UNIQUE";
                    break;
                case 'password':
                    $sql .= "password VARCHAR(255) NOT NULL";
                    break;
                case 'role':
                    $sql .= "role VARCHAR(50) NOT NULL DEFAULT 'user'";
                    break;
                case 'status':
                    $sql .= "status VARCHAR(50) NOT NULL DEFAULT 'pending'";
                    break;
                case 'verification_token':
                    $sql .= "verification_token VARCHAR(255)";
                    break;
                case 'reset_token':
                    $sql .= "reset_token VARCHAR(255)";
                    break;
                case 'reset_token_expires':
                    $sql .= "reset_token_expires DATETIME";
                    break;
                case 'created_at':
                    $sql .= "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
                    break;
            }
            try {
                $pdo->exec($sql);
                echo "Colonne {$column} ajoutée avec succès.\n";
            } catch (PDOException $e) {
                echo "Erreur lors de l'ajout de la colonne {$column}: " . $e->getMessage() . "\n";
            }
        }
    }

    // Créer un utilisateur admin si la table est vide
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        $email = 'pierre@garychartrand.com';
        $password = password_hash('A11gdb333!', PASSWORD_DEFAULT);
        $role = 'admin';
        $status = 'approved';

        $stmt = $pdo->prepare("INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$email, $password, $role, $status])) {
            echo "\nUtilisateur admin créé avec succès.\n";
        } else {
            echo "\nErreur lors de la création de l'utilisateur admin.\n";
        }
    }

} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}
