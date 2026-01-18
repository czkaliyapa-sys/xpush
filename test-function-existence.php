<?php
// Simple test to verify the variant functions exist and can be parsed
echo "🧪 FUNCTION EXISTENCE TEST\n";
echo "=========================\n\n";

// Read the index.php file and check if our functions exist
$content = file_get_contents('sparkle-pro-api/index.php');

// Check for our added functions
$functionsToCheck = [
    'get_variants_for_gadgets',
    'gadgets_list'
];

foreach ($functionsToCheck as $function) {
    if (strpos($content, "function $function") !== false) {
        echo "✅ Function '$function' found in index.php\n";
    } else {
        echo "❌ Function '$function' NOT found in index.php\n";
    }
}

// Check for our variant processing code
$processingIndicators = [
    'NEW: Add variant data to each gadget',
    'variantsMap = get_variants_for_gadgets',
    'lowest_variant_price',
    'total_variant_stock'
];

echo "\n📋 VARIANT PROCESSING CODE CHECK:\n";
foreach ($processingIndicators as $indicator) {
    if (strpos($content, $indicator) !== false) {
        echo "✅ Found: '$indicator'\n";
    } else {
        echo "❌ Missing: '$indicator'\n";
    }
}

echo "\n📋 NEXT STEPS:\n";
echo "1. Upload the modified index.php to production server\n";
echo "2. Clear any server caches\n";
echo "3. Test with curl to verify variant data is returned\n";
echo "4. Verify frontend components receive variant information\n";

echo "\n🔧 QUICK DEPLOYMENT CHECKLIST:\n";
echo "□ Copy sparkle-pro-api/index.php to production\n";
echo "□ Verify file permissions are correct\n";
echo "□ Test API endpoint: curl -s \"https://sparkle-pro.co.uk/api/gadgets?limit=1\"\n";
echo "□ Check response contains 'variants' field\n";
echo "□ Verify ItemCard3D components show variant-based prices\n";
?>