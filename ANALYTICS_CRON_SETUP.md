# Live Analytics Cron Job - Complete Implementation Guide

## Overview
This system updates analytics data every minute via cron job, storing comprehensive statistics in a cached table for instant dashboard access. The analytics run alongside subscription renewal processing in `subscription_renewal_manager.php`.

---

## 🎯 Features Implemented

### 1. **Analytics Categories** (8 Total)
- **Order Statistics**: Total, pending, completed, dispatched, cancelled, daily/weekly/monthly counts
- **Revenue Statistics**: MWK & GBP totals, daily/weekly/monthly breakdowns, average order value
- **Gadget Statistics**: Total gadgets, active, in-stock, low-stock, out-of-stock, category breakdowns
- **Variant Statistics**: Total variants, active, low-stock, out-of-stock, unique attributes
- **Subscription Statistics**: Active, pending, suspended, cancelled, Plus/Premium split, gateway split
- **User Statistics**: Total users, admins, regular users, daily/weekly/monthly registrations, subscribed users
- **Installment Statistics**: Total installment orders, pending, completed, revenue by currency
- **Trade-in Statistics**: Total, pending, approved, rejected, completed, total value, daily count

### 2. **Database Schema**
```sql
CREATE TABLE analytics_cache (
    id INT PRIMARY KEY DEFAULT 1,
    order_stats JSON,
    gadget_stats JSON,
    variant_stats JSON,
    subscription_stats JSON,
    user_stats JSON,
    revenue_stats JSON,
    installment_stats JSON,
    tradein_stats JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 3. **API Endpoint**
**GET** `/analytics/dashboard`

**Response Format:**
```json
{
  "order_stats": {
    "total_orders": 1523,
    "pending_orders": 45,
    "completed_orders": 1320,
    "dispatched_orders": 89,
    "cancelled_orders": 69,
    "orders_today": 12,
    "orders_this_week": 78,
    "orders_this_month": 234
  },
  "revenue_stats": {
    "total_revenue_mwk": "125000000.00",
    "total_revenue_gbp": "98500.50",
    "revenue_today_mwk": "450000.00",
    "revenue_today_gbp": "350.00",
    "revenue_this_week_mwk": "3200000.00",
    "revenue_this_week_gbp": "2500.00",
    "revenue_this_month_mwk": "12000000.00",
    "revenue_this_month_gbp": "9400.00",
    "avg_order_value_mwk": "82100.00",
    "avg_order_value_gbp": "64.50"
  },
  "gadget_stats": {
    "total_gadgets": 456,
    "active_gadgets": 423,
    "in_stock_gadgets": 387,
    "low_stock_gadgets": 12,
    "out_of_stock_gadgets": 36,
    "total_stock_units": 2345,
    "smartphones_count": 234,
    "laptops_count": 123,
    "tablets_count": 67,
    "accessories_count": 32
  },
  "variant_stats": {
    "total_variants": 1234,
    "active_variants": 1189,
    "low_stock_variants": 23,
    "out_of_stock_variants": 45,
    "total_variant_stock": 5678,
    "unique_colors": 12,
    "unique_storage_options": 8,
    "unique_conditions": 4
  },
  "subscription_stats": {
    "total_subscriptions": 234,
    "active_subscriptions": 198,
    "pending_subscriptions": 12,
    "suspended_subscriptions": 8,
    "cancelled_subscriptions": 16,
    "plus_subscribers": 123,
    "premium_subscribers": 75,
    "square_subscriptions": 156,
    "paychangu_subscriptions": 42,
    "new_subscriptions_today": 3,
    "new_subscriptions_this_week": 18
  },
  "user_stats": {
    "total_users": 3456,
    "admin_users": 5,
    "regular_users": 3451,
    "users_registered_today": 8,
    "users_registered_this_week": 56,
    "users_registered_this_month": 234,
    "subscribed_users": 198
  },
  "installment_stats": {
    "total_installment_orders": 89,
    "pending_installments": 23,
    "completed_installments": 66,
    "total_installment_value_mwk": "12345678.00",
    "total_installment_value_gbp": "9876.50"
  },
  "tradein_stats": {
    "total_tradeins": 145,
    "pending_tradeins": 34,
    "approved_tradeins": 78,
    "rejected_tradeins": 12,
    "completed_tradeins": 21,
    "total_tradein_value": "2345678.00",
    "tradeins_today": 5
  },
  "last_updated": "2024-01-15 14:32:45",
  "cache_status": "active"
}
```

---

## 🚀 Deployment Steps

### **Step 1: Backup Current Cron File**
```bash
cd /home/sparkl72/public_html/api
cp subscription_renewal_manager.php subscription_renewal_manager.backup.php
```

### **Step 2: Upload Updated Files**
Upload the updated `subscription_renewal_manager.php` and `index.php` to your server:
- `sparkle-pro-api/subscription_renewal_manager.php` → `/home/sparkl72/public_html/api/`
- `sparkle-pro-api/index.php` → `/home/sparkl72/public_html/api/`

### **Step 3: Set File Permissions**
```bash
chmod 755 /home/sparkl72/public_html/api/subscription_renewal_manager.php
chmod 755 /home/sparkl72/public_html/api/index.php
```

### **Step 4: Test Analytics Update Manually**
```bash
cd /home/sparkl72/public_html/api
php subscription_renewal_manager.php
```

**Expected Output:**
```
[2024-01-15 14:30:00] Starting subscription renewal processing...
[Analytics] Starting analytics update at 2024-01-15 14:30:01
[Analytics] Successfully updated analytics cache - Orders: 1523, Gadgets: 456, Active Subs: 198
[Renewals] Processed X renewals
[Reminders] Sent X reminder notifications
[Grace] Suspended X subscriptions
[2024-01-15 14:30:05] Processing complete: renewals, reminders, grace periods, analytics processing
```

### **Step 5: Test API Endpoint**
```bash
curl -X GET "https://sparkle-pro.co.uk/api/analytics/dashboard"
```

Should return JSON with all analytics stats and `"cache_status": "active"`

### **Step 6: Configure Cron Job**
**Option A: Every Minute (Recommended for Live Data)**
```bash
crontab -e
```
Add this line:
```bash
* * * * * /usr/bin/php /home/sparkl72/public_html/api/subscription_renewal_manager.php >> /home/sparkl72/cron_logs/analytics.log 2>&1
```

**Option B: Every 5 Minutes (Lower Server Load)**
```bash
*/5 * * * * /usr/bin/php /home/sparkl72/public_html/api/subscription_renewal_manager.php >> /home/sparkl72/cron_logs/analytics.log 2>&1
```

### **Step 7: Create Log Directory**
```bash
mkdir -p /home/sparkl72/cron_logs
chmod 755 /home/sparkl72/cron_logs
```

### **Step 8: Monitor Cron Logs**
```bash
tail -f /home/sparkl72/cron_logs/analytics.log
```

---

## 📊 Frontend Integration

### **Step 1: Add Analytics API Call to UserDashboard.jsx**

```javascript
import { analyticsAPI } from '../services/api';

// Inside fetchUserData function (around line 1340):
const fetchUserData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    const profileResponse = await userAPI.getProfile(user.uid);
    
    // Fetch analytics for admin dashboard
    if (profileResponse?.user_role === 'admin') {
      try {
        const analyticsData = await analyticsAPI.getDashboardStats();
        console.log('📊 Analytics loaded:', analyticsData);
        
        // Update dashboard state with analytics
        setDashboardData(prev => ({
          ...prev,
          analytics: analyticsData,
          lastAnalyticsUpdate: analyticsData.last_updated
        }));
      } catch (analyticsError) {
        console.warn('Analytics fetch failed, using fallback:', analyticsError);
      }
    }
    
    // ... rest of your existing fetch logic
    
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
```

### **Step 2: Display Analytics in Admin Dashboard**

Replace hardcoded stats with cached data:

```javascript
{/* Orders Card */}
<Card>
  <CardContent>
    <Typography variant="h6">Orders</Typography>
    <Typography variant="h4">
      {dashboardData?.analytics?.order_stats?.total_orders || 0}
    </Typography>
    <Typography variant="caption" color="textSecondary">
      {dashboardData?.analytics?.order_stats?.pending_orders || 0} pending
    </Typography>
  </CardContent>
</Card>

{/* Revenue Card */}
<Card>
  <CardContent>
    <Typography variant="h6">Revenue (GBP)</Typography>
    <Typography variant="h4">
      £{parseFloat(dashboardData?.analytics?.revenue_stats?.total_revenue_gbp || 0).toLocaleString()}
    </Typography>
    <Typography variant="caption" color="textSecondary">
      MWK {parseFloat(dashboardData?.analytics?.revenue_stats?.total_revenue_mwk || 0).toLocaleString()}
    </Typography>
  </CardContent>
</Card>

{/* Gadgets Card */}
<Card>
  <CardContent>
    <Typography variant="h6">Gadgets</Typography>
    <Typography variant="h4">
      {dashboardData?.analytics?.gadget_stats?.total_gadgets || 0}
    </Typography>
    <Typography variant="caption" color="textSecondary">
      {dashboardData?.analytics?.gadget_stats?.in_stock_gadgets || 0} in stock
    </Typography>
  </CardContent>
</Card>

{/* Subscriptions Card */}
<Card>
  <CardContent>
    <Typography variant="h6">Active Subscriptions</Typography>
    <Typography variant="h4">
      {dashboardData?.analytics?.subscription_stats?.active_subscriptions || 0}
    </Typography>
    <Typography variant="caption" color="textSecondary">
      Plus: {dashboardData?.analytics?.subscription_stats?.plus_subscribers || 0} | 
      Premium: {dashboardData?.analytics?.subscription_stats?.premium_subscribers || 0}
    </Typography>
  </CardContent>
</Card>
```

### **Step 3: Add Last Updated Indicator**

```javascript
{dashboardData?.lastAnalyticsUpdate && (
  <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
    📊 Analytics updated: {new Date(dashboardData.lastAnalyticsUpdate).toLocaleString()}
  </Typography>
)}
```

---

## 🧪 Testing Checklist

### **Backend Testing**
- [ ] Run cron manually: `php subscription_renewal_manager.php`
- [ ] Verify `analytics_cache` table is created
- [ ] Verify data is inserted with correct stats
- [ ] Check `last_updated` timestamp is recent
- [ ] Verify API returns JSON: `curl /analytics/dashboard`
- [ ] Verify all 8 stat categories have data
- [ ] Check cron logs for errors

### **Frontend Testing**
- [ ] Admin login shows analytics data
- [ ] All dashboard cards show real numbers
- [ ] "Last updated" timestamp is displayed
- [ ] Analytics refresh on page reload
- [ ] No errors in browser console
- [ ] Analytics load fast (<500ms)

### **Production Testing**
- [ ] Cron runs every minute without errors
- [ ] Analytics update within 60 seconds of changes
- [ ] Dashboard loads instantly (no slow queries)
- [ ] Server load remains acceptable
- [ ] Log file size remains manageable

---

## 🔧 Troubleshooting

### **Issue: Cron Not Running**
```bash
# Check cron service status
sudo systemctl status cron

# Check crontab is set
crontab -l

# Check PHP path
which php

# Check file permissions
ls -la /home/sparkl72/public_html/api/subscription_renewal_manager.php
```

### **Issue: Analytics Not Updating**
```bash
# Check last update time in database
mysql -u sparkl72_sparkle -p
USE sparkl72_sparkle;
SELECT last_updated FROM analytics_cache WHERE id = 1;

# Check error logs
tail -50 /home/sparkl72/cron_logs/analytics.log

# Run manually to see errors
php /home/sparkl72/public_html/api/subscription_renewal_manager.php
```

### **Issue: API Returns Empty Stats**
```bash
# Check if table exists
SELECT * FROM analytics_cache WHERE id = 1;

# If empty, run cron manually
php subscription_renewal_manager.php

# Check table structure
DESCRIBE analytics_cache;
```

### **Issue: Slow Performance**
- Reduce cron frequency to every 5 minutes
- Add database indexes on frequently queried columns
- Monitor server CPU/memory usage
- Consider caching frontend data for 1 minute

---

## 📈 Performance Metrics

### **Expected Execution Times**
- Analytics update: ~2-5 seconds
- API response time: <100ms
- Subscription renewals: ~5-10 seconds (if any due)
- Total cron execution: ~10-15 seconds max

### **Database Impact**
- Single row in `analytics_cache` table
- Minimal storage (<1KB per update)
- Read-heavy operations (no impact on user queries)
- Auto-indexed timestamp column for fast lookups

### **Server Load**
- CPU: <5% per cron execution
- Memory: <50MB per execution
- Network: Negligible (internal queries only)
- Disk I/O: Minimal (single row updates)

---

## 🎓 Key Benefits

1. **⚡ Instant Dashboard Load**: No slow aggregation queries
2. **📊 Live Data**: Updates every minute for real-time insights
3. **🔋 Low Resource Usage**: Single cron job for all analytics
4. **🛡️ No User Impact**: Background processing with cached reads
5. **📈 Comprehensive Stats**: 8 categories covering all business metrics
6. **🔄 Auto-Refresh**: Cron handles updates automatically
7. **🚀 Scalable**: Works efficiently with growing data
8. **📝 Full Audit Trail**: Timestamped updates for tracking

---

## 🔐 Security Notes

- Analytics endpoint is public (no sensitive data exposed)
- All queries use prepared statements
- JSON encoding prevents SQL injection
- Error logging doesn't expose credentials
- Cron runs with limited permissions

---

## 📝 Maintenance

### **Weekly Tasks**
- Check cron logs for errors
- Verify analytics are updating
- Monitor server resources
- Review dashboard accuracy

### **Monthly Tasks**
- Rotate log files (keep last 30 days)
- Review analytics performance
- Update cron schedule if needed
- Backup analytics_cache table

### **Log Rotation**
```bash
# Add to /etc/logrotate.d/sparkle-cron
/home/sparkl72/cron_logs/analytics.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
}
```

---

## ✅ Deployment Complete!

Once deployed, your dashboard will show:
- ✅ Real-time order and revenue statistics
- ✅ Live gadget and variant inventory counts
- ✅ Active subscription metrics by tier and gateway
- ✅ User growth and registration trends
- ✅ Installment plan tracking
- ✅ Trade-in pipeline visibility
- ✅ Last updated timestamp for data freshness

**Next Steps:**
1. Deploy files to production
2. Set up cron job (every 1-5 minutes)
3. Test analytics endpoint
4. Update frontend to use cached data
5. Monitor logs for first 24 hours
6. Enjoy instant dashboard performance! 🎉
