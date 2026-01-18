<?php
// XtraPush Subscription Renewal Manager - Production Version
echo "========================================\n";
echo "XtraPush Subscription Renewal System\n";
echo "========================================\n\n";
echo "Starting renewal process at " . date('Y-m-d H:i:s') . "\n\n";

// Database connection
$db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');

if ($db->connect_error) {
    echo "Database connection failed: " . $db->connect_error . "\n";
    exit(1);
}

$db->set_charset('utf8mb4');

// Simple subscription stats query
$query = "SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN subscription_active = 1 THEN 1 ELSE 0 END) as active_subscriptions,
    SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_status_subscriptions
FROM users";

$result = mysqli_query($db, $query);
if ($result) {
    $stats = mysqli_fetch_assoc($result);
    echo "Subscription Statistics:\n";
    echo "  Total users: " . ($stats['total_users'] ?? 0) . "\n";
    echo "  Active subscriptions: " . ($stats['active_subscriptions'] ?? 0) . "\n";
    echo "  Active status subscriptions: " . ($stats['active_status_subscriptions'] ?? 0) . "\n";
}

// Simple renewal check query
$today = date('Y-m-d');
$renewalQuery = "SELECT 
    u.id, u.email, u.full_name, u.subscription_tier, u.subscription_payment_gateway,
    u.subscription_renewal_date, u.subscription_start_date
FROM users u
WHERE (u.subscription_active = 1 OR u.subscription_status = 'ACTIVE')
AND u.subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
AND (u.subscription_grace_period_end IS NULL OR u.subscription_grace_period_end > NOW())
AND (
    u.subscription_renewal_date <= '$today' 
    OR (u.subscription_renewal_date IS NULL AND DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH) <= '$today')
)";

$renewalResult = mysqli_query($db, $renewalQuery);
if ($renewalResult) {
    $found = mysqli_num_rows($renewalResult);
    echo "Found $found subscriptions due for renewal\n";
    
    if ($found > 0) {
        $processed = 0;
        while ($row = mysqli_fetch_assoc($renewalResult)) {
            echo "  Processing: {$row['email']} ({$row['subscription_tier']})\n";
            
            // Send renewal notification email
            $emailSent = sendRenewalNotification($row);
            if ($emailSent) {
                echo "    ✓ Email notification sent to {$row['email']}\n";
            } else {
                echo "    ✗ Failed to send email to {$row['email']}\n";
            }
            
            $processed++;
        }
        echo "Processed $processed renewals\n";
    } else {
        echo "No renewals to process\n";
    }
}

/**
 * Send renewal notification email
 */
function sendRenewalNotification($user) {
    $to = $user['email'];
    $subject = "XtraPush Subscription Renewal Reminder";
    
    $message = "<html><body>";
    $message .= "<h2>XtraPush Subscription Renewal</h2>";
    $message .= "<p>Hello " . htmlspecialchars($user['full_name'] ?? 'Customer') . ",</p>";
    $message .= "<p>Your XtraPush " . htmlspecialchars($user['subscription_tier']) . " subscription is due for renewal.</p>";
    $message .= "<p>Please log in to your account to complete the renewal process.</p>";
    $message .= "<p>Thank you for choosing XtraPush!</p>";
    $message .= "</body></html>";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: XtraPush <noreply@sparkle-pro.co.uk>\r\n";
    
    return mail($to, $subject, $message, $headers);
}

$db->close();
echo "\n========================================\n";
echo "✓ Renewal process completed successfully at " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n";
exit(0);
?>