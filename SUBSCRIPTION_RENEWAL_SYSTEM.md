# Subscription Renewal System Documentation

## Overview

The Subscription Renewal System is a background process that handles automatic subscription renewals across both payment gateways:

- **Square** (International/GBP): Automatic recurring subscriptions via Square's native API
- **Paychangu** (Malawi/MWK): Manual recurring billing with automated reminders and grace periods

The system runs continuously via cron job and handles:
1. ✅ Automatic renewals for Square subscriptions
2. 📧 Reminder notifications (5 days, 1 day before renewal)
3. 💳 Manual payment requests for Paychangu subscriptions
4. ⏳ Grace periods for failed/delayed payments (7 days by default)
5. 🚫 Account suspension after grace period expires
6. 📝 Full audit trail in subscription_history table

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│        Cron Job / HTTP Request (every 5 minutes)            │
│  GET /gadgets/payments/subscriptions/process-renewals       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ Check for due    │      │ Send Reminders   │
│ renewals         │      │ (5d, 1d before)  │
└────────┬─────────┘      └──────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
SQUARE    PAYCHANGU
    │          │
    ▼          ▼
AUTO-      MANUAL
CHARGE    (+ GRACE)
    │          │
    └────┬─────┘
         │
         ▼
┌──────────────────────────────┐
│ Suspension Check             │
│ (if grace period expired)    │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Log All Events               │
│ Send Status Notifications    │
└──────────────────────────────┘
```

## Database Schema

### New Fields on `users` table

```sql
subscription_payment_gateway VARCHAR(50)        -- 'square' or 'paychangu'
subscription_renewal_date DATE                  -- Next renewal date
subscription_grace_period_end DATETIME           -- Grace period expiration
last_renewal_reminder_sent DATETIME              -- Last reminder sent date
```

### New Table: `subscription_history`

Tracks all subscription events for audit trail:

```sql
id INT PRIMARY KEY
user_id INT
uid VARCHAR(255)                  -- Firebase UID
subscription_id VARCHAR(255)      -- Square or Paychangu ID
event_type VARCHAR(100)           -- renewal_processed, renewal_initiated, etc.
old_status VARCHAR(50)            -- Previous status
new_status VARCHAR(50)            -- New status
details JSON                      -- Event details as JSON
notes TEXT                        -- Human-readable notes
created_at TIMESTAMP
```

### New Table: `subscription_cron_logs`

Monitors cron execution health:

```sql
id INT PRIMARY KEY
status VARCHAR(50)                -- 'success' or 'error'
message TEXT                      -- Log message or JSON results
execution_time FLOAT              -- Execution time in seconds
created_at TIMESTAMP
```

## Setup Instructions

### 1. Database Migration

Run the migration to add all required fields and tables:

```bash
cd /path/to/sparkle-pro-api
mysql -u xuser -p itsxtrapush_db < migrations/005_subscription_renewal_system.sql
```

Or manually execute the SQL from `migrations/005_subscription_renewal_system.sql`

### 2. Environment Configuration

Set the cron job authentication token:

```bash
# Add to your .env file or server environment
export CRON_SECRET_TOKEN="your-very-secure-random-token-here"
```

Generate a secure token:

```bash
openssl rand -base64 32
# Example output: "aB3cD9eF2gH5iJ8kL0mN3oP6qR9sT2uV"
```

### 3. Setup Cron Job

#### Option A: Linux/Unix Server (Recommended)

Add to crontab:

```bash
# Run renewal processor every 5 minutes
*/5 * * * * curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_SECURE_TOKEN" > /dev/null 2>&1

# Or with logging:
*/5 * * * * curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_SECURE_TOKEN" >> /var/log/subscription_cron.log 2>&1
```

#### Option B: PHP CLI (Alternative)

```bash
*/5 * * * * cd /path/to/sparkle-pro-api && php subscription_renewal_manager.php >> /var/log/subscription_cron.log 2>&1
```

#### Option C: External Service (e.g., cron-job.org)

If your server doesn't support cron jobs, use an external service:

1. Visit https://cron-job.org or similar service
2. Create a job with URL: `https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals`
3. Add header: `Authorization: Bearer YOUR_SECURE_TOKEN`
4. Set interval: Every 5 minutes
5. Enable notifications for failures

### 4. Email Configuration

Ensure your server can send emails. The system uses PHP's `mail()` function by default.

For production, consider using PHPMailer (already in composer.json):

```php
// In send_renewal_email function, replace @mail() with:
$mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
$mailer->Host = 'smtp.gmail.com';
$mailer->SMTPAuth = true;
$mailer->Username = 'your-email@gmail.com';
$mailer->Password = 'your-app-password';
$mailer->setFrom('noreply@itsxtrapush.com');
$mailer->addAddress($email);
$mailer->Subject = $subject;
$mailer->Body = $html;
$mailer->isHTML(true);
$mailer->send();
```

## Subscription Lifecycle

### Square Subscriptions (Automatic)

```
User Creates Subscription (GBP)
        │
        ▼
subscription_status = 'ACTIVE'
subscription_active = 1
subscription_payment_gateway = 'square'
subscription_renewal_date = start_date + 1 month
        │
[Renewal Date Arrives]
        │
        ▼
Cron Job detects renewal_date <= today
        │
        ▼
Square auto-charges registered card
        │
        ▼
Update subscription_renewal_date = today + 1 month
Log event to subscription_history
Send confirmation email
        │
        ▼
Repeat every month automatically
```

### Paychangu Subscriptions (Manual with Grace Period)

```
User Creates Subscription (MWK)
        │
        ▼
subscription_status = 'ACTIVE'
subscription_active = 1
subscription_payment_gateway = 'paychangu'
subscription_renewal_date = start_date + 1 month
        │
[5 Days Before Renewal]
        │
        ▼
Cron sends reminder email: "Renewing in 5 days"
        │
[1 Day Before Renewal]
        │
        ▼
Cron sends reminder email: "Renewing tomorrow"
        │
[Renewal Date Arrives]
        │
        ▼
Cron detects renewal_date <= today
        │
        ▼
Set subscription_grace_period_end = today + 7 days
Send payment request email with invoice link
subscription_status = 'PENDING_PAYMENT' (optional)
Log event: 'renewal_initiated'
        │
[User Pays or Grace Period Expires]
        │
    ┌───┴────┐
    │        │
    ▼        ▼
User    Grace Period
Pays    Expires
    │        │
    ▼        ▼
Mark    Update subscription_status = 'SUSPENDED'
ACTIVE  subscription_active = 0
        Send suspension email
        Log event: 'subscription_suspended'
        │
        ▼
[User Reactivates]
        │
        ▼
Resume subscription (manual dashboard action)
Update subscription_status = 'ACTIVE'
subscription_active = 1
```

## Configurable Parameters

### Grace Period Duration

Located in `subscription_renewal_manager.php`:

```php
const GRACE_PERIOD_DAYS = 7;
```

Change to your desired number of days (3-14 recommended)

### Reminder Timing

Located in `subscription_renewal_manager.php`:

```php
const REMINDER_DAYS_BEFORE = [5, 1];  // Send reminders 5 days and 1 day before
```

Adjust array to send reminders at different intervals

### Subscription Amounts

Located in `subscription_renewal_manager.php`:

```php
$amounts = [
    'plus' => 99,      // MWK or GBP depending on context
    'premium' => 199
];
```

Update based on your pricing

## API Endpoints

### Process Renewals

**Endpoint:** `POST /gadgets/payments/subscriptions/process-renewals`

**Alternative:** `GET /gadgets/payments/subscriptions/process-renewals`

**Query Parameters:**
- `token` (required): Cron secret token

**Request:**
```bash
curl -X POST "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN"
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "renewals_processed": 15,
    "reminders_sent": 23,
    "suspensions": 2,
    "errors": []
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Monitoring & Troubleshooting

### Check Cron Execution Logs

```sql
-- Last 10 executions
SELECT * FROM subscription_cron_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed executions
SELECT * FROM subscription_cron_logs 
WHERE status = 'error'
ORDER BY created_at DESC;
```

### Monitor Subscription Events

```sql
-- All renewal events from last 7 days
SELECT u.email, sh.event_type, sh.details, sh.created_at
FROM subscription_history sh
JOIN users u ON sh.user_id = u.id
WHERE sh.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY sh.created_at DESC;

-- Suspended subscriptions
SELECT email, subscription_tier, subscription_updated_at
FROM users
WHERE subscription_status = 'SUSPENDED'
ORDER BY subscription_updated_at DESC;

-- Users in grace period
SELECT email, subscription_tier, subscription_grace_period_end
FROM users
WHERE subscription_grace_period_end IS NOT NULL
  AND subscription_grace_period_end > NOW()
ORDER BY subscription_grace_period_end;
```

### Check Email Delivery

```sql
-- Track reminder emails sent
SELECT u.email, u.last_renewal_reminder_sent
FROM users u
WHERE u.subscription_active = 1
  AND u.last_renewal_reminder_sent IS NOT NULL
ORDER BY u.last_renewal_reminder_sent DESC;
```

### Common Issues

**Issue:** Cron job not executing

**Solution:**
1. Verify token is correct: `echo $CRON_SECRET_TOKEN`
2. Test endpoint manually: `curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN"`
3. Check server error logs: `tail -f /var/log/apache2/error.log`
4. Verify cron syntax: `crontab -l`

**Issue:** Emails not sending

**Solution:**
1. Check mail configuration: `php -i | grep -i mail`
2. Enable logging in send_renewal_email function
3. Test email: `echo "test" | mail -s "Test" your-email@example.com`
4. Consider using PHPMailer with SMTP for reliability

**Issue:** Subscriptions not renewing

**Solution:**
1. Check subscription_renewal_date is set: `SELECT id, email, subscription_renewal_date FROM users WHERE subscription_active = 1;`
2. Verify gateway is set: `SELECT id, email, subscription_payment_gateway FROM users WHERE subscription_active = 1;`
3. Check Square API status for that subscription
4. Review subscription_history for any failed attempts
5. Manually trigger renewal: `curl -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN"`

## Frontend Integration

### Show Renewal Status

Add to subscription card in dashboard:

```jsx
import { useEffect, useState } from 'react';

export function SubscriptionCard({ subscription }) {
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(null);
  
  useEffect(() => {
    const renewalDate = new Date(subscription.subscription_renewal_date);
    const today = new Date();
    const days = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    setDaysUntilRenewal(days);
  }, [subscription]);
  
  return (
    <div className="subscription-card">
      <h3>{subscription.subscription_tier} Plan</h3>
      <p>Status: {subscription.subscription_status}</p>
      
      {subscription.subscription_grace_period_end && (
        <div className="alert alert-warning">
          ⚠️ Payment required by: {new Date(subscription.subscription_grace_period_end).toLocaleDateString()}
        </div>
      )}
      
      {daysUntilRenewal && daysUntilRenewal > 0 && (
        <p>Renews in {daysUntilRenewal} days</p>
      )}
      
      {subscription.subscription_status === 'SUSPENDED' && (
        <button onClick={() => reactivateSubscription()}>Reactivate</button>
      )}
    </div>
  );
}
```

### Handle Payment Link for Paychangu

```jsx
// In SubscriptionCard or payment page
async function processPayment() {
  const response = await fetch('/gadgets/payments/generate-invoice', {
    method: 'POST',
    body: JSON.stringify({
      userId: currentUser.id,
      tier: subscription.subscription_tier,
      amount: getTierAmount(subscription.subscription_tier),
      currency: 'MWK'
    })
  });
  
  const data = await response.json();
  window.location.href = data.paymentUrl; // Redirect to Paychangu
}
```

## Best Practices

1. **Token Security**: Use a strong, random token. Store in environment variables only. Never commit to git.

2. **Frequency**: Run cron every 5-10 minutes for timely processing. Don't run too frequently to avoid duplicate charges.

3. **Timezone**: Ensure server timezone is correct. Use UTC internally and convert for user display.

4. **Logging**: Monitor subscription_cron_logs regularly. Set up alerts for errors.

5. **Testing**:
   - Test with sandbox credentials first
   - Create test subscriptions with dates close to today
   - Verify emails are being sent
   - Check subscription_history for correct events

6. **Backup**: Regular database backups are critical for subscription data.

7. **Communication**: Always send reminders before charges/suspensions. Be transparent about grace periods.

## Support & Escalation

For issues with:

- **Square**: Review `subscription_history` for events, check Square dashboard for failed charges
- **Paychangu**: Verify payment gateway is responding, check recent payment requests
- **Email**: Enable detailed logging, test mail() function, consider SMTP
- **Database**: Check disk space, verify indexes are created, check slow query log

## Future Enhancements

- [ ] Implement payment retry queue for failed Paychangu charges
- [ ] Add subscription plan upgrades/downgrades
- [ ] Support for prorated pricing on plan changes
- [ ] Dunning management (progressive payment reminders)
- [ ] Bulk subscription operations (admin panel)
- [ ] Webhook support for Square subscription updates
- [ ] SMS notifications for critical reminders
- [ ] Pause subscription feature (instead of cancel)
- [ ] Free trial period support
- [ ] Annual subscription billing options

## Related Files

- Backend: `/sparkle-pro-api/subscription_renewal_manager.php` (Standalone processor)
- Backend: `/sparkle-pro-api/index.php` (Main API with renewal endpoint)
- Migration: `/sparkle-pro-api/migrations/005_subscription_renewal_system.sql`
- Frontend: `/src/services/paymentService.js` (Payment creation)
- Frontend: `/src/services/api.js` (API calls)
- Frontend: SubscriptionCard component (Status display)

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Production Ready
