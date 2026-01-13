# Location-Based Payment Gateway Implementation

## Overview
The subscription system now automatically detects the user's location and routes them to the appropriate payment gateway:
- **Malawi (MW)**: Paychangu payment gateway with MWK currency
- **Other Countries**: Square payment gateway with GBP currency

This ensures that the payment gateway is stored at subscription creation time and the background renewal system processes subscriptions using the correct gateway.

---

## Architecture

### Detection Flow
```
User Creates Subscription
    ↓
Frontend detects location (LocationContext)
    ↓
countryCode determined (e.g., 'MW', 'GB', 'US')
    ↓
getPaymentGateway(countryCode) called
    ↓
Returns: 'paychangu' (if MW) or 'square' (others)
    ↓
Gateway stored in database: subscription_payment_gateway
    ↓
Background renewal system reads stored gateway
    ↓
Processes renewal using correct payment method
```

### Database Storage
```sql
-- New field in users table
subscription_payment_gateway VARCHAR(50)  -- 'square' or 'paychangu'
subscription_renewal_date DATE            -- Next renewal date
subscription_grace_period_end DATETIME    -- Grace period (Paychangu only)
```

---

## Implementation Details

### 1. Frontend Location Detection
**File**: `src/contexts/LocationContext.jsx`

**Changes**:
- Modified `useLocation()` hook to spread location properties for easier access
- Now returns: `{ country, countryCode, currency, isInMalawi, loading, error, updateLocation }`

```javascript
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  // Spread location properties for easier access
  return { ...context.location, updateLocation: context.updateLocation };
};
```

**Usage**:
```javascript
const { isMalawi, countryCode } = useLocation();
// countryCode: 'MW', 'GB', 'US', etc.
// isMalawi: true/false
```

---

### 2. Payment Service Gateway Detection
**File**: `src/services/paymentService.js`

**Function**: `getPaymentGateway(countryCode)`
```javascript
export const getPaymentGateway = (countryCode) => {
  return countryCode === 'MW' ? 'paychangu' : 'square';
};
```

**Updated**: `createSubscription()` function
```javascript
export const createSubscription = async ({ 
  userUid, 
  customerEmail, 
  successUrl, 
  currency = 'GBP',
  tier = 'plus',
  countryCode = 'GB'  // ← NEW parameter
}) => {
  const gateway = getPaymentGateway(countryCode);  // ← Detect gateway
  
  const response = await subscriptionsAPI.create({
    userUid,
    customerEmail,
    successUrl,
    currency,
    tier,
    gateway  // ← Pass to API
  });
  
  return response;
};
```

---

### 3. API Layer Update
**File**: `src/services/api.js`

**Updated**: `subscriptionsAPI.create()`
```javascript
create: async (params) => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/subscriptions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userUid: params.userUid,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      currency: params.currency || 'GBP',
      tier: params.tier || 'plus',
      gateway: params.gateway || 'square'  // ← NEW parameter
    })
  });
  return response.json();
}
```

---

### 4. Component Updates

#### SubscriptionCard.jsx
**File**: `src/components/SubscriptionCard.jsx`

**Changes**:
```javascript
const SubscriptionCard = () => {
  const { user } = useAuth();
  const { isMalawi, countryCode } = useLocation();  // ← Added countryCode
  
  const handleSubscribe = async (tier) => {
    try {
      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        currency: isMalawi ? 'MWK' : 'GBP',
        tier: tier,
        countryCode: countryCode || (isMalawi ? 'MW' : 'GB')  // ← NEW parameter
      });
      // ...
    }
  };
};
```

#### SubscriptionBanner.jsx
**File**: `src/components/SubscriptionBanner.jsx`

**Changes**:
```javascript
const SubscriptionBanner = ({ variant, onDismiss, showDismiss }) => {
  const { isMalawi, countryCode } = useLocation();  // ← Added countryCode
  
  const handleSubscribe = async () => {
    try {
      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        countryCode: countryCode || (isMalawi ? 'MW' : 'GB')  // ← NEW parameter
      });
      // ...
    }
  };
};
```

---

### 5. Backend Gateway Storage
**File**: `sparkle-pro-api/index.php`

**Function**: `square_create_subscription()`

**Already Implemented**:
```php
function square_create_subscription() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userUid = $input['userUid'] ?? null;
    $customerEmail = $input['customerEmail'] ?? null;
    $tier = $input['tier'] ?? 'plus';
    $gateway = $input['gateway'] ?? 'square';  // ← Receive from frontend
    
    // ... create subscription via Square API ...
    
    // Store in database
    $stmt = $conn->prepare("
        UPDATE users 
        SET subscription_id = ?, subscription_status = ?, subscription_active = 1, 
            subscription_plan_id = ?, subscription_start_date = NOW(), 
            subscription_updated_at = NOW(), square_customer_id = ?, 
            subscription_payment_gateway = ?,  -- ← Store gateway
            subscription_renewal_date = DATE_ADD(NOW(), INTERVAL 1 MONTH)  -- ← Set renewal date
        WHERE uid = ?
    ");
    $stmt->bind_param('sssssss', $subscriptionId, $status, $planId, $customerId, $gateway, $userUid);
    $stmt->execute();
}
```

---

### 6. Background Renewal System
**File**: `sparkle-pro-api/subscription_renewal_manager.php`

**Gateway Detection**:
```php
function processRenewals() {
    global $conn;
    
    $today = date('Y-m-d');
    
    // Query active subscriptions due for renewal
    $query = "SELECT uid, email, subscription_id, subscription_plan_id, 
                     subscription_payment_gateway, subscription_renewal_date
              FROM users 
              WHERE subscription_active = 1 
                AND subscription_renewal_date <= ?
                AND subscription_status = 'ACTIVE'";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($user = $result->fetch_assoc()) {
        $gateway = $user['subscription_payment_gateway'];
        
        // Route to correct gateway
        if ($gateway === 'square') {
            renewViaSquare($user);  // Auto-renew via Square API
        } else if ($gateway === 'paychangu') {
            renewViaPaychangu($user);  // Manual billing + grace period
        }
    }
}
```

---

## Testing

### Test Case 1: Malawi User Subscription
**Expected Behavior**:
1. User in Malawi opens subscription page
2. LocationContext detects: `countryCode = 'MW'`
3. `getPaymentGateway('MW')` returns `'paychangu'`
4. Subscription created with: `gateway = 'paychangu'`, `currency = 'MWK'`
5. Database shows: `subscription_payment_gateway = 'paychangu'`
6. Renewal system processes with Paychangu (manual + grace period)

**Verification**:
```sql
SELECT uid, email, subscription_payment_gateway, subscription_renewal_date
FROM users
WHERE email = 'test-malawi@example.com';

-- Expected:
-- subscription_payment_gateway: 'paychangu'
-- subscription_renewal_date: (30 days from creation)
```

---

### Test Case 2: International User Subscription
**Expected Behavior**:
1. User in UK/US opens subscription page
2. LocationContext detects: `countryCode = 'GB'` (or 'US', etc.)
3. `getPaymentGateway('GB')` returns `'square'`
4. Subscription created with: `gateway = 'square'`, `currency = 'GBP'`
5. Database shows: `subscription_payment_gateway = 'square'`
6. Renewal system processes with Square (automatic recurring)

**Verification**:
```sql
SELECT uid, email, subscription_payment_gateway, subscription_renewal_date
FROM users
WHERE email = 'test-international@example.com';

-- Expected:
-- subscription_payment_gateway: 'square'
-- subscription_renewal_date: (30 days from creation)
```

---

### Test Case 3: Background Renewal Processing
**Manual Test**:
```bash
# Trigger renewal processing
curl -X GET "https://yourdomain.com/subscriptions/process-renewals?token=YOUR_SECURE_TOKEN"
```

**Expected Output**:
```json
{
  "success": true,
  "processed": 5,
  "square_renewed": 3,
  "paychangu_billed": 2,
  "reminders_sent": 8,
  "suspended": 1
}
```

**Check Logs**:
```sql
SELECT * FROM subscription_cron_logs
ORDER BY executed_at DESC
LIMIT 10;

-- Verify:
-- - square subscriptions auto-renewed
-- - paychangu subscriptions got grace period
-- - reminder emails sent
```

---

## Deployment Checklist

### ✅ Completed
- [x] Frontend location detection (LocationContext.jsx)
- [x] Gateway detection function (paymentService.js)
- [x] API layer updates (api.js)
- [x] Component updates (SubscriptionCard.jsx, SubscriptionBanner.jsx)
- [x] Backend gateway storage (index.php - `square_create_subscription()`)
- [x] Database migration (005_subscription_renewal_system.sql)
- [x] Background renewal system (subscription_renewal_manager.php)
- [x] Build verification (0 errors)

### 📋 Remaining Tasks
- [ ] Deploy frontend changes to production
- [ ] Deploy backend changes to production
- [ ] Run database migration on production
- [ ] Setup cron job for renewal processing
- [ ] Test subscription creation in production (both Malawi and international)
- [ ] Monitor subscription_cron_logs for first renewal cycle
- [ ] Verify email notifications are being sent

---

## API Endpoint Documentation

### Create Subscription
**Endpoint**: `POST /subscriptions/create`

**Request Body**:
```json
{
  "userUid": "user_123",
  "customerEmail": "user@example.com",
  "successUrl": "https://domain.com/dashboard?subscription=success",
  "currency": "MWK",
  "tier": "plus",
  "gateway": "paychangu"
}
```

**Response**:
```json
{
  "success": true,
  "checkout_url": "https://checkout.square.site/...",
  "subscription": {
    "id": "sub_123",
    "status": "PENDING",
    "gateway": "paychangu"
  }
}
```

---

### Process Renewals
**Endpoint**: `GET /subscriptions/process-renewals?token=SECURE_TOKEN`

**Response**:
```json
{
  "success": true,
  "processed": 10,
  "square_renewed": 6,
  "paychangu_billed": 4,
  "reminders_sent": 15,
  "suspended": 2,
  "timestamp": "2024-01-15 14:30:00"
}
```

---

## Troubleshooting

### Issue: Gateway not being stored
**Symptom**: Database shows `subscription_payment_gateway = NULL`

**Solution**:
1. Check frontend is passing `countryCode` parameter
2. Verify `getPaymentGateway()` is returning correct value
3. Check backend is receiving `gateway` parameter
4. Verify database UPDATE statement includes `subscription_payment_gateway`

**Debug**:
```javascript
// Frontend console
console.log('Creating subscription with:', {
  countryCode,
  gateway: getPaymentGateway(countryCode)
});
```

```php
// Backend debug
error_log('Gateway received: ' . $gateway);
error_log('Country code: ' . $input['countryCode']);
```

---

### Issue: Wrong gateway being used
**Symptom**: Malawi user gets Square, or vice versa

**Solution**:
1. Verify LocationContext is detecting location correctly
2. Check `getPaymentGateway()` logic: `countryCode === 'MW'`
3. Ensure countryCode is being passed to `createSubscription()`
4. Verify backend is using received gateway value

**Debug**:
```sql
-- Check database values
SELECT email, country_code, subscription_payment_gateway
FROM users
WHERE subscription_active = 1;
```

---

### Issue: Renewal system using wrong gateway
**Symptom**: Paychangu subscription processed via Square API

**Solution**:
1. Verify `subscription_payment_gateway` is correctly stored in database
2. Check renewal manager is reading gateway field
3. Ensure gateway routing logic is correct

**Debug**:
```php
// In subscription_renewal_manager.php
error_log('Processing user ' . $user['email'] . ' with gateway: ' . $user['subscription_payment_gateway']);
```

---

## Summary

The subscription system now has **complete location-based payment gateway routing**:

1. ✅ **Frontend**: Detects user location and determines gateway
2. ✅ **API**: Passes gateway information to backend
3. ✅ **Backend**: Stores gateway at subscription creation
4. ✅ **Database**: Tracks gateway for each subscription
5. ✅ **Renewal System**: Uses stored gateway to process renewals correctly

**Key Benefit**: Malawi users automatically get Paychangu with MWK pricing and 7-day grace period, while international users get Square with GBP pricing and automatic recurring billing.

**Next Step**: Deploy and test in production environment.
