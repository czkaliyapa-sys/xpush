<?php
/**
 * PAYMENT GATEWAY CORRECTION SCRIPT
 * Fixes GBP orders that are incorrectly using PayChangu instead of Square
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
    
    echo "=== PAYMENT GATEWAY CORRECTION ===\n\n";
    
    // Find GBP orders using wrong gateway
    $wrongGatewayOrders = $conn->query("
        SELECT id, external_tx_ref, total_amount, provider, created_at
        FROM orders 
        WHERE currency = 'GBP' AND provider != 'square' AND payment_status = 'paid'
        ORDER BY created_at DESC
    ");
    
    if ($wrongGatewayOrders && $wrongGatewayOrders->num_rows > 0) {
        echo "Found GBP orders using incorrect gateways:\n";
        echo "Order ID | Transaction Ref | Amount | Current Gateway | Created\n";
        echo "---------|----------------|--------|----------------|----------\n";
        
        while ($order = $wrongGatewayOrders->fetch_assoc()) {
            printf("%-8s | %-14s | GBP %-6s | %-14s | %s\n",
                $order['id'],
                $order['external_tx_ref'],
                number_format($order['total_amount'], 2),
                $order['provider'],
                date('M j H:i', strtotime($order['created_at']))
            );
        }
        
        echo "\n⚠️  These GBP orders should use 'square' as provider, not '{$order['provider']}'\n";
        echo "This suggests the gateway selection logic in your order processing needs review.\n\n";
        
        echo "Recommended fix in your index.php order creation logic:\n";
        echo "// Ensure GBP orders use Square gateway\n";
        echo "if (\$currencyDb === 'GBP') {\n";
        echo "    \$provider = 'square';\n";
        echo "} else {\n";
        echo "    \$provider = 'paychangu';\n";
        echo "}\n";
        
    } else {
        echo "✅ No GBP orders found with incorrect gateways\n";
    }
    
    echo "\n=== CORRECTION ANALYSIS COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>