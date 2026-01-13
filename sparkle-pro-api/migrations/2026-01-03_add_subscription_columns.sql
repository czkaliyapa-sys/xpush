-- Migration: Add subscription columns to users table
-- Date: 2026-01-03
-- Description: Adds columns to track user subscription status for Xtrapush Premium (£5/month)
--              Benefits: Free delivery, insurance on purchases, returns accepted, priority support

-- Add subscription columns to users table
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `subscription_id` VARCHAR(100) DEFAULT NULL COMMENT 'Square subscription ID',
ADD COLUMN IF NOT EXISTS `subscription_status` ENUM('ACTIVE', 'CANCELED', 'PAUSED', 'PENDING', 'EXPIRED') DEFAULT NULL COMMENT 'Subscription status from Square',
ADD COLUMN IF NOT EXISTS `subscription_active` TINYINT(1) DEFAULT 0 COMMENT 'Whether subscription is currently active',
ADD COLUMN IF NOT EXISTS `subscription_plan_id` VARCHAR(100) DEFAULT NULL COMMENT 'Square subscription plan ID',
ADD COLUMN IF NOT EXISTS `subscription_start_date` DATETIME DEFAULT NULL COMMENT 'When subscription started',
ADD COLUMN IF NOT EXISTS `subscription_end_date` DATETIME DEFAULT NULL COMMENT 'When subscription ends (if cancelled)',
ADD COLUMN IF NOT EXISTS `subscription_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last subscription status update',
ADD COLUMN IF NOT EXISTS `square_customer_id` VARCHAR(100) DEFAULT NULL COMMENT 'Square customer ID for payments';

-- Add index for faster subscription lookups
ALTER TABLE `users`
ADD INDEX IF NOT EXISTS `idx_subscription_active` (`subscription_active`),
ADD INDEX IF NOT EXISTS `idx_square_customer_id` (`square_customer_id`);

-- Create subscriptions history table for audit trail
CREATE TABLE IF NOT EXISTS `subscription_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_uid` VARCHAR(255) NOT NULL,
  `subscription_id` VARCHAR(100) NOT NULL,
  `action` ENUM('CREATED', 'ACTIVATED', 'CANCELED', 'PAUSED', 'RESUMED', 'PAYMENT_FAILED', 'EXPIRED') NOT NULL,
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `amount_paid` DECIMAL(10,2) DEFAULT NULL,
  `currency` VARCHAR(3) DEFAULT 'GBP',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_uid` (`user_uid`),
  KEY `idx_subscription_id` (`subscription_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration complete!
-- Note: The subscription columns and history table have been added to support Xtrapush Premium subscriptions.
