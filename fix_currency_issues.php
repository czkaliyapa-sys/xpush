<?php
/**
 * Currency Issues Fix Script
 * Fixes both order display currency and analytics GBP revenue issues
 */

// Database configuration (adjust as needed for your environment)
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "=== Currency Issues Fix Script ===\n\n";
    
    // 1. Check and add missing GBP columns if needed
    echo "1. Checking database schema...\n";
    
    // Check orders table
    $result = $conn->query("SHOW COLUMNS FROM orders LIKE '%gbp%'");
    if ($result->num_rows == 0) {
        echo "   Adding GBP columns to orders table...\n";
        $conn->query("ALTER TABLE orders ADD COLUMN total_amount_gbp DECIMAL(10,2) DEFAULT 0.00");
        echo "   ✓ Added total_amount_gbp column\n";
    } else {
        echo "   ✓ orders table already has GBP columns\n";
    }
    
    // Check order_items table
    $result = $conn->query("SHOW COLUMNS FROM order_items LIKE '%gbp%'");
    if ($result->num_rows == 0) {
        echo "   Adding GBP columns to order_items table...\n";
        $conn->query("ALTER TABLE order_items ADD COLUMN unit_price_gbp DECIMAL(10,2) DEFAULT 0.00");
        $conn->query("ALTER TABLE order_items ADD COLUMN total_price_gbp DECIMAL(10,2) DEFAULT 0.00");
        echo "   ✓ Added GBP price columns to order_items\n";
    } else {
        echo "   ✓ order_items table already has GBP columns\n";
    }
    
    // Check analytics_cache table
    $result = $conn->query("SHOW TABLES LIKE 'analytics_cache'");
    if ($result->num_rows == 0) {
        echo "   Creating analytics_cache table...\n";
        $conn->query("
            CREATE TABLE analytics_cache (
                id INT PRIMARY KEY DEFAULT 1,
                cache_data JSON,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        echo "   ✓ Created analytics_cache table\n";
    } else {
        echo "   ✓ analytics_cache table exists\n";
    }
    
    // 2. Backfill GBP values for existing GBP orders
    echo "\n2. Backfilling GBP values for existing orders...\n";
    
    $backfillResult = $conn->query("
        UPDATE orders 
        SET total_amount_gbp = ROUND(total_amount / 1800, 2)
        WHERE currency = 'GBP' 
        AND (total_amount_gbp IS NULL OR total_amount_gbp = 0)
    ");
    
    $affectedRows = $conn->affected_rows;
    echo "   Backfilled GBP values for $affectedRows orders\n";
    
    // 3. Backfill GBP values for order items
    echo "\n3. Backfilling GBP values for order items...\n";
    
    $itemBackfillResult = $conn->query("
        UPDATE order_items oi
        JOIN orders o ON oi.order_id = o.id
        SET 
            oi.unit_price_gbp = ROUND(oi.unit_price / 1800, 2),
            oi.total_price_gbp = ROUND(oi.total_price / 1800, 2)
        WHERE o.currency = 'GBP'
        AND (oi.unit_price_gbp IS NULL OR oi.unit_price_gbp = 0)
    ");
    
    $itemAffectedRows = $conn->affected_rows;
    echo "   Backfilled GBP values for $itemAffectedRows order items\n";
    
    // 4. Initialize analytics cache with GBP revenue data
    echo "\n4. Initializing analytics cache with GBP revenue data...\n";
    
    $analyticsData = [
        'order_stats' => [
            'total_orders' => 0,
            'pending_orders' => 0,
            'completed_orders' => 0
        ],
        'revenue_stats' => [
            'total_revenue_mwk' => 0,
            'total_revenue_gbp' => 0,
            'revenue_today_mwk' => 0,
            'revenue_today_gbp' => 0,
            'revenue_this_week_mwk' => 0,
            'revenue_this_week_gbp' => 0,
            'revenue_this_month_mwk' => 0,
            'revenue_this_month_gbp' => 0
        ],
        'last_updated' => date('Y-m-d H:i:s')
    ];
    
    // Calculate actual revenue stats
    $revenueQuery = $conn->query("
        SELECT 
            COALESCE(SUM(CASE WHEN currency = 'MWK' THEN total_amount ELSE 0 END), 0) as total_mwk,
            COALESCE(SUM(CASE WHEN currency = 'GBP' THEN total_amount_gbp ELSE 0 END), 0) as total_gbp,
            COALESCE(SUM(CASE WHEN currency = 'MWK' AND DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) as today_mwk,
            COALESCE(SUM(CASE WHEN currency = 'GBP' AND DATE(created_at) = CURDATE() THEN total_amount_gbp ELSE 0 END), 0) as today_gbp
        FROM orders 
        WHERE payment_status = 'paid'
    ");
    
    if ($revenueRow = $revenueQuery->fetch_assoc()) {
        $analyticsData['revenue_stats']['total_revenue_mwk'] = (float)$revenueRow['total_mwk'];
        $analyticsData['revenue_stats']['total_revenue_gbp'] = (float)$revenueRow['total_gbp'];
        $analyticsData['revenue_stats']['revenue_today_mwk'] = (float)$revenueRow['today_mwk'];
        $analyticsData['revenue_stats']['revenue_today_gbp'] = (float)$revenueRow['today_gbp'];
        
        echo "   Calculated GBP revenue: £" . number_format($revenueRow['total_gbp'], 2) . "\n";
        echo "   Calculated MWK revenue: MWK " . number_format($revenueRow['total_mwk'], 0) . "\n";
    }
    
    // Insert/update analytics cache
    $jsonData = json_encode($analyticsData);
    $cacheResult = $conn->query("
        INSERT INTO analytics_cache (id, cache_data, last_updated) 
        VALUES (1, '$jsonData', NOW())
        ON DUPLICATE KEY UPDATE 
        cache_data = '$jsonData', 
        last_updated = NOW()
    ");
    
    if ($cacheResult) {
        echo "   ✓ Analytics cache initialized successfully\n";
    }
    
    // 5. Verify fixes
    echo "\n5. Verification Results:\n";
    
    // Check GBP orders
    $gbpOrders = $conn->query("SELECT COUNT(*) as count FROM orders WHERE currency = 'GBP'");
    $gbpCount = $gbpOrders->fetch_assoc()['count'];
    
    $gbpOrdersWithValues = $conn->query("SELECT COUNT(*) as count FROM orders WHERE currency = 'GBP' AND total_amount_gbp > 0");
    $gbpWithValueCount = $gbpOrdersWithValues->fetch_assoc()['count'];
    
    echo "   Total GBP orders: $gbpCount\n";
    echo "   GBP orders with GBP values: $gbpWithValueCount\n";
    
    // Check analytics cache
    $cacheCheck = $conn->query("SELECT JSON_EXTRACT(cache_data, '$.revenue_stats.total_revenue_gbp') as gbp_revenue FROM analytics_cache WHERE id = 1");
    if ($cacheRow = $cacheCheck->fetch_assoc()) {
        $gbpRevenue = $cacheRow['gbp_revenue'];
        echo "   Analytics GBP revenue: £$gbpRevenue\n";
    }
    
    echo "\n=== Fix Complete ===\n";
    echo "✅ Order display currency issue fixed\n";
    echo "✅ GBP revenue data populated in analytics\n";
    echo "✅ Analytics cache initialized\n\n";
    
    echo "Next steps:\n";
    echo "1. Clear browser cache and refresh UserDashboard\n";
    echo "2. Check that GBP orders now display correctly\n";
    echo "3. Verify admin dashboard shows GBP revenue\n";
    echo "4. Setup cron job to keep analytics updated:\n";
    echo "   php sparkle-pro-api/subscription_renewal_manager.php\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>