-- Migration Script: Add 3D Model Support to Gadgets Table
-- This script adds 3D model support fields to existing gadgets table
-- Run this script on existing databases to add 3D model functionality

-- Add 3D model support columns to gadgets table
ALTER TABLE gadgets 
ADD COLUMN has_3d_model BOOLEAN DEFAULT FALSE AFTER specifications,
ADD COLUMN model3d_path VARCHAR(500) DEFAULT NULL AFTER has_3d_model,
ADD COLUMN model3d_files JSON DEFAULT NULL AFTER model3d_path,
ADD COLUMN model3d_scale DECIMAL(4, 2) DEFAULT 1.0 AFTER model3d_files,
ADD COLUMN model3d_position JSON DEFAULT NULL AFTER model3d_scale,
ADD COLUMN model3d_rotation JSON DEFAULT NULL AFTER model3d_position,
ADD COLUMN model3d_config JSON DEFAULT NULL AFTER model3d_rotation;

-- Add new categories to the category enum
ALTER TABLE gadgets 
MODIFY COLUMN category ENUM('smartphone', 'laptop', 'gaming', 'audio', 'wearable', 'accessory', 'tablet', 'desktop') NOT NULL;

-- Add index for 3D model support
ALTER TABLE gadgets 
ADD INDEX idx_has_3d_model (has_3d_model);

-- Update existing MacBook Pro M4 with 3D model information
UPDATE gadgets 
SET 
    has_3d_model = TRUE,
    model3d_path = 'macbook_pro_m3_16_inch_2024',
    model3d_files = JSON_ARRAY('scene.gltf'),
    model3d_scale = 1.2,
    model3d_position = JSON_ARRAY(0, -0.5, 0),
    model3d_rotation = JSON_ARRAY(0, 0, 0)
WHERE name = 'MacBook Pro M4';

-- Update existing iPhone 16 Pro Max with 3D model information
UPDATE gadgets 
SET 
    has_3d_model = TRUE,
    model3d_path = 'iphone_16_pro_max',
    model3d_files = JSON_ARRAY('scene.gltf'),
    model3d_scale = 0.1,
    model3d_position = JSON_ARRAY(0, 0, 0),
    model3d_rotation = JSON_ARRAY(0, 0, 0)
WHERE name = 'iPhone 16 Pro Max';

-- Update existing Samsung S25 Ultra with 3D model information
UPDATE gadgets 
SET 
    has_3d_model = TRUE,
    model3d_path = 'samsung-s25-ultra-free',
    model3d_files = JSON_ARRAY('scene.gltf'),
    model3d_scale = 0.1,
    model3d_position = JSON_ARRAY(0, 0, 0),
    model3d_rotation = JSON_ARRAY(0, 0, 0)
WHERE name = 'Samsung S25 Ultra';

-- Insert additional MacBook and device models if they don't exist
INSERT IGNORE INTO gadgets (name, description, price, monthly_price, image_url, category, brand, model, specifications, has_3d_model, model3d_path, model3d_files, model3d_scale, model3d_position, model3d_rotation, in_stock, stock_quantity) VALUES
-- Additional MacBook Models
(
    'MacBook Pro 2021 16-inch', 
    'Professional laptop with M1 Pro/Max chip. Perfect for video editing and development.',
    1200.00, 
    100.00, 
    'https://sparkle-pro.co.uk/api/images/macbookm3.png',
    'laptop', 
    'Apple', 
    'MacBook Pro 2021',
    JSON_OBJECT(
        'display', JSON_OBJECT('size', '16 inch', 'type', 'Liquid Retina XDR', 'resolution', '3456×2234'),
        'processor', 'Apple M1 Pro/Max',
        'storage', JSON_ARRAY('512GB SSD', '1TB SSD', '2TB SSD', '4TB SSD'),
        'memory', JSON_ARRAY('16GB', '32GB', '64GB'),
        'battery', 'Up to 21 hours',
        'os', 'macOS',
        'connectivity', JSON_ARRAY('Wi-Fi 6', 'Bluetooth 5.0', '3x Thunderbolt 4'),
        'colors', JSON_ARRAY('Space Gray', 'Silver'),
        'weight', '2.1kg'
    ),
    TRUE,
    '2021_macbook_pro_16_m1_pro__m1_max',
    JSON_ARRAY('scene.gltf'),
    1.0,
    JSON_ARRAY(0, -0.5, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    12
),
(
    'MacBook Air M2', 
    'Ultra-thin and lightweight laptop with M2 chip. Perfect for everyday computing.',
    999.00, 
    83.25, 
    'https://sparkle-pro.co.uk/api/images/macbookm3.png',
    'laptop', 
    'Apple', 
    'MacBook Air M2',
    JSON_OBJECT(
        'display', JSON_OBJECT('size', '13.6 inch', 'type', 'Liquid Retina', 'resolution', '2560×1664'),
        'processor', 'Apple M2 chip',
        'storage', JSON_ARRAY('256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'),
        'memory', JSON_ARRAY('8GB', '16GB', '24GB'),
        'battery', 'Up to 18 hours',
        'os', 'macOS',
        'connectivity', JSON_ARRAY('Wi-Fi 6', 'Bluetooth 5.0', '2x Thunderbolt'),
        'colors', JSON_ARRAY('Midnight', 'Starlight', 'Space Gray', 'Silver'),
        'weight', '1.24kg'
    ),
    TRUE,
    'macbook_pro_2021',
    JSON_ARRAY('scene.gltf'),
    1.0,
    JSON_ARRAY(0, -0.5, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    20
),
-- Gaming Laptops
(
    'ASUS ROG Strix Scar 17', 
    'High-performance gaming laptop with RTX graphics and advanced cooling system.',
    1800.00, 
    150.00, 
    'https://sparkle-pro.co.uk/api/images/asusrog.png',
    'gaming', 
    'ASUS', 
    'ROG Strix Scar 17',
    JSON_OBJECT(
        'display', JSON_OBJECT('size', '17.3 inch', 'type', 'IPS', 'resolution', '1920×1080', 'refresh_rate', '360Hz'),
        'processor', 'Intel Core i9-13980HX',
        'graphics', 'NVIDIA GeForce RTX 4090',
        'storage', JSON_ARRAY('1TB SSD', '2TB SSD'),
        'memory', JSON_ARRAY('32GB DDR5', '64GB DDR5'),
        'battery', '90Wh',
        'os', 'Windows 11',
        'connectivity', JSON_ARRAY('Wi-Fi 6E', 'Bluetooth 5.3', 'USB-C', 'HDMI 2.1'),
        'colors', JSON_ARRAY('Eclipse Gray'),
        'weight', '3.0kg'
    ),
    TRUE,
    'asus_rog_strix_scar_17_2023_g733_gaming_laptop',
    JSON_ARRAY('scene.gltf'),
    1.0,
    JSON_ARRAY(0, -0.5, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    8
),
(
    'HP OMEN Gaming Laptop', 
    'Performance gaming laptop with advanced thermal management and RGB lighting.',
    1400.00, 
    116.67, 
    'https://sparkle-pro.co.uk/api/images/hpomen.png',
    'gaming', 
    'HP', 
    'OMEN 17',
    JSON_OBJECT(
        'display', JSON_OBJECT('size', '17.3 inch', 'type', 'IPS', 'resolution', '1920×1080', 'refresh_rate', '165Hz'),
        'processor', 'AMD Ryzen 7 7840HS',
        'graphics', 'NVIDIA GeForce RTX 4070',
        'storage', JSON_ARRAY('1TB SSD'),
        'memory', JSON_ARRAY('16GB DDR5', '32GB DDR5'),
        'battery', '83Wh',
        'os', 'Windows 11',
        'connectivity', JSON_ARRAY('Wi-Fi 6E', 'Bluetooth 5.3', 'USB-C', 'HDMI 2.1'),
        'colors', JSON_ARRAY('Shadow Black'),
        'weight', '2.78kg'
    ),
    TRUE,
    'hp_omen_laptop',
    JSON_ARRAY('scene.gltf', 'e.bin'),
    1.0,
    JSON_ARRAY(0, -0.5, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    10
),
-- Xiaomi Devices
(
    'Xiaomi Redmi 12', 
    'Budget-friendly smartphone with impressive camera and long battery life.',
    180.00, 
    15.00, 
    'https://sparkle-pro.co.uk/api/images/redmi12.png',
    'smartphone', 
    'Xiaomi', 
    'Redmi 12',
    JSON_OBJECT(
        'display', JSON_OBJECT('size', '6.79 inch', 'type', 'IPS LCD', 'resolution', '2460×1080'),
        'processor', 'MediaTek Helio G88',
        'storage', JSON_ARRAY('128GB', '256GB'),
        'camera', JSON_OBJECT('main', '50MP', 'ultrawide', '8MP', 'macro', '2MP'),
        'battery', '5000 mAh',
        'os', 'Android 13',
        'connectivity', JSON_ARRAY('4G', 'Wi-Fi 5', 'Bluetooth 5.3'),
        'colors', JSON_ARRAY('Midnight Black', 'Sky Blue', 'Polar Silver'),
        'weight', '198.5g'
    ),
    TRUE,
    'xiaomi-redmi-12',
    JSON_ARRAY('scene.gltf', 'scene.bin'),
    0.1,
    JSON_ARRAY(0, 0, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    40
),
-- Gaming PC
(
    'Custom Gaming PC', 
    'High-end gaming desktop with RGB lighting and liquid cooling system.',
    2500.00, 
    208.33, 
    'https://sparkle-pro.co.uk/api/images/asusrog.png',
    'desktop', 
    'Custom', 
    'Gaming PC Build',
    JSON_OBJECT(
        'processor', 'Intel Core i9-13900K',
        'graphics', 'NVIDIA GeForce RTX 4080',
        'motherboard', 'ASUS ROG Strix Z790-E',
        'memory', '32GB DDR5-5600',
        'storage', JSON_ARRAY('1TB NVMe SSD', '2TB HDD'),
        'cooling', 'AIO Liquid Cooler',
        'psu', '850W 80+ Gold',
        'case', 'Tempered Glass RGB',
        'os', 'Windows 11 Pro',
        'connectivity', JSON_ARRAY('Wi-Fi 6E', 'Bluetooth 5.3', 'Ethernet'),
        'features', JSON_ARRAY('RGB Lighting', 'Liquid Cooling', 'Tool-less Assembly')
    ),
    TRUE,
    'gaming-pc-with-animated-textures-that-wont-work',
    JSON_ARRAY('source/model.gltf'),
    1.0,
    JSON_ARRAY(0, -1, 0),
    JSON_ARRAY(0, 0, 0),
    TRUE, 
    5
);

-- Display migration summary
SELECT 'Migration completed successfully!' as status;
SELECT 'Added 3D model support fields to gadgets table' as info;
SELECT COUNT(*) as total_gadgets_with_3d_models FROM gadgets WHERE has_3d_model = TRUE;
SELECT COUNT(*) as total_gadgets FROM gadgets;