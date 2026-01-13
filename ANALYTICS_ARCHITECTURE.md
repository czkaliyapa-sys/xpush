# Analytics Architecture Overview

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User navigates to /dashboard                                             │
│           ↓                                                                │
│  [usePageTracking hook in OnboardingFlow.jsx/SignIn.tsx/Signup.tsx]      │
│           ↓                                                                │
│  Detects location change via useLocation()                               │
│           ↓                                                                │
│  POST /analytics/pageview {                                              │
│    sessionId: "abc123...",                                               │
│    path: "/dashboard",                                                   │
│    title: "Dashboard",                                                   │
│    referrer: "https://itsxtrapush.com",                                 │
│    user_agent: "Mozilla/5.0...",                                         │
│    timestamp: "2024-01-15T10:30:45Z"                                     │
│  }                                                                        │
│           ↓                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API (PHP)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [sparkle-pro-api/index.php]                                              │
│           ↓                                                                │
│  Route: if ($method === 'POST' && $path === '/analytics/pageview')       │
│           ↓                                                                │
│  Function: analytics_pageview_handler()                                   │
│           ↓                                                                │
│  INSERT INTO analytics_page_views (                                        │
│    session_id: "abc123...",                                              │
│    path: "/dashboard",                                                   │
│    title: "Dashboard",                                                   │
│    created_at: NOW()                                                     │
│  )                                                                        │
│           ↓                                                                │
│  UPDATE analytics_sessions SET page_count = page_count + 1               │
│           ↓                                                                │
│  Response: { "success": true }                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE (MySQL)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TABLE: analytics_page_views                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │ id | session_id | path       | title     | created_at   │             │
│  ├──────────────────────────────────────────────────────────┤             │
│  │ 1  | abc123...  | /dashboard | Dashboard | 2024-01-15...│             │
│  │ 2  | def456...  | /dashboard | Dashboard | 2024-01-15...│             │
│  │ 3  | abc123...  | /products  | Products  | 2024-01-15...│             │
│  └──────────────────────────────────────────────────────────┘             │
│           ↓ [Aggregated by cron job]                                      │
│                                                                             │
│  TABLE: analytics_cache                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ id │ order_stats  │ revenue_stats │ visitor_stats │ last_updated   │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ 1  │ {"total":42} │ {"gbp":{...}} │ {"page_views...│ 2024-01-15...│  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  (Other tables used for aggregation)                                      │
│  - orders (revenue stats)                                                │
│  - users (subscriber counts)                                             │
│  - subscriptions (active subs)                                           │
│  - gadgets (inventory)                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        [CRON JOB - Runs Hourly]
                                    ↓
                     GET /analytics/cron/aggregate
                                    ↓
           Function: analytics_aggregate_to_cache()
                                    ↓
   Reads from analytics_page_views, orders, users, subscriptions tables
                                    ↓
          Calculates and stores aggregated stats in analytics_cache
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD (React)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [UserDashboard.jsx]                                                      │
│           ↓                                                                │
│  GET /analytics/dashboard?timeRange=30d                                  │
│           ↓                                                                │
│  Function: analytics_get_dashboard()                                      │
│           ↓                                                                │
│  SELECT * FROM analytics_cache WHERE id = 1                              │
│           ↓                                                                │
│  Response: {                                                              │
│    "success": true,                                                       │
│    "data": {                                                              │
│      "order_stats": {                                                     │
│        "total_orders": 42,                                               │
│        "pending_orders": 5,                                              │
│        "orders_this_month": 12                                           │
│      },                                                                   │
│      "revenue_stats": {                                                   │
│        "gbp": {                                                           │
│          "total": 1234.56,                                               │
│          "today": 45.60,                                                 │
│          "this_month": 250.00                                            │
│        }                                                                  │
│      },                                                                   │
│      "visitor_stats": {                                                   │
│        "total_unique_visitors": 156,                                     │
│        "page_views_month": 1250,                                         │
│        "visitors_today": 23                                              │
│      },                                                                   │
│      "subscription_stats": {                                              │
│        "active_subscriptions": 15,                                       │
│        "plus_subscribers": 9,                                            │
│        "premium_subscribers": 6                                          │
│      }                                                                    │
│    }                                                                      │
│  }                                                                        │
│           ↓                                                                │
│  Display: Charts, cards, and numbers on dashboard                        │
│           ↓                                                                │
│  Admin sees: ✅ Page views, ✅ Revenue, ✅ Subscribers, etc.             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Relationships

```
Frontend Tracking
├── src/utils/analytics.js
│   ├── trackPageView(path, title)
│   ├── trackEvent(eventType, data)
│   └── getSessionId()
│
└── src/hooks/useAnalytics.js
    └── usePageTracking()
        └── Calls analytics.trackPageView() on route change

Backend Processing
├── sparkle-pro-api/index.php
│   │
│   ├── POST /analytics/pageview
│   │   └── analytics_pageview_handler()
│   │       └── Stores in analytics_page_views table
│   │
│   ├── GET /analytics/cron/aggregate (NEW!)
│   │   └── analytics_aggregate_to_cache()
│   │       ├── Reads: orders, users, subscriptions, gadgets
│   │       └── Writes: analytics_cache table
│   │
│   └── GET /analytics/dashboard
│       └── analytics_get_dashboard()
│           └── Reads: analytics_cache table

Frontend Display
└── src/external_components/UserDashboard.jsx
    └── GET /analytics/dashboard?timeRange=30d
        └── Displays aggregated statistics
```

## Key Files

### Frontend
- **[src/utils/analytics.js](../src/utils/analytics.js)** - Core tracking utility
- **[src/hooks/useAnalytics.js](../src/hooks/useAnalytics.js)** - Auto-tracking hook
- **[src/components/OnboardingFlow.jsx](../src/components/OnboardingFlow.jsx)** - Uses usePageTracking()
- **[src/external_components/SignIn.tsx](../src/external_components/SignIn.tsx)** - Uses usePageTracking()
- **[src/external_components/Signup.tsx](../src/external_components/Signup.tsx)** - Uses usePageTracking()
- **[src/external_components/UserDashboard.jsx](../src/external_components/UserDashboard.jsx)** - Displays analytics

### Backend
- **[sparkle-pro-api/index.php](../sparkle-pro-api/index.php)**
  - Line ~5370: `ensure_analytics_tables()` - Creates tables
  - Line ~5417: `analytics_pageview_handler()` - Receives page views
  - Line ~5731: `analytics_aggregate_to_cache()` - **NEW**: Aggregates data
  - Line ~5465: `analytics_get_dashboard()` - Serves cached data
  - Line ~6509: Routes for endpoints

### Database Tables
- `analytics_sessions` - Unique visitor sessions
- `analytics_page_views` - Individual page views (raw data)
- `analytics_events` - Custom events
- `analytics_cache` - Aggregated statistics (populated by cron)

## How to Set Up

1. **Set environment variable**:
   ```bash
   CRON_SECRET_TOKEN=your-secret-token
   ```

2. **Create cron job** (hourly):
   ```bash
   0 * * * * curl "https://itsxtrapush.com/api/analytics/cron/aggregate?token=your-secret-token"
   ```

3. **Test manually**:
   ```bash
   curl "https://itsxtrapush.com/api/analytics/cron/aggregate?token=your-secret-token"
   ```

4. **Check admin dashboard**:
   - Visit admin area
   - Should see page view counts and statistics

## Performance Notes

- **Frontend tracking**: ~1KB per request, asynchronous (non-blocking)
- **Database writes**: Indexed on session_id and created_at for fast inserts
- **Aggregation**: Runs once per hour, queries are optimized with indexes
- **Dashboard reads**: Reads from analytics_cache (denormalized, very fast)

## Data Retention

- `analytics_page_views`: Raw data, consider archiving after 6-12 months
- `analytics_cache`: Always current (id=1 upserted hourly)
- `analytics_sessions`: Can be cleaned up after 3 months

---

**Everything is set up and ready to go!** Just set the environment variable and create the cron job.
