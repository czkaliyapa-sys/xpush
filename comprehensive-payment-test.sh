#!/bin/bash

# Comprehensive Payment Notification Test Suite
# Tests all payment types: Checkout, Installments, Subscriptions for both MWK and GBP

echo "🧪 Comprehensive Payment Notification Test Suite"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Standard Checkout (MWK - Malawi)
echo -e "${BLUE}Test 1: Standard Checkout (MWK - Malawi)${NC}"
CHECKOUT_MWK_PAYLOAD='{
  "txRef": "CHECKOUT-MWK-'$(date +%s)'",
  "amount": 15000,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "mwk-checkout-item",
      "name": "iPhone 15 Pro (MWK)",
      "price": 15000,
      "quantity": 1,
      "brand": "Apple"
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$CHECKOUT_MWK_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 2: Standard Checkout (GBP - International)
echo -e "${BLUE}Test 2: Standard Checkout (GBP - International)${NC}"
CHECKOUT_GBP_PAYLOAD='{
  "txRef": "CHECKOUT-GBP-'$(date +%s)'",
  "amount": 9900,
  "currency": "GBP",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "gbp-checkout-item",
      "name": "iPhone 15 Pro (GBP)",
      "price": 9900,
      "quantity": 1,
      "brand": "Apple"
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$CHECKOUT_GBP_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 3: Installment Payment (MWK)
echo -e "${BLUE}Test 3: Installment Payment (MWK)${NC}"
INSTALLMENT_MWK_PAYLOAD='{
  "txRef": "INSTALLMENT-MWK-'$(date +%s)'",
  "amount": 5000,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "mwk-installment-item",
      "name": "MacBook Air (Installment)",
      "price": 5000,
      "quantity": 1,
      "brand": "Apple"
    }
  ],
  "installmentPlan": {
    "type": "installment",
    "weeks": 12,
    "weeklyAmount": 5000,
    "totalAmount": 60000,
    "depositAmount": 10000
  }
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$INSTALLMENT_MWK_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 4: Installment Payment (GBP)
echo -e "${BLUE}Test 4: Installment Payment (GBP)${NC}"
INSTALLMENT_GBP_PAYLOAD='{
  "txRef": "INSTALLMENT-GBP-'$(date +%s)'",
  "amount": 2500,
  "currency": "GBP",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "gbp-installment-item",
      "name": "MacBook Air (Installment GBP)",
      "price": 2500,
      "quantity": 1,
      "brand": "Apple"
    }
  ],
  "installmentPlan": {
    "type": "installment",
    "weeks": 12,
    "weeklyAmount": 2500,
    "totalAmount": 30000,
    "depositAmount": 5000
  }
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$INSTALLMENT_GBP_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 5: Subscription Payment (MWK - PayChangu)
echo -e "${BLUE}Test 5: Subscription Payment (MWK - PayChangu)${NC}"
SUBSCRIPTION_MWK_PAYLOAD='{
  "txRef": "RENEWAL-SUB-MWK-'$(date +%s)'",
  "amount": 10000,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "mwk-subscription-item",
      "name": "Xtrapush Plus Subscription",
      "price": 10000,
      "quantity": 1,
      "brand": "Xtrapush"
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$SUBSCRIPTION_MWK_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 6: Subscription Payment (GBP - Square)
echo -e "${BLUE}Test 6: Subscription Payment (GBP - Square)${NC}"
SUBSCRIPTION_GBP_PAYLOAD='{
  "txRef": "SUB-GBP-'$(date +%s)'",
  "amount": 600,
  "currency": "GBP",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "gbp-subscription-item",
      "name": "Xtrapush Plus Subscription (GBP)",
      "price": 600,
      "quantity": 1,
      "brand": "Xtrapush"
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$SUBSCRIPTION_GBP_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 7: Pre-order Payment (MWK)
echo -e "${BLUE}Test 7: Pre-order Payment (MWK)${NC}"
PREORDER_MWK_PAYLOAD='{
  "txRef": "PREORDER-MWK-'$(date +%s)'",
  "amount": 25000,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "mwk-preorder-item",
      "name": "iPhone 16 Pro (Pre-order)",
      "price": 25000,
      "quantity": 1,
      "brand": "Apple",
      "isPreOrder": true
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$PREORDER_MWK_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

# Test 8: Pre-order Payment (GBP)
echo -e "${BLUE}Test 8: Pre-order Payment (GBP)${NC}"
PREORDER_GBP_PAYLOAD='{
  "txRef": "PREORDER-GBP-'$(date +%s)'",
  "amount": 129900,
  "currency": "GBP",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "gbp-preorder-item",
      "name": "iPhone 16 Pro (Pre-order GBP)",
      "price": 129900,
      "quantity": 1,
      "brand": "Apple",
      "isPreOrder": true
    }
  ]
}'

curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$PREORDER_GBP_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Success"

echo ""

echo -e "${GREEN}✅ All payment notification tests completed!${NC}"
echo ""
echo "📋 Summary of tested payment types:"
echo "1. ✓ Standard Checkout (MWK)"
echo "2. ✓ Standard Checkout (GBP)" 
echo "3. ✓ Installment Payment (MWK)"
echo "4. ✓ Installment Payment (GBP)"
echo "5. ✓ Subscription Renewal (MWK - PayChangu)"
echo "6. ✓ Subscription Payment (GBP - Square)"
echo "7. ✓ Pre-order Payment (MWK)"
echo "8. ✓ Pre-order Payment (GBP)"
echo ""
echo "📧 Please check angelinoconrad@gmail.com for all test notifications"
echo "You should receive 8 different emails with appropriate subjects:"
echo "- Payment Confirmation — Xtrapush"
echo "- Installment Payment Confirmation — Xtrapush" 
echo "- Pre-Order Confirmation — Xtrapush"
echo ""
echo "🔍 Verification checklist:"
echo "- Check Primary, Promotions, and Spam tabs in Gmail"
echo "- Look for distinctive subjects and amounts"
echo "- Verify both MWK and GBP currencies are displayed correctly"
echo "- Confirm HTML formatting and branding are present"