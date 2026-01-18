<?php
// XtraPush Unified Subscription Renewal Manager
// Handles both Square (automatic) and Paychangu (manual) subscriptions
// Based on documented system architecture

echo "========================================\n";
echo "XtraPush Unified Subscription Renewal System\n";
echo "========================================\n\n";
echo "Starting unified renewal process at " . date('Y-m-d H:i:s') . "\n\n";

// Database connection
$db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');

if ($db->connect_error) {
    echo "❌ Database connection failed: " . $db->connect_error . "\n";
    exit(1);
}

$db->set_charset('utf8mb4');

// Get subscription statistics
echo "📊 Fetching subscription statistics...\n";
$statsQuery = "SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN subscription_active = 1 THEN 1 ELSE 0 END) as active_subscriptions,
    SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_status_subscriptions,
    SUM(CASE WHEN subscription_active = 1 AND subscription_payment_gateway = 'square' THEN 1 ELSE 0 END) as square_subscriptions,
    SUM(CASE WHEN subscription_active = 1 AND subscription_payment_gateway = 'paychangu' THEN 1 ELSE 0 END) as paychangu_subscriptions
FROM users";

$statsResult = mysqli_query($db, $statsQuery);
if ($statsResult) {
    $stats = mysqli_fetch_assoc($statsResult);
    echo "  Total users: " . ($stats['total_users'] ?? 0) . "\n";
    echo "  Active subscriptions: " . ($stats['active_subscriptions'] ?? 0) . "\n";
    echo "  Active status subscriptions: " . ($stats['active_status_subscriptions'] ?? 0) . "\n";
    echo "  Square subscriptions (GBP): " . ($stats['square_subscriptions'] ?? 0) . "\n";
    echo "  Paychangu subscriptions (MWK): " . ($stats['paychangu_subscriptions'] ?? 0) . "\n\n";
}

// Process due renewals for both gateways
echo "🔄 Processing subscription renewals...\n";
$today = date('Y-m-d');

// Find all subscriptions due for renewal today or past due
$renewalQuery = "
    SELECT 
        u.id, 
        u.email, 
        u.full_name,
        u.subscription_id, 
        u.subscription_status, 
        u.subscription_tier, 
        u.subscription_payment_gateway, 
        u.subscription_active,
        u.subscription_start_date,
        u.subscription_renewal_date,
        COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) as calculated_renewal_date
    FROM users u
    WHERE (u.subscription_active = 1 OR u.subscription_status = 'ACTIVE')
    AND u.subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
    AND (u.subscription_grace_period_end IS NULL OR u.subscription_grace_period_end > NOW())
    AND (
        u.subscription_renewal_date <= '$today' 
        OR (u.subscription_renewal_date IS NULL AND DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH) <= '$today')
    )
    ORDER BY u.subscription_payment_gateway, u.subscription_renewal_date
";

$renewalResult = mysqli_query($db, $renewalQuery);

if (!$renewalResult) {
    echo "❌ Database query failed: " . mysqli_error($db) . "\n";
    $db->close();
    exit(1);
}

$found = mysqli_num_rows($renewalResult);
echo "🔍 Found $found subscriptions due for renewal\n\n";

if ($found > 0) {
    $processed = 0;
    $squareProcessed = 0;
    $paychanguProcessed = 0;
    $errors = 0;
    
    while ($subscription = mysqli_fetch_assoc($renewalResult)) {
        echo "  Processing user ID: {$subscription['id']}, Email: {$subscription['email']}\n";
        echo "    Gateway: {$subscription['subscription_payment_gateway']}, Tier: {$subscription['subscription_tier']}\n";
        echo "    Renewal Date: {$subscription['subscription_renewal_date']}\n";
        
        try {
            if ($subscription['subscription_payment_gateway'] === 'square') {
                // SQUARE: Handle automatic renewal validation
                $success = processSquareRenewal($db, $subscription);
                if ($success) {
                    $squareProcessed++;
                    echo "    ✓ Square renewal processed successfully\n";
                } else {
                    $errors++;
                    echo "    ✗ Failed to process Square renewal\n";
                }
                
            } elseif ($subscription['subscription_payment_gateway'] === 'paychangu') {
                // PAYCHANGU: Handle manual renewal with grace period
                $success = processPaychanguRenewal($db, $subscription);
                if ($success) {
                    $paychanguProcessed++;
                    echo "    ✓ Paychangu renewal initiated successfully\n";
                } else {
                    $errors++;
                    echo "    ✗ Failed to initiate Paychangu renewal\n";
                }
                
            } else {
                // Unknown gateway - default to Paychangu
                echo "    ⚠️ Unknown gateway '{$subscription['subscription_payment_gateway']}', defaulting to Paychangu\n";
                $subscription['subscription_payment_gateway'] = 'paychangu';
                $success = processPaychanguRenewal($db, $subscription);
                if ($success) {
                    $paychanguProcessed++;
                    echo "    ✓ Paychangu renewal initiated successfully\n";
                } else {
                    $errors++;
                    echo "    ✗ Failed to initiate Paychangu renewal\n";
                }
            }
            
            $processed++;
            echo "\n";
            
        } catch (Exception $e) {
            echo "    ✗ Error processing renewal: " . $e->getMessage() . "\n\n";
            $errors++;
        }
    }
    
    echo "✅ Processing Summary:\n";
    echo "  Total processed: $processed\n";
    echo "  Square renewals: $squareProcessed\n";
    echo "  Paychangu renewals: $paychanguProcessed\n";
    if ($errors > 0) {
        echo "  Errors: $errors\n";
    }
    
} else {
    echo "ℹ️ No subscriptions due for renewal today\n";
}

// Check for expired grace periods (Paychangu only)
echo "\n⏳ Checking for expired grace periods...\n";
$graceQuery = "
    SELECT u.id, u.email, u.full_name, u.subscription_tier
    FROM users u
    WHERE u.subscription_active = 1
    AND u.subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
    AND u.subscription_payment_gateway = 'paychangu'
    AND u.subscription_grace_period_end IS NOT NULL
    AND u.subscription_grace_period_end <= NOW()
";

$graceResult = mysqli_query($db, $graceQuery);
if ($graceResult) {
    $expiredCount = mysqli_num_rows($graceResult);
    if ($expiredCount > 0) {
        echo "⚠️ Found $expiredCount subscriptions with expired grace periods\n";
        
        while ($expired = mysqli_fetch_assoc($graceResult)) {
            // Suspend subscription
            $suspendQuery = "
                UPDATE users 
                SET subscription_status = 'SUSPENDED',
                    subscription_active = 0,
                    subscription_grace_period_end = NULL,
                    subscription_updated_at = NOW()
                WHERE id = {$expired['id']}
            ";
            
            if (mysqli_query($db, $suspendQuery)) {
                // Send suspension notification
                $suspensionSuccess = sendSuspensionEmail($expired);
                if ($suspensionSuccess) {
                    echo "  ✓ Suspended and notified: {$expired['email']}\n";
                } else {
                    echo "  ✗ Suspended but failed to notify: {$expired['email']}\n";
                }
            }
        }
    } else {
        echo "✅ No expired grace periods found\n";
    }
}

$db->close();

echo "\n========================================\n";
echo "✓ Unified renewal process completed at " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n";
exit(0);

/**
 * Process Square subscription renewal (automatic validation)
 */
function processSquareRenewal($db, $subscription) {
    // For Square subscriptions, the charge happens automatically via Square's API
    // Our job is to validate the renewal and update the database
    
    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
    
    // Update renewal date (Square handles the actual charging)
    $updateQuery = "
        UPDATE users 
        SET subscription_renewal_date = '$nextRenewal',
            subscription_updated_at = NOW()
        WHERE id = {$subscription['id']}
    ";
    
    if (!mysqli_query($db, $updateQuery)) {
        error_log("Failed to update Square renewal date for user {$subscription['id']}: " . mysqli_error($db));
        return false;
    }
    
    // Send renewal confirmation email
    $emailSuccess = sendSquareRenewalConfirmation($subscription, $nextRenewal);
    
    return true; // Square renewal processed successfully
}

/**
 * Process Paychangu subscription renewal (manual with grace period)
 */
function processPaychanguRenewal($db, $subscription) {
    // Set grace period (7 days by default)
    $gracePeriodEnd = date('Y-m-d H:i:s', strtotime('+7 days'));
    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
    
    // Update subscription with grace period
    $updateQuery = "
        UPDATE users 
        SET subscription_status = 'PENDING_PAYMENT',
            subscription_grace_period_end = '$gracePeriodEnd',
            subscription_renewal_date = '$nextRenewal',
            subscription_updated_at = NOW()
        WHERE id = {$subscription['id']}
    ";
    
    if (!mysqli_query($db, $updateQuery)) {
        error_log("Failed to set grace period for Paychangu user {$subscription['id']}: " . mysqli_error($db));
        return false;
    }
    
    // Generate payment request and send email
    $tierPrices = [
        'plus' => 6000,      // MWK 6,000
        'premium' => 10000   // MWK 10,000
    ];
    
    $amount = $tierPrices[$subscription['subscription_tier']] ?? 6000;
    $txRef = 'RENEWAL-' . strtoupper(bin2hex(random_bytes(6))) . '-' . time();
    
    $emailSuccess = sendPaychanguRenewalEmail($subscription, $amount, $txRef, $gracePeriodEnd);
    
    return $emailSuccess;
}

/**
 * Send Square renewal confirmation email
 */
function sendSquareRenewalConfirmation($subscription, $nextRenewal) {
    $tierNames = [
        'plus' => 'XtraPush Plus',
        'premium' => 'XtraPush Premium'
    ];
    
    $tierName = $tierNames[$subscription['subscription_tier']] ?? 'Subscription';
    
    $subject = "✅ {$tierName} Subscription Renewed";
    $message = "
    <h2>Subscription Renewed Successfully</h2>
    <p>Hello {$subscription['full_name']},</p>
    <p>Your {$tierName} subscription has been automatically renewed.</p>
    <p><strong>Next renewal date:</strong> {$nextRenewal}</p>
    <p>Your payment was processed successfully via Square. No further action is needed.</p>
    <p>Thank you for choosing XtraPush!</p>
    ";
    
    return sendEmail($subscription['email'], $subject, $message);
}

/**
 * Send Paychangu renewal notification email
 */
function sendPaychanguRenewalEmail($subscription, $amount, $txRef, $gracePeriodEnd) {
    $tierNames = [
        'plus' => 'XtraPush Plus',
        'premium' => 'XtraPush Premium'
    ];
    
    $tierName = $tierNames[$subscription['subscription_tier']] ?? 'Subscription';
    $formattedAmount = number_format($amount);
    $graceDate = date('F j, Y', strtotime($gracePeriodEnd));
    
    $subject = "🔔 {$tierName} Renewal - Payment Required";
    $message = "
    <h2>Subscription Renewal Required</h2>
    <p>Hello {$subscription['full_name']},</p>
    <p>Your {$tierName} subscription is due for renewal.</p>
    
    <div style='background: #f0f8ff; padding: 20px; margin: 20px 0; border-left: 4px solid #48cedb;'>
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> MWK {$formattedAmount}</p>
        <p><strong>Reference:</strong> {$txRef}</p>
        <p><strong>Grace Period Ends:</strong> {$graceDate}</p>
        <p>You have 7 days to complete this payment before your subscription is suspended.</p>
    </div>
    
    <p><a href='https://itsxtrapush.com/subscription/pay/{$txRef}' 
          style='display: inline-block; padding: 12px 24px; background: #48cedb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
       Pay Now - MWK {$formattedAmount}
    </a></p>
    
    <p style='font-size: 12px; color: #666;'>
        <strong>Note:</strong> If payment is not received by {$graceDate}, your subscription will be suspended.
    </p>
    ";
    
    return sendEmail($subscription['email'], $subject, $message);
}

/**
 * Send suspension email
 */
function sendSuspensionEmail($user) {
    $message = "
    <h2>Subscription Suspended</h2>
    <p>Hello {$user['full_name']},</p>
    <p>Your {$user['subscription_tier']} subscription has been suspended due to non-payment.</p>
    <p>To reactivate your subscription and restore benefits, please contact conrad@itsxtrapush.com or visit your dashboard.</p>
    ";
    
    return sendEmail($user['email'], '⚠️ Subscription Suspended', $message);
}

/**
 * Generic email sending function
 */
function sendEmail($to, $subject, $htmlBody) {
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: XtraPush Subscriptions <subscriptions@itsxtrapush.com>',
        'Reply-To: conrad@itsxtrapush.com'
    ];
    
    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}
?>