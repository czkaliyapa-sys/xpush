-- CRITICAL DATABASE FIXES
-- Apply these fixes to your database to address critical issues

USE itsxtrapush_db;

-- 1. Add missing unique constraint for order transaction references
-- This prevents duplicate payments and ensures idempotency
ALTER TABLE orders ADD UNIQUE INDEX idx_unique_tx_ref (external_tx_ref);

-- 2. Add processed_transactions table for payment idempotency
-- This tracks successfully processed transactions to prevent double-processing
CREATE TABLE IF NOT EXISTS processed_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tx_ref VARCHAR(255) NOT NULL UNIQUE,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    user_id INT,
    INDEX idx_tx_ref (tx_ref),
    INDEX idx_processed_at (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add stock_audit_log table for inventory tracking
-- This tracks all stock changes for audit purposes
CREATE TABLE IF NOT EXISTS stock_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    item_type ENUM('gadget', 'variant') NOT NULL,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    quantity_change INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT,
    INDEX idx_item_type_id (item_type, item_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Add validation constraints for data integrity
ALTER TABLE orders ADD CONSTRAINT chk_valid_currency 
    CHECK (currency IN ('MWK', 'GBP'));

ALTER TABLE orders ADD CONSTRAINT chk_valid_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- 5. Add indexes for better performance on critical queries
ALTER TABLE order_items ADD INDEX idx_order_gadget_variant (order_id, gadget_id, variant_id);
ALTER TABLE gadgets ADD INDEX idx_gadget_stock_status (in_stock, stock_quantity);

-- 6. Add audit trigger for critical order operations
DELIMITER $$

CREATE TRIGGER tr_audit_order_operations 
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    -- Validate currency
    IF NEW.currency NOT IN ('MWK', 'GBP') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid currency code';
    END IF;
    
    -- Validate payment status
    IF NEW.payment_status NOT IN ('pending', 'paid', 'failed', 'refunded') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid payment status';
    END IF;
    
    -- Check for duplicate transaction reference
    IF EXISTS (SELECT 1 FROM orders WHERE external_tx_ref = NEW.external_tx_ref) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate transaction reference not allowed';
    END IF;
END$$

DELIMITER ;

-- 7. Add trigger for stock audit logging
DELIMITER $$

CREATE TRIGGER tr_audit_gadget_stock_changes
AFTER UPDATE ON gadgets
FOR EACH ROW
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
        INSERT INTO stock_audit_log 
        (item_id, item_type, old_quantity, new_quantity, quantity_change, changed_by)
        VALUES 
        (NEW.id, 'gadget', OLD.stock_quantity, NEW.stock_quantity, 
         NEW.stock_quantity - OLD.stock_quantity, @user_id);
    END IF;
END$$

DELIMITER ;

-- 8. Add trigger for variant stock audit logging
DELIMITER $$

CREATE TRIGGER tr_audit_variant_stock_changes
AFTER UPDATE ON gadget_variants
FOR EACH ROW
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
        INSERT INTO stock_audit_log 
        (item_id, item_type, old_quantity, new_quantity, quantity_change, changed_by)
        VALUES 
        (NEW.id, 'variant', OLD.stock_quantity, NEW.stock_quantity, 
         NEW.stock_quantity - OLD.stock_quantity, @user_id);
    END IF;
END$$

DELIMITER ;

-- 9. Add foreign key constraints for referential integrity
-- Note: These may require existing data cleanup first
-- ALTER TABLE order_items ADD CONSTRAINT fk_order_items_orders 
--     FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ALTER TABLE order_items ADD CONSTRAINT fk_order_items_gadgets 
--     FOREIGN KEY (gadget_id) REFERENCES gadgets(id) ON DELETE SET NULL;

-- 10. Add check constraint for positive prices
ALTER TABLE gadgets ADD CONSTRAINT chk_positive_prices 
    CHECK (price >= 0 AND price_gbp >= 0 AND monthly_price >= 0 AND monthly_price_gbp >= 0);

-- Verification queries to confirm fixes were applied
SELECT 'Database fixes applied successfully!' as status;

-- Check unique constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'itsxtrapush_db' 
AND CONSTRAINT_NAME LIKE '%unique%'
AND TABLE_NAME IN ('users', 'orders')
ORDER BY TABLE_NAME;

-- Check new tables exist
SHOW TABLES LIKE 'processed_transactions';
SHOW TABLES LIKE 'stock_audit_log';

-- Check constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'itsxtrapush_db'
AND TABLE_NAME IN ('orders', 'gadgets')
ORDER BY TABLE_NAME;