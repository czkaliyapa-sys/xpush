<?php
// XtraPush Enhanced Unified Subscription Renewal Manager
// Based on oldsub.php logic with PHPMailer integration
// Handles both Square and Paychangu subscriptions

echo "========================================\n";
echo "XtraPush Enhanced Subscription Renewal System\n";
echo "========================================\n\n";
echo "Starting enhanced renewal process at " . date('Y-m-d H:i:s') . "\n\n";

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

// Process subscriptions due for renewal (within next 7 days)
echo "🔄 Processing subscriptions due for renewal...\n";
$today = date('Y-m-d');
$sevenDaysFromNow = date('Y-m-d', strtotime('+7 days'));

// Find ALL subscriptions (both Square and Paychangu) due within 7 days
$sql = "
    SELECT 
        u.id, 
        u.uid, 
        u.email, 
        u.full_name,
        u.subscription_tier as tier,
        u.subscription_renewal_date,
        u.subscription_payment_gateway,
        u.subscription_active,
        u.last_renewal_reminder_sent
    FROM users u
    WHERE u.subscription_active = 1
      AND u.subscription_status = 'ACTIVE'
      AND u.subscription_renewal_date BETWEEN '$today' AND '$sevenDaysFromNow'
      AND (u.last_renewal_reminder_sent IS NULL OR u.last_renewal_reminder_sent < DATE_SUB(NOW(), INTERVAL 2 DAY))
    ORDER BY u.subscription_payment_gateway, u.subscription_renewal_date ASC
";

$result = mysqli_query($db, $sql);

if (!$result) {
    echo "❌ Database query failed: " . mysqli_error($db) . "\n";
    $db->close();
    exit(1);
}

$found = mysqli_num_rows($result);
echo "🔍 Found $found subscriptions due for renewal (within next 7 days)\n\n";

if ($found > 0) {
    $processedCount = 0;
    $errorCount = 0;
    $squareProcessed = 0;
    $paychanguProcessed = 0;
    
    while ($subscription = mysqli_fetch_assoc($result)) {
        try {
            echo "  Processing: {$subscription['email']} ({$subscription['tier']}) - Gateway: {$subscription['subscription_payment_gateway']}\n";
            echo "    Due: {$subscription['subscription_renewal_date']}\n";
            
            if ($subscription['subscription_payment_gateway'] === 'paychangu') {
                // Process Paychangu subscription renewal
                $success = processPaychanguRenewal($db, $subscription);
                if ($success) {
                    $paychanguProcessed++;
                    echo "    ✓ Paychangu renewal notification sent\n";
                } else {
                    $errorCount++;
                    echo "    ✗ Failed to process Paychangu renewal\n";
                }
                
            } elseif ($subscription['subscription_payment_gateway'] === 'square') {
                // Process Square subscription renewal notification
                $success = processSquareRenewal($db, $subscription);
                if ($success) {
                    $squareProcessed++;
                    echo "    ✓ Square renewal notification sent\n";
                } else {
                    $errorCount++;
                    echo "    ✗ Failed to process Square renewal\n";
                }
                
            } else {
                echo "    ⚠️ Unknown payment gateway: {$subscription['subscription_payment_gateway']}\n";
                $errorCount++;
            }
            
            $processedCount++;
            echo "\n";
            
            // Small delay to avoid rate limiting
            usleep(500000); // 0.5 seconds
            
        } catch (Exception $e) {
            echo "    ✗ Error processing subscription: " . $e->getMessage() . "\n\n";
            $errorCount++;
        }
    }
    
    echo "✅ Processing Summary:\n";
    echo "  Total processed: $processedCount\n";
    echo "  Square notifications: $squareProcessed\n";
    echo "  Paychangu notifications: $paychanguProcessed\n";
    if ($errorCount > 0) {
        echo "  Errors: $errorCount\n";
    }
    
} else {
    echo "ℹ️ No subscriptions due for renewal in the next 7 days\n";
}

// Check for overdue subscriptions (past renewal date)
echo "\n⏳ Checking for overdue subscriptions...\n";
$overdueQuery = "
    SELECT id, uid, email, full_name, subscription_tier, subscription_renewal_date, subscription_payment_gateway
    FROM users
    WHERE subscription_active = 1
      AND subscription_status = 'ACTIVE'
      AND subscription_renewal_date < CURDATE()
";

$overdueResult = mysqli_query($db, $overdueQuery);

if ($overdueResult && mysqli_num_rows($overdueResult) > 0) {
    $overdueCount = mysqli_num_rows($overdueResult);
    echo "⚠️ Found $overdueCount overdue subscriptions\n";
    
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
                echo "  ✓ Suspended and notified: {$overdue['email']} ({$overdue['subscription_payment_gateway']})\n";
            } else {
                echo "  ✗ Suspended but failed to notify: {$overdue['email']}\n";
            }
        }
    }
} else {
    echo "✅ No overdue subscriptions found\n";
}

// Process analytics data for admin dashboard
echo "\n📊 Processing analytics data for dashboard...\n";
processAnalytics($db);

$db->close();

echo "\n========================================\n";
echo "✓ Enhanced renewal process completed at " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n";
exit(0);

// ========================================================================
// FUNCTION DEFINITIONS
// ========================================================================

/**
 * Process Paychangu subscription renewal (based on oldsub.php logic)
 */
function processPaychanguRenewal($db, $subscription) {
    try {
        // Create PayChangu checkout for renewal (from oldsub.php)
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
        
        // Create PayChangu checkout
        $payload = [
            'tx_ref' => $txRef,
            'amount' => $amount,
            'currency' => 'MWK',
            'email' => $subscription['email'],
            'first_name' => $subscription['full_name'] ?? 'Customer',
            'last_name' => '',
            'callback_url' => 'https://sparkle-pro.xtrapush.net/webhook-paychangu',
            'return_url' => 'https://itsxtrapush.com/dashboard?subscription=renewed',
            'customization' => [
                'title' => $tierName . ' - Monthly Renewal',
                'description' => 'Subscription renewal payment'
            ],
            'meta' => [
                'userUid' => $subscription['uid'],
                'type' => 'subscription_renewal',
                'tier' => $subscription['tier']
            ]
        ];
        
        // Call PayChangu API
        $ch = curl_init('https://api.paychangu.com/payment');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer sec-live-Z8Yv7SbOVKEXZsMBZTJL4zZS8dlYaq6j'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $data = json_decode($response, true);
            
            // Get checkout URL
            $checkoutUrl = '';
            if (isset($data['data']['checkout_url'])) {
                $checkoutUrl = $data['data']['checkout_url'];
            } elseif (isset($data['data']['authorization_url'])) {
                $checkoutUrl = $data['data']['authorization_url'];
            }
            
            if ($checkoutUrl) {
                // Add checkout URL to subscription array for email
                $subscription['checkout_url'] = $checkoutUrl;
                
                // Generate and send renewal email
                $invoiceHTML = generateRenewalEmail($subscription, $tierName, $amount, 'MWK');
                $subject = "🔔 {$tierName} Renewal - Payment Due";
                
                if (sendEmailWithPHPMailer($subscription['email'], $subject, $invoiceHTML)) {
                    // Update last reminder sent timestamp
                    $updateStmt = $db->prepare("UPDATE users SET last_renewal_reminder_sent = NOW() WHERE id = ?");
                    $updateStmt->bind_param('i', $subscription['id']);
                    $updateStmt->execute();
                    $updateStmt->close();
                    return true;
                }
            }
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("Error processing Paychangu renewal for {$subscription['email']}: " . $e->getMessage());
        return false;
    }
}

/**
 * Process Square subscription renewal notification
 */
function processSquareRenewal($db, $subscription) {
    try {
        // For Square subscriptions, send renewal reminder email
        // Square handles the actual charging automatically
        
        $tierNames = [
            'plus' => 'XtraPush Plus',
            'premium' => 'XtraPush Premium'
        ];
        
        $tierName = $tierNames[$subscription['tier']] ?? 'Subscription';
        
        // Generate renewal reminder email
        $reminderHTML = generateSquareRenewalReminder($subscription, $tierName);
        $subject = "🔔 {$tierName} Automatic Renewal Reminder";
        
        if (sendEmailWithPHPMailer($subscription['email'], $subject, $reminderHTML)) {
            // Update last reminder sent timestamp
            $updateStmt = $db->prepare("UPDATE users SET last_renewal_reminder_sent = NOW() WHERE id = ?");
            $updateStmt->bind_param('i', $subscription['id']);
            $updateStmt->execute();
            $updateStmt->close();
            return true;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("Error processing Square renewal for {$subscription['email']}: " . $e->getMessage());
        return false;
    }
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
    
    return sendEmailWithPHPMailer($user['email'], '⚠️ Subscription Suspended', $message);
}

/**
 * Generate renewal email HTML (based on oldsub.php)
 */
function generateRenewalEmail($subscription, $tierName, $amount, $currency) {
    $formattedAmount = $currency === 'MWK' ? 'MWK ' . number_format($amount) : '£' . number_format($amount/100, 2);
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
            .invoice-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #48cedb; }
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
                
                <div class='invoice-details'>
                    <h3>Invoice Details</h3>
                    <p><strong>Plan:</strong> {$tierName}</p>
                    <p><strong>Invoice Date:</strong> {$invoiceDate}</p>
                    <p><strong>Due Date:</strong> {$dueDate}</p>
                    <p><strong>Amount Due:</strong> <span class='amount'>{$formattedAmount}</span></p>
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
                    <a href='{$subscription['checkout_url']}' class='button'>Pay Now - {$formattedAmount}</a>
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
 * Generate Square renewal reminder email
 */
function generateSquareRenewalReminder($subscription, $tierName) {
    $renewalDate = date('F j, Y', strtotime($subscription['subscription_renewal_date']));
    
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
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #48cedb; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔔 Automatic Subscription Renewal</h1>
                <p>Your subscription will renew automatically</p>
            </div>
            <div class='content'>
                <h2>Hello {$subscription['full_name']},</h2>
                <p>This is a reminder that your <strong>{$tierName}</strong> subscription will renew automatically on <strong>{$renewalDate}</strong>.</p>
                
                <div class='info-box'>
                    <h3>What Happens Next</h3>
                    <ul>
                        <li>✅ Your card on file will be charged automatically</li>
                        <li>✅ No action is required from you</li>
                        <li>✅ Your subscription benefits will continue uninterrupted</li>
                        <li>✅ You'll receive a confirmation email after renewal</li>
                    </ul>
                </div>
                
                <p><strong>Your subscription benefits include:</strong></p>
                <ul>
                    <li>✅ Free unlimited delivery on all orders</li>
                    <li>✅ " . ($subscription['tier'] === 'premium' ? 'Multiple' : 'Single') . " gadget insurance (1 year)</li>
                    <li>✅ Member discounts</li>
    " . ($subscription['tier'] === 'premium' ? "
                    <li>✅ Priority support</li>
                    <li>✅ Early access to new gadgets</li>
    " : "") . "
                </ul>
                
                <p style='font-size: 12px; color: #666;'>
                    <strong>Note:</strong> If you wish to cancel or modify your subscription, please visit your account dashboard before {$renewalDate}.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
}

/**
 * Send email using PHPMailer (based on index.php configuration)
 */
function sendEmailWithPHPMailer($to, $subject, $htmlBody) {
    // Include PHPMailer if available
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        // Fallback to basic mail() function
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: XtraPush Subscriptions <subscriptions@itsxtrapush.com>',
            'Reply-To: conrad@itsxtrapush.com'
        ];
        
        return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    }
    
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // SMTP Configuration (from index.php)
        $mail->isSMTP();
        $mail->Host = 'mail.deegits.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'conrad@deegits.com';
        $mail->Password = 'brickwall2010?';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        
        // Email content
        $mail->setFrom('subscriptions@itsxtrapush.com', 'XtraPush Subscriptions');
        $mail->addAddress($to);
        $mail->addReplyTo('conrad@itsxtrapush.com', 'XtraPush Support');
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        
        return $mail->send();
        
    } catch (Exception $e) {
        error_log("PHPMailer Error: " . $e->getMessage());
        return false;
    }
}

// ========================================================================
// ANALYTICS PROCESSING (copied from analytics_processor.php)
// ========================================================================

function processAnalytics($db) {
    try {
        // Ensure analytics_cache table exists
        ensureAnalyticsCacheTable($db);
        
        // Calculate all metrics
        $visitorStats = calculateVisitorStats($db);
        $orderStats = calculateOrderStats($db);
        $revenueStats = calculateRevenueStats($db);
        $gadgetStats = calculateGadgetStats($db);
        $userStats = calculateUserStats($db);
        $subscriptionStats = calculateSubscriptionStats($db);
        $conversionStats = calculateConversionStats($db);
        $popularProducts = calculatePopularProducts($db);
        
        // Update cache
        updateAnalyticsCache($db, [
            'visitor_stats' => $visitorStats,
            'order_stats' => $orderStats,
            'revenue_stats' => $revenueStats,
            'gadget_stats' => $gadgetStats,
            'user_stats' => $userStats,
            'subscription_stats' => $subscriptionStats,
            'conversion_stats' => $conversionStats,
            'popular_products' => $popularProducts
        ]);
        
        echo "  ✓ Analytics processing completed\n";
        
    } catch (Exception $e) {
        echo "  ✗ Analytics processing failed: " . $e->getMessage() . "\n";
    }
}

// ... rest of analytics functions would go here (same as analytics_processor.php)
// For brevity, I'm showing the key ones:

function ensureAnalyticsCacheTable($db) {
    $query = "CREATE TABLE IF NOT EXISTS `analytics_cache` (
        `id` INT PRIMARY KEY DEFAULT 1,
        `visitor_stats` JSON,
        `order_stats` JSON,
        `revenue_stats` JSON,
        `gadget_stats` JSON,
        `user_stats` JSON,
        `subscription_stats` JSON,
        `conversion_stats` JSON,
        `popular_products` JSON,
        `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_last_updated` (`last_updated`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if (!mysqli_query($db, $query)) {
        throw new Exception("Failed to create analytics_cache table: " . mysqli_error($db));
    }
}

function calculateVisitorStats($db) {
    $query = "
        SELECT 
            COUNT(DISTINCT session_id) as total_unique_visitors,
            COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                  THEN session_id END) as visitors_this_month,
            COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                  THEN session_id END) as visitors_this_week,
            COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE() 
                  THEN session_id END) as visitors_today,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN 1 ELSE 0 END) as page_views_month
        FROM analytics_page_views
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    ";
    
    $result = mysqli_query($db, $query);
    if (!$result) {
        return getEmptyVisitorStats();
    }
    
    $stats = mysqli_fetch_assoc($result);
    
    // Calculate product views
    $productViewsQuery = "
        SELECT 
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN 1 ELSE 0 END) as product_views_month
        FROM analytics_events
        WHERE event_type IN ('view_product', 'product_view')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    ";
    
    $productResult = mysqli_query($db, $productViewsQuery);
    if ($productResult) {
        $productStats = mysqli_fetch_assoc($productResult);
        $stats['product_views_month'] = $productStats['product_views_month'] ?? 0;
    } else {
        $stats['product_views_month'] = 0;
    }
    
    return $stats;
}

function getEmptyVisitorStats() {
    return [
        'total_unique_visitors' => 0,
        'visitors_this_month' => 0,
        'visitors_this_week' => 0,
        'visitors_today' => 0,
        'page_views_month' => 0,
        'product_views_month' => 0
    ];
}

function calculateOrderStats($db) {
    $query = "
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN 1 ELSE 0 END) as orders_this_month,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
            SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    ";
    
    $result = mysqli_query($db, $query);
    return $result ? mysqli_fetch_assoc($result) : [];
}

function calculateRevenueStats($db) {
    $query = "
        SELECT 
            COALESCE(SUM(total_amount), 0) as total_revenue_mwk,
            COALESCE(SUM(total_amount_gbp), 0) as total_revenue_gbp,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN total_amount ELSE 0 END), 0) as revenue_this_month_mwk,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN total_amount_gbp ELSE 0 END), 0) as revenue_this_month_gbp
        FROM orders
        WHERE payment_status = 'paid'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    ";
    
    $result = mysqli_query($db, $query);
    if (!$result) {
        return ['mwk' => ['total' => 0, 'this_month' => 0], 'gbp' => ['total' => 0, 'this_month' => 0]];
    }
    
    $raw = mysqli_fetch_assoc($result);
    return [
        'mwk' => [
            'total' => floatval($raw['total_revenue_mwk']),
            'this_month' => floatval($raw['revenue_this_month_mwk'])
        ],
        'gbp' => [
            'total' => floatval($raw['total_revenue_gbp']),
            'this_month' => floatval($raw['revenue_this_month_gbp'])
        ]
    ];
}

function calculateGadgetStats($db) {
    $query = "
        SELECT 
            COUNT(*) as total_gadgets,
            SUM(CASE WHEN category = 'smartphone' THEN 1 ELSE 0 END) as smartphones_count,
            SUM(CASE WHEN category = 'laptop' THEN 1 ELSE 0 END) as laptops_count,
            SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as in_stock_count,
            COALESCE(SUM(stock_quantity), 0) as total_stock_units
        FROM gadgets
    ";
    
    $result = mysqli_query($db, $query);
    return $result ? mysqli_fetch_assoc($result) : [];
}

function calculateUserStats($db) {
    $query = "
        SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN subscription_active = 1 THEN 1 ELSE 0 END) as active_subscribers
        FROM users
    ";
    
    $result = mysqli_query($db, $query);
    return $result ? mysqli_fetch_assoc($result) : [];
}

function calculateSubscriptionStats($db) {
    $query = "
        SELECT 
            COUNT(*) as total_subscriptions,
            SUM(CASE WHEN subscription_tier = 'plus' THEN 1 ELSE 0 END) as plus_count,
            SUM(CASE WHEN subscription_tier = 'premium' THEN 1 ELSE 0 END) as premium_count,
            SUM(CASE WHEN subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count
        FROM users
        WHERE subscription_active = 1
    ";
    
    $result = mysqli_query($db, $query);
    return $result ? mysqli_fetch_assoc($result) : [];
}

function calculateConversionStats($db) {
    $query = "
        SELECT 
            SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
            SUM(CASE WHEN event_type IN ('checkout_complete', 'checkoutComplete') THEN 1 ELSE 0 END) as checkout_completes
        FROM analytics_events
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ";
    
    $result = mysqli_query($db, $query);
    $stats = $result ? mysqli_fetch_assoc($result) : [];
    
    $pageViews = intval($stats['page_views'] ?? 0);
    $checkoutCompletes = intval($stats['checkout_completes'] ?? 0);
    $stats['conversion_rate'] = $pageViews > 0 ? round(($checkoutCompletes / $pageViews) * 100, 2) : 0;
    
    return $stats;
}

function calculatePopularProducts($db) {
    $query = "
        SELECT 
            oi.gadget_id,
            g.name as product_name,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.unit_price * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN gadgets g ON oi.gadget_id = g.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.payment_status = 'paid'
        GROUP BY oi.gadget_id, g.name
        ORDER BY total_quantity DESC
        LIMIT 10
    ";
    
    $result = mysqli_query($db, $query);
    $products = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $products[] = $row;
        }
    }
    return $products;
}

function updateAnalyticsCache($db, $data) {
    // Convert arrays to JSON
    $jsonData = [];
    foreach ($data as $key => $value) {
        $jsonData[$key] = json_encode($value, JSON_UNESCAPED_UNICODE);
    }
    
    // Use REPLACE INTO to insert or update
    $query = "
        REPLACE INTO analytics_cache 
        (id, visitor_stats, order_stats, revenue_stats, gadget_stats, user_stats, 
         subscription_stats, conversion_stats, popular_products, last_updated)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ";
    
    $stmt = mysqli_prepare($db, $query);
    if (!$stmt) {
        throw new Exception("Failed to prepare update query: " . mysqli_error($db));
    }
    
    mysqli_stmt_bind_param(
        $stmt,
        'ssssssss',
        $jsonData['visitor_stats'],
        $jsonData['order_stats'],
        $jsonData['revenue_stats'],
        $jsonData['gadget_stats'],
        $jsonData['user_stats'],
        $jsonData['subscription_stats'],
        $jsonData['conversion_stats'],
        $jsonData['popular_products']
    );
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Failed to update cache: " . mysqli_stmt_error($stmt));
    }
    
    mysqli_stmt_close($stmt);
}
?>