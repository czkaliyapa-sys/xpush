-- Migration: Set gadget default prices to zero to enforce variant-based pricing
-- This ensures all pricing comes from variants, not fixed gadget prices

USE itsxtrapush_db;

-- 1. Update existing gadgets to set prices to zero (they should come from variants)
UPDATE gadgets 
SET 
    price = 0.00,
    price_gbp = 0.00,
    monthly_price = 0.00,
    monthly_price_gbp = 0.00
WHERE id > 0;

-- 2. Modify the gadgets table structure to enforce zero defaults
ALTER TABLE gadgets 
MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
MODIFY COLUMN price_gbp DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN monthly_price DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN monthly_price_gbp DECIMAL(10,2) DEFAULT 0.00;

-- 3. Reset stock quantities to zero (should come from variants)
UPDATE gadgets 
SET stock_quantity = 0 
WHERE id > 0;

-- 4. Ensure has_variants flag is properly set based on actual variants
UPDATE gadgets g
SET has_variants = (
    SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
    FROM gadget_variants gv 
    WHERE gv.gadget_id = g.id AND gv.is_active = 1
);

-- 5. Update total_variant_stock based on active variants
UPDATE gadgets g
SET total_variant_stock = (
    SELECT COALESCE(SUM(stock_quantity), 0)
    FROM gadget_variants gv 
    WHERE gv.gadget_id = g.id AND gv.is_active = 1
);

-- 6. Create a view for variant-based gadget data (for easier querying)
CREATE OR REPLACE VIEW gadget_variant_summary AS
SELECT 
    g.id as gadget_id,
    g.name,
    g.category,
    g.brand,
    g.model,
    g.condition_status,
    g.in_stock,
    g.is_active,
    -- Calculate effective prices from variants
    COALESCE(MIN(CASE WHEN gv.is_active = 1 AND gv.stock_quantity > 0 THEN gv.price END), 0) as effective_price,
    COALESCE(MIN(CASE WHEN gv.is_active = 1 AND gv.stock_quantity > 0 AND gv.price_gbp IS NOT NULL THEN gv.price_gbp END), 0) as effective_price_gbp,
    -- Total stock from variants
    COALESCE(SUM(CASE WHEN gv.is_active = 1 THEN gv.stock_quantity ELSE 0 END), 0) as total_stock,
    -- Count of active variants
    COUNT(CASE WHEN gv.is_active = 1 THEN 1 END) as active_variant_count,
    -- Count of variants with stock
    COUNT(CASE WHEN gv.is_active = 1 AND gv.stock_quantity > 0 THEN 1 END) as available_variant_count
FROM gadgets g
LEFT JOIN gadget_variants gv ON g.id = gv.gadget_id
WHERE g.is_active = 1
GROUP BY g.id, g.name, g.category, g.brand, g.model, g.condition_status, g.in_stock, g.is_active;

-- 7. Add indexes for better performance on variant queries
CREATE INDEX idx_gadget_variants_active_stock ON gadget_variants(gadget_id, is_active, stock_quantity);
CREATE INDEX idx_gadgets_has_variants ON gadgets(has_variants, is_active);

-- 8. Create procedure to refresh gadget variant data
DELIMITER //
CREATE PROCEDURE RefreshGadgetVariantData(IN gadget_id_param INT)
BEGIN
    -- Update has_variants flag
    UPDATE gadgets g
    SET has_variants = (
        SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
        FROM gadget_variants gv 
        WHERE gv.gadget_id = g.id AND gv.is_active = 1
    )
    WHERE g.id = gadget_id_param OR gadget_id_param IS NULL;
    
    -- Update total_variant_stock
    UPDATE gadgets g
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM gadget_variants gv 
        WHERE gv.gadget_id = g.id AND gv.is_active = 1
    )
    WHERE g.id = gadget_id_param OR gadget_id_param IS NULL;
END//
DELIMITER ;

-- 9. Create trigger to automatically maintain gadget data when variants change
DELIMITER //
CREATE TRIGGER maintain_gadget_variant_data 
AFTER INSERT ON gadget_variants 
FOR EACH ROW
BEGIN
    CALL RefreshGadgetVariantData(NEW.gadget_id);
END//

CREATE TRIGGER maintain_gadget_variant_data_update 
AFTER UPDATE ON gadget_variants 
FOR EACH ROW
BEGIN
    CALL RefreshGadgetVariantData(NEW.gadget_id);
END//

CREATE TRIGGER maintain_gadget_variant_data_delete 
AFTER DELETE ON gadget_variants 
FOR EACH ROW
BEGIN
    CALL RefreshGadgetVariantData(OLD.gadget_id);
END//
DELIMITER ;

-- 10. Verify the changes
SELECT 
    'Gadgets with zero prices' as check_type,
    COUNT(*) as count
FROM gadgets 
WHERE price = 0 AND price_gbp = 0;

SELECT 
    'Gadgets with variant data' as check_type,
    COUNT(*) as count
FROM gadgets 
WHERE has_variants = 1;

SELECT 
    'Active variants' as check_type,
    COUNT(*) as count
FROM gadget_variants 
WHERE is_active = 1;

-- 11. Sample data verification
SELECT 
    g.id,
    g.name,
    g.price,
    g.price_gbp,
    g.stock_quantity,
    g.has_variants,
    g.total_variant_stock,
    (SELECT COUNT(*) FROM gadget_variants gv WHERE gv.gadget_id = g.id AND gv.is_active = 1) as actual_variants
FROM gadgets g
LIMIT 5;

COMMIT;