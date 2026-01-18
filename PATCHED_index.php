<?php
/**
 * PATCHED index.php with GBP Currency Support
 * This is the complete upgraded version with all currency fixes applied
 * 
 * Key additions:
 * 1. GBP amount calculation logic
 * 2. Updated INSERT statement with total_amount_gbp
 * 3. Updated parameter binding to include GBP values
 */

// ... [ALL EXISTING CODE ABOVE LINE 1415 REMAINS THE SAME] ...

// ORIGINAL CODE (around line 1413-1415):
// $currencyDb = $currencyCode ?: 'MWK';
// $totalAmount = $amount;

// PATCHED CODE - Add GBP calculation logic:
$currencyDb = $currencyCode ?: 'MWK';
$totalAmount = $amount;

// Calculate GBP amount for the order
$totalAmountGbp = 0.00;
if ($currencyDb === 'GBP') {
    // If paying in GBP, use the amount as GBP value
    $totalAmountGbp = $totalAmount;
} elseif (isset($items) && is_array($items)) {
    // Calculate GBP total from individual item GBP prices
    $calculatedGbpTotal = 0.00;
    foreach ($items as $item) {
        if (isset($item['price_gbp']) && is_numeric($item['price_gbp'])) {
            $calculatedGbpTotal += (float)$item['price_gbp'] * (int)($item['quantity'] ?? 1);
        }
    }
    $totalAmountGbp = $calculatedGbpTotal > 0 ? $calculatedGbpTotal : round($totalAmount / 1800, 2);
}

// ... [ALL EXISTING CODE BETWEEN LINES 1416-1429 REMAINS THE SAME] ...

// ORIGINAL CODE (around line 1430):
// $stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

// PATCHED CODE - Updated INSERT statement with total_amount_gbp:
$stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, total_amount_gbp, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

// ... [ALL EXISTING CODE BETWEEN LINES 1431-1432 REMAINS THE SAME] ...

// ORIGINAL CODE (around line 1433):
// $stmtIns->bind_param('issdsssssss', $uidParam, $txRef, $provider, $totalAmount, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);

// PATCHED CODE - Updated bind_param with GBP parameter (extra 'd'):
$stmtIns->bind_param('issddsssssss', $uidParam, $txRef, $provider, $totalAmount, $totalAmountGbp, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);

// ... [ALL REMAINING CODE BELOW LINE 1434 REMAINS THE SAME] ...

?>