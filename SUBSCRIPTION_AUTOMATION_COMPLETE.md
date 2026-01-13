# Subscription Automation Implementation - Complete

## Overview
Implemented automated subscription renewal system with:
- **Square (International/GBP)**: Card-on-file recurring billing with native Square subscription API
- **PayChangu (Malawi/MWK)**: Invoice-based renewal with urgent dashboard warning & "Continue Plan" button

---

## Implementation Details

### 1. Backend API Updates

#### A. Square Subscription Creation (`/subscriptions/create`)
- **Requirement**: Card must be provided for automated renewal
- **Behavior**: 
  - If `cardId` is provided: Creates subscription immediately with recurring billing enabled
  - If no `cardId`: Returns error (400) requiring user to provide card details
- **File**: [sparkle-pro-api/index.php](sparkle-pro-api/index.php#L2120-L2200)

```php
// Card is now REQUIRED for Square
if (!$cardId) {
    json_error('Card payment method required for automated subscription. Please provide card details to continue.', 400);
}
```

#### B. New PayChangu Renewal Endpoint (`POST /subscriptions/renew-paychangu`)
- **Purpose**: Generate checkout link for subscription renewal
- **Input**: `userUid`, `tier` (optional - uses DB stored tier)
- **Output**: Checkout URL, transaction reference, amount, currency
- **Benefits**:
  - Separates renewal flow from initial subscription
  - Generates unique tx_ref for idempotency
  - Stores pending renewal state in DB
- **File**: [sparkle-pro-api/index.php](sparkle-pro-api/index.php#L2490-L2575)

#### C. Enhanced Subscription Status Endpoint
- **Added fields**:
  - `renewalDate`: Next renewal due date
  - `daysUntilDue`: Days remaining (can be negative if overdue)
  - `requiresPayment`: Boolean flag for PayChangu pending payments
  - `inGracePeriod`: Whether within grace period before suspension
  - `gracePeriodEnd`: Timestamp when grace period ends
  - `isOverdue`: Whether renewal is past due
- **File**: [sparkle-pro-api/index.php](sparkle-pro-api/index.php#L2356-2446)

#### D. Updated Cron Job (`/subscriptions/process-renewals`)
- **Square**: Validates subscription is active and updates renewal date (Square handles actual charging)
- **PayChangu**: 
  - Marks subscription as `PENDING_PAYMENT`
  - Sets 7-day grace period
  - Records renewal in history
  - Triggers renewal email notification
- **File**: [sparkle-pro-api/index.php](sparkle-pro-api/index.php#L2705-2735)

#### E. Subscription Renewal Webhook Handler
- **Function**: `handle_subscription_renewal_payment()`
- **Trigger**: PayChangu webhook when renewal payment succeeds
- **Actions**:
  - Detects subscription renewal by tx_ref pattern (`RENEWAL-*`)
  - Updates subscription to `ACTIVE`
  - Sets next renewal date to +1 month
  - Clears grace period
  - Records success in subscription history
- **File**: [sparkle-pro-api/index.php](sparkle-pro-api/index.php#L1452-1509)

### 2. Frontend Components

#### A. New Dashboard Component: SubscriptionPaymentNotice.jsx
- **Features**:
  - Displays urgent warning for PayChangu pending payments
  - Shows "Continue Plan - Pay Now" button
  - Displays days remaining in grace period
  - Color-coded urgency (red if ≤3 days, orange if >3 days)
  - Animated warning icon and pulsing card when urgent
  - Shows benefits being protected with subscription
  - Clear pricing in MWK
  - Mobile responsive
- **File**: [src/components/SubscriptionPaymentNotice.jsx](src/components/SubscriptionPaymentNotice.jsx)

```jsx
<SubscriptionPaymentNotice 
  subscription={dashboardData.subscription}
  user={user}
  onPaymentInitiated={(result) => {
    // Handle payment initiated
  }}
/>
```

#### B. Dashboard Integration
- Added payment notice to [UserDashboard.jsx](src/external_components/UserDashboard.jsx#L70)
- Renders before today's stats when:
  - PayChangu subscription exists
  - Status is `PENDING_PAYMENT`
  - Grace period is active or overdue

#### C. API Service Enhancement
- Added `subscriptionsAPI.renewWithPaychangu()` method
- File: [src/services/api.js](src/services/api.js#L934-944)

### 3. Database Updates Required

Add these columns to `users` table if not present:
```sql
ALTER TABLE users ADD COLUMN subscription_pending_tx_ref VARCHAR(255) AFTER subscription_payment_gateway;
ALTER TABLE users ADD COLUMN subscription_grace_period_end DATETIME AFTER subscription_renewal_date;
ALTER TABLE users ADD COLUMN subscription_payment_gateway VARCHAR(50) DEFAULT 'square';
```

---

## User Journey

### Square Users (International/GBP)

1. **Subscription Purchase**
   - User enters card details via Square Web Payments
   - Backend creates subscription with `cardId`
   - First charge occurs immediately
   - Subscription marked as `ACTIVE`

2. **Automatic Renewal**
   - On renewal date, Square automatically charges card
   - No user action needed
   - Cron job validates and updates renewal date in DB
   - User continues benefiting from subscription

3. **Dashboard Experience**
   - Shows subscription tier (Plus/Premium)
   - Displays renewal date
   - No payment notice shown (fully automated)

### PayChangu Users (Malawi/MWK)

1. **Subscription Purchase**
   - User completes initial payment via PayChangu
   - Subscription marked as `ACTIVE`
   - Next renewal date set to +1 month

2. **Renewal Initiated**
   - Cron marks subscription as `PENDING_PAYMENT` (7 days before due)
   - Grace period set to +7 days from renewal date
   - User receives email notification

3. **Urgent Notice on Dashboard**
   - `SubscriptionPaymentNotice` component appears
   - Shows:
     - ⚠️ "URGENT: Payment Required!" (if ≤3 days)
     - Days remaining to pay
     - Exact amount (MWK) and benefits
     - "Continue Plan - Pay Now" button

4. **User Completes Renewal**
   - Clicks "Continue Plan - Pay Now"
   - Directed to PayChangu checkout
   - Completes payment
   - Webhook processes payment
   - Subscription renewed to `ACTIVE`
   - Grace period cleared
   - Dashboard notice disappears

5. **Late Payment Scenario**
   - If payment not made within grace period:
     - Subscription status: `GRACE_EXPIRED`
     - Benefits suspended
     - Urgent prompt with "Pay Now to Restore" button
     - Can reactivate anytime by paying (no data loss)

---

## Technical Specifications

### Transaction References (PayChangu Renewals)
**Format**: `RENEWAL-{RANDOM_HEX}-{TIMESTAMP}`
- Example: `RENEWAL-A1B2C3D4E5F6-1704808620`
- Enables webhook handler to identify renewal vs. order payments
- Ensures idempotency (same tx_ref never charged twice)

### Pricing
- **Square**: £6.00/month (Plus), £9.99/month (Premium)
- **PayChangu**: MWK 10,000/month (Plus), MWK 16,500/month (Premium)

### Grace Period
- **Duration**: 7 days from renewal date
- **Purpose**: Allow user time to pay without immediate suspension
- **Behavior**: After grace period, subscription marked as `GRACE_EXPIRED` and benefits suspended

### Email Notifications
Triggered at:
- Renewal due (cron job)
- 5 days before renewal
- 1 day before renewal
- Payment successful
- Payment overdue
- Subscription suspended (grace expired)

---

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/subscriptions/create` | Create new subscription (requires card for Square) |
| GET | `/subscriptions/status` | Get subscription status (includes renewal info) |
| POST | `/subscriptions/cancel` | Cancel subscription |
| POST | `/subscriptions/renew-paychangu` | Create renewal checkout (PayChangu only) |
| POST | `/subscriptions/process-renewals` | Cron job - process due renewals |

---

## Testing Checklist

- [ ] Square: Create subscription with card → Auto-renews on cron
- [ ] Square: Verify renewal date updates correctly
- [ ] PayChangu: Create subscription → Cron marks as PENDING_PAYMENT after 30 days
- [ ] PayChangu: Dashboard shows urgent notice on day 1 of renewal period
- [ ] PayChangu: "Continue Plan" button → PayChangu checkout works
- [ ] PayChangu: Webhook receives payment → Subscription renewed to ACTIVE
- [ ] PayChangu: Grace period properly enforced (7 days)
- [ ] PayChangu: Late payment after grace period → Benefits suspended
- [ ] Both: Cancel subscription → Status updates, history recorded
- [ ] Both: Subscription status API returns all new fields correctly

---

## Deployment Notes

1. **Database Migration**: Run SQL to add new columns
2. **Cron Configuration**: Ensure `/subscriptions/process-renewals` is called daily (recommend 00:00 UTC)
3. **Environment**: Verify `CRON_SECRET_TOKEN` is set in `.env`
4. **PayChangu Webhook**: Ensure this URL is configured in PayChangu dashboard:
   - `https://sparkle-pro.co.uk/api/payments/paychangu/webhook`
5. **Square Configuration**: Verify webhook subscriptions are enabled in Square dashboard
6. **Email Service**: Ensure email notifications can be sent (PHPMailer configured)

---

## Future Enhancements

1. **Card Management UI**: Allow users to update card on file (Square)
2. **Retry Logic**: Automatic retry for failed Square charges (built-in to Square)
3. **Installment Billing**: Option to spread renewal costs (e.g., 3-month chunks)
4. **Discount Codes**: Annual subscriptions with discount
5. **Pause Subscription**: Temporarily pause instead of cancel (reactivate within 6 months)
6. **Usage Analytics**: Track subscription adoption, churn, renewal success rates

