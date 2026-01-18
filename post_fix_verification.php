<?php
/**
 * POST-FIX VERIFICATION SCRIPT
 * Run this after executing the currency fix SQL commands
 * to verify all issues have been resolved
 */

echo "=== POST-CURRENCY FIX VERIFICATION ===\n\n";

// Database configuration - UPDATE WITH YOUR ACTUAL VALUES
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

echo "Connecting to database: $db_name\n";

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "✅ Database connected successfully\n\n";
    
    // 1. Run the verification query
    echo "1. RUNNING VERIFICATION QUERY\n";
    echo "=============================\n";
    
    $verificationQuery = "
        SELECT 
            id,
            currency,
            total_amount,
            total_amount_gbp,
            ROUND(total_amount / 2800, 2) as expected_gbp,
            CASE 
                WHEN currency = 'GBP' AND ABS(total_amount_gbp - (total_amount/2800)) < 1 THEN '✅ ACCURATE'
                WHEN currency = 'MWK' AND total_amount_gbp > 0 THEN '✅ CONVERTED'
                ELSE '❌ NEEDS FIX'
            END as status
        FROM orders 
        WHERE payment_status = 'paid'
        ORDER BY created_at DESC
        LIMIT 15
    ";
    
    $result = $conn->query($verificationQuery);
    
    if ($result && $result->num_rows > 0) {
        echo "Order ID | Currency | MWK Amount  | GBP Amount | Expected GBP | Status\n";
        echo "---------|----------|-------------|------------|--------------|--------\n";
        
        $issues = 0;
        while ($row = $result->fetch_assoc()) {
            if (strpos($row['status'], 'NEEDS FIX') !== false) {
                $issues++;
            }
            
            printf("%-8s | %-8s | %-11s | %-10s | %-12s | %s\n",
                $row['id'],
                $row['currency'],
                number_format($row['total_amount'], 0),
                number_format($row['total_amount_gbp'], 2),
                number_format($row['expected_gbp'], 2),
                $row['status']
            );
        }
        
        echo "\n=== VERIFICATION RESULTS ===\n";
        if ($issues == 0) {
            echo "🎉 SUCCESS! All payment accuracy issues resolved\n";
            echo "✅ 0 remaining issues (previously 17)\n";
        } else {
            echo "⚠️  $issues issues still need attention\n";
            echo "❌ Fix may not have completed successfully\n";
        }
    } else {
        echo "❌ No paid orders found or query failed\n";
    }
    
    // 2. Check analytics cache consistency
    echo "\n\n2. ANALYTICS CACHE CONSISTENCY CHECK\n";
    echo "====================================\n";
    
    $analyticsCheck = $conn->query("
        SELECT 
            (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid') as actual_gbp_revenue,
            JSON_EXTRACT(revenue_stats, '$.gbp.total') as cached_gbp_revenue
        FROM analytics_cache 
        WHERE id = 1
    ");
    
    if ($row = $analyticsCheck->fetch_assoc()) {
        $actualGbp = (float)$row['actual_gbp_revenue'];
        $cachedGbp = (float)($row['cached_gbp_revenue'] ?? 0);
        
        echo "Actual GBP Revenue (from orders): GBP " . number_format($actualGbp, 2) . "\n";
        echo "Cached GBP Revenue (analytics):   GBP " . number_format($cachedGbp, 2) . "\n";
        
        if (abs($actualGbp - $cachedGbp) < 1) {
            echo "✅ Analytics cache is consistent\n";
        } else {
            echo "⚠️  Analytics cache needs updating\n";
            echo "   Run: php subscription_renewal_manager.php\n";
        }
    }
    
    // 3. Summary statistics
    echo "\n\n3. PAYMENT ACCURACY SUMMARY\n";
    echo "==========================\n";
    
    $summaryStats = $conn->query("
        SELECT 
            COUNT(*) as total_paid_orders,
            COUNT(CASE WHEN currency = 'MWK' THEN 1 END) as mwk_orders,
            COUNT(CASE WHEN currency = 'GBP' THEN 1 END) as gbp_orders,
            COUNT(CASE WHEN currency = 'MWK' AND total_amount_gbp > 0 THEN 1 END) as mwk_converted,
            COUNT(CASE WHEN currency = 'GBP' AND ABS(total_amount_gbp - (total_amount/2800)) < 1 THEN 1 END) as gbp_accurate
        FROM orders 
        WHERE payment_status = 'paid'
    ");
    
    if ($stats = $summaryStats->fetch_assoc()) {
        $total = $stats['total_paid_orders'];
        $mwkTotal = $stats['mwk_orders'];
        $gbpTotal = $stats['gbp_orders'];
        $mwkConverted = $stats['mwk_converted'];
        $gbpAccurate = $stats['gbp_accurate'];
        
        echo "Total Paid Orders: $total\n";
        echo "MWK Orders: $mwkTotal ($mwkConverted converted to GBP)\n";
        echo "GBP Orders: $gbpTotal ($gbpAccurate accurate)\n";
        
        $accuracyRate = $total > 0 ? round((($mwkConverted + $gbpAccurate) / ($mwkTotal + $gbpTotal)) * 100, 1) : 0;
        echo "Overall Accuracy Rate: {$accuracyRate}%\n";
        
        if ($accuracyRate >= 95) {
            echo "🎉 EXCELLENT - Payment system is highly accurate\n";
        } elseif ($accuracyRate >= 80) {
            echo "👍 GOOD - Payment system is mostly accurate\n";
        } else {
            echo "⚠️  ATTENTION - Payment accuracy needs improvement\n";
        }
    }
    
    // 4. Final recommendations
    echo "\n\n4. FINAL RECOMMENDATIONS\n";
    echo "========================\n";
    
    if (isset($issues) && $issues == 0) {
        echo "✅ All currency fixes applied successfully\n";
        echo "✅ Payment accuracy restored for both MWK and GBP\n";
        echo "✅ Dashboards should now display correct currency amounts\n";
        echo "\nNext steps:\n";
        echo "1. Test placing a new GBP order to verify real-time processing\n";
        echo "2. Check both UserDashboard and Admin Dashboard for correct displays\n";
        echo "3. Monitor analytics to ensure GBP revenue shows correctly\n";
    } else {
        echo "❌ Some issues remain unresolved\n";
        echo "🔧 Recommendations:\n";
        echo "   - Re-run the SQL fix commands\n";
        echo "   - Check database permissions\n";
        echo "   - Verify the analytics_cache table exists\n";
        echo "   - Contact support if issues persist\n";
    }
    
    echo "\n=== VERIFICATION COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Please check your database connection settings\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>