<?php
// Diagnostic script to test PHPMailer installation

echo "PHPMailer Installation Diagnostic\n";
echo "==================================\n\n";

// Check if vendor directory exists
$vendorPath = __DIR__ . '/vendor';
echo "Vendor directory exists: " . (file_exists($vendorPath) ? 'YES' : 'NO') . "\n";

if (file_exists($vendorPath)) {
    echo "Vendor directory path: $vendorPath\n";
    
    // Check if autoload.php exists
    $autoloadPath = $vendorPath . '/autoload.php';
    echo "Autoload file exists: " . (file_exists($autoloadPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($autoloadPath)) {
        echo "Attempting to load autoloader...\n";
        try {
            require_once $autoloadPath;
            echo "Autoloader loaded successfully\n";
            
            // Check if PHPMailer class exists
            echo "Checking PHPMailer class existence...\n";
            $classExists = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
            echo "PHPMailer class exists: " . ($classExists ? 'YES' : 'NO') . "\n";
            
            if ($classExists) {
                echo "Attempting to instantiate PHPMailer...\n";
                try {
                    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
                    echo "PHPMailer instantiated successfully!\n";
                    echo "PHPMailer version: " . $mail::VERSION . "\n";
                } catch (Exception $e) {
                    echo "Failed to instantiate PHPMailer: " . $e->getMessage() . "\n";
                }
            } else {
                echo "PHPMailer class not found in autoloader\n";
                
                // List available classes in PHPMailer namespace
                echo "Checking available classes...\n";
                $iterator = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($vendorPath . '/phpmailer/phpmailer/src')
                );
                
                foreach ($iterator as $file) {
                    if ($file->isFile() && $file->getExtension() === 'php') {
                        $className = basename($file->getFilename(), '.php');
                        echo "  Found: $className\n";
                    }
                }
            }
        } catch (Exception $e) {
            echo "Failed to load autoloader: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Autoload file not found at: $autoloadPath\n";
    }
} else {
    echo "Vendor directory not found at: $vendorPath\n";
    echo "Current directory: " . __DIR__ . "\n";
}

echo "\nDiagnostic complete.\n";
?>