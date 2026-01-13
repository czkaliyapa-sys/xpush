# Admin Dashboard Accuracy & Analytics Fix

## Issues Fixed ✅

### 1. **Sidebar Menu Cleanup**
- ❌ Removed: "Trade In" menu item (was redundant)
- ✅ Kept: "Trade-Ins Admin" only
- Location: `/src/external_components/listItems.jsx`

### 2. **Removed Admin Controls Card**
- ❌ Removed: "Admin Controls" section that redirected to empty pages
- The card had buttons for /admin/gadgets, /admin/variants, /admin/orders, /admin/tradeins
- These routes don't exist, causing 404 errors
- Location: `/src/external_components/UserDashboard.jsx` lines ~1115-1140

### 3. **Hidden Recommendations for Admins**
- ❌ Removed: "Recommended For You" carousel from admin view
- ✅ Still visible for regular users
- Location: `/src/external_components/UserDashboard.jsx` line ~1301

---

## Issues Requiring Database/Backend Work 🔧

### 4. **Gadgets Data Accuracy**

**Problem:** Dashboard shows 0 gadgets even though database has gadgets

**Current Code:**
```javascript
const [gadgetsRes] = await Promise.allSettled([
  gadgetsAPI.getAll({ limit: 20 })
]);
```

**Root Cause:** Data not being properly fetched or displayed

**Solution:**
Check your gadgets API endpoint and verify:
1. API is returning data correctly
2. Database has gadgets with proper fields
3. Frontend is parsing the response correctly

**Test:**
```bash
# Test the gadgets API
curl http://localhost:3001/gadgets?limit=20
```

Expected response:
```json
{
  "gadgets": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "price": 999000,
      "price_gbp": 999,
      ...
    }
  ]
}
```

### 5. **Analytics Showing Dummy Data & Wrong Currency**

**Problem:** 
- Total Spent shows £0.00 instead of actual currency
- Order counts may be inaccurate
- Stats show dummy/zero data

**Current Analytics Calculation:**
```javascript
const stats = {
  totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
  totalOrders: orders.length,
  pendingOrders: orders.filter(o => !o.status?.includes('complete')).length,
  completedOrders: orders.filter(o => o.status?.includes('complete')).length
};
```

**Issues:**
1. **Currency Detection:** Not detecting user's actual location
2. **Order Data:** May not be fetching all orders
3. **Real-time:** Not updating automatically

---

## Cron Job Solution for 24/7 Analytics 🕐

### Backend Cron Job (PHP)

Create: `/sparkle-pro-api/cron/update_analytics.php`

```php
<?php
/**
 * Analytics Cron Job
 * Run every 15 minutes to update dashboard analytics
 * Add to crontab: */15 * * * * php /path/to/sparkle-pro-api/cron/update_analytics.php
 */

require_once __DIR__ . '/../index.php';

$db = DatabaseConnection::getInstance();
$conn = $db->getConnection();

if (!$conn || $conn->connect_errno) {
    die("Database connection failed\n");
}

// Calculate total orders
$ordersStmt = $conn->query("
    SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('PENDING', 'PROCESSING') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status IN ('COMPLETED', 'DELIVERED') THEN 1 END) as completed_orders,
        SUM(total_amount) as total_revenue_mwk,
        SUM(total_amount_gbp) as total_revenue_gbp
    FROM orders
");
$orderStats = $ordersStmt->fetch_assoc();

// Calculate gadgets stats
$gadgetsStmt = $conn->query("
    SELECT 
        COUNT(*) as total_gadgets,
        COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock_gadgets,
        COUNT(CASE WHEN stock_quantity <= 3 AND stock_quantity > 0 THEN 1 END) as low_stock_gadgets,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_gadgets
    FROM gadgets
    WHERE is_active = 1
");
$gadgetStats = $gadgetsStmt->fetch_assoc();

// Calculate variants stats
$variantsStmt = $conn->query("
    SELECT 
        COUNT(*) as total_variants,
        COUNT(CASE WHEN stock_quantity <= 3 THEN 1 END) as low_stock_variants
    FROM gadget_variants
    WHERE is_active = 1
");
$variantStats = $variantsStmt->fetch_assoc();

// Calculate subscriptions
$subsStmt = $conn->query("
    SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN subscription_status = 'ACTIVE' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN subscription_tier = 'plus' THEN 1 END) as plus_subscribers,
        COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END) as premium_subscribers
    FROM users
    WHERE subscription_id IS NOT NULL
");
$subStats = $subsStmt->fetch_assoc();

// Store in analytics cache table
$conn->query("
    CREATE TABLE IF NOT EXISTS analytics_cache (
        id INT PRIMARY KEY DEFAULT 1,
        order_stats JSON,
        gadget_stats JSON,
        variant_stats JSON,
        subscription_stats JSON,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
");

$orderStatsJson = json_encode($orderStats);
$gadgetStatsJson = json_encode($gadgetStats);
$variantStatsJson = json_encode($variantStats);
$subStatsJson = json_encode($subStats);

$conn->query("
    INSERT INTO analytics_cache (id, order_stats, gadget_stats, variant_stats, subscription_stats)
    VALUES (1, '$orderStatsJson', '$gadgetStatsJson', '$variantStatsJson', '$subStatsJson')
    ON DUPLICATE KEY UPDATE
        order_stats = '$orderStatsJson',
        gadget_stats = '$gadgetStatsJson',
        variant_stats = '$variantStatsJson',
        subscription_stats = '$subStatsJson'
");

echo "[" . date('Y-m-d H:i:s') . "] Analytics updated successfully\n";
echo "Orders: {$orderStats['total_orders']} total, {$orderStats['pending_orders']} pending\n";
echo "Gadgets: {$gadgetStats['total_gadgets']} total, {$gadgetStats['low_stock_gadgets']} low stock\n";
echo "Subscriptions: {$subStats['active_subscriptions']} active\n";
?>
```

### API Endpoint to Fetch Cached Analytics

Add to `/sparkle-pro-api/index.php`:

```php
// Get cached analytics (fast)
if ($method === 'GET' && $path === '/analytics/dashboard') {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    
    $result = $conn->query("SELECT * FROM analytics_cache WHERE id = 1 LIMIT 1");
    $cache = $result->fetch_assoc();
    
    if ($cache) {
        json_ok([
            'orders' => json_decode($cache['order_stats'], true),
            'gadgets' => json_decode($cache['gadget_stats'], true),
            'variants' => json_decode($cache['variant_stats'], true),
            'subscriptions' => json_decode($cache['subscription_stats'], true),
            'last_updated' => $cache['last_updated']
        ]);
    } else {
        json_error('Analytics data not available', 404);
    }
    exit;
}
```

### Frontend Integration

Update `src/services/api.js`:

```javascript
export const analyticsAPI = {
  getDashboardStats: async () => {
    return await apiCall('/analytics/dashboard');
  }
};
```

Update `UserDashboard.jsx` to use cached analytics:

```javascript
// In fetchUserData function
const [ordersRes, gadgetsRes, analyticsRes] = await Promise.allSettled([
  ordersAPI.getUserOrders(uid),
  gadgetsAPI.getAll({ limit: 20 }),
  analyticsAPI.getDashboardStats() // New cached analytics
]);

const cachedAnalytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;

if (cachedAnalytics && isAdmin()) {
  // Use cached analytics for admin
  const stats = {
    totalSpent: cachedAnalytics.orders.total_revenue_gbp || 0,
    totalOrders: cachedAnalytics.orders.total_orders || 0,
    pendingOrders: cachedAnalytics.orders.pending_orders || 0,
    completedOrders: cachedAnalytics.orders.completed_orders || 0,
    totalGadgets: cachedAnalytics.gadgets.total_gadgets || 0,
    lowStockGadgets: cachedAnalytics.gadgets.low_stock_gadgets || 0
  };
  
  setDashboardData(prev => ({
    ...prev,
    stats,
    analyticsLastUpdated: cachedAnalytics.last_updated
  }));
}
```

### Setup Cron Job

**On Linux/Unix Server:**
```bash
crontab -e
```

Add line:
```bash
# Update analytics every 15 minutes
*/15 * * * * /usr/bin/php /path/to/sparkle-pro-api/cron/update_analytics.php >> /var/log/analytics-cron.log 2>&1
```

**On Windows Server:**
Use Task Scheduler to run PHP script every 15 minutes

**For Development:**
Run manually:
```bash
php sparkle-pro-api/cron/update_analytics.php
```

---

## Currency Fix for Analytics 💷

The issue is that the dashboard always shows GBP (£) regardless of user location.

**Fix in UserDashboard.jsx:**

```javascript
// Get user's actual currency from location context
const { currency: userCurrency, isInMalawi } = useLocation();

// Format currency based on user location
const formatCurrency = (amount) => {
  if (!amount) return userCurrency === 'MWK' ? 'MWK 0' : '£0.00';
  
  if (userCurrency === 'MWK') {
    return `MWK ${amount.toLocaleString('en-MW')}`;
  } else {
    return `£${(amount / 100).toFixed(2)}`;
  }
};

// Use correct price field based on currency
const getPriceForLocation = (gadget) => {
  if (userCurrency === 'MWK') {
    return gadget.price || 0; // MWK price
  } else {
    return gadget.price_gbp || 0; // GBP price in pence
  }
};
```

---

## Deployment Checklist 📋

### Immediate Fixes (Done ✅)
- [x] Remove "Trade In" from sidebar
- [x] Remove "Admin Controls" card
- [x] Hide recommendations for admins

### Backend Fixes (To Do)
- [ ] Create `analytics_cache` table
- [ ] Create `cron/update_analytics.php`
- [ ] Add `/analytics/dashboard` API endpoint
- [ ] Setup cron job on server

### Frontend Fixes (To Do)
- [ ] Add `analyticsAPI` to `api.js`
- [ ] Update `UserDashboard.jsx` to use cached analytics
- [ ] Fix currency detection using `useLocation` hook
- [ ] Test with both GBP and MWK users

### Testing
- [ ] Verify gadgets show actual data
- [ ] Verify analytics show real numbers
- [ ] Verify currency displays correctly
- [ ] Verify cron job runs every 15 minutes
- [ ] Check analytics cache updates

---

## Benefits of Cron Job Approach

1. **Performance:** Dashboard loads instantly (no heavy queries)
2. **Accuracy:** Data updates every 15 minutes automatically
3. **Scalability:** Can handle millions of records without slowing down
4. **24/7 Updates:** Works even when no users are logged in
5. **Low Server Load:** Spreads database queries across time

---

## Alternative: Real-time Updates (Not Recommended)

If you need real-time updates, use WebSockets or Server-Sent Events, but this increases server load significantly.

For dashboard analytics, **15-minute cache is optimal** - balances accuracy with performance.
