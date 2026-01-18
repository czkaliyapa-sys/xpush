#!/bin/bash

# High Priority Email Test
# Sends email with distinctive content to improve deliverability

echo "🚨 High Priority Email Test"
echo "============================"

# Test with very distinctive content to avoid filtering
HIGH_PRIORITY_PAYLOAD='{
  "txRef": "URGENT-TEST-'$(date +%s)'",
  "amount": 9999,
  "currency": "MWK",
  "customerEmail": "conradzikomo@gmail.com",
  "paymentStatus": "success",
  "items": [
    {
      "id": "urgent-test-item",
      "name": "URGENT: Payment Confirmation Required",
      "price": 9999,
      "quantity": 1,
      "brand": "XTRAPUSH URGENT"
    }
  ]
}'

echo "Sending high-priority test with distinctive content..."
curl -X POST "https://www.sparkle-pro.co.uk/api/payments/notify-success" \
  -H "Content-Type: application/json" \
  -d "$HIGH_PRIORITY_PAYLOAD" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  | jq '.'

echo ""
echo "📋 Action Items for You:"
echo "========================"
echo "1. ⏰ WAIT 5-10 minutes - emails can be delayed"
echo "2. 🔍 SEARCH Gmail for:"
echo "   - Subject: 'Payment Confirmation'"
echo "   - Subject: 'Xtrapush'"  
echo "   - Content: 'conradzikomo@gmail.com'"
echo "   - Content: 'MWK 9,999'"
echo "3. 📁 CHECK ALL Gmail locations:"
echo "   - Primary tab"
echo "   - Promotions tab"
echo "   - Social tab" 
echo "   - Spam/Junk folder"
echo "   - Trash (accidentally deleted)"
echo "4. ⚙️ CHECK Gmail settings:"
echo "   - Filters that might redirect emails"
echo "   - Blocked senders list"
echo "   - Forwarding settings"

echo ""
echo "If still not received after 15 minutes, we can:"
echo "- Test with a different email provider"
echo "- Check server email logs"
echo "- Verify DNS records (SPF, DKIM)"
echo "- Test SMTP configuration directly"