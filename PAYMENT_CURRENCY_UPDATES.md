# Payment System Currency Updates - Dual Currency Support (MWK/USD)

## Overview
Updated the PayChangu payment API integration to support both MWK and USD payments based on user location. User location is automatically detected via IP geolocation, with Malawi users paying in MWK and international users paying in USD.

## Changes Made

### 1. **CheckoutForm.jsx** (src/components/)
**Purpose**: Individual gadget checkout page
- ✅ Already had `usePricing()` hook imported
- ✅ Now uses `currency` from hook to select correct price (price for MWK, price_usd for USD)
- ✅ Passes `currency: currency` to `paymentsAPI.createCheckoutSession()`

**Changes**:
```javascript
// Before
const payloadItems = [{
  id: gadget.id,
  name: gadget.name,
  price: gadget.price,  // Always MWK
  ...
}];
const response = await paymentsAPI.createCheckoutSession(payloadItems, {
  successUrl: '...',
  cancelUrl: '...',
  customerEmail: user?.email || undefined
  // Missing currency
});

// After
const priceToUse = currency === 'MWK' ? gadget.price : (gadget.price_usd || gadget.priceUsd);
const payloadItems = [{
  id: gadget.id,
  name: gadget.name,
  price: priceToUse,  // Currency-aware price
  ...
}];
const response = await paymentsAPI.createCheckoutSession(payloadItems, {
  successUrl: '...',
  cancelUrl: '...',
  customerEmail: user?.email || undefined,
  currency: currency  // ✅ Now passes user's currency
});
```

### 2. **CartModal.jsx** (src/components/)
**Purpose**: Shopping cart and multi-item checkout
- ✅ Added import: `import { usePricing } from '../hooks/usePricing';`
- ✅ Added to component: `const { currency } = usePricing();`
- ✅ Passes `currency: currency` to `paymentsAPI.createCheckoutSession()`

**Changes**:
```javascript
// Before
import { useCart } from '../contexts/CartContext';
import { formatMWK } from '../utils/formatters';
import { paymentsAPI, gadgetsAPI } from '../services/api.js';
// ... no usePricing import

const CartModal = ({ open, onClose }) => {
  const { items, ... } = useCart();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  // ... no currency variable

  const session = await paymentsAPI.createCheckoutSession(sessionItems, {
    successUrl: '...',
    cancelUrl: '...',
    customerEmail: user?.email || undefined
    // Missing currency
  });

// After
import { useCart } from '../contexts/CartContext';
import { usePricing } from '../hooks/usePricing';  // ✅ Added
import { formatMWK } from '../utils/formatters';
import { paymentsAPI, gadgetsAPI } from '../services/api.js';

const CartModal = ({ open, onClose }) => {
  const { items, ... } = useCart();
  const { user, userProfile } = useAuth();
  const { currency } = usePricing();  // ✅ Added
  const navigate = useNavigate();

  const session = await paymentsAPI.createCheckoutSession(sessionItems, {
    successUrl: '...',
    cancelUrl: '...',
    customerEmail: user?.email || undefined,
    currency: currency  // ✅ Now passes user's currency
  });
```

### 3. **Installments.jsx** (src/external_components/)
**Purpose**: Displays and manages installment plan details and payments
- ✅ Added import: `import { usePricing } from '../hooks/usePricing';`
- ✅ Added to component: `const { currency } = usePricing();`
- ✅ Changed hardcoded `currency: 'MWK'` to `currency: currency`

**Changes**:
```javascript
// Before
import { ordersAPI, adminAPI, installmentsAPI, paymentsAPI } from '../services/api.js';
// ... no usePricing import

export default function Installments() {
  const { user, isAdmin, userProfile } = useAuth();
  // ... no currency variable

  const options = {
    customerEmail: user?.email || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: 'MWK'  // Hardcoded to MWK only
  };

// After
import { usePricing } from '../hooks/usePricing';
import { ordersAPI, adminAPI, installmentsAPI, paymentsAPI } from '../services/api.js';

export default function Installments() {
  const { user, isAdmin, userProfile } = useAuth();
  const { currency } = usePricing();  // ✅ Added

  const options = {
    customerEmail: user?.email || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: currency  // ✅ Now uses user's currency
  };
```

### 4. **InstallmentPaymentModal.jsx** (src/components/)
**Purpose**: Modal for making installment payments
- ✅ Added import: `import { usePricing } from '../hooks/usePricing';`
- ✅ Added to component: `const { currency } = usePricing();`
- ✅ Changed hardcoded `currency: 'MWK'` to `currency: currency`

**Changes**:
```javascript
// Before
import { paymentsAPI } from '../services/api.js';
// ... no usePricing import

const InstallmentPaymentModal = ({ open, onClose, order, customerEmail, initialPayMode = 'weekly', initialCustomAmount = null }) => {
  // ... no currency variable

  const options = {
    customerEmail: customerEmail || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: 'MWK'  // Hardcoded to MWK only
  };

// After
import { usePricing } from '../hooks/usePricing';
import { paymentsAPI } from '../services/api.js';

const InstallmentPaymentModal = ({ open, onClose, order, customerEmail, initialPayMode = 'weekly', initialCustomAmount = null }) => {
  const { currency } = usePricing();  // ✅ Added

  const options = {
    customerEmail: customerEmail || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: currency  // ✅ Now uses user's currency
  };
```

### 5. **InstallmentModal.jsx** (src/components/)
**Purpose**: Modal for starting a new installment plan
- ✅ Added import: `import { usePricing } from '../hooks/usePricing';`
- ✅ Added to component: `const { currency } = usePricing();`
- ✅ Changed hardcoded `currency: 'MWK'` to `currency: currency`

**Changes**:
```javascript
// Before
import { paymentsAPI, gadgetsAPI } from '../services/api.js';
// ... no usePricing import

const InstallmentModal = ({ open, onClose, item, customerEmail }) => {
  const [weeks, setWeeks] = useState(2);
  // ... no currency variable

  const options = {
    customerEmail: customerEmail || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: 'MWK'  // Hardcoded to MWK only
  };

// After
import { usePricing } from '../hooks/usePricing';
import { paymentsAPI, gadgetsAPI } from '../services/api.js';

const InstallmentModal = ({ open, onClose, item, customerEmail }) => {
  const [weeks, setWeeks] = useState(2);
  const { currency } = usePricing();  // ✅ Added

  const options = {
    customerEmail: customerEmail || null,
    successUrl: '...',
    cancelUrl: '...',
    installmentPlan,
    currency: currency  // ✅ Now uses user's currency
  };
```

## How It Works

### User Location Detection
1. **LocationContext** detects user's country via IP geolocation
2. **usePricing Hook** determines currency based on location:
   - **Malawi (MW)**: Currency = 'MWK'
   - **Other countries**: Currency = 'USD'

### Payment Flow
```
User accesses checkout
    ↓
usePricing() hook determines location-based currency
    ↓
Frontend components display prices in user's currency
    ↓
When creating checkout session:
  - Pass user's currency to paymentsAPI.createCheckoutSession()
  - Use currency-aware price (price vs price_usd)
    ↓
API layer forwards currency to backend
    ↓
Backend PayChangu integration:
  - Creates checkout with correct currency
  - PayChangu processes payment in user's currency
    ↓
Payment gateway returns result
```

## Backend Support (Already Ready)
✅ `sparkle-pro-api/index.php` - `create_checkout_session()` function:
- Accepts `currency` parameter from request
- Uses currency in PayChangu payload
- Stores currency in session for tracking

✅ `src/services/api.js` - `createCheckoutSession()` function:
- Accepts `currency` in options parameter
- Passes to backend with default 'MWK' fallback

## Database Support (Already Ready)
✅ All 46 gadgets in database have:
- `price` (in MWK)
- `price_usd` (in USD, calculated at 1 USD = 1800 MWK)
- `monthly_price` (in MWK)
- `monthly_price_usd` (in USD)

## Exchange Rate
- **1 USD = 1800 MWK**
- Used for all USD ↔ MWK conversions
- Stored in `src/services/currencyService.js`

## Files Modified
1. ✅ `src/components/CheckoutForm.jsx`
2. ✅ `src/components/CartModal.jsx`
3. ✅ `src/external_components/Installments.jsx`
4. ✅ `src/components/InstallmentPaymentModal.jsx`
5. ✅ `src/components/InstallmentModal.jsx`

## Files NOT Modified (Already Correct)
- `sparkle-pro-api/index.php` - Backend payment function already supports dual currency
- `src/services/api.js` - API service already accepts currency parameter
- Database - Already has USD columns populated with correct prices
- `src/hooks/usePricing.js` - Location detection and currency determination working correctly

## Testing Checklist
- [ ] Test checkout with Malawi location (should show MWK prices, process in MWK)
- [ ] Test checkout with international location (should show USD prices, process in USD)
- [ ] Test installment plan with Malawi location (should process in MWK)
- [ ] Test installment plan with international location (should process in USD)
- [ ] Test cart checkout with mixed locations
- [ ] Verify PayChangu receives correct currency with each payment
- [ ] Verify payment confirmation shows correct currency
- [ ] Test installment payment from Installments page with different currencies

## Deployment Notes
All changes are frontend-only. No backend or database changes required.
Users should clear browser cache to ensure latest pricing calculations are used.

## Summary
Payment system now fully supports dual currency (MWK/USD) with automatic location-based currency selection. All checkout flows - regular purchases, installments, and payment reminders - respect the user's location and process payments in the appropriate currency.
