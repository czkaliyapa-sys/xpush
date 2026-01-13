# PayChangu Subscription Renewals - Cron Job Setup

## Overview
Automated system for managing PayChangu subscription renewals with:
- ✅ Automated checkout link generation
- 📧 Email alerts and reminders
- 📄 Invoice generation
- ⚠️ Overdue payment handling
- 🔄 Automatic suspension for non-payment

## Features

### 1. **Renewal Reminders**
- Sends reminders 7 days before renewal date
- Includes personalized invoice with payment link
- HTML formatted emails with branding

### 2. **PayChangu Integration**
- Creates checkout links via PayChangu API
- Tracks transaction references
- Handles webhook callbacks

### 3. **Invoice Generation**
- Professional HTML invoices
- Shows plan details, amount, due date
- Lists subscription benefits

### 4. **Automatic Suspension**
- Suspends subscriptions past renewal date
- Sends suspension notification emails
- Maintains data integrity

## Installation

### 1. **Server Setup**
```bash
# Create logs directory
mkdir -p /path/to/sparkle-pro-api/logs
chmod 755 /path/to/sparkle-pro-api/logs
```

### 2. **Cron Configuration**
Add to crontab (`crontab -e`):

```bash
# Run daily at 9:00 AM
0 9 * * * /usr/bin/php /path/to/sparkle-pro-api/cron-subscription-renewals.php >> /path/to/sparkle-pro-api/logs/cron-output.log 2>&1
```

**Alternative schedules:**
```bash
# Run every 6 hours
0 */6 * * * /usr/bin/php /path/to/sparkle-pro-api/cron-subscription-renewals.php

# Run twice daily (9 AM and 9 PM)
0 9,21 * * * /usr/bin/php /path/to/sparkle-pro-api/cron-subscription-renewals.php
```

### 3. **Test Run**
```bash
# Manual test
php /path/to/sparkle-pro-api/cron-subscription-renewals.php

# Check logs
tail -f /path/to/sparkle-pro-api/logs/cron-subscriptions.log
```

## Database Schema

### Required Columns (users table)
```sql
subscription_tier VARCHAR(20)            -- 'plus' or 'premium'
subscription_active TINYINT(1)           -- 1 = active, 0 = inactive
subscription_payment_gateway VARCHAR(20) -- 'paychangu' or 'square'
subscription_renewal_date DATE           -- Next renewal date
subscription_last_reminder_sent DATETIME -- Last reminder timestamp
subscription_status VARCHAR(20)          -- ACTIVE, SUSPENDED, etc.
```

## Email Templates

### Renewal Reminder
- **Subject**: 🔔 Xtrapush Plus/Premium Renewal - Payment Due
- **Content**: Invoice with checkout link, benefits list, due date
- **Timing**: 7 days before renewal

### Suspension Notice
- **Subject**: ⚠️ Subscription Suspended
- **Content**: Suspension notification, reactivation instructions
- **Timing**: When payment is overdue

## Processing Logic

1. **Find Renewals** (7-day window)
   - Query subscriptions with `renewal_date` within next 7 days
   - Filter by PayChangu gateway
   - Exclude recently reminded users (< 2 days ago)

2. **Create Checkout**
   - Generate unique transaction reference
   - Call PayChangu API
   - Get authorization URL

3. **Send Invoice**
   - Generate HTML invoice
   - Include checkout link
   - Email to subscriber

4. **Update Records**
   - Mark reminder as sent
   - Log transaction

5. **Handle Overdue**
   - Find subscriptions past renewal date
   - Suspend subscription
   - Send suspension notice

## Monitoring

### Check Logs
```bash
# View today's activity
tail -100 /path/to/sparkle-pro-api/logs/cron-subscriptions.log

# Watch in real-time
tail -f /path/to/sparkle-pro-api/logs/cron-subscriptions.log

# Search for errors
grep "Error" /path/to/sparkle-pro-api/logs/cron-subscriptions.log
```

### Key Metrics
- ✅ Successfully processed count
- ❌ Error count
- ⚠️ Overdue subscriptions found
- 📧 Emails sent

## Configuration

### Environment Variables
Located in `config.php`:
```php
define('PAYCHANGU_SECRET_KEY', 'your-secret-key');
define('PAYCHANGU_BASE_URL', 'https://api.paychangu.com');
```

### Email Settings
- **From**: subscriptions@itsxtrapush.com
- **Reply-To**: support@itsxtrapush.com
- **Format**: HTML with inline CSS

## Troubleshooting

### Issue: Emails not sending
```bash
# Check PHP mail configuration
php -i | grep sendmail

# Test mail function
php -r "mail('test@example.com', 'Test', 'Body');"
```

### Issue: Database connection failed
```bash
# Check database credentials in config.php
# Test connection
mysql -u username -p database_name
```

### Issue: PayChangu API errors
```bash
# Check API credentials
# Verify endpoint URL
# Review API response in logs
```

### Issue: Cron not running
```bash
# Verify cron service
sudo service cron status

# Check cron logs
grep CRON /var/log/syslog

# Verify PHP path
which php
```

## Security

1. **API Keys**: Store securely in config.php (not in git)
2. **File Permissions**: 644 for PHP files, 755 for directories
3. **Log Rotation**: Implement to prevent disk space issues
4. **Email Validation**: Prevent injection attacks
5. **Database Prepared Statements**: Prevent SQL injection

## Maintenance

### Log Rotation
```bash
# Add to logrotate.d
sudo nano /etc/logrotate.d/xtrapush-cron

/path/to/sparkle-pro-api/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### Performance
- Current: ~500ms delay between users
- Capacity: ~7,000 renewals/hour
- Optimization: Batch email sending if needed

## Support

For issues or questions:
- 📧 Email: dev@itsxtrapush.com
- 📚 Docs: /docs/subscription-system
- 🐛 Issues: GitHub repository

## Version History

- **v1.0.0** (2026-01-10): Initial release
  - Renewal reminders
  - Invoice generation
  - Automatic suspension
  - Email notifications
