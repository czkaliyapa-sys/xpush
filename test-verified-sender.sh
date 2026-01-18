#!/bin/bash

# Test with Verified Sender Email
# Using conrad@deegits.com as sender instead of no-reply@support.itsxtrapush.com

echo "📧 Testing with Verified Sender Email"
echo "====================================="

# Test payload using verified SMTP credentials as sender
TEST_PAYLOAD='{
  "txRef": "VERIFIED-SENDER-TEST-'$(date +%s)'",
  "amount": 8888,
  "currency": "MWK",
  "customerEmail": "angelinoconrad@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "verified-sender-test",
      "name": "Verified Sender Test",
      "price": 8888,
      "quantity": 1,
      "brand": "Xtrapush Verified"
    }
  ]
}'

echo "📋 Test Details:"
echo "- Recipient: angelinoconrad@gmail.com"
echo "- Amount: MWK 8,888"
echo "- Using verified SMTP credentials"
echo ""

echo "🚀 Sending test with verified sender..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n" \
  | jq '.'

echo ""
echo "📋 If this fails, we can:"
echo "1. Check if SPF records are configured for support.itsxtrapush.com"
echo "2. Use a different verified domain"
echo "3. Configure the mail server to accept the sender address"
echo "4. Test with direct SMTP connection to debug further"