import { formatPrice, formatPriceCompact } from '../services/currencyService';

export function formatMWK(value) {
  const sanitized = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
  const num = Number(sanitized);
  if (!Number.isFinite(num)) {
    return 'MWK —';
  }
  const negative = num < 0;
  const absVal = Math.abs(num);
  const formatted = absVal.toLocaleString('en-US');
  return `${negative ? '-' : ''}MWK ${formatted}`;
}

export function formatGBP(value) {
  const sanitized = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
  const num = Number(sanitized);
  if (!Number.isFinite(num)) {
    return 'GBP —';
  }
  return `£${num.toFixed(2)}`;
}

// Legacy alias for backwards compatibility
export const formatUSD = formatGBP;

export function formatNumberWithCommas(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('en-US');
}

export function formatMWKCompact(value) {
  const sanitized = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
  const num = Number(sanitized);
  if (!Number.isFinite(num)) {
    return 'MWK —';
  }
  if (num >= 1000000) {
    const val = Math.round((num / 1000000) * 10) / 10; // 1 decimal for millions
    const display = (val % 1 === 0) ? Math.trunc(val) : val; // avoid trailing .0
    return `MWK ${display}M`;
  }
  const negative = num < 0;
  const absVal = Math.abs(num);
  const formatted = absVal.toLocaleString('en-US');
  return `${negative ? '-' : ''}MWK ${formatted}`;
}

export function formatGBPCompact(value) {
  const sanitized = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
  const num = Number(sanitized);
  if (!Number.isFinite(num)) {
    return 'GBP —';
  }
  if (num >= 1000) {
    const val = Math.round((num / 1000) * 10) / 10;
    const display = (val % 1 === 0) ? Math.trunc(val) : val;
    return `£${display}K`;
  }
  return `£${num.toFixed(2)}`;
}

// Legacy alias for backwards compatibility
export const formatUSDCompact = formatGBPCompact;

/**
 * Format price based on user's currency
 * @param {number} price - Price value
 * @param {string} currency - 'USD' or 'MWK'
 * @returns {string} Formatted price
 */
export function formatPriceByLocation(price, currency) {
  return formatPrice(price, currency);
}

/**
 * Format price compactly based on user's currency
 * @param {number} price - Price value
 * @param {string} currency - 'USD' or 'MWK'
 * @returns {string} Formatted compact price
 */
export function formatPriceByLocationCompact(price, currency) {
  return formatPriceCompact(price, currency);
}