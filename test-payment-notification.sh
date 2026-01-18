#!/bin/bash

# Test Payment Notification Endpoint
# This tests the /payments/notify-success endpoint directly

echo "📧 Testing Payment Notification Endpoint"
echo "======================================"

# Test payload mimicking what PaymentSuccess.jsx sends
TEST_PAYLOAD='{
  "txRef": "TEST-NOTIFY-'$(date +%s)'",
  "amount": 10000,
  "currency": "MWK",
  "customerEmail": "test-notification@itsxtrapush.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "test-item",
      "name": "Test Gadget",
      "price": 10000,
      "quantity": 1,
      "brand": "TestBrand"
    }
  ]
}'

echo "📋 Test Payload:"
echo "$TEST_PAYLOAD" | jq '.'

echo ""
echo "🚀 Sending test notification..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\n\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n" \
  | jq '.'

echo ""
echo "✅ Test completed"