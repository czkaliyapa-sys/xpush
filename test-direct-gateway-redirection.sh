#!/bin/bash

# Test script to verify direct payment gateway redirection
# Ensures no frontend processing delays when clicking checkout

echo "🧪 Testing Direct Payment Gateway Redirection"
echo "============================================="
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

echo -e "${BLUE}Test 1: Square Checkout Session Creation${NC}"
echo "------------------------------------------"

# Test Square checkout creation - should return direct gateway URL
curl -X POST "$API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "direct-test-001",
        "name": "iPhone 16 Pro",
        "price": 119900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/iphone16pro.jpg",
        "brand": "Apple"
      }
    ],
    "customerEmail": "direct-test@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo -e "${BLUE}Expected Result:${NC}"
echo "✓ Should return checkout_url pointing directly to Square"
echo "✓ No processing delays or frontend redirects"
echo "✓ Immediate gateway redirection"
echo ""

echo -e "${BLUE}Test 2: PayChangu Checkout Session Creation${NC}"
echo "---------------------------------------------"

# Test PayChangu checkout creation - should return direct gateway URL
curl -X POST "$API_URL/payments/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "direct-test-mwk-001",
        "name": "Samsung Galaxy S24",
        "price": 1299000,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/s24.jpg",
        "brand": "Samsung"
      }
    ],
    "customerEmail": "direct-test-mwk@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "MWK"
  }' | jq '.'

echo ""
echo -e "${BLUE}Expected Result:${NC}"
echo "✓ Should return url pointing directly to PayChangu"
echo "✓ No processing delays or frontend redirects"
echo "✓ Immediate gateway redirection"
echo ""

echo -e "${BLUE}Manual Verification Steps:${NC}"
echo "=========================="
echo "1. Open the website in browser"
echo "2. Add items to cart"
echo "3. Click Checkout button"
echo "4. Observe: Should redirect IMMEDIATELY to payment gateway"
echo "5. No 'processing checkout' message should appear"
echo "6. No frontend loading or intermediate pages"
echo ""

echo -e "${GREEN}✅ Direct Payment Gateway Redirection Test Complete${NC}"
echo ""
echo "🔧 Changes Made:"
echo "- Removed setIsProcessing(true) calls from checkout handlers"
echo "- Removed setIsProcessing(false) calls from finally blocks"
echo "- Eliminated frontend processing delays"
echo "- Users now go directly to payment gateway on checkout click"
echo ""