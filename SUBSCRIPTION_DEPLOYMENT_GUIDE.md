# Subscription Renewal System - Deployment Guide

## Quick Start (5 minutes)

### 1. Create Database Fields

```bash
# SSH into your server
ssh user@your-server.com

# Navigate to project
cd /path/to/sparkle-pro-api

# Run migration
mysql -u xuser -p itsxtrapush_db < migrations/005_subscription_renewal_system.sql
# Enter password when prompted
```

### 2. Generate & Store Token

```bash
# Generate secure token
TOKEN=$(openssl rand -base64 32)

# Store in environment (choose ONE method below)

# Method A: Environment variables (preferred)
export CRON_SECRET_TOKEN="$TOKEN"
echo "CRON_SECRET_TOKEN=$TOKEN" >> ~/.bashrc

# Method B: .env file
echo "CRON_SECRET_TOKEN=$TOKEN" > /etc/itsxtrapush/.env
chmod 600 /etc/itsxtrapush/.env

# Method C: PHP config
# Add to your PHP configuration or /sparkle-pro-api/config/subscription.php:
# define('CRON_SECRET_TOKEN', 'your-token-here');
```

### 3. Setup Cron Job

Choose the method that works best for your server:

#### Option A: System Crontab (Recommended for production)

```bash
crontab -e

# Add this line:
*/5 * * * * curl -s -X GET "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN" >> /var/log/subscription_renewal.log 2>&1

# Save and exit (Ctrl+X, then Y, then Enter if using nano)
```

#### Option B: External Service (For shared hosting)

If your server doesn't support cron jobs or you want redundancy, use an external cron service:

1. Visit https://cron-job.org
2. Create account (free)
3. Create new job:
   - **URL:** `https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals`
   - **Request method:** GET
   - **Add Header:**
     - Header name: `Authorization`
     - Header value: `Bearer YOUR_TOKEN`
   - **Timeout:** 300 seconds
   - **Interval:** Every 5 minutes
   - **Notification:** Enable for failures

#### Option C: AWS EventBridge (For serverless)

```bash
# Create CloudWatch rule
aws events put-rule --name subscription-renewal-rule --schedule-expression "rate(5 minutes)"

# Add target
aws events put-targets --rule subscription-renewal-rule --targets "Id"="1","Arn"="arn:aws:lambda:region:account:function:subscription-renewal","HttpParameters"={"PathParameterValues"=[],"HeaderParameters"={"Authorization"="Bearer YOUR_TOKEN"},"QueryStringParameters"={"token"="YOUR_TOKEN"}}
```

### 4. Test the Setup

```bash
# Test the endpoint manually
curl -v "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=YOUR_TOKEN"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "renewals_processed": 0,
#     "reminders_sent": 0,
#     "suspensions": 0,
#     "errors": []
#   }
# }
```

### 5. Verify Cron Execution

```bash
# Check cron logs
tail -f /var/log/subscription_renewal.log

# Or check database
mysql -u xuser -p itsxtrapush_db << EOF
SELECT * FROM subscription_cron_logs ORDER BY created_at DESC LIMIT 5;
EOF
```

---

## Detailed Setup Instructions

### Database Migration Details

The migration script (`005_subscription_renewal_system.sql`) adds:

#### New Fields on `users` table:
- `subscription_payment_gateway` - Gateway identifier (square/paychangu)
- `subscription_renewal_date` - Next renewal date
- `subscription_grace_period_end` - Grace period expiration
- `last_renewal_reminder_sent` - Last reminder tracking
- Indexes for faster queries

#### New Tables:
- `subscription_history` - Audit trail of all subscription events
- `subscription_cron_logs` - Execution logs and monitoring

**Verify migration success:**
```sql
SELECT COUNT(*) FROM subscription_cron_logs;
SELECT COUNT(*) FROM subscription_history;
DESCRIBE users LIKE 'subscription_%';
```

### Cron Token Security

The token is used to authenticate cron requests. Security best practices:

```bash
# ✓ DO: Use strong, random tokens
TOKEN=$(openssl rand -base64 32)
# Result: aB3cD9eF2gH5iJ8kL0mN3oP6qR9sT2uV

# ✗ DON'T: Use weak or predictable tokens
WEAK_TOKEN="12345"  # Bad!

# ✓ DO: Store in environment variables or secure files
export CRON_SECRET_TOKEN="$TOKEN"

# ✗ DON'T: Hardcode in scripts or version control
# CRON_SECRET_TOKEN="abc123"  # Bad! Never do this!

# ✓ DO: Rotate token periodically (every 90 days)
# ✓ DO: Use HTTPS only (never HTTP)
# ✓ DO: Monitor cron logs for unauthorized access attempts
```

### Email Configuration

The system sends emails for reminders, renewals, and suspensions. Configure your email settings:

#### Option 1: PHP Mail (Simple, may have deliverability issues)

PHP's `mail()` function is used by default. Ensure your server has mail sending configured:

```bash
# Check mail configuration
php -i | grep -i mail

# Test sending email
php -r "mail('test@example.com', 'Test', 'Test message');"
```

#### Option 2: SMTP with PHPMailer (Recommended for production)

Edit the `send_renewal_email()` function in `/sparkle-pro-api/index.php`:

```php
function send_renewal_email($user, $type, $data = []) {
    // ... existing code ...
    
    if ($subject && $html) {
        // Use PHPMailer instead of mail()
        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        
        try {
            $mailer->isSMTP();
            $mailer->Host = 'smtp.gmail.com';
            $mailer->SMTPAuth = true;
            $mailer->Username = getenv('SMTP_USERNAME');
            $mailer->Password = getenv('SMTP_PASSWORD');
            $mailer->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mailer->Port = 587;
            
            $mailer->setFrom('noreply@itsxtrapush.com', 'Xtrapush');
            $mailer->addAddress($user['email']);
            $mailer->Subject = $subject;
            $mailer->Body = $html;
            $mailer->isHTML(true);
            
            $mailer->send();
        } catch (\PHPMailer\PHPMailer\Exception $e) {
            error_log("Email Error: " . $e->getMessage());
        }
    }
}
```

Configure SMTP credentials:
```bash
export SMTP_USERNAME="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"  # Use app-specific password for Gmail
```

#### Option 3: SendGrid API (Enterprise)

```php
$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
$email = new \SendGrid\Mail\Mail();
$email->setFrom("noreply@itsxtrapush.com");
$email->setSubject($subject);
$email->addTo($user['email']);
$email->addContent("text/html", $html);
try {
    $sendgrid->send($email);
} catch (\Exception $e) {
    error_log("SendGrid Error: " . $e->getMessage());
}
```

### Monitoring & Health Checks

#### 1. Database Monitoring

```sql
-- Check cron execution status
SELECT 
    DATE(created_at) as date,
    status,
    COUNT(*) as count,
    AVG(execution_time) as avg_execution_time
FROM subscription_cron_logs
GROUP BY DATE(created_at), status
ORDER BY date DESC;

-- Check for errors in last 24 hours
SELECT * FROM subscription_cron_logs 
WHERE status = 'error' 
  AND created_at > NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC;

-- Monitor subscription events
SELECT 
    event_type,
    COUNT(*) as count,
    MAX(created_at) as last_event
FROM subscription_history
WHERE created_at > NOW() - INTERVAL 7 DAY
GROUP BY event_type
ORDER BY count DESC;
```

#### 2. Health Check Endpoint (Optional)

Add to `/sparkle-pro-api/index.php`:

```php
if ($method === 'GET' && $path === '/subscriptions/health') {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    
    // Check last cron execution
    $result = $conn->query("
        SELECT status, created_at, 
               TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
        FROM subscription_cron_logs 
        ORDER BY created_at DESC LIMIT 1
    ");
    
    $lastRun = $result->fetch_assoc();
    $healthy = $lastRun && $lastRun['minutes_ago'] < 15 && $lastRun['status'] === 'success';
    
    json_ok([
        'status' => $healthy ? 'healthy' : 'warning',
        'last_cron_run' => $lastRun['created_at'] ?? null,
        'minutes_since_last_run' => $lastRun['minutes_ago'] ?? null,
        'last_status' => $lastRun['status'] ?? null
    ]);
}
```

#### 3. Monitoring Dashboard Queries

Create a monitoring dashboard with these key metrics:

```sql
-- Active subscriptions by gateway
SELECT 
    subscription_payment_gateway,
    COUNT(*) as count,
    SUM(CASE WHEN subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN subscription_status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended
FROM users
WHERE subscription_active IN (0, 1)
GROUP BY subscription_payment_gateway;

-- Upcoming renewals (next 7 days)
SELECT 
    DATEDIFF(subscription_renewal_date, CURDATE()) as days_until,
    COUNT(*) as count
FROM users
WHERE subscription_active = 1 
  AND subscription_renewal_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATEDIFF(subscription_renewal_date, CURDATE())
ORDER BY days_until;

-- Grace period status
SELECT 
    CASE 
        WHEN subscription_grace_period_end IS NULL THEN 'No Grace Period'
        WHEN subscription_grace_period_end <= NOW() THEN 'Expired'
        ELSE CONCAT(DATEDIFF(subscription_grace_period_end, NOW()), ' days left')
    END as grace_status,
    COUNT(*) as count
FROM users
WHERE subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
GROUP BY grace_status;
```

### Frontend Integration

After deployment, update frontend components to display renewal information:

```jsx
// In Dashboard or SubscriptionCard component
import { SubscriptionRenewalCard } from '@/components/SubscriptionRenewalCard';

export function SubscriptionDashboard({ subscription }) {
  const handlePayment = async () => {
    // Redirect to payment page or initiate payment
  };
  
  const handleReactivate = async () => {
    // Reactivate suspended subscription
  };
  
  return (
    <SubscriptionRenewalCard 
      subscription={subscription}
      onPaymentClick={handlePayment}
      onReactivateClick={handleReactivate}
    />
  );
}
```

---

## Troubleshooting

### Issue: Cron job not executing

**Symptoms:** 
- No entries in subscription_cron_logs
- Subscriptions not renewing
- No reminder emails sent

**Solutions:**
```bash
# 1. Verify cron job exists
crontab -l | grep subscription

# 2. Test endpoint manually
curl -v "https://itsxtrapush.com/gadgets/payments/subscriptions/process-renewals?token=$CRON_TOKEN"

# 3. Check server error logs
tail -f /var/log/apache2/error.log
tail -f /var/log/nginx/error.log

# 4. Verify cron daemon is running
systemctl status cron
ps aux | grep cron

# 5. Check if script is executable
ls -la /path/to/subscription_renewal_manager.php

# 6. Test with curl from cron context
# Add test job to crontab that runs every minute
# * * * * * curl -s -X GET "https://domain.com/gadgets/payments/subscriptions/process-renewals?token=token" > /tmp/cron_test.log 2>&1
# Then check /tmp/cron_test.log
```

### Issue: Emails not sending

**Symptoms:**
- Users not receiving renewal reminders
- No email delivery logs

**Solutions:**
```bash
# 1. Check PHP mail configuration
php -i | grep -i sendmail
php -i | grep -i "mail function"

# 2. Test email delivery
php -r "
\$to = 'test@example.com';
\$subject = 'Test';
\$body = 'Test message';
\$headers = 'From: noreply@itsxtrapush.com';
if (mail(\$to, \$subject, \$body, \$headers)) {
    echo 'Email sent successfully';
} else {
    echo 'Email failed to send';
}
"

# 3. Check mail logs
tail -f /var/log/mail.log
tail -f /var/log/maillog

# 4. Verify SPF/DKIM records
nslookup -type=TXT itsxtrapush.com

# 5. Check Spam folder (test recipients)
# 6. Use SMTP instead of mail() function
```

### Issue: Database connection errors

**Symptoms:**
- "Database error" in cron logs
- Renewal processing fails

**Solutions:**
```bash
# 1. Verify database is running
mysql -h localhost -u xuser -p -e "SELECT 1;"

# 2. Check database user permissions
mysql -u root -e "SHOW GRANTS FOR 'xuser'@'localhost';"

# 3. Ensure migration ran successfully
mysql -u xuser -p itsxtrapush_db -e "SHOW TABLES LIKE 'subscription%';"

# 4. Check database logs
tail -f /var/log/mysql/error.log

# 5. Verify connection string in index.php
# Check DB_HOST, DB_NAME, DB_USER, DB_PASS constants
```

### Issue: Duplicate charges

**Symptoms:**
- Users charged multiple times
- Multiple renewal events for same subscription

**Solutions:**
```sql
-- 1. Check for duplicate events
SELECT 
    user_id, 
    event_type, 
    DATE(created_at),
    COUNT(*) as count
FROM subscription_history
WHERE event_type = 'renewal_processed'
GROUP BY user_id, DATE(created_at), event_type
HAVING COUNT(*) > 1;

-- 2. If duplicates found, investigate cron frequency
-- Ensure cron runs at /5 minute intervals, not more frequently

-- 3. Check cron logs for concurrent execution
SELECT COUNT(*) FROM subscription_cron_logs 
WHERE created_at > NOW() - INTERVAL 1 MINUTE 
  AND status = 'success';

-- 4. Implement unique constraints if needed
ALTER TABLE subscription_history 
ADD UNIQUE KEY unique_daily_renewal (user_id, DATE(created_at), event_type);
```

---

## Post-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] Cron secret token generated and stored securely
- [ ] Cron job added and tested
- [ ] Email configuration verified
- [ ] Health check endpoint accessible
- [ ] Cron logs monitoring configured
- [ ] Database logs monitoring configured
- [ ] Frontend subscription card component deployed
- [ ] Test subscription created and renewal date verified
- [ ] Reminder emails received as expected
- [ ] Suspension logic tested with expired grace period
- [ ] Admin dashboard updated with monitoring queries
- [ ] Backup schedule configured for subscription tables
- [ ] Documentation shared with support team
- [ ] Support runbook created for common issues
- [ ] Status page updated with subscription system status

---

## Maintenance Tasks

### Weekly
- Review cron execution logs for errors
- Check for failed renewal attempts
- Verify email deliverability

### Monthly  
- Rotate cron secret token
- Review subscription metrics
- Check database disk usage
- Audit subscription_history table size

### Quarterly
- Review and update email templates
- Performance optimization review
- Disaster recovery drill
- Security audit of renewal system

---

## Support & Escalation

For issues, check in this order:
1. Cron logs: `SELECT * FROM subscription_cron_logs WHERE status = 'error';`
2. Subscription history: `SELECT * FROM subscription_history WHERE created_at > NOW() - INTERVAL 1 DAY;`
3. Server error logs: `/var/log/apache2/error.log` or `/var/log/nginx/error.log`
4. Mail logs: `/var/log/mail.log` or `/var/log/maillog`
5. Database logs: `/var/log/mysql/error.log`

If issue persists, contact the development team with:
- Cron log entries
- Subscription history events
- Error logs with timestamps
- Test subscription ID that's having issues

---

**Last Updated:** January 2025
**Status:** Production Ready
**Version:** 1.0
