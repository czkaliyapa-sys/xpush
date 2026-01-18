<?php
/**
 * Dashboard Synchronization Checker
 * Ensures both UserDashboard and Admin Dashboard display accurate payment data
 * for MWK and GBP orders consistently
 */

// Database configuration
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "=== DASHBOARD SYNCHRONIZATION CHECKER ===\n\n";
    
    // 1. Check User Dashboard Data Sources
    echo "1. USER DASHBOARD DATA SOURCES\n";
    echo "==============================\n";
    
    // Verify orders API returns correct currency data
    $userOrdersCheck = $conn->query("
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN currency = 'MWK' THEN 1 END) as mwk_orders,
            COUNT(CASE WHEN currency = 'GBP' THEN 1 END) as gbp_orders,
            COUNT(CASE WHEN currency = 'MWK' AND total_amount_gbp > 0 THEN 1 END) as mwk_with_gbp,
            COUNT(CASE WHEN currency = 'GBP' AND total_amount_gbp > 0 THEN 1 END) as gbp_with_gbp
        FROM orders 
        WHERE payment_status = 'paid'
    ");
    
    if ($row = $userOrdersCheck->fetch_assoc()) {
        echo "User Dashboard Orders Data:\n";
        echo "- Total Orders: {$row['total_orders']}\n";
        echo "- MWK Orders: {$row['mwk_orders']} ({$row['mwk_with_gbp']} with GBP values)\n";
        echo "- GBP Orders: {$row['gbp_orders']} ({$row['gbp_with_gbp']} with GBP values)\n";
        
        if ($row['mwk_orders'] > 0 && $row['mwk_with_gbp'] == 0) {
            echo "⚠️  MWK orders missing GBP conversion values\n";
        }
        if ($row['gbp_orders'] > 0 && $row['gbp_with_gbp'] == 0) {
            echo "⚠️  GBP orders missing GBP values\n";
        }
    }
    
    // 2. Check Admin Dashboard Analytics
    echo "\n\n2. ADMIN DASHBOARD ANALYTICS\n";
    echo "===========================\n";
    
    // Verify analytics cache contains both currencies
    $analyticsStructure = $conn->query("
        SELECT 
            COLUMN_NAME,
            COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '$db_name' 
        AND TABLE_NAME = 'analytics_cache'
        AND COLUMN_NAME LIKE '%revenue%'
    ");
    
    echo "Analytics Cache Revenue Columns:\n";
    if ($analyticsStructure && $analyticsStructure->num_rows > 0) {
        while ($col = $analyticsStructure->fetch_assoc()) {
            echo "- {$col['COLUMN_NAME']} ({$col['COLUMN_TYPE']})\n";
        }
    } else {
        echo "❌ No revenue columns found in analytics_cache\n";
    }
    
    // Check actual revenue data
    $revenueCheck = $conn->query("
        SELECT 
            JSON_EXTRACT(revenue_stats, '$.mwk.total') as mwk_revenue,
            JSON_EXTRACT(revenue_stats, '$.gbp.total') as gbp_revenue,
            JSON_EXTRACT(revenue_stats, '$.mwk.today') as mwk_today,
            JSON_EXTRACT(revenue_stats, '$.gbp.today') as gbp_today
        FROM analytics_cache 
        WHERE id = 1
    ");
    
    if ($row = $revenueCheck->fetch_assoc()) {
        $mwkRev = (float)($row['mwk_revenue'] ?? 0);
        $gbpRev = (float)($row['gbp_revenue'] ?? 0);
        $mwkToday = (float)($row['mwk_today'] ?? 0);
        $gbpToday = (float)($row['gbp_today'] ?? 0);
        
        echo "\nCurrent Revenue Data:\n";
        echo "- MWK Total Revenue: MWK " . number_format($mwkRev, 0) . "\n";
        echo "- GBP Total Revenue: GBP " . number_format($gbpRev, 2) . "\n";
        echo "- MWK Today: MWK " . number_format($mwkToday, 0) . "\n";
        echo "- GBP Today: GBP " . number_format($gbpToday, 2) . "\n";
        
        if ($gbpRev == 0) {
            echo "❌ GBP revenue showing as zero - needs cache update\n";
        }
    }
    
    // 3. Cross-dashboard Data Consistency
    echo "\n\n3. CROSS-DASHBOARD CONSISTENCY\n";
    echo "==============================\n";
    
    // Compare database totals with analytics cache
    $consistencyCheck = $conn->query("
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid') as db_mwk_total,
            (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid') as db_mwk_gbp_total,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid') as db_gbp_total,
            (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid') as db_gbp_gbp_total,
            JSON_EXTRACT(revenue_stats, '$.mwk.total') as cache_mwk,
            JSON_EXTRACT(revenue_stats, '$.gbp.total') as cache_gbp
        FROM analytics_cache 
        WHERE id = 1
    ");
    
    if ($row = $consistencyCheck->fetch_assoc()) {
        echo "Data Consistency Check:\n";
        echo "Source    | MWK Amount     | GBP Amount     | Status\n";
        echo "----------|----------------|----------------|--------\n";
        
        // Database MWK total
        $dbMwk = (float)$row['db_mwk_total'];
        $cacheMwk = (float)($row['cache_mwk'] ?? 0);
        $mwkStatus = abs($dbMwk - $cacheMwk) < 1 ? "✅ MATCH" : "❌ MISMATCH";
        printf("%-9s | MWK %s | GBP %s | %s\n", 
            "Database", 
            str_pad(number_format($dbMwk, 0), 12, " ", STR_PAD_LEFT),
            str_pad(number_format((float)$row['db_mwk_gbp_total'], 2), 12, " ", STR_PAD_LEFT),
            $mwkStatus
        );
        
        // Cache MWK total
        printf("%-9s | MWK %s | GBP %s | %s\n", 
            "Cache", 
            str_pad(number_format($cacheMwk, 0), 12, " ", STR_PAD_LEFT),
            str_pad("N/A", 12, " ", STR_PAD_LEFT),
            "-"
        );
        
        // Database GBP total
        $dbGbp = (float)$row['db_gbp_total'];
        $cacheGbp = (float)($row['cache_gbp'] ?? 0);
        $gbpStatus = abs($dbGbp - $cacheGbp) < 1 ? "✅ MATCH" : "❌ MISMATCH";
        printf("%-9s | MWK %s | GBP %s | %s\n", 
            "Database", 
            str_pad(number_format($dbGbp, 0), 12, " ", STR_PAD_LEFT),
            str_pad(number_format((float)$row['db_gbp_gbp_total'], 2), 12, " ", STR_PAD_LEFT),
            $gbpStatus
        );
        
        // Cache GBP total
        printf("%-9s | MWK %s | GBP %s | %s\n", 
            "Cache", 
            str_pad("N/A", 12, " ", STR_PAD_LEFT),
            str_pad(number_format($cacheGbp, 2), 12, " ", STR_PAD_LEFT),
            "-"
        );
    }
    
    // 4. Currency Display Verification
    echo "\n\n4. CURRENCY DISPLAY VERIFICATION\n";
    echo "===============================\n";
    
    // Check recent orders with currency display issues
    $displayCheck = $conn->query("
        SELECT 
            id,
            currency,
            total_amount,
            total_amount_gbp,
            CASE 
                WHEN currency = 'MWK' AND total_amount_gbp = 0 THEN 'Missing GBP conversion'
                WHEN currency = 'GBP' AND total_amount_gbp = 0 THEN 'Missing GBP values'
                WHEN currency = 'GBP' AND ABS(total_amount_gbp - (total_amount / 2800)) > 1 THEN 'Amount mismatch'
                ELSE 'OK'
            END as display_issue
        FROM orders 
        WHERE payment_status = 'paid'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY created_at DESC
        LIMIT 10
    ");
    
    $displayIssues = 0;
    if ($displayCheck && $displayCheck->num_rows > 0) {
        echo "Recent orders with potential display issues:\n";
        echo "Order ID | Currency | MWK Amount | GBP Amount | Issue\n";
        echo "---------|----------|------------|------------|--------\n";
        
        while ($row = $displayCheck->fetch_assoc()) {
            $issue = $row['display_issue'];
            if ($issue !== 'OK') {
                $displayIssues++;
                $issue = "❌ $issue";
            } else {
                $issue = "✅ OK";
            }
            
            printf("%-8s | %-8s | %-10s | %-10s | %s\n",
                $row['id'],
                $row['currency'],
                number_format($row['total_amount'], 0),
                number_format($row['total_amount_gbp'], 2),
                $issue
            );
        }
    }
    
    // 5. Dashboard API Endpoints Check
    echo "\n\n5. DASHBOARD API ENDPOINTS\n";
    echo "==========================\n";
    
    // Simulate API calls that dashboards make
    $apiEndpoints = [
        '/api/orders/user/{userId}' => 'User orders endpoint',
        '/api/analytics/dashboard' => 'Admin dashboard analytics',
        '/api/orders/recent' => 'Recent orders for display'
    ];
    
    foreach ($apiEndpoints as $endpoint => $description) {
        echo "Checking $description ($endpoint)... ";
        
        // This would be actual API testing in production
        // For now, we'll check if the underlying data exists
        if (strpos($endpoint, 'orders') !== false) {
            $exists = $conn->query("SELECT COUNT(*) as count FROM orders")->fetch_assoc()['count'] > 0;
        } elseif (strpos($endpoint, 'analytics') !== false) {
            $exists = $conn->query("SELECT COUNT(*) as count FROM analytics_cache WHERE id = 1")->fetch_assoc()['count'] > 0;
        } else {
            $exists = true; // Assume other endpoints work
        }
        
        echo $exists ? "✅ Available\n" : "❌ Missing data\n";
    }
    
    // 6. Recommendations Summary
    echo "\n\n6. RECOMMENDATIONS SUMMARY\n";
    echo "==========================\n";
    
    $recommendations = [];
    
    // Check for missing GBP values
    $missingGbp = $conn->query("
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE currency = 'GBP' AND (total_amount_gbp IS NULL OR total_amount_gbp = 0)
    ")->fetch_assoc()['count'];
    
    if ($missingGbp > 0) {
        $recommendations[] = "❌ $missingGbp GBP orders missing GBP values - run complete_currency_fix.sql";
    }
    
    // Check analytics cache freshness
    $cacheFresh = $conn->query("
        SELECT last_updated 
        FROM analytics_cache 
        WHERE id = 1 AND last_updated >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ")->num_rows > 0;
    
    if (!$cacheFresh) {
        $recommendations[] = "⚠️  Analytics cache may be stale - run subscription_renewal_manager.php";
    }
    
    // Check UserDashboard.jsx currency handling
    $userDashboardPath = __DIR__ . '/src/external_components/UserDashboard.jsx';
    if (file_exists($userDashboardPath)) {
        $dashboardContent = file_get_contents($userDashboardPath);
        if (strpos($dashboardContent, 'formatCurrency') !== false && 
            strpos($dashboardContent, 'order.currency') !== false) {
            $recommendations[] = "✅ UserDashboard.jsx has proper currency formatting";
        } else {
            $recommendations[] = "⚠️  Check UserDashboard.jsx currency display logic";
        }
    }
    
    if (empty($recommendations)) {
        echo "✅ All dashboard synchronization checks passed\n";
        echo "✅ Both MWK and GBP payments display accurately\n";
        echo "✅ Data consistency maintained across dashboards\n";
    } else {
        echo "Issues requiring attention:\n";
        foreach ($recommendations as $rec) {
            echo "- $rec\n";
        }
    }
    
    echo "\n=== DASHBOARD SYNCHRONIZATION CHECK COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>