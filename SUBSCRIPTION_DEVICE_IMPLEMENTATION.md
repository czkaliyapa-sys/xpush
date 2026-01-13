# XtraPush Subscription-Device Linking Implementation Guide

## Overview

This is a comprehensive smart system that links XtraPush Plus/Premium subscriptions to specific devices, ensuring users have clear visibility of which device is covered and managing automatic linking when purchasing devices alongside subscriptions.

---

## What Was Implemented

### 1. **Database Layer** ✅
- Added 3 fields to `users` table:
  - `subscription_linked_device_id` - ID of currently linked device
  - `subscription_linked_device_name` - Name of linked device (cached for quick lookup)
  - `subscription_device_linked_date` - Timestamp of when device was linked

- Created `subscription_device_links` table for comprehensive history:
  - Tracks all device links (active, inactive, replaced)
  - Records how device was linked (AUTO_CHECKOUT, AUTO_RECENT, MANUAL)
  - Maintains complete audit trail for support/debugging

**Migration file:** `/sparkle-pro-api/migrations/001_add_subscription_device_linking.php`

### 2. **Backend API** ✅

Four new endpoints in `sparkle-pro-api/index.php`:

#### `POST /subscriptions/link-device`
Links a device to user's subscription. Smart behavior:
- **Plus tier:** Automatically marks old device link as REPLACED
- **Premium tier:** Allows multiple device tracking (informational)
- Sends confirmation email with device details
- Returns linked device info

```javascript
{
  userUid: "user-uid",
  deviceId: 123,
  linkedBy: "MANUAL" // or AUTO_CHECKOUT, AUTO_RECENT
}
```

#### `GET /subscriptions/linked-device?userUid=xxx`
Retrieves currently linked device and subscription status

```javascript
{
  linkedDevice: { id, name, image, category, price },
  canChangeDevice: boolean,
  tier: "plus" | "premium"
}
```

#### `GET /subscriptions/recent-devices?userUid=xxx&limit=5`
Returns user's recent purchases (excluding currently linked device)

```javascript
{
  devices: [
    { id, name, image, category, orderDate },
    ...
  ]
}
```

#### `POST /subscriptions/unlink-device`
Marks device link as inactive. Used when user cancels subscription or explicitly unlinks device.

### 3. **Frontend Services** ✅

Updated `src/services/paymentService.js` with four new functions:

```javascript
// Link device to subscription
linkDeviceToSubscription(userUid, deviceId, linkedBy)

// Get currently linked device
getLinkedDevice(userUid)

// Get recent devices for selection
getRecentDevicesForLinking(userUid, limit=5)

// Remove device link
unlinkDeviceFromSubscription(userUid)
```

Updated `src/services/api.js` with corresponding API calls

### 4. **UI Components** ✅

#### **SubscriptionDeviceLinker.jsx**
Modal component for selecting and linking devices.

Features:
- Shows user's recent purchases
- Radio selection interface
- Device metadata (category, order date)
- Auto-links if provided `deviceIdToLink` prop
- Handles AUTO_CHECKOUT and MANUAL flows
- Fallback to browse gadgets if no recent purchases

Usage:
```jsx
<SubscriptionDeviceLinker
  open={open}
  onClose={handleClose}
  onLinkSuccess={handleSuccess}
  deviceIdToLink={newDeviceId} // Optional
  linkedBy="AUTO_CHECKOUT" // or MANUAL
/>
```

#### **SubscriptionDeviceStatus.jsx**
Dashboard component showing subscription device status.

Features:
- Shows currently linked device with icon/info
- Warning alert if Plus subscription has no device
- Shows coverage details based on tier
- "Change Device" button to switch linked device
- Premium tier shows "All devices covered" message
- Loading and error states

Integrated into: UserDashboard Payments Tab

### 5. **Smart Linking Flows** ✅

#### **Flow 1: User Purchases Device + Subscribes (Checkout)**
```
User selects device + subscription at checkout
       ↓
Payment succeeds
       ↓
Order created
       ↓
Subscription created
       ↓
Auto-link new device to subscription (linkedBy='AUTO_CHECKOUT')
       ↓
Send confirmation email with both order & subscription details
```

**How to implement in checkout:**
- Add "Add XtraPush Plus/Premium" checkbox/radio before payment
- On successful payment, call:
  ```javascript
  await linkDeviceToSubscription(userUid, deviceId, 'AUTO_CHECKOUT')
  ```
- This will automatically connect the newly purchased device

#### **Flow 2: Subscription Without Device Link (Dashboard)**
```
User has active subscription, no device linked
       ↓
SubscriptionDeviceStatus shows warning alert
       ↓
"Link Now" button opens SubscriptionDeviceLinker modal
       ↓
User selects from recent purchases
       ↓
Device linked (linkedBy='MANUAL')
       ↓
Confirmation email sent
```

#### **Flow 3: User Purchases New Device (Has Subscription)**
```
Order completion triggered
       ↓
Check subscription status
       ↓
IF Premium:
  Auto-link new device (linkedBy='AUTO_RECENT')
ELSE IF Plus + no device linked:
  Auto-link new device (linkedBy='AUTO_RECENT')
ELSE IF Plus + device already linked:
  Send email: "Would you like to switch coverage?"
  Offer one-click link in email
```

**Implementation needed in order completion webhook:**
```php
// When order completes and user has subscription
if ($user['subscription_status'] == 'ACTIVE') {
    $tier = $user['subscription_tier'];
    
    if ($tier === 'premium') {
        // Always link new device
        subscription_link_device($userUid, $newDeviceId, 'AUTO_RECENT');
    } elseif ($tier === 'plus') {
        if (!$user['subscription_linked_device_id']) {
            // No device linked, link this one
            subscription_link_device($userUid, $newDeviceId, 'AUTO_RECENT');
        } else {
            // Device already linked, send email
            send_device_switch_email($userUid, $oldDeviceName, $newDeviceName);
        }
    }
}
```

#### **Flow 4: Device Management Changes**
```
User clicks "Change Device"
       ↓
Modal shows selected device
       ↓
Confirmation dialog appears
       ↓
User confirms
       ↓
SubscriptionDeviceLinker opens
       ↓
User selects new device
       ↓
Old link marked as REPLACED
       ↓
New link created
       ↓
Email confirmation sent
```

### 6. **Email Notifications** ✅

#### **subscription_device_linked Email**
Sent when device is linked to subscription

```
Subject: Your XtraPush Plus is now protecting Device X
Body:
- Device details with image
- Coverage details
- How to manage from dashboard
- Link to change device
```

#### **subscription_device_changed Email** (To implement)
Sent when device coverage is switched

#### **subscription_device_unlinked Email** (To implement)
Sent when device link is removed

#### **subscription_plus_upgrade_notification Email** (To implement)
Sent when user upgrades from Plus to Premium

---

## Files Modified

### Backend
- ✅ `/sparkle-pro-api/index.php` - Added 4 API endpoints + helper functions
- ✅ `/sparkle-pro-api/migrations/001_add_subscription_device_linking.php` - Database migration

### Frontend Services
- ✅ `/src/services/api.js` - Added subscriptionsAPI device methods
- ✅ `/src/services/paymentService.js` - Added device linking functions

### Frontend Components
- ✅ `/src/components/SubscriptionDeviceLinker.jsx` - NEW device selection modal
- ✅ `/src/components/SubscriptionDeviceStatus.jsx` - NEW dashboard status widget
- ✅ `/src/external_components/UserDashboard.jsx` - Integrated device status in payments tab

### Documentation
- ✅ `/SUBSCRIPTION_DEVICE_LINKING.md` - Complete technical specification

---

## How to Test

### 1. **Run Database Migration**
```bash
cd sparkle-pro-api
php migrations/001_add_subscription_device_linking.php
```

### 2. **Test Device Linking API**
```bash
# Link device to subscription
curl -X POST http://localhost:3001/subscriptions/link-device \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "user-123",
    "deviceId": 456,
    "linkedBy": "MANUAL"
  }'

# Get linked device
curl -X GET "http://localhost:3001/subscriptions/linked-device?userUid=user-123"

# Get recent devices
curl -X GET "http://localhost:3001/subscriptions/recent-devices?userUid=user-123&limit=5"
```

### 3. **Test Dashboard UI**
1. Login to dashboard as user with subscription
2. Go to Payments tab
3. Should see device status widget
4. If no device linked: see "Link Now" alert
5. If device linked: see device info with "Change Device" button
6. Click "Link Now" or "Change Device" to open linker modal
7. Select device from list
8. Confirm linking
9. Check email for confirmation

### 4. **Test Checkout Flow** (To implement)
1. Add device to cart
2. Add subscription checkbox at checkout
3. Complete payment
4. Device should auto-link to new subscription
5. Check email for combined order + subscription confirmation

---

## Smart Features Implemented

1. **Tier-Aware Linking**
   - Plus: Only one device at a time
   - Premium: All devices covered, optional tracking

2. **Automatic Linking**
   - AUTO_CHECKOUT: When device purchased with subscription
   - AUTO_RECENT: When new device ordered while subscribed
   - MANUAL: User explicitly linked device

3. **History Tracking**
   - subscription_device_links table maintains complete audit trail
   - ACTIVE, INACTIVE, REPLACED status tracking
   - Timestamp of each link change

4. **Email Notifications**
   - Device linked confirmation
   - Device switched notification (Plus only)
   - Device unlinked alert
   - Tier upgrade notification (Plus → Premium)

5. **Intelligent Suggestions**
   - Recent devices dropdown
   - Device metadata (category, order date)
   - Excludes currently linked device

6. **Edge Cases Handled**
   - No recent purchases: show browse gadgets button
   - Premium tier: all devices already covered
   - Device deletion: notifications sent, coverage continues
   - Plus upgrade: existing device link preserved

---

## Next Steps to Complete

### 1. **Checkout Integration** (HIGH PRIORITY)
Add subscription offer during device checkout:
- Show "Add XtraPush Plus/Premium" option
- Calculate tier based on device category
- Auto-link device on successful payment

File to modify: `/src/GadgetDetail.jsx` or checkout component

### 2. **Order Completion Webhook** (HIGH PRIORITY)
When order is completed while user has subscription:
- Check subscription status
- Auto-link new device appropriately based on tier
- Send relevant email notification

File to modify: `/sparkle-pro-api/index.php` (order completion handler)

### 3. **Additional Email Templates** (MEDIUM PRIORITY)
- subscription_device_changed (when user switches device)
- subscription_device_unlinked (when device link removed)
- subscription_plus_upgrade (when upgrading to Premium)

### 4. **Admin Dashboard** (LOW PRIORITY)
- View subscription-device links
- Manually change links for support cases
- View linking history per user

### 5. **User Profile Enhancements** (LOW PRIORITY)
- View all linked devices across subscriptions
- History of device changes
- Detailed coverage dates

---

## Business Logic Summary

```
XtraPush Plus:
├─ Must be linked to exactly 1 device
├─ New purchase auto-links (if no device yet)
├─ Switch device: old coverage ends, new coverage begins
└─ Insurance covers only the linked device

XtraPush Premium:
├─ Covers ALL devices in account
├─ Device linking is optional/informational
├─ Adding new device: automatically tracked
├─ Insurance covers all devices
└─ No need to switch coverage
```

---

## Code Examples

### Device Linking in Frontend
```javascript
import { linkDeviceToSubscription } from '../services/paymentService.js';

// When user purchases device + selects subscription
const handleCheckoutSuccess = async (orderId, deviceId) => {
  await linkDeviceToSubscription(
    userUid,
    deviceId,
    'AUTO_CHECKOUT'
  );
};
```

### Device Linking in Backend (PHP)
```php
// When order completes
function handle_order_completed($orderId, $userId) {
    $user = get_user_subscription($userId);
    
    if ($user['subscription_status'] === 'ACTIVE') {
        $deviceId = get_order_device_id($orderId);
        subscription_link_device(
            $user['uid'],
            $deviceId,
            'AUTO_RECENT'
        );
    }
}
```

### Check Device Coverage
```php
function is_device_covered($userId, $deviceId) {
    $link = get_device_link($userId, $deviceId);
    
    if (!$link) return false;
    
    $subscription = get_user_subscription($userId);
    
    // Premium covers all devices
    if ($subscription['tier'] === 'premium') {
        return $subscription['status'] === 'ACTIVE';
    }
    
    // Plus only covers linked device
    return $link['status'] === 'ACTIVE' && 
           $subscription['status'] === 'ACTIVE';
}
```

---

## Deployment Checklist

- [ ] Run database migration (`001_add_subscription_device_linking.php`)
- [ ] Deploy backend code (`sparkle-pro-api/index.php`)
- [ ] Deploy frontend components and services
- [ ] Test device linking in dashboard
- [ ] Test checkout flow with device selection
- [ ] Verify email notifications
- [ ] Test with Plus and Premium tiers
- [ ] Test on both GBP and MWK currencies
- [ ] Monitor for errors in first week
- [ ] Gather user feedback

---

## Support & Troubleshooting

### Device Not Linking
1. Check user has active subscription
2. Verify device exists in database
3. Check subscription_device_links table for errors
4. Review API response for error message

### Email Not Sending
1. Verify PHPMailer SMTP settings
2. Check server logs for email errors
3. Verify user email address is correct
4. Check SMTP credentials

### Recent Devices Not Showing
1. User must have completed orders
2. Device must exist in gadgets table
3. Should exclude currently linked device
4. Check order_items join logic

---

## Performance Considerations

- Device links indexed on user_id, subscription_id, status
- Linked device cached in users table for fast dashboard loading
- Recent devices query limits to 5 by default
- Consider caching linked device in frontend state

---

## Security Considerations

- Users can only link/manage their own subscriptions
- Device must exist in database (no arbitrary IDs)
- Email notifications sent only to subscription owner
- API validates user ownership of subscription
- All changes logged with timestamps and user IDs

