#!/bin/bash

# Test Email to angelinoconrad@gmail.com
# Sending test to alternative email address

echo "📧 Testing Email to angelinoconrad@gmail.com"
echo "============================================"

# Test payload with angelinoconrad@gmail.com
TEST_PAYLOAD='{
  "txRef": "ANGELINO-TEST-'$(date +%s)'",
  "amount": 12500,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "angelino-test-item",
      "name": "Angelino Test Purchase",
      "price": 12500,
      "quantity": 1,
      "brand": "Xtrapush Test"
    }
  ]
}'

echo "📋 Test Details:"
echo "- Recipient: angelinoconrad@gmail.com"
echo "- Amount: MWK 12,500"
echo "- Item: Angelino Test Purchase"
echo ""

echo "🚀 Sending test notification..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n" \
  | jq '.'

echo ""
echo "✅ Test sent to angelinoconrad@gmail.com!"
echo "Please check this email address for the payment confirmation."
echo ""
echo "📋 Check in Gmail:"
echo "- Search for 'Payment Confirmation'"
echo "- Search for 'angelinoconrad@gmail.com'" 
echo "- Check Primary, Promotions, and Spam tabs"
echo "- Look for subject line containing 'Xtrapush'"