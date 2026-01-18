#!/bin/bash

# Payment API Test Script - Production Environment
# Tests various payment endpoints on itsxtrapush.com

echo "🚀 Testing Payment APIs - Production Environment"
echo "=================================================="

# Base URLs
PROD_API_URL="https://sparkle-pro.co.uk/api"
SUCCESS_URL="https://itsxtrapush.com/payment/success"
CANCEL_URL="https://itsxtrapush.com/payment/cancel"

echo "🔧 Testing Configuration:"
echo "- API Base URL: $PROD_API_URL"
echo "- Success URL: $SUCCESS_URL"
echo "- Cancel URL: $CANCEL_URL"
echo ""

# Test 1: PayChangu Checkout Session (Malawi - MWK)
echo "💳 Test 1: Creating PayChangu Checkout Session (MWK)"
curl -X POST "$PROD_API_URL/payments/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "prod-item-001",
        "name": "iPhone 15 Pro Max",
        "price": 2500000,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/iphone15promax.jpg",
        "brand": "Apple"
      },
      {
        "id": "delivery_fee",
        "name": "Standard Delivery",
        "price": 5000,
        "quantity": 1,
        "isDeliveryFee": true
      }
    ],
    "customerEmail": "customer-prod@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "MWK",
    "gateway": "paychangu"
  }' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Test 2: Square Checkout Session (International - GBP)
echo "💳 Test 2: Creating Square Checkout Session (GBP)"
curl -X POST "$PROD_API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "prod-item-002",
        "name": "Samsung Galaxy S24 Ultra",
        "price": 129900,
        "quantity": 1,
        "image": "https://sparkle-pro.co.uk/api/images/s24ultra.jpg",
        "brand": "Samsung"
      },
      {
        "id": "delivery_fee",
        "name": "Standard Postage",
        "price": 499,
        "quantity": 1,
        "isDeliveryFee": true
      }
    ],
    "customerEmail": "international-prod@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Test 3: Subscription Creation (Square - requires card)
echo "💳 Test 3: Creating Square Subscription (should require card)"
curl -X POST "$PROD_API_URL/subscriptions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "prod-user-123",
    "customerEmail": "subscriber-prod@itsxtrapush.com",
    "customerName": "Production Subscriber",
    "successUrl": "'"$SUCCESS_URL"'",
    "currency": "GBP",
    "tier": "plus",
    "gateway": "square"
  }' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Test 4: Subscription Creation (PayChangu - Malawi)
echo "💳 Test 4: Creating PayChangu Subscription"
curl -X POST "$PROD_API_URL/subscriptions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "prod-user-456",
    "customerEmail": "mw-subscriber-prod@itsxtrapush.com",
    "customerName": "MW Production Subscriber",
    "successUrl": "'"$SUCCESS_URL"'",
    "currency": "MWK",
    "tier": "premium",
    "gateway": "paychangu"
  }' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Test 5: Square Config Endpoint
echo "⚙️ Test 5: Getting Square Configuration"
curl -X GET "$PROD_API_URL/payments/square/config" | jq '.'

echo ""
echo "========================================"
echo "✅ Production Payment Tests Completed"
echo "Note: Some tests may show errors (expected for subscription without card)"