# USD to GBP Currency Migration

## Overview

This document describes the major currency migration from USD (US Dollar) to GBP (British Pound Sterling) for the itsxtrapush platform. The Malawi Kwacha (MWK) pricing remains unchanged.

## Conversion Rate

- **1 GBP = 1.31 USD**
- **1 GBP ≈ 2358 MWK** (approximately 1800 * 1.31)

## Files Modified

### Frontend (React/JSX)

#### 1. `/src/services/currencyService.js`
- Updated exchange rates:
  - `MWK_TO_GBP: 0.00042407` (1 / 2358)
  - `GBP_TO_MWK: 2358`
- Changed `formatPrice()` to use `£` symbol for international currency
- Added `convertGbpToMwk()` and `convertMwkToGbp()` functions
- Updated all USD conversion functions to GBP

#### 2. `/src/contexts/LocationContext.jsx`
- Changed default currency from `'USD'` to `'GBP'`
- Non-Malawi users now see prices in GBP

#### 3. `/src/hooks/usePricing.js`
- Updated documentation to reference GBP instead of USD
- Parameter names changed from `priceInUsd` to `priceInGbp`

#### 4. `/src/services/api.js`
- Updated `_toBackendPayload()` to use `price_gbp` and `monthly_price_gbp`
- Updated `_toVariantPayload()` to use `priceGbp`
- Response normalization now maps to `priceGbp` and `monthlyPriceGbp`

#### 5. `/src/GadgetsPage.jsx`
- Default `userCurrency` changed to `'GBP'`
- Props changed from `priceUsd` to `priceGbp`
- Props changed from `monthlyPriceUsd` to `monthlyPriceGbp`

#### 6. `/src/Dashboard.jsx`
- Form field labels changed from "Price (USD)" to "Price (GBP)"
- Form state keys changed: `priceUsd` → `priceGbp`, `monthlyPriceUsd` → `monthlyPriceGbp`
- Variant forms updated similarly
- Display text changed from `$` to `£`

#### 7. `/src/GadgetDetail.jsx`
- Price calculations use `price_gbp` instead of `price_usd`
- Conversion factor changed from 1020.4 (MWK/USD) to 2358 (MWK/GBP)
- InstallmentModal props changed from `priceUsd` to `priceGbp`

#### 8. `/src/WishlistPage.jsx`
- Props changed from `priceUsd` to `priceGbp`
- Props changed from `monthlyPriceUsd` to `monthlyPriceGbp`

#### 9. `/src/components/CheckoutForm.jsx`
- Changed from USD price references to GBP
- Updated `formatPrice()` to use GBP conversion

#### 10. `/src/components/InstallmentModal.jsx`
- Comments updated: "expects GBP value" instead of "expects USD value"
- State initialization uses `priceGbp` instead of `priceUsd`
- Variant price resolution uses `price_gbp`

#### 11. `/src/components/CartModal.jsx`
- Variant price resolution uses `price_gbp` instead of `price_usd`

### Backend (PHP)

#### 1. `/sparkle-pro-api/index.php`
- SQL queries now select `price_gbp`, `monthly_price_gbp` instead of `price_usd`, `monthly_price_usd`
- Response arrays return `price_gbp` and `monthly_price_gbp`
- Admin create/update functions use `priceGbp` and `monthlyPriceGbp` from request data
- Variant operations use `price_gbp` field

### Database

#### 1. Migration Script: `/sparkle-pro-api/migrations/2026-01-02_usd_to_gbp_migration.sql`
- Adds `price_gbp` and `monthly_price_gbp` columns to `gadgets` table
- Converts existing USD values to GBP (divide by 1.31)
- Drops old `price_usd` and `monthly_price_usd` columns
- Updates `gadget_variants` table similarly
- Includes rollback script

#### 2. Schema File: `/sparkle-pro-api/itsxtrapush_db.sql`
- Column definitions changed from `price_usd` to `price_gbp`
- Column definitions changed from `monthly_price_usd` to `monthly_price_gbp`
- Index changed from `idx_price_usd` to `idx_price_gbp`

## Deployment Steps

### 1. Database Migration (FIRST)

Run the migration script on your production database:

```bash
mysql -u your_username -p your_database < sparkle-pro-api/migrations/2026-01-02_usd_to_gbp_migration.sql
```

Or execute the SQL statements manually in phpMyAdmin or your database client.

### 2. Backend Deployment

Upload the updated `sparkle-pro-api/index.php` to your server.

### 3. Frontend Deployment

Build and deploy the React application:

```bash
npm run build
```

Then deploy the `build/` folder to your hosting.

## Verification

After deployment, verify:

1. **Database**: Run the verification queries in the migration script to confirm price conversions
2. **API**: Check that API responses return `price_gbp` fields instead of `price_usd`
3. **Frontend**: Verify prices display with `£` symbol for international users
4. **Admin Dashboard**: Confirm GBP price fields work for creating/editing gadgets

## Rollback

If issues occur, use the rollback script at the bottom of the migration SQL file to revert database changes. Then revert code files to their previous version.

## Summary Table

| Item | Old Value | New Value |
|------|-----------|-----------|
| Currency Symbol | $ | £ |
| Currency Code | USD | GBP |
| DB Column (gadgets) | price_usd | price_gbp |
| DB Column (gadgets) | monthly_price_usd | monthly_price_gbp |
| DB Column (variants) | price_usd | price_gbp |
| Frontend Prop | priceUsd | priceGbp |
| Frontend Prop | monthlyPriceUsd | monthlyPriceGbp |
| MWK Conversion | 1020.4 MWK/USD | 2358 MWK/GBP |
| Exchange Rate | N/A | 1 GBP = 1.31 USD |
