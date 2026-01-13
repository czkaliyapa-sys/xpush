-- Migration: Add subscription_tier column to users table
-- Date: 2026-01-07
-- Purpose: Support multiple subscription tiers (Plus and Premium)

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `subscription_tier` ENUM('plus', 'premium') DEFAULT NULL COMMENT 'Subscription tier: plus or premium' AFTER `subscription_status`;

-- Update existing subscriptions to default tier
UPDATE `users` 
SET `subscription_tier` = 'plus' 
WHERE `subscription_active` = 1 AND `subscription_tier` IS NULL;
