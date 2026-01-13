-- Subscription Automation Database Migrations
-- Add required columns for subscription renewal system

-- Add columns to users table for subscription management
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_payment_gateway VARCHAR(50) DEFAULT 'square' AFTER subscription_status;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_grace_period_end DATETIME AFTER subscription_renewal_date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_pending_tx_ref VARCHAR(255) AFTER subscription_grace_period_end;

-- Create or update subscription_history table if not present
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_uid VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    amount_paid DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_uid (user_uid),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_created_at (created_at)
);

-- Verify indexes
CREATE INDEX IF NOT EXISTS idx_subscription_active ON users (subscription_active, subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_renewal ON users (subscription_renewal_date, subscription_active);

-- Migrate existing subscription data if needed
UPDATE users 
SET subscription_payment_gateway = 'square' 
WHERE subscription_payment_gateway IS NULL AND subscription_active = 1;

-- Display verification
SELECT 'Migration complete. Users table columns:' as Status;
SHOW COLUMNS FROM users LIKE 'subscription_%';
