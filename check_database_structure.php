<?php
/**
 * Database Structure Checker and Fixer
 * 
 * Checks current database structure and applies critical fixes
 */

// Database configuration (adjust as needed)
$db_host = 'localhost';
$db_user = 'xuser';
$db_pass = 'Xpush2025?';
$db_name = 'itsxtrapush_db';

try {
    echo "🔍 Checking database structure...\n";
    
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "✅ Connected to database successfully\n\n";
    
    // Check existing tables
    $tables = $conn->query("SHOW TABLES");
    echo "📋 Existing tables:\n";
    while ($table = $tables->fetch_row()) {
        echo "  - " . $table[0] . "\n";
    }
    echo "\n";
    
    // Check for critical tables
    $criticalTables = ['users', 'orders', 'gadgets', 'order_items'];
    foreach ($criticalTables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows > 0) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing!\n";
        }
    }
    echo "\n";
    
    // Check current constraints
    echo "🔍 Checking current constraints...\n";
    $constraints = $conn->query("
        SELECT 
            TABLE_NAME,
            COLUMN_NAME,
            CONSTRAINT_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '$db_name' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME
    ");
    
    if ($constraints->num_rows > 0) {
        echo "🔗 Existing foreign key constraints:\n";
        while ($constraint = $constraints->fetch_assoc()) {
            echo "  - {$constraint['TABLE_NAME']}.{$constraint['COLUMN_NAME']} -> {$constraint['REFERENCED_TABLE_NAME']}.{$constraint['REFERENCED_COLUMN_NAME']}\n";
        }
    } else {
        echo "⚠️  No foreign key constraints found\n";
    }
    echo "\n";
    
    // Check for unique indexes
    echo "🔍 Checking unique indexes...\n";
    $indexes = $conn->query("
        SHOW INDEX FROM users WHERE Non_unique = 0
    ");
    
    if ($indexes->num_rows > 0) {
        echo "🔑 Unique indexes on users table:\n";
        while ($index = $indexes->fetch_assoc()) {
            echo "  - {$index['Column_name']}\n";
        }
    } else {
        echo "⚠️  No unique indexes found on users table\n";
    }
    echo "\n";
    
    // Apply critical fixes
    echo "🔧 Applying critical database fixes...\n";
    
    // 1. Add unique constraints if they don't exist
    $fixesApplied = 0;
    
    // Check and add unique email constraint
    $emailConstraint = $conn->query("
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = '$db_name' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'email' 
        AND NON_UNIQUE = 0
    ")->fetch_assoc()['count'];
    
    if ($emailConstraint == 0) {
        echo "  ➤ Adding unique constraint for users.email...";
        $conn->query("ALTER TABLE users ADD UNIQUE INDEX idx_unique_email (email)");
        if ($conn->error) {
            echo " ❌ Error: " . $conn->error . "\n";
        } else {
            echo " ✅ Done\n";
            $fixesApplied++;
        }
    } else {
        echo "  ➤ Unique constraint for users.email already exists\n";
    }
    
    // Check and add unique uid constraint
    $uidConstraint = $conn->query("
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = '$db_name' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'uid' 
        AND NON_UNIQUE = 0
    ")->fetch_assoc()['count'];
    
    if ($uidConstraint == 0) {
        echo "  ➤ Adding unique constraint for users.uid...";
        $conn->query("ALTER TABLE users ADD UNIQUE INDEX idx_unique_uid (uid)");
        if ($conn->error) {
            echo " ❌ Error: " . $conn->error . "\n";
        } else {
            echo " ✅ Done\n";
            $fixesApplied++;
        }
    } else {
        echo "  ➤ Unique constraint for users.uid already exists\n";
    }
    
    // Check and add unique transaction reference constraint
    $txConstraint = $conn->query("
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = '$db_name' 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'external_tx_ref' 
        AND NON_UNIQUE = 0
    ")->fetch_assoc()['count'];
    
    if ($txConstraint == 0) {
        echo "  ➤ Adding unique constraint for orders.external_tx_ref...";
        $conn->query("ALTER TABLE orders ADD UNIQUE INDEX idx_unique_tx_ref (external_tx_ref)");
        if ($conn->error) {
            echo " ❌ Error: " . $conn->error . "\n";
        } else {
            echo " ✅ Done\n";
            $fixesApplied++;
        }
    } else {
        echo "  ➤ Unique constraint for orders.external_tx_ref already exists\n";
    }
    
    // 2. Create processed_transactions table for idempotency
    $processedTable = $conn->query("SHOW TABLES LIKE 'processed_transactions'")->num_rows;
    if ($processedTable == 0) {
        echo "  ➤ Creating processed_transactions table...";
        $conn->query("
            CREATE TABLE processed_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tx_ref VARCHAR(255) NOT NULL UNIQUE,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                amount DECIMAL(10,2),
                currency VARCHAR(3),
                user_id INT,
                INDEX idx_tx_ref (tx_ref),
                INDEX idx_processed_at (processed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        if ($conn->error) {
            echo " ❌ Error: " . $conn->error . "\n";
        } else {
            echo " ✅ Done\n";
            $fixesApplied++;
        }
    } else {
        echo "  ➤ processed_transactions table already exists\n";
    }
    
    // 3. Create stock_audit_log table
    $auditTable = $conn->query("SHOW TABLES LIKE 'stock_audit_log'")->num_rows;
    if ($auditTable == 0) {
        echo "  ➤ Creating stock_audit_log table...";
        $conn->query("
            CREATE TABLE stock_audit_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_id INT NOT NULL,
                item_type ENUM('gadget', 'variant') NOT NULL,
                old_quantity INT NOT NULL,
                new_quantity INT NOT NULL,
                quantity_change INT NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                changed_by INT,
                INDEX idx_item_type_id (item_type, item_id),
                INDEX idx_changed_at (changed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        if ($conn->error) {
            echo " ❌ Error: " . $conn->error . "\n";
        } else {
            echo " ✅ Done\n";
            $fixesApplied++;
        }
    } else {
        echo "  ➤ stock_audit_log table already exists\n";
    }
    
    echo "\n✅ Database fixes completed. Applied $fixesApplied fixes.\n";
    
    // Test the fixes
    echo "\n🧪 Testing applied fixes...\n";
    
    // Test unique constraints
    echo "  ➤ Testing unique email constraint...";
    $testEmail = "test_" . time() . "@example.com";
    $stmt = $conn->prepare("INSERT INTO users (email, uid, password_hash) VALUES (?, 'test_uid', 'test_hash')");
    $stmt->bind_param('s', $testEmail);
    $stmt->execute();
    
    // Try to insert duplicate
    $stmt->execute();
    if ($stmt->errno == 1062) { // Duplicate entry error
        echo " ✅ Working (prevents duplicates)\n";
    } else {
        echo " ❌ Not working properly\n";
    }
    $stmt->close();
    
    // Clean up test data
    $conn->query("DELETE FROM users WHERE email = '$testEmail'");
    
    $conn->close();
    echo "\n🎉 All critical database fixes applied successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>