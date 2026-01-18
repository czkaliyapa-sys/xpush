<?php
/**
 * TARGETED GBP REVENUE FIX
 * Corrects the analytics cache GBP revenue calculation
 */

$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "=== TARGETED GBP REVENUE FIX ===\n\n";
    
    // Get the correct GBP revenue breakdown
    $revenueBreakdown = $conn->query("
        SELECT 
            SUM(CASE WHEN currency = 'GBP' THEN total_amount_gbp ELSE 0 END) as gbp_from_gbp_orders,
            SUM(CASE WHEN currency = 'MWK' THEN total_amount_gbp ELSE 0 END) as gbp_from_mwk_orders,
            SUM(CASE WHEN currency = 'GBP' THEN total_amount_gbp ELSE 0 END) + 
            SUM(CASE WHEN currency = 'MWK' THEN total_amount_gbp ELSE 0 END) as total_gbp_revenue
        FROM orders 
        WHERE payment_status = 'paid'
    ")->fetch_assoc();
    
    echo "Revenue Breakdown:\n";
    echo "- GBP from GBP orders: GBP " . number_format($revenueBreakdown['gbp_from_gbp_orders'], 2) . "\n";
    echo "- GBP from MWK orders: GBP " . number_format($revenueBreakdown['gbp_from_mwk_orders'], 2) . "\n";
    echo "- Total GBP Revenue: GBP " . number_format($revenueBreakdown['total_gbp_revenue'], 2) . "\n\n";
    
    // Update analytics cache with correct values
    $updateResult = $conn->query("
        UPDATE analytics_cache 
        SET revenue_stats = JSON_SET(revenue_stats,
            '$.gbp.total', {$revenueBreakdown['total_gbp_revenue']},
            '$.gbp.today', 0
        )
        WHERE id = 1
    ");
    
    if ($updateResult) {
        echo "✅ Analytics cache GBP revenue updated successfully\n";
        echo "✅ GBP Revenue now: GBP " . number_format($revenueBreakdown['total_gbp_revenue'], 2) . "\n";
    } else {
        echo "❌ Failed to update analytics cache\n";
    }
    
    echo "\n=== FIX COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>