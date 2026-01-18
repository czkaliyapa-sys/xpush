<?php
/**
 * Quick Analytics Cache Fix
 * Updates the analytics cache to match current database values
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
    
    echo "=== QUICK ANALYTICS CACHE FIX ===\n\n";
    
    // Get actual database totals
    $dbTotals = $conn->query("
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid') as db_mwk_total,
            (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid') as db_mwk_gbp_total,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid') as db_gbp_total,
            (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid') as db_gbp_gbp_total
    ")->fetch_assoc();
    
    echo "Database Totals:\n";
    echo "- MWK Revenue: MWK " . number_format($dbTotals['db_mwk_total'], 0) . "\n";
    echo "- GBP Revenue (MWK orders): GBP " . number_format($dbTotals['db_mwk_gbp_total'], 2) . "\n";
    echo "- GBP Revenue (GBP orders): GBP " . number_format($dbTotals['db_gbp_gbp_total'], 2) . "\n";
    echo "- Total GBP Revenue: GBP " . number_format($dbTotals['db_mwk_gbp_total'] + $dbTotals['db_gbp_gbp_total'], 2) . "\n\n";
    
    // Update analytics cache
    $totalGbpRevenue = $dbTotals['db_mwk_gbp_total'] + $dbTotals['db_gbp_gbp_total'];
    
    $updateResult = $conn->query("
        UPDATE analytics_cache 
        SET revenue_stats = JSON_SET(revenue_stats,
            '$.mwk.total', {$dbTotals['db_mwk_total']},
            '$.gbp.total', $totalGbpRevenue,
            '$.mwk.today', 0,
            '$.gbp.today', 0
        )
        WHERE id = 1
    ");
    
    if ($updateResult) {
        echo "✅ Analytics cache updated successfully\n";
        echo "✅ GBP Revenue now shows: GBP " . number_format($totalGbpRevenue, 2) . "\n";
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