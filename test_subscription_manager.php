<?php
// Minimal test to check if the SubscriptionRenewalManager class loads properly

// Include the main file
require_once 'sparkle-pro-api/subscription_renewal_manager.php';

echo "Testing SubscriptionRenewalManager class loading...\n";

try {
    // Test database connection first
    $db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');
    
    if ($db->connect_error) {
        echo "❌ Database connection failed: " . $db->connect_error . "\n";
        exit(1);
    }
    
    echo "✅ Database connected\n";
    
    // Test class instantiation
    echo "Testing class instantiation...\n";
    $manager = new SubscriptionRenewalManager($db);
    echo "✅ Class instantiated successfully\n";
    
    // Test basic method call
    echo "Testing basic method call...\n";
    $result = $manager->processRenewals();
    echo "✅ Method executed successfully\n";
    echo "Result: " . json_encode($result) . "\n";
    
    $db->close();
    echo "✅ All tests completed successfully\n";
    exit(0);
    
} catch (Exception $e) {
    echo "❌ Exception caught: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
} catch (Error $e) {
    echo "❌ Fatal Error caught: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
}
?>