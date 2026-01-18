#!/bin/bash

# Payment API Test Script - Development Environment
# Tests various payment endpoints on localhost:3001

echo "🚀 Testing Payment APIs - Development Environment"
echo "=================================================="

# Base URLs
DEV_API_URL="https://www.sparkle-pro.co.uk/api"
SUCCESS_URL="http://localhost:3001/payment/success"
CANCEL_URL="http://localhost:3001/payment/cancel"

echo "🔧 Testing Configuration:"
echo "- API Base URL: $DEV_API_URL"
echo "- Success URL: $SUCCESS_URL"
echo "- Cancel URL: $CANCEL_URL"
echo ""

# Test 1: PayChangu Checkout Session (Malawi - MWK)
echo "💳 Test 1: Creating PayChangu Checkout Session (MWK)"
curl -X POST "$DEV_API_URL/payments/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-001",
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
    "customerEmail": "customer-dev@itsxtrapush.com",
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
curl -X POST "$DEV_API_URL/payments/square/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item-002",
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
    "customerEmail": "international-dev@itsxtrapush.com",
    "successUrl": "'"$SUCCESS_URL"'",
    "cancelUrl": "'"$CANCEL_URL"'",
    "currency": "GBP"
  }' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Test 3: Subscription Creation (Square - requires card)
echo "💳 Test 3: Creating Square Subscription (should require card)"
curl -X POST "$DEV_API_URL/subscriptions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "test-user-123",
    "customerEmail": "subscriber-dev@itsxtrapush.com",
    "customerName": "Test Subscriber",
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
curl -X POST "$DEV_API_URL/subscriptions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "test-user-456",
    "customerEmail": "mw-subscriber-dev@itsxtrapush.com",
    "customerName": "MW Subscriber",
    "successUrl": "'"$SUCCESS_URL"'",
    "currency": "MWK",
    "tier": "premium",
    "gateway": "paychangu"
  }' | jq '.'

echo ""
echo "========================================"
echo "✅ Development Payment Tests Completed"
echo "Note: Some tests may show errors (expected for subscription without card)"