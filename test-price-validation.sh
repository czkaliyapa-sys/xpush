#!/bin/bash

echo "🧪 Testing Price Validation Implementation"
echo "=========================================="
echo ""

# Test 1: Check if price validation utility exists
echo "📋 Test 1: Verifying price validation utility"
if [ -f "src/utils/priceValidation.js" ]; then
    echo "✅ Price validation utility exists"
    
    # Check for key functions
    if grep -q "isValidPriceForCheckout" src/utils/priceValidation.js; then
        echo "✅ isValidPriceForCheckout function found"
    else
        echo "❌ isValidPriceForCheckout function missing"
    fi
    
    if grep -q "isGadgetAvailableForPurchase" src/utils/priceValidation.js; then
        echo "✅ isGadgetAvailableForPurchase function found"
    else
        echo "❌ isGadgetAvailableForPurchase function missing"
    fi
else
    echo "❌ Price validation utility not found"
fi

echo ""

# Test 2: Check ItemCard3D integration
echo "📋 Test 2: Verifying ItemCard3D integration"
if grep -q "isGadgetAvailableForPurchase" src/external_components/ItemCard3D.tsx; then
    echo "✅ ItemCard3D imports price validation utility"
else
    echo "❌ ItemCard3D missing price validation import"
fi

if grep -q "purchaseAvailability" src/external_components/ItemCard3D.tsx; then
    echo "✅ ItemCard3D uses purchase availability check"
else
    echo "❌ ItemCard3D missing purchase availability logic"
fi

echo ""

# Test 3: Check validation logic
echo "📋 Test 3: Verifying validation logic"
if grep -q "if (!purchaseAvailability.isValid)" src/external_components/ItemCard3D.tsx; then
    echo "✅ Add to cart validation implemented"
else
    echo "❌ Add to cart validation missing"
fi

if grep -q "opacity: purchaseAvailability.isValid" src/external_components/ItemCard3D.tsx; then
    echo "✅ UI feedback for invalid prices implemented"
else
    echo "❌ UI feedback for invalid prices missing"
fi

echo ""

# Test 4: Check error messaging
echo "📋 Test 4: Verifying error messaging"
if grep -q "setSnackbarMessage(purchaseAvailability.reason)" src/external_components/ItemCard3D.tsx; then
    echo "✅ Error messaging implemented"
else
    echo "❌ Error messaging missing"
fi

echo ""
echo "🎯 Expected Behavior:"
echo "- Items with price 0.00 show 'Price not set' in buttons"
echo "- Add to cart is disabled for zero-priced items"
echo "- Installment button is visually disabled for zero-priced items"
echo "- Users see helpful error messages when trying to purchase zero-priced items"
echo "- Pre-order functionality still works for out-of-stock items"
echo ""

# Test 5: Create sample validation test
echo "📋 Test 5: Sample validation scenarios"

# Test valid price
node -e "
const { isValidPriceForCheckout, getPriceValidationError } = require('./src/utils/priceValidation.js');
console.log('MWK 1500:', isValidPriceForCheckout(1500, 'MWK') ? '✅ Valid' : '❌ Invalid');
console.log('GBP 50:', isValidPriceForCheckout(50, 'GBP') ? '✅ Valid' : '❌ Invalid');
console.log('MWK 0:', isValidPriceForCheckout(0, 'MWK') ? '✅ Valid' : '❌ Invalid');
console.log('GBP 0:', isValidPriceForCheckout(0, 'GBP') ? '✅ Valid' : '❌ Invalid');
console.log('Error for MWK 0:', getPriceValidationError(0, 'MWK'));
"

echo ""
echo "✅ Price validation test completed!"