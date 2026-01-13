# Dual Payment Gateway Implementation

## Overview

The itsxtrapush platform now supports two payment gateways based on user location:

| Location | Gateway | Currency | Use Case |
|----------|---------|----------|----------|
| Malawi (MW) | PayChangu | MWK (Malawian Kwacha) | Mobile money payments |
| International | Stripe | GBP (British Pounds) | Card payments |

## Architecture

### Location Detection Flow

```
User visits site
    ↓
LocationContext detects country (IP-based)
    ↓
isMalawi = true/false
    ↓
Payment gateway auto-selected
    ↓
Checkout uses appropriate provider
```

### File Structure

```
src/
├── contexts/
│   ├── LocationContext.jsx     # Location detection & isMalawi flag
│   └── PaymentContext.jsx      # Payment state management (new)
├── services/
│   ├── api.js                  # API endpoints for both gateways
│   ├── paymentService.js       # Payment routing logic (new)
│   └── currencyService.js      # Currency formatting
├── components/
│   ├── CheckoutForm.jsx        # Updated for dual gateway
│   ├── CartModal.jsx           # Updated for dual gateway
│   └── InstallmentModal.jsx    # Updated for dual gateway
└── hooks/
    └── usePricing.js           # Price formatting by location

sparkle-pro-api/
├── index.php                   # Backend with both gateway handlers
└── stripe_sessions.json        # Stripe session storage (auto-created)
```

## Backend API Endpoints

### PayChangu (Malawi - MWK)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-checkout-session` | Create PayChangu checkout |
| GET | `/payments/paychangu/verify/{txRef}` | Verify PayChangu payment |
| GET | `/payments/config` | Get PayChangu config |
| POST | `/payments/paychangu/webhook` | PayChangu webhook handler |

### Stripe (International - GBP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/stripe/create-checkout-session` | Create Stripe checkout |
| GET | `/payments/stripe/verify/{sessionId}` | Verify Stripe payment |
| GET | `/payments/stripe/config` | Get Stripe config (publishable key) |
| POST | `/payments/stripe/webhook` | Stripe webhook handler |

## Configuration

### Environment Variables (Backend)

Add to `sparkle-pro-api/index.php` or environment:

```php
// PayChangu (Malawi) - Already configured
define('PAYCHANGU_PUBLIC_KEY', 'pub-live-xz1XYFcGESewLhGrETYhJibsVUaFx2Yo');
define('PAYCHANGU_SECRET_KEY', 'sec-live-Z8Yv7SbOVKEXZsMBZTJL4zZS8dlYaq6j');

// Stripe (International) - Add your keys here
define('STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('STRIPE_SECRET_KEY', 'sk_live_...');
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');
```

### Stripe Setup Steps

1. **Get Stripe Keys**:
   - Log into [Stripe Dashboard](https://dashboard.stripe.com)
   - Go to Developers > API Keys
   - Copy Publishable Key and Secret Key

2. **Update Backend**:
   ```php
   define('STRIPE_PUBLISHABLE_KEY', 'pk_live_YOUR_KEY');
   define('STRIPE_SECRET_KEY', 'sk_live_YOUR_KEY');
   ```

3. **Set Up Webhooks**:
   - Go to Developers > Webhooks in Stripe
   - Add endpoint: `https://api.itsxtrapush.com/payments/stripe/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Frontend Usage

### CheckoutForm.jsx

```jsx
import { useLocation } from '../contexts/LocationContext';

const CheckoutForm = ({ gadget }) => {
  const { isMalawi } = useLocation();
  
  const handleCheckout = async () => {
    if (isMalawi) {
      // PayChangu checkout (MWK)
      await paymentsAPI.createCheckoutSession(items, { currency: 'MWK' });
    } else {
      // Stripe checkout (GBP)
      await paymentsAPI.createStripeCheckout(items, { currency: 'GBP' });
    }
  };
};
```

### CartModal.jsx

The cart automatically:
1. Detects user location via `useLocation()`
2. Sets payment gateway (`paychangu` or `stripe`)
3. Uses correct currency (`MWK` or `GBP`)
4. Calls appropriate API endpoint

### InstallmentModal.jsx

Installment payments work with both gateways:
- Malawi users pay deposits/installments via PayChangu (MWK)
- International users pay via Stripe (GBP)

## Currency Handling

### Price Fields in Database

| Field | Currency | Usage |
|-------|----------|-------|
| `price_mwk` | MWK | Malawi price |
| `price_gbp` | GBP | International price |
| `price` | MWK | Legacy (use price_mwk) |

### Exchange Rates

- 1 GBP ≈ 2358 MWK
- Prices are stored separately to avoid conversion rounding

## Testing

### Test PayChangu (Malawi)

1. Use VPN or set location to Malawi
2. Add item to cart
3. Checkout should show "PayChangu (MWK)"
4. Complete mobile money payment

### Test Stripe (International)

1. Access from non-Malawi location
2. Add item to cart
3. Checkout should show "Stripe (GBP)"
4. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Webhook Handling

### PayChangu Webhook

Receives payment confirmations and:
1. Updates session status
2. Sends confirmation emails
3. Creates order records

### Stripe Webhook

Handles events:
- `checkout.session.completed` → Payment successful
- `checkout.session.expired` → Session timeout
- `payment_intent.payment_failed` → Payment failed

## Security Considerations

1. **API Keys**: Never expose secret keys in frontend code
2. **Webhook Signatures**: Verify Stripe webhook signatures
3. **HTTPS**: All payment endpoints must use HTTPS
4. **CORS**: Backend allows requests from itsxtrapush.com only

## Troubleshooting

### "Stripe API key is not configured"

Add Stripe keys to `index.php`:
```php
define('STRIPE_SECRET_KEY', 'sk_live_...');
```

### Payments always going to PayChangu

Check `LocationContext.jsx` is properly detecting location:
```jsx
const { country, isMalawi } = useLocation();
console.log('Country:', country, 'isMalawi:', isMalawi);
```

### Currency mismatch errors

Ensure correct currency is passed:
- Malawi: `currency: 'MWK'`
- International: `currency: 'GBP'`

## Future Enhancements

- [ ] Add more payment methods (Apple Pay, Google Pay via Stripe)
- [ ] Support additional African countries with PayChangu
- [ ] Add EUR/USD options for international users
- [ ] Implement subscription billing for installments

---

**Last Updated**: January 2025
**Maintained By**: Xtrapush Development Team
