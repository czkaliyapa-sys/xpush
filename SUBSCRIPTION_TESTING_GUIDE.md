# Subscription Renewal System - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Subscription Renewal System before production deployment.

## Prerequisites

- Test database with sample users
- Test email account for monitoring
- cURL or Postman for API testing
- Database client (MySQL Workbench, DBeaver, or CLI)

---

## Unit Tests

### Test 1: Database Migration

**Objective:** Verify all required fields and tables are created

```sql
-- Run this in MySQL to verify migration
USE itsxtrapush_db;

-- 1. Check new fields exist on users table
SHOW COLUMNS FROM users LIKE 'subscription_%';

-- Expected output:
-- subscription_payment_gateway
-- subscription_renewal_date
-- subscription_grace_period_end
-- last_renewal_reminder_sent

-- 2. Verify subscription_history table
DESCRIBE subscription_history;

-- Expected columns:
-- id, user_id, uid, subscription_id, event_type, old_status, new_status, 
-- details, notes, created_at

-- 3. Verify subscription_cron_logs table
DESCRIBE subscription_cron_logs;

-- Expected columns:
-- id, status, message, execution_time, created_at

-- 4. Check indexes were created
SHOW INDEXES FROM users WHERE Key_name LIKE '%subscription%';

-- 5. Verify default values and constraints
ALTER TABLE users MODIFY subscription_active DEFAULT 0;
```

**Pass Criteria:** All 4 checks show expected results ✓

---

## Integration Tests

### Test 2: Token Authentication

**Objective:** Verify cron token validation works correctly

**Setup:**
```bash
# Set test token
export CRON_TOKEN="test-token-12345"
export TEST_URL="https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals"
```

**Test Cases:**

```bash
# Test 2.1: Valid token
curl -X GET "$TEST_URL?token=$CRON_TOKEN"
# Expected: 200 OK with JSON response

# Test 2.2: Missing token
curl -X GET "$TEST_URL"
# Expected: 401 Unauthorized

# Test 2.3: Invalid token
curl -X GET "$TEST_URL?token=wrong-token"
# Expected: 401 Unauthorized

# Test 2.4: Empty token
curl -X GET "$TEST_URL?token="
# Expected: 401 Unauthorized
```

**Pass Criteria:** All 4 test cases return expected HTTP status codes ✓

---

### Test 3: Subscription Status Updates

**Objective:** Verify subscriptions update correctly based on renewal date

**Setup:**
```sql
-- Create test users with Square (GBP) subscriptions
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'test-square@example.com',
    'test-square-uid',
    'GB',
    1,
    'ACTIVE',
    'plus',
    'square',
    'sub_123456',
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    CURDATE()  -- Due today!
);

-- Create test user with Paychangu (MWK) subscription
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'test-paychangu@example.com',
    'test-paychangu-uid',
    'MW',
    1,
    'ACTIVE',
    'premium',
    'paychangu',
    'paychangu_ref_123',
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    CURDATE()  -- Due today!
);

-- Verify test users exist
SELECT id, email, subscription_payment_gateway, subscription_renewal_date 
FROM users 
WHERE email LIKE 'test-%@example.com';
```

**Test Execution:**

```bash
# Trigger renewal processing
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```

**Verification:**

```sql
-- Check Square user renewal was processed
SELECT 
    email, 
    subscription_status, 
    subscription_renewal_date,
    subscription_grace_period_end
FROM users 
WHERE email = 'test-square@example.com';

-- Expected:
-- email: test-square@example.com
-- subscription_status: ACTIVE
-- subscription_renewal_date: 2025-02-08 (today + 1 month)
-- subscription_grace_period_end: NULL

-- Check Paychangu user grace period was set
SELECT 
    email, 
    subscription_status, 
    subscription_renewal_date,
    subscription_grace_period_end
FROM users 
WHERE email = 'test-paychangu@example.com';

-- Expected:
-- email: test-paychangu@example.com
-- subscription_status: ACTIVE
-- subscription_renewal_date: 2025-02-08 (today + 1 month)
-- subscription_grace_period_end: 2025-01-15 (today + 7 days)

-- Verify events logged in subscription_history
SELECT * FROM subscription_history 
WHERE user_id = (SELECT id FROM users WHERE email = 'test-square@example.com')
ORDER BY created_at DESC;

-- Expected event types:
-- renewal_processed (for Square)
-- renewal_initiated (for Paychangu)
```

**Pass Criteria:** 
- Square renewal date updated to today + 1 month ✓
- Paychangu grace period set to today + 7 days ✓
- Events logged to subscription_history ✓

---

### Test 4: Reminder Notifications

**Objective:** Verify reminders are sent 5 days and 1 day before renewal

**Setup:**
```sql
-- Create test user with renewal in 5 days
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'test-reminder-5d@example.com',
    'test-reminder-5d-uid',
    'GB',
    1,
    'ACTIVE',
    'plus',
    'square',
    'sub_reminder_5d',
    DATE_SUB(NOW(), INTERVAL 25 DAY),
    DATE_ADD(CURDATE(), INTERVAL 5 DAY)  -- 5 days away
);

-- Create test user with renewal in 1 day
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'test-reminder-1d@example.com',
    'test-reminder-1d-uid',
    'GB',
    1,
    'ACTIVE',
    'premium',
    'square',
    'sub_reminder_1d',
    DATE_SUB(NOW(), INTERVAL 29 DAY),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY)  -- Tomorrow
);

SELECT email, subscription_renewal_date FROM users WHERE email LIKE 'test-reminder%';
```

**Test Execution:**

```bash
# Trigger renewal processing (should send reminders)
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```

**Verification:**

```sql
-- Check reminder emails were marked as sent
SELECT 
    email, 
    subscription_renewal_date,
    last_renewal_reminder_sent
FROM users 
WHERE email LIKE 'test-reminder%'
ORDER BY email;

-- Expected:
-- Both users should have last_renewal_reminder_sent = NOW()

-- Verify email sent logs (if you have email logging)
-- Check /var/log/mail.log for sent emails to test addresses
tail -20 /var/log/mail.log | grep test-reminder

-- Check subscription_cron_logs result
SELECT message FROM subscription_cron_logs 
WHERE created_at > NOW() - INTERVAL 5 MINUTE
ORDER BY created_at DESC LIMIT 1;

-- Should contain: "reminders_sent": 2
```

**Pass Criteria:**
- Users marked as having reminder sent ✓
- Emails received in test inbox ✓
- Log shows correct reminder count ✓

---

### Test 5: Grace Period & Suspension

**Objective:** Verify subscriptions suspend after grace period expires

**Setup:**
```sql
-- Create user with expired grace period
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date,
    subscription_grace_period_end
) VALUES 
(
    'test-suspend@example.com',
    'test-suspend-uid',
    'MW',
    1,
    'PENDING_PAYMENT',
    'plus',
    'paychangu',
    'paychangu_suspend_test',
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY),  -- Renewal was 5 days ago
    DATE_SUB(NOW(), INTERVAL 1 HOUR)  -- Grace period expired 1 hour ago
);

SELECT id, email, subscription_status, subscription_grace_period_end FROM users WHERE email = 'test-suspend@example.com';
```

**Test Execution:**

```bash
# Trigger renewal processing (should suspend the account)
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```

**Verification:**

```sql
-- Check user subscription status
SELECT 
    email, 
    subscription_status,
    subscription_active,
    subscription_grace_period_end
FROM users 
WHERE email = 'test-suspend@example.com';

-- Expected:
-- subscription_status: SUSPENDED
-- subscription_active: 0
-- subscription_grace_period_end: NULL

-- Check suspension event in history
SELECT event_type, notes FROM subscription_history 
WHERE user_id = (SELECT id FROM users WHERE email = 'test-suspend@example.com')
ORDER BY created_at DESC LIMIT 1;

-- Expected event_type: subscription_suspended
```

**Pass Criteria:**
- Subscription status changed to SUSPENDED ✓
- subscription_active set to 0 ✓
- Suspension event logged ✓
- Suspension notification email received ✓

---

### Test 6: Email Delivery

**Objective:** Verify all email types are sent correctly

**Test Recipients:**
```
- test-renewal-reminder@example.com
- test-renewal-invoice@example.com
- test-suspension@example.com
- test-renewal-success@example.com
```

**Test Cases:**

**6.1: Renewal Reminder Email**
- Trigger: 5 days before renewal
- Content should include:
  - Days until renewal
  - Renewal date
  - Payment gateway info
  - Link to dashboard

**6.2: Renewal Invoice Email**
- Trigger: Renewal date for Paychangu users
- Content should include:
  - Amount due
  - Currency
  - Payment reference
  - Grace period information
  - Payment link

**6.3: Renewal Success Email**
- Trigger: Renewal processed successfully
- Content should include:
  - Confirmation message
  - New renewal date
  - Payment gateway info

**6.4: Suspension Email**
- Trigger: Grace period expired
- Content should include:
  - Suspension notice
  - Suspension date
  - Reactivation link
  - List of suspended benefits

**Verification:**

```bash
# Check email logs
tail -50 /var/log/mail.log | grep "test-renewal"

# Check email headers
# Subject should be appropriate for each type
# From should be noreply@itsxtrapush.com
# Content-Type should be text/html

# Check mail queue (if backed up)
mailq | grep test-renewal
```

**Pass Criteria:**
- All 4 email types received ✓
- Emails contain expected content ✓
- Emails formatted properly (HTML) ✓
- No bounces or delays ✓

---

### Test 7: Cron Execution Logging

**Objective:** Verify cron execution is properly logged

**Test Execution:**

```bash
# Trigger multiple times
for i in {1..3}; do
  curl -s -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
  echo "Run $i completed"
  sleep 5
done
```

**Verification:**

```sql
-- Check execution logs
SELECT 
    id,
    status,
    message,
    created_at,
    TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
FROM subscription_cron_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Expected output:
-- Multiple rows with status='success'
-- Message should be JSON with renewals_processed, reminders_sent, suspensions, errors

-- Check for any errors
SELECT * FROM subscription_cron_logs 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 5;

-- Should be empty if tests passed

-- Verify log timestamps
SELECT COUNT(*) as total_logs, 
       MAX(created_at) as most_recent
FROM subscription_cron_logs 
WHERE created_at > NOW() - INTERVAL 1 HOUR;
```

**Pass Criteria:**
- All executions logged successfully ✓
- Status shows as 'success' ✓
- No error entries ✓

---

## Scenario Tests

### Scenario 1: Complete Paychangu Flow

**Objective:** Test entire Paychangu lifecycle from creation to suspension

**Steps:**

1. Create subscription for user in Malawi (MW)
```sql
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'malawi-user@example.com',
    'malawi-uid-test',
    'MW',
    1,
    'ACTIVE',
    'plus',
    'paychangu',
    'pay_test_12345',
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    CURDATE()  -- Due today
);
```

2. Day 0: Run cron - should initiate renewal
```bash
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```
Verify: Grace period set, invoice email sent

3. Day 3: Run cron - should send reminder
Verify: Reminder email sent, grace period still active

4. Day 8: Update grace period to expired and run cron
```sql
UPDATE users 
SET subscription_grace_period_end = DATE_SUB(NOW(), INTERVAL 1 HOUR)
WHERE email = 'malawi-user@example.com';
```
```bash
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```
Verify: Subscription suspended, suspension email sent

5. Reactivate subscription
```sql
UPDATE users 
SET subscription_status = 'ACTIVE',
    subscription_active = 1,
    subscription_grace_period_end = NULL,
    subscription_renewal_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
WHERE email = 'malawi-user@example.com';
```
Verify: User can access benefits again

---

### Scenario 2: Complete Square Flow

**Objective:** Test entire Square lifecycle with automatic renewal

**Steps:**

1. Create subscription for international user (non-MW)
```sql
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
) VALUES 
(
    'uk-user@example.com',
    'uk-uid-test',
    'GB',
    1,
    'ACTIVE',
    'premium',
    'square',
    'sq_sub_12345',
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    CURDATE()  -- Due today
);
```

2. Day 0: Run cron - should process renewal automatically
```bash
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```
Verify: Renewal date updated to +30 days, success email sent

3. Day 30: Run cron - should process next renewal
Verify: Another renewal processed, next renewal date set

4. Cancel subscription
```sql
UPDATE users 
SET subscription_status = 'CANCELED',
    subscription_active = 0,
    subscription_end_date = NOW()
WHERE email = 'uk-user@example.com';
```
Verify: User can't access subscription benefits

---

## Performance Tests

### Test 8: Bulk Processing

**Objective:** Verify system handles large number of subscriptions

```sql
-- Create 100 test subscriptions
INSERT INTO users (
    email, uid, country_code, subscription_active, subscription_status,
    subscription_tier, subscription_payment_gateway, subscription_id,
    subscription_start_date, subscription_renewal_date
)
SELECT 
    CONCAT('bulk-test-', @counter := @counter + 1, '@example.com'),
    CONCAT('bulk-uid-', @counter),
    IF(@counter % 2 = 0, 'GB', 'MW'),
    1,
    'ACTIVE',
    IF(@counter % 2 = 0, 'plus', 'premium'),
    IF(@counter % 2 = 0, 'square', 'paychangu'),
    CONCAT('sub-bulk-', @counter),
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    CURDATE()
FROM (SELECT @counter := 0) t,
     (SELECT @rownum:=0) t2
LIMIT 100;
```

**Test Execution:**
```bash
# Measure execution time
time curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
```

**Verification:**
```sql
-- Check all processed
SELECT 
    subscription_payment_gateway,
    COUNT(*) as processed,
    MAX(subscription_updated_at) as last_updated
FROM users
WHERE email LIKE 'bulk-test%'
GROUP BY subscription_payment_gateway;

-- Check execution time
SELECT 
    execution_time,
    JSON_EXTRACT(message, '$.renewals_processed') as renewals
FROM subscription_cron_logs 
ORDER BY created_at DESC LIMIT 1;
```

**Pass Criteria:**
- All 100 subscriptions processed ✓
- Execution time < 30 seconds ✓
- No errors logged ✓

---

## Cleanup

**After testing, clean up test data:**

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE 'test-%@example.com' OR email LIKE 'bulk-test%';

-- Clean up test events
DELETE FROM subscription_history WHERE user_id NOT IN (SELECT id FROM users WHERE subscription_active IN (0,1));

-- Keep cron logs for review (at least 7 days)

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE email LIKE 'test-%';
-- Should return 0
```

---

## Sign-Off Checklist

Before deploying to production, verify:

- [ ] All unit tests passed ✓
- [ ] Token authentication working ✓
- [ ] Subscription updates correct ✓
- [ ] Reminder emails sending ✓
- [ ] Grace period enforcement working ✓
- [ ] Suspension logic correct ✓
- [ ] Email delivery verified ✓
- [ ] Logging functional ✓
- [ ] Paychangu scenario complete ✓
- [ ] Square scenario complete ✓
- [ ] Bulk processing performant ✓
- [ ] Test data cleaned up ✓
- [ ] Documentation reviewed ✓
- [ ] Team trained on system ✓
- [ ] Monitoring configured ✓

---

**Testing Completed:** _______________
**Tested By:** _______________
**Date:** _______________

---

For issues during testing, refer to the Troubleshooting section in SUBSCRIPTION_DEPLOYMENT_GUIDE.md
