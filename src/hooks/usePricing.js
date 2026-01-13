import { useLocation } from '../contexts/LocationContext';
import { getPriceInLocalCurrency, formatPrice, formatPriceCompact } from '../services/currencyService';

/**
 * Hook to get price in user's local currency
 * - Malawi users: Prices are shown in MWK directly (no conversion)
 * - International users: Prices are shown in GBP
 */
export const usePricing = () => {
  // LocationContext already returns flat properties; normalize with safe defaults
  const {
    country,
    countryCode,
    currency = 'GBP',
    isInMalawi = false,
    loading = false,
    error,
    updateLocation,
  } = useLocation();

  const resolvedCurrency = currency || 'GBP';

  /**
   * Convert GBP price to local currency
   * Note: For Malawi users with MWK prices, use formatMwkPrice instead
   */
  const getLocalPrice = (priceInGbp) => {
    return getPriceInLocalCurrency(priceInGbp, resolvedCurrency);
  };

  /**
   * Format a GBP price for display in local currency
   * For Malawi users, this converts GBP to MWK
   * For international users, this shows GBP
   */
  const formatLocalPrice = (priceInGbp) => {
    const localPrice = getLocalPrice(priceInGbp);
    return formatPrice(localPrice, resolvedCurrency);
  };

  const formatLocalPriceCompact = (priceInGbp) => {
    const localPrice = getLocalPrice(priceInGbp);
    return formatPriceCompact(localPrice, resolvedCurrency);
  };

  /**
   * Format an MWK price directly (no conversion)
   * Use this when you already have the MWK price
   */
  const formatMwkPrice = (mwkPrice) => {
    const numPrice = typeof mwkPrice === 'string' ? parseFloat(mwkPrice.replace(/[^0-9.]/g, '')) : Number(mwkPrice);
    if (!Number.isFinite(numPrice)) return 'MWK —';
    return `MWK ${Math.round(numPrice).toLocaleString('en-US')}`;
  };

  /**
   * Format a GBP price directly (no conversion)
   * Use this when you already have the GBP price
   */
  const formatGbpPrice = (gbpPrice) => {
    const numPrice = typeof gbpPrice === 'string' ? parseFloat(gbpPrice.replace(/[^0-9.]/g, '')) : Number(gbpPrice);
    if (!Number.isFinite(numPrice)) return '£—';
    return `£${numPrice.toFixed(2)}`;
  };

  return {
    currency: resolvedCurrency,
    isInMalawi,
    isMalawi: isInMalawi,
    country,
    countryCode,
    getLocalPrice,
    formatLocalPrice,
    formatLocalPriceCompact,
    formatMwkPrice,
    formatGbpPrice,
    loading,
    error,
    updateLocation,
  };
};
