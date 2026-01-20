#!/bin/bash

# Cleanup unnecessary PHP files - Keep only minimal required entry files
# According to project configuration:
# - index.php: Primary application entry point
# - subscription_renewal_manager.php: Handles scheduled subscription processing

echo "🗑️ Cleaning up unnecessary PHP files..."
echo "Keeping only required entry files per project configuration"
echo ""

# List of PHP files to delete (development/test scripts)
PHP_FILES_TO_DELETE=(
    "analytics_processor.php"
    "complete_receipt_accuracy_enhancement.php"
    "comprehensive_currency_fix.php"
    "corrected_currency_fix.php"
    "critical_application_fixes.php"
    "critical_frontend_analysis.php"
    "currency_analytics_diagnostic.php"
    "dashboard_verification.php"
    "debug_subscription_cron.php"
    "diagnose_payment_issues.php"
    "enhanced_receipt_generation.php"
    "enhanced_subscription_renewal.php"
    "enhanced_unified_subscription_renewal.php"
    "fix_currency_issues.php"
    "fixed_email_notification.php"
    "minimal_subscription_renewal.php"
    "online_gateway_verification.php"
    "optimized_data_retrieval.php"
    "payment_accuracy_verification.php"
    "post_fix_verification.php"
    "quick_cache_fix.php"
    "quick_fix_instructions.php"
    "receipt_accuracy_diagnostic.php"
    "targeted_gbp_fix.php"
    "unified_subscription_renewal.php"
    "variant_tracking_verification.php"
    "website_analysis.php"
)

echo "Files to be deleted:"
for file in "${PHP_FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
        rm "$file"
    fi
done

echo ""
echo "✅ PHP cleanup completed!"
echo "Remaining PHP files in sparkle-pro-api/:"
ls -la sparkle-pro-api/*.php 2>/dev/null
echo ""
echo "Project configuration maintained:"
echo "✅ index.php - Primary application entry point"
echo "✅ subscription_renewal_manager.php - Scheduled subscription processing"