-- Migration: Update category ENUMs to support new UI categories
-- Run this after initial setup to extend allowed category values

-- Gadgets: add tablet, accessories, productivity, desktop
ALTER TABLE gadgets 
  MODIFY COLUMN category 
  ENUM('smartphone','laptop','tablet','gaming','audio','wearable','accessories','productivity','desktop') 
  NOT NULL;

-- Seller Gadgets: add tablet, accessories, productivity
ALTER TABLE seller_gadgets 
  MODIFY COLUMN category 
  ENUM('smartphone','laptop','tablet','gaming','audio','wearable','accessories','productivity') 
  NOT NULL;

-- Optional mapping note:
-- If existing rows use 'accessory', consider updating to 'accessories':
UPDATE gadgets SET category = 'accessories' WHERE category = 'accessory';
UPDATE seller_gadgets SET category = 'accessories' WHERE category = 'accessory';