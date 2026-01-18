<?php
// XtraPush Analytics Processor - Standalone
// Extracted from oldsub.php analytics functionality

echo "========================================\n";
echo "XtraPush Analytics Processing\n";
echo "========================================\n\n";
echo "Starting analytics processing at " . date('Y-m-d H:i:s') . "\n\n";

// Database connection
$db = new mysqli('localhost', 'xuser', 'Xpush2025?', 'itsxtrapush_db');

if ($db->connect_error) {
    echo "❌ Database connection failed: " . $db->connect_error . "\n";
    exit(1);
}

$db->set_charset('utf8mb4');

try {
    // Ensure analytics_cache table exists
    ensureAnalyticsCacheTable($db);
    
    // Calculate all metrics
    echo "📊 Calculating visitor statistics...\n";
    $visitorStats = calculateVisitorStats($db);
    
    echo "📦 Calculating order statistics...\n";
    $orderStats = calculateOrderStats($db);
    
    echo "💰 Calculating revenue statistics...\n";
    $revenueStats = calculateRevenueStats($db);
    
    echo "📱 Calculating gadget statistics...\n";
    $gadgetStats = calculateGadgetStats($db);
    
    echo "👥 Calculating user statistics...\n";
    $userStats = calculateUserStats($db);
    
    echo "🔄 Calculating subscription statistics...\n";
    $subscriptionStats = calculateSubscriptionStats($db);
    
    echo "📈 Calculating conversion statistics...\n";
    $conversionStats = calculateConversionStats($db);
    
    echo "⭐ Calculating popular products...\n";
    $popularProducts = calculatePopularProducts($db);
    
    // Update cache
    echo "💾 Updating analytics cache...\n";
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
    
    echo "\n✅ Analytics processing completed successfully!\n";
    echo "📊 Summary:\n";
    echo "  - Visitors this month: " . ($visitorStats['visitors_this_month'] ?? 0) . "\n";
    echo "  - Orders this month: " . ($orderStats['orders_this_month'] ?? 0) . "\n";
    echo "  - Revenue (MWK): " . number_format($revenueStats['mwk']['this_month'] ?? 0) . "\n";
    echo "  - Popular products: " . count($popularProducts) . " items\n";
    
} catch (Exception $e) {
    echo "❌ Error processing analytics: " . $e->getMessage() . "\n";
    exit(1);
}

$db->close();

echo "\n========================================\n";
echo "✓ Analytics processing completed at " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n";
exit(0);

// ========================================================================
// ANALYTICS FUNCTIONS
// ========================================================================

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
    
    $result = mysqli_query($db, $query);
    if (!$result) {
        return getEmptyVisitorStats();
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
        WHERE event_type IN ('view_product', 'product_view')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    ";
    
    $productResult = mysqli_query($db, $productViewsQuery);
    if ($productResult) {
        $productStats = mysqli_fetch_assoc($productResult);
        $stats['product_views_month'] = $productStats['product_views_month'] ?? 0;
        $stats['product_views_previous_month'] = $productStats['product_views_previous_month'] ?? 0;
    } else {
        $stats['product_views_month'] = 0;
        $stats['product_views_previous_month'] = 0;
    }
    
    return $stats;
}

function getEmptyVisitorStats() {
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

function calculateOrderStats($db) {
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