-- Migration: Simplify Gadget Variant System
-- Date: 2026-01-03
-- Purpose: Remove duplicate fields, make stock management cleaner
--          Stock should only live at the variant level for smartphones/tablets
--          Main gadget keeps a cached total stock for quick display

-- ============================================
-- PART 1: Add computed total stock to gadgets table
-- ============================================

-- Add a column to cache the total variant stock for display purposes
ALTER TABLE `gadgets` 
ADD COLUMN `total_variant_stock` INT(11) DEFAULT 0 AFTER `stock_quantity`,
ADD COLUMN `has_variants` TINYINT(1) DEFAULT 0 AFTER `total_variant_stock`;

-- ============================================
-- PART 2: Create a view for available variant options
-- ============================================

-- This view helps the frontend show only available combinations
CREATE OR REPLACE VIEW `available_gadget_variants` AS
SELECT 
    gv.gadget_id,
    gv.id AS variant_id,
    gv.color,
    gv.color_hex,
    gv.storage,
    gv.condition_status,
    gv.price,
    gv.price_gbp,
    gv.stock_quantity,
    gv.sku,
    gv.is_active,
    g.name AS gadget_name,
    g.brand,
    g.model,
    g.category
FROM gadget_variants gv
JOIN gadgets g ON g.id = gv.gadget_id
WHERE gv.is_active = 1 
  AND gv.stock_quantity > 0;

-- ============================================
-- PART 3: Create trigger to keep total_variant_stock in sync
-- ============================================

DELIMITER //

-- After inserting a variant, update gadget's total stock
CREATE TRIGGER `update_gadget_stock_after_variant_insert`
AFTER INSERT ON `gadget_variants`
FOR EACH ROW
BEGIN
    UPDATE gadgets 
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM gadget_variants 
        WHERE gadget_id = NEW.gadget_id AND is_active = 1
    ),
    has_variants = 1
    WHERE id = NEW.gadget_id;
END//

-- After updating a variant, update gadget's total stock
CREATE TRIGGER `update_gadget_stock_after_variant_update`
AFTER UPDATE ON `gadget_variants`
FOR EACH ROW
BEGIN
    UPDATE gadgets 
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM gadget_variants 
        WHERE gadget_id = NEW.gadget_id AND is_active = 1
    )
    WHERE id = NEW.gadget_id;
END//

-- After deleting a variant, update gadget's total stock
CREATE TRIGGER `update_gadget_stock_after_variant_delete`
AFTER DELETE ON `gadget_variants`
FOR EACH ROW
BEGIN
    DECLARE variant_count INT;
    
    SELECT COUNT(*) INTO variant_count
    FROM gadget_variants 
    WHERE gadget_id = OLD.gadget_id;
    
    UPDATE gadgets 
    SET total_variant_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM gadget_variants 
        WHERE gadget_id = OLD.gadget_id AND is_active = 1
    ),
    has_variants = IF(variant_count > 0, 1, 0)
    WHERE id = OLD.gadget_id;
END//

DELIMITER ;

-- ============================================
-- PART 4: Update existing gadgets with has_variants flag
-- ============================================

UPDATE gadgets g
SET has_variants = 1,
    total_variant_stock = (
        SELECT COALESCE(SUM(gv.stock_quantity), 0)
        FROM gadget_variants gv
        WHERE gv.gadget_id = g.id AND gv.is_active = 1
    )
WHERE EXISTS (
    SELECT 1 FROM gadget_variants gv WHERE gv.gadget_id = g.id
);

-- ============================================
-- PART 5: Add unique constraint for variant combinations
-- ============================================

-- Ensure we don't have duplicate color+storage+condition for same gadget
-- Note: This handles NULL colors properly with a unique index
ALTER TABLE `gadget_variants`
ADD UNIQUE INDEX `idx_unique_variant_combo` (`gadget_id`, `color`(50), `storage`(50), `condition_status`);

-- ============================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================

-- Check gadgets with variants and their total stock
-- SELECT id, name, has_variants, total_variant_stock, stock_quantity FROM gadgets WHERE has_variants = 1;

-- Check variant distribution by gadget
-- SELECT 
--     g.id, 
--     g.name, 
--     COUNT(gv.id) AS variant_count,
--     SUM(gv.stock_quantity) AS total_stock,
--     GROUP_CONCAT(DISTINCT gv.storage) AS storages,
--     GROUP_CONCAT(DISTINCT gv.condition_status) AS conditions
-- FROM gadgets g
-- LEFT JOIN gadget_variants gv ON gv.gadget_id = g.id AND gv.is_active = 1
-- GROUP BY g.id
-- HAVING variant_count > 0;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

-- DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_insert`;
-- DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_update`;
-- DROP TRIGGER IF EXISTS `update_gadget_stock_after_variant_delete`;
-- DROP VIEW IF EXISTS `available_gadget_variants`;
-- ALTER TABLE `gadget_variants` DROP INDEX `idx_unique_variant_combo`;
-- ALTER TABLE `gadgets` DROP COLUMN `total_variant_stock`;
-- ALTER TABLE `gadgets` DROP COLUMN `has_variants`;
