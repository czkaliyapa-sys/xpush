#!/bin/bash

# Deploy updated analytics files
WORK_DIR=$(dirname "$0")
API_ENDPOINT="conradzikomo@sparkle-pro.co.uk"
SERVER_PATH="/var/www/vhosts/sparkle-pro.co.uk/httpdocs"

echo "📦 Deploying Analytics Fix..."
echo ""

# Upload frontend component
echo "1️⃣ Uploading EnhancedAnalyticsDashboard.jsx..."
scp "$WORK_DIR/src/external_components/EnhancedAnalyticsDashboard.jsx" \
    "$API_ENDPOINT:$SERVER_PATH/src/external_components/"

# Upload API service
echo "2️⃣ Uploading api.js..."
scp "$WORK_DIR/src/services/api.js" \
    "$API_ENDPOINT:$SERVER_PATH/src/services/"

# Upload backend index.php
echo "3️⃣ Uploading index.php..."
scp "$WORK_DIR/sparkle-pro-api/index.php" \
    "$API_ENDPOINT:$SERVER_PATH/api/"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Changes Made:"
echo "- Frontend now sends timeRange parameter to API"
echo "- API recalculates stats based on selected time range"
echo "- Revenue shows both MWK and GBP currencies"
echo "- Visitors calculated from actual orders"
echo ""
echo "Test: Click time range buttons (7d, 30d, 90d, 1y) - data should update!"
