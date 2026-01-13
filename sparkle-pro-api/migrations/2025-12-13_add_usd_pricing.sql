-- Migration: Add USD pricing columns to gadgets table
-- Date: December 13, 2025
-- Purpose: Support dual currency pricing (MWK and USD)
-- Note: Existing 'price' and 'monthly_price' columns will contain MWK values
--       New 'price_usd' and 'monthly_price_usd' columns will contain USD values

ALTER TABLE `gadgets` ADD COLUMN `price_usd` decimal(10,2) DEFAULT NULL AFTER `price`;
ALTER TABLE `gadgets` ADD COLUMN `monthly_price_usd` decimal(10,2) DEFAULT NULL AFTER `monthly_price`;

-- Update existing data with USD equivalents (using approximate exchange rate 1 USD = 1020.4 MWK)
-- This is a conversion from the current MWK prices to USD for reference
-- Adjust the calculation if you have a different exchange rate
UPDATE `gadgets` SET `price_usd` = ROUND(`price` / 1020.4, 2) WHERE `price_usd` IS NULL AND `price` IS NOT NULL;
UPDATE `gadgets` SET `monthly_price_usd` = ROUND(`monthly_price` / 1020.4, 2) WHERE `monthly_price_usd` IS NULL AND `monthly_price` IS NOT NULL;

-- Add indexes for better query performance
ALTER TABLE `gadgets` ADD INDEX `idx_price_usd` (`price_usd`);

-- Verification query to check the changes
-- SELECT id, name, price as price_mwk, price_usd, monthly_price as monthly_price_mwk, monthly_price_usd FROM gadgets LIMIT 10;
