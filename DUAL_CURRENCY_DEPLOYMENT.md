# Dual Currency Migration - Deployment Guide

## 🎯 Purpose
Add GBP (British Pounds) support alongside MWK (Malawi Kwacha) for complete dual-currency tracking in orders and analytics.

---

## 📋 Pre-Deployment Checklist

- [ ] **Backup database** (CRITICAL!)
  ```bash
  mysqldump -u xuser -p itsxtrapush_db > backup_dual_currency_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test on local/staging first**
  ```bash
  mysql -u xuser -p itsxtrapush_db < migrations/002_add_dual_currency_support.sql
  ```

- [ ] **Verify current orders table structure**
  ```sql
  DESCRIBE orders;
  -- Should NOT have total_amount_gbp yet
  ```

---

## 🚀 Deployment Steps

### **Step 1: Run Database Migration**

```bash
# Connect to production database
mysql -u xuser -p itsxtrapush_db

# Or run migration file directly
mysql -u xuser -p itsxtrapush_db < sparkle-pro-api/migrations/002_add_dual_currency_support.sql
```

**Expected Changes:**
- ✅ `orders.total_amount_gbp` column added
- ✅ `order_items.unit_price_gbp` column added
- ✅ `order_items.total_price_gbp` column added
- ✅ Existing orders backfilled with GBP values (using 1 GBP = 1800 MWK rate)
- ✅ `analytics_cache` table created/verified

---

### **Step 2: Verify Migration Success**

```sql
-- Check orders table has new column
DESCRIBE orders;
-- Should show: total_amount_gbp DECIMAL(10,2)

-- Check order_items table has new columns
DESCRIBE order_items;
-- Should show: unit_price_gbp, total_price_gbp

-- Verify data was backfilled
SELECT id, total_amount, total_amount_gbp, currency, status 
FROM orders 
LIMIT 10;
-- All existing orders should have total_amount_gbp calculated

-- Check analytics_cache table
DESCRIBE analytics_cache;
SELECT last_updated FROM analytics_cache WHERE id = 1;
```

---

### **Step 3: Deploy Updated Cron File**

The `subscription_renewal_manager.php` has already been updated to:
- ✅ Use `total_amount_gbp` from orders table
- ✅ Calculate dual-currency revenue statistics
- ✅ Handle dual-currency installment values

```bash
# Upload updated file to production
scp sparkle-pro-api/subscription_renewal_manager.php user@server:/var/www/vhosts/sparkle-pro.co.uk/httpdocs/api/

# Set permissions
chmod 755 /var/www/vhosts/sparkle-pro.co.uk/httpdocs/api/subscription_renewal_manager.php
```

---

### **Step 4: Test Analytics Cron**

```bash
# Run cron manually to test
cd /var/www/vhosts/sparkle-pro.co.uk/httpdocs/api
php subscription_renewal_manager.php
```

**Expected Output:**
```
[SubscriptionRenewal] Starting renewal processing at 2026-01-11 XX:XX:XX
[Analytics] Starting analytics update at 2026-01-11 XX:XX:XX
[Analytics] Successfully updated analytics cache - Orders: XXX, Gadgets: XXX, Active Subs: XXX, Visitors Today: XXX, Conversion Rate: XX.XX%
[Renewals] Processed X renewals
[Reminders] Sent X reminder notifications
[Grace] Suspended X subscriptions
[SubscriptionRenewal] Renewal processing completed successfully
```

---

### **Step 5: Verify Analytics API**

```bash
# Test analytics endpoint returns dual currency data
curl https://sparkle-pro.co.uk/api/analytics/dashboard | jq '.revenue_stats'
```

**Expected Response:**
```json
{
  "total_revenue_mwk": "125000000.00",
  "total_revenue_gbp": "69444.44",
  "revenue_today_mwk": "450000.00",
  "revenue_today_gbp": "250.00",
  "revenue_this_week_mwk": "3200000.00",
  "revenue_this_week_gbp": "1777.78",
  ...
}
```

---

## 🧪 Testing Checklist

### **Database Tests**
- [ ] Orders table has `total_amount_gbp` column
- [ ] Order items table has GBP price columns
- [ ] Existing orders have GBP values calculated
- [ ] Analytics cache table exists

### **Cron Job Tests**
- [ ] Cron runs without errors
- [ ] Analytics cache is updated with dual currency data
- [ ] Revenue stats show both MWK and GBP totals
- [ ] Logs show successful completion

### **API Tests**
- [ ] `/analytics/dashboard` returns dual currency revenue
- [ ] All 12 analytics categories load successfully
- [ ] Response time remains fast (<100ms)

### **Frontend Tests**
- [ ] Admin dashboard shows both currencies (when integrated)
- [ ] Revenue cards display MWK and GBP amounts
- [ ] Analytics charts work with dual currency data

---

## 🔄 Exchange Rate Information

**Current Backfill Rate:** 1 GBP = 1800 MWK

**Why This Rate?**
- Approximate historical average for existing orders
- Close to current market rate (varies ~1600-2000 MWK per GBP)
- Conservative estimate for backfill purposes

**Future Orders:**
- Use real-time exchange rates at checkout
- Or maintain fixed rates per product (gadgets table already has price_gbp)
- Gateway determines currency: Square (GBP), PayChangu (MWK)

**Update Exchange Rate:**
If you need to recalculate backfilled values with a different rate:
```sql
-- Example: Use 1 GBP = 1750 MWK instead
UPDATE orders 
SET total_amount_gbp = ROUND(total_amount / 1750, 2)
WHERE created_at < '2026-01-11';  -- Only backfilled orders
```

---

## 🐛 Troubleshooting

### **Issue: Column already exists**
```
ERROR 1060 (42S21): Duplicate column name 'total_amount_gbp'
```
**Solution:** Migration was already run. Verify data:
```sql
SELECT COUNT(*) FROM orders WHERE total_amount_gbp > 0;
```

### **Issue: Cron still shows errors**
```
Unknown column 'total_amount_gbp'
```
**Solution:** Migration not run yet. Execute Step 1 first.

### **Issue: All GBP values are 0**
```sql
-- Check if backfill ran
SELECT total_amount, total_amount_gbp FROM orders WHERE total_amount > 0 LIMIT 5;

-- If GBP is 0, run backfill manually:
UPDATE orders 
SET total_amount_gbp = ROUND(total_amount / 1800, 2)
WHERE total_amount_gbp = 0;
```

### **Issue: Analytics shows only MWK**
Cron needs to run after migration. Wait 1 minute or run manually:
```bash
php subscription_renewal_manager.php
```

---

## 📊 What's Next?

### **Immediate (After Migration)**
1. ✅ Database migration complete
2. ✅ Cron job updated and running
3. ✅ Analytics showing dual currency

### **Short-term (Frontend Updates)**
1. Update UserDashboard.jsx to display both currencies
2. Add currency toggle/selection in analytics tab
3. Show GBP amounts for UK users, MWK for Malawi users
4. Format currency display with proper symbols (£ vs MWK)

### **Long-term (Enhancements)**
1. Implement real-time exchange rate API
2. Add currency conversion calculator in admin panel
3. Support additional currencies (USD, EUR, etc.)
4. Historical exchange rate tracking
5. Multi-currency revenue reports and charts

---

## 🔐 Rollback Procedure

**If migration causes issues, rollback:**

```sql
-- Remove new columns (data will be lost!)
ALTER TABLE orders DROP COLUMN total_amount_gbp;
ALTER TABLE order_items DROP COLUMN unit_price_gbp;
ALTER TABLE order_items DROP COLUMN total_price_gbp;

-- Restore from backup
mysql -u xuser -p itsxtrapush_db < backup_dual_currency_YYYYMMDD_HHMMSS.sql
```

**Then revert cron file:**
```bash
# Re-upload the old version that uses 0 for GBP values
git checkout HEAD~1 sparkle-pro-api/subscription_renewal_manager.php
scp sparkle-pro-api/subscription_renewal_manager.php user@server:/path/
```

---

## ✅ Success Indicators

Your migration is successful when:
- ✅ No errors in cron execution
- ✅ Analytics API returns non-zero GBP values
- ✅ All existing orders have calculated GBP amounts
- ✅ Revenue stats show both MWK and GBP totals
- ✅ Dashboard displays dual currency data
- ✅ No performance degradation

---

## 📞 Support

If issues persist:
1. Check error logs: `/var/log/mysql/error.log`
2. Check cron logs: `~/cron_logs/analytics.log`
3. Verify database connection settings
4. Ensure proper user permissions on database

---

**Migration Created:** 2026-01-11  
**Status:** Ready for Production  
**Estimated Downtime:** <1 minute  
**Risk Level:** Low (non-destructive, adds columns only)
