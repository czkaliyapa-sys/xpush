<?php
// XtraPush Subscription Renewal Manager - Enhanced Production Version
// Based on working oldsub.php logic with fixed execution issues

echo "========================================\n";
echo "XtraPush Subscription Renewal System\n";
echo "========================================\n\n";
echo "Starting renewal process at " . date('Y-m-d H:i:s') . "\n\n";

// Database connection
$db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');

if ($db->connect_error) {
    echo "❌ Database connection failed: " . $db->connect_error . "\n";
    exit(1);
}

$db->set_charset('utf8mb4');

// Get subscription statistics
$query = "SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN subscription_active = 1 THEN 1 ELSE 0 END) as active_subscriptions,
    SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_status_subscriptions
FROM users";

$result = mysqli_query($db, $query);
if ($result) {
    $stats = mysqli_fetch_assoc($result);
    echo "📊 Subscription Statistics:\n";
    echo "  Total users: " . ($stats['total_users'] ?? 0) . "\n";
    echo "  Active subscriptions: " . ($stats['active_subscriptions'] ?? 0) . "\n";
    echo "  Active status subscriptions: " . ($stats['active_status_subscriptions'] ?? 0) . "\n\n";
}

// Check for subscriptions due for renewal (improved logic from oldsub.php)
$today = date('Y-m-d');
$sevenDaysFromNow = date('Y-m-d', strtotime('+7 days'));

// Find PayChangu subscriptions needing renewal (within next 7 days)
$sql = "
    SELECT 
        u.id, 
        u.email, 
        u.full_name,
        u.subscription_tier as tier,
        u.subscription_renewal_date,
        u.subscription_payment_gateway,
        u.subscription_active,
        u.subscription_last_reminder_sent
    FROM users u
    WHERE u.subscription_payment_gateway = 'paychangu'
      AND u.subscription_active = 1
      AND u.subscription_renewal_date BETWEEN '$today' AND '$sevenDaysFromNow'
      AND (u.subscription_last_reminder_sent IS NULL OR u.subscription_last_reminder_sent < DATE_SUB(NOW(), INTERVAL 2 DAY))
    ORDER BY u.subscription_renewal_date ASC
";

$result = mysqli_query($db, $sql);
if ($result) {
    $found = mysqli_num_rows($result);
    echo "🔍 Found $found subscriptions due for renewal (within next 7 days)\n";
    
    if ($found > 0) {
        $processed = 0;
        $errors = 0;
        
        while ($subscription = mysqli_fetch_assoc($result)) {
            echo "  Processing: {$subscription['email']} ({$subscription['tier']}) - Due: {$subscription['subscription_renewal_date']}\n";
            
            try {
                // Process renewal notification
                $success = processRenewalNotification($db, $subscription);
                
                if ($success) {
                    echo "    ✓ Renewal notification sent successfully\n";
                    $processed++;
                } else {
                    echo "    ✗ Failed to send renewal notification\n";
                    $errors++;
                }
                
            } catch (Exception $e) {
                echo "    ✗ Error processing renewal: " . $e->getMessage() . "\n";
                $errors++;
            }
            
            // Small delay to avoid rate limiting
            usleep(500000); // 0.5 seconds
        }
        
        echo "\n✅ Successfully processed: $processed\n";
        if ($errors > 0) {
            echo "❌ Errors encountered: $errors\n";
        }
        
    } else {
        echo "ℹ️ No renewals to process\n";
    }
}

// Check for overdue subscriptions (past renewal date)
$overdueQuery = "
    SELECT id, email, full_name, subscription_tier, subscription_renewal_date
    FROM users
    WHERE subscription_payment_gateway = 'paychangu'
      AND subscription_active = 1
      AND subscription_renewal_date < CURDATE()
";

$overdueResult = mysqli_query($db, $overdueQuery);
if ($overdueResult && mysqli_num_rows($overdueResult) > 0) {
    echo "\n⚠️ Found " . mysqli_num_rows($overdueResult) . " overdue subscriptions\n";
    
    while ($overdue = mysqli_fetch_assoc($overdueResult)) {
        // Suspend subscription
        $suspendQuery = "
            UPDATE users 
            SET subscription_active = 0, 
                subscription_status = 'SUSPENDED'
            WHERE id = {$overdue['id']}
        ";
        
        if (mysqli_query($db, $suspendQuery)) {
            // Send suspension email
            $suspensionSuccess = sendSuspensionEmail($overdue);
            if ($suspensionSuccess) {
                echo "  ✓ Suspended and notified: {$overdue['email']}\n";
            } else {
                echo "  ✗ Suspended but failed to notify: {$overdue['email']}\n";
            }
        }
    }
}

$db->close();

echo "\n========================================\n";
echo "✓ Renewal process completed successfully at " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n";
exit(0);

/**
 * Process renewal notification for a subscription
 */
function processRenewalNotification($db, $subscription) {
    // Get subscription pricing
    $tierPrices = [
        'plus' => 6000,      // MWK 6,000
        'premium' => 10000   // MWK 10,000
    ];
    
    $tierNames = [
        'plus' => 'XtraPush Plus',
        'premium' => 'XtraPush Premium'
    ];
    
    $amount = $tierPrices[$subscription['tier']] ?? 6000;
    $tierName = $tierNames[$subscription['tier']] ?? 'Subscription';
    
    // Generate unique transaction reference
    $txRef = 'RENEWAL-' . strtoupper(bin2hex(random_bytes(6))) . '-' . time();
    
    // Generate renewal email
    $emailHtml = generateRenewalEmail($subscription, $tierName, $amount, $txRef);
    $subject = "🔔 {$tierName} Renewal - Payment Due";
    
    // Send email
    $emailSent = sendRenewalEmail($subscription['email'], $subject, $emailHtml);
    
    if ($emailSent) {
        // Update last reminder sent timestamp
        $updateQuery = "
            UPDATE users 
            SET subscription_last_reminder_sent = NOW()
            WHERE id = {$subscription['id']}
        ";
        mysqli_query($db, $updateQuery);
        
        return true;
    }
    
    return false;
}

/**
 * Generate renewal email HTML (simplified from oldsub.php)
 */
function generateRenewalEmail($subscription, $tierName, $amount, $txRef) {
    $invoiceDate = date('F j, Y');
    $dueDate = date('F j, Y', strtotime('+7 days'));
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #48cedb 0%, #3aa6b8 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .amount { font-size: 32px; color: #48cedb; font-weight: bold; margin: 10px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #48cedb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔔 Subscription Renewal</h1>
                <p>Your monthly subscription is up for renewal</p>
            </div>
            <div class='content'>
                <h2>Hello {$subscription['full_name']},</h2>
                <p>Your <strong>{$tierName}</strong> subscription is due for renewal.</p>
                
                <div style='background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #48cedb;'>
                    <h3>Invoice Details</h3>
                    <p><strong>Plan:</strong> {$tierName}</p>
                    <p><strong>Invoice Date:</strong> {$invoiceDate}</p>
                    <p><strong>Due Date:</strong> {$dueDate}</p>
                    <p><strong>Amount Due:</strong> <span class='amount'>MWK " . number_format($amount) . "</span></p>
                </div>
                
                <p><strong>Benefits you'll keep:</strong></p>
                <ul>
                    <li>✅ Free unlimited delivery on all orders</li>
                    <li>✅ " . ($subscription['tier'] === 'premium' ? 'Multiple' : 'Single') . " gadget insurance (1 year)</li>
                    <li>✅ Member discounts</li>
    " . ($subscription['tier'] === 'premium' ? "
                    <li>✅ Priority support</li>
                    <li>✅ Early access to new gadgets</li>
    " : "") . "
                </ul>
                
                <p style='text-align: center; margin: 30px 0;'>
                    <a href='https://itsxtrapush.com/subscription/renew/{$txRef}' class='button'>
                        Pay Now - MWK " . number_format($amount) . "
                    </a>
                </p>
                
                <p style='font-size: 12px; color: #666;'>
                    <strong>Note:</strong> If payment is not received by {$dueDate}, your subscription will be suspended.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
}

/**
 * Send renewal email
 */
function sendRenewalEmail($to, $subject, $htmlBody) {
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: XtraPush Subscriptions <subscriptions@itsxtrapush.com>',
        'Reply-To: conrad@itsxtrapush.com'
    ];
    
    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

/**
 * Send suspension email
 */
function sendSuspensionEmail($user) {
    $message = "
    <h2>Subscription Suspended</h2>
    <p>Hello {$user['full_name']},</p>
    <p>Your {$user['subscription_tier']} subscription has been suspended due to non-payment.</p>
    <p>To reactivate, please contact conrad@itsxtrapush.com or renew your subscription.</p>
    ";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: XtraPush Subscriptions <subscriptions@itsxtrapush.com>',
        'Reply-To: conrad@itsxtrapush.com'
    ];
    
    return mail($user['email'], '⚠️ Subscription Suspended', $message, implode("\r\n", $headers));
}
?>