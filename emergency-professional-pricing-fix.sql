-- Emergency Fix: Eliminate ALL old pricing methods and ensure professional CRUD operations
-- This addresses the price flickering issue and ensures consistent variant-based pricing

USE itsxtrapush_db;

-- 1. FORCE all gadget base prices to zero (eliminates old pricing methods)
UPDATE gadgets 
SET 
    price = 0.00,
    price_gbp = 0.00,
    monthly_price = 0.00,
    monthly_price_gbp = 0.00
WHERE price > 0 OR price_gbp > 0;

-- 2. Ensure all stock quantities come from variants only
UPDATE gadgets 
SET stock_quantity = 0 
WHERE id > 0;

-- 3. Refresh variant-based data for all gadgets
UPDATE gadgets g
SET 
    has_variants = (
        SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
        FROM gadget_variants gv 
        WHERE gv.gadget_id = g.id AND gv.is_active = 1
    ),
    total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM gadget_variants gv 
        WHERE gv.gadget_id = g.id AND gv.is_active = 1
    );

-- 4. Create a professional pricing view for dashboards
CREATE OR REPLACE VIEW professional_gadget_pricing AS
SELECT 
    g.id,
    g.name,
    g.category,
    g.brand,
    g.model,
    -- ONLY use variant-based pricing
    COALESCE(
        MIN(CASE 
            WHEN gv.is_active = 1 AND gv.stock_quantity > 0 
            THEN gv.price 
        END), 0
    ) as current_price_mwk,
    COALESCE(
        MIN(CASE 
            WHEN gv.is_active = 1 AND gv.stock_quantity > 0 AND gv.price_gbp IS NOT NULL
            THEN gv.price_gbp 
        END), 0
    ) as current_price_gbp,
    -- Total available stock from variants only
    COALESCE(
        SUM(CASE 
            WHEN gv.is_active = 1 
            THEN gv.stock_quantity 
            ELSE 0 
        END), 0
    ) as available_stock,
    -- Count active variants
    COUNT(CASE WHEN gv.is_active = 1 THEN 1 END) as active_variants,
    -- Count variants with stock
    COUNT(CASE WHEN gv.is_active = 1 AND gv.stock_quantity > 0 THEN 1 END) as available_variants,
    g.created_at,
    g.updated_at
FROM gadgets g
LEFT JOIN gadget_variants gv ON g.id = gv.gadget_id
WHERE g.is_active = 1
GROUP BY g.id, g.name, g.category, g.brand, g.model, g.created_at, g.updated_at;

-- 5. Add constraint to prevent future old pricing method usage
DELIMITER //
CREATE TRIGGER prevent_old_pricing_insert 
BEFORE INSERT ON gadgets
FOR EACH ROW
BEGIN
    SET NEW.price = 0.00;
    SET NEW.price_gbp = 0.00;
    SET NEW.monthly_price = 0.00;
    SET NEW.monthly_price_gbp = 0.00;
END//

CREATE TRIGGER prevent_old_pricing_update 
BEFORE UPDATE ON gadgets
FOR EACH ROW
BEGIN
    -- Only allow zero prices to prevent old pricing method reintroduction
    IF NEW.price != 0 OR NEW.price_gbp != 0 OR NEW.monthly_price != 0 OR NEW.monthly_price_gbp != 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot set non-zero prices. All pricing must come from variants.';
    END IF;
END//
DELIMITER ;

-- 6. Professional CRUD audit log table
CREATE TABLE IF NOT EXISTS gadget_pricing_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gadget_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_price_mwk DECIMAL(10,2),
    new_price_mwk DECIMAL(10,2),
    old_price_gbp DECIMAL(10,2),
    new_price_gbp DECIMAL(10,2),
    changed_by VARCHAR(255),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gadget_id (gadget_id),
    INDEX idx_created_at (created_at)
);

-- 7. Audit trigger for professional tracking
DELIMITER //
CREATE TRIGGER gadget_price_audit 
AFTER UPDATE ON gadgets
FOR EACH ROW
BEGIN
    IF OLD.price != NEW.price OR OLD.price_gbp != NEW.price_gbp THEN
        INSERT INTO gadget_pricing_audit (
            gadget_id, action, old_price_mwk, new_price_mwk, 
            old_price_gbp, new_price_gbp, changed_by, change_reason
        ) VALUES (
            NEW.id, 'PRICE_UPDATE', OLD.price, NEW.price,
            OLD.price_gbp, NEW.price_gbp, USER(), 'Automatic zero-price enforcement'
        );
    END IF;
END//
DELIMITER ;

-- 8. Verify the cleanup
SELECT 
    'Fixed Gadgets' as check_type,
    COUNT(*) as count
FROM gadgets 
WHERE price = 0 AND price_gbp = 0;

SELECT 
    'Gadgets with Variants' as check_type,
    COUNT(*) as count
FROM gadgets 
WHERE has_variants = 1;

SELECT 
    'Audit Records Created' as check_type,
    COUNT(*) as count
FROM gadget_pricing_audit;

-- 9. Sample verification of professional pricing view
SELECT 
    id,
    name,
    current_price_mwk,
    current_price_gbp,
    available_stock,
    active_variants
FROM professional_gadget_pricing
WHERE current_price_mwk > 0
LIMIT 5;

COMMIT;