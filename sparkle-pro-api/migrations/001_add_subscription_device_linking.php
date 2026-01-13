<?php
/**
 * Database Migration: Add subscription device linking support
 * Run this file or execute the SQL statements in your MySQL database
 */

// Database connection (adjust as needed)
$servername = getenv('DB_HOST') ?: 'localhost';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';
$database = getenv('DB_NAME') ?: 'itsxtrapush';

try {
    $conn = new mysqli($servername, $username, $password, $database);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    echo "Connected successfully\n";
    
    // 1. Add fields to users table for device linking
    echo "\nAdding device linking fields to users table...\n";
    $alterUserSQL = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_linked_device_id INT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_linked_device_name VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_device_linked_date TIMESTAMP DEFAULT NULL"
    ];
    
    foreach ($alterUserSQL as $sql) {
        if ($conn->query($sql) === TRUE) {
            echo "✓ Executed: " . substr($sql, 0, 60) . "...\n";
        } else {
            echo "✗ Error: " . $conn->error . "\n";
        }
    }
    
    // 2. Create subscription_device_links table
    echo "\nCreating subscription_device_links table...\n";
    $createTableSQL = "
        CREATE TABLE IF NOT EXISTS subscription_device_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subscription_id VARCHAR(255) NOT NULL,
            device_id INT NOT NULL,
            order_id INT DEFAULT NULL,
            linked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            linked_by ENUM('AUTO_CHECKOUT', 'AUTO_RECENT', 'MANUAL') DEFAULT 'MANUAL',
            status ENUM('ACTIVE', 'INACTIVE', 'REPLACED') DEFAULT 'ACTIVE',
            notes TEXT,
            INDEX idx_user_id (user_id),
            INDEX idx_subscription_id (subscription_id),
            INDEX idx_device_id (device_id),
            INDEX idx_order_id (order_id),
            INDEX idx_status (status),
            UNIQUE KEY unique_active_link (user_id, subscription_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    if ($conn->query($createTableSQL) === TRUE) {
        echo "✓ subscription_device_links table created/verified\n";
    } else {
        echo "✗ Error: " . $conn->error . "\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
    $conn->close();
    
} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>
