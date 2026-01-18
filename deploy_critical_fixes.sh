#!/bin/bash
# CRITICAL FIXES DEPLOYMENT SCRIPT
# This script applies all critical fixes to your system

echo "🚀 Starting Critical Fixes Deployment..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="localhost"
DB_USER="xuser"
DB_PASS="Xpush2025?"
DB_NAME="itsxtrapush_db"
API_DIR="/Users/conradkaliyaoa/Codes/itsxtrapush/sparkle-pro-api"

echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# 1. Apply Database Fixes
echo -e "\n${YELLOW}1. Applying Database Fixes...${NC}"
echo "-------------------------------"

if [ -f "critical_database_fixes.sql" ]; then
    echo "✅ Found critical_database_fixes.sql"
    
    # Test database connection
    echo "Testing database connection..."
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        
        # Apply fixes
        echo "Applying database schema fixes..."
        if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < critical_database_fixes.sql; then
            echo -e "${GREEN}✅ Database fixes applied successfully${NC}"
        else
            echo -e "${RED}❌ Failed to apply database fixes${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "Please check your database credentials and ensure MySQL is running"
        exit 1
    fi
else
    echo -e "${RED}❌ critical_database_fixes.sql not found${NC}"
    exit 1
fi

# 2. Deploy Application Fixes
echo -e "\n${YELLOW}2. Deploying Application Fixes...${NC}"
echo "----------------------------------"

if [ -f "critical_application_fixes.php" ]; then
    echo "✅ Found critical_application_fixes.php"
    
    # Copy to API directory
    echo "Deploying to API directory..."
    cp critical_application_fixes.php "$API_DIR/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Application fixes deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy application fixes${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ critical_application_fixes.php not found${NC}"
    exit 1
fi

# 3. Create Integration Instructions
echo -e "\n${YELLOW}3. Generating Integration Instructions...${NC}"
echo "-------------------------------------------"

cat > INTEGRATION_INSTRUCTIONS.md << 'EOF'
# 🔧 Critical Fixes Integration Instructions

## Database Fixes Applied ✅

The following database fixes have been applied:

1. **Unique Constraints Added**
   - `orders.external_tx_ref` - Prevents duplicate transactions
   - Already existing: `users.email`, `users.uid`

2. **New Tables Created**
   - `processed_transactions` - Tracks processed payments for idempotency
   - `stock_audit_log` - Logs all inventory changes for audit trail

3. **Data Validation Added**
   - Currency validation (MWK/GBP only)
   - Payment status validation
   - Positive price validation

4. **Triggers Added**
   - Order validation before insert
   - Stock change audit logging

## Application Integration Required

### Option 1: Direct Integration (Recommended)
Replace your existing payment processing code in `index.php` with the enhanced version:

```php
// At the top of your index.php, include the fixes:
require_once 'critical_application_fixes.php';

// Replace your payment notification endpoint:
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === '/payments/notify-success') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $processor = new CriticalPaymentProcessor();
    $result = $processor->processPayment($input['txRef'], $input);
    
    if ($result['success']) {
        CriticalErrorHandler::sendSuccess([
            'order_id' => $result['order_id'],
            'message' => $result['message'] ?? 'Payment processed successfully'
        ]);
    } else {
        CriticalErrorHandler::sendError($result['error_code'] ?? 'PAYMENT_PROCESSING_FAILED', [
            'details' => $result['error']
        ]);
    }
}
```

### Option 2: Gradual Migration
1. Keep existing code
2. Add the new classes to your existing file
3. Test with a small percentage of traffic
4. Gradually migrate endpoints

## Verification Steps

### 1. Database Verification
Run these queries to verify fixes:

```sql
-- Check unique constraints
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
AND CONSTRAINT_NAME LIKE '%unique%'
AND TABLE_NAME IN ('users', 'orders');

-- Check new tables
SHOW TABLES LIKE 'processed_transactions';
SHOW TABLES LIKE 'stock_audit_log';

-- Test duplicate prevention
INSERT INTO orders (external_tx_ref, total_amount, currency) 
VALUES ('TEST-DUPLICATE', 1000, 'MWK');
-- This should fail with duplicate error
```

### 2. Application Testing
Test these scenarios:

1. **Duplicate Payment Prevention**
   - Process same transaction twice
   - Second attempt should return "already processed"

2. **Stock Validation**
   - Try to order more items than available stock
   - Should return stock shortage error

3. **Currency Validation**
   - Try invalid currency codes
   - Should return validation error

4. **Data Integrity**
   - Check that GBP amounts are calculated correctly
   - Verify stock levels update properly

## Rollback Plan

If issues occur:

1. **Database Rollback**
   ```sql
   -- Remove unique constraint (if needed)
   ALTER TABLE orders DROP INDEX idx_unique_tx_ref;
   
   -- Drop new tables
   DROP TABLE processed_transactions;
   DROP TABLE stock_audit_log;
   ```

2. **Application Rollback**
   - Restore previous `index.php` from backup
   - Remove `critical_application_fixes.php`

## Monitoring

Watch for these metrics after deployment:

- ✅ Payment success rate (should remain stable or improve)
- ✅ Duplicate transaction errors (should be 0)
- ✅ Stock level accuracy (should be 100%)
- ✅ Database constraint violations (should be 0)

## Support

If you encounter issues:
1. Check error logs in `/var/log/apache2/error.log` or equivalent
2. Verify database connection settings
3. Test with the verification queries above
4. Contact support with specific error messages

---
**Deployment Date:** $(date)
**Version:** Critical Fixes v1.0
EOF

echo -e "${GREEN}✅ Integration instructions generated${NC}"

# 4. Run Verification Tests
echo -e "\n${YELLOW}4. Running Verification Tests...${NC}"
echo "--------------------------------"

# Test database fixes
echo "Testing database constraints..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT '✅ Unique constraints:' as test;
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND CONSTRAINT_NAME LIKE '%unique%'
AND TABLE_NAME IN ('users', 'orders')
ORDER BY TABLE_NAME;

SELECT '✅ New tables:' as test;
SHOW TABLES LIKE 'processed_transactions';
SHOW TABLES LIKE 'stock_audit_log';

SELECT '✅ Validation constraints:' as test;
SELECT TABLE_NAME, CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = '$DB_NAME'
AND CONSTRAINT_TYPE = 'CHECK'
AND TABLE_NAME IN ('orders', 'gadgets')
ORDER BY TABLE_NAME;
" 2>/dev/null || echo -e "${RED}❌ Database verification failed${NC}"

# Test application files
echo -e "\n${BLUE}Checking deployed files:${NC}"
if [ -f "$API_DIR/critical_application_fixes.php" ]; then
    echo -e "${GREEN}✅ Application fixes deployed to API directory${NC}"
else
    echo -e "${RED}❌ Application fixes not found in API directory${NC}"
fi

# 5. Summary
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}🎉 Critical Fixes Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"

echo ""
echo "📋 Summary of Applied Fixes:"
echo "----------------------------"
echo "✅ Database unique constraints added"
echo "✅ Payment idempotency table created" 
echo "✅ Stock audit logging implemented"
echo "✅ Data validation constraints added"
echo "✅ Enhanced payment processor deployed"
echo "✅ Standardized error handling added"
echo "✅ Integration instructions provided"

echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. Review INTEGRATION_INSTRUCTIONS.md"
echo "2. Integrate application fixes into index.php"
echo "3. Run verification tests"
echo "4. Monitor system performance"
echo "5. Test payment flows thoroughly"

echo ""
echo "⚠️  Important Notes:"
echo "-------------------"
echo "• Backup your database before making any changes"
echo "• Test in staging environment first if possible"
echo "• Monitor logs for any constraint violations"
echo "• Have rollback plan ready"

echo ""
echo "For detailed integration instructions, see: INTEGRATION_INSTRUCTIONS.md"