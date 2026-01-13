<?php
/**
 * Subscription Renewal Manager + Analytics Processor
 * 
 * Handles recurring subscription management across both payment gateways:
 * - Square (automatic via native API)
 * - Paychangu (manual billing with automated reminders)
 * 
 * AND processes analytics data aggregation:
 * - Calculates visitor statistics with historical comparisons
 * - Updates analytics_cache for instant dashboard loading
 * 
 * This script should be run by a cron job hourly:
 * Cron: 0 * * * * php /path/to/subscription_renewal_manager.php
 * Or triggered via HTTP endpoint: GET /subscriptions/process-renewals
 * 
 * Responsibilities:
 * 1. Check for subscriptions due for renewal
 * 2. Send reminder notifications (5 days, 1 day, day-of)
 * 3. Process renewals for both gateways
 * 4. Handle grace periods for failed payments
 * 5. Suspend accounts after grace period expires
 * 6. Log all subscription events to subscription_history
 * 7. Process analytics data (hourly aggregation)
 */

// Database credentials (aligned with index.php)
if (!defined('DB_HOST')) { define('DB_HOST', 'localhost'); }
if (!defined('DB_NAME')) { define('DB_NAME', 'itsxtrapush_db'); }
if (!defined('DB_USER')) { define('DB_USER', 'xuser'); }
if (!defined('DB_PASS')) { define('DB_PASS', 'Xpush2025?'); }

// PayChangu credentials
if (!defined('PAYCHANGU_SECRET_KEY')) { define('PAYCHANGU_SECRET_KEY', 'sec-live-Z8Yv7SbOVKEXZsMBZTJL4zZS8dlYaq6j'); }
if (!defined('PAYCHANGU_BASE_URL')) { define('PAYCHANGU_BASE_URL', 'https://api.paychangu.com'); }

class SubscriptionRenewalManager {
    private $conn;
    private $table = 'users';
    private $history_table = 'subscription_history';
    
    // Configuration constants
    const GRACE_PERIOD_DAYS = 7;
    const REMINDER_DAYS_BEFORE = [5, 1]; // Send reminders 5 days and 1 day before
    const RETRY_ATTEMPTS_MAX = 3;
    const RETRY_INTERVAL_DAYS = 2;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Main process - Check and handle all subscription renewals
     */
    public function processRenewals() {
        try {
            error_log("[SubscriptionRenewal] Starting renewal processing at " . date('Y-m-d H:i:s'));
            
            // 1. Process renewals (Square auto-charges, Paychangu manual)
            $this->processActivatedRenewals();
            
            // 2. Send reminder notifications
            $this->sendReminderNotifications();
            
            // 3. Handle grace period expirations (suspend accounts)
            $this->handleExpiredGracePeriods();
            
            // 4. Log the cron execution
            $this->logCronExecution('success', 'Renewal processing completed successfully');
            
            error_log("[SubscriptionRenewal] Renewal processing completed");
            return ['status' => 'success', 'message' => 'Renewal processing completed'];
            
        } catch (Exception $e) {
            error_log("[SubscriptionRenewal] Error: " . $e->getMessage());
            $this->logCronExecution('error', $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Process renewals for subscriptions where renewal_date has passed
     */
    private function processActivatedRenewals() {
        // Get all active subscriptions where renewal_date <= today
        $query = "
            SELECT u.id, u.email, u.subscription_id, u.subscription_status, 
                   u.subscription_tier, u.subscription_payment_gateway, u.subscription_active,
                   u.subscription_start_date,
                   COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) as renewal_date
            FROM " . $this->table . " u
            WHERE u.subscription_active = 1 
            AND u.subscription_status = 'ACTIVE'
            AND COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) <= CURDATE()
            AND (u.subscription_grace_period_end IS NULL OR u.subscription_grace_period_end > NOW())
        ";
        
        $result = mysqli_query($this->conn, $query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . mysqli_error($this->conn));
        }
        
        $processed = 0;
        while ($row = mysqli_fetch_assoc($result)) {
            if ($row['subscription_payment_gateway'] === 'square') {
                $this->renewViaSquare($row);
            } elseif ($row['subscription_payment_gateway'] === 'paychangu') {
                $this->renewViaPaychangu($row);
            } else {
                // Default to square if gateway not set (should not happen after migration)
                $row['subscription_payment_gateway'] = 'square';
                $this->renewViaSquare($row);
            }
            $processed++;
        }
        
        error_log("[SubscriptionRenewal] Processed $processed active renewals");
    }
    
    /**
     * Renew subscription via Square (automatic charge)
     */
    private function renewViaSquare($user) {
        // Square handles recurring subscriptions natively via the Subscriptions API
        // We just need to verify the charge happened and update renewal_date
        
        error_log("[SubscriptionRenewal] Processing Square renewal for user {$user['id']} (Sub: {$user['subscription_id']})");
        
        // Square automatically charges subscriptions on their renewal date
        // The webhook will notify us when payment succeeds
        // Here we just update the next renewal date to keep our database in sync
        
        $next_renewal = date('Y-m-d', strtotime('+1 month'));
        
        $query = "
            UPDATE " . $this->table . " 
            SET subscription_renewal_date = '$next_renewal',
                subscription_updated_at = NOW()
            WHERE id = {$user['id']}
        ";
        
        if (mysqli_query($this->conn, $query)) {
            // Log the renewal
            $this->logSubscriptionEvent($user['id'], 'renewal_processed', [
                'gateway' => 'square',
                'previous_renewal_date' => $user['renewal_date'],
                'next_renewal_date' => $next_renewal,
                'tier' => $user['subscription_tier'],
                'note' => 'Square auto-renewal - payment handled by Square API'
            ]);
            
            // Send confirmation email
            $this->sendRenewalEmail($user, 'renewal_success', [
                'renewal_date' => $next_renewal,
                'next_due_date' => $next_renewal,
                'gateway' => 'Square',
                'tier' => $user['subscription_tier']
            ]);
        } else {
            error_log("[SubscriptionRenewal] Failed to update renewal date for user {$user['id']}: " . mysqli_error($this->conn));
        }
    }
    
    /**
     * Renew subscription via Paychangu (manual billing)
     * Generates payment request and sends reminder
     */
    private function renewViaPaychangu($user) {
        error_log("[SubscriptionRenewal] Processing Paychangu renewal for user {$user['id']}");
        
        // Set grace period for payment attempt
        $grace_period_end = date('Y-m-d H:i:s', strtotime('+' . self::GRACE_PERIOD_DAYS . ' days'));
        $next_renewal = date('Y-m-d', strtotime('+1 month'));
        
        // Generate payment reference
        $payment_reference = "SUB-{$user['id']}-" . date('YmdHis');
        
        // Get subscription amount
        $amount = $this->getSubscriptionAmount($user['subscription_tier']);
        
        // Update subscription with grace period
        $query = "
            UPDATE " . $this->table . " 
            SET subscription_grace_period_end = '$grace_period_end',
                subscription_renewal_date = '$next_renewal',
                subscription_updated_at = NOW()
            WHERE id = {$user['id']}
        ";
        
        if (mysqli_query($this->conn, $query)) {
            // Generate payment request
            $paymentRequest = [
                'reference' => $payment_reference,
                'amount' => $amount,
                'currency' => 'MWK',
                'description' => "Subscription Renewal - {$user['subscription_tier']} Plan",
                'customer_email' => $user['email'],
                'redirect_url' => 'https://yourdomain.com/subscription/payment-success',
                'failure_url' => 'https://yourdomain.com/subscription/payment-failed'
            ];
            
            // Log the renewal initiation
            $this->logSubscriptionEvent($user['id'], 'renewal_initiated', [
                'gateway' => 'paychangu',
                'payment_reference' => $payment_reference,
                'amount' => $amount,
                'currency' => 'MWK',
                'grace_period_end' => $grace_period_end,
                'tier' => $user['subscription_tier']
            ]);
            
            // Send payment request email
            $this->sendRenewalEmail($user, 'renewal_invoice', [
                'amount' => $amount,
                'currency' => 'MWK',
                'reference' => $payment_reference,
                'grace_period_days' => self::GRACE_PERIOD_DAYS,
                'grace_period_end' => $grace_period_end,
                'next_due_date' => $next_renewal,
                'gateway' => 'Paychangu'
            ]);
        } else {
            error_log("[SubscriptionRenewal] Failed to set grace period for user {$user['id']}: " . mysqli_error($this->conn));
        }
    }
    
    /**
     * Send reminder notifications for upcoming renewals
     */
    private function sendReminderNotifications() {
        foreach (self::REMINDER_DAYS_BEFORE as $days) {
            $target_date = date('Y-m-d', strtotime("+$days days"));
            
            $query = "
                SELECT u.id, u.email, u.subscription_tier, u.subscription_payment_gateway,
                       COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) as renewal_date
                FROM " . $this->table . " u
                WHERE u.subscription_active = 1 
                AND u.subscription_status = 'ACTIVE'
                AND DATE(COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH))) = '$target_date'
                AND u.last_renewal_reminder_sent IS NULL 
                   OR DATE(u.last_renewal_reminder_sent) < '$target_date'
            ";
            
            $result = mysqli_query($this->conn, $query);
            
            if ($result) {
                $sent = 0;
                while ($row = mysqli_fetch_assoc($result)) {
                    $this->sendRenewalEmail($row, 'renewal_reminder', [
                        'days_until_renewal' => $days,
                        'renewal_date' => $row['renewal_date'],
                        'tier' => $row['subscription_tier'],
                        'gateway' => $row['subscription_payment_gateway'] === 'square' ? 'Square' : 'Paychangu'
                    ]);
                    
                    // Update last reminder sent date
                    $update_query = "
                        UPDATE " . $this->table . "
                        SET last_renewal_reminder_sent = NOW()
                        WHERE id = {$row['id']}
                    ";
                    mysqli_query($this->conn, $update_query);
                    
                    $sent++;
                }
                error_log("[SubscriptionRenewal] Sent $sent reminder emails for renewals in $days days");
            }
        }
    }
    
    /**
     * Handle grace periods that have expired - suspend accounts
     */
    private function handleExpiredGracePeriods() {
        // Get all users in grace period whose grace period has expired
        $query = "
            SELECT u.id, u.email, u.subscription_tier
            FROM " . $this->table . " u
            WHERE u.subscription_active = 1
            AND u.subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
            AND u.subscription_grace_period_end IS NOT NULL
            AND u.subscription_grace_period_end <= NOW()
        ";
        
        $result = mysqli_query($this->conn, $query);
        
        if ($result) {
            $suspended = 0;
            while ($row = mysqli_fetch_assoc($result)) {
                // Suspend the subscription
                $update_query = "
                    UPDATE " . $this->table . "
                    SET subscription_status = 'SUSPENDED',
                        subscription_active = 0,
                        subscription_updated_at = NOW(),
                        subscription_grace_period_end = NULL
                    WHERE id = {$row['id']}
                ";
                
                if (mysqli_query($this->conn, $update_query)) {
                    // Log the suspension
                    $this->logSubscriptionEvent($row['id'], 'subscription_suspended', [
                        'reason' => 'grace_period_expired',
                        'tier' => $row['subscription_tier']
                    ]);
                    
                    // Send suspension notification
                    $this->sendRenewalEmail($row, 'subscription_suspended', [
                        'tier' => $row['subscription_tier'],
                        'reactivation_url' => 'https://yourdomain.com/dashboard/subscription/reactivate'
                    ]);
                    
                    $suspended++;
                }
            }
            error_log("[SubscriptionRenewal] Suspended $suspended subscriptions after grace period expiration");
        }
    }
    
    /**
     * Send renewal-related emails
     */
    private function sendRenewalEmail($user, $type, $data = []) {
        $email = $user['email'];
        $subject = '';
        $body = '';
        
        switch ($type) {
            case 'renewal_reminder':
                $subject = "Your subscription renews in {$data['days_until_renewal']} days";
                $body = "
                    <h2>Subscription Renewal Reminder</h2>
                    <p>Hi,</p>
                    <p>Your {$data['tier']} subscription will renew on {$data['renewal_date']}.</p>
                    <p>Your payment will be processed automatically via {$data['gateway']}.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    <a href='https://yourdomain.com/dashboard/subscription'>View Subscription</a>
                ";
                break;
                
            case 'renewal_success':
                $subject = "Your subscription has been renewed";
                $body = "
                    <h2>Subscription Renewed Successfully</h2>
                    <p>Hi,</p>
                    <p>Your subscription has been successfully renewed and is active through {$data['next_due_date']}.</p>
                    <p>Payment was processed via {$data['gateway']}.</p>
                    <a href='https://yourdomain.com/dashboard'>Back to Dashboard</a>
                ";
                break;
                
            case 'renewal_invoice':
                $subject = "Action Required: Subscription Renewal Payment";
                $body = "
                    <h2>Subscription Renewal - Payment Required</h2>
                    <p>Hi,</p>
                    <p>Your {$data['tier']} subscription is due for renewal.</p>
                    <p><strong>Amount Due:</strong> {$data['amount']} {$data['currency']}</p>
                    <p><strong>Reference:</strong> {$data['reference']}</p>
                    <p><strong>Grace Period:</strong> {$data['grace_period_days']} days (until {$data['grace_period_end']})</p>
                    <p><a href='https://yourdomain.com/subscription/pay-invoice/{$data['reference']}'>Pay Now</a></p>
                    <p>If payment is not received within the grace period, your subscription will be suspended.</p>
                ";
                break;
                
            case 'subscription_suspended':
                $subject = "Your subscription has been suspended";
                $body = "
                    <h2>Subscription Suspended</h2>
                    <p>Hi,</p>
                    <p>Your {$data['tier']} subscription has been suspended due to non-payment.</p>
                    <p>To reactivate your subscription and enjoy all benefits, please <a href='{$data['reactivation_url']}'>reactivate here</a>.</p>
                    <p>If you have questions, contact our support team.</p>
                ";
                break;
        }
        
        // Send email (integrate with your email service)
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: noreply@yourdomain.com\r\n";
        
        @mail($email, $subject, $body, $headers);
        
        error_log("[SubscriptionRenewal] Sent '$type' email to $email");
    }
    
    /**
     * Log subscription events to subscription_history
     */
    private function logSubscriptionEvent($user_id, $event_type, $details = []) {
        $details_json = json_encode($details);
        $query = "
            INSERT INTO " . $this->history_table . " 
            (user_id, event_type, details, created_at)
            VALUES 
            ({$user_id}, '$event_type', '$details_json', NOW())
        ";
        
        if (!mysqli_query($this->conn, $query)) {
            error_log("[SubscriptionRenewal] Failed to log event: " . mysqli_error($this->conn));
        }
    }
    
    /**
     * Log cron execution status
     */
    private function logCronExecution($status, $message) {
        $log_table = 'subscription_cron_logs';
        
        // Check if table exists, create if not
        $table_check = "SHOW TABLES LIKE '$log_table'";
        $table_exists = mysqli_query($this->conn, $table_check);
        
        if ($table_exists->num_rows === 0) {
            $create_query = "
                CREATE TABLE IF NOT EXISTS $log_table (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    status VARCHAR(50),
                    message TEXT,
                    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ";
            mysqli_query($this->conn, $create_query);
        }
        
        $query = "
            INSERT INTO $log_table (status, message)
            VALUES ('$status', '$message')
        ";
        
        mysqli_query($this->conn, $query);
    }
    
    /**
     * Get subscription amount based on tier
     * Returns amounts in cents/smallest currency unit
     */
    private function getSubscriptionAmount($tier) {
        // For PayChangu (MWK) - amounts in Malawi Kwacha
        $amounts = [
            'plus' => 6000,      // MWK 6,000 (£6.00 equivalent)
            'premium' => 10000   // MWK 10,000 (£9.99 equivalent)
        ];
        
        return $amounts[$tier] ?? 6000;
    }
    
    // ========================================================================
    // ANALYTICS PROCESSING (Hourly Aggregation)
    // ========================================================================
    
    /**
     * Process analytics data - calculates metrics with historical comparisons
     * Should be called hourly to keep dashboard data fresh
     */
    public function processAnalytics() {
        try {
            error_log("📊 [Analytics] Starting analytics processing at " . date('Y-m-d H:i:s'));
            
            // Ensure analytics_cache table exists
            $this->ensureAnalyticsCacheTable();
            
            // Calculate all metrics
            $visitorStats = $this->calculateVisitorStats();
            $orderStats = $this->calculateOrderStats();
            $revenueStats = $this->calculateRevenueStats();
            $gadgetStats = $this->calculateGadgetStats();
            $userStats = $this->calculateUserStats();
            $subscriptionStats = $this->calculateSubscriptionStats();
            $conversionStats = $this->calculateConversionStats();
            $popularProducts = $this->calculatePopularProducts();
            
            // Update cache
            $this->updateAnalyticsCache([
                'visitor_stats' => $visitorStats,
                'order_stats' => $orderStats,
                'revenue_stats' => $revenueStats,
                'gadget_stats' => $gadgetStats,
                'user_stats' => $userStats,
                'subscription_stats' => $subscriptionStats,
                'conversion_stats' => $conversionStats,
                'popular_products' => $popularProducts
            ]);
            
            error_log("✅ [Analytics] Processing completed successfully");
            return ['status' => 'success', 'message' => 'Analytics processed successfully'];
            
        } catch (Exception $e) {
            error_log("❌ [Analytics] Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Ensure analytics_cache table exists
     */
    private function ensureAnalyticsCacheTable() {
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
        
        if (!mysqli_query($this->conn, $query)) {
            throw new Exception("Failed to create analytics_cache table: " . mysqli_error($this->conn));
        }
    }
    
    /**
     * Calculate visitor statistics with historical comparison
     */
    private function calculateVisitorStats() {
        $query = "
            SELECT 
                COUNT(DISTINCT session_id) as total_unique_visitors,
                COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                      THEN session_id END) as visitors_this_month,
                COUNT(DISTINCT CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                      AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                      THEN session_id END) as visitors_previous_month,
                COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                      THEN session_id END) as visitors_this_week,
                COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE() 
                      THEN session_id END) as visitors_today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as page_views_month,
                SUM(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as page_views_previous_month
            FROM analytics_page_views
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ";
        
        $result = mysqli_query($this->conn, $query);
        if (!$result) {
            error_log("⚠️  [Analytics] Visitor stats query failed: " . mysqli_error($this->conn));
            return $this->getEmptyVisitorStats();
        }
        
        $stats = mysqli_fetch_assoc($result);
        
        // Calculate product views from analytics_events
        $productViewsQuery = "
            SELECT 
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as product_views_month,
                SUM(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as product_views_previous_month
            FROM analytics_events
            WHERE event_type = 'product_view'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        ";
        
        $productResult = mysqli_query($this->conn, $productViewsQuery);
        if ($productResult) {
            $productStats = mysqli_fetch_assoc($productResult);
            $stats['product_views_month'] = $productStats['product_views_month'] ?? 0;
            $stats['product_views_previous_month'] = $productStats['product_views_previous_month'] ?? 0;
        } else {
            $stats['product_views_month'] = 0;
            $stats['product_views_previous_month'] = 0;
        }
        
        error_log("✅ [Analytics] Visitor stats calculated");
        return $stats;
    }
    
    private function getEmptyVisitorStats() {
        return [
            'total_unique_visitors' => 0,
            'visitors_this_month' => 0,
            'visitors_previous_month' => 0,
            'visitors_this_week' => 0,
            'visitors_today' => 0,
            'page_views_month' => 0,
            'page_views_previous_month' => 0,
            'product_views_month' => 0,
            'product_views_previous_month' => 0
        ];
    }
    
    /**
     * Calculate order statistics with historical comparison
     */
    private function calculateOrderStats() {
        $query = "
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as orders_this_month,
                SUM(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as orders_previous_month,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders,
                -- Dispatched orders this month vs previous month
                SUM(CASE WHEN status = 'dispatched' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as dispatched_this_month,
                SUM(CASE WHEN status = 'dispatched' AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN 1 ELSE 0 END) as dispatched_previous_month
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ";
        
        $result = mysqli_query($this->conn, $query);
        if (!$result) {
            error_log("⚠️  [Analytics] Order stats query failed: " . mysqli_error($this->conn));
            return [
                'total_orders' => 0,
                'orders_this_month' => 0,
                'orders_previous_month' => 0,
                'completed_orders' => 0,
                'pending_orders' => 0,
                'cancelled_orders' => 0,
                'dispatched_orders' => 0,
                'dispatched_this_month' => 0,
                'dispatched_previous_month' => 0
            ];
        }
        
        $stats = mysqli_fetch_assoc($result);
        error_log("✅ [Analytics] Order stats calculated");
        return $stats;
    }
    
    /**
     * Calculate revenue statistics with dual currency
     */
    private function calculateRevenueStats() {
        $query = "
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue_mwk,
                COALESCE(SUM(total_amount_gbp), 0) as total_revenue_gbp,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN total_amount ELSE 0 END), 0) as revenue_this_month_mwk,
                COALESCE(SUM(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN total_amount ELSE 0 END), 0) as revenue_previous_month_mwk,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN total_amount_gbp ELSE 0 END), 0) as revenue_this_month_gbp,
                COALESCE(SUM(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                    AND DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN total_amount_gbp ELSE 0 END), 0) as revenue_previous_month_gbp,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                    THEN total_amount ELSE 0 END), 0) as revenue_this_week_mwk,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                    THEN total_amount_gbp ELSE 0 END), 0) as revenue_this_week_gbp,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() 
                    THEN total_amount ELSE 0 END), 0) as revenue_today_mwk,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() 
                    THEN total_amount_gbp ELSE 0 END), 0) as revenue_today_gbp
            FROM orders
            WHERE payment_status = 'paid'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ";
        
        $result = mysqli_query($this->conn, $query);
        if (!$result) {
            error_log("⚠️  [Analytics] Revenue stats query failed: " . mysqli_error($this->conn));
            return [
                'mwk' => ['total' => 0, 'this_month' => 0, 'previous_month' => 0, 'this_week' => 0, 'today' => 0],
                'gbp' => ['total' => 0, 'this_month' => 0, 'previous_month' => 0, 'this_week' => 0, 'today' => 0]
            ];
        }
        
        $raw = mysqli_fetch_assoc($result);
        $stats = [
            'mwk' => [
                'total' => floatval($raw['total_revenue_mwk']),
                'this_month' => floatval($raw['revenue_this_month_mwk']),
                'previous_month' => floatval($raw['revenue_previous_month_mwk']),
                'this_week' => floatval($raw['revenue_this_week_mwk']),
                'today' => floatval($raw['revenue_today_mwk'])
            ],
            'gbp' => [
                'total' => floatval($raw['total_revenue_gbp']),
                'this_month' => floatval($raw['revenue_this_month_gbp']),
                'previous_month' => floatval($raw['revenue_previous_month_gbp']),
                'this_week' => floatval($raw['revenue_this_week_gbp']),
                'today' => floatval($raw['revenue_today_gbp'])
            ]
        ];
        
        error_log("✅ [Analytics] Revenue stats calculated");
        return $stats;
    }
    
    private function calculateGadgetStats() {
        $query = "
            SELECT 
                COUNT(*) as total_gadgets,
                SUM(CASE WHEN category = 'smartphone' THEN 1 ELSE 0 END) as smartphones_count,
                SUM(CASE WHEN category = 'laptop' THEN 1 ELSE 0 END) as laptops_count,
                SUM(CASE WHEN category = 'tablet' THEN 1 ELSE 0 END) as tablets_count,
                SUM(CASE WHEN category = 'accessory' THEN 1 ELSE 0 END) as accessories_count,
                SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as in_stock_count,
                SUM(CASE WHEN in_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                -- Total stock units (sum of all stock_quantity)
                COALESCE(SUM(stock_quantity), 0) as total_stock_units
            FROM gadgets
        ";
        
        $result = mysqli_query($this->conn, $query);
        if (!$result) {
            return [
                'total_gadgets' => 0,
                'smartphones_count' => 0,
                'laptops_count' => 0,
                'tablets_count' => 0,
                'accessories_count' => 0,
                'in_stock_count' => 0,
                'out_of_stock_count' => 0,
                'total_stock_units' => 0,
                'total_stock_units_previous' => 0
            ];
        }
        
        $stats = mysqli_fetch_assoc($result);
        
        // Get historical stock data (we need to track this in a separate table for real comparison)
        // For now, we'll check if there's a stock_history table
        $historyQuery = "SHOW TABLES LIKE 'stock_history'";
        $historyCheck = mysqli_query($this->conn, $historyQuery);
        
        if ($historyCheck && mysqli_num_rows($historyCheck) > 0) {
            // If stock_history exists, get previous month's total
            $previousQuery = "
                SELECT COALESCE(SUM(stock_quantity), 0) as total_stock_units_previous
                FROM stock_history
                WHERE recorded_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
                AND DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY recorded_at DESC
                LIMIT 1
            ";
            $previousResult = mysqli_query($this->conn, $previousQuery);
            if ($previousResult) {
                $previousData = mysqli_fetch_assoc($previousResult);
                $stats['total_stock_units_previous'] = $previousData['total_stock_units_previous'] ?? 0;
            } else {
                $stats['total_stock_units_previous'] = 0;
            }
        } else {
            // No stock history table, can't calculate change
            $stats['total_stock_units_previous'] = 0;
        }
        
        return $stats;
    }
    
    private function calculateUserStats() {
        $query = "
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN user_role = 'admin' THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN user_role = 'seller' THEN 1 ELSE 0 END) as seller_count,
                SUM(CASE WHEN user_role = 'buyer' THEN 1 ELSE 0 END) as buyer_count,
                SUM(CASE WHEN subscription_active = 1 THEN 1 ELSE 0 END) as active_subscribers
            FROM users
        ";
        
        $result = mysqli_query($this->conn, $query);
        return $result ? mysqli_fetch_assoc($result) : [];
    }
    
    private function calculateSubscriptionStats() {
        $query = "
            SELECT 
                COUNT(*) as total_subscriptions,
                SUM(CASE WHEN subscription_tier = 'XtraPush Plus' THEN 1 ELSE 0 END) as plus_count,
                SUM(CASE WHEN subscription_tier = 'XtraPush Premium' THEN 1 ELSE 0 END) as premium_count,
                SUM(CASE WHEN subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN subscription_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count,
                SUM(CASE WHEN subscription_payment_gateway = 'square' THEN 1 ELSE 0 END) as square_count,
                SUM(CASE WHEN subscription_payment_gateway = 'paychangu' THEN 1 ELSE 0 END) as paychangu_count
            FROM users
            WHERE subscription_active = 1
        ";
        
        $result = mysqli_query($this->conn, $query);
        return $result ? mysqli_fetch_assoc($result) : [];
    }
    
    private function calculateConversionStats() {
        $query = "
            SELECT 
                SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
                SUM(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) as product_views,
                SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as add_to_cart,
                SUM(CASE WHEN event_type = 'checkout_start' THEN 1 ELSE 0 END) as checkout_starts,
                SUM(CASE WHEN event_type = 'checkout_complete' THEN 1 ELSE 0 END) as checkout_completes
            FROM analytics_events
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ";
        
        $result = mysqli_query($this->conn, $query);
        $stats = $result ? mysqli_fetch_assoc($result) : [];
        
        $pageViews = intval($stats['page_views'] ?? 0);
        $checkoutCompletes = intval($stats['checkout_completes'] ?? 0);
        $stats['conversion_rate'] = $pageViews > 0 ? round(($checkoutCompletes / $pageViews) * 100, 2) : 0;
        
        return $stats;
    }
    
    private function calculatePopularProducts() {
        $query = "
            SELECT 
                oi.gadget_id,
                g.name as product_name,
                SUM(oi.quantity) as total_quantity,
                COUNT(DISTINCT oi.order_id) as order_count,
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
        
        $result = mysqli_query($this->conn, $query);
        $products = [];
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $products[] = $row;
            }
        }
        return $products;
    }
    
    /**
     * Update analytics cache with calculated data
     */
    private function updateAnalyticsCache($data) {
        error_log("💾 [Analytics] Updating analytics cache");
        
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
        
        $stmt = mysqli_prepare($this->conn, $query);
        if (!$stmt) {
            throw new Exception("Failed to prepare update query: " . mysqli_error($this->conn));
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
        error_log("✅ [Analytics] Cache updated successfully");
    }
}

// Handle both CLI and HTTP requests
$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Ensure charset is consistent
if (!$db->connect_errno) {
    $db->set_charset('utf8mb4');
}

if ($db->connect_error) {
    die("Connection failed: " . $db->connect_error);
}

$manager = new SubscriptionRenewalManager($db);

// Determine if running from CLI or HTTP
if (php_sapi_name() === 'cli') {
    // CLI execution - Run both subscription renewals AND analytics
    echo "\n========================================\n";
    echo "XtraPush Hourly Cron Job\n";
    echo "========================================\n\n";
    
    // 1. Process subscription renewals
    echo "[1/2] Processing subscription renewals...\n";
    $renewalResult = $manager->processRenewals();
    echo "Status: " . $renewalResult['status'] . "\n";
    echo "Message: " . $renewalResult['message'] . "\n\n";
    
    // 2. Process analytics
    echo "[2/2] Processing analytics data...\n";
    $analyticsResult = $manager->processAnalytics();
    echo "Status: " . $analyticsResult['status'] . "\n";
    echo "Message: " . $analyticsResult['message'] . "\n\n";
    
    echo "========================================\n";
    echo "Cron job completed at " . date('Y-m-d H:i:s') . "\n";
    echo "========================================\n";
    
    // Exit with error code if either failed
    $exitCode = ($renewalResult['status'] === 'success' && $analyticsResult['status'] === 'success') ? 0 : 1;
    exit($exitCode);
    
} else {
    // HTTP endpoint execution
    header('Content-Type: application/json');
    
    // Verify authorization token (optional)
    $token = $_GET['token'] ?? $_POST['token'] ?? null;
    $valid_token = getenv('CRON_SECRET_TOKEN') ?: 'your-secret-token';
    
    if ($token !== $valid_token) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    
    // Process both renewals and analytics
    $renewalResult = $manager->processRenewals();
    $analyticsResult = $manager->processAnalytics();
    
    echo json_encode([
        'renewals' => $renewalResult,
        'analytics' => $analyticsResult,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

$db->close();

// Logging function
function log_cron($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/cron-subscriptions.log';
    $logDir = dirname($logFile);
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    file_put_contents($logFile, "[{$timestamp}] {$message}\n", FILE_APPEND);
    echo "[{$timestamp}] {$message}\n";
}

// Send email function
function send_renewal_email($to, $subject, $message, $isHTML = true) {
    $headers = [
        'From: Xtrapush Subscriptions <subscriptions@itsxtrapush.com>',
        'Reply-To: conrad@itsxtrapush.com',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    if ($isHTML) {
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=UTF-8';
    }
    
    return mail($to, $subject, $message, implode("\r\n", $headers));
}

// Generate invoice HTML
function generate_invoice_html($subscription) {
    $tierNames = [
        'plus' => 'Xtrapush Plus',
        'premium' => 'Xtrapush Premium'
    ];
    
    $tierPrices = [
        'plus' => 'MWK 6,000',
        'premium' => 'MWK 10,000'
    ];
    
    $tierName = $tierNames[$subscription['tier']] ?? 'Subscription';
    $amount = $tierPrices[$subscription['tier']] ?? 'N/A';
    $invoiceDate = date('F j, Y');
    $dueDate = date('F j, Y', strtotime('+7 days'));
    
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #48cedb 0%, #3aa6b8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #48cedb; }
        .amount { font-size: 32px; color: #48cedb; font-weight: bold; margin: 10px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #48cedb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Subscription Renewal</h1>
            <p>Your monthly subscription is up for renewal</p>
        </div>
        <div class="content">
            <h2>Hello {$subscription['full_name']},</h2>
            <p>Your <strong>{$tierName}</strong> subscription is due for renewal.</p>
            
            <div class="invoice-details">
                <h3>Invoice Details</h3>
                <table width="100%">
                    <tr>
                        <td><strong>Plan:</strong></td>
                        <td>{$tierName}</td>
                    </tr>
                    <tr>
                        <td><strong>Invoice Date:</strong></td>
                        <td>{$invoiceDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Due Date:</strong></td>
                        <td>{$dueDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Amount Due:</strong></td>
                        <td><div class="amount">{$amount}</div></td>
                    </tr>
                </table>
            </div>
            
            <p><strong>Benefits you'll keep:</strong></p>
            <ul>
                <li>✅ Free unlimited delivery on all orders</li>
HTML;
    
    $insuranceType = $subscription['tier'] === 'premium' ? 'Multiple' : 'Single';
    $html .= <<<HTML
                <li>✅ {$insuranceType} gadget insurance (1 year)</li>
                <li>✅ Member discounts</li>
HTML;
    
    if ($subscription['tier'] === 'premium') {
        $html .= <<<HTML
                <li>✅ Priority support</li>
                <li>✅ Early access to new gadgets</li>
HTML;
    }
    
    $html .= <<<HTML
            </ul>
            
            <p style="text-align: center;">
                <a href="{$subscription['checkout_url']}" class="button">Pay Now - {$amount}</a>
            </p>
            
            <p style="font-size: 12px; color: #666;">
                <strong>Note:</strong> If payment is not received by {$dueDate}, your subscription will be suspended and benefits will be temporarily unavailable.
            </p>
        </div>
        <div class="footer">
            <p>Xtrapush Gadgets - Quality Tech, Flexible Payments</p>
            <p>Questions? Contact us at conrad@itsxtrapush.com</p>
        </div>
    </div>
</body>
</html>
HTML;
    
    return $html;
}

// Main execution
log_cron("=== Starting Subscription Renewal Cron Job ===");

try {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    
    if (!$conn || $conn->connect_errno) {
        throw new Exception("Database connection failed");
    }
    
    // Find PayChangu subscriptions that need renewal
    // Criteria: Active subscriptions where renewal_date is within next 7 days
    $today = date('Y-m-d');
    $sevenDaysFromNow = date('Y-m-d', strtotime('+7 days'));
    
    $sql = "
        SELECT 
            u.uid, 
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
          AND u.subscription_renewal_date BETWEEN ? AND ?
          AND (u.subscription_last_reminder_sent IS NULL OR u.subscription_last_reminder_sent < DATE_SUB(NOW(), INTERVAL 2 DAY))
        ORDER BY u.subscription_renewal_date ASC
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $today, $sevenDaysFromNow);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $processedCount = 0;
    $errorCount = 0;
    
    while ($subscription = $result->fetch_assoc()) {
        try {
            log_cron("Processing renewal for user: {$subscription['email']} (UID: {$subscription['uid']})");
            
            // Create PayChangu checkout for renewal
            $tierPrices = [
                'plus' => 6000,      // MWK 6,000
                'premium' => 10000   // MWK 10,000
            ];
            
            $tierNames = [
                'plus' => 'Xtrapush Plus',
                'premium' => 'Xtrapush Premium'
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
            $ch = curl_init(PAYCHANGU_BASE_URL . '/payment');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                    'Authorization: Bearer ' . PAYCHANGU_SECRET_KEY
                ]
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200 || $httpCode === 201) {
                $data = json_decode($response, true);
                
                // PayChangu returns checkout_url in data.checkout_url or data.authorization_url
                if (isset($data['data']['checkout_url'])) {
                    $checkoutUrl = $data['data']['checkout_url'];
                } elseif (isset($data['data']['authorization_url'])) {
                    $checkoutUrl = $data['data']['authorization_url'];
                } else {
                    log_cron("⚠️ No checkout URL in PayChangu response: " . json_encode($data));
                    $errorCount++;
                    continue;
                }
                
                // Add checkout URL to subscription array for email
                $subscription['checkout_url'] = $checkoutUrl;
                
                // Generate invoice email
                $invoiceHTML = generate_invoice_html($subscription);
                $subject = "🔔 {$tierName} Renewal - Payment Due";
                
                // Send email
                if (send_renewal_email($subscription['email'], $subject, $invoiceHTML, true)) {
                    log_cron("✅ Renewal email sent successfully to {$subscription['email']}");
                    
                    // Update last reminder sent timestamp
                    $updateStmt = $conn->prepare("
                        UPDATE users 
                        SET subscription_last_reminder_sent = NOW()
                        WHERE uid = ?
                    ");
                    $updateStmt->bind_param('s', $subscription['uid']);
                    $updateStmt->execute();
                    $updateStmt->close();
                    
                    $processedCount++;
                } else {
                    log_cron("⚠️ Failed to send email to {$subscription['email']}");
                    $errorCount++;
                }
            } else {
                log_cron("⚠️ PayChangu API error (HTTP {$httpCode}): {$response}");
                $errorCount++;
            }
            
        } catch (Exception $e) {
            log_cron("❌ Error processing user {$subscription['uid']}: " . $e->getMessage());
            $errorCount++;
        }
        
        // Small delay to avoid rate limiting
        usleep(500000); // 0.5 seconds
    }
    
    $stmt->close();
    
    log_cron("=== Cron Job Complete ===");
    log_cron("✅ Successfully processed: {$processedCount}");
    log_cron("❌ Errors encountered: {$errorCount}");
    
    // Check for overdue subscriptions (past renewal date and not paid)
    $overdueSQL = "
        SELECT uid, email, full_name, subscription_tier, subscription_renewal_date
        FROM users
        WHERE subscription_payment_gateway = 'paychangu'
          AND subscription_active = 1
          AND subscription_renewal_date < CURDATE()
    ";
    
    $overdueResult = $conn->query($overdueSQL);
    
    if ($overdueResult && $overdueResult->num_rows > 0) {
        log_cron("⚠️ Found {$overdueResult->num_rows} overdue subscriptions");
        
        while ($overdue = $overdueResult->fetch_assoc()) {
            // Suspend subscription
            $suspendStmt = $conn->prepare("
                UPDATE users 
                SET subscription_active = 0, 
                    subscription_status = 'SUSPENDED'
                WHERE uid = ?
            ");
            $suspendStmt->bind_param('s', $overdue['uid']);
            $suspendStmt->execute();
            $suspendStmt->close();
            
            // Send suspension email
            $suspensionMessage = "
                <h2>Subscription Suspended</h2>
                <p>Your {$overdue['subscription_tier']} subscription has been suspended due to non-payment.</p>
                <p>To reactivate, please contact conrad@itsxtrapush.com or renew your subscription.</p>
            ";
            
            send_renewal_email($overdue['email'], '⚠️ Subscription Suspended', $suspensionMessage, true);
            log_cron("⚠️ Suspended subscription for {$overdue['email']}");
        }
    }
    
} catch (Exception $e) {
    log_cron("❌ Fatal error: " . $e->getMessage());
    exit(1);
}

log_cron("Cron job finished successfully");
exit(0);
