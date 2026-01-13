/**
 * Currency Service for handling location-based pricing
 * Supports MWK (Malawi Kwacha) and GBP (British Pound Sterling)
 */

// Exchange rates (you can update this or fetch from an API)
// Note: 1 GBP = 1.31 USD, so 1 GBP ≈ 2358 MWK (1800 * 1.31)
const EXCHANGE_RATES = {
  MWK_TO_GBP: 0.00042407, // 1 GBP = 2358 MWK (approximately)
  GBP_TO_MWK: 2358, // 1 GBP = 2358 MWK
  USD_TO_GBP: 0.7634, // 1 USD = 0.7634 GBP (1/1.31)
  GBP_TO_USD: 1.31, // 1 GBP = 1.31 USD
};

/**
 * Convert GBP to MWK
 */
export const convertGbpToMwk = (gbpAmount) => {
  if (!Number.isFinite(gbpAmount)) return 0;
  return Math.round(gbpAmount * EXCHANGE_RATES.GBP_TO_MWK);
};

/**
 * Convert MWK to GBP
 */
export const convertMwkToGbp = (mwkAmount) => {
  if (!Number.isFinite(mwkAmount)) return 0;
  return Math.round((mwkAmount * EXCHANGE_RATES.MWK_TO_GBP) * 100) / 100;
};

/**
 * Get the price in the user's local currency
 * Assumes prices in the database are stored in GBP for international
 */
export const getPriceInLocalCurrency = (priceInGbp, currency) => {
  if (currency === 'MWK') {
    return convertGbpToMwk(priceInGbp);
  }
  return priceInGbp;
};

/**
 * Format price based on currency
 */
export const formatPrice = (price, currency) => {
  const num = Number(price);
  if (!Number.isFinite(num)) return `${currency} —`;

  if (currency === 'MWK') {
    const formatted = Math.round(num).toLocaleString('en-US');
    return `MWK ${formatted}`;
  }

  // GBP formatting
  return `£${num.toFixed(2)}`;
};

/**
 * Format price compactly (e.g., 1.2M instead of 1,200,000)
 */
export const formatPriceCompact = (price, currency) => {
  const num = Number(price);
  if (!Number.isFinite(num)) return `${currency} —`;

  if (currency === 'MWK') {
    if (num >= 1000000) {
      const val = Math.round((num / 1000000) * 10) / 10;
      const display = (val % 1 === 0) ? Math.trunc(val) : val;
      return `MWK ${display}M`;
    }
    const formatted = Math.round(num).toLocaleString('en-US');
    return `MWK ${formatted}`;
  }

  // GBP formatting
  if (num >= 1000) {
    const val = Math.round((num / 1000) * 10) / 10;
    const display = (val % 1 === 0) ? Math.trunc(val) : val;
    return `£${display}K`;
  }
  return `£${num.toFixed(2)}`;
};

/**
 * Update exchange rates (call this periodically or when needed)
 */
export const updateExchangeRates = (mwkToGbp, gbpToMwk) => {
  EXCHANGE_RATES.MWK_TO_GBP = mwkToGbp;
  EXCHANGE_RATES.GBP_TO_MWK = gbpToMwk;
};

/**
 * Get current exchange rates
 */
export const getExchangeRates = () => ({ ...EXCHANGE_RATES });

/**
 * Fetch live exchange rates from an API (optional)
 */
export const fetchLiveExchangeRates = async () => {
  try {
    // Using exchangerate-api.com (free tier available)
    // You can sign up at https://www.exchangerate-api.com/
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.MWK) {
        updateExchangeRates(
          1 / data.rates.MWK,
          data.rates.MWK
        );
        return data.rates.MWK;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live exchange rates:', err);
  }
  return EXCHANGE_RATES.GBP_TO_MWK;
};

// Legacy aliases for backward compatibility during migration
export const convertUsdToMwk = convertGbpToMwk;
export const convertMwkToUsd = convertMwkToGbp;
