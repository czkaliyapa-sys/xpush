#!/bin/bash

# Deployment script for pre-order functionality migration
# This script applies the database changes for automatic pre-order mode

echo "🚀 Deploying Pre-order Functionality Migration..."
echo "==============================================="

# Configuration
DB_HOST="localhost"
DB_USER="xuser"
DB_NAME="itsxtrapush_db"
DB_PASSWORD="" # Will prompt if needed

# Check if we're in the right directory
if [ ! -f "sparkle-pro-api/migrations/2026-01-19_add_preorder_functionality.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 Migration file found: sparkle-pro-api/migrations/2026-01-19_add_preorder_functionality.sql"

# Prompt for database password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo "🔒 Enter database password for user '$DB_USER':"
    read -s DB_PASSWORD
fi

# Apply the migration
echo "🔄 Applying database migration..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < sparkle-pro-api/migrations/2026-01-19_add_preorder_functionality.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
else
    echo "❌ Database migration failed!"
    exit 1
fi

# Verify the changes
echo "🔍 Verifying migration results..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT 
    'Column Check' as check_type,
    COUNT(*) as result 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'gadgets' 
AND COLUMN_NAME = 'is_pre_order'
UNION ALL
SELECT 
    'Trigger Check' as check_type,
    COUNT(*) as result 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = '$DB_NAME' 
AND TRIGGER_NAME IN ('maintain_gadget_variant_data_update', 'update_gadget_stock_after_variant_insert', 'update_gadget_stock_after_variant_delete');
"

echo "✅ Migration verification completed!"

echo ""
echo "✨ Pre-order functionality migration deployed successfully!"
echo "   - Added is_pre_order column to gadgets table"
echo "   - Updated database triggers for automatic pre-order detection"
echo "   - Set initial pre-order status for existing gadgets"
echo ""
echo "💡 Next steps:"
echo "   1. Test the frontend to verify pre-order badges appear correctly"
echo "   2. Verify that gadgets with zero stock variants show pre-order mode"
echo "   3. Check that API responses now include is_pre_order field"