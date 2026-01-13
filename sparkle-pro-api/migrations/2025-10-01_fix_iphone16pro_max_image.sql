-- Fix incorrect image URL for iPhone 16 Pro Max
UPDATE gadgets
SET image_url = 'https://sparkle-pro.co.uk/api/images/iphone16max.png'
WHERE name = 'iPhone 16 Pro Max' AND (image_url IS NULL OR image_url LIKE '%iphone16.png%');