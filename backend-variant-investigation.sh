#!/bin/bash
#
# Backend Variant Data Investigation
# Determines why variant data isn't being returned by API
#

API_BASE="https://sparkle-pro.co.uk/api"

echo "🔍 BACKEND VARIANT DATA INVESTIGATION"
echo "===================================="
echo ""

# Test different API endpoints and parameters
echo "📋 Testing API endpoints for variant data..."
echo ""

# Test 1: Standard gadgets endpoint
echo "Test 1: Standard gadgets endpoint"
standard_response=$(curl -s "$API_BASE/gadgets?limit=1")
standard_has_variants=$(echo "$standard_response" | grep -c '"variants"')
echo "  Standard endpoint variants: $standard_has_variants"

# Test 2: Gadgets endpoint with include_variants parameter
echo ""
echo "Test 2: Gadgets with include_variants=true"
include_variants_response=$(curl -s "$API_BASE/gadgets?limit=1&include_variants=true")
include_variants_has=$(echo "$include_variants_response" | grep -c '"variants"')
echo "  With include_variants=true: $include_variants_has"

# Test 3: Specific gadget endpoint
echo ""
echo "Test 3: Specific gadget endpoint"
specific_response=$(curl -s "$API_BASE/gadgets/1")
specific_has_variants=$(echo "$specific_response" | grep -c '"variants"')
echo "  Specific gadget (/1) variants: $specific_has_variants"

# Test 4: Check if variants are stored in database differently
echo ""
echo "Test 4: Checking for alternative variant fields"

# Look for any array-like structures that might contain variant data
array_fields=$(echo "$standard_response" | grep -o '"[a-zA-Z_]*":\[' | grep -v 'specifications' | wc -l)
echo "  Array fields found: $array_fields"

# Check for nested objects that might contain variant info
nested_objects=$(echo "$standard_response" | grep -o '{[^{}]*"price"[^{}]*}' | wc -l)
echo "  Nested price objects: $nested_objects"

echo ""
echo "📋 Examining gadget specifications structure..."

# Look at specifications field more closely
specs_data=$(echo "$standard_response" | grep -A 20 '"specifications"')

if [ -n "$specs_data" ]; then
  echo "Specifications found:"
  echo "$specs_data" | head -10
  
  # Check if storage options are in specifications
  has_storage_specs=$(echo "$specs_data" | grep -c '"storage"')
  echo "Storage in specifications: $has_storage_specs"
  
  # Check for price variations in specifications
  spec_prices=$(echo "$specs_data" | grep -o '[0-9]*[ ]*GB' | wc -l)
  echo "Storage options mentioned: $spec_prices"
else
  echo "No specifications data found"
fi

echo ""
echo "📋 Checking database structure clues..."

# Look for any mention of variant-related terms
response_text=$(echo "$standard_response" | tr -d '{}[]"')
variant_terms=$(echo "$response_text" | grep -Eio 'variant|storage|condition|color' | wc -l)
echo "Variant-related terms in response: $variant_terms"

# Check for numeric patterns that might indicate variant pricing
numeric_values=$(echo "$standard_response" | grep -o '[0-9]*\.[0-9]*' | wc -l)
echo "Decimal values (potential prices): $numeric_values"

echo ""
echo "📋 Manual inspection suggestions:"

echo "Based on the data analysis:"
if [ "$standard_has_variants" -eq 0 ] && [ "$include_variants_has" -eq 0 ]; then
  echo "❌ Backend API is not returning variant data"
  echo "   Possible causes:"
  echo "   1. Variants not joined in database query"
  echo "   2. API endpoint missing variant inclusion logic"
  echo "   3. Database schema issue with variants table"
  echo ""
  echo "🔧 Recommended next steps:"
  echo "   1. Check sparkle-pro-api/index.php for gadget endpoints"
  echo "   2. Verify database JOIN with variants table"
  echo "   3. Add include_variants parameter support if missing"
  echo "   4. Test direct database query for variants"
elif [ "$has_storage_specs" -gt 0 ]; then
  echo "⚠️  Variants may be embedded in specifications rather than separate objects"
  echo "   Check if storage/condition options are in specifications field"
else
  echo "✅ Backend appears to support some variant-related data"
  echo "   Continue investigating data structure and processing"
fi

echo ""
echo "📋 Quick verification checklist:"
echo "□ Check if variants table exists in database"
echo "□ Verify gadget-variants foreign key relationship" 
echo "□ Confirm API query includes LEFT JOIN with variants table"
echo "□ Test if include_variants parameter is supported"
echo "□ Examine if variants are returned in specifications field instead"