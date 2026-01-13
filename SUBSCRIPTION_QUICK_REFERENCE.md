# Subscription Renewal System - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### Step 1: Database Migration
```bash
mysql -u xuser -p itsxtrapush_db < sparkle-pro-api/migrations/005_subscription_renewal_system.sql
```

### Step 2: Generate Token & Setup Cron
```bash
# Option A: Automatic (Recommended)
cd sparkle-pro-api
bash setup_renewal_system.sh

# Option B: Manual
export CRON_TOKEN=$(openssl rand -base64 32)
crontab -e
# Add: */5 * * * * curl -s -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN" >> /var/log/subscription_renewal.log 2>&1
```

### Step 3: Test
```bash
curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"
# Expected: {"success": true, "data": {...}}
```

---

## 📋 Subscription Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `ACTIVE` | Subscription is valid | User can use benefits |
| `PENDING_PAYMENT` | Payment due, in grace period | Send invoice, offer payment |
| `SUSPENDED` | Grace period expired, unpaid | Disable benefits, offer reactivation |
| `CANCELED` | User canceled subscription | No benefits available |

---

## ⏰ Renewal Timeline

### Square (Automatic)
```
Day -1: Reminder email sent
Day  0: [Renewal Date] Auto-charged by Square
       Renewal date updated to +30 days
       Confirmation email sent
Day +30: Next renewal date
```

### Paychangu (Manual + Grace)
```
Day -5: Reminder email sent ("Renews in 5 days")
Day -1: Reminder email sent ("Renews tomorrow")
Day  0: [Renewal Date] Grace period starts
       Invoice email sent with payment link
       subscription_status = PENDING_PAYMENT
       grace_period_end = today + 7 days
Day +7: [Grace Expires] Account suspended if unpaid
       subscription_active = 0
       subscription_status = SUSPENDED
       Suspension email sent
```

---

## 🔧 Key Configuration

### Change Grace Period
Edit: `sparkle-pro-api/subscription_renewal_manager.php`
```php
const GRACE_PERIOD_DAYS = 7;  // ← Change this
```

### Change Reminder Timing
Edit: `sparkle-pro-api/subscription_renewal_manager.php`
```php
const REMINDER_DAYS_BEFORE = [5, 1];  // ← Change this
```

### Change Subscription Amounts
Edit: `sparkle-pro-api/subscription_renewal_manager.php`
```php
$amounts = [
    'plus' => 99,      // ← Change this
    'premium' => 199   // ← Change this
];
```

---

## 📊 Monitoring Queries

### Check Cron Status
```sql
SELECT * FROM subscription_cron_logs 
ORDER BY created_at DESC LIMIT 5;
```

### Check for Errors
```sql
SELECT * FROM subscription_cron_logs 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

### Check Grace Period Subscriptions
```sql
SELECT email, subscription_grace_period_end, 
       DATEDIFF(subscription_grace_period_end, NOW()) as days_left
FROM users 
WHERE subscription_grace_period_end > NOW()
ORDER BY subscription_grace_period_end;
```

### Check Upcoming Renewals
```sql
SELECT email, subscription_tier, subscription_renewal_date 
FROM users 
WHERE subscription_renewal_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY subscription_renewal_date;
```

### Check Suspended Subscriptions
```sql
SELECT COUNT(*) as suspended_count FROM users 
WHERE subscription_status = 'SUSPENDED';
```

### View Subscription Events (Last 24 hours)
```sql
SELECT u.email, sh.event_type, sh.notes, sh.created_at
FROM subscription_history sh
JOIN users u ON sh.user_id = u.id
WHERE sh.created_at > NOW() - INTERVAL 24 HOUR
ORDER BY sh.created_at DESC;
```

---

## 🆘 Common Issues & Quick Fixes

### Issue: Cron not running
**Check:**
```bash
crontab -l | grep subscription
ps aux | grep cron
curl -X GET "https://domain.com/gadgets/payments/subscriptions/process-renewals?token=TOKEN"
```

### Issue: Emails not sending
**Check:**
```bash
tail -20 /var/log/mail.log | grep test@
php -i | grep sendmail_path
```

### Issue: Token authentication fails
**Fix:**
```bash
# Regenerate token
NEW_TOKEN=$(openssl rand -base64 32)
export CRON_SECRET_TOKEN="$NEW_TOKEN"
echo "New token: $NEW_TOKEN"

# Update crontab with new token
crontab -e
```

### Issue: Subscriptions not renewing
**Check:**
```sql
-- Verify renewal dates are set
SELECT COUNT(*) FROM users 
WHERE subscription_active = 1 AND subscription_renewal_date IS NULL;

-- Check if date is in past
SELECT email, subscription_renewal_date FROM users
WHERE subscription_renewal_date <= CURDATE()
AND subscription_active = 1;
```

---

## 🔐 Security Best Practices

✅ **DO:**
- Use strong random tokens (32+ bytes)
- Store tokens in environment variables only
- Rotate tokens every 90 days
- Monitor cron logs for unauthorized attempts
- Use HTTPS for all cron URLs
- Keep tokens out of version control

❌ **DON'T:**
- Hardcode tokens in scripts
- Share tokens in emails or messages
- Use predictable/weak tokens
- Commit tokens to git
- Use HTTP for cron endpoints
- Reuse old tokens

---

## 📞 Support Workflow

### User Can't Access Benefits After Payment
```sql
-- Check subscription status
SELECT email, subscription_status, subscription_active FROM users 
WHERE email = 'user@example.com';

-- If suspended, reactivate:
UPDATE users 
SET subscription_status = 'ACTIVE',
    subscription_active = 1,
    subscription_grace_period_end = NULL
WHERE email = 'user@example.com';
```

### Manual Renewal Needed
```sql
-- Update renewal date to process immediately
UPDATE users 
SET subscription_renewal_date = CURDATE()
WHERE email = 'user@example.com';

-- Then manually trigger cron or wait for next run
```

### Check What Happened to Subscription
```sql
SELECT event_type, notes, details, created_at
FROM subscription_history 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
ORDER BY created_at DESC;
```

---

## 📱 Frontend Integration

### Display Renewal Info
```jsx
import { SubscriptionRenewalCard } from '@/components/SubscriptionRenewalCard';

// In your dashboard
<SubscriptionRenewalCard 
  subscription={userSubscription}
  onPaymentClick={handlePayment}
  onReactivateClick={handleReactivate}
/>
```

### Show Suspension Alert
```jsx
{subscription.subscription_status === 'SUSPENDED' && (
  <Alert variant="destructive">
    Your subscription is suspended. 
    <Button onClick={() => reactivate()}>Reactivate Now</Button>
  </Alert>
)}
```

---

## 📈 Key Metrics

Track these metrics for system health:

```sql
-- Monthly renewal revenue
SELECT 
    DATE_TRUNC(created_at, MONTH) as month,
    COUNT(*) as renewals,
    SUM(CASE WHEN event_type = 'renewal_processed' THEN 1 ELSE 0 END) as successful
FROM subscription_history
WHERE event_type IN ('renewal_processed', 'renewal_initiated')
GROUP BY month;

-- Churn rate (suspended subscriptions)
SELECT 
    COUNT(*) as suspended_count,
    ROUND(COUNT(*) * 100.0 / (
        SELECT COUNT(*) FROM users WHERE subscription_active = 1
    ), 2) as churn_percentage
FROM users
WHERE subscription_status = 'SUSPENDED';

-- Grace period effectiveness
SELECT 
    ROUND(SUM(CASE WHEN new_status = 'ACTIVE' THEN 1 ELSE 0 END) * 100.0 / 
          COUNT(*), 2) as grace_recovery_rate
FROM subscription_history
WHERE event_type = 'renewal_initiated';
```

---

## 🎯 Deployment Checklist

- [ ] Migration run successfully
- [ ] Token generated and stored
- [ ] Cron job added and tested
- [ ] Endpoint responds to manual curl
- [ ] Emails configured
- [ ] Test subscription created
- [ ] Renewal processed
- [ ] Reminders sent
- [ ] Grace period tested
- [ ] Suspension tested
- [ ] Frontend component integrated
- [ ] Monitoring queries set up
- [ ] Logs monitored
- [ ] Team trained
- [ ] Production deployment approved

---

## 📚 Full Documentation

- **Main Guide**: `SUBSCRIPTION_RENEWAL_SYSTEM.md`
- **Deployment**: `SUBSCRIPTION_DEPLOYMENT_GUIDE.md`
- **Testing**: `SUBSCRIPTION_TESTING_GUIDE.md`
- **Implementation Summary**: `SUBSCRIPTION_SYSTEM_IMPLEMENTATION_SUMMARY.md`

---

## 🆘 Emergency Contacts

**System Issues**: Check `subscription_cron_logs` table
**Email Issues**: Check `/var/log/mail.log`
**Database Issues**: Check `/var/log/mysql/error.log`
**Server Issues**: Check `/var/log/apache2/error.log` or `/var/log/nginx/error.log`

---

**System Status**: ✅ Production Ready
**Last Updated**: January 2025
**Build Status**: ✅ No errors

---

## Quick Test

```bash
# Full integration test in 30 seconds:
echo "1. Creating test subscription..."
mysql -u xuser -p itsxtrapush_db -e "
INSERT INTO users (email, uid, subscription_active, subscription_status, 
                   subscription_tier, subscription_payment_gateway, 
                   subscription_renewal_date, subscription_start_date)
VALUES ('quick-test@example.com', 'test-uid-123', 1, 'ACTIVE', 'plus', 
        'square', CURDATE(), DATE_SUB(CURDATE(), INTERVAL 30 DAY));
"

echo "2. Running renewal processor..."
curl -s -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"

echo "3. Checking results..."
mysql -u xuser -p itsxtrapush_db -e "
SELECT email, subscription_renewal_date FROM users 
WHERE email = 'quick-test@example.com';
"

echo "✅ Test complete!"
```

---

**Ready to deploy!** 🚀
