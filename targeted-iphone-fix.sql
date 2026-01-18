-- Targeted Fix for iPhone 16 Pro Max Pricing Issue
-- This specifically addresses the remaining gadget with non-zero base price

USE itsxtrapush_db;

-- Force the specific iPhone to have zero base prices
UPDATE gadgets 
SET 
    price = 0.00,
    price_gbp = 0.00,
    monthly_price = 0.00,
    monthly_price_gbp = 0.00
WHERE id = 5;  -- iPhone 16 Pro Max

-- Verify the fix was applied
SELECT 
    id,
    name,
    price,
    price_gbp,
    has_variants,
    total_variant_stock
FROM gadgets 
WHERE id = 5;

-- Also check that the variant-based pricing is working correctly
SELECT 
    gv.id as variant_id,
    gv.color,
    gv.storage,
    gv.price,
    gv.price_gbp,
    gv.stock_quantity
FROM gadget_variants gv
WHERE gv.gadget_id = 5 AND gv.is_active = 1;

COMMIT;