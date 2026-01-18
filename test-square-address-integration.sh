#!/bin/bash

# Test script to verify Square address integration is working
# Tests that delivery address form is hidden and profile address is used

echo "🧪 Testing Square Address Integration"
echo "====================================="
echo ""

# Configuration
API_URL="https://sparkle-pro.co.uk/api"
SUCCESS_URL="https://itsxtrapush.com/payment/success"
CANCEL_URL="https://itsxtrapush.com/payment/cancel"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Test 1: Square Checkout Creation with User Profile Address${NC}"
echo "------------------------------------------------------------"

# Test Square checkout creation with a test user that should have profile address
TEST_USER_EMAIL="test-profile-address@itsxtrapush.com"
TEST_USER_UID="test-user-with-address-123"

# Create a test checkout session with user ID to trigger profile address lookup
curl -X POST "$API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-address-001",
        "name": "iPhone 16 Pro Max",
        "price": 129900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/iphone16promax.jpg",
        "brand": "Apple"
      }
    ],
    "customerEmail": "'"$TEST_USER_EMAIL"'",
    "userUid": "'"$TEST_USER_UID"'",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo -e "${BLUE}Expected Results:${NC}"
echo "✓ ask_for_shipping_address should be false in checkout_options"
echo "✓ shippingAddress should be stored in square_sessions.json"
echo "✓ User should NOT see delivery address form during checkout"
echo ""

echo -e "${BLUE}Test 2: Verify Square Configuration${NC}"
echo "-------------------------------------"

curl -X GET "$API_URL/payments/square/config" | jq '.'

echo ""
echo -e "${BLUE}Expected Results:${NC}"
echo "✓ checkoutOptions.ask_for_shipping_address should be false"
echo "✓ checkoutOptions.address_fields_removed should be true"
echo ""

echo -e "${BLUE}Manual Verification Steps:${NC}"
echo "=========================="
echo "1. Complete a test purchase using the checkout URL from Test 1"
echo "2. Verify NO delivery address form appears during Square checkout"
echo "3. Check that the order in database has the user's profile address"
echo "4. Verify shipping_address field is populated from user profile"
echo ""

echo -e "${GREEN}✅ Square Address Integration Test Script Complete${NC}"
echo ""
echo "🔧 Key Changes Made:"
echo "- Disabled ask_for_shipping_address in Square checkout"
echo "- Added shipping address fetching from user profile"
echo "- Store profile address in square_sessions.json"
echo "- Use session address when creating orders"
echo "- Added get_square_session_by_ref() helper function"
echo ""