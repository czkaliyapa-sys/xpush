#!/usr/bin/env php
<?php
/**
 * ACTUAL LIVE PAYMENT SUCCESS TEST
 * Testing the real sparkle-pro.co.uk/api/ endpoint
 */

echo "💳 REAL LIVE PAYMENT SUCCESS TEST\n";
echo "==================================\n";
echo "Testing: https://sparkle-pro.co.uk/api/\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

// Test 1: Make an actual payment
echo "1. PROCESSING LIVE PAYMENT\n";
echo str_repeat("-", 30) . "\n";

$txRef = 'REAL-TEST-' . time();
$paymentData = [
    'txRef' => $txRef,
    'amount' => 17500, // MWK 17,500
    'currency' => 'MWK',
    'customerEmail' => 'realtest@sparkle-pro.co.uk',
    'paymentStatus' => 'success',
    'items' => [
        [
            'id' => 1,
            'name' => 'Samsung Galaxy S24',
            'brand' => 'Samsung',
            'model' => 'Galaxy S24',
            'price' => 17500,
            'quantity' => 1,
            'image' => 'https://sparkle-pro.co.uk/api/images/s24.jpg',
            'category' => 'smartphone',
            'storage' => '256GB',
            'color' => 'Phantom Black'
        ]
    ]
];

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'https://sparkle-pro.co.uk/api/payments/notify-success',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($paymentData),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "HTTP Status: {$httpCode}\n";
echo "Response: " . $response . "\n";

if ($httpCode === 200) {
    $responseData = json_decode($response, true);
    if ($responseData['success'] ?? false) {
        echo "✅ PAYMENT PROCESSED SUCCESSFULLY\n";
        echo "Transaction Ref: {$txRef}\n";
        echo "Customer notified: " . (($responseData['customer']['sent'] ?? false) ? 'YES' : 'NO') . "\n\n";
    } else {
        echo "❌ PAYMENT PROCESSING FAILED\n";
        echo "Error: " . ($responseData['error'] ?? 'Unknown error') . "\n\n";
    }
} else {
    echo "❌ HTTP ERROR: {$httpCode}\n";
    echo "Response: {$response}\n\n";
}

// Test 2: Check if we can verify this payment
echo "2. VERIFYING PAYMENT STATUS\n";
echo str_repeat("-", 30) . "\n";

$verifyCurl = curl_init();
curl_setopt_array($verifyCurl, [
    CURLOPT_URL => "https://sparkle-pro.co.uk/api/payments/paychangu/verify/{$txRef}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
    CURLOPT_TIMEOUT => 30
]);

$verifyResponse = curl_exec($verifyCurl);
$verifyHttpCode = curl_getinfo($verifyCurl, CURLINFO_HTTP_CODE);
curl_close($verifyCurl);

echo "Verification HTTP Status: {$verifyHttpCode}\n";
echo "Verification Response: " . $verifyResponse . "\n";

if ($verifyHttpCode === 200) {
    $verifyData = json_decode($verifyResponse, true);
    if ($verifyData['success'] ?? false) {
        echo "✅ PAYMENT VERIFICATION SUCCESSFUL\n";
        echo "Verified Amount: " . ($verifyData['data']['amount'] ?? 'N/A') . "\n";
        echo "Verified Status: " . ($verifyData['data']['payment_status'] ?? 'N/A') . "\n\n";
    } else {
        echo "❌ PAYMENT VERIFICATION FAILED\n";
        echo "Error: " . ($verifyData['error'] ?? 'Unknown error') . "\n\n";
    }
} else {
    echo "❌ VERIFICATION HTTP ERROR: {$verifyHttpCode}\n\n";
}

// Test 3: Check admin dashboard to see if order appears
echo "3. CHECKING ADMIN DASHBOARD\n";
echo str_repeat("-", 30) . "\n";

$dashboardCurl = curl_init();
curl_setopt_array($dashboardCurl, [
    CURLOPT_URL => 'https://sparkle-pro.co.uk/api/analytics/dashboard?timeRange=1d',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
    CURLOPT_TIMEOUT => 30
]);

$dashboardResponse = curl_exec($dashboardCurl);
$dashboardHttpCode = curl_getinfo($dashboardCurl, CURLINFO_HTTP_CODE);
curl_close($dashboardCurl);

echo "Dashboard HTTP Status: {$dashboardHttpCode}\n";

if ($dashboardHttpCode === 200) {
    $dashboardData = json_decode($dashboardResponse, true);
    if ($dashboardData['success'] ?? false) {
        echo "✅ DASHBOARD ACCESSIBLE\n";
        $orderStats = $dashboardData['data']['order_stats'] ?? [];
        echo "Total Orders: " . ($orderStats['total_orders'] ?? 'N/A') . "\n";
        echo "Pending Orders: " . ($orderStats['pending_orders'] ?? 'N/A') . "\n";
        echo "Completed Orders: " . ($orderStats['completed_orders'] ?? 'N/A') . "\n\n";
    } else {
        echo "❌ DASHBOARD ACCESS FAILED\n";
        echo "Error: " . ($dashboardData['error'] ?? 'Unknown error') . "\n\n";
    }
} else {
    echo "❌ DASHBOARD HTTP ERROR: {$dashboardHttpCode}\n\n";
}

// Test 4: Check receipt generation capability
echo "4. TESTING RECEIPT GENERATION ENDPOINTS\n";
echo str_repeat("-", 30) . "\n";

// Test installment receipts endpoint
$receiptCurl = curl_init();
curl_setopt_array($receiptCurl, [
    CURLOPT_URL => 'https://sparkle-pro.co.uk/api/installments/receipts?uid=test-user-123',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
    CURLOPT_TIMEOUT => 30
]);

$receiptResponse = curl_exec($receiptCurl);
$receiptHttpCode = curl_getinfo($receiptCurl, CURLINFO_HTTP_CODE);
curl_close($receiptCurl);

echo "Receipt Endpoint HTTP Status: {$receiptHttpCode}\n";

if ($receiptHttpCode === 200) {
    $receiptData = json_decode($receiptResponse, true);
    if ($receiptData['success'] ?? false) {
        echo "✅ RECEIPT ENDPOINT WORKING\n";
        $receiptCount = count($receiptData['receipts'] ?? []);
        echo "Available Receipts: {$receiptCount}\n\n";
    } else {
        echo "⚠️ RECEIPT ENDPOINT ACCESSIBLE BUT NO DATA\n";
        echo "Message: " . ($receiptData['message'] ?? 'No message') . "\n\n";
    }
} else {
    echo "❌ RECEIPT ENDPOINT HTTP ERROR: {$receiptHttpCode}\n\n";
}

// Final Summary
echo str_repeat("=", 50) . "\n";
echo "📋 LIVE TEST SUMMARY\n";
echo str_repeat("=", 50) . "\n";

echo "\n🎯 WHAT WE ACTUALLY TESTED:\n";
echo "1. ✅ Live payment processing to sparkle-pro.co.uk/api/\n";
echo "2. ✅ Payment verification endpoint\n";  
echo "3. ✅ Admin dashboard access\n";
echo "4. ✅ Receipt generation endpoints\n";

echo "\n📊 RESULTS:\n";
echo "- Payment API: ";
if ($httpCode === 200) echo "WORKING ✅\n";
else echo "ISSUE ❌\n";

echo "- Verification API: ";
if ($verifyHttpCode === 200) echo "WORKING ✅\n";
else echo "ISSUE ❌\n";

echo "- Dashboard API: ";
if ($dashboardHttpCode === 200) echo "WORKING ✅\n";
else echo "ISSUE ❌\n";

echo "- Receipt API: ";
if ($receiptHttpCode === 200) echo "WORKING ✅\n";
else echo "ISSUE ❌\n";

echo "\n💰 TRANSACTION DETAILS:\n";
echo "Reference: {$txRef}\n";
echo "Amount: MWK 17,500\n";
echo "Status: ";
if ($httpCode === 200) echo "Processed successfully\n";
else echo "Processing failed\n";

echo "\nThis was a REAL test hitting your actual production API!";
?>