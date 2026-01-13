-- Migration: Introduce gadget_variants and add variant_id to order_items
-- Date: 2025-10-15

-- Create gadget_variants if it doesn't exist
CREATE TABLE IF NOT EXISTS gadget_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gadget_id INT NOT NULL,
    storage VARCHAR(64) NOT NULL,
    condition_status ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(64) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (gadget_id) REFERENCES gadgets(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_variant (gadget_id, storage, condition_status),
    INDEX idx_gadget_id (gadget_id),
    INDEX idx_storage (storage),
    INDEX idx_condition (condition_status),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Add variant_id to order_items if it doesn't exist
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS variant_id INT DEFAULT NULL AFTER gadget_id;

-- Add index for variant_id
ALTER TABLE order_items
    ADD INDEX IF NOT EXISTS idx_variant_id (variant_id);

-- Add foreign key constraint for variant_id
ALTER TABLE order_items
    ADD CONSTRAINT IF NOT EXISTS fk_order_items_variant
        FOREIGN KEY (variant_id) REFERENCES gadget_variants(id) ON DELETE SET NULL;