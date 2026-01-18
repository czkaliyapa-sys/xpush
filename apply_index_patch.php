<?php
/**
 * Automated Index.php Patch Generator
 * Creates the exact changes needed for order creation logic
 */

// Read the current index.php file
$indexPath = __DIR__ . '/sparkle-pro-api/index.php';

if (!file_exists($indexPath)) {
    die("Error: Could not find index.php at $indexPath\n");
}

$content = file_get_contents($indexPath);

echo "=== Index.php Currency Fix Generator ===\n\n";

// Check if fix is already applied
if (strpos($content, 'total_amount_gbp') !== false && 
    strpos($content, '$totalAmountGbp') !== false) {
    echo "✅ Currency fix already applied to index.php\n";
    exit;
}

// Define the patches
$patches = [];

// 1. Add GBP calculation logic
$patches[] = [
    'search' => '$currencyDb = $currencyCode ?: \'MWK\';
                    $totalAmount = $amount;',
    'replace' => '$currencyDb = $currencyCode ?: \'MWK\';
                    $totalAmount = $amount;
                    
                    // Calculate GBP amount for the order
                    $totalAmountGbp = 0.00;
                    if ($currencyDb === \'GBP\') {
                        // If paying in GBP, use the amount as GBP value
                        $totalAmountGbp = $totalAmount;
                    } elseif (isset($items) && is_array($items)) {
                        // Calculate GBP total from individual item GBP prices
                        $calculatedGbpTotal = 0.00;
                        foreach ($items as $item) {
                            if (isset($item[\'price_gbp\']) && is_numeric($item[\'price_gbp\'])) {
                                $calculatedGbpTotal += (float)$item[\'price_gbp\'] * (int)($item[\'quantity\'] ?? 1);
                            }
                        }
                        $totalAmountGbp = $calculatedGbpTotal > 0 ? $calculatedGbpTotal : round($totalAmount / 1800, 2);
                    }'
];

// 2. Update INSERT statement
$patches[] = [
    'search' => '$stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");',
    'replace' => '$stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, total_amount_gbp, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");'
];

// 3. Update bind_param
$patches[] = [
    'search' => '$stmtIns->bind_param(\'issdsssssss\', $uidParam, $txRef, $provider, $totalAmount, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);',
    'replace' => '$stmtIns->bind_param(\'issddsssssss\', $uidParam, $txRef, $provider, $totalAmount, $totalAmountGbp, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);'
];

// Apply patches
$patched = false;
foreach ($patches as $index => $patch) {
    if (strpos($content, $patch['search']) !== false) {
        $content = str_replace($patch['search'], $patch['replace'], $content);
        echo "✅ Applied patch " . ($index + 1) . "\n";
        $patched = true;
    } else {
        echo "⚠️  Could not find pattern for patch " . ($index + 1) . "\n";
        echo "Search pattern: " . substr($patch['search'], 0, 50) . "...\n";
    }
}

if ($patched) {
    // Save the patched file
    $backupPath = $indexPath . '.backup.' . date('Ymd_His');
    copy($indexPath, $backupPath);
    echo "✅ Backup created: $backupPath\n";
    
    file_put_contents($indexPath, $content);
    echo "✅ index.php successfully patched\n";
    
    echo "\n=== PATCH SUMMARY ===\n";
    echo "1. Added GBP amount calculation logic\n";
    echo "2. Updated INSERT statement to include total_amount_gbp\n";
    echo "3. Updated parameter binding to include GBP amount\n";
    echo "4. Backup file created for safety\n";
    echo "\n✅ Currency fix applied successfully!\n";
} else {
    echo "❌ No patches could be applied. Please check the file manually.\n";
    echo "You may need to apply the changes manually using the instructions in manual_patch_instructions.php\n";
}
?>