-- Création de la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Création d'un utilisateur admin par défaut si la table est vide
-- Le mot de passe par défaut est 'admin123' (à changer immédiatement après la première connexion)
INSERT INTO users (email, password, role)
SELECT 'admin@example.com', '$2y$10$8i5Yp1jO5YVpB.9QU.XQOuj5k8yYl5xdE/0E5yIlJ6OYP.3vvKn6W', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');
