-- SQL Script to diagnose and fix subscription renewal dates
-- Run this on your database to check current subscription status

-- 1. First, check what subscriptions exist and their current renewal dates
SELECT 
    id,
    email,
    subscription_tier,
    subscription_payment_gateway,
    subscription_status,
    subscription_active,
    subscription_renewal_date,
    subscription_start_date,
    subscription_grace_period_end,
    COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)) as calculated_renewal_date,
    DATEDIFF(COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)), CURDATE()) as days_until_renewal,
    CASE 
        WHEN DATEDIFF(COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)), CURDATE()) <= 0 THEN 'DUE'
        ELSE 'FUTURE'
    END as renewal_status
FROM users
WHERE subscription_active = 1 OR subscription_status = 'ACTIVE'
ORDER BY calculated_renewal_date ASC;

-- 2. Check specifically which subscriptions the cron thinks are due
SELECT 
    id, 
    email,
    subscription_renewal_date,
    COALESCE(subscription_renewal_date, DATE_ADD(subscription_start_date, INTERVAL 1 MONTH)) as calculated_renewal_date
FROM users
WHERE (subscription_active = 1 OR subscription_status = 'ACTIVE')
AND subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
AND (subscription_grace_period_end IS NULL OR subscription_grace_period_end > NOW())
AND (
    subscription_renewal_date <= CURDATE() 
    OR (subscription_renewal_date IS NULL AND DATE_ADD(subscription_start_date, INTERVAL 1 MONTH) <= CURDATE())
);

-- 3. To test the renewal system, you can temporarily set a subscription to renew today:
-- UPDATE users 
-- SET subscription_renewal_date = CURDATE()
-- WHERE email = 'test@example.com';  -- Replace with actual email

-- 4. Alternative: Set renewal date to yesterday to force immediate processing
-- UPDATE users 
-- SET subscription_renewal_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
-- WHERE email = 'test@example.com';  -- Replace with actual email

-- 5. Check the subscription history to see past renewal events
SELECT * FROM subscription_history 
ORDER BY created_at DESC 
LIMIT 10;