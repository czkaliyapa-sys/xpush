/**
 * Utility functions for generating and formatting user-friendly order references
 */

/**
 * Generate a short, user-friendly order reference
 * @param {number|string} orderId - Database order ID
 * @param {string} prefix - Optional prefix (e.g., 'ORD', 'INV')
 * @returns {string} Formatted order reference
 */
export const generateOrderReference = (orderId, prefix = 'ORD') => {
  if (!orderId) return `${prefix}-XXXXXX`;
  
  // Convert to string and pad with zeros to ensure consistent length
  const orderIdStr = String(orderId);
  const paddedId = orderIdStr.padStart(6, '0');
  
  // Take last 6 digits for shorter reference
  const shortId = paddedId.slice(-6);
  
  return `${prefix}-${shortId}`;
};

/**
 * Format order ID for display - creates shorter, cleaner references
 * @param {number|string} orderId - Database order ID
 * @returns {string} Clean order reference
 */
export const formatOrderReference = (orderId) => {
  if (!orderId) return 'N/A';
  
  // For very long IDs, use the generateOrderReference function
  if (String(orderId).length > 6) {
    return generateOrderReference(orderId);
  }
  
  // For shorter IDs, just pad with zeros
  return `#${String(orderId).padStart(6, '0')}`;
};

/**
 * Generate a compact reference for receipts and invoices
 * @param {number|string} orderId - Database order ID  
 * @returns {string} Compact reference
 */
export const generateCompactReference = (orderId) => {
  if (!orderId) return 'XXXXXX';
  
  // Take last 4-6 digits for ultra-compact reference
  const orderIdStr = String(orderId);
  return orderIdStr.slice(-6).padStart(6, '0');
};

/**
 * Validate if a string looks like an order reference
 * @param {string} reference - Reference to validate
 * @returns {boolean} True if valid reference format
 */
export const isValidOrderReference = (reference) => {
  if (!reference) return false;
  // Check for patterns like ORD-123456, INV-123456, or #123456
  return /^([A-Z]{3,4}-|#)?\d{4,6}$/.test(reference.toUpperCase());
};

/**
 * Extract numeric ID from formatted reference
 * @param {string} reference - Formatted reference
 * @returns {number|null} Numeric ID or null if invalid
 */
export const extractOrderId = (reference) => {
  if (!reference) return null;
  
  // Remove prefixes and extract numbers
  const cleanRef = reference.replace(/^[A-Z]{3,4}-|^#/, '');
  const numericId = parseInt(cleanRef, 10);
  
  return isNaN(numericId) ? null : numericId;
};