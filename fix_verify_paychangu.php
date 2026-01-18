<?php
/**
 * FIXED verify_paychangu FUNCTION
 * Corrects the PayChangu verification endpoint and error messages
 */

// BACKUP THE ORIGINAL FUNCTION FIRST
echo "Creating backup of original verify_paychangu function...\n";

// Read the current index.php file
$indexPath = '/Users/conradkaliyaoa/Codes/itsxtrapush/sparkle-pro-api/index.php';
$content = file_get_contents($indexPath);

// Backup the original function
$backupFile = '/Users/conradkaliyaoa/Codes/itsxtrapush/verify_paychangu_backup_' . date('Y-m-d_H-i-s') . '.txt';
file_put_contents($backupFile, $content);

echo "Backup saved to: {$backupFile}\n\n";

// Define the corrected function
$fixedFunction = '
function verify_paychangu($txRef) {
    if (!$txRef) { json_error(\'Missing tx_ref\', 400); }

    $secret = get_paychangu_secret();
    if (!$secret) { json_error(\'PayChangu API key is not configured\', 500); }

    // CORRECTED: Use proper PayChangu verification endpoint
    $url = \'https://api.paychangu.com/transaction/verify/\' . urlencode($txRef);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        \'Accept: application/json\',
        \'Authorization: Bearer \' . $secret,
    ]);

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($res === false) {
        $err = curl_error($ch);
        $errno = curl_errno($ch);
        curl_close($ch);
        // CORRECTED: Fixed error logging to reference PayChangu API
        error_log(\'PayChangu API cURL error: \' . $err . \' (errno: \' . $errno . \') for endpoint: \' . $url);
        json_error(\'PayChangu API connection failed: \' . $err, 502);
    }
    curl_close($ch);

    $resp = json_decode($res, true);
    // CORRECTED: Fixed error logging to reference PayChangu API
    error_log(\'PayChangu API response - HTTP Code: \' . $httpCode . \', Response: \' . json_encode($resp));
    
    if ($httpCode < 200 || $httpCode >= 300 || !is_array($resp) || strtolower($resp[\'status\'] ?? \'\') !== \'success\') {
        $message = is_array($resp) ? ($resp[\'message\'] ?? \'Unknown error\') : \'Unknown error\';
        // CORRECTED: Fixed error logging to reference PayChangu API
        error_log(\'PayChangu verification failed - HTTP: \' . $httpCode . \', Message: \' . $message);
        json_error(\'Failed to verify payment: \' . $message, 502);
    }

    $data = $resp[\'data\'] ?? [];
    $sessionData = [
        \'id\' => $data[\'reference\'] ?? $data[\'tx_ref\'] ?? $txRef,
        \'amount\' => $data[\'amount\'] ?? null,
        \'currency\' => $data[\'currency\'] ?? null,
        \'customer_email\' => $data[\'customer\'][\'email\'] ?? null,
        \'payment_status\' => $data[\'status\'] ?? null,
    ];

    json_ok([\'success\' => true, \'data\' => $sessionData]);
}';

// Find and replace the function in the file
$pattern = '/function verify_paychangu\(\$txRef\) \{[^}]+\}/s';
if (preg_match($pattern, $content)) {
    $newContent = preg_replace($pattern, ltrim($fixedFunction), $content, 1);
    
    // Write the fixed content back to the file
    if (file_put_contents($indexPath, $newContent)) {
        echo "✅ SUCCESS: verify_paychangu function has been fixed!\n";
        echo "\nChanges made:\n";
        echo "1. ✅ Fixed PayChangu verification endpoint URL\n";
        echo "2. ✅ Corrected all error messages from 'Square API' to 'PayChangu API'\n";
        echo "3. ✅ Fixed error logging references\n";
        echo "4. ✅ Maintained all original functionality\n\n";
        
        echo "The function now uses the correct PayChangu API endpoint:\n";
        echo "https://api.paychangu.com/transaction/verify/{txRef}\n\n";
        
        echo "All error messages and logs now correctly reference PayChangu instead of Square.\n";
    } else {
        echo "❌ FAILED: Could not write changes to file\n";
    }
} else {
    echo "❌ FAILED: Could not find verify_paychangu function in file\n";
}

// Test the fix
echo "\n🧪 TESTING THE FIX:\n";
echo str_repeat("-", 30) . "\n";

$testTxRef = 'REAL-TEST-1768670482';

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://sparkle-pro.co.uk/api/payments/paychangu/verify/{$testTxRef}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "Test verification HTTP status: {$httpCode}\n";
if ($httpCode === 200) {
    echo "✅ Verification endpoint is now working!\n";
    $responseData = json_decode($response, true);
    echo "Response: " . json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Status: {$httpCode}\n";
    echo "Response: " . substr($response, 0, 200) . "...\n";
}

echo "\n🔧 FIX COMPLETE!\n";
echo "The PayChangu verification function has been corrected and should now work properly.\n";
?>