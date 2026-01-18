<?php
/**
 * Simple database test script
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
    
    echo "✅ Database connection successful\n";
    
    // Test the gateway correction query
    $wrongGatewayOrders = $conn->query("
        SELECT id, external_tx_ref, total_amount, provider, currency, created_at
        FROM orders 
        WHERE currency = 'GBP' AND provider != 'square' AND payment_status = 'paid'
        ORDER BY created_at DESC
    ");
    
    if ($wrongGatewayOrders && $wrongGatewayOrders->num_rows > 0) {
        echo "Found GBP orders using incorrect gateways:\n";
        echo "Order ID | Transaction Ref | Amount | Current Gateway | Currency | Created\n";
        echo "---------|----------------|--------|----------------|----------|----------\n";
        
        while ($order = $wrongGatewayOrders->fetch_assoc()) {
            printf("%-8s | %-14s | %-8s | %-14s | %-8s | %s\n",
                $order['id'],
                $order['external_tx_ref'],
                $order['currency'] . ' ' . number_format($order['total_amount'], 2),
                $order['provider'],
                $order['currency'],
                date('M j H:i', strtotime($order['created_at']))
            );
        }
        
        echo "\n⚠️  These GBP orders should use 'square' as provider, not '{$order['provider']}'\n";
        
    } else {
        echo "✅ No GBP orders found with incorrect gateways\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>