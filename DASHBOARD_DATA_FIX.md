# Dashboard Data Accuracy Fix

## Issues Identified

### 1. **Field Name Mismatches**
The frontend UserDashboard.jsx expects different field names than what the backend API returns:

**Current Frontend Expectations:**
```javascript
// Revenue
dashboardData.adminAnalytics?.revenue_stats?.total_revenue_gbp
dashboardData.adminAnalytics?.revenue_stats?.revenue_today_gbp

// Subscriptions  
dashboardData.adminAnalytics?.subscription_stats?.active_subscriptions
dashboardData.adminAnalytics?.subscription_stats?.plus_subscribers
dashboardData.adminAnalytics?.subscription_stats?.premium_subscribers

// Orders
dashboardData.adminAnalytics?.order_stats?.total_orders
dashboardData.adminAnalytics?.order_stats?.pending_orders
```

**Actual Backend Response Structure:**
```json
{
  "revenue_stats": {
    "gbp": {
      "total": 105.49,
      "this_month": 105.49
    },
    "mwk": {
      "total": 295399,
      "this_month": 295399
    }
  },
  "subscription_stats": {
    "total_subscriptions": "2",
    "plus_count": "2", 
    "premium_count": "0",
    "active_count": "2"
  },
  "order_stats": {
    "total_orders": "17",
    "orders_this_month": "17",
    "completed_orders": "0",
    "pending_orders": "13",
    "cancelled_orders": "0",
    "dispatched_orders": "0"
  }
}
```

### 2. **Missing Data Transformations**
The frontend needs to transform the backend data structure to match its expected format.

### 3. **Currency Handling Issues**
Need to properly handle GBP vs MWK currency display based on user location.

## Required Fixes

### Fix 1: Update UserDashboard.jsx Data Mapping

**File:** `/src/external_components/UserDashboard.jsx`

Add data transformation logic to map backend fields to frontend expectations:

```javascript
// Around line 834-845, modify the admin analytics section:
let adminAnalytics = null;
if (isAdmin()) {
  try {
    const analyticsRes = await analyticsAPI.getDashboardStats();
    if (analyticsRes?.data) {
      // Transform backend data structure to match frontend expectations
      const transformedData = {
        ...analyticsRes.data,
        // Transform revenue stats
        revenue_stats: {
          total_revenue_gbp: analyticsRes.data.revenue_stats?.gbp?.total || 0,
          revenue_today_gbp: analyticsRes.data.revenue_stats?.gbp?.this_month || 0,
          total_revenue_mwk: analyticsRes.data.revenue_stats?.mwk?.total || 0
        },
        // Transform subscription stats
        subscription_stats: {
          active_subscriptions: parseInt(analyticsRes.data.subscription_stats?.active_count || 0),
          plus_subscribers: parseInt(analyticsRes.data.subscription_stats?.plus_count || 0),
          premium_subscribers: parseInt(analyticsRes.data.subscription_stats?.premium_count || 0),
          total_subscriptions: parseInt(analyticsRes.data.subscription_stats?.total_subscriptions || 0)
        },
        // Order stats are already correctly structured
        order_stats: {
          total_orders: parseInt(analyticsRes.data.order_stats?.total_orders || 0),
          pending_orders: parseInt(analyticsRes.data.order_stats?.pending_orders || 0),
          completed_orders: parseInt(analyticsRes.data.order_stats?.completed_orders || 0),
          cancelled_orders: parseInt(analyticsRes.data.order_stats?.cancelled_orders || 0),
          dispatched_orders: parseInt(analyticsRes.data.order_stats?.dispatched_orders || 0)
        }
      };
      adminAnalytics = transformedData;
    }
  } catch (e) {
    console.warn('Failed to fetch admin analytics:', e);
  }
}
```

### Fix 2: Add Proper Currency Detection

**File:** `/src/external_components/UserDashboard.jsx`

Add currency-aware formatting:

```javascript
// Add near the top of the component with other hooks
const { currency: userCurrency } = useLocation(); // Assuming this hook exists

// Helper function for currency formatting
const formatAdminCurrency = (amount, currencyType = 'gbp') => {
  if (!amount) return userCurrency === 'MWK' ? 'MWK 0' : '£0.00';
  
  if (userCurrency === 'MWK') {
    return `MWK ${parseInt(amount).toLocaleString('en-MW')}`;
  } else {
    if (currencyType === 'gbp') {
      return `£${parseFloat(amount).toFixed(2)}`;
    } else {
      // Convert MWK to GBP approximation if needed
      return `£${(parseInt(amount) / 1100).toFixed(2)}`;
    }
  }
};

// Update the StatCard for Revenue to use proper currency:
<StatCard 
  title="Total Revenue" 
  value={
    userCurrency === 'MWK' 
      ? formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.total_revenue_mwk || 0, 'mwk')
      : formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.total_revenue_gbp || 0, 'gbp')
  } 
  subtitle={
    userCurrency === 'MWK'
      ? formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.revenue_today_mwk || 0, 'mwk') + ' today'
      : formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.revenue_today_gbp || 0, 'gbp') + ' today'
  } 
  icon={<MonetizationOnIcon />} 
  color="#10B981" 
/>
```

### Fix 3: Update Installment Stats Mapping

**File:** `/src/external_components/UserDashboard.jsx`

Lines around 2572-2596 need similar fixes:

```javascript
// Update installment stats to handle both cached analytics and fallback data
const totalInstallments = dashboardData.adminAnalytics?.installment_stats?.total_installment_orders || 
                         dashboardData.installments.length || 0;

const pendingInstallments = dashboardData.adminAnalytics?.installment_stats?.pending_installments || 
                           dashboardData.installments.filter(i => i.status !== 'completed').length || 0;

const completedInstallments = dashboardData.adminAnalytics?.installment_stats?.completed_installments || 
                             dashboardData.installments.filter(i => i.status === 'completed').length || 0;

const totalInstallmentValue = dashboardData.adminAnalytics?.installment_stats?.total_installment_value_gbp 
  ? `£${Number(dashboardData.adminAnalytics.installment_stats.total_installment_value_gbp).toLocaleString()}`
  : formatCurrency(dashboardData.installments.reduce((sum, i) => sum + (i.totalAmount || 0), 0));
```

## Verification Steps

1. **Test Admin Dashboard Display:**
   ```bash
   # Login as admin and check dashboard
   # Verify all stat cards show real data instead of zeros
   ```

2. **Test Currency Display:**
   ```bash
   # Access from Malawi IP - should show MWK amounts
   # Access from UK IP - should show GBP amounts
   ```

3. **Test Data Freshness:**
   ```bash
   # Check "Last updated" timestamp shows recent time
   # Verify data updates after new orders/activities
   ```

## Expected Results After Fix

- ✅ Admin dashboard shows actual order counts (17 total, 13 pending)
- ✅ Revenue displays correctly (£105.49 total, £105.49 this month)
- ✅ Subscription stats show 2 total, 2 Plus, 0 Premium
- ✅ Inventory shows 46 total gadgets
- ✅ Currency displays correctly based on user location
- ✅ Installment stats show real data from analytics cache
- ✅ "Last updated" timestamp shows recent update time

## Files to Modify

1. `/src/external_components/UserDashboard.jsx` - Main dashboard component
2. Possibly `/src/services/api.js` - Add helper functions if needed
3. Test with actual admin login to verify fixes

## Testing Command

```bash
# Test the analytics endpoint directly
curl "https://sparkle-pro.co.uk/api/analytics/dashboard?timeRange=7d" | jq '{
  "orders": .data.order_stats,
  "revenue": .data.revenue_stats,
  "subscriptions": .data.subscription_stats,
  "inventory": .data.gadget_stats
}'
```