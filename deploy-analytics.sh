#!/bin/bash

# ========================================
# Analytics Cron Job - Production Deployment Script
# ========================================

echo "🚀 Starting Analytics Cron Job Deployment..."
echo ""

# Configuration
SERVER_USER="sparkl72"
SERVER_HOST="sparkle-pro.co.uk"
API_PATH="/home/sparkl72/public_html/api"
LOG_PATH="/home/sparkl72/cron_logs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Test files exist locally
echo "📂 Step 1: Checking local files..."
if [ ! -f "sparkle-pro-api/subscription_renewal_manager.php" ]; then
    echo -e "${RED}❌ Error: subscription_renewal_manager.php not found!${NC}"
    exit 1
fi
if [ ! -f "sparkle-pro-api/index.php" ]; then
    echo -e "${RED}❌ Error: index.php not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Local files found${NC}"
echo ""

# Step 2: Backup current production files
echo "💾 Step 2: Creating backup of production files..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
cd /home/sparkl72/public_html/api
if [ -f subscription_renewal_manager.php ]; then
    cp subscription_renewal_manager.php subscription_renewal_manager.backup.$(date +%Y%m%d_%H%M%S).php
    echo "✅ Backed up subscription_renewal_manager.php"
fi
if [ -f index.php ]; then
    cp index.php index.backup.$(date +%Y%m%d_%H%M%S).php
    echo "✅ Backed up index.php"
fi
EOF
echo ""

# Step 3: Upload files to production
echo "📤 Step 3: Uploading files to production..."
scp sparkle-pro-api/subscription_renewal_manager.php ${SERVER_USER}@${SERVER_HOST}:${API_PATH}/
scp sparkle-pro-api/index.php ${SERVER_USER}@${SERVER_HOST}:${API_PATH}/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files uploaded successfully${NC}"
else
    echo -e "${RED}❌ Upload failed!${NC}"
    exit 1
fi
echo ""

# Step 4: Set permissions
echo "🔐 Step 4: Setting file permissions..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
chmod 755 ${API_PATH}/subscription_renewal_manager.php
chmod 755 ${API_PATH}/index.php
echo "✅ Permissions set to 755"
EOF
echo ""

# Step 5: Test cron manually
echo "🧪 Step 5: Testing cron job manually..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
cd ${API_PATH}
echo "Running: php subscription_renewal_manager.php"
php subscription_renewal_manager.php
if [ \$? -eq 0 ]; then
    echo "✅ Cron job executed successfully"
else
    echo "❌ Cron job failed"
    exit 1
fi
EOF
echo ""

# Step 6: Verify analytics_cache table
echo "🗄️ Step 6: Verifying analytics_cache table..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
mysql -u sparkl72_sparkle -p -e "USE sparkl72_sparkle; SELECT last_updated FROM analytics_cache WHERE id = 1 LIMIT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ analytics_cache table verified"
else
    echo "⚠️ Could not verify analytics_cache table (might need manual check)"
fi
EOF
echo ""

# Step 7: Test API endpoint
echo "🌐 Step 7: Testing API endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://sparkle-pro.co.uk/api/analytics/dashboard)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ API endpoint responding (HTTP $response)${NC}"
else
    echo -e "${YELLOW}⚠️ API endpoint returned HTTP $response${NC}"
fi
echo ""

# Step 8: Create log directory
echo "📁 Step 8: Creating log directory..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
mkdir -p ${LOG_PATH}
chmod 755 ${LOG_PATH}
echo "✅ Log directory created: ${LOG_PATH}"
EOF
echo ""

# Step 9: Set up cron job
echo "⏰ Step 9: Setting up cron job..."
echo -e "${YELLOW}Manual step required:${NC}"
echo "Run this command on the server:"
echo -e "${GREEN}crontab -e${NC}"
echo ""
echo "Add this line (choose frequency):"
echo ""
echo "Every minute (recommended):"
echo -e "${GREEN}* * * * * /usr/bin/php ${API_PATH}/subscription_renewal_manager.php >> ${LOG_PATH}/analytics.log 2>&1${NC}"
echo ""
echo "Every 5 minutes:"
echo -e "${GREEN}*/5 * * * * /usr/bin/php ${API_PATH}/subscription_renewal_manager.php >> ${LOG_PATH}/analytics.log 2>&1${NC}"
echo ""

# Step 10: Show monitoring commands
echo "📊 Step 10: Monitoring commands..."
echo ""
echo "To monitor cron logs in real-time:"
echo -e "${GREEN}ssh ${SERVER_USER}@${SERVER_HOST} 'tail -f ${LOG_PATH}/analytics.log'${NC}"
echo ""
echo "To check last analytics update:"
echo -e "${GREEN}ssh ${SERVER_USER}@${SERVER_HOST} 'mysql -u sparkl72_sparkle -p -e \"USE sparkl72_sparkle; SELECT last_updated FROM analytics_cache WHERE id = 1;\"'${NC}"
echo ""
echo "To test API endpoint:"
echo -e "${GREEN}curl https://sparkle-pro.co.uk/api/analytics/dashboard | jq${NC}"
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Set up cron job (see Step 9 above)"
echo "2. Monitor logs for first few runs"
echo "3. Update frontend UserDashboard.jsx to use analyticsAPI"
echo "4. Test admin dashboard shows real data"
echo ""
echo "Documentation:"
echo "- Full Guide: ANALYTICS_CRON_SETUP.md"
echo "- Quick Ref: ANALYTICS_QUICK_REF.md"
echo "- Summary: ANALYTICS_IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🎉 Happy deploying!"
