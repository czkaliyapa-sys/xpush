<?php
// Minimal test to isolate the issue
echo "Starting minimal test at " . date('Y-m-d H:i:s') . "\n";

// Include the main file
require_once 'sparkle-pro-api/subscription_renewal_manager.php';

echo "File included successfully\n";

try {
    // Test database connection
    $db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');
    
    if ($db->connect_error) {
        echo "❌ Database connection failed: " . $db->connect_error . "\n";
        exit(1);
    }
    
    echo "✅ Database connected\n";
    
    // Test class instantiation
    $manager = new SubscriptionRenewalManager($db);
    echo "✅ Class instantiated\n";
    
    // Test calling the specific problematic method
    echo "About to call processActivatedRenewals...\n";
    $managerReflection = new ReflectionClass($manager);
    
    if ($managerReflection->hasMethod('processActivatedRenewals')) {
        echo "✅ Method exists\n";
        
        // Try to get the method
        $method = $managerReflection->getMethod('processActivatedRenewals');
        echo "✅ Method reflection obtained\n";
        
        // Try to call it
        echo "Calling method...\n";
        $method->invoke($manager);
        echo "✅ Method executed successfully\n";
    } else {
        echo "❌ Method does not exist\n";
    }
    
    $db->close();
    echo "✅ Test completed successfully\n";
    exit(0);
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
} catch (Error $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    if (isset($db)) {
        $db->close();
    }
    exit(1);
}
?>