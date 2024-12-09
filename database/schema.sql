-- Table pour les tâches d'installation
CREATE TABLE IF NOT EXISTS installation_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    summary TEXT,
    description TEXT,
    amount DECIMAL(10, 2),
    client_number VARCHAR(50),
    quote_number VARCHAR(50),
    representative VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table pour l'édition des tâches d'installation
CREATE TABLE IF NOT EXISTS edited_installation_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    summary TEXT,
    description TEXT,
    amount DECIMAL(10, 2),
    client_number VARCHAR(50),
    quote_number VARCHAR(50),
    representative VARCHAR(100),
    edit_reason TEXT,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_by VARCHAR(100)
);

-- Table pour les feuilles de travail
CREATE TABLE IF NOT EXISTS work_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    summary TEXT,
    description TEXT,
    amount DECIMAL(10, 2),
    client_number VARCHAR(50),
    quote_number VARCHAR(50),
    representative VARCHAR(100),
    work_status VARCHAR(50),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
