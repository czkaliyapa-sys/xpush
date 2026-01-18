/**
 * Price Validation Utilities
 * 
 * Provides consistent price validation across the application
 * to prevent checkout of items with zero or invalid prices
 */

/**
 * Validates if a gadget price is valid for checkout
 * @param {number|string} price - The price to validate
 * @param {string} currency - Currency code (MWK, GBP, etc.)
 * @returns {boolean} - True if price is valid for checkout
 */
export const isValidPriceForCheckout = (price, currency = 'MWK') => {
  // Convert to number if string
  const numericPrice = typeof price === 'string' 
    ? parseFloat(price.replace(/[^0-9.]/g, '')) 
    : Number(price);
  
  // Check if price is a valid finite number
  if (!Number.isFinite(numericPrice)) {
    return false;
  }
  
  // Zero price indicates admin hasn't set pricing/variants yet
  if (numericPrice <= 0) {
    return false;
  }
  
  // Additional currency-specific validations
  switch (currency.toUpperCase()) {
    case 'MWK':
      // Malawi Kwacha - reasonable minimum (e.g., MWK 100)
      return numericPrice >= 100;
    case 'GBP':
      // British Pound - reasonable minimum (e.g., £1)
      return numericPrice >= 1;
    default:
      // Generic validation for other currencies
      return numericPrice > 0;
  }
};

/**
 * Gets price validation error message
 * @param {number|string} price - The price that failed validation
 * @param {string} currency - Currency code
 * @returns {string} - User-friendly error message
 */
export const getPriceValidationError = (price, currency = 'MWK') => {
  const numericPrice = typeof price === 'string' 
    ? parseFloat(price.replace(/[^0-9.]/g, '')) 
    : Number(price);
  
  if (!Number.isFinite(numericPrice)) {
    return 'Invalid price format';
  }
  
  if (numericPrice <= 0) {
    return 'This item is not yet available for purchase. Please contact support.';
  }
  
  switch (currency.toUpperCase()) {
    case 'MWK':
      if (numericPrice < 100) {
        return 'Minimum price for MWK transactions is MWK 100';
      }
      break;
    case 'GBP':
      if (numericPrice < 1) {
        return 'Minimum price for GBP transactions is £1';
      }
      break;
  }
  
  return 'Price validation failed';
};

/**
 * Checks if gadget is available for purchase based on price and stock
 * @param {Object} gadget - Gadget object with price and stock properties
 * @param {string} currency - User's currency
 * @returns {Object} - { isValid: boolean, reason: string }
 */
export const isGadgetAvailableForPurchase = (gadget, currency = 'MWK') => {
  // Check stock availability
  const stockQuantity = gadget?.stock_quantity ?? gadget?.number ?? gadget?.qty ?? 0;
  const inStock = stockQuantity > 0 || gadget?.in_stock || gadget?.inStock;
  
  if (!inStock && !gadget?.isPreOrder) {
    return {
      isValid: false,
      reason: 'Item is out of stock'
    };
  }
  
  // Check price validity
  let priceToCheck;
  if (currency === 'GBP') {
    priceToCheck = gadget?.price_gbp ?? gadget?.priceGbp ?? gadget?.price;
  } else {
    priceToCheck = gadget?.price_mwk ?? gadget?.priceMwk ?? gadget?.price;
  }
  
  if (!isValidPriceForCheckout(priceToCheck, currency)) {
    return {
      isValid: false,
      reason: getPriceValidationError(priceToCheck, currency)
    };
  }
  
  return {
    isValid: true,
    reason: 'Available for purchase'
  };
};

/**
 * Format price for display with validation indicator
 * @param {number|string} price - Price to format
 * @param {string} currency - Currency code
 * @returns {Object} - { formatted: string, isValid: boolean, warning: string }
 */
export const formatPriceWithValidation = (price, currency = 'MWK') => {
  const isValid = isValidPriceForCheckout(price, currency);
  const numericPrice = typeof price === 'string' 
    ? parseFloat(price.replace(/[^0-9.]/g, '')) 
    : Number(price);
  
  let formatted = 'Price not set';
  
  if (Number.isFinite(numericPrice)) {
    if (currency === 'MWK') {
      formatted = `MWK ${Math.round(numericPrice).toLocaleString('en-US')}`;
    } else if (currency === 'GBP') {
      formatted = `£${numericPrice.toFixed(2)}`;
    } else {
      formatted = `${currency} ${numericPrice.toFixed(2)}`;
    }
  }
  
  return {
    formatted,
    isValid,
    warning: isValid ? null : getPriceValidationError(price, currency)
  };
};

// Default export
export default {
  isValidPriceForCheckout,
  getPriceValidationError,
  isGadgetAvailableForPurchase,
  formatPriceWithValidation
};