<?php
/**
 * Simple Connection Test
 */
echo "Testing database connection...\n";

// Database configuration
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    echo "❌ Connection failed: " . $conn->connect_error . "\n";
    echo "Host: $db_host\n";
    echo "User: $db_user\n";
    echo "Database: $db_name\n";
} else {
    echo "✅ Connected successfully!\n";
    
    // Test a simple query
    $result = $conn->query("SELECT VERSION() as version");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "MySQL Version: " . $row['version'] . "\n";
    }
    
    // Check if orders table exists
    $result = $conn->query("SHOW TABLES LIKE 'orders'");
    if ($result && $result->num_rows > 0) {
        echo "✅ Orders table exists\n";
    } else {
        echo "❌ Orders table not found\n";
    }
    
    $conn->close();
}
?>