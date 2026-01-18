<?php
// Simplified diagnostic script to test subscription renewal manager
echo "Starting diagnostic at " . date('Y-m-d H:i:s') . "\n";

// Test 1: Check PHP version and extensions
echo "PHP Version: " . phpversion() . "\n";
echo "MySQLi extension: " . (extension_loaded('mysqli') ? '✓ Loaded' : '✗ Missing') . "\n";
echo "SAPI: " . php_sapi_name() . "\n";

// Test 2: Check database connection
echo "\n--- Testing Database Connection ---\n";
try {
    $db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');
    
    if ($db->connect_error) {
        echo "❌ Database connection failed: " . $db->connect_error . "\n";
        exit(1);
    }
    
    echo "✅ Database connected successfully\n";
    $db->set_charset('utf8mb4');
    
    // Test 3: Simple query
    echo "\n--- Testing Simple Query ---\n";
    $result = $db->query("SELECT COUNT(*) as count FROM users");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "✅ Users table accessible. Total users: " . $row['count'] . "\n";
    } else {
        echo "❌ Query failed: " . $db->error . "\n";
        exit(1);
    }
    
    // Test 4: Check subscription tables
    echo "\n--- Testing Subscription Tables ---\n";
    $tables = ['users', 'subscription_history'];
    foreach ($tables as $table) {
        $result = $db->query("SHOW TABLES LIKE '$table'");
        if ($result && $result->num_rows > 0) {
            echo "✅ Table $table exists\n";
        } else {
            echo "❌ Table $table missing\n";
        }
    }
    
    $db->close();
    echo "\n✅ All tests passed!\n";
    exit(0);
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
} catch (Error $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
}
?>