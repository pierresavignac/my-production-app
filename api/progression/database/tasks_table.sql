CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    client_number VARCHAR(50),
    po_number VARCHAR(50),
    representant VARCHAR(100),
    date_created DATETIME NOT NULL,
    date_soumission DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_task_code (task_code),
    INDEX idx_client_number (client_number),
    INDEX idx_po_number (po_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
