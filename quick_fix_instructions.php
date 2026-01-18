<?php
/**
 * Quick Currency Fix Verification
 * Shows exactly what needs to be fixed in your database
 */

echo "=== QUICK CURRENCY FIX VERIFICATION ===\n\n";

// Database configuration - YOU NEED TO UPDATE THESE VALUES
$db_host = 'YOUR_DATABASE_HOST';  // e.g., 'localhost' or your server IP
$db_user = 'YOUR_DATABASE_USER';  // e.g., 'xuser'
$db_pass = 'YOUR_DATABASE_PASSWORD';  // e.g., 'Xpush2025?'
$db_name = 'itsxtrapush_db';

echo "Database Configuration Needed:\n";
echo "- Host: $db_host\n";
echo "- User: $db_user\n";
echo "- Database: $db_name\n\n";

echo "To fix your payment accuracy issues, run these SQL commands:\n\n";

echo "1. BACKFILL MISSING GBP VALUES FOR GBP ORDERS:\n";
echo "-----------------------------------------------\n";
echo "UPDATE orders \n";
echo "SET total_amount_gbp = ROUND(total_amount / 1800, 2)\n";
echo "WHERE currency = 'GBP' \n";
echo "AND (total_amount_gbp IS NULL OR total_amount_gbp = 0);\n\n";

echo "2. BACKFILL MISSING GBP VALUES FOR MWK ORDERS:\n";
echo "-----------------------------------------------\n";
echo "UPDATE orders \n";
echo "SET total_amount_gbp = ROUND(total_amount / 1800, 2)\n";
echo "WHERE currency = 'MWK' \n";
echo "AND (total_amount_gbp IS NULL OR total_amount_gbp = 0);\n\n";

echo "3. BACKFILL ORDER ITEMS GBP VALUES:\n";
echo "-----------------------------------\n";
echo "UPDATE order_items oi\n";
echo "JOIN orders o ON oi.order_id = o.id\n";
echo "SET \n";
echo "    oi.unit_price_gbp = ROUND(oi.unit_price / 1800, 2),\n";
echo "    oi.total_price_gbp = ROUND(oi.total_price / 1800, 2)\n";
echo "WHERE o.currency IN ('GBP', 'MWK')\n";
echo "AND (oi.unit_price_gbp IS NULL OR oi.unit_price_gbp = 0);\n\n";

echo "4. VERIFY THE FIXES:\n";
echo "--------------------\n";
echo "SELECT \n";
echo "    id,\n";
echo "    currency,\n";
echo "    total_amount,\n";
echo "    total_amount_gbp,\n";
echo "    CASE \n";
echo "        WHEN currency = 'GBP' AND ABS(total_amount_gbp - (total_amount/1800)) < 1 THEN 'ACCURATE'\n";
echo "        WHEN currency = 'MWK' AND total_amount_gbp > 0 THEN 'CONVERTED'\n";
echo "        ELSE 'NEEDS FIX'\n";
echo "    END as status\n";
echo "FROM orders \n";
echo "WHERE payment_status = 'paid'\n";
echo "ORDER BY created_at DESC\n";
echo "LIMIT 10;\n\n";

echo "Expected Results After Fix:\n";
echo "==========================\n";
echo "- All GBP orders should show proper GBP values\n";
echo "- All MWK orders should show calculated GBP equivalents\n";
echo "- No 'MISMATCH' or 'MISSING_GBP' statuses\n";
echo "- Analytics will automatically update within 1 hour\n\n";

echo "=== MANUAL FIX INSTRUCTIONS ===\n";
echo "1. Connect to your database (phpMyAdmin, MySQL CLI, etc.)\n";
echo "2. Select the 'itsxtrapush_db' database\n";
echo "3. Run the SQL commands above in order\n";
echo "4. Run the verification query to confirm fixes\n";
echo "5. Wait 1 hour or run subscription_renewal_manager.php for immediate analytics update\n\n";

echo "After running these fixes, your payment accuracy should show:\n";
echo "✅ 0 payment accuracy issues\n";
echo "✅ Proper GBP/MWK conversions\n";
echo "✅ Consistent dashboard displays\n";
echo "✅ Accurate analytics reporting\n";
?>