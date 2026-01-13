# Trade-In Feature & Backend Integration Documentation

## Overview
This document outlines the comprehensive Trade-In feature implementation and the backend integration improvements made to support email notifications, payments, receipts, subscriptions, and dashboard dynamic data.

---

## Trade-In Feature

### Frontend Components

#### 1. Route Configuration (`src/index.js`)
```jsx
const TradeInPage = React.lazy(() => import('./TradeInPage.jsx'));
// Route: /trade-in
<Route path="/trade-in" element={<TradeInPage />} />
```

#### 2. Navigation Links (`src/constants/index.js`)
Trade-In added to:
- `navLinks` - Header desktop navigation
- `mobileNavLinks` - Mobile hamburger menu
- `footerLinks` - Footer navigation

#### 3. Trade-In Wizard (`src/components/TradeInSection.jsx`)
5-step wizard process:
1. **Select Device** - Choose category (smartphone, laptop, tablet, smartwatch, headphones, camera)
2. **Device Details** - Brand, model, storage
3. **Condition Assessment** - Excellent/Very Good/Good/Fair/Poor with value multipliers
4. **Contact Info** - Name, email, phone, address
5. **Quote Review** - Summary with estimated value

Features:
- Real-time value estimation with brand/condition multipliers
- API integration for submission
- Success confirmation with reference number
- Email confirmation sent to customer and admin

#### 4. Trade-In API (`src/services/api.js`)
```javascript
export const tradeInAPI = {
  submit: async (tradeInData) => {...},
  getStatus: async (reference) => {...},
  getHistory: async (userUid) => {...},
  getEstimate: async (deviceInfo) => {...},
  cancel: async (reference, userUid) => {...}
};
```

### Backend Endpoints (`sparkle-pro-api/index.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trade-in/submit` | Submit new trade-in request |
| GET | `/trade-in/status/{reference}` | Get trade-in status by reference |
| GET | `/trade-in/history?uid={uid}` | Get user's trade-in history |
| POST | `/trade-in/estimate` | Get quick value estimate |
| POST | `/trade-in/cancel` | Cancel a trade-in request |

### Database Table: `trade_ins`
Auto-created on first trade-in submission:
- `id`, `reference` (unique)
- `category`, `category_name`
- `device_brand`, `device_model`, `device_storage`, `device_condition`, `device_accessories`
- `estimated_value`, `final_value`
- `customer_name`, `customer_email`, `customer_phone`, `customer_address`
- `status` (pending, under_review, approved, rejected, completed, cancelled)
- `notes`, timestamps

---

## Email Notification System

### Frontend API (`src/services/api.js`)
```javascript
export const notificationsAPI = {
  sendEmail: async ({ to, subject, body, templateId, templateData }) => {...},
  getUserNotifications: async (userUid) => {...},
  markAsRead: async (notificationId) => {...},
  subscribe: async ({ email, types }) => {...},
  unsubscribe: async ({ email, types }) => {...}
};
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/email` | Send custom email with optional templates |
| GET | `/notifications/user/{uid}` | Get user's notifications |
| PUT | `/notifications/{id}/read` | Mark notification as read |
| POST | `/notifications/subscribe` | Subscribe to email notifications |
| POST | `/notifications/unsubscribe` | Unsubscribe from notifications |

### Email Templates
Available template IDs:
- `welcome` - New user welcome
- `order_confirmation` - Order confirmed
- `payment_received` - Payment confirmation
- `trade_in_update` - Trade-in status update
- `subscription_reminder` - Subscription renewal reminder

### Database Tables
- `user_notifications` - In-app notifications
- `email_subscriptions` - Email subscription preferences

---

## Subscription System

### Frontend API (`src/services/api.js`)
```javascript
export const subscriptionsAPI = {
  getStatus: async (userUid) => {...},
  create: async (params) => {...},
  cancel: async (userUid) => {...}
};
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/status?uid={uid}` | Get subscription status |
| POST | `/subscriptions/create` | Create new subscription |
| POST | `/subscriptions/cancel` | Cancel subscription |

### Database Fields (in `users` table)
- `subscription_id`
- `subscription_status` (ACTIVE, CANCELED, etc.)
- `subscription_active` (boolean)
- `subscription_plan_id`
- `subscription_start_date`, `subscription_end_date`, `subscription_updated_at`

---

## Installments & Receipts

### Frontend API (`src/services/api.js`)
```javascript
export const installmentsAPI = {
  getPlan: async (orderId) => {...},
  makePayment: async (params) => {...},
  generateReceipt: async (orderId) => {...},
  scheduleReminder: async ({ orderId, daysBefore }) => {...},
  listReceipts: async (userUid) => {...}
};
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/installments/plan?orderId={id}` | Get installment plan details |
| GET | `/installments/{orderId}/receipt` | Generate receipt for order |
| POST | `/installments/reminder` | Schedule payment reminder |
| GET | `/installments/receipts?uid={uid}` | List user's receipts |

### Database Table: `scheduled_reminders`
- `id`, `order_id`, `reminder_type`
- `scheduled_for`, `sent`, `email`
- `created_at`

---

## Dashboard Integration

### Dynamic Data Loading (`src/external_components/UserDashboard.jsx`)

The dashboard now fetches:
```javascript
const [ordersRes, gadgetsRes, subscriptionRes, tradeInsRes] = await Promise.allSettled([
  ordersAPI.getUserOrders(uid),
  gadgetsAPI.getAll({ limit: 20 }),
  subscriptionsAPI.getStatus(uid),
  tradeInAPI.getHistory(uid)
]);
```

Dashboard data includes:
- `orders` - User's order history
- `wishlist` - Saved items
- `recentActivity` - Activity timeline
- `stats` - Total spent, order counts
- `recommendations` - Personalized product suggestions
- `installments` - Active lease/installment plans
- `notifications` - User notifications
- `subscription` - Subscription status and benefits
- `tradeIns` - Trade-in history

---

## Payment Gateways

### PayChangu (Malawi - MWK)
- Integration: `POST /payments/paychangu/checkout`
- Webhook: `POST /payments/paychangu/callback`
- Verification: `GET /payments/paychangu/verify/{txRef}`

### Square (International - GBP)
- Integration: `POST /payments/square/create-checkout-session`
- Webhook: `POST /payments/square/webhook`
- Verification: `GET /payments/square/verify/{paymentId}`

---

## PHPMailer Configuration

```php
SMTP_HOST: mail.deegits.com
SMTP_PORT: 587
SMTP_SECURE: tls
MAIL_FROM: no-reply@support.itsxtrapush.com
MAIL_FROM_NAME: Xtrapush Support
```

---

## Testing Checklist

### Trade-In
- [ ] Navigate to /trade-in
- [ ] Complete 5-step wizard
- [ ] Verify submission success
- [ ] Check email confirmation
- [ ] Verify database record

### Subscriptions
- [ ] Check subscription status on dashboard
- [ ] Test subscription creation
- [ ] Verify subscription cancellation

### Notifications
- [ ] Subscribe to email notifications
- [ ] Unsubscribe from notifications
- [ ] Verify email delivery

### Installments/Receipts
- [ ] View installment plan details
- [ ] Generate receipt
- [ ] Schedule reminder

### Dashboard
- [ ] Login and view dashboard
- [ ] Verify orders load
- [ ] Check recommendations appear
- [ ] Verify subscription status displays
- [ ] Check trade-in history

---

## API Base URL
- Production: `https://itsxtrapush.com/gadgets`
- The frontend API automatically prefixes all endpoints with this base URL

---

## Build Status
✅ Build compiles successfully with warnings only (no errors)
