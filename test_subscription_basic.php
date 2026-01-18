<?php
// Test script to verify subscription renewal manager runs without fatal errors
echo "Testing subscription renewal manager execution...\n";
echo "Start time: " . date('Y-m-d H:i:s') . "\n";

try {
    // Include the main file
    require_once 'sparkle-pro-api/subscription_renewal_manager.php';
    
    echo "✅ File loaded successfully\n";
    
    // Test class definition exists
    if (class_exists('SubscriptionRenewalManager')) {
        echo "✅ SubscriptionRenewalManager class exists\n";
    } else {
        echo "❌ SubscriptionRenewalManager class not found\n";
        exit(1);
    }
    
    // Test method exists
    $methods = get_class_methods('SubscriptionRenewalManager');
    $requiredMethods = ['processRenewals', 'processAnalytics'];
    
    foreach ($requiredMethods as $method) {
        if (in_array($method, $methods)) {
            echo "✅ Method $method exists\n";
        } else {
            echo "❌ Method $method not found\n";
            exit(1);
        }
    }
    
    echo "✅ All basic tests passed\n";
    echo "End time: " . date('Y-m-d H:i:s') . "\n";
    echo "✅ Script completed successfully without fatal errors\n";
    exit(0);
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    exit(1);
} catch (Error $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>