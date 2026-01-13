# Location-Based Pricing - Quick Reference

## Quick Start (30 seconds)

1. **Import the hook:**
   ```jsx
   import { usePricing } from '../hooks/usePricing';
   ```

2. **Use it in your component:**
   ```jsx
   const { formatLocalPrice } = usePricing();
   return <p>Price: {formatLocalPrice(gadget.price)}</p>;
   ```

That's it! Location detection happens automatically.

---

## Hook: `usePricing()`

Returns:
- `currency` - 'USD' or 'MWK'
- `isInMalawi` - boolean
- `getLocalPrice(usdPrice)` - converts USD to local currency
- `formatLocalPrice(usdPrice)` - formatted price string
- `formatLocalPriceCompact(usdPrice)` - compact formatted price (e.g., "$1.2K")
- `loading` - boolean (true while detecting location)

### Usage:
```jsx
const { formatLocalPrice, currency, isInMalawi } = usePricing();

// Basic
<p>{formatLocalPrice(999.99)}</p>  // "$999.99" or "MWK 1,020,000"

// Compact
<p>{formatLocalPriceCompact(999.99)}</p>  // "$999.99" or "MWK 1.0M"

// Check location
{isInMalawi && <span>Malawi price applied</span>}

// Get raw converted value
const mwkValue = getLocalPrice(999.99);  // 1020000
```

---

## Hook: `useLocation()`

Returns:
- `location.country` - e.g., "Malawi"
- `location.countryCode` - e.g., "MW"
- `location.currency` - "USD" or "MWK"
- `location.isInMalawi` - boolean
- `location.loading` - boolean
- `location.error` - error message if detection failed
- `updateLocation(data)` - manually set location

### Usage:
```jsx
const { location } = useLocation();

{location.loading ? (
  <p>Detecting location...</p>
) : (
  <p>Welcome to {location.country}!</p>
)}
```

---

## Service: `currencyService`

Utility functions for manual currency operations:

```javascript
import {
  convertUsdToMwk,        // convertUsdToMwk(999.99) → 1020000
  convertMwkToUsd,        // convertMwkToUsd(1020000) → 999.99
  getPriceInLocalCurrency, // getPriceInLocalCurrency(999.99, 'MWK') → 1020000
  formatPrice,            // formatPrice(999.99, 'USD') → "$999.99"
  formatPriceCompact,     // formatPriceCompact(1999.99, 'USD') → "$2.0K"
  updateExchangeRates,    // Manual rate update
  getExchangeRates,       // Get current rates
  fetchLiveExchangeRates, // Fetch from API
} from '../services/currencyService';
```

---

## Common Patterns

### Pattern 1: Simple Product Display
```jsx
import { usePricing } from '../hooks/usePricing';

export const ProductCard = ({ product }) => {
  const { formatLocalPrice } = usePricing();
  return (
    <div className="product">
      <h3>{product.name}</h3>
      <p className="price">{formatLocalPrice(product.price)}</p>
    </div>
  );
};
```

### Pattern 2: Cart Total
```jsx
export const CartSummary = ({ items }) => {
  const { formatLocalPrice } = usePricing();
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  
  return <h3>Total: {formatLocalPrice(total)}</h3>;
};
```

### Pattern 3: Location-Specific UI
```jsx
export const PricingAlert = ({ price }) => {
  const { isInMalawi, currency } = usePricing();
  
  return (
    <div>
      <p>Price: {formatLocalPrice(price)}</p>
      {isInMalawi ? (
        <p>🇲🇼 Special Malawi pricing applied</p>
      ) : (
        <p>💵 International pricing</p>
      )}
    </div>
  );
};
```

### Pattern 4: Loading State
```jsx
export const PriceDisplay = ({ price }) => {
  const { formatLocalPrice, loading } = usePricing();
  
  return loading ? (
    <p>Loading price...</p>
  ) : (
    <p>{formatLocalPrice(price)}</p>
  );
};
```

---

## Database Rules

✅ **DO:**
- Store all prices in USD
- Keep USD as the base currency
- Update exchange rates daily

❌ **DON'T:**
- Mix USD and MWK in the database
- Store prices in multiple currencies
- Assume exchange rates are static

---

## Exchange Rates

Current default: **1 USD = 1020.4 MWK**

### Update Rates

Manual:
```javascript
import { updateExchangeRates } from '../services/currencyService';
updateExchangeRates(0.00098, 1020.4); // MWK_TO_USD, USD_TO_MWK
```

Live (recommended):
```javascript
import { fetchLiveExchangeRates } from '../services/currencyService';
// Call once per day
await fetchLiveExchangeRates();
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Location not detected | Check browser console, ensure JS enabled |
| Wrong currency shown | Clear localStorage, hard refresh page |
| Prices not converting | Ensure prices in DB are USD, check rates |
| Loading never ends | Check geolocation service, look at errors |
| Different users see different prices | This is normal! Working as intended. |

---

## Files Changed/Added

```
src/
├── contexts/
│   └── LocationContext.jsx ✨ NEW
├── hooks/
│   └── usePricing.js ✨ NEW
├── services/
│   └── currencyService.js ✨ NEW
├── components/
│   └── PricingExample.jsx ✨ NEW
├── utils/
│   └── formatters.js (UPDATED)
└── index.js (UPDATED)

LOCATION_BASED_PRICING.md ✨ NEW
COMPONENT_MIGRATION_EXAMPLES.md ✨ NEW
```

---

## Testing

```bash
# Test in Malawi (use VPN)
# Expected: Prices in MWK

# Test outside Malawi
# Expected: Prices in USD

# Check console for any errors
# Should see location detection messages
```

---

## API Endpoints Used

- `https://ip-api.com/json` - Primary geolocation
- `https://ipapi.co/json` - Fallback geolocation  
- `https://api.exchangerate-api.com/v4/latest/USD` - Live rates (optional)

All are free services, no API key required for basic usage.
