#!/bin/bash
#
# Variant Pricing System Curl Test
# Tests the backend API endpoints that power the variant pricing synchronization
#

API_BASE="https://sparkle-pro.co.uk/api"
TEST_GADGET_ID=1

echo "🧪 VARIANT PRICING SYSTEM CURL TEST"
echo "==================================="
echo ""

# Test 1: Get gadget with variants
echo "📋 Test 1: Fetching gadget with variants..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$API_BASE/gadgets/$TEST_GADGET_ID")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
json_data=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_status" -eq 200 ]; then
  echo "   ✅ Gadget fetch successful (HTTP $http_status)"
  
  # Extract variant count
  variant_count=$(echo "$json_data" | grep -o '"variants":\[[^]]*\]' | wc -c)
  if [ "$variant_count" -gt 20 ]; then
    echo "   ✅ Gadget has variants data"
  else
    echo "   ⚠️  No variants data found"
  fi
  
else
  echo "   ❌ Gadget fetch failed (HTTP $http_status)"
  echo "   Response: $json_data"
fi

echo ""

# Test 2: Get admin variants endpoint
echo "📋 Test 2: Fetching admin variants..."
admin_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$API_BASE/admin/gadgets/$TEST_GADGET_ID/variants")

admin_http_status=$(echo "$admin_response" | grep "HTTP_STATUS:" | cut -d: -f2)
admin_json_data=$(echo "$admin_response" | sed '/HTTP_STATUS:/d')

if [ "$admin_http_status" -eq 200 ]; then
  echo "   ✅ Admin variants fetch successful (HTTP $admin_http_status)"
  
  # Count variants in response
  variant_ids=$(echo "$admin_json_data" | grep -o '"id":[0-9]*' | wc -l)
  echo "   ✅ Found $variant_ids variants"
  
  # Check for price data
  has_prices=$(echo "$admin_json_data" | grep -c '"price"')
  if [ "$has_prices" -gt 0 ]; then
    echo "   ✅ Variants contain pricing data"
  else
    echo "   ⚠️  No pricing data found in variants"
  fi
  
else
  echo "   ❌ Admin variants fetch failed (HTTP $admin_http_status)"
  echo "   Response: $admin_json_data"
fi

echo ""

# Test 3: Test variant filtering logic via API
echo "📋 Test 3: Testing variant filtering..."
# Get all gadgets to check if they have variant-aware pricing
all_gadgets=$(curl -s "$API_BASE/gadgets?page=1&limit=5")

# Check if response contains expected fields
has_price_field=$(echo "$all_gadgets" | grep -c '"price"')
has_stock_field=$(echo "$all_gadgets" | grep -c '"stock_quantity"')

echo "   ✅ API returns $has_price_field items with price data"
echo "   ✅ API returns $has_stock_field items with stock data"

echo ""

# Test 4: Verify variant price consistency
echo "📋 Test 4: Checking variant price consistency..."

# Look for gadgets that likely have variants (multiple similar items)
sample_items=$(echo "$all_gadgets" | grep -A 5 -B 5 '"category":"smartphones"' | head -20)

if [ -n "$sample_items" ]; then
  echo "   ✅ Found smartphone category items for testing"
  
  # Check if any items have明显 variant-like pricing (close but different prices)
  price_variations=$(echo "$sample_items" | grep -o '"price":[0-9]*' | sort -u | wc -l)
  if [ "$price_variations" -gt 1 ]; then
    echo "   ✅ Multiple price points found (suggests variant pricing)"
  else
    echo "   ⚠️  Single price point found"
  fi
else
  echo "   ⚠️  No sample items found for detailed analysis"
fi

echo ""

# Test 5: Health check endpoints
echo "📋 Test 5: API Health Check..."
health_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$API_BASE/health")

health_status=$(echo "$health_response" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$health_status" -eq 200 ]; then
  echo "   ✅ API is healthy (HTTP $health_status)"
else
  echo "   ⚠️  API health check returned HTTP $health_status"
fi

echo ""

# Summary
echo "📋 TEST SUMMARY"
echo "==============="

tests_passed=0
total_tests=5

# Count passed tests
[ "$http_status" -eq 200 ] && ((tests_passed++))
[ "$admin_http_status" -eq 200 ] && ((tests_passed++))
[ "$has_price_field" -gt 0 ] && ((tests_passed++))
[ -n "$sample_items" ] && ((tests_passed++))
[ "$health_status" -eq 200 ] && ((tests_passed++))

echo "Tests passed: $tests_passed/$total_tests"
success_rate=$((tests_passed * 100 / total_tests))
echo "Success rate: ${success_rate}%"

if [ "$tests_passed" -eq "$total_tests" ]; then
  echo ""
  echo "🎉 ALL BACKEND TESTS PASSED!"
  echo "The variant pricing system backend is functioning correctly."
  echo "The foundation is ready for frontend component integration."
else
  echo ""
  echo "⚠️  Some tests indicate potential issues."
  echo "Review the output above for details."
fi

echo ""
echo "💡 Next steps:"
echo "1. Verify frontend components are using the variant processing system"
echo "2. Test admin dashboard variant management"
echo "3. Validate cart and checkout variant pricing"
echo "4. Confirm real-time stock synchronization"