#!/bin/bash

# Upload the corrected analytics cron file to production
SOURCE="/Users/conradkaliyaoa/Codes/itsxtrapush/sparkle-pro-api/subscription_renewal_manager.php"
DEST="/var/www/vhosts/sparkle-pro.co.uk/httpdocs/api/subscription_renewal_manager.php"
SERVER="conradzikomo@sparkle-pro.co.uk"

echo "Uploading corrected subscription_renewal_manager.php to production..."
scp "$SOURCE" "$SERVER:$DEST"

if [ $? -eq 0 ]; then
    echo "✓ File uploaded successfully"
    echo ""
    echo "Running cron job..."
    ssh "$SERVER" "cd /var/www/vhosts/sparkle-pro.co.uk/httpdocs/api && /opt/plesk/php/8.2/bin/php subscription_renewal_manager.php"
else
    echo "✗ Upload failed"
    exit 1
fi
