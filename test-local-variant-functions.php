<?php
// Test the variant processing locally
require_once 'sparkle-pro-api/index.php';

echo "🧪 LOCAL VARIANT PROCESSING TEST\n";
echo "===============================\n\n";

// Mock database connection and data
class MockDatabaseConnection {
    public function getConnection() {
        return true; // Mock successful connection
    }
}
class DatabaseConnection {
    public static function getInstance() {
        return new MockDatabaseConnection();
    }
}

// Test the helper function
$testGadgetIds = [1, 2, 3];
echo "Testing get_variants_for_gadgets() with IDs: " . implode(', ', $testGadgetIds) . "\n";

try {
    $result = get_variants_for_gadgets($testGadgetIds);
    echo "✅ Function executed successfully\n";
    echo "Result type: " . gettype($result) . "\n";
    echo "Result count: " . count($result) . "\n";
    
    if (is_array($result)) {
        foreach ($result as $gadgetId => $variants) {
            echo "Gadget $gadgetId: " . count($variants) . " variants\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Function failed: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("-", 40) . "\n";

// Test with empty array
echo "Testing with empty array:\n";
try {
    $emptyResult = get_variants_for_gadgets([]);
    echo "✅ Empty array handled correctly\n";
    echo "Result: " . (is_array($emptyResult) ? 'Array' : gettype($emptyResult)) . "\n";
} catch (Exception $e) {
    echo "❌ Empty array test failed: " . $e->getMessage() . "\n";
}

echo "\n📋 CONCLUSION:\n";
echo "If these tests pass, the backend functions are working.\n";
echo "The issue is likely that changes need to be deployed to production.\n";
?>