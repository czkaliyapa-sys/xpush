# Variant-Based Pricing Enforcement Deployment Checklist

## Overview
This deployment enforces that ALL pricing and stock information comes exclusively from gadget variants, not fixed gadget prices. This resolves the issue where gadgets showed old fixed prices instead of variant-based pricing.

## Pre-Deployment Requirements

### 1. Database Migration
- [ ] Backup production database
- [ ] Review migration script: `migrations/2026-01-14_variant_based_pricing_enforcement.sql`
- [ ] Test migration on staging database
- [ ] Apply migration to production database

### 2. Backend Updates
- [ ] Updated `sparkle-pro-api/index.php` with variant enforcement logic
- [ ] Modified `gadgets_list()` function to prioritize variant data
- [ ] Updated `gadgets_detail()` function for single gadget pricing
- [ ] Enhanced variant helper functions

### 3. Frontend Compatibility
- [ ] Verified `GadgetsPage.jsx` preprocessing logic
- [ ] Confirmed `ItemCard3D` components receive variant data
- [ ] Tested `CartModal` with variant-based pricing
- [ ] Validated admin dashboard gadget sections

## Deployment Steps

### Phase 1: Database Migration
```bash
# 1. Connect to production database
mysql -h [host] -u [user] -p itsxtrapush_db

# 2. Apply migration
SOURCE /path/to/migrations/2026-01-14_variant_based_pricing_enforcement.sql;

# 3. Verify migration success
SELECT COUNT(*) FROM gadgets WHERE price = 0 AND price_gbp = 0;
SELECT COUNT(*) FROM gadget_variants WHERE is_active = 1;
```

### Phase 2: Backend Deployment
```bash
# 1. Backup current index.php
cp sparkle-pro-api/index.php sparkle-pro-api/index.php.backup

# 2. Upload updated index.php
scp sparkle-pro-api/index.php [server]:[path]/sparkle-pro-api/

# 3. Verify deployment
curl -s "https://sparkle-pro.co.uk/api/gadgets?limit=1" | jq '.data[0] | {id, name, price, price_gbp, has_variants, variants}'
```

### Phase 3: Frontend Verification
```bash
# 1. Build and deploy frontend
npm run build
firebase deploy

# 2. Test key pages
- Homepage gadget listings
- Individual gadget detail pages  
- Shopping cart functionality
- Admin dashboard gadget management
```

## Testing Checklist

### API Endpoints
- [ ] `/api/gadgets` - Returns variant-based pricing
- [ ] `/api/gadget/{id}` - Single gadget uses variant data
- [ ] `/api/gadgets?currency=GBP` - Proper GBP variant pricing
- [ ] `/api/gadgets?has_variants=1` - Filters correctly

### Data Validation
- [ ] Gadget base prices are zero
- [ ] Effective prices come from variants
- [ ] Stock quantities reflect variant totals
- [ ] Availability status is variant-driven

### User Experience
- [ ] Item cards show correct variant prices
- [ ] Cart modal displays variant-specific pricing
- [ ] Checkout processes variant-based amounts
- [ ] Admin panels show accurate variant data

## Rollback Plan

If issues occur:

### Immediate Rollback
```bash
# 1. Restore database from backup
mysql -h [host] -u [user] -p itsxtrapush_db < backup_before_migration.sql

# 2. Restore previous index.php
mv sparkle-pro-api/index.php.backup sparkle-pro-api/index.php
```

### Selective Fixes
- Revert specific migration parts if needed
- Disable problematic variant logic temporarily
- Fall back to hybrid pricing approach

## Monitoring

### Key Metrics to Watch
- API response times for gadget endpoints
- Error rates in gadget-related requests
- User complaints about pricing discrepancies
- Cart abandonment rates
- Conversion rates

### Logging
Enable detailed logging for:
- Variant data retrieval failures
- Price calculation edge cases
- Stock quantity mismatches
- Currency conversion issues

## Post-Deployment Verification

Run the comprehensive test script:
```bash
./test-variant-enforcement.sh
```

Expected outcomes:
- ✅ All gadget base prices show as zero
- ✅ Effective prices populated from variants
- ✅ Stock quantities reflect variant totals
- ✅ Multi-currency pricing works correctly
- ✅ All CRUD operations respect variant data

## Documentation Updates

Update the following documentation:
- [ ] API documentation for gadget endpoints
- [ ] Admin guide for variant management
- [ ] Developer documentation for pricing logic
- [ ] User FAQ about dynamic pricing

## Success Criteria

Deployment is successful when:
1. All existing functionality works as before
2. Pricing consistently comes from variants
3. No user-facing price discrepancies
4. Performance meets or exceeds previous levels
5. All automated tests pass
6. Manual QA verification completed

---

**Important Notes:**
- This is a breaking change for any systems expecting fixed gadget prices
- Thorough testing across all user touchpoints is essential
- Monitor closely for the first 48 hours post-deployment
- Have rollback procedures ready and tested