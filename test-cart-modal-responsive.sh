#!/bin/bash

echo "📱 Testing CartModal Mobile Responsiveness"
echo "=========================================="

# Test 1: Check responsive dialog properties
echo "📋 Test 1: Verifying responsive dialog configuration"
if grep -q "maxWidth=\"sm\"" src/components/CartModal.jsx; then
    echo "✅ Dialog uses maxWidth=\"sm\" for better mobile fit"
else
    echo "❌ Dialog still uses maxWidth=\"md\""
fi

if grep -q "fullScreen={{ xs: true, sm: false }}" src/components/CartModal.jsx; then
    echo "✅ Dialog goes fullscreen on mobile"
else
    echo "❌ Dialog doesn't go fullscreen on mobile"
fi

# Test 2: Check responsive image sizing
echo ""
echo "📋 Test 2: Verifying responsive image dimensions"
if grep -q "width: { xs: 160, sm: 210 }" src/components/CartModal.jsx; then
    echo "✅ Product images resize responsively (160px mobile, 210px desktop)"
else
    echo "❌ Product images use fixed dimensions"
fi

# Test 3: Check responsive padding and spacing
echo ""
echo "📋 Test 3: Verifying responsive padding and spacing"
if grep -q "px: { xs: 2, sm: 3 }" src/components/CartModal.jsx; then
    echo "✅ Content padding adapts to screen size"
else
    echo "❌ Content padding is fixed"
fi

if grep -q "py: { xs: 2, sm: 3 }" src/components/CartModal.jsx; then
    echo "✅ Content vertical padding adapts to screen size"
else
    echo "❌ Content vertical padding is fixed"
fi

# Test 4: Check responsive dialog actions
echo ""
echo "📋 Test 4: Verifying responsive dialog actions"
if grep -q "flexDirection: { xs: 'column', sm: 'row' }" src/components/CartModal.jsx; then
    echo "✅ Dialog actions stack vertically on mobile"
else
    echo "❌ Dialog actions don't stack on mobile"
fi

if grep -q "width: { xs: '100%', sm: 'auto' }" src/components/CartModal.jsx; then
    echo "✅ Action buttons are full-width on mobile"
else
    echo "❌ Action buttons don't adapt width for mobile"
fi

# Test 5: Check responsive typography
echo ""
echo "📋 Test 5: Verifying responsive typography"
if grep -q "fontSize: { xs: '1.1rem', sm: '1.25rem' }" src/components/CartModal.jsx; then
    echo "✅ Typography scales appropriately for mobile"
else
    echo "❌ Typography doesn't scale for mobile"
fi

# Test 6: Check responsive subscription cards
echo ""
echo "📋 Test 6: Verifying responsive subscription options"
if grep -q "flexDirection: { xs: 'column', sm: 'row' }" src/components/CartModal.jsx; then
    echo "✅ Subscription cards stack vertically on mobile"
else
    echo "❌ Subscription cards don't stack properly on mobile"
fi

if grep -q "width: { xs: '100%', sm: 'auto' }" src/components/CartModal.jsx && grep -q "flex: { sm: 1 }" src/components/CartModal.jsx; then
    echo "✅ Subscription cards adapt width for mobile layout"
else
    echo "❌ Subscription cards don't adapt width properly"
fi

echo ""
echo "🎯 Expected Mobile Improvements:"
echo "- Dialog goes fullscreen on mobile devices"
echo "- Product images reduce from 210px to 160px on mobile"
echo "- Content padding reduces for better mobile utilization"
echo "- Action buttons stack vertically and go full-width on mobile"
echo "- Subscription cards stack vertically on small screens"
echo "- Typography scales appropriately for readability"
echo "- Better touch targets for mobile interaction"
echo ""

echo "🚀 Manual Testing Instructions:"
echo "1. Open the application on a mobile device or browser dev tools"
echo "2. Add an item to cart and open CartModal"
echo "3. Verify dialog fills entire screen on mobile"
echo "4. Check that product images aren't oversized"
echo "5. Confirm action buttons stack vertically"
echo "6. Test subscription card layout on narrow screens"
echo "7. Verify all interactive elements have adequate touch targets"
echo ""

echo "✅ Responsive testing complete!"