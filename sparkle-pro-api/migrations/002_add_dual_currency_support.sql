-- ================================================================
-- DUAL CURRENCY SUPPORT MIGRATION
-- Adds GBP (British Pounds) support alongside MWK (Malawi Kwacha)
-- ================================================================

-- Purpose: Enable dual-currency tracking for orders and analytics
-- Date: 2026-01-11
-- Affects: orders table, order_items table, analytics_cache table

-- ================================================================
-- STEP 1: Add GBP amount column to orders table
-- ================================================================

ALTER TABLE `orders` 
ADD COLUMN `total_amount_gbp` DECIMAL(10,2) NULL DEFAULT 0.00 
COMMENT 'Order total in British Pounds (GBP)' 
AFTER `total_amount`;

-- ================================================================
-- STEP 2: Add GBP unit price column to order_items table
-- ================================================================

ALTER TABLE `order_items` 
ADD COLUMN `unit_price_gbp` DECIMAL(10,2) NULL DEFAULT 0.00 
COMMENT 'Item unit price in British Pounds (GBP)' 
AFTER `unit_price`;

ALTER TABLE `order_items` 
ADD COLUMN `total_price_gbp` DECIMAL(10,2) NULL DEFAULT 0.00 
COMMENT 'Item total price in British Pounds (GBP)' 
AFTER `total_price`;

-- ================================================================
-- STEP 3: Backfill existing orders with GBP values
-- ================================================================
-- Conversion rate: 1 GBP = 1800 MWK (approximate historical rate)
-- Note: This is a one-time backfill. Future orders will store both currencies at checkout.

UPDATE `orders` 
SET `total_amount_gbp` = ROUND(`total_amount` / 1800, 2)
WHERE `total_amount_gbp` IS NULL OR `total_amount_gbp` = 0;

UPDATE `order_items` 
SET `unit_price_gbp` = ROUND(`unit_price` / 1800, 2),
    `total_price_gbp` = ROUND(`total_price` / 1800, 2)
WHERE `unit_price_gbp` IS NULL OR `unit_price_gbp` = 0;

-- ================================================================
-- STEP 4: Create/Update analytics_cache table with new columns
-- ================================================================

CREATE TABLE IF NOT EXISTS `analytics_cache` (
    `id` INT PRIMARY KEY DEFAULT 1,
    `order_stats` JSON,
    `gadget_stats` JSON,
    `variant_stats` JSON,
    `subscription_stats` JSON,
    `user_stats` JSON,
    `revenue_stats` JSON,
    `installment_stats` JSON,
    `tradein_stats` JSON,
    `visitor_stats` JSON,
    `conversion_stats` JSON,
    `popular_products` JSON,
    `performance_stats` JSON,
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_last_updated` (`last_updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify orders have GBP amounts
-- SELECT id, total_amount, total_amount_gbp, currency, status FROM orders LIMIT 10;

-- Verify order_items have GBP prices
-- SELECT id, order_id, unit_price, unit_price_gbp, total_price, total_price_gbp FROM order_items LIMIT 10;

-- Check analytics_cache table structure
-- DESCRIBE analytics_cache;

-- ================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ================================================================
-- Run these commands ONLY if you need to undo the migration:
--
-- ALTER TABLE `orders` DROP COLUMN `total_amount_gbp`;
-- ALTER TABLE `order_items` DROP COLUMN `unit_price_gbp`;
-- ALTER TABLE `order_items` DROP COLUMN `total_price_gbp`;

-- ================================================================
-- NOTES FOR DEVELOPERS
-- ================================================================

-- 1. FRONTEND CHECKOUT:
--    - Store both MWK and GBP amounts during checkout
--    - Use user location or currency selection to determine pricing
--    - Calculate real-time exchange rates or use fixed rates per product

-- 2. ANALYTICS:
--    - Revenue stats will now include both total_revenue_mwk and total_revenue_gbp
--    - Reports can show dual-currency breakdowns
--    - Cron job (subscription_renewal_manager.php) handles analytics updates

-- 3. PRICING STRATEGY:
--    - Gadgets table already has price and price_gbp columns
--    - UK users see GBP prices, Malawi users see MWK prices
--    - Gateway selection: Square (GBP), PayChangu (MWK)

-- 4. EXCHANGE RATE:
--    - Current backfill uses: 1 GBP = 1800 MWK
--    - Future: Consider live exchange rates or region-based fixed rates
--    - Update exchange_rate in payment processing logic

-- ================================================================
-- DEPLOYMENT CHECKLIST
-- ================================================================

-- BEFORE DEPLOYMENT:
-- [ ] Backup database: mysqldump itsxtrapush_db > backup_$(date +%Y%m%d).sql
-- [ ] Test on staging/development database first
-- [ ] Verify no active transactions during migration

-- DURING DEPLOYMENT:
-- [ ] Run this migration during low-traffic hours
-- [ ] Monitor query execution time
-- [ ] Check error logs for any issues

-- AFTER DEPLOYMENT:
-- [ ] Verify dual-currency data in orders table
-- [ ] Test checkout with both MWK and GBP
-- [ ] Run analytics cron manually: php subscription_renewal_manager.php
-- [ ] Check admin dashboard shows both currencies
-- [ ] Update frontend to display both currency options

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Next steps:
-- 1. Deploy updated subscription_renewal_manager.php (already fixed)
-- 2. Update checkout API to store both currencies
-- 3. Update dashboard to display dual-currency analytics
-- 4. Test end-to-end order flow with both payment gateways
