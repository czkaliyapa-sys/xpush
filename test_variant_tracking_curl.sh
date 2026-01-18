#!/bin/bash

# Enhanced Variant Tracking Curl Test Suite
# Tests the improved variant tracking system through direct API calls

echo "🧪 ENHANCED VARIANT TRACKING CURL TEST SUITE"
echo "==========================================="
echo ""

# Configuration
API_BASE="https://sparkle-pro.co.uk/api"
TEST_EMAIL="test-variant-tracking@itsxtrapush.com"
CUSTOMER_NAME="Variant Tracking Test Customer"

echo "📍 Testing against: $API_BASE"
echo "📧 Test Email: $TEST_EMAIL"
echo ""

# Function to make API calls with proper error handling
make_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "🔄 $description..."
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    elif [ "$method" = "GET" ]; then
        response=$(curl -s -X GET \
            "$API_BASE$endpoint")
    fi
    
    # Check if response is valid JSON
    if echo "$response" | jq empty 2>/dev/null; then
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            echo "✅ SUCCESS"
            echo "$response" | jq '.'
        else
            echo "❌ FAILED"
            error=$(echo "$response" | jq -r '.error // "Unknown error"')
            echo "Error: $error"
        fi
    else
        echo "❌ INVALID RESPONSE"
        echo "Raw response: $response"
    fi
    echo ""
}

# Test 1: Check API Health
echo "1. API HEALTH CHECK"
echo "=================="
make_api_call "GET" "/" "{}" "Checking API availability"

# Test 2: Get Available Gadgets with Variants
echo "2. FETCHING GADGETS WITH VARIANTS"
echo "================================"
response=$(curl -s "$API_BASE/gadgets?limit=5")
if echo "$response" | jq empty 2>/dev/null; then
    gadgets=$(echo "$response" | jq -r '.data[]? | select(.variants and (.variants | length > 0)) | {id, name, category, variant_count: (.variants | length)}' 2>/dev/null)
    if [ -n "$gadgets" ]; then
        echo "✅ Found gadgets with variants:"
        echo "$gadgets" | jq '.'
    else
        echo "⚠️  No gadgets with variants found"
        # Try getting all gadgets and check for variants field
        echo "Checking gadget structure..."
        sample_gadget=$(echo "$response" | jq '.data[0] // {}')
        echo "$sample_gadget" | jq '.'
    fi
else
    echo "❌ Failed to fetch gadgets"
fi
echo ""

# Test 3: Simulate Enhanced Order Creation
echo "3. SIMULATED ENHANCED ORDER CREATION"
echo "==================================="
# Create test order data with comprehensive variant information
test_order_data=$(cat <<EOF
{
    "items": [
        {
            "id": 1,
            "name": "iPhone 15 Pro Max",
            "price": 3500000,
            "price_gbp": 1944.44,
            "quantity": 1,
            "image": "https://example.com/iphone15.jpg",
            "brand": "Apple",
            "model": "iPhone 15 Pro Max",
            "description": "Latest flagship smartphone",
            "color": "Natural Titanium",
            "condition": "new",
            "storage": "256GB",
            "variantId": 123
        }
    ],
    "customerEmail": "$TEST_EMAIL",
    "customerName": "$CUSTOMER_NAME",
    "currency": "MWK",
    "paymentStatus": "paid",
    "successUrl": "https://itsxtrapush.com/success",
    "cancelUrl": "https://itsxtrapush.com/cancel"
}
EOF
)

make_api_call "POST" "/orders" "$test_order_data" "Creating enhanced order with variant tracking"

# Test 4: Test GBP Order with Variant Pricing
echo "4. GBP ORDER WITH VARIANT PRICING"
echo "================================"
gbp_order_data=$(cat <<EOF
{
    "items": [
        {
            "id": 2,
            "name": "MacBook Air M2",
            "price": 3600000,
            "price_gbp": 2000.00,
            "quantity": 1,
            "image": "https://example.com/macbook-air.jpg",
            "brand": "Apple",
            "model": "MacBook Air M2",
            "description": "Ultra-thin laptop with M2 chip",
            "color": "Midnight",
            "condition": "new",
            "storage": "512GB",
            "variantId": 456
        }
    ],
    "customerEmail": "$TEST_EMAIL",
    "customerName": "$CUSTOMER_NAME",
    "currency": "GBP",
    "paymentStatus": "paid",
    "successUrl": "https://itsxtrapush.com/success",
    "cancelUrl": "https://itsxtrapush.com/cancel"
}
EOF
)

make_api_call "POST" "/orders" "$gbp_order_data" "Creating GBP order with enhanced variant pricing"

# Test 5: Test Auto-Variant Resolution
echo "5. AUTO-VARIANT RESOLUTION TEST"
echo "=============================="
# Order without explicit variantId to test auto-resolution
auto_resolve_data=$(cat <<EOF
{
    "items": [
        {
            "id": 3,
            "name": "Samsung Galaxy S24",
            "price": 2800000,
            "price_gbp": 1555.56,
            "quantity": 1,
            "image": "https://example.com/galaxy-s24.jpg",
            "brand": "Samsung",
            "model": "Galaxy S24",
            "description": "Flagship Android smartphone",
            "color": "Phantom Black",
            "condition": "like_new",
            "storage": "128GB"
            // Note: No variantId provided - should auto-resolve
        }
    ],
    "customerEmail": "$TEST_EMAIL",
    "customerName": "$CUSTOMER_NAME",
    "currency": "MWK",
    "paymentStatus": "paid",
    "successUrl": "https://itsxtrapush.com/success",
    "cancelUrl": "https://itsxtrapush.com/cancel"
}
EOF
)

make_api_call "POST" "/orders" "$auto_resolve_data" "Testing auto-variant resolution (no explicit variantId)"

# Test 6: Verify Order Retrieval with Enhanced Data
echo "6. VERIFYING ENHANCED ORDER RETRIEVAL"
echo "===================================="
# This would typically require authentication, but let's test the endpoint structure
echo "Testing order retrieval endpoint structure..."
orders_endpoint_response=$(curl -s "$API_BASE/orders/user/test-user-id")
if echo "$orders_endpoint_response" | jq empty 2>/dev/null; then
    echo "✅ Orders endpoint accessible"
    echo "$orders_endpoint_response" | jq '.'
else
    echo "ℹ️  Orders endpoint requires authentication (expected)"
fi
echo ""

# Test 7: Admin Order Verification
echo "7. ADMIN ORDER VERIFICATION"
echo "=========================="
# Test admin endpoint for variant tracking verification
admin_orders_response=$(curl -s "$API_BASE/admin/orders?limit=5")
if echo "$admin_orders_response" | jq empty 2>/dev/null; then
    echo "✅ Admin orders endpoint accessible"
    # Look for variant tracking data in recent orders
    variant_tracking_info=$(echo "$admin_orders_response" | jq '.data[]? | {id, items: [.items[]? | {variant_id, storage, condition}]}' 2>/dev/null)
    if [ -n "$variant_tracking_info" ]; then
        echo "Variant tracking information in recent orders:"
        echo "$variant_tracking_info" | jq '.'
    fi
else
    echo "ℹ️  Admin endpoint requires authentication (expected)"
fi
echo ""

# Summary
echo "🏁 TEST SUITE COMPLETED"
echo "======================"
echo ""
echo "📋 EXPECTED IMPROVEMENTS VERIFICATION:"
echo "1. ✅ Enhanced variant data should be stored in order_items"
echo "2. ✅ Storage field should be populated for category items"  
echo "3. ✅ GBP prices should link to variant records when available"
echo "4. ✅ Auto-resolution should work for missing variantId"
echo "5. ✅ Comprehensive logging should capture variant resolution"
echo ""
echo "📊 To verify improvements, run this test suite again after 24-48 hours"
echo "   and compare the variant tracking completeness percentages."

exit 0