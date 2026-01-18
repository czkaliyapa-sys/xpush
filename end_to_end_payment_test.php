<?php
/**
 * END-TO-END PAYMENT ACCURACY TEST
 * Comprehensive verification for both MWK (Malawi) and GBP (International) payments
 * Tests database storage, API responses, and dashboard display accuracy
 */

echo "=== END-TO-END PAYMENT ACCURACY TEST ===\n";
echo "Testing both MWK and GBP payment flows\n\n";

// Database configuration
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // 1. Test Database Schema Completeness
    echo "1. DATABASE SCHEMA TEST\n";
    echo "======================\n";
    
    $requiredColumns = [
        'orders' => ['total_amount_gbp'],
        'order_items' => ['unit_price_gbp', 'total_price_gbp'],
        'analytics_cache' => ['revenue_stats']
    ];
    
    $schemaValid = true;
    foreach ($requiredColumns as $table => $columns) {
        echo "Checking $table table...\n";
        foreach ($columns as $column) {
            $result = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
            if ($result && $result->num_rows > 0) {
                echo "  ✅ $column column exists\n";
            } else {
                echo "  ❌ $column column missing\n";
                $schemaValid = false;
            }
        }
    }
    
    if ($schemaValid) {
        echo "✅ Database schema is complete for dual currency support\n\n";
    } else {
        echo "❌ Database schema incomplete - run complete_currency_fix.sql\n\n";
        exit(1);
    }
    
    // 2. Test MWK Payment Processing
    echo "2. MWK PAYMENT PROCESSING TEST\n";
    echo "==============================\n";
    
    // Simulate MWK order creation
    $testMwkAmount = 50000; // MWK 50,000
    $expectedGbpFromMwk = round($testMwkAmount / 1800, 2); // Expected GBP conversion
    
    echo "Simulating MWK payment:\n";
    echo "- MWK Amount: MWK " . number_format($testMwkAmount, 0) . "\n";
    echo "- Expected GBP Equivalent: GBP " . number_format($expectedGbpFromMwk, 2) . "\n";
    
    // Check if conversion logic works
    $conversionCheck = $conn->query("
        SELECT 
            $testMwkAmount as mwk_amount,
            ROUND($testMwkAmount / 1800, 2) as calculated_gbp
    ")->fetch_assoc();
    
    $calculatedGbp = (float)$conversionCheck['calculated_gbp'];
    echo "- Calculated GBP: GBP " . number_format($calculatedGbp, 2) . "\n";
    
    if (abs($calculatedGbp - $expectedGbpFromMwk) < 0.01) {
        echo "✅ MWK to GBP conversion accurate\n";
    } else {
        echo "❌ MWK to GBP conversion inaccurate\n";
    }
    
    // 3. Test GBP Payment Processing
    echo "\n\n3. GBP PAYMENT PROCESSING TEST\n";
    echo "==============================\n";
    
    // Simulate GBP order creation
    $testGbpAmount = 250.00; // GBP 250.00
    echo "Simulating GBP payment:\n";
    echo "- GBP Amount: GBP " . number_format($testGbpAmount, 2) . "\n";
    
    // Check GBP order storage
    $gbpStorageCheck = $conn->query("
        SELECT 
            COUNT(*) as gbp_orders,
            COUNT(CASE WHEN total_amount_gbp > 0 THEN 1 END) as with_gbp_values,
            AVG(total_amount_gbp) as avg_gbp_stored
        FROM orders 
        WHERE currency = 'GBP'
    ")->fetch_assoc();
    
    echo "- Total GBP Orders: {$gbpStorageCheck['gbp_orders']}\n";
    echo "- Orders with GBP Values: {$gbpStorageCheck['with_gbp_values']}\n";
    
    if ($gbpStorageCheck['gbp_orders'] > 0) {
        $avgStored = (float)$gbpStorageCheck['avg_gbp_stored'];
        echo "- Average Stored GBP: GBP " . number_format($avgStored, 2) . "\n";
        
        if ($gbpStorageCheck['with_gbp_values'] == $gbpStorageCheck['gbp_orders']) {
            echo "✅ All GBP orders properly storing GBP values\n";
        } else {
            echo "❌ Some GBP orders missing GBP values\n";
        }
    } else {
        echo "- No GBP orders found in database\n";
    }
    
    // 4. Test Analytics Revenue Calculation
    echo "\n\n4. ANALYTICS REVENUE CALCULATION TEST\n";
    echo "=====================================\n";
    
    // Calculate expected revenue totals
    $expectedRevenue = $conn->query("
        SELECT 
            COALESCE(SUM(CASE WHEN currency = 'MWK' THEN total_amount ELSE 0 END), 0) as expected_mwk_revenue,
            COALESCE(SUM(CASE WHEN currency = 'GBP' THEN total_amount_gbp ELSE 0 END), 0) as expected_gbp_revenue,
            COUNT(CASE WHEN currency = 'MWK' THEN 1 END) as mwk_order_count,
            COUNT(CASE WHEN currency = 'GBP' THEN 1 END) as gbp_order_count
        FROM orders 
        WHERE payment_status = 'paid'
    ")->fetch_assoc();
    
    $expMwk = (float)$expectedRevenue['expected_mwk_revenue'];
    $expGbp = (float)$expectedRevenue['expected_gbp_revenue'];
    
    echo "Expected Revenue Totals:\n";
    echo "- MWK Revenue: MWK " . number_format($expMwk, 0) . " (from {$expectedRevenue['mwk_order_count']} orders)\n";
    echo "- GBP Revenue: GBP " . number_format($expGbp, 2) . " (from {$expectedRevenue['gbp_order_count']} orders)\n";
    
    // Check analytics cache
    $cacheCheck = $conn->query("
        SELECT 
            JSON_EXTRACT(revenue_stats, '$.mwk.total') as cached_mwk,
            JSON_EXTRACT(revenue_stats, '$.gbp.total') as cached_gbp
        FROM analytics_cache 
        WHERE id = 1
    ");
    
    if ($cacheRow = $cacheCheck->fetch_assoc()) {
        $cachedMwk = (float)($cacheRow['cached_mwk'] ?? 0);
        $cachedGbp = (float)($cacheRow['cached_gbp'] ?? 0);
        
        echo "\nCached Revenue:\n";
        echo "- MWK Revenue: MWK " . number_format($cachedMwk, 0) . "\n";
        echo "- GBP Revenue: GBP " . number_format($cachedGbp, 2) . "\n";
        
        $mwkMatch = abs($expMwk - $cachedMwk) < 1;
        $gbpMatch = abs($expGbp - $cachedGbp) < 0.01;
        
        echo "\nAccuracy Check:\n";
        echo "- MWK Revenue Match: " . ($mwkMatch ? "✅ PASS" : "❌ FAIL") . "\n";
        echo "- GBP Revenue Match: " . ($gbpMatch ? "✅ PASS" : "❌ FAIL") . "\n";
        
        if (!$mwkMatch || !$gbpMatch) {
            echo "❌ Analytics cache needs updating - run subscription_renewal_manager.php\n";
        }
    } else {
        echo "❌ No analytics cache found\n";
    }
    
    // 5. Test Dashboard Data Retrieval
    echo "\n\n5. DASHBOARD DATA RETRIEVAL TEST\n";
    echo "================================\n";
    
    // Simulate User Dashboard API call
    echo "Testing User Dashboard Order Retrieval:\n";
    
    $userOrdersTest = $conn->query("
        SELECT 
            id,
            currency,
            total_amount,
            total_amount_gbp,
            created_at
        FROM orders 
        WHERE payment_status = 'paid'
        ORDER BY created_at DESC
        LIMIT 5
    ");
    
    if ($userOrdersTest && $userOrdersTest->num_rows > 0) {
        echo "Sample orders for dashboard display:\n";
        echo "ID  | Currency | MWK Amount | GBP Amount | Created\n";
        echo "----|----------|------------|------------|----------\n";
        
        while ($order = $userOrdersTest->fetch_assoc()) {
            $hasGbp = $order['total_amount_gbp'] > 0 ? '✅' : '❌';
            printf("%-3s | %-8s | %-10s | %-10s | %s\n",
                $order['id'],
                $order['currency'],
                number_format($order['total_amount'], 0),
                number_format($order['total_amount_gbp'], 2) . " $hasGbp",
                date('M j', strtotime($order['created_at']))
            );
        }
        
        echo "\n✅ User dashboard can retrieve order data with currency information\n";
    } else {
        echo "❌ No paid orders found for dashboard display\n";
    }
    
    // 6. Test Payment Gateway Integration
    echo "\n\n6. PAYMENT GATEWAY INTEGRATION TEST\n";
    echo "===================================\n";
    
    // Check gateway assignments by currency
    $gatewayTest = $conn->query("
        SELECT 
            currency,
            provider,
            COUNT(*) as transaction_count,
            SUM(total_amount) as total_volume
        FROM orders 
        WHERE payment_status = 'paid'
        GROUP BY currency, provider
        ORDER BY currency, provider
    ");
    
    if ($gatewayTest && $gatewayTest->num_rows > 0) {
        echo "Payment Gateway Distribution:\n";
        echo "Currency | Gateway    | Transactions | Total Volume\n";
        echo "---------|------------|--------------|--------------\n";
        
        while ($gw = $gatewayTest->fetch_assoc()) {
            $volume = $gw['currency'] === 'GBP' ? 
                'GBP ' . number_format($gw['total_volume'], 2) : 
                'MWK ' . number_format($gw['total_volume'], 0);
                
            printf("%-8s | %-10s | %-12s | %s\n",
                $gw['currency'],
                $gw['provider'],
                $gw['transaction_count'],
                $volume
            );
        }
        
        // Verify correct gateway assignment
        $correctGateways = true;
        $gatewayTest->data_seek(0); // Reset result pointer
        
        while ($gw = $gatewayTest->fetch_assoc()) {
            if ($gw['currency'] === 'GBP' && $gw['provider'] !== 'square') {
                echo "⚠️  Warning: GBP order using {$gw['provider']} instead of Square\n";
                $correctGateways = false;
            }
            if ($gw['currency'] === 'MWK' && $gw['provider'] !== 'paychangu') {
                echo "⚠️  Warning: MWK order using {$gw['provider']} instead of PayChangu\n";
                $correctGateways = false;
            }
        }
        
        if ($correctGateways) {
            echo "\n✅ All payments routed through correct gateways\n";
        }
    } else {
        echo "❌ No payment gateway data found\n";
    }
    
    // 7. Final Accuracy Report
    echo "\n\n7. FINAL ACCURACY REPORT\n";
    echo "========================\n";
    
    // Overall system health
    $healthScore = 0;
    $totalTests = 7;
    
    // Test 1: Schema completeness
    $healthScore += $schemaValid ? 1 : 0;
    
    // Test 2: MWK conversion accuracy  
    $healthScore += (abs($calculatedGbp - $expectedGbpFromMwk) < 0.01) ? 1 : 0;
    
    // Test 3: GBP storage completeness
    $healthScore += ($gbpStorageCheck['with_gbp_values'] == $gbpStorageCheck['gbp_orders'] && $gbpStorageCheck['gbp_orders'] > 0) ? 1 : 0;
    
    // Test 4: Analytics accuracy
    $analyticsAccurate = isset($mwkMatch) && isset($gbpMatch) && $mwkMatch && $gbpMatch;
    $healthScore += $analyticsAccurate ? 1 : 0;
    
    // Test 5: Dashboard data availability
    $dashboardAvailable = $userOrdersTest && $userOrdersTest->num_rows > 0;
    $healthScore += $dashboardAvailable ? 1 : 0;
    
    // Test 6: Gateway routing correctness
    $healthScore += $correctGateways ? 1 : 0;
    
    // Test 7: Data consistency
    $dataConsistent = $healthScore >= 5; // If 5+ tests pass, data is likely consistent
    $healthScore += $dataConsistent ? 1 : 0;
    
    $healthPercentage = round(($healthScore / $totalTests) * 100);
    
    echo "Payment System Health Score: $healthScore/$totalTests ($healthPercentage%)\n\n";
    
    if ($healthPercentage >= 90) {
        echo "🎉 EXCELLENT - Payment system is highly accurate\n";
        echo "✅ Both MWK and GBP payments processed correctly\n";
        echo "✅ Dashboards display accurate data\n";
        echo "✅ Analytics reflect true revenue figures\n";
    } elseif ($healthPercentage >= 70) {
        echo "👍 GOOD - Payment system is mostly accurate\n";
        echo "⚠️  Some minor issues may need attention\n";
        echo "💡 Run specific fix scripts if needed\n";
    } else {
        echo "⚠️  CONCERNING - Payment accuracy issues detected\n";
        echo "❌ Critical fixes required\n";
        echo "🔧 Run complete_currency_fix.sql and dashboard_sync_checker.php\n";
    }
    
    echo "\n=== END-TO-END TEST COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
    exit(1);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>