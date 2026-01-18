<?php
// Currency and Analytics Issue Diagnostic Script
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database connection
$host = 'localhost';
$user = 'xuser';
$password = 'Xpush2025?';
$database = 'itsxtrapush_db';

try {
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    echo "✅ Connected to database successfully\n\n";
    
    // Check 1: Verify dual currency columns exist
    echo "=== CHECKING DUAL CURRENCY COLUMNS ===\n";
    $result = $conn->query("SHOW COLUMNS FROM orders LIKE '%gbp%'");
    if ($result->num_rows > 0) {
        echo "✅ GBP columns found in orders table:\n";
        while ($row = $result->fetch_assoc()) {
            echo "  - " . $row['Field'] . "\n";
        }
    } else {
        echo "❌ No GBP columns found in orders table\n";
    }
    
    echo "\n=== CHECKING ORDER ITEMS GBP COLUMNS ===\n";
    $result = $conn->query("SHOW COLUMNS FROM order_items LIKE '%gbp%'");
    if ($result->num_rows > 0) {
        echo "✅ GBP columns found in order_items table:\n";
        while ($row = $result->fetch_assoc()) {
            echo "  - " . $row['Field'] . "\n";
        }
    } else {
        echo "❌ No GBP columns found in order_items table\n";
    }
    
    // Check 2: Verify GBP data exists
    echo "\n=== CHECKING GBP DATA POPULATION ===\n";
    $result = $conn->query("SELECT COUNT(*) as total_orders, COUNT(total_amount_gbp) as gbp_orders FROM orders WHERE total_amount > 0");
    $row = $result->fetch_assoc();
    echo "Total orders with amount: " . $row['total_orders'] . "\n";
    echo "Orders with GBP data: " . $row['gbp_orders'] . "\n";
    
    if ($row['gbp_orders'] == 0) {
        echo "❌ GBP data not populated - migration may not have run\n";
    } else {
        echo "✅ GBP data populated\n";
    }
    
    // Check 3: Sample GBP vs MWK data
    echo "\n=== SAMPLE ORDER DATA ===\n";
    $result = $conn->query("SELECT id, total_amount, total_amount_gbp, currency, created_at FROM orders WHERE total_amount > 0 ORDER BY created_at DESC LIMIT 5");
    while ($row = $result->fetch_assoc()) {
        echo "Order #" . $row['id'] . ":\n";
        echo "  MWK Amount: " . $row['total_amount'] . "\n";
        echo "  GBP Amount: " . ($row['total_amount_gbp'] ?? 'NULL') . "\n";
        echo "  Currency: " . $row['currency'] . "\n";
        echo "  Date: " . $row['created_at'] . "\n";
        echo "  ---\n";
    }
    
    // Check 4: Analytics cache status
    echo "\n=== ANALYTICS CACHE STATUS ===\n";
    $result = $conn->query("SELECT COUNT(*) as cache_exists FROM analytics_cache");
    $row = $result->fetch_assoc();
    if ($row['cache_exists'] > 0) {
        echo "✅ Analytics cache table exists\n";
        $result = $conn->query("SELECT last_updated FROM analytics_cache WHERE id = 1");
        $row = $result->fetch_assoc();
        if ($row) {
            echo "Last updated: " . $row['last_updated'] . "\n";
        }
    } else {
        echo "❌ Analytics cache table not found\n";
    }
    
    // Check 5: Recent GBP orders
    echo "\n=== RECENT GBP ORDERS ===\n";
    $result = $conn->query("SELECT id, total_amount, total_amount_gbp, currency, created_at FROM orders WHERE currency = 'GBP' AND total_amount > 0 ORDER BY created_at DESC LIMIT 5");
    if ($result->num_rows > 0) {
        echo "Found " . $result->num_rows . " GBP orders:\n";
        while ($row = $result->fetch_assoc()) {
            echo "  Order #" . $row['id'] . " - GBP " . $row['total_amount_gbp'] . " (MWK " . $row['total_amount'] . ")\n";
        }
    } else {
        echo "❌ No GBP currency orders found\n";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>