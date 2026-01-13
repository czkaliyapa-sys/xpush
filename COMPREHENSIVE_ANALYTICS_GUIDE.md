# Comprehensive Analytics System - Complete Guide

## 🎯 Overview

Enhanced analytics system with **12 comprehensive categories** covering all business metrics including visitor tracking, conversion funnels, popular products, and performance KPIs. All data is cached and updated every minute for instant dashboard access.

---

## 📊 Analytics Categories (12 Total)

### **1. Order Statistics** 📦
Tracks order lifecycle and volumes.

**Metrics:**
- `total_orders` - All-time order count
- `pending_orders` - Orders awaiting processing
- `completed_orders` - Successfully delivered orders
- `dispatched_orders` - Orders in transit
- `cancelled_orders` - Cancelled/failed orders
- `orders_today` - Orders placed today
- `orders_this_week` - Orders in last 7 days
- `orders_this_month` - Orders in current month

**Use Case:** Monitor order flow, identify bottlenecks, track daily performance

---

### **2. Revenue Statistics** 💰
Financial performance tracking in dual currencies.

**Metrics:**
- `total_revenue_mwk` - All-time revenue (Malawi Kwacha)
- `total_revenue_gbp` - All-time revenue (British Pounds)
- `revenue_today_mwk` / `revenue_today_gbp` - Today's revenue
- `revenue_this_week_mwk` / `revenue_this_week_gbp` - Weekly revenue
- `revenue_this_month_mwk` / `revenue_this_month_gbp` - Monthly revenue
- `avg_order_value_mwk` / `avg_order_value_gbp` - Average transaction size

**Use Case:** Financial reporting, goal tracking, currency performance comparison

---

### **3. Gadget Statistics** 📱
Inventory health and product distribution.

**Metrics:**
- `total_gadgets` - Total products in catalog
- `active_gadgets` - Products currently listed
- `in_stock_gadgets` - Available for purchase
- `low_stock_gadgets` - Stock ≤3 units (reorder alert)
- `out_of_stock_gadgets` - Zero inventory
- `total_stock_units` - Total inventory count
- `smartphones_count` - Smartphone category count
- `laptops_count` - Laptop category count
- `tablets_count` - Tablet category count
- `accessories_count` - Accessories category count

**Use Case:** Inventory management, reorder alerts, category performance

---

### **4. Variant Statistics** 🎨
Product variant tracking (colors, storage, conditions).

**Metrics:**
- `total_variants` - All product variants
- `active_variants` - Currently available variants
- `low_stock_variants` - Variants with ≤3 units
- `out_of_stock_variants` - Sold-out variants
- `total_variant_stock` - Combined variant inventory
- `unique_colors` - Number of color options
- `unique_storage_options` - Storage capacity options
- `unique_conditions` - Condition types (new, refurbished, etc.)

**Use Case:** Variant performance, popular configurations, reorder priorities

---

### **5. Subscription Statistics** ⭐
XtraPush Plus/Premium subscriber metrics.

**Metrics:**
- `total_subscriptions` - All subscription records
- `active_subscriptions` - Currently active subscribers
- `pending_subscriptions` - Awaiting activation
- `suspended_subscriptions` - Temporarily paused
- `cancelled_subscriptions` - Terminated subscriptions
- `plus_subscribers` - XtraPush Plus tier count
- `premium_subscribers` - XtraPush Premium tier count
- `square_subscriptions` - Subscriptions via Square (GBP)
- `paychangu_subscriptions` - Subscriptions via PayChangu (MWK)
- `new_subscriptions_today` - Sign-ups today
- `new_subscriptions_this_week` - Sign-ups in last 7 days

**Use Case:** Subscription growth, tier preferences, gateway performance, churn tracking

---

### **6. User Statistics** 👥
Customer base and registration trends.

**Metrics:**
- `total_users` - All registered users
- `admin_users` - Admin accounts
- `regular_users` - Customer accounts
- `users_registered_today` - New sign-ups today
- `users_registered_this_week` - Sign-ups in last 7 days
- `users_registered_this_month` - Sign-ups this month
- `subscribed_users` - Users with active subscriptions

**Use Case:** Growth tracking, customer acquisition, subscription penetration

---

### **7. Installment Statistics** 💳
Payment plan tracking and performance.

**Metrics:**
- `total_installment_orders` - Orders with payment plans
- `pending_installments` - Active payment plans
- `completed_installments` - Fully paid installments
- `total_installment_value_mwk` - Total installment revenue (MWK)
- `total_installment_value_gbp` - Total installment revenue (GBP)

**Use Case:** Payment plan popularity, completion rates, revenue tracking

---

### **8. Trade-in Statistics** 🔄
Device trade-in program metrics.

**Metrics:**
- `total_tradeins` - All trade-in requests
- `pending_tradeins` - Awaiting evaluation
- `approved_tradeins` - Accepted for trade
- `rejected_tradeins` - Declined requests
- `completed_tradeins` - Processed trade-ins
- `total_tradein_value` - Combined trade-in value
- `tradeins_today` - Requests submitted today

**Use Case:** Trade-in program health, approval rates, customer incentives

---

### **9. Visitor Statistics** 👁️ (NEW)
Website traffic and engagement metrics.

**Metrics:**
- `total_sessions` - Unique visitor sessions (90 days)
- `active_days` - Days with recorded activity
- `events_today` - Total events tracked today
- `events_this_week` - Events in last 7 days
- `events_this_month` - Events in last 30 days
- `total_page_views` - All page view events
- `add_to_cart_events` - Cart addition events
- `checkout_starts` - Checkout initiations
- `product_views` - Product detail page views
- `unique_visitors_today` - Distinct visitors today
- `unique_visitors_week` - Distinct visitors (7 days)
- `unique_visitors_month` - Distinct visitors (30 days)

**Use Case:** Traffic analysis, user engagement, marketing effectiveness

**Data Source:** `analytics_events` table (auto-tracked by frontend)

---

### **10. Conversion Statistics** 📈 (NEW)
Sales funnel and conversion rate tracking.

**Metrics:**
- `product_viewers` - Users viewing products (30 days)
- `cart_users` - Users adding to cart (30 days)
- `checkout_users` - Users starting checkout (30 days)
- `completed_orders` - Successful purchases (30 days)
- `view_to_cart_rate` - % of viewers adding to cart
- `cart_to_checkout_rate` - % of cart users checking out
- `checkout_to_order_rate` - % of checkouts completed
- `overall_conversion_rate` - % of viewers becoming buyers

**Use Case:** Funnel optimization, identify drop-off points, improve conversion

**Formula Examples:**
```
view_to_cart_rate = (cart_users / product_viewers) × 100
overall_conversion_rate = (completed_orders / product_viewers) × 100
```

---

### **11. Popular Products** 🔥 (NEW)
Top 10 trending products by views and purchases.

**Data Structure (Array of Objects):**
```json
[
  {
    "id": "gadget_123",
    "name": "iPhone 15 Pro Max",
    "category": "Smartphones",
    "price_mwk": "2500000",
    "price_gbp": "1299",
    "unique_views": 458,
    "total_views": 892,
    "purchases_this_month": 23
  },
  // ... 9 more products
]
```

**Use Case:** Product popularity, inventory priorities, marketing focus

---

### **12. Performance Statistics** ⚡ (NEW)
Operational efficiency and KPIs.

**Metrics:**
- `avg_order_processing_time` - Hours from order to dispatch
- `avg_delivery_time` - Hours from dispatch to delivery
- `pending_orders_count` - Orders awaiting action
- `low_stock_alerts` - Products needing reorder
- `out_of_stock_alerts` - Urgent stock issues
- `subscription_churn_rate` - % of subscriptions cancelled (30 days)
- `avg_order_value` - Average transaction amount (GBP)
- `inventory_turnover` - Stock rotation rate
- `customer_satisfaction` - Satisfaction score (future)

**Use Case:** Operational efficiency, bottleneck identification, service quality

---

## 🗄️ Database Schema

### **Enhanced analytics_cache Table**
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
    visitor_stats JSON,          -- NEW
    conversion_stats JSON,        -- NEW
    popular_products JSON,        -- NEW
    performance_stats JSON,       -- NEW
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_last_updated (last_updated)
);
```

### **Required analytics_events Table** (for visitor tracking)
```sql
CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
);
```

**Event Types:**
- `page_view` - User visits a page
- `product_view` - User views product detail
- `add_to_cart` - User adds product to cart
- `checkout_start` - User begins checkout
- `checkout_complete` - User completes purchase

---

## 🔄 How Visitor Tracking Works

### **Frontend Integration (Auto-tracking)**

Add to your main App.js or layout component:

```javascript
import { useEffect } from 'react';
import { trackEvent } from './services/analytics';

function App() {
  useEffect(() => {
    // Track page views
    trackEvent('page_view', { page: window.location.pathname });
  }, [window.location.pathname]);

  return <YourApp />;
}
```

### **Analytics Service (src/services/analytics.js)**

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';
let sessionId = null;

// Generate or retrieve session ID
function getSessionId() {
  if (!sessionId) {
    sessionId = localStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session', sessionId);
    }
  }
  return sessionId;
}

// Track any event
export async function trackEvent(eventType, data = {}) {
  try {
    await axios.post(`${API_URL}/analytics/track`, {
      sessionId: getSessionId(),
      eventType,
      data: JSON.stringify(data)
    });
  } catch (err) {
    console.warn('Analytics tracking failed:', err);
  }
}

// Specific tracking functions
export const trackPageView = (page) => trackEvent('page_view', { page });
export const trackProductView = (productId, productName) => 
  trackEvent('product_view', { productId, productName });
export const trackAddToCart = (productId, quantity) => 
  trackEvent('add_to_cart', { productId, quantity });
export const trackCheckoutStart = (cartTotal) => 
  trackEvent('checkout_start', { cartTotal });
export const trackCheckoutComplete = (orderId, orderTotal) => 
  trackEvent('checkout_complete', { orderId, orderTotal });
```

### **Usage in Components**

```javascript
import { trackProductView, trackAddToCart } from '../services/analytics';

function GadgetDetail({ gadget }) {
  useEffect(() => {
    // Track when user views product
    trackProductView(gadget.id, gadget.name);
  }, [gadget]);

  const handleAddToCart = () => {
    // Track when user adds to cart
    trackAddToCart(gadget.id, 1);
    // ... add to cart logic
  };

  return <div>...</div>;
}
```

---

## 📊 API Endpoint

### **GET /analytics/dashboard**

**Response (Full Example):**
```json
{
  "order_stats": { /* ... */ },
  "revenue_stats": { /* ... */ },
  "gadget_stats": { /* ... */ },
  "variant_stats": { /* ... */ },
  "subscription_stats": { /* ... */ },
  "user_stats": { /* ... */ },
  "installment_stats": { /* ... */ },
  "tradein_stats": { /* ... */ },
  "visitor_stats": {
    "total_sessions": 12456,
    "unique_visitors_today": 234,
    "unique_visitors_week": 1567,
    "unique_visitors_month": 5432,
    "total_page_views": 45678,
    "product_views": 8901,
    "add_to_cart_events": 3456,
    "checkout_starts": 1234,
    "events_today": 567,
    "events_this_week": 3456,
    "events_this_month": 12345
  },
  "conversion_stats": {
    "product_viewers": 8901,
    "cart_users": 3456,
    "checkout_users": 1234,
    "completed_orders": 987,
    "view_to_cart_rate": 38.82,
    "cart_to_checkout_rate": 35.72,
    "checkout_to_order_rate": 80.00,
    "overall_conversion_rate": 11.09
  },
  "popular_products": [
    {
      "id": "123",
      "name": "iPhone 15 Pro Max",
      "category": "Smartphones",
      "price_mwk": "2500000",
      "price_gbp": "1299",
      "unique_views": 458,
      "total_views": 892,
      "purchases_this_month": 23
    }
  ],
  "performance_stats": {
    "avg_order_processing_time": 24.5,
    "avg_delivery_time": 0,
    "pending_orders_count": 45,
    "low_stock_alerts": 12,
    "out_of_stock_alerts": 8,
    "subscription_churn_rate": 3.5,
    "avg_order_value": 245.50,
    "inventory_turnover": 0,
    "customer_satisfaction": 0
  },
  "last_updated": "2026-01-11 14:35:22",
  "cache_status": "active"
}
```

---

## 🎨 Frontend Dashboard Layout

### **Recommended Tab Structure**

```
📊 Dashboard (UserDashboard.jsx)
├── 📦 Home Tab (Orders Only)
│   ├── Recent Orders Table
│   ├── Order Status Filters
│   └── Quick Actions
│
├── 📊 Analytics Tab (NEW - All Stats)
│   ├── Overview Cards (4 KPIs)
│   │   ├── Total Revenue
│   │   ├── Total Orders
│   │   ├── Active Subscriptions
│   │   └── Visitors Today
│   │
│   ├── Visitor & Conversion Section
│   │   ├── Visitor Stats Card
│   │   ├── Conversion Funnel Chart
│   │   └── Conversion Rate Cards
│   │
│   ├── Sales Performance Section
│   │   ├── Revenue Chart (30 days)
│   │   ├── Orders Timeline
│   │   └── Average Order Value
│   │
│   ├── Inventory Health Section
│   │   ├── Stock Status Cards
│   │   ├── Low Stock Alerts
│   │   └── Category Breakdown
│   │
│   ├── Popular Products Section
│   │   └── Top 10 Products Table
│   │
│   └── Performance Metrics Section
│       ├── Order Processing Time
│       ├── Subscription Churn Rate
│       └── Operational KPIs
│
├── 💳 Payments Tab
├── 🔄 Trade-Ins Tab
└── ⚙️ Settings Tab
```

---

## 🚀 Frontend Implementation Example

### **Analytics Tab Component**

```javascript
import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  Card, CardContent, Typography, Grid, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Box, Chip
} from '@mui/material';
import {
  TrendingUp, ShoppingCart, People, Visibility,
  ShowChart, Inventory, Star, Speed
} from '@mui/icons-material';

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await analyticsAPI.getDashboardStats();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  const { 
    order_stats, revenue_stats, visitor_stats, conversion_stats,
    popular_products, performance_stats, subscription_stats,
    gadget_stats, last_updated 
  } = analytics;

  return (
    <Box sx={{ p: 3 }}>
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4">
                £{parseFloat(revenue_stats?.total_revenue_gbp || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                MWK {parseFloat(revenue_stats?.total_revenue_mwk || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Orders</Typography>
              </Box>
              <Typography variant="h4">
                {order_stats?.total_orders || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {order_stats?.pending_orders || 0} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Star color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Subscriptions</Typography>
              </Box>
              <Typography variant="h4">
                {subscription_stats?.active_subscriptions || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Plus: {subscription_stats?.plus_subscribers || 0} | 
                Premium: {subscription_stats?.premium_subscribers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Visibility color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Visitors Today</Typography>
              </Box>
              <Typography variant="h4">
                {visitor_stats?.unique_visitors_today || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {visitor_stats?.events_today || 0} events tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conversion Funnel */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
            Conversion Funnel (Last 30 Days)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{conversion_stats?.product_viewers || 0}</Typography>
                <Typography variant="caption">Product Viewers</Typography>
                <LinearProgress variant="determinate" value={100} sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{conversion_stats?.cart_users || 0}</Typography>
                <Typography variant="caption">Added to Cart</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={conversion_stats?.view_to_cart_rate || 0} 
                  sx={{ mt: 1 }} 
                />
                <Typography variant="caption" color="primary">
                  {conversion_stats?.view_to_cart_rate || 0}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{conversion_stats?.checkout_users || 0}</Typography>
                <Typography variant="caption">Started Checkout</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={conversion_stats?.cart_to_checkout_rate || 0} 
                  sx={{ mt: 1 }} 
                />
                <Typography variant="caption" color="primary">
                  {conversion_stats?.cart_to_checkout_rate || 0}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{conversion_stats?.completed_orders || 0}</Typography>
                <Typography variant="caption">Completed Orders</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={conversion_stats?.checkout_to_order_rate || 0} 
                  sx={{ mt: 1 }} 
                />
                <Typography variant="caption" color="success">
                  {conversion_stats?.checkout_to_order_rate || 0}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Chip 
              label={`Overall Conversion Rate: ${conversion_stats?.overall_conversion_rate || 0}%`}
              color="primary"
              size="large"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Popular Products */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🔥 Top 10 Popular Products
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell align="right">Purchases</TableCell>
                <TableCell align="right">Price (GBP)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {popular_products?.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      #{index + 1} {product.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">
                    {product.unique_views} ({product.total_views} total)
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={product.purchases_this_month} color="success" size="small" />
                  </TableCell>
                  <TableCell align="right">£{product.price_gbp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
            Performance Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption">Avg Order Processing Time</Typography>
              <Typography variant="h6">
                {performance_stats?.avg_order_processing_time || 0} hours
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption">Subscription Churn Rate</Typography>
              <Typography variant="h6" color={
                performance_stats?.subscription_churn_rate > 5 ? 'error' : 'success'
              }>
                {performance_stats?.subscription_churn_rate || 0}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption">Low Stock Alerts</Typography>
              <Typography variant="h6" color="warning.main">
                {performance_stats?.low_stock_alerts || 0} products
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        📊 Analytics updated: {new Date(last_updated).toLocaleString()}
      </Typography>
    </Box>
  );
}

export default AnalyticsTab;
```

---

## ✅ Deployment Steps

1. **Deploy Backend Files**
```bash
./deploy-analytics.sh
```

2. **Create analytics_events Table** (if not exists)
```sql
CREATE TABLE analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
);
```

3. **Add Analytics Tracking to Frontend**
- Create `src/services/analytics.js` with tracking functions
- Add event tracking to components
- Track page views, product views, cart additions, checkouts

4. **Create Analytics Tab in Dashboard**
- Add new tab to UserDashboard.jsx
- Implement AnalyticsTab component
- Display all 12 analytics categories

5. **Test Everything**
- Verify cron updates all 12 categories
- Test visitor tracking works
- Check conversion funnel calculations
- Verify popular products update

---

## 📈 Key Insights You Can Now Track

1. **Traffic Quality**: Unique visitors vs page views ratio
2. **Conversion Bottlenecks**: Where users drop off in the funnel
3. **Product Performance**: Which products drive traffic vs sales
4. **Operational Efficiency**: Order processing speed, stock management
5. **Revenue Trends**: Daily/weekly/monthly performance
6. **Customer Behavior**: Session duration, product interests
7. **Subscription Health**: Growth rate, churn rate, tier preferences
8. **Inventory Intelligence**: Reorder priorities, category performance

---

**Status**: ✅ Enhanced with 12 Comprehensive Categories  
**New Categories**: Visitor Stats, Conversion Stats, Popular Products, Performance Stats  
**Total Metrics**: 100+ data points updated every minute  
**Use Case**: Complete business intelligence dashboard
