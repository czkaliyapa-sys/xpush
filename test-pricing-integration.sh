#!/bin/bash

# Test script to verify pricing information is correctly passed to payment gateways
# This validates that delivery fees and subscription fees appear in checkout sessions

echo "🧪 Testing Payment Gateway Pricing Integration"
echo "==============================================="
echo ""

# Configuration
DEV_API_URL="https://sparkle-pro.co.uk/api"
SUCCESS_URL="https://itsxtrapush.com/payment/success"
CANCEL_URL="https://itsxtrapush.com/payment/cancel"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Square Checkout Session with Delivery Fee and Subscription${NC}"
echo "-------------------------------------------------------------------"

# Test 1: Square Checkout with Delivery Fee (International - GBP)
echo -e "${YELLOW}Test 1: Square Checkout with Delivery Fee (GBP)${NC}"
curl -X POST "$DEV_API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-pricing-001",
        "name": "iPhone 16 Pro Max",
        "price": 129900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/iphone16promax.jpg",
        "brand": "Apple"
      },
      {
        "id": "delivery_fee",
        "name": "Standard Postage",
        "price": 499,
        "quantity": 1,
        "isDeliveryFee": true
      }
    ],
    "customerEmail": "pricing-test-international@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo -e "${BLUE}Testing Square Checkout with Subscription${NC}"
echo "-------------------------------------------"

# Test 2: Square Checkout with Subscription (International - GBP)
echo -e "${YELLOW}Test 2: Square Checkout with Subscription (GBP)${NC}"
curl -X POST "$DEV_API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-subscription-001",
        "name": "Samsung Galaxy S24 Ultra",
        "price": 119900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/s24ultra.jpg",
        "brand": "Samsung"
      },
      {
        "id": "subscription_plus",
        "name": "Xtrapush Plus (Monthly)",
        "price": 600,
        "quantity": 1,
        "isSubscription": true,
        "note": "Free delivery, insurance & discounts - Monthly subscription"
      }
    ],
    "customerEmail": "subscription-test-international@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo -e "${BLUE}Testing Square Checkout with Both Fees${NC}"
echo "---------------------------------------"

# Test 3: Square Checkout with Both Delivery Fee and Subscription
echo -e "${YELLOW}Test 3: Square Checkout with Both Fees (GBP)${NC}"
curl -X POST "$DEV_API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-combo-001",
        "name": "MacBook Air M2",
        "price": 109900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/macbookairm2.jpg",
        "brand": "Apple"
      },
      {
        "id": "delivery_fee",
        "name": "Standard Postage",
        "price": 499,
        "quantity": 1,
        "isDeliveryFee": true
      },
      {
        "id": "subscription_premium",
        "name": "Xtrapush Premium (Monthly)",
        "price": 999,
        "quantity": 1,
        "isSubscription": true,
        "note": "Free delivery, insurance & discounts - Monthly subscription"
      }
    ],
    "customerEmail": "combo-test-international@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo -e "${BLUE}Testing PayChangu Checkout with Delivery Fee${NC}"
echo "----------------------------------------------"

# Test 4: PayChangu Checkout with Delivery Fee (Malawi - MWK)
echo -e "${YELLOW}Test 4: PayChangu Checkout with Delivery Fee (MWK)${NC}"
curl -X POST "$DEV_API_URL/payments/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-malawi-001",
        "name": "iPhone 15 Pro",
        "price": 999000,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/iphone15pro.jpg",
        "brand": "Apple"
      },
      {
        "id": "delivery_fee",
        "name": "Standard Delivery",
        "price": 2000,
        "quantity": 1,
        "isDeliveryFee": true
      }
    ],
    "customerEmail": "pricing-test-malawi@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "MWK"
  }' | jq '.'

echo ""
echo -e "${BLUE}Testing PayChangu Checkout with Subscription${NC}"
echo "----------------------------------------------"

# Test 5: PayChangu Checkout with Subscription (Malawi - MWK)
echo -e "${YELLOW}Test 5: PayChangu Checkout with Subscription (MWK)${NC}"
curl -X POST "$DEV_API_URL/payments/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-malawi-sub-001",
        "name": "Samsung Galaxy Tab S9",
        "price": 799000,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/galaxytabs9.jpg",
        "brand": "Samsung"
      },
      {
        "id": "subscription_plus",
        "name": "Xtrapush Plus (Monthly)",
        "price": 6000,
        "quantity": 1,
        "isSubscription": true,
        "note": "Free delivery, insurance & discounts - Monthly subscription"
      }
    ],
    "customerEmail": "subscription-test-malawi@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "MWK"
  }' | jq '.'

echo ""
echo -e "${GREEN}✅ Pricing Integration Tests Complete${NC}"
echo "====================================="
echo ""
echo "Expected Results:"
echo "- ✅ Delivery fees should appear as separate line items in checkout"
echo "- ✅ Subscription fees should appear as separate line items in checkout"  
echo "- ✅ Both fees should be visible in the payment gateway interface"
echo "- ✅ Total amounts should include all fees correctly"
echo ""
echo "Next Steps:"
echo "1. Verify that the frontend CartModal now passes fees correctly"
echo "2. Test actual checkout flow from the website"
echo "3. Confirm fees appear in success page breakdown"