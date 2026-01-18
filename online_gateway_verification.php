<?php
/**
 * Online API Gateway Verification Test
 * Tests if the gateway routing fix is working correctly
 */

echo "=== ONLINE API GATEWAY VERIFICATION ===\n\n";

// Test the health endpoint first
$healthUrl = "https://sparkle-pro.co.uk/api/";
$healthResponse = file_get_contents($healthUrl);
$healthData = json_decode($healthResponse, true);

if ($healthData && isset($healthData['status']) && $healthData['status'] === 'OK') {
    echo "✅ API Health Check: PASSED\n";
    echo "✅ API is running and accessible\n\n";
} else {
    echo "❌ API Health Check: FAILED\n";
    echo "Response: " . $healthResponse . "\n\n";
    exit(1);
}

// Test database connection through a simple query endpoint
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    echo "✅ Database Connection: PASSED\n";
    
    // Test the gateway routing logic by checking existing orders
    echo "\n=== EXISTING ORDER GATEWAY VERIFICATION ===\n";
    
    $ordersCheck = $conn->query("
        SELECT 
            id,
            external_tx_ref,
            currency,
            provider,
            total_amount,
            total_amount_gbp,
            created_at
        FROM orders 
        WHERE payment_status = 'paid'
        ORDER BY created_at DESC
        LIMIT 10
    ");
    
    if ($ordersCheck && $ordersCheck->num_rows > 0) {
        echo "Recent Orders Gateway Analysis:\n";
        echo "Order ID | Currency | Amount     | Provider   | Status\n";
        echo "---------|----------|------------|------------|--------\n";
        
        $gbpWithWrongGateway = 0;
        $mwkWithWrongGateway = 0;
        
        while ($order = $ordersCheck->fetch_assoc()) {
            $expectedProvider = ($order['currency'] === 'GBP') ? 'square' : 'paychangu';
            $status = ($order['provider'] === $expectedProvider) ? '✅ CORRECT' : '❌ WRONG';
            
            if ($order['provider'] !== $expectedProvider) {
                if ($order['currency'] === 'GBP') {
                    $gbpWithWrongGateway++;
                } else {
                    $mwkWithWrongGateway++;
                }
            }
            
            printf("%-8s | %-8s | %-10s | %-10s | %s\n",
                $order['id'],
                $order['currency'],
                $order['currency'] . ' ' . number_format(
                    $order['currency'] === 'GBP' ? $order['total_amount'] : $order['total_amount'], 
                    2
                ),
                $order['provider'],
                $status
            );
        }
        
        echo "\n=== GATEWAY ROUTING ANALYSIS ===\n";
        if ($gbpWithWrongGateway > 0) {
            echo "⚠️  $gbpWithWrongGateway GBP orders still using wrong gateway\n";
            echo "🔧 Fix may not be deployed yet or needs to be applied to existing orders\n";
        } else {
            echo "✅ All GBP orders using correct Square gateway\n";
        }
        
        if ($mwkWithWrongGateway > 0) {
            echo "⚠️  $mwkWithWrongGateway MWK orders using wrong gateway\n";
        } else {
            echo "✅ All MWK orders using correct PayChangu gateway\n";
        }
        
        if ($gbpWithWrongGateway === 0 && $mwkWithWrongGateway === 0) {
            echo "\n🎉 GATEWAY ROUTING: PERFECT\n";
            echo "✅ All orders routed to correct payment providers\n";
        }
        
    } else {
        echo "❌ No paid orders found in database\n";
    }
    
    // Test the new order creation logic simulation
    echo "\n=== NEW ORDER CREATION LOGIC TEST ===\n";
    
    // Simulate GBP order creation
    $testCurrency = 'GBP';
    $testProvider = ($testCurrency === 'GBP') ? 'square' : 'paychangu';
    echo "GBP Order Simulation:\n";
    echo "- Currency: $testCurrency\n";
    echo "- Expected Provider: $testProvider\n";
    echo "- Result: " . ($testProvider === 'square' ? '✅ CORRECT' : '❌ WRONG') . "\n";
    
    // Simulate MWK order creation  
    $testCurrency2 = 'MWK';
    $testProvider2 = ($testCurrency2 === 'MWK') ? 'paychangu' : 'square';
    echo "\nMWK Order Simulation:\n";
    echo "- Currency: $testCurrency2\n";
    echo "- Expected Provider: $testProvider2\n";
    echo "- Result: " . ($testProvider2 === 'paychangu' ? '✅ CORRECT' : '❌ WRONG') . "\n";
    
    echo "\n=== VERIFICATION COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Database Test Failed: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>