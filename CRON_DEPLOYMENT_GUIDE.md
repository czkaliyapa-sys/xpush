# Subscription Renewal Manager - Setup & Deployment Guide

## Overview

The `subscription_renewal_manager.php` is a production-ready cron job system that handles recurring subscription management across both payment gateways:

- **Square**: Automatic monthly charges via native API
- **PayChangu**: Manual billing with automated reminders and grace periods

## Key Features

✅ **Dual Gateway Support** - Handles both Square (auto-renew) and PayChangu (manual)  
✅ **Grace Period Management** - 7-day grace period for failed PayChangu payments  
✅ **Automated Reminders** - Sends notifications 5 days and 1 day before renewal  
✅ **Account Suspension** - Automatically suspends accounts after grace period expires  
✅ **Event Logging** - Records all subscription events to `subscription_history` table  
✅ **Email Notifications** - Professional HTML emails for all scenarios  
✅ **Dual Execution** - Runs via CLI cron or HTTP endpoint with token auth  

## Installation

### 1. Apply Database Migration

Run the migration to create required tables and schema:

```bash
mysql -u root -p itsxtrapush_db < /path/to/sparkle-pro-api/migrations/2026-01-10_subscription_renewal_schema.sql
```

This creates:
- `subscription_history` - Event logging
- `subscription_cron_logs` - Cron execution monitoring
- `subscription_payments` - Payment tracking
- Adds columns to `users` table for grace periods

### 2. Configure Cron Job

#### Option A: Linux/Unix Cron (Recommended)

Add to your crontab:

```bash
crontab -e
```

Add this line to run every 5 minutes:

```cron
*/5 * * * * php /path/to/sparkle-pro-api/cron-subscription-renewals.php >> /var/log/subscription-cron.log 2>&1
```

Or run every 30 minutes (less frequent):

```cron
*/30 * * * * php /path/to/sparkle-pro-api/cron-subscription-renewals.php >> /var/log/subscription-cron.log 2>&1
```

#### Option B: HTTP Endpoint (For Hosted Servers)

If you can't access cron, set up an external service to call:

```bash
curl -s "https://yourdomain.com/sparkle-pro-api/cron-subscription-renewals.php?token=YOUR_SECRET_TOKEN"
```

Then schedule with services like:
- [AWS CloudWatch Events](https://aws.amazon.com/blogs/aws/new-cloudwatch-events-managed-rules/)
- [Google Cloud Scheduler](https://cloud.google.com/scheduler)
- [EasyCron](https://www.easycron.com/)

### 3. Environment Configuration

Set these environment variables or update in code:

```bash
export DB_HOST="localhost"
export DB_NAME="itsxtrapush_db"
export DB_USER="xuser"
export DB_PASS="Xpush2025?"
export CRON_SECRET_TOKEN="your-very-secret-token-here"
export PAYCHANGU_SECRET_KEY="your-paychangu-secret"
```

### 4. Email Configuration

Update email domain in `sendRenewalEmail()` method:

```php
// Line ~380 in cron-subscription-renewals.php
'redirect_url' => 'https://yourdomain.com/subscription/payment-success',
'failure_url' => 'https://yourdomain.com/subscription/payment-failed',
```

## How It Works

### Renewal Flow

```
Every 5 minutes:
  1. Check for subscriptions with renewal_date <= today
  2. For Square: Verify charge and update renewal_date
  3. For PayChangu: Set grace period and send payment invoice
  4. Send reminder emails (5 days and 1 day before)
  5. Check for expired grace periods and suspend accounts
  6. Log all events to subscription_history
```

### Grace Period Behavior (PayChangu)

```
Day 0: Renewal date arrives
       → Invoice sent with 7-day grace period
       
Day 1-7: Grace period active
         → Reminders sent at days 1 and 6
         → User can still pay with "reactivate" link
         
Day 8: Grace period expires
       → Subscription suspended automatically
       → Suspension notification sent
       → Device coverage lost
```

### Square Auto-Renewal

```
- Charge processed automatically by Square
- Renewal date updated upon success
- Confirmation email sent
- No grace period needed (automatic)
```

## Database Schema

### subscription_history Table

Tracks all subscription events:

```sql
+-------------+--------------+------------------+
| id          | INT          | Auto-increment   |
| user_id     | INT          | References users |
| event_type  | VARCHAR(100) | renewal_*, suspended, etc |
| details     | JSON         | Event data       |
| created_at  | TIMESTAMP    | When event occurred |
+-------------+--------------+------------------+
```

**Event Types Logged:**
- `renewal_initiated` - PayChangu renewal started with invoice
- `renewal_processed` - Square charge confirmed
- `renewal_failed` - Payment attempt failed
- `subscription_suspended` - Grace period expired, account suspended
- `reminder_sent` - Reminder email sent

### subscription_cron_logs Table

Monitors cron execution:

```sql
+----------------+-----------+---------------------+
| id             | INT       | Auto-increment      |
| status         | VARCHAR   | 'success' or 'error'|
| message        | TEXT      | Details/error msg   |
| execution_time | TIMESTAMP | When cron ran       |
+----------------+-----------+---------------------+
```

## Email Templates

The system sends 5 types of emails:

### 1. Renewal Reminder (5 days, 1 day before)

Sent 5 days and 1 day before renewal date.

```
Subject: Your subscription renews in X days
Body: Informs user of upcoming renewal, shows gateway
```

### 2. Renewal Success (Square)

Sent immediately after Square charge succeeds.

```
Subject: Your subscription has been renewed
Body: Confirmation with new renewal date
```

### 3. Renewal Invoice (PayChangu)

Sent when renewal initiated, requires manual payment.

```
Subject: Action Required: Subscription Renewal Payment
Body: Payment amount, reference, grace period (7 days), pay now link
```

### 4. Subscription Suspended

Sent when grace period expires without payment.

```
Subject: Your subscription has been suspended
Body: Reason, reactivation link, contact support
```

## Testing

### Test Cron Execution

```bash
# Run cron manually (CLI)
php /path/to/sparkle-pro-api/cron-subscription-renewals.php

# Expected output (JSON):
# {"status":"success","message":"Renewal processing completed"}
```

### Test HTTP Endpoint

```bash
# Test with curl
curl -s "http://localhost/sparkle-pro-api/cron-subscription-renewals.php?token=your-secret-token" | jq

# Expected response:
# {
#   "status": "success",
#   "message": "Renewal processing completed"
# }
```

### Check Logs

```bash
# View cron execution logs
tail -f /var/log/subscription-cron.log

# Check PHP error logs
tail -f /var/log/php-error.log

# Query database logs
mysql -u root -p itsxtrapush_db -e "SELECT * FROM subscription_cron_logs ORDER BY created_at DESC LIMIT 10;"

# Check subscription events
mysql -u root -p itsxtrapush_db -e "SELECT * FROM subscription_history WHERE user_id = 123 ORDER BY created_at DESC;"
```

## Configuration Constants

Edit these in the `SubscriptionRenewalManager` class:

```php
const GRACE_PERIOD_DAYS = 7;              // Days to pay for PayChangu
const REMINDER_DAYS_BEFORE = [5, 1];      // Send reminders at these intervals
const RETRY_ATTEMPTS_MAX = 3;             // Max retry attempts for failed charges
const RETRY_INTERVAL_DAYS = 2;            // Days between retry attempts
```

## Monitoring & Troubleshooting

### Common Issues

**1. Cron not running**
```bash
# Check if cron service is active
sudo service cron status

# Verify cron job was added
crontab -l

# Check cron logs
sudo tail -f /var/log/syslog | grep CRON
```

**2. Emails not sending**
```bash
# Verify mail() function is enabled in PHP
php -i | grep -i "mail"

# Check mail logs
sudo tail -f /var/log/mail.log

# Test mail function
php -r "mail('test@example.com', 'Test', 'Test body');"
```

**3. Database connection errors**
```bash
# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"

# Verify tables exist
mysql -u root -p itsxtrapush_db -e "SHOW TABLES;"

# Test credentials
mysql -h localhost -u xuser -p"Xpush2025?" itsxtrapush_db -e "SELECT 1;"
```

### Performance Optimization

For large subscriber bases, consider:

1. **Increase cron frequency** - Run every 5 minutes instead of 30
2. **Add database indexes** - Already included in migration
3. **Batch email sending** - Queue emails via background job
4. **Use transaction logs** - Review subscription_cron_logs for execution time

## Integration with Backend

### Subscription Status Endpoints

The cron works with these existing endpoints:

- `POST /subscriptions/create` - Creates subscription
- `GET /subscriptions/status` - Gets user status
- `POST /subscriptions/cancel` - Cancels subscription

The cron automatically manages:
- Renewal date updates
- Grace period handling
- Status changes (ACTIVE → SUSPENDED)
- Event history

## Production Deployment Checklist

- [ ] Database migration applied (`subscription_renewal_schema.sql`)
- [ ] Cron job added to crontab or external scheduler
- [ ] Environment variables configured (DB, email, tokens)
- [ ] Email templates updated with correct domain
- [ ] Log files configured and monitored
- [ ] Test cron runs successfully
- [ ] Verify emails send correctly
- [ ] Check subscription_cron_logs table for successful executions
- [ ] Monitor for 24 hours for any issues
- [ ] Set up alerts for failed executions

## Support

For issues or questions:
1. Check logs: `/var/log/subscription-cron.log`
2. Query events: `SELECT * FROM subscription_cron_logs ORDER BY created_at DESC LIMIT 20;`
3. Review subscription history: `SELECT * FROM subscription_history WHERE user_id = X;`
4. Check PHP error logs for exceptions

---

**Version**: 1.0  
**Last Updated**: 2026-01-10  
**Status**: Production Ready
