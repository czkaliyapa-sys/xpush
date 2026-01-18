-- Device Linking Database Migration
-- Adds missing columns for subscription device linking functionality
-- Run this on your production database

-- Explicitly specify database for all operations
SET @db_name = 'itsxtrapush_db';

-- 1. Add missing subscription columns to users table
ALTER TABLE `itsxtrapush_db`.`users` 
ADD COLUMN IF NOT EXISTS subscription_payment_gateway VARCHAR(50) DEFAULT 'square' COMMENT 'Payment gateway used (square or paychangu)' AFTER subscription_tier,
ADD COLUMN IF NOT EXISTS subscription_start_date DATETIME DEFAULT NULL COMMENT 'When subscription started' AFTER subscription_payment_gateway,
ADD COLUMN IF NOT EXISTS subscription_end_date DATETIME DEFAULT NULL COMMENT 'When subscription ends (if cancelled)' AFTER subscription_start_date,
ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE DEFAULT NULL COMMENT 'Next renewal date' AFTER subscription_end_date,
ADD COLUMN IF NOT EXISTS subscription_grace_period_end DATETIME DEFAULT NULL COMMENT 'Grace period end date for failed payments' AFTER subscription_renewal_date,
ADD COLUMN IF NOT EXISTS subscription_pending_tx_ref VARCHAR(255) DEFAULT NULL COMMENT 'Pending transaction reference' AFTER subscription_grace_period_end,
ADD COLUMN IF NOT EXISTS last_renewal_reminder_sent DATETIME DEFAULT NULL COMMENT 'Track when last renewal reminder was sent' AFTER subscription_pending_tx_ref,
ADD COLUMN IF NOT EXISTS subscription_linked_device_id INT DEFAULT NULL COMMENT 'ID of device linked to subscription' AFTER last_renewal_reminder_sent,
ADD COLUMN IF NOT EXISTS subscription_linked_device_name VARCHAR(255) DEFAULT NULL COMMENT 'Name of device linked to subscription' AFTER subscription_linked_device_id,
ADD COLUMN IF NOT EXISTS subscription_device_linked_date TIMESTAMP NULL DEFAULT NULL COMMENT 'When device was linked' AFTER subscription_linked_device_name,
ADD COLUMN IF NOT EXISTS subscription_device_linked_by ENUM('AUTO_CHECKOUT','AUTO_RECENT','MANUAL') DEFAULT 'MANUAL' COMMENT 'How device was linked' AFTER subscription_device_linked_date;

-- 2. Add missing indexes for better performance
ALTER TABLE `itsxtrapush_db`.`users` 
ADD INDEX IF NOT EXISTS idx_subscription_renewal_date (subscription_renewal_date),
ADD INDEX IF NOT EXISTS idx_subscription_grace_period (subscription_grace_period_end),
ADD INDEX IF NOT EXISTS idx_subscription_linked_device (subscription_linked_device_id),
ADD INDEX IF NOT EXISTS idx_subscription_payment_gateway (subscription_payment_gateway);

-- 3. Update existing active subscriptions with default values
UPDATE `itsxtrapush_db`.`users` 
SET subscription_payment_gateway = 'square',
    subscription_renewal_date = DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)
WHERE subscription_active = 1 
AND subscription_payment_gateway IS NULL;

-- 4. Verify the migration was successful
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE 'subscription_%'
ORDER BY COLUMN_NAME;

-- 5. Show indexes on users table
SHOW INDEX FROM `itsxtrapush_db`.`users`;

SELECT 'Device linking migration completed successfully!' as status_message;