-- Complete the pre-order setup - apply only missing parts
-- This script assumes the column already exists and adds the remaining components

-- ==========================================
-- PART 1: Update existing gadgets to set initial pre-order status
-- ==========================================

-- Set pre-order status based on current variant stock
UPDATE gadgets g
SET is_pre_order = (
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM gadget_variants gv 
            WHERE gv.gadget_id = g.id 
            AND gv.is_active = 1 
            AND gv.stock_quantity > 0
        ) THEN 0
        WHEN EXISTS (
            SELECT 1 FROM gadget_variants gv 
            WHERE gv.gadget_id = g.id 
            AND gv.is_active = 1 
            AND gv.stock_quantity = 0
        ) THEN 1
        ELSE 0
    END
),
in_stock = CASE 
    WHEN EXISTS (
        SELECT 1 FROM gadget_variants gv 
        WHERE gv.gadget_id = g.id 
        AND gv.is_active = 1 
        AND gv.stock_quantity > 0
    ) THEN 1
    ELSE 0
END
WHERE has_variants = 1;

-- ==========================================
-- PART 2: Update existing triggers to handle pre-order logic
-- ==========================================

-- Drop existing triggers first (safe to run even if they don't exist)
DROP TRIGGER IF EXISTS `maintain_gadget_variant_data_update`;
DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_insert`;
DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_delete`;

-- Create updated trigger for variant updates
DELIMITER $$
CREATE TRIGGER `maintain_gadget_variant_data_update` AFTER UPDATE ON `gadget_variants` FOR EACH ROW BEGIN
    -- Declare variables at the beginning
    DECLARE active_variant_count INT DEFAULT 0;
    DECLARE zero_stock_variant_count INT DEFAULT 0;
    
    CALL RefreshGadgetVariantData(NEW.gadget_id);
    
    -- Enable pre-order when all variants reach zero stock
    SELECT COUNT(*) INTO active_variant_count
    FROM gadget_variants 
    WHERE gadget_id = NEW.gadget_id AND is_active = 1;
    
    SELECT COUNT(*) INTO zero_stock_variant_count
    FROM gadget_variants 
    WHERE gadget_id = NEW.gadget_id AND is_active = 1 AND stock_quantity = 0;
    
    -- If all active variants have zero stock, enable pre-order flag
    IF active_variant_count > 0 AND active_variant_count = zero_stock_variant_count THEN
        UPDATE gadgets 
        SET is_pre_order = 1, 
            in_stock = 0,
            updated_at = NOW()
        WHERE id = NEW.gadget_id;
    -- If any variant has stock, disable pre-order
    ELSEIF zero_stock_variant_count < active_variant_count THEN
        UPDATE gadgets 
        SET is_pre_order = 0,
            updated_at = NOW()
        WHERE id = NEW.gadget_id;
    END IF;
END$$
DELIMITER ;

-- Create updated trigger for variant inserts
DELIMITER $$
CREATE TRIGGER `update_gadget_stock_after_variant_insert` AFTER INSERT ON `gadget_variants` FOR EACH ROW BEGIN
    -- Declare variables at the beginning
    DECLARE active_variant_count INT DEFAULT 0;
    DECLARE zero_stock_variant_count INT DEFAULT 0;
    
    UPDATE gadgets 
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM gadget_variants 
        WHERE gadget_id = NEW.gadget_id AND is_active = 1
    ),
    has_variants = 1
    WHERE id = NEW.gadget_id;
    
    -- Check if this insert affects pre-order status
    SELECT COUNT(*) INTO active_variant_count
    FROM gadget_variants 
    WHERE gadget_id = NEW.gadget_id AND is_active = 1;
    
    SELECT COUNT(*) INTO zero_stock_variant_count
    FROM gadget_variants 
    WHERE gadget_id = NEW.gadget_id AND is_active = 1 AND stock_quantity = 0;
    
    -- If all active variants have zero stock, enable pre-order
    IF active_variant_count > 0 AND active_variant_count = zero_stock_variant_count THEN
        UPDATE gadgets 
        SET is_pre_order = 1, 
            in_stock = 0,
            updated_at = NOW()
        WHERE id = NEW.gadget_id;
    END IF;
END$$
DELIMITER ;

-- Create updated trigger for variant deletes
DELIMITER $$
CREATE TRIGGER `update_gadget_stock_after_variant_delete` AFTER DELETE ON `gadget_variants` FOR EACH ROW BEGIN
    -- Declare variables at the beginning
    DECLARE variant_count INT DEFAULT 0;
    DECLARE active_variant_count INT DEFAULT 0;
    DECLARE zero_stock_variant_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO variant_count
    FROM gadget_variants 
    WHERE gadget_id = OLD.gadget_id;
    
    SELECT COUNT(*) INTO active_variant_count
    FROM gadget_variants 
    WHERE gadget_id = OLD.gadget_id AND is_active = 1;
    
    SELECT COUNT(*) INTO zero_stock_variant_count
    FROM gadget_variants 
    WHERE gadget_id = OLD.gadget_id AND is_active = 1 AND stock_quantity = 0;
    
    UPDATE gadgets 
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM gadget_variants 
        WHERE gadget_id = OLD.gadget_id AND is_active = 1
    ),
    has_variants = IF(variant_count > 0, 1, 0)
    WHERE id = OLD.gadget_id;
    
    -- Update pre-order status after deletion
    IF active_variant_count > 0 AND active_variant_count = zero_stock_variant_count THEN
        UPDATE gadgets 
        SET is_pre_order = 1, 
            in_stock = 0,
            updated_at = NOW()
        WHERE id = OLD.gadget_id;
    ELSEIF active_variant_count = 0 THEN
        -- No active variants left, disable pre-order
        UPDATE gadgets 
        SET is_pre_order = 0,
            updated_at = NOW()
        WHERE id = OLD.gadget_id;
    ELSE
        -- Some variants still have stock
        UPDATE gadgets 
        SET is_pre_order = 0,
            updated_at = NOW()
        WHERE id = OLD.gadget_id;
    END IF;
END$$
DELIMITER ;

-- ==========================================
-- Verification Query
-- ==========================================

-- Check the final results
SELECT 
    'Final Status' as check_type,
    id,
    name,
    in_stock,
    is_pre_order,
    total_variant_stock,
    has_variants,
    (SELECT COUNT(*) FROM gadget_variants WHERE gadget_id = gadgets.id AND is_active = 1) as active_variants,
    (SELECT COUNT(*) FROM gadget_variants WHERE gadget_id = gadgets.id AND is_active = 1 AND stock_quantity = 0) as zero_stock_variants
FROM gadgets 
WHERE has_variants = 1
ORDER BY id;

-- Show trigger status
SHOW TRIGGERS LIKE 'gadget_variants';