#!/bin/bash

# Detailed Email Diagnostic Test
# Tests multiple scenarios to troubleshoot email delivery

echo "🔬 Email Delivery Diagnostic Test"
echo "==================================="

# Test 1: Basic connectivity test
echo "📡 Test 1: API Endpoint Connectivity"
curl -I "https://www.sparkle-pro.co.uk/api/health" -s -o /dev/null -w "Health endpoint: %{http_code}\n"

# Test 2: Send test to multiple addresses to verify routing
echo ""
echo "📧 Test 2: Sending to Multiple Test Addresses"

# Test payload with multiple recipients for comparison
TEST_PAYLOAD='{
  "txRef": "DIAGNOSTIC-TEST-'$(date +%s)'",
  "amount": 5000,
  "currency": "MWK",
  "customerEmail": "conradzikomo@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "diagnostic-test",
      "name": "Diagnostic Test Item",
      "price": 5000,
      "quantity": 1,
      "brand": "TestBrand"
    }
  ]
}'

echo "Sending diagnostic test..."
RESPONSE=$(curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
JSON_RESPONSE=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $JSON_RESPONSE"

# Test 3: Send to a known working email (if available)
echo ""
echo "📧 Test 3: Alternative Email Test"
ALT_TEST_PAYLOAD='{
  "txRef": "ALT-TEST-'$(date +%s)'",
  "amount": 7500,
  "currency": "MWK",
  "customerEmail": "conrad@itsxtrapush.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "alt-test",
      "name": "Alternative Test",
      "price": 7500,
      "quantity": 1,
      "brand": "AltBrand"
    }
  ]
}'

echo "Sending alternative test to conrad@itsxtrapush.com..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$ALT_TEST_PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "📋 Diagnostic Summary:"
echo "- Check your Gmail spam/junk folders"
echo "- Check Gmail Promotions tab" 
echo "- Check if emails are being filtered"
echo "- Verify SPF/DKIM records for domain"
echo "- Check if server IP is blacklisted"

echo ""
echo "🔧 Troubleshooting Steps:"
echo "1. Wait 5-10 minutes for email delivery"
echo "2. Check all Gmail tabs (Primary, Social, Promotions, Spam)"
echo "3. Search Gmail for 'Xtrapush' or 'Payment Confirmation'"
echo "4. Check Gmail filters that might redirect emails"
echo "5. Try the test again if still not received"