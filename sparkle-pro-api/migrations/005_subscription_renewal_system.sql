-- Subscription Renewal System Migration
-- Adds fields and tables needed for background subscription renewal processing

-- 1. Add missing subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_payment_gateway VARCHAR(50) COMMENT 'square or paychangu' AFTER subscription_plan_id;

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE COMMENT 'Next renewal date (calculated as start_date + interval)' AFTER subscription_end_date;

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_grace_period_end DATETIME COMMENT 'Grace period end date for failed payments - if passed, suspend' AFTER subscription_renewal_date;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_renewal_reminder_sent DATETIME COMMENT 'Track when last renewal reminder was sent' AFTER subscription_grace_period_end;

-- Add index for faster renewal processing
ALTER TABLE users ADD INDEX idx_subscription_renewal (subscription_active, subscription_status, subscription_renewal_date);

ALTER TABLE users ADD INDEX idx_subscription_grace (subscription_grace_period_end, subscription_status);

-- 2. Ensure subscription_history table exists with all fields
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    uid VARCHAR(255) COMMENT 'Firebase UID',
    subscription_id VARCHAR(255) COMMENT 'Square or Paychangu subscription ID',
    event_type VARCHAR(100) COMMENT 'renewal_processed, renewal_initiated, renewal_reminder, subscription_suspended, etc.',
    old_status VARCHAR(50) COMMENT 'Previous status',
    new_status VARCHAR(50) COMMENT 'New status',
    details JSON COMMENT 'Additional event details as JSON',
    notes TEXT COMMENT 'Human-readable notes about the event',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_event_type (event_type)
);

-- 3. Create subscription cron logs table for monitoring
CREATE TABLE IF NOT EXISTS subscription_cron_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) COMMENT 'success or error',
    message TEXT COMMENT 'Log message or JSON results',
    execution_time FLOAT COMMENT 'Execution time in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 4. Set default gateway for existing subscriptions
-- Default all to 'square' initially (can be manually adjusted later)
UPDATE users 
SET subscription_payment_gateway = 'square'
WHERE subscription_active = 1 
  AND subscription_payment_gateway IS NULL;

-- If you have a country_code column and want to set Malawi users to Paychangu, uncomment:
-- UPDATE users 
-- SET subscription_payment_gateway = 'paychangu'
-- WHERE subscription_active = 1 
--   AND subscription_payment_gateway = 'square'
--   AND country_code = 'MW';

-- 5. Calculate initial renewal dates for existing active subscriptions
UPDATE users 
SET subscription_renewal_date = DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)
WHERE subscription_active = 1 
  AND subscription_renewal_date IS NULL
  AND subscription_start_date IS NOT NULL;

-- Verification queries
-- Check updated fields
SELECT COUNT(*) as total_users, 
       SUM(CASE WHEN subscription_payment_gateway IS NOT NULL THEN 1 ELSE 0 END) as users_with_gateway,
       SUM(CASE WHEN subscription_renewal_date IS NOT NULL THEN 1 ELSE 0 END) as users_with_renewal_date
FROM users 
WHERE subscription_active = 1;

-- Check if tables exist
SHOW TABLES LIKE 'subscription%';

-- All done!
-- Next steps:
-- 1. Set CRON_SECRET_TOKEN environment variable
-- 2. Set up cron job: */5 * * * * curl -X GET "https://yourdomain.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN"
-- 3. Monitor logs in subscription_cron_logs table
