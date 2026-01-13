-- Migration: Convert USD pricing to GBP (British Pound Sterling)
-- Date: January 2, 2026
-- Purpose: Change international currency from USD to GBP
-- Conversion rate: 1 GBP = 1.31 USD (so USD / 1.31 = GBP)
-- MWK prices remain unchanged

-- ==========================================
-- STEP 1: Add new GBP columns to gadgets table
-- ==========================================

-- Add price_gbp column
ALTER TABLE `gadgets` ADD COLUMN `price_gbp` decimal(10,2) DEFAULT NULL AFTER `price`;

-- Add monthly_price_gbp column
ALTER TABLE `gadgets` ADD COLUMN `monthly_price_gbp` decimal(10,2) DEFAULT NULL AFTER `monthly_price`;

-- ==========================================
-- STEP 2: Convert USD values to GBP (divide by 1.31)
-- ==========================================

-- Convert price_usd to price_gbp
UPDATE `gadgets` 
SET `price_gbp` = ROUND(`price_usd` / 1.31, 2) 
WHERE `price_usd` IS NOT NULL;

-- Convert monthly_price_usd to monthly_price_gbp
UPDATE `gadgets` 
SET `monthly_price_gbp` = ROUND(`monthly_price_usd` / 1.31, 2) 
WHERE `monthly_price_usd` IS NOT NULL;

-- ==========================================
-- STEP 3: Drop old USD columns
-- ==========================================

-- Drop the old USD columns
ALTER TABLE `gadgets` DROP COLUMN `price_usd`;
ALTER TABLE `gadgets` DROP COLUMN `monthly_price_usd`;

-- ==========================================
-- STEP 4: Add index for GBP price column
-- ==========================================

ALTER TABLE `gadgets` ADD INDEX `idx_price_gbp` (`price_gbp`);

-- ==========================================
-- STEP 5: Update gadget_variants table
-- ==========================================

-- Add price_gbp column to gadget_variants
ALTER TABLE `gadget_variants` ADD COLUMN `price_gbp` decimal(10,2) DEFAULT NULL AFTER `price`;

-- Convert existing USD prices to GBP (if any)
UPDATE `gadget_variants` 
SET `price_gbp` = ROUND(`price_usd` / 1.31, 2) 
WHERE `price_usd` IS NOT NULL;

-- Drop old USD column
ALTER TABLE `gadget_variants` DROP COLUMN `price_usd`;

-- ==========================================
-- Verification queries (run after migration)
-- ==========================================

-- Check converted prices in gadgets
-- SELECT id, name, price as price_mwk, price_gbp, monthly_price as monthly_price_mwk, monthly_price_gbp FROM gadgets LIMIT 10;

-- Check converted prices in gadget_variants
-- SELECT id, gadget_id, price, price_gbp FROM gadget_variants LIMIT 10;

-- ==========================================
-- ROLLBACK SCRIPT (in case needed)
-- ==========================================
/*
-- To rollback, run these commands:

-- Add back USD columns
ALTER TABLE `gadgets` ADD COLUMN `price_usd` decimal(10,2) DEFAULT NULL AFTER `price`;
ALTER TABLE `gadgets` ADD COLUMN `monthly_price_usd` decimal(10,2) DEFAULT NULL AFTER `monthly_price`;

-- Convert GBP back to USD (multiply by 1.31)
UPDATE `gadgets` SET `price_usd` = ROUND(`price_gbp` * 1.31, 2) WHERE `price_gbp` IS NOT NULL;
UPDATE `gadgets` SET `monthly_price_usd` = ROUND(`monthly_price_gbp` * 1.31, 2) WHERE `monthly_price_gbp` IS NOT NULL;

-- Drop GBP columns
ALTER TABLE `gadgets` DROP INDEX `idx_price_gbp`;
ALTER TABLE `gadgets` DROP COLUMN `price_gbp`;
ALTER TABLE `gadgets` DROP COLUMN `monthly_price_gbp`;

-- Add back USD column to variants
ALTER TABLE `gadget_variants` ADD COLUMN `price_usd` decimal(10,2) DEFAULT NULL AFTER `price`;
UPDATE `gadget_variants` SET `price_usd` = ROUND(`price_gbp` * 1.31, 2) WHERE `price_gbp` IS NOT NULL;
ALTER TABLE `gadget_variants` DROP COLUMN `price_gbp`;
*/
