<?php
/**
 * Device Linking Database Migration Runner
 * Executes the device linking migration SQL file
 */

// Database configuration
$config = [
    'host' => 'localhost',
    'username' => 'xuser',
    'password' => 'Xpush2025?',
    'database' => 'itsxtrapush_db'
];

echo "📱 DEVICE LINKING DATABASE MIGRATION\n";
echo "====================================\n\n";

try {
    // Connect to database
    $mysqli = new mysqli($config['host'], $config['username'], $config['password'], $config['database']);
    
    if ($mysqli->connect_error) {
        throw new Exception("Connection failed: " . $mysqli->connect_error);
    }
    
    echo "✅ Connected to database successfully\n\n";
    
    // Read migration file
    $migrationFile = __DIR__ . '/device_linking_migration.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    if (!$sql) {
        throw new Exception("Failed to read migration file");
    }
    
    echo "📄 Reading migration file...\n";
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt) && !str_starts_with($stmt, '--'); }
    );
    
    echo "🔧 Executing " . count($statements) . " SQL statements...\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $index => $statement) {
        $lineNumber = $index + 1;
        echo "Statement $lineNumber: ";
        
        if ($mysqli->query($statement)) {
            echo "✅ SUCCESS\n";
            $successCount++;
        } else {
            echo "❌ FAILED: " . $mysqli->error . "\n";
            $errorCount++;
        }
    }
    
    echo "\n📊 MIGRATION RESULTS\n";
    echo "===================\n";
    echo "Successful statements: $successCount\n";
    echo "Failed statements: $errorCount\n";
    
    if ($errorCount === 0) {
        echo "\n✅ DEVICE LINKING MIGRATION COMPLETED SUCCESSFULLY!\n";
        echo "All required columns and indexes have been added.\n";
        
        // Verify the key columns exist
        echo "\n🔍 Verifying critical columns...\n";
        $criticalColumns = [
            'subscription_linked_device_id',
            'subscription_linked_device_name', 
            'subscription_device_linked_date',
            'subscription_payment_gateway',
            'subscription_renewal_date'
        ];
        
        foreach ($criticalColumns as $column) {
            $result = $mysqli->query("SHOW COLUMNS FROM users LIKE '$column'");
            if ($result && $result->num_rows > 0) {
                echo "✅ $column: FOUND\n";
            } else {
                echo "❌ $column: MISSING\n";
            }
        }
        
        echo "\n🚀 Device linking system is now ready for use!\n";
        echo "You can now test the device linking endpoints.\n";
        
    } else {
        echo "\n⚠️  MIGRATION COMPLETED WITH ERRORS\n";
        echo "Please check the error messages above and resolve any issues.\n";
    }
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>