#!/bin/bash
#
# Detailed Variant Pricing Verification
# Examines actual gadget data to verify variant pricing is working
#

API_BASE="https://sparkle-pro.co.uk/api"

echo "🔬 DETAILED VARIANT PRICING VERIFICATION"
echo "======================================"
echo ""

# Get multiple gadgets to analyze pricing patterns
echo "📋 Fetching gadget data for analysis..."
gadgets_data=$(curl -s "$API_BASE/gadgets?limit=10")

echo "Raw response length: $(echo "$gadgets_data" | wc -c) characters"
echo ""

# Extract gadget IDs and basic info
echo "📋 Analyzing gadget data structure..."
gadget_count=$(echo "$gadgets_data" | grep -o '"id":[0-9]*' | wc -l)
echo "Found $gadget_count gadgets"

# Look for price variations that suggest variants
echo ""
echo "📋 Checking for variant-like pricing patterns..."

# Extract all prices
prices=$(echo "$gadgets_data" | grep -o '"price":[0-9]*' | grep -o '[0-9]*$' | sort -n)

if [ -n "$prices" ]; then
  echo "Price range: $(echo "$prices" | head -1) - $(echo "$prices" | tail -1)"
  unique_prices=$(echo "$prices" | sort -u | wc -l)
  total_prices=$(echo "$prices" | wc -l)
  echo "Unique prices: $unique_prices out of $total_prices total prices"
  
  if [ "$unique_prices" -lt "$total_prices" ]; then
    echo "✅ Price clustering detected (suggests variant pricing)"
  else
    echo "ℹ️  All prices appear unique"
  fi
else
  echo "⚠️  No price data found"
fi

echo ""
echo "📋 Examining individual gadget records..."

# Look at first few gadgets in detail
first_gadgets=$(echo "$gadgets_data" | grep -A 15 '"id":' | head -20)

echo "Sample gadget structure:"
echo "$first_gadgets" | head -10

# Check for variant-related fields
echo ""
echo "📋 Checking for variant support fields..."

has_variants_field=$(echo "$gadgets_data" | grep -c '"variants"')
has_variant_id=$(echo "$gadgets_data" | grep -c '"variant_id"')
has_storage=$(echo "$gadgets_data" | grep -c '"storage"')
has_condition=$(echo "$gadgets_data" | grep -c '"condition"')

echo "Fields found:"
echo "  - variants: $has_variants_field occurrences"
echo "  - variant_id: $has_variant_id occurrences"  
echo "  - storage: $has_storage occurrences"
echo "  - condition: $has_condition occurrences"

echo ""
echo "📋 Testing specific gadget with known variants..."

# Try to find a gadget that likely has variants by checking category
iphone_data=$(echo "$gadgets_data" | grep -A 10 '"category":"smartphones"' | head -1)

if [ -n "$iphone_data" ]; then
  echo "✅ Found smartphone category item"
  gadget_id=$(echo "$iphone_data" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
  echo "Testing gadget ID: $gadget_id"
  
  # Try to get this specific gadget's details
  specific_gadget=$(curl -s "$API_BASE/gadgets/$gadget_id")
  
  echo "Specific gadget data length: $(echo "$specific_gadget" | wc -c) characters"
  
  # Check if it has variants array
  has_variants_array=$(echo "$specific_gadget" | grep -c '"variants":\[')
  if [ "$has_variants_array" -gt 0 ]; then
    echo "✅ Gadget includes variants array"
    
    # Count variants
    variant_objects=$(echo "$specific_gadget" | grep -o '{[^}]*"price"[^}]*}' | wc -l)
    echo "Estimated variant objects: $variant_objects"
  else
    echo "⚠️  No variants array found in gadget details"
  fi
else
  echo "⚠️  No smartphone category items found"
fi

echo ""
echo "📋 Summary Analysis"

echo "Key findings:"
if [ "$has_variants_field" -gt 0 ]; then
  echo "  ✅ System supports variants data structure"
else
  echo "  ⚠️  No variants field found in response"
fi

if [ "$unique_prices" -lt "$total_prices" ] 2>/dev/null; then
  echo "  ✅ Price clustering suggests variant-based pricing logic"
else
  echo "  ℹ️  Pricing appears fixed (may need variant processing)"
fi

if [ -n "$gadget_id" ]; then
  echo "  ✅ Successfully identified test gadget: $gadget_id"
else
  echo "  ⚠️  Could not identify suitable test gadget"
fi

echo ""
echo "💡 Recommendations:"

if [ "$has_variants_field" -gt 0 ] && [ "$has_variants_array" -gt 0 ] 2>/dev/null; then
  echo "✅ Backend variant support is working"
  echo "   Next: Verify frontend processing uses variant data correctly"
elif [ "$has_variants_field" -gt 0 ]; then
  echo "⚠️  Backend returns variants field but may be empty"
  echo "   Check if variants are properly populated in database"
else
  echo "❌ Backend may not be returning variant data"
  echo "   Verify API endpoint includes variants in response"
fi

echo ""
echo "🔧 To manually verify variant processing:"
echo "1. Visit https://itsxtrapush.com/gadgets"
echo "2. Inspect browser console for variant processing logs"
echo "3. Check if ItemCard3D components show varying prices"
echo "4. Verify stock counts reflect total variant inventory"