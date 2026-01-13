# Currency Exchange Rate Update - December 13, 2025

## Changes Made

### 1. Database Schema (itsxtrapush_db.sql) ✅
**Exchange Rate Updated: 1 USD = 1800 MWK**

All 46 gadgets have been recalculated with the new exchange rate:
- Column `price_usd` - Updated with recalculated USD values
- Column `monthly_price_usd` - Updated with recalculated monthly USD values

Example conversions:
- MacBook Pro M4: 3,500,000 MWK = $1,944.44 USD
- iPhone 16 Pro Max: 5,000,000 MWK = $2,777.78 USD
- Samsung S25 Ultra: 2,250,000 MWK = $1,250.00 USD

### 2. Currency Service (src/services/currencyService.js) ✅
**Exchange Rates Updated:**
```javascript
const EXCHANGE_RATES = {
  MWK_TO_USD: 0.00055556,  // 1 USD = 1800 MWK
  USD_TO_MWK: 1800,         // 1 USD = 1800 MWK
};
```

### 3. Dashboard Admin Form (src/Dashboard.jsx) ✅
**Already Configured with Flexible Dual Currency Input:**

Form fields structure:
- **MWK Pricing Section**
  - Input: "Price (MWK)" - stored in `form.price`
  - Input: "Monthly (MWK)" - stored in `form.monthlyPrice`

- **USD Pricing Section**
  - Input: "Price (USD)" - stored in `form.priceUsd`
  - Input: "Monthly (USD)" - stored in `form.monthlyPriceUsd`

**Admin Flexibility:**
- Admin can set ANY MWK price independently
- Admin can set ANY USD price independently
- NO automatic conversion - each currency is set separately
- Admin has complete control over pricing strategy

Form Submission (lines 349-351 and 378-380):
```javascript
priceUsd: form.priceUsd ? parseFloat(form.priceUsd) : null,
monthlyPriceUsd: form.monthlyPriceUsd ? parseFloat(form.monthlyPriceUsd) : 0,
```

### 4. Backend API (sparkle-pro-api/index.php) ✅
**Both endpoints configured for dual currency:**

- POST `/admin/gadgets` - Accepts `priceUsd` and `monthlyPriceUsd`
- PUT `/admin/gadgets/:id` - Accepts and updates both currencies
- GET `/gadgets` - Returns both `price_usd` and `monthly_price_usd`
- GET `/gadgets/:id` - Returns both `price_usd` and `monthly_price_usd`

## Database Sync Overview

### Data Flow - Creating/Updating Gadget:
1. Admin enters MWK and USD prices in Dashboard form (independent values)
2. Submit button sends both values to backend
3. Backend stores in database:
   - `price` column (MWK)
   - `price_usd` column (USD)
   - `monthly_price` column (MWK monthly)
   - `monthly_price_usd` column (USD monthly)
4. Frontend retrieves gadget and displays based on user location

### Data Flow - Displaying Price:
1. User loads app → LocationContext detects country
2. Component fetches gadget → gets both prices from backend
3. usePricing hook checks user's currency (MWK or USD)
4. Displays appropriate price based on location

## Complete Pricing Table Update

All 46 gadgets updated with new exchange rate:

| Gadget | MWK Price | USD Price | Ratio |
|--------|-----------|-----------|-------|
| MacBook Pro M4 | 3,500,000 | 1,944.44 | 1800:1 ✓ |
| iPhone 16 Pro Max | 5,000,000 | 2,777.78 | 1800:1 ✓ |
| Samsung S25 Ultra | 2,250,000 | 1,250.00 | 1800:1 ✓ |
| ... (40 more gadgets) | ... | ... | 1800:1 ✓ |

## Testing Checklist

- [ ] Import updated `itsxtrapush_db.sql` into MySQL
- [ ] Verify gadgets table has both `price_usd` and `monthly_price_usd` populated
- [ ] Log into Dashboard as admin
- [ ] Create new gadget:
  - [ ] Enter MWK price (e.g., 1000000)
  - [ ] Enter USD price independently (e.g., 500)
  - [ ] Verify both save to database
- [ ] Update gadget and change both prices separately
- [ ] Test frontend with Malawi VPN → should show MWK
- [ ] Test frontend without VPN → should show USD
- [ ] Verify API endpoints return both currencies

## Key Features

✅ **Admin Flexibility**: Set MWK and USD prices independently  
✅ **No Auto-Conversion**: Prices are set manually by admin  
✅ **Database Persistence**: Both currencies stored in DB  
✅ **Backend Sync**: API handles both currencies  
✅ **Frontend Display**: Components use usePricing hook to show correct currency  
✅ **Location-Based**: Prices display in user's local currency  

## Files Modified

1. `sparkle-pro-api/itsxtrapush_db.sql` - All gadget data recalculated
2. `src/services/currencyService.js` - Exchange rate updated to 1800 MWK per USD
3. `src/Dashboard.jsx` - Already configured (no changes needed)
4. `sparkle-pro-api/index.php` - Already configured (no changes needed)

## Exchange Rate Reference

**Standard Rate: 1 USD = 1800 MWK**

To convert:
- USD to MWK: Multiply by 1800
- MWK to USD: Divide by 1800

Example:
- 1,800,000 MWK ÷ 1800 = 1,000 USD
- 1,000 USD × 1800 = 1,800,000 MWK
