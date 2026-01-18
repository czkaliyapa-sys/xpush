<?php
/**
 * CORRECTED Currency Fix with 1 GBP = 2800 MWK
 * Updated payment accuracy fix using the correct exchange rate
 */

echo "=== CORRECTED CURRENCY FIX (1 GBP = 2800 MWK) ===\n\n";

echo "Database Configuration Needed:\n";
echo "- Host: YOUR_DATABASE_HOST\n";
echo "- User: YOUR_DATABASE_USER\n";
echo "- Database: itsxtrapush_db\n\n";

echo "RUN THESE SQL COMMANDS WITH CORRECT EXCHANGE RATE:\n\n";

echo "1. FIX GBP ORDERS WITH WRONG GBP VALUES:\n";
echo "----------------------------------------\n";
echo "-- Using correct rate: 1 GBP = 2800 MWK\n";
echo "UPDATE orders \n";
echo "SET total_amount_gbp = ROUND(total_amount / 2800, 2)\n";
echo "WHERE currency = 'GBP' \n";
echo "AND (total_amount_gbp IS NULL OR total_amount_gbp = 0 OR ABS(total_amount_gbp - (total_amount / 2800)) > 1);\n\n";

echo "2. ADD GBP CONVERSIONS FOR MWK ORDERS:\n";
echo "-------------------------------------\n";
echo "-- Convert MWK orders to GBP equivalents\n";
echo "UPDATE orders \n";
echo "SET total_amount_gbp = ROUND(total_amount / 2800, 2)\n";
echo "WHERE currency = 'MWK' \n";
echo "AND (total_amount_gbp IS NULL OR total_amount_gbp = 0);\n\n";

echo "3. FIX ORDER ITEMS GBP VALUES:\n";
echo "-----------------------------\n";
echo "-- Apply correct conversion to individual items\n";
echo "UPDATE order_items oi\n";
echo "JOIN orders o ON oi.order_id = o.id\n";
echo "SET \n";
echo "    oi.unit_price_gbp = ROUND(oi.unit_price / 2800, 2),\n";
echo "    oi.total_price_gbp = ROUND(oi.total_price / 2800, 2)\n";
echo "WHERE o.currency IN ('GBP', 'MWK')\n";
echo "AND (oi.unit_price_gbp IS NULL OR oi.unit_price_gbp = 0);\n\n";

echo "4. UPDATE ANALYTICS CACHE WITH CORRECT VALUES:\n";
echo "---------------------------------------------\n";
echo "-- Recalculate GBP revenue with correct rate\n";
echo "UPDATE analytics_cache \n";
echo "SET revenue_stats = JSON_SET(revenue_stats,\n";
echo "    '$.gbp.total', (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid'),\n";
echo "    '$.gbp.today', (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid' AND DATE(created_at) = CURDATE())\n";
echo ")\n";
echo "WHERE id = 1;\n\n";

echo "5. VERIFICATION QUERY:\n";
echo "---------------------\n";
echo "SELECT \n";
echo "    id,\n";
echo "    currency,\n";
echo "    total_amount,\n";
echo "    total_amount_gbp,\n";
echo "    ROUND(total_amount / 2800, 2) as expected_gbp,\n";
echo "    CASE \n";
echo "        WHEN currency = 'GBP' AND ABS(total_amount_gbp - (total_amount/2800)) < 1 THEN '✅ ACCURATE'\n";
echo "        WHEN currency = 'MWK' AND total_amount_gbp > 0 THEN '✅ CONVERTED'\n";
echo "        ELSE '❌ NEEDS FIX'\n";
echo "    END as status\n";
echo "FROM orders \n";
echo "WHERE payment_status = 'paid'\n";
echo "ORDER BY created_at DESC\n";
echo "LIMIT 10;\n\n";

echo "EXAMPLE CALCULATIONS WITH 1 GBP = 2800 MWK:\n";
echo "==========================================\n";
echo "MWK 28,000 = GBP 10.00\n";
echo "MWK 56,000 = GBP 20.00\n";
echo "MWK 140,000 = GBP 50.00\n";
echo "MWK 280,000 = GBP 100.00\n\n";

echo "EXPECTED RESULTS AFTER FIX:\n";
echo "==========================\n";
echo "- Order #19: MWK 129,900.00 → GBP " . number_format(129900/2800, 2) . " (was showing GBP 72.17)\n";
echo "- All MWK orders will show proper GBP equivalents\n";
echo "- GBP orders will show correct GBP values\n";
echo "- Analytics revenue will reflect accurate GBP totals\n";
echo "- 0 payment accuracy issues remaining\n\n";

echo "=== ACTION PLAN ===\n";
echo "1. Connect to your database\n";
echo "2. Run SQL commands 1-4 in order\n";
echo "3. Run verification query to confirm fixes\n";
echo "4. Run subscription_renewal_manager.php to update analytics immediately\n";
echo "5. Test placing new orders to verify real-time processing\n\n";

echo "After these fixes, your system will:\n";
echo "✅ Process payments accurately for both MWK and GBP\n";
echo "✅ Display correct currency amounts in both dashboards\n";
echo "✅ Show accurate revenue analytics for both regions\n";
echo "✅ Maintain data consistency across all components\n";
?>