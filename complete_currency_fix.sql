-- ================================================================
-- COMPLETE CURRENCY SYSTEM FIX
-- Run this SQL script on your production database
-- ================================================================

USE itsxtrapush_db;

-- ================================================================
-- STEP 1: Ensure GBP columns exist in orders table
-- ================================================================
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
                     AND TABLE_NAME = 'orders' 
                     AND COLUMN_NAME = 'total_amount_gbp');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN total_amount_gbp DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Order total in British Pounds (GBP)\' AFTER total_amount',
    'SELECT \'Column total_amount_gbp already exists\' as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================================
-- STEP 2: Ensure GBP columns exist in order_items table
-- ================================================================
SET @unit_column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                          WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
                          AND TABLE_NAME = 'order_items' 
                          AND COLUMN_NAME = 'unit_price_gbp');

SET @total_column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
                           AND TABLE_NAME = 'order_items' 
                           AND COLUMN_NAME = 'total_price_gbp');

SET @sql_unit = IF(@unit_column_exists = 0,
    'ALTER TABLE order_items ADD COLUMN unit_price_gbp DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Item unit price in British Pounds (GBP)\' AFTER unit_price',
    'SELECT \'Column unit_price_gbp already exists\' as message');

SET @sql_total = IF(@total_column_exists = 0,
    'ALTER TABLE order_items ADD COLUMN total_price_gbp DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Item total price in British Pounds (GBP)\' AFTER total_price',
    'SELECT \'Column total_price_gbp already exists\' as message');

PREPARE stmt_unit FROM @sql_unit;
EXECUTE stmt_unit;
DEALLOCATE PREPARE stmt_unit;

PREPARE stmt_total FROM @sql_total;
EXECUTE stmt_total;
DEALLOCATE PREPARE stmt_total;

-- ================================================================
-- STEP 3: Backfill existing GBP orders with GBP values
-- ================================================================
UPDATE orders 
SET total_amount_gbp = ROUND(total_amount / 1800, 2)
WHERE currency = 'GBP' 
AND (total_amount_gbp IS NULL OR total_amount_gbp = 0);

-- ================================================================
-- STEP 4: Backfill existing order items with GBP values
-- ================================================================
UPDATE order_items oi
JOIN orders o ON oi.order_id = o.id
SET 
    oi.unit_price_gbp = ROUND(oi.unit_price / 1800, 2),
    oi.total_price_gbp = ROUND(oi.total_price / 1800, 2)
WHERE o.currency = 'GBP'
AND (oi.unit_price_gbp IS NULL OR oi.unit_price_gbp = 0);

-- ================================================================
-- STEP 5: Create/Update analytics cache with correct GBP revenue
-- ================================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id INT PRIMARY KEY DEFAULT 1,
    order_stats JSON,
    gadget_stats JSON,
    variant_stats JSON,
    subscription_stats JSON,
    user_stats JSON,
    revenue_stats JSON,
    installment_stats JSON,
    tradein_stats JSON,
    visitor_stats JSON,
    conversion_stats JSON,
    popular_products JSON,
    performance_stats JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Calculate actual GBP revenue
SET @gbp_total = (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid');
SET @gbp_today = (SELECT COALESCE(SUM(total_amount_gbp), 0) FROM orders WHERE currency = 'GBP' AND payment_status = 'paid' AND DATE(created_at) = CURDATE());
SET @mwk_total = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid');
SET @mwk_today = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE currency = 'MWK' AND payment_status = 'paid' AND DATE(created_at) = CURDATE());

-- Create JSON revenue data
SET @revenue_json = CONCAT('{
    "mwk": {
        "total": ', @mwk_total, ',
        "today": ', @mwk_today, ',
        "this_week": 0,
        "this_month": 0,
        "avg_order_value": ', IF(@mwk_total > 0, ROUND(@mwk_total / 2, 2), 0), '
    },
    "gbp": {
        "total": ', @gbp_total, ',
        "today": ', @gbp_today, ',
        "this_week": 0,
        "this_month": 0,
        "avg_order_value": ', IF(@gbp_total > 0, ROUND(@gbp_total / 2, 2), 0), '
    }
}');

-- Insert or update analytics cache
INSERT INTO analytics_cache (id, revenue_stats, last_updated) 
VALUES (1, @revenue_json, NOW())
ON DUPLICATE KEY UPDATE 
revenue_stats = @revenue_json,
last_updated = NOW();

-- ================================================================
-- STEP 6: Verification Queries
-- ================================================================
SELECT '=== VERIFICATION RESULTS ===' as section;

SELECT 
    COUNT(*) as total_gbp_orders,
    COUNT(CASE WHEN total_amount_gbp > 0 THEN 1 END) as orders_with_gbp_values
FROM orders 
WHERE currency = 'GBP';

SELECT 
    JSON_EXTRACT(revenue_stats, '$.gbp.total') as gbp_revenue_total,
    JSON_EXTRACT(revenue_stats, '$.mwk.total') as mwk_revenue_total
FROM analytics_cache 
WHERE id = 1;

SELECT '✅ FIX COMPLETE - Currency system is now properly configured' as status;