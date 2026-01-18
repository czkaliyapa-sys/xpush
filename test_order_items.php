<?php
// Test script to verify order items fetching
require_once __DIR__ . '/sparkle-pro-api/index.php';

// Test the fetchOrderItems function
try {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    
    if (!$conn || $conn->connect_errno) {
        die("Database connection failed: " . $conn->connect_error);
    }
    
    // Test with a known order ID (you may need to adjust this)
    $testOrderId = 1; 
    
    echo "Testing fetchOrderItems for order ID: $testOrderId\n";
    
    $items = fetchOrderItems($conn, $testOrderId);
    
    echo "Found " . count($items) . " items:\n";
    
    foreach ($items as $index => $item) {
        echo "\nItem " . ($index + 1) . ":\n";
        echo "  Name: " . ($item['name'] ?? 'N/A') . "\n";
        echo "  Brand: " . ($item['brand'] ?? 'N/A') . "\n";
        echo "  Model: " . ($item['model'] ?? 'N/A') . "\n";
        echo "  Image: " . ($item['image'] ?? 'N/A') . "\n";
        echo "  Quantity: " . ($item['quantity'] ?? 'N/A') . "\n";
        echo "  Unit Price: " . ($item['unitPrice'] ?? 'N/A') . "\n";
        echo "  Total Price: " . ($item['totalPrice'] ?? 'N/A') . "\n";
        echo "  Type: " . ($item['type'] ?? 'N/A') . "\n";
        echo "  Gadget ID: " . ($item['gadgetId'] ?? 'N/A') . "\n";
    }
    
    // Also test the raw database query to see what's actually in the tables
    echo "\n--- Raw Database Query Results ---\n";
    
    $sql = "SELECT oi.*, g.name, g.brand, g.model, g.image_url 
            FROM order_items oi 
            LEFT JOIN gadgets g ON oi.gadget_id = g.id 
            WHERE oi.order_id = ?";
    
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('i', $testOrderId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            echo "Order Item ID: " . $row['id'] . "\n";
            echo "  Gadget ID: " . $row['gadget_id'] . "\n";
            echo "  Gadget Name: " . ($row['name'] ?? 'NOT FOUND') . "\n";
            echo "  Gadget Brand: " . ($row['brand'] ?? 'NOT FOUND') . "\n";
            echo "  Gadget Image: " . ($row['image_url'] ?? 'NOT FOUND') . "\n";
            echo "  Quantity: " . $row['quantity'] . "\n";
            echo "  Unit Price: " . $row['unit_price'] . "\n";
            echo "---\n";
        }
        $stmt->close();
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}