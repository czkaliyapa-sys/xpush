-- Pre-order trigger updates - apply AFTER the column is added
-- This file contains only the trigger modifications

-- First drop existing triggers
DROP TRIGGER IF EXISTS `maintain_gadget_variant_data_update`;
DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_insert`;
DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_delete`;

-- Create updated trigger for variant updates
DELIMITER $$
CREATE TRIGGER `maintain_gadget_variant_data_update` 
AFTER UPDATE ON `gadget_variants` 
FOR EACH ROW 
BEGIN
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
CREATE TRIGGER `update_gadget_stock_after_variant_insert` 
AFTER INSERT ON `gadget_variants` 
FOR EACH ROW 
BEGIN
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
CREATE TRIGGER `update_gadget_stock_after_variant_delete` 
AFTER DELETE ON `gadget_variants` 
FOR EACH ROW 
BEGIN
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

-- Verification query
SHOW TRIGGERS LIKE 'gadget_variants';