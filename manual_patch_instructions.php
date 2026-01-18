<?php
/**
 * Manual Patch Instructions for index.php
 * 
 * This file contains the exact changes needed for index.php
 * to properly handle GBP order creation
 */

echo "=== Manual Patch Instructions for index.php ===\n\n";

echo "1. Locate the order creation section (around line 1430)\n";
echo "2. Find this INSERT statement:\n";
echo '   $stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");' . "\n\n";

echo "3. REPLACE it with this updated version:\n";
echo '$stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, total_amount_gbp, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");' . "\n\n";

echo "4. Find the bind_param line (around line 1433):\n";
echo '   $stmtIns->bind_param(\'issdsssssss\', $uidParam, $txRef, $provider, $totalAmount, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);' . "\n\n";

echo "5. REPLACE it with this updated version:\n";
echo '$stmtIns->bind_param(\'issddsssssss\', $uidParam, $txRef, $provider, $totalAmount, $totalAmountGbp, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);' . "\n\n";

echo "6. Add this GBP calculation logic BEFORE the INSERT statement (around line 1415):\n";
echo '// Calculate GBP amount for the order' . "\n";
echo '$totalAmountGbp = 0.00;' . "\n";
echo 'if ($currencyDb === \'GBP\') {' . "\n";
echo '    // If paying in GBP, use the amount as GBP value' . "\n";
echo '    $totalAmountGbp = $totalAmount;' . "\n";
echo '} elseif (isset($items) && is_array($items)) {' . "\n";
echo '    // Calculate GBP total from individual item GBP prices' . "\n";
echo '    $calculatedGbpTotal = 0.00;' . "\n";
echo '    foreach ($items as $item) {' . "\n";
echo '        if (isset($item[\'price_gbp\']) && is_numeric($item[\'price_gbp\'])) {' . "\n";
echo '            $calculatedGbpTotal += (float)$item[\'price_gbp\'] * (int)($item[\'quantity\'] ?? 1);' . "\n";
echo '        }' . "\n";
echo '    }' . "\n";
echo '    $totalAmountGbp = $calculatedGbpTotal > 0 ? $calculatedGbpTotal : round($totalAmount / 1800, 2);' . "\n";
echo '}' . "\n\n";

echo "7. Also update the UPDATE statement (if exists) to handle GBP values\n";
echo "   Look for any order update statements and add total_amount_gbp handling\n\n";

echo "=== Verification Query ===\n";
echo "After applying the patch, run this to verify:\n";
echo "SELECT id, total_amount, total_amount_gbp, currency, created_at \n";
echo "FROM orders \n";
echo "WHERE currency = 'GBP' \n";
echo "ORDER BY created_at DESC \n";
echo "LIMIT 5;\n\n";

echo "Expected result: New GBP orders should show both MWK and GBP amounts populated\n";
?>