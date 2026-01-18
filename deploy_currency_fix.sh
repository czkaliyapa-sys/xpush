#!/bin/bash
# ================================================================
# CURRENCY SYSTEM DEPLOYMENT SCRIPT
# ================================================================

echo "=== Currency System Deployment ==="
echo "This script will fix all currency-related issues"
echo ""

# Check if running on the correct server
read -p "Are you running this on your production server? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run this script on your production server"
    exit 1
fi

# Database credentials (you'll need to update these)
DB_HOST="localhost"
DB_USER="xuser"
DB_PASS="Xpush2025?"
DB_NAME="itsxtrapush_db"

echo "Using database: $DB_NAME"
echo ""

# 1. Run SQL fix
echo "1. Applying database schema and data fixes..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < complete_currency_fix.sql

if [ $? -eq 0 ]; then
    echo "✅ Database fixes applied successfully"
else
    echo "❌ Database fixes failed"
    exit 1
fi

# 2. Apply PHP patch (if running locally)
if [ -f "sparkle-pro-api/index.php" ]; then
    echo ""
    echo "2. Applying PHP order creation logic fix..."
    php apply_index_patch.php
    
    if [ $? -eq 0 ]; then
        echo "✅ PHP patch applied successfully"
    else
        echo "⚠️  PHP patch failed - you may need to apply manually"
    fi
else
    echo ""
    echo "2. Skipping PHP patch (not running in project directory)"
    echo "   You'll need to apply the index.php changes manually"
fi

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Upload the modified index.php to your server (if not done automatically)"
echo "2. Test placing a new GBP order"
echo "3. Verify GBP revenue shows correctly in analytics"
echo "4. Check UserDashboard displays orders in correct currency"
echo ""
echo "Run this verification query to check results:"
echo "mysql -h$DB_HOST -u$DB_USER -p$DB_PASS $DB_NAME -e \""
echo "SELECT 'GBP Orders Verification:' as section;"
echo "SELECT COUNT(*) as total_gbp_orders, COUNT(CASE WHEN total_amount_gbp > 0 THEN 1 END) as with_gbp_values FROM orders WHERE currency = 'GBP';"
echo "SELECT JSON_EXTRACT(revenue_stats, '\$.gbp.total') as gbp_revenue FROM analytics_cache WHERE id = 1;"
echo "\""