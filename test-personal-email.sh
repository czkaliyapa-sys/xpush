#!/bin/bash

# Test Email Notification to Conrad's Personal Email
# Sends a test notification to conradzikomo@gmail.com

echo "📧 Testing Email Notification to conradzikomo@gmail.com"
echo "====================================================="

# Test payload with your email address
TEST_PAYLOAD='{
  "txRef": "PERSONAL-TEST-'$(date +%s)'",
  "amount": 15000,
  "currency": "MWK", 
  "customerEmail": "conradzikomo@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "personal-test-item",
      "name": "iPhone 15 Pro Test",
      "price": 15000,
      "quantity": 1,
      "brand": "Apple"
    }
  ]
}'

echo "📋 Test Details:"
echo "- Recipient: conradzikomo@gmail.com"
echo "- Amount: MWK 15,000"
echo "- Item: iPhone 15 Pro Test"
echo ""

echo "🚀 Sending test notification to your email..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\n\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n" \
  | jq '.'

echo ""
echo "✅ Test sent! Please check your conradzikomo@gmail.com inbox."
echo "You should receive a payment confirmation email shortly."