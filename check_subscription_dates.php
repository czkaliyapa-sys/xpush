<?php
// Diagnostic script to check subscription renewal dates
require_once 'sparkle-pro-api/config.php';

echo "=== Subscription Renewal Date Diagnostic ===\n";
echo "Current date: " . date('Y-m-d H:i:s') . "\n";
echo "Today (date only): " . date('Y-m-d') . "\n\n";

// Check all active subscriptions
$query = "
    SELECT 
        id,
        email,
        subscription_tier,
        subscription_payment_gateway,
        subscription_status,
        subscription_active,
        subscription_renewal_date,
        subscription_start_date,
        subscription_grace_period_end,
        COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)) as calculated_renewal_date,
        DATEDIFF(COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)), CURDATE()) as days_until_renewal
    FROM users
    WHERE subscription_active = 1 OR subscription_status = 'ACTIVE'
    ORDER BY calculated_renewal_date ASC
";

$result = mysqli_query($conn, $query);

if ($result) {
    echo "Found " . mysqli_num_rows($result) . " active subscriptions:\n\n";
    
    while ($row = mysqli_fetch_assoc($result)) {
        $daysUntil = $row['days_until_renewal'];
        $status = $daysUntil <= 0 ? '⚠️ DUE NOW or OVERDUE' : "✓ {$daysUntil} days until renewal";
        
        echo "User ID: {$row['id']}\n";
        echo "  Email: {$row['email']}\n";
        echo "  Tier: {$row['subscription_tier']}\n";
        echo "  Gateway: {$row['subscription_payment_gateway']}\n";
        echo "  Status: {$row['subscription_status']}\n";
        echo "  Active: {$row['subscription_active']}\n";
        echo "  Renewal Date: {$row['subscription_renewal_date']}\n";
        echo "  Start Date: {$row['subscription_start_date']}\n";
        echo "  Calculated Renewal: {$row['calculated_renewal_date']}\n";
        echo "  Grace Period End: {$row['subscription_grace_period_end']}\n";
        echo "  Days Until Renewal: $status\n";
        echo "  ---\n";
    }
} else {
    echo "Error: " . mysqli_error($conn) . "\n";
}

// Check specifically for due renewals using the same logic as the cron
$today = date('Y-m-d');
$dueQuery = "
    SELECT 
        id, email, subscription_renewal_date,
        COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)) as calculated_renewal_date
    FROM users
    WHERE (subscription_active = 1 OR subscription_status = 'ACTIVE')
    AND subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
    AND (subscription_grace_period_end IS NULL OR subscription_grace_period_end > NOW())
    AND (
        subscription_renewal_date <= '$today' 
        OR (subscription_renewal_date IS NULL AND DATE_ADD(subscription_start_date, INTERVAL 1 MONTH) <= '$today')
    )
";

echo "\n=== Checking for subscriptions due for renewal (as of $today) ===\n";
$dueResult = mysqli_query($conn, $dueQuery);

if ($dueResult) {
    $dueCount = mysqli_num_rows($dueResult);
    echo "Found $dueCount subscriptions due for renewal:\n";
    
    if ($dueCount > 0) {
        while ($row = mysqli_fetch_assoc($dueResult)) {
            echo "  {$row['email']} - Renewal: {$row['subscription_renewal_date']}, Calculated: {$row['calculated_renewal_date']}\n";
        }
    } else {
        echo "  No subscriptions are currently due for renewal\n";
    }
} else {
    echo "Error checking due renewals: " . mysqli_error($conn) . "\n";
}

mysqli_close($conn);
?>