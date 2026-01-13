# Dual Currency Implementation - Remaining Updates

This document outlines the remaining components that need to be updated to support dual currency (MWK/USD) pricing based on user location.

## Components to Update

### 1. WishlistPage.jsx (Line 99)
**Current:** Uses `gadget.price` directly
**Change:** Update to use location-based pricing

### 2. GadgetsPage.jsx (Lines 47, 576)
**Current:** Price filtering and display use MWK-only values
**Change:** Update price filtering to support both currencies

### 3. CardDeal Component
**Current:** Displays prices in MWK format
**Change:** Update to use usePricing hook

### 4. All Card Components
**Current:** Any component displaying gadget prices
**Change:** Use formatLocalPrice hook

## Implementation Pattern

For each component:

1. Import the pricing hook:
```jsx
import { usePricing } from '../hooks/usePricing';
```

2. Add hook to component:
```jsx
const { formatLocalPrice, currency, isInMalawi } = usePricing();
```

3. Replace formatMWK calls:
```jsx
// Before
{formatMWK(gadget.price)}

// After
{formatLocalPrice(isInMalawi ? gadget.price : (gadget.price_usd || gadget.price / 1020.4))}
```

## Database Migration

Run the migration SQL:
```bash
# Execute migration in MySQL/phpMyAdmin
source migrations/2025-12-13_add_usd_pricing.sql;
```

This adds:
- `price_usd` column to gadgets table
- `monthly_price_usd` column to gadgets table
- Index on price_usd for performance

## Backend API Changes

All endpoints now return both pricing columns:
- GET /gadgets - Returns price, price_usd, monthly_price, monthly_price_usd
- GET /gadgets/:id - Returns all price columns
- POST /admin/gadgets - Accepts priceUsd, monthlyPriceUsd
- PUT /admin/gadgets/:id - Updates both currency prices

## Frontend API Changes

The gadgetsAPI now returns gadgets with:
```javascript
{
  id: 1,
  name: "iPhone",
  price: 3500000,        // MWK
  price_usd: 3429.88,    // USD
  monthly_price: 145833, // MWK
  monthly_price_usd: 142.86, // USD
  // ... other fields
}
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Backend returns both currency prices
- [ ] Dashboard allows entering both MWK and USD prices
- [ ] GadgetDetail displays correct currency based on location
- [ ] All gadget cards display correct currency
- [ ] Wishlist shows location-based prices
- [ ] Cart/Checkout uses location-based prices
- [ ] Orders display prices correctly
- [ ] Price filters work with both currencies
- [ ] Test with VPN on Malawi IP (should show MWK)
- [ ] Test without VPN (should show USD)
