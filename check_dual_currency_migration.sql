-- Diagnostic SQL to check dual currency migration status
USE itsxtrapush_db;

-- 1. Check if GBP columns exist in orders table
SHOW COLUMNS FROM orders LIKE '%gbp%';

-- 2. Check if GBP columns exist in order_items table  
SHOW COLUMNS FROM order_items LIKE '%gbp%';

-- 3. Check if analytics_cache table exists
SHOW TABLES LIKE 'analytics_cache';

-- 4. Check recent GBP orders and their GBP values
SELECT 
    id, 
    total_amount, 
    total_amount_gbp, 
    currency, 
    created_at 
FROM orders 
WHERE currency = 'GBP' 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if GBP values are populated
SELECT 
    COUNT(*) as total_gbp_orders,
    COUNT(CASE WHEN total_amount_gbp > 0 THEN 1 END) as orders_with_gbp_values,
    AVG(total_amount_gbp) as avg_gbp_value
FROM orders 
WHERE currency = 'GBP';

-- 6. Check analytics cache for GBP revenue data
SELECT 
    last_updated,
    JSON_EXTRACT(cache_data, '$.revenue_stats.total_revenue_gbp') as gbp_revenue,
    JSON_EXTRACT(cache_data, '$.revenue_stats.total_revenue_mwk') as mwk_revenue
FROM analytics_cache 
WHERE id = 1;

-- 7. Check if subscription_renewal_manager cron has run recently
SELECT 
    last_run,
    status,
    message
FROM cron_jobs 
WHERE job_name = 'subscription_renewal_manager'
ORDER BY last_run DESC 
LIMIT 5;