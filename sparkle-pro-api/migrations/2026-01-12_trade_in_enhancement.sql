-- Migration: Trade-In System Enhancement
-- Date: 2026-01-12
-- Description: Extends trade_ins table with comprehensive device data capture,
--              image uploads, market pricing, swap functionality, and AI assessment

-- ============================================
-- EXTEND TRADE-INS TABLE WITH ADVANCED FIELDS
-- ============================================
-- Add new columns to trade_ins table
ALTER TABLE trade_ins 
ADD COLUMN IF NOT EXISTS device_color VARCHAR(100) AFTER device_accessories,
ADD COLUMN IF NOT EXISTS battery_health VARCHAR(50) AFTER device_color,
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255) AFTER battery_health,
ADD COLUMN IF NOT EXISTS imei VARCHAR(255) AFTER serial_number,
ADD COLUMN IF NOT EXISTS cpu VARCHAR(255) AFTER imei,
ADD COLUMN IF NOT EXISTS ram VARCHAR(100) AFTER cpu,
ADD COLUMN IF NOT EXISTS gpu VARCHAR(255) AFTER ram,
ADD COLUMN IF NOT EXISTS screen_size VARCHAR(50) AFTER gpu,
ADD COLUMN IF NOT EXISTS purchase_year VARCHAR(10) AFTER screen_size,
ADD COLUMN IF NOT EXISTS controllers VARCHAR(50) AFTER purchase_year,
ADD COLUMN IF NOT EXISTS bundled_items TEXT AFTER controllers,
ADD COLUMN IF NOT EXISTS network_lock VARCHAR(50) AFTER bundled_items,
ADD COLUMN IF NOT EXISTS condition_notes TEXT AFTER network_lock,
ADD COLUMN IF NOT EXISTS device_images JSON AFTER condition_notes,
ADD COLUMN IF NOT EXISTS market_value DECIMAL(10,2) AFTER estimated_value,
ADD COLUMN IF NOT EXISTS competitor_prices JSON AFTER market_value,
ADD COLUMN IF NOT EXISTS age_depreciation_factor DECIMAL(5,2) DEFAULT 1.00 AFTER competitor_prices,
ADD COLUMN IF NOT EXISTS spec_multiplier DECIMAL(5,2) DEFAULT 1.00 AFTER age_depreciation_factor,
ADD COLUMN IF NOT EXISTS damage_deduction DECIMAL(10,2) DEFAULT 0.00 AFTER spec_multiplier,
ADD COLUMN IF NOT EXISTS ai_condition_suggestion VARCHAR(50) AFTER damage_deduction,
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(5,2) AFTER ai_condition_suggestion,
ADD COLUMN IF NOT EXISTS swap_requested BOOLEAN DEFAULT FALSE AFTER ai_confidence_score,
ADD COLUMN IF NOT EXISTS swap_gadget_id INT AFTER swap_requested,
ADD COLUMN IF NOT EXISTS swap_gadget_name VARCHAR(255) AFTER swap_gadget_id,
ADD COLUMN IF NOT EXISTS swap_gadget_price DECIMAL(10,2) AFTER swap_gadget_name,
ADD COLUMN IF NOT EXISTS swap_balance_due DECIMAL(10,2) AFTER swap_gadget_price,
ADD COLUMN IF NOT EXISTS swap_status ENUM('none', 'pending', 'approved', 'completed', 'cancelled') DEFAULT 'none' AFTER swap_balance_due,
ADD COLUMN IF NOT EXISTS offer_type ENUM('cash_only', 'swap_only', 'both') DEFAULT 'cash_only' AFTER swap_status,
ADD COLUMN IF NOT EXISTS device_metadata JSON AFTER offer_type;

-- Add indexes (check if they exist first)
SET @exist_swap_requested := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'trade_ins' AND index_name = 'idx_swap_requested');
SET @sqlstmt_swap_requested := IF(@exist_swap_requested = 0, 
    'ALTER TABLE trade_ins ADD INDEX idx_swap_requested (swap_requested)', 
    'SELECT "Index idx_swap_requested already exists" AS message');
PREPARE stmt FROM @sqlstmt_swap_requested;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_swap_status := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'trade_ins' AND index_name = 'idx_swap_status');
SET @sqlstmt_swap_status := IF(@exist_swap_status = 0, 
    'ALTER TABLE trade_ins ADD INDEX idx_swap_status (swap_status)', 
    'SELECT "Index idx_swap_status already exists" AS message');
PREPARE stmt FROM @sqlstmt_swap_status;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_imei := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'trade_ins' AND index_name = 'idx_imei');
SET @sqlstmt_imei := IF(@exist_imei = 0, 
    'ALTER TABLE trade_ins ADD INDEX idx_imei (imei)', 
    'SELECT "Index idx_imei already exists" AS message');
PREPARE stmt FROM @sqlstmt_imei;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_serial := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'trade_ins' AND index_name = 'idx_serial');
SET @sqlstmt_serial := IF(@exist_serial = 0, 
    'ALTER TABLE trade_ins ADD INDEX idx_serial (serial_number)', 
    'SELECT "Index idx_serial already exists" AS message');
PREPARE stmt FROM @sqlstmt_serial;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- CREATE TRADE-IN IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trade_in_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trade_in_id INT NOT NULL,
    trade_in_reference VARCHAR(50) NOT NULL,
    image_type ENUM('front', 'back', 'screen', 'damage', 'box', 'accessories', 'other') NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_path VARCHAR(500),
    image_size INT COMMENT 'Size in bytes',
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trade_in_id) REFERENCES trade_ins(id) ON DELETE CASCADE,
    INDEX idx_trade_in (trade_in_id),
    INDEX idx_reference (trade_in_reference),
    INDEX idx_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREATE MARKET PRICING CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS market_pricing_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_key VARCHAR(255) NOT NULL COMMENT 'brand_model_storage combination',
    category VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(255),
    storage VARCHAR(100),
    condition_excellent DECIMAL(10,2),
    condition_very_good DECIMAL(10,2),
    condition_good DECIMAL(10,2),
    condition_fair DECIMAL(10,2),
    condition_poor DECIMAL(10,2),
    market_avg DECIMAL(10,2),
    competitor_swappa DECIMAL(10,2),
    competitor_backmarket DECIMAL(10,2),
    competitor_gazelle DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'manual',
    UNIQUE KEY unique_device (device_key),
    INDEX idx_brand_model (brand, model),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREATE SWAP TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS swap_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    swap_reference VARCHAR(50) UNIQUE NOT NULL,
    trade_in_id INT NOT NULL,
    trade_in_reference VARCHAR(50) NOT NULL,
    user_uid VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    
    -- Trade-in device details
    trade_in_value DECIMAL(10,2) NOT NULL,
    trade_in_device VARCHAR(255),
    
    -- New device details
    new_gadget_id INT NOT NULL,
    new_gadget_name VARCHAR(255) NOT NULL,
    new_gadget_price DECIMAL(10,2) NOT NULL,
    
    -- Financial details
    credit_applied DECIMAL(10,2) NOT NULL,
    balance_due DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'partial', 'completed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    
    -- Status tracking
    swap_status ENUM('pending', 'device_received', 'inspected', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (trade_in_id) REFERENCES trade_ins(id) ON DELETE CASCADE,
    INDEX idx_trade_in (trade_in_id),
    INDEX idx_reference (trade_in_reference),
    INDEX idx_swap_ref (swap_reference),
    INDEX idx_user (user_uid),
    INDEX idx_status (swap_status),
    INDEX idx_payment (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT SAMPLE MARKET PRICING DATA
-- ============================================
INSERT INTO market_pricing_cache (device_key, category, brand, model, storage, condition_excellent, condition_very_good, condition_good, condition_fair, condition_poor, market_avg, competitor_swappa, competitor_backmarket, competitor_gazelle, data_source) VALUES
-- iPhone 15 Series
('apple_iphone15pro_256gb', 'smartphone', 'Apple', 'iPhone 15 Pro', '256GB', 850.00, 780.00, 680.00, 550.00, 380.00, 750.00, 820.00, 750.00, 680.00, 'manual'),
('apple_iphone15pro_512gb', 'smartphone', 'Apple', 'iPhone 15 Pro', '512GB', 950.00, 880.00, 780.00, 650.00, 480.00, 850.00, 920.00, 850.00, 780.00, 'manual'),
('apple_iphone15_128gb', 'smartphone', 'Apple', 'iPhone 15', '128GB', 650.00, 580.00, 480.00, 380.00, 280.00, 550.00, 620.00, 550.00, 480.00, 'manual'),
('apple_iphone15_256gb', 'smartphone', 'Apple', 'iPhone 15', '256GB', 750.00, 680.00, 580.00, 480.00, 350.00, 650.00, 720.00, 650.00, 580.00, 'manual'),

-- iPhone 14 Series
('apple_iphone14pro_256gb', 'smartphone', 'Apple', 'iPhone 14 Pro', '256GB', 650.00, 580.00, 480.00, 380.00, 280.00, 550.00, 620.00, 550.00, 480.00, 'manual'),
('apple_iphone14_128gb', 'smartphone', 'Apple', 'iPhone 14', '128GB', 450.00, 380.00, 320.00, 250.00, 180.00, 380.00, 420.00, 380.00, 320.00, 'manual'),

-- Samsung Galaxy Series
('samsung_galaxys24ultra_256gb', 'smartphone', 'Samsung', 'Galaxy S24 Ultra', '256GB', 750.00, 680.00, 580.00, 450.00, 320.00, 650.00, 720.00, 650.00, 580.00, 'manual'),
('samsung_galaxys23_256gb', 'smartphone', 'Samsung', 'Galaxy S23', '256GB', 450.00, 380.00, 320.00, 250.00, 180.00, 380.00, 420.00, 380.00, 320.00, 'manual'),

-- MacBook Series
('apple_macbookairm3_256gb', 'laptop', 'Apple', 'MacBook Air M3', '256GB', 850.00, 780.00, 680.00, 550.00, 420.00, 750.00, 820.00, 750.00, 680.00, 'manual'),
('apple_macbookairm3_512gb', 'laptop', 'Apple', 'MacBook Air M3', '512GB', 950.00, 880.00, 780.00, 650.00, 520.00, 850.00, 920.00, 850.00, 780.00, 'manual'),
('apple_macbookpro14_512gb', 'laptop', 'Apple', 'MacBook Pro 14"', '512GB', 1350.00, 1250.00, 1100.00, 950.00, 750.00, 1200.00, 1300.00, 1200.00, 1100.00, 'manual'),

-- Dell Laptops
('dell_xps13_512gb', 'laptop', 'Dell', 'XPS 13', '512GB', 550.00, 480.00, 420.00, 350.00, 250.00, 480.00, 520.00, 480.00, 420.00, 'manual'),

-- iPad Series
('apple_ipadpro129_256gb', 'tablet', 'Apple', 'iPad Pro 12.9"', '256GB', 650.00, 580.00, 480.00, 380.00, 280.00, 550.00, 620.00, 550.00, 480.00, 'manual'),
('apple_ipadair_256gb', 'tablet', 'Apple', 'iPad Air', '256GB', 380.00, 320.00, 280.00, 220.00, 150.00, 320.00, 350.00, 320.00, 280.00, 'manual'),

-- Gaming Consoles
('sony_ps5_1tb', 'gaming', 'Sony', 'PlayStation 5', '1TB', 420.00, 380.00, 320.00, 280.00, 220.00, 350.00, 400.00, 350.00, 320.00, 'manual'),
('microsoft_xboxseriesx_1tb', 'gaming', 'Microsoft', 'Xbox Series X', '1TB', 380.00, 320.00, 280.00, 220.00, 180.00, 300.00, 350.00, 300.00, 280.00, 'manual'),
('nintendo_switch_32gb', 'gaming', 'Nintendo', 'Switch', '32GB', 180.00, 150.00, 120.00, 90.00, 60.00, 130.00, 160.00, 130.00, 120.00, 'manual')

ON DUPLICATE KEY UPDATE
    condition_excellent = VALUES(condition_excellent),
    condition_very_good = VALUES(condition_very_good),
    condition_good = VALUES(condition_good),
    condition_fair = VALUES(condition_fair),
    condition_poor = VALUES(condition_poor),
    market_avg = VALUES(market_avg),
    competitor_swappa = VALUES(competitor_swappa),
    competitor_backmarket = VALUES(competitor_backmarket),
    competitor_gazelle = VALUES(competitor_gazelle),
    last_updated = CURRENT_TIMESTAMP;

-- ============================================
-- VERIFY TABLES AND COLUMNS
-- ============================================
-- Run these to verify:
-- SHOW COLUMNS FROM trade_ins;
-- SHOW TABLES LIKE 'trade_in_images';
-- SHOW TABLES LIKE 'market_pricing_cache';
-- SHOW TABLES LIKE 'swap_transactions';
-- SELECT * FROM market_pricing_cache LIMIT 5;
