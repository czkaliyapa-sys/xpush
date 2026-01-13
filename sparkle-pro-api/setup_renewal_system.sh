#!/bin/bash
# Subscription Renewal System Setup Script
# Run this script to configure the subscription renewal system

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Subscription Renewal System - Setup & Configuration       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_DOMAIN="${API_DOMAIN:-itsxtrapush.com}"
API_PATH="/gadgets/payments/subscriptions/process-renewals"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-itsxtrapush_db}"
DB_USER="${DB_USER:-xuser}"

echo -e "${BLUE}Step 1: Generate Cron Secret Token${NC}"
echo "Generating a secure random token for cron authentication..."

if command -v openssl &> /dev/null; then
    CRON_TOKEN=$(openssl rand -base64 32)
    echo -e "${GREEN}✓ Token Generated:${NC} $CRON_TOKEN"
else
    CRON_TOKEN=$(head -c 32 /dev/urandom | base64)
    echo -e "${GREEN}✓ Token Generated:${NC} $CRON_TOKEN"
fi

echo ""
echo -e "${BLUE}Step 2: Verify Database Connection${NC}"

# Attempt to connect to database
if command -v mysql &> /dev/null; then
    if mysql -h "$DB_HOST" -u "$DB_USER" -e "SELECT 1" "$DB_NAME" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        echo "Please verify your database credentials:"
        echo "  Host: $DB_HOST"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ MySQL client not found, skipping connection test${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Run Database Migration${NC}"

read -p "Do you want to run the database migration now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    MIGRATION_FILE="$SCRIPT_DIR/sparkle-pro-api/migrations/005_subscription_renewal_system.sql"
    
    if [ -f "$MIGRATION_FILE" ]; then
        echo "Running migration: $MIGRATION_FILE"
        mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$MIGRATION_FILE"
        echo -e "${GREEN}✓ Migration completed${NC}"
    else
        echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Step 4: Save Cron Token${NC}"

# Create or update .env file
ENV_FILE="${HOME}/.itsxtrapush.env"

if [ -f "$ENV_FILE" ]; then
    echo "Updating existing .env file: $ENV_FILE"
    # Remove old CRON_SECRET_TOKEN if exists
    sed -i.bak '/^CRON_SECRET_TOKEN=/d' "$ENV_FILE"
else
    echo "Creating new .env file: $ENV_FILE"
fi

echo "CRON_SECRET_TOKEN=$CRON_TOKEN" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo -e "${GREEN}✓ Token saved to: $ENV_FILE${NC}"

echo ""
echo -e "${BLUE}Step 5: Setup Cron Job${NC}"
echo ""

CRON_URL="https://$API_DOMAIN$API_PATH?token=$CRON_TOKEN"

echo "Cron URL: $CRON_URL"
echo ""
echo "Add this line to your crontab (run 'crontab -e'):"
echo ""
echo -e "${YELLOW}*/5 * * * * curl -s -X GET \"$CRON_URL\" >> /var/log/subscription_renewal.log 2>&1${NC}"
echo ""

# Ask if user wants to add to crontab
read -p "Do you want to add this to your crontab now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create a temporary cron job file
    TEMP_CRON=$(mktemp)
    crontab -l > "$TEMP_CRON" 2>/dev/null || true
    
    # Check if already exists
    if grep -q "subscription/process-renewals" "$TEMP_CRON"; then
        echo -e "${YELLOW}⚠ Cron job already exists in crontab${NC}"
    else
        # Add the new cron job
        echo "" >> "$TEMP_CRON"
        echo "# Subscription Renewal System - Runs every 5 minutes" >> "$TEMP_CRON"
        echo "*/5 * * * * curl -s -X GET \"$CRON_URL\" >> /var/log/subscription_renewal.log 2>&1" >> "$TEMP_CRON"
        
        # Install the new crontab
        crontab "$TEMP_CRON"
        echo -e "${GREEN}✓ Cron job added successfully${NC}"
    fi
    
    rm -f "$TEMP_CRON"
fi

echo ""
echo -e "${BLUE}Step 6: Create Log File${NC}"

LOG_FILE="/var/log/subscription_renewal.log"
if [ -w "/var/log" ]; then
    touch "$LOG_FILE"
    echo -e "${GREEN}✓ Log file created: $LOG_FILE${NC}"
else
    LOG_FILE="${HOME}/subscription_renewal.log"
    touch "$LOG_FILE"
    echo -e "${GREEN}✓ Log file created: $LOG_FILE${NC}"
    echo -e "${YELLOW}⚠ Note: Using home directory due to /var/log permissions${NC}"
fi

echo ""
echo -e "${BLUE}Step 7: Test Cron Job${NC}"
echo ""
echo "Testing the renewal endpoint..."
RESPONSE=$(curl -s -X GET "$CRON_URL")
echo "Response: $RESPONSE"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! ✓                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Configuration Summary:${NC}"
echo "  API Domain:          $API_DOMAIN"
echo "  Cron Token:          ${CRON_TOKEN:0:10}... (saved)"
echo "  Database:            $DB_NAME @ $DB_HOST"
echo "  Log File:            $LOG_FILE"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Verify cron job is running: crontab -l"
echo "  2. Monitor logs: tail -f $LOG_FILE"
echo "  3. Check database: SELECT * FROM subscription_cron_logs LIMIT 10;"
echo "  4. Review documentation: SUBSCRIPTION_RENEWAL_SYSTEM.md"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  - Keep the cron token secure and confidential"
echo "  - Store token in environment variables only"
echo "  - Monitor cron execution logs regularly"
echo "  - Test with non-production data first"
echo ""
