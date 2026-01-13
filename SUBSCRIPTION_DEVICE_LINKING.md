# Subscription Device Linking - Comprehensive Implementation

## Overview
XtraPush Plus/Premium subscriptions must be linked to specific devices for insurance coverage. This document outlines the intelligent system for managing subscription-device relationships.

## Database Schema Changes

### 1. Users Table - Add Device Linking Fields
```sql
ALTER TABLE users ADD COLUMN subscription_linked_device_id INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN subscription_linked_device_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN subscription_device_linked_date TIMESTAMP DEFAULT NULL;
```

### 2. Subscriptions Device Linking Table
```sql
CREATE TABLE IF NOT EXISTS subscription_device_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  device_id INT NOT NULL,
  order_id INT DEFAULT NULL,
  linked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  linked_by ENUM('AUTO_CHECKOUT', 'AUTO_RECENT', 'MANUAL') DEFAULT 'MANUAL',
  status ENUM('ACTIVE', 'INACTIVE', 'REPLACED') DEFAULT 'ACTIVE',
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (subscription_id),
  INDEX (device_id),
  INDEX (order_id),
  UNIQUE KEY unique_active_link (user_id, subscription_id, status)
);
```

## Intelligent Flows

### Flow 1: User Purchases Device + Subscribes (Main Site Checkout)
1. User adds device to cart
2. User proceeds to checkout
3. Checkout shows subscription offer:
   - "Add XtraPush Plus (£6/mo) to protect this device"
   - "Add XtraPush Premium (£9.99/mo) to protect ALL your devices"
4. User selects subscription tier (or skips)
5. **Smart Linking:**
   - On successful order creation → Create subscription
   - On successful payment → Link device to subscription with `linked_by='AUTO_CHECKOUT'`
   - Send confirmation email with both order and subscription details

### Flow 2: User Has Subscription, No Device Linked (Dashboard)
1. User navigates to Dashboard → Payments tab
2. System detects: subscription_status='ACTIVE' AND subscription_linked_device_id IS NULL
3. Show alert: "Your XtraPush Plus is not linked to a device. Protect your devices!"
4. Offer two options:
   - **Option A:** "Link to Recent Device" - Show last 5 purchased devices
   - **Option B:** "Link to New Device" - Redirect to gadgets store
5. On device link selection:
   - Record in `subscription_device_links` table
   - Update `users.subscription_linked_device_id`
   - Send confirmation email

### Flow 3: User Purchases New Device (Has Active Subscription)
1. User purchases new device while subscribed
2. Order completion triggered
3. **Smart Decision:**
   - If subscription tier = 'premium': Auto-link to new device (replaces old if exists)
   - If subscription tier = 'plus' AND no device linked: Auto-link to new device
   - If subscription tier = 'plus' AND device already linked: 
     - Send email: "Your XtraPush Plus is linked to Device X. Would you like to switch coverage to your new Device Y?"
     - Provide one-click link in email or dashboard prompt

### Flow 4: User Upgrades from Plus to Premium (Dashboard)
1. Plus user clicks "Upgrade to Premium"
2. Payment succeeds
3. Tier changed to 'premium' in database
4. If device was linked: Keep existing link + send email "Now all your devices are covered!"
5. If no device linked: Follow Flow 2

### Flow 5: Device Management in Dashboard
1. New section: "Subscription Coverage"
2. If subscription active:
   - Show: "Current Coverage: XtraPush Plus - Device: iPhone 15"
   - Button: "Change Device"
   - If Premium: Show "Premium - All devices covered"
3. On "Change Device" click:
   - Modal with device selection
   - "Select device from your order history" dropdown
   - Or "Browse our store to purchase a new device"
4. On device change:
   - Update `subscription_device_links`
   - Mark old link as 'REPLACED'
   - Send confirmation email

## API Endpoints

### /api/subscriptions/link-device
```
POST /api/subscriptions/link-device
Body: {
  userUid: string,
  deviceId: int,
  linkedBy: 'MANUAL' | 'AUTO_CHECKOUT' | 'AUTO_RECENT'
}
Response: {
  success: boolean,
  message: string,
  linkedDevice: { id, name, image }
}
```

### /api/subscriptions/get-linked-device
```
GET /api/subscriptions/get-linked-device?userUid=xxx
Response: {
  linkedDevice: { id, name, image, category, price },
  canChangeDevice: boolean,
  recentDevices: array
}
```

### /api/subscriptions/recent-devices
```
GET /api/subscriptions/recent-devices?userUid=xxx&limit=5
Response: {
  devices: array of { id, name, image, category, orderDate }
}
```

## Frontend Components

### 1. SubscriptionDeviceLinker (Modal/Card)
- Show device selection interface
- Display recent purchases
- Allow device browsing
- Confirm selection

### 2. SubscriptionDeviceStatus (Dashboard Widget)
- Display current linked device
- Show coverage type (Plus/Premium)
- Quick link to change device

### 3. DeviceLinkerPrompt (Alert)
- Prompt user to link device if missing
- Two action buttons
- Dismissible or blocking

### 4. CheckoutSubscriptionOffer (Checkout Component)
- Show subscription tiers
- Add to cart-like interface
- Link to new purchase device by default

## Email Templates

### 1. subscription_device_linked
Subject: "Your XtraPush Plus is now protecting Device X"
- Device details
- Coverage start date
- How to change device (link to dashboard)

### 2. subscription_device_changed
Subject: "Coverage switched to Device Y"
- Old device: coverage ended
- New device: coverage started
- Comparison of devices

### 3. subscription_device_unlinked
Subject: "Your XtraPush Plus coverage needs a device"
- Explanation
- Link to select device
- Link to browse devices

### 4. subscription_plus_upgrade_notification
Subject: "You've upgraded to XtraPush Premium!"
- All devices now covered
- List current devices
- Device management link

## Database Queries

### Get User's Subscription with Linked Device
```sql
SELECT 
  u.subscription_id,
  u.subscription_tier,
  u.subscription_status,
  u.subscription_linked_device_id,
  u.subscription_linked_device_name,
  sdl.linked_by,
  g.name as device_name,
  g.image_url,
  g.category
FROM users u
LEFT JOIN subscription_device_links sdl ON u.id = sdl.user_id AND sdl.status = 'ACTIVE'
LEFT JOIN gadgets g ON u.subscription_linked_device_id = g.id
WHERE u.uid = ?;
```

### Get Recent Devices for Subscription Linking
```sql
SELECT DISTINCT 
  g.id,
  g.name,
  g.image_url,
  g.category,
  o.order_date
FROM gadgets g
JOIN order_items oi ON g.id = oi.gadget_id
JOIN orders o ON oi.order_id = o.id
WHERE o.customer_uid = ?
  AND o.status IN ('COMPLETED', 'DELIVERED')
  AND g.id NOT IN (SELECT device_id FROM subscription_device_links WHERE user_id = ? AND status = 'ACTIVE')
ORDER BY o.order_date DESC
LIMIT 5;
```

## Business Logic Rules

1. **Plus Subscription:** 
   - Must have exactly 1 device linked
   - Can have multiple links in history (tracked as REPLACED)
   - Switching devices removes coverage from old device

2. **Premium Subscription:**
   - Coverage applies to ALL devices
   - Device linking is optional/informational
   - Used for customer communication about which devices exist

3. **New Purchase While Subscribed:**
   - Premium: Always auto-link new device
   - Plus: Auto-link only if none linked yet
   - Plus with linked device: Notify via email with change option

4. **Subscription Cancellation:**
   - Mark all device links as INACTIVE
   - Send email with device names that lost coverage

5. **Device Deletion/Removal:**
   - If linked device is deleted, show notification to user
   - Prompt to link new device
   - But continue coverage (don't auto-cancel)

## Implementation Priority

1. Database migrations (table + fields)
2. Backend API endpoints for device linking
3. Subscription order completion hook (auto-link on checkout)
4. Dashboard device management UI
5. Checkout subscription offer UI
6. Email templates and notifications
7. Testing and validation

## Success Metrics

- 80%+ subscription + device purchase rate when offered at checkout
- 70%+ device linking completion for unlinked subscriptions
- <5% support tickets about "which device is covered"
- Accurate email notifications for all linking scenarios
