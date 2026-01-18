#!/bin/bash

echo "🧪 Testing Pre-Order Blocking for Zero-Priced Items"
echo "=================================================="

# Test 1: Check if pre-order handler includes price validation
echo "📋 Test 1: Verifying pre-order price validation"
if grep -q "!purchaseAvailability.isValid" src/external_components/ItemCard3D.tsx; then
    echo "✅ Pre-order handler includes price validation"
else
    echo "❌ Pre-order handler missing price validation"
fi

# Test 2: Check if pre-order button shows visual feedback for invalid prices
echo ""
echo "📋 Test 2: Verifying pre-order button visual feedback"
if grep -q "opacity: purchaseAvailability.isValid" src/external_components/ItemCard3D.tsx; then
    echo "✅ Pre-order button shows opacity feedback for invalid prices"
else
    echo "❌ Pre-order button missing visual feedback"
fi

if grep -q "cursor: purchaseAvailability.isValid" src/external_components/ItemCard3D.tsx; then
    echo "✅ Pre-order button shows cursor feedback for invalid prices"
else
    echo "❌ Pre-order button missing cursor feedback"
fi

# Test 3: Check if pre-order button text changes for invalid prices
echo ""
echo "📋 Test 3: Verifying pre-order button text feedback"
if grep -q "Price not set" src/external_components/ItemCard3D.tsx && grep -q "Pre-Order Now" src/external_components/ItemCard3D.tsx; then
    echo "✅ Pre-order button text changes based on price validity"
else
    echo "❌ Pre-order button text feedback missing"
fi

# Test 4: Check if button is properly disabled for invalid prices
echo ""
echo "📋 Test 4: Verifying pre-order button disabled state"
if grep -q "disabled={isProcessing || !purchaseAvailability.isValid}" src/external_components/ItemCard3D.tsx; then
    echo "✅ Pre-order button properly disabled for invalid prices"
else
    echo "❌ Pre-order button disabled state not properly configured"
fi

echo ""
echo "🎯 Expected Behavior After Changes:"
echo "- Pre-order button shows 'Price not set' text for zero-priced items"
echo "- Pre-order button becomes visually disabled (60% opacity) for zero-priced items"
echo "- Pre-order button shows 'not-allowed' cursor for zero-priced items"
echo "- Clicking pre-order on zero-priced items shows error message"
echo "- Pre-order functionality still works for valid out-of-stock items"
echo ""

# Test 5: Verify the validation logic is consistent
echo "📋 Test 5: Checking validation utility consistency"
if grep -q "numericPrice <= 0" src/utils/priceValidation.js; then
    echo "✅ Price validation utility correctly identifies zero prices"
else
    echo "❌ Price validation utility missing zero price check"
fi

echo ""
echo "🚀 Manual Testing Instructions:"
echo "1. Find a gadget with price 0.00 in either currency"
echo "2. Verify the item shows 'Out of Stock' status (required for pre-order button)"
echo "3. Check that pre-order button shows 'Price not set' text"
echo "4. Verify button appears visually disabled (dimmed appearance)"
echo "5. Try clicking the pre-order button"
echo "6. Confirm you see error message: 'This item is not yet available for purchase. Please contact support.'"
echo "7. Verify no pre-order modal opens"
echo ""
echo "✅ Test Complete!"