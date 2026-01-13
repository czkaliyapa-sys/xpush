-- Migration: Add subscription fields to users table
-- This migration adds Square subscription tracking to the users table
-- Run this migration on your MySQL database

-- Add subscription-related columns to users table
ALTER TABLE `users`
ADD COLUMN `square_customer_id` VARCHAR(100) NULL COMMENT 'Square customer ID for subscription management' AFTER `email_verified`,
ADD COLUMN `subscription_id` VARCHAR(100) NULL COMMENT 'Square subscription ID' AFTER `square_customer_id`,
ADD COLUMN `subscription_status` VARCHAR(50) DEFAULT NULL COMMENT 'Current subscription status (ACTIVE, PENDING, CANCELED, etc.)' AFTER `subscription_id`,
ADD COLUMN `subscription_active` TINYINT(1) DEFAULT 0 COMMENT 'Whether subscription is currently active (1=yes, 0=no)' AFTER `subscription_status`,
ADD COLUMN `subscription_updated_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Last subscription status update' AFTER `subscription_active`;

-- Add indexes for faster lookups
ALTER TABLE `users`
ADD INDEX `idx_square_customer_id` (`square_customer_id`),
ADD INDEX `idx_subscription_id` (`subscription_id`),
ADD INDEX `idx_subscription_active` (`subscription_active`);

-- Optional: Create a subscription_events table for tracking subscription history
CREATE TABLE IF NOT EXISTS `subscription_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(100) NOT NULL COMMENT 'User unique identifier',
  `subscription_id` VARCHAR(100) NULL COMMENT 'Square subscription ID',
  `event_type` VARCHAR(50) NOT NULL COMMENT 'Event type (created, activated, canceled, payment_failed, etc.)',
  `event_data` JSON NULL COMMENT 'Additional event data from Square webhook',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_uid` (`user_uid`),
  INDEX `idx_subscription_id` (`subscription_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subscription event history';

-- Sample query to check subscription status
-- SELECT uid, email, subscription_status, subscription_active, subscription_updated_at 
-- FROM users WHERE subscription_active = 1;
