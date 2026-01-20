-- Check current pre-order setup status
-- Run this to see what's already configured

-- Check if the column exists
SELECT 
    'Column Check' as check_type,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'gadgets' 
AND COLUMN_NAME = 'is_pre_order';

-- Check if triggers exist
SELECT 
    'Trigger Check' as check_type,
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE() 
AND TRIGGER_NAME LIKE '%gadget%'
ORDER BY TRIGGER_NAME;

-- Check current pre-order status of gadgets
SELECT 
    'Pre-order Status' as check_type,
    id,
    name,
    in_stock,
    is_pre_order,
    has_variants,
    total_variant_stock,
    (SELECT COUNT(*) FROM gadget_variants WHERE gadget_id = gadgets.id AND is_active = 1) as active_variants,
    (SELECT COUNT(*) FROM gadget_variants WHERE gadget_id = gadgets.id AND is_active = 1 AND stock_quantity = 0) as zero_stock_variants
FROM gadgets 
WHERE has_variants = 1
ORDER BY id;

-- Check if RefreshGadgetVariantData procedure exists
SELECT 
    'Procedure Check' as check_type,
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME = 'RefreshGadgetVariantData';