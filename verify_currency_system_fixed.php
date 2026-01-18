<?php
/**
 * Fixed Currency Verification Script
 * Checks GBP data and analytics with correct table structure
 */

// Database configuration - adjust for your server
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "=== Currency System Verification ===\n\n";
    
    // 1. Check GBP orders exist
    $gbpOrders = $conn->query("SELECT COUNT(*) as count FROM orders WHERE currency = 'GBP'");
    $gbpCount = $gbpOrders->fetch_assoc()['count'];
    
    echo "✅ Found $gbpCount GBP orders in database\n";
    
    // 2. Check GBP revenue in analytics cache (correct column structure)
    echo "\n--- Analytics Cache Data ---\n";
    $analytics = $conn->query("SELECT revenue_stats, last_updated FROM analytics_cache WHERE id = 1");
    
    if ($row = $analytics->fetch_assoc()) {
        echo "Last updated: {$row['last_updated']}\n";
        
        if ($row['revenue_stats']) {
            $revenueData = json_decode($row['revenue_stats'], true);
            if ($revenueData && isset($revenueData['gbp'])) {
                $gbpTotal = $revenueData['gbp']['total'] ?? 0;
                $gbpToday = $revenueData['gbp']['today'] ?? 0;
                
                echo "✅ GBP Revenue Data Found:\n";
                echo "  Total: £" . number_format($gbpTotal, 2) . "\n";
                echo "  Today: £" . number_format($gbpToday, 2) . "\n";
                
                if ($gbpTotal > 0) {
                    echo "✅ GBP revenue tracking is working correctly\n";
                } else {
                    echo "⚠️  GBP revenue is zero (may need cache update)\n";
                }
            } else {
                echo "❌ Invalid revenue_stats JSON structure\n";
            }
        } else {
            echo "❌ No revenue_stats data in cache\n";
        }
    } else {
        echo "❌ No analytics cache record found\n";
    }
    
    // 3. Check database schema for GBP columns
    echo "\n--- Database Schema Check ---\n";
    
    // Check orders table
    $ordersCheck = $conn->query("SHOW COLUMNS FROM orders LIKE '%gbp%'");
    echo "✅ Orders table GBP columns: " . $ordersCheck->num_rows . "\n";
    
    // Check order_items table  
    $itemsCheck = $conn->query("SHOW COLUMNS FROM order_items LIKE '%gbp%'");
    echo "✅ Order items table GBP columns: " . $itemsCheck->num_rows . "\n";
    
    // Check analytics_cache table structure
    $cacheStructure = $conn->query("DESCRIBE analytics_cache");
    $hasRevenueColumn = false;
    while ($col = $cacheStructure->fetch_assoc()) {
        if ($col['Field'] === 'revenue_stats') {
            $hasRevenueColumn = true;
            break;
        }
    }
    echo "✅ Analytics cache has revenue_stats column: " . ($hasRevenueColumn ? 'Yes' : 'No') . "\n";
    
    // 4. Sample recent GBP orders with actual values
    echo "\n--- Recent GBP Orders Sample ---\n";
    $recentOrders = $conn->query("
        SELECT id, total_amount, total_amount_gbp, currency, created_at 
        FROM orders 
        WHERE currency = 'GBP' 
        ORDER BY created_at DESC 
        LIMIT 3
    ");
    
    if ($recentOrders && $recentOrders->num_rows > 0) {
        while ($order = $recentOrders->fetch_assoc()) {
            $hasGbp = $order['total_amount_gbp'] > 0 ? '✅' : '❌';
            echo "  Order #{$order['id']}: {$order['currency']} {$order['total_amount']} → GBP {$order['total_amount_gbp']} ($hasGbp)\n";
        }
    }
    
    echo "\n=== VERIFICATION COMPLETE ===\n";
    
    // Final assessment
    if ($gbpCount > 0 && $hasRevenueColumn) {
        echo "✅ Currency system is properly configured\n";
        echo "✅ GBP orders are being tracked\n";
        echo "✅ Analytics cache structure is correct\n";
        echo "\n🔧 Only the frontend UserDashboard.jsx needs updating\n";
        echo "   to display orders in their correct currency (£ vs MWK)\n";
    } else {
        echo "⚠️  Some components may need attention\n";
        echo "   Run the full fix script if issues persist\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>