/**
 * Payment Service - Dual Payment Gateway Support
 * 
 * This service handles payment routing based on user location:
 * - Malawi (MW): PayChangu with MWK currency
 * - International: Square with GBP currency
 * 
 * @module paymentService
 */

import { paymentsAPI, subscriptionsAPI } from './api.js';
import { installmentsAPI } from './api.js';

// Payment gateway constants
export const PAYMENT_GATEWAYS = {
  PAYCHANGU: 'paychangu',
  SQUARE: 'square'
};

// Currency constants
export const CURRENCIES = {
  MWK: 'MWK',  // Malawi Kwacha
  GBP: 'GBP'   // British Pound Sterling
};

// Country codes for routing
export const MALAWI_COUNTRY_CODE = 'MW';

/**
 * Determine the appropriate payment gateway based on user's country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Payment gateway identifier
 */
export const getPaymentGateway = (countryCode) => {
  if (countryCode === MALAWI_COUNTRY_CODE) {
    return PAYMENT_GATEWAYS.PAYCHANGU;
  }
  return PAYMENT_GATEWAYS.SQUARE;
};

/**
 * Determine the appropriate currency based on user's country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Currency code
 */
export const getCurrencyForCountry = (countryCode) => {
  if (countryCode === MALAWI_COUNTRY_CODE) {
    return CURRENCIES.MWK;
  }
  return CURRENCIES.GBP;
};

/**
 * Get payment gateway display name
 * @param {string} gateway - Gateway identifier
 * @returns {string} - Human-readable gateway name
 */
export const getGatewayDisplayName = (gateway) => {
  switch (gateway) {
    case PAYMENT_GATEWAYS.SQUARE:
      return 'Credit/Debit Card (Square)';
    case PAYMENT_GATEWAYS.PAYCHANGU:
      return 'Mobile Money / Bank (PayChangu)';
    default:
      return 'Payment';
  }
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case CURRENCIES.GBP:
      return '£';
    case CURRENCIES.MWK:
      return 'MWK ';
    default:
      return '';
  }
};

/**
 * Create a checkout session with the appropriate payment gateway
 * @param {Object} params - Checkout parameters
 * @param {Array} params.items - Array of items to purchase
 * @param {string} params.countryCode - User's country code
 * @param {string} params.customerEmail - Customer's email
 * @param {Object} params.installmentPlan - Optional installment plan details
 * @param {string} params.successUrl - URL to redirect on success
 * @param {string} params.cancelUrl - URL to redirect on cancel
 * @returns {Promise<Object>} - Checkout session response
 */
export const createCheckoutSession = async ({
  items,
  countryCode,
  customerEmail,
  installmentPlan = null,
  successUrl,
  cancelUrl
}) => {
  const gateway = getPaymentGateway(countryCode);
  const currency = getCurrencyForCountry(countryCode);

  // Prepare items with correct pricing based on currency
  const processedItems = items.map(item => {
    let price;
    if (currency === CURRENCIES.MWK) {
      // Use MWK price (stored in `price` field)
      price = item.priceMwk || item.price;
    } else {
      // Use GBP price
      price = item.priceGbp || item.price_gbp || (item.price / 2358);
    }
    
    return {
      ...item,
      price: Number(price)
    };
  });

  if (gateway === PAYMENT_GATEWAYS.SQUARE) {
    // Route to Square checkout
    return await createSquareCheckout({
      items: processedItems,
      currency,
      customerEmail,
      installmentPlan,
      successUrl,
      cancelUrl
    });
  } else {
    // Route to PayChangu checkout (existing implementation)
    return await paymentsAPI.createCheckoutSession(processedItems, {
      customerEmail,
      installmentPlan,
      currency,
      successUrl,
      cancelUrl
    });
  }
};

/**
 * Create a Square checkout session
 * @param {Object} params - Square checkout parameters
 * @returns {Promise<Object>} - Square checkout session
 */
export const createSquareCheckout = async ({
  items,
  currency,
  customerEmail,
  installmentPlan,
  successUrl,
  cancelUrl
}) => {
  try {
    const response = await paymentsAPI.createSquareCheckout({
      items,
      currency,
      customerEmail,
      installmentPlan,
      successUrl,
      cancelUrl
    });

    return response;
  } catch (error) {
    console.error('Square checkout error:', error);
    throw error;
  }
};

/**
 * Verify a payment based on the gateway used
 * @param {string} gateway - Payment gateway used
 * @param {string} reference - Transaction reference (tx_ref for PayChangu, order_id for Square)
 * @returns {Promise<Object>} - Verification result
 */
export const verifyPayment = async (gateway, reference) => {
  if (gateway === PAYMENT_GATEWAYS.SQUARE) {
    return await paymentsAPI.verifySquarePayment(reference);
  } else {
    return await paymentsAPI.verifyPayChangu(reference);
  }
};

/**
 * Get payment methods available for a country
 * @param {string} countryCode - User's country code
 * @returns {Array<Object>} - Available payment methods
 */
export const getAvailablePaymentMethods = (countryCode) => {
  if (countryCode === MALAWI_COUNTRY_CODE) {
    return [
      {
        id: PAYMENT_GATEWAYS.PAYCHANGU,
        name: 'Mobile Money',
        description: 'Pay with Airtel Money, TNM Mpamba, or bank transfer',
        icon: '📱',
        currency: CURRENCIES.MWK
      }
    ];
  }
  
  return [
    {
      id: PAYMENT_GATEWAYS.SQUARE,
      name: 'Card Payment',
      description: 'Pay securely with Visa, Mastercard, Apple Pay or Google Pay',
      icon: '💳',
      currency: CURRENCIES.GBP
    }
  ];
};

/**
 * Format price based on currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount, currency) => {
  const symbol = getCurrencySymbol(currency);
  
  if (currency === CURRENCIES.MWK) {
    return `${symbol}${Number(amount).toLocaleString()}`;
  }
  
  return `${symbol}${Number(amount).toFixed(2)}`;
};

/**
 * Payment configuration object
 * Contains gateway-specific settings
 */
export const paymentConfig = {
  square: {
    // Square app ID will be loaded from backend
    // This ensures keys are not exposed in client code
    getAppId: async () => {
      const config = await paymentsAPI.getSquareConfig();
      return config?.appId || null;
    },
    supportedCurrencies: ['GBP', 'USD', 'EUR'],
    // Countries that should use Square (everything except Malawi)
    isAvailable: (countryCode) => countryCode !== MALAWI_COUNTRY_CODE
  },
  paychangu: {
    supportedCurrencies: ['MWK', 'USD'],
    // Only available in Malawi
    isAvailable: (countryCode) => countryCode === MALAWI_COUNTRY_CODE
  }
};

// ===================================
// SUBSCRIPTION SERVICE FUNCTIONS
// ===================================

/**
 * Subscription plan details - Two tiers available
 */
export const SUBSCRIPTION_PLAN = {
  plus: {
    name: 'Xtrapush Plus',
    priceGBP: 6.00,
    priceMWK: 6000,
    currency: 'GBP',
    interval: 'month',
    benefits: [
      'Free Unlimited Delivery – No fees on any order',
      'Single Gadget Insurance (1 Year) – Protection for ONE laptop, smartphone, or tablet',
      'Member Discounts – Save on selected items'
    ]
  },
  premium: {
    name: 'Xtrapush Premium',
    priceGBP: 9.99,
    priceMWK: 10000,
    currency: 'GBP',
    interval: 'month',
    benefits: [
      'Free Unlimited Delivery – No fees on any order',
      'Multiple Gadget Insurance (1 Year Each) – Protection for ALL laptops, smartphones, and tablets',
      'Exclusive Member Discounts – Special deals on all gadgets',
      'Priority Support – Fast-track customer service',
      'Early Access – Be first to see new arrivals'
    ],
    popular: true
  },
  standard: {
    deliveryGBP: 4.99,
    deliveryMWK: 2000
  }
};

/**
 * Get user's subscription status
 * @param {string} userUid - User's unique identifier
 * @returns {Promise<Object>} - Subscription status
 */
export const getSubscriptionStatus = async (userUid) => {
  try {
    return await subscriptionsAPI.getStatus(userUid);
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return {
      hasSubscription: false,
      isActive: false,
      benefits: { freeInsurance: false, freeDelivery: false }
    };
  }
};

/**
 * Create a new subscription
 * @param {Object} params - Subscription parameters
 * @param {string} params.userUid - User's unique identifier
 * @param {string} params.customerEmail - Customer's email
 * @param {string} params.successUrl - URL to redirect on success
 * @param {string} params.currency - Currency (GBP or MWK)
 * @param {string} params.tier - Subscription tier ('plus' or 'premium')
 * @param {string} params.countryCode - User's country code for gateway detection
 * @returns {Promise<Object>} - Subscription creation result
 */
export const createSubscription = async ({ 
  userUid, 
  customerEmail, 
  successUrl,
  currency = 'GBP',
  tier = 'plus',
  countryCode = 'GB',
  cardNonce = null
}) => {
  try {
    // Determine payment gateway based on location
    const gateway = getPaymentGateway(countryCode);
    
    const payload = {
      userUid,
      customerEmail,
      successUrl,
      currency,
      tier,
      gateway
    };
    
    // Add card nonce if provided (for Square card payment)
    if (cardNonce) {
      payload.cardNonce = cardNonce;
    }
    
    const response = await subscriptionsAPI.create(payload);
    return response;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
};

/**
 * Cancel user's subscription
 * @param {string} userUid - User's unique identifier
 * @returns {Promise<Object>} - Cancellation result
 */
export const cancelSubscription = async (userUid) => {
  try {
    return await subscriptionsAPI.cancel(userUid);
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription benefits
 * @param {string} userUid - User's unique identifier
 * @returns {Promise<Object>} - Benefits status
 */
export const checkSubscriptionBenefits = async (userUid) => {
  const status = await getSubscriptionStatus(userUid);
  return {
    hasFreeInsurance: status?.benefits?.freeInsurance || false,
    hasFreeDelivery: status?.benefits?.freeDelivery || false,
    isActive: status?.isActive || false
  };
};

// ===================================
// INSTALLMENT SUPPORT HELPERS
// ===================================

/**
 * Start a payment for an existing installment (remaining or next due)
 */
export const startInstallmentPayment = async ({
  orderId,
  amount,
  currency,
  countryCode,
  customerEmail,
  installmentPlan = {},
  successUrl,
  cancelUrl
}) => {
  const safeAmount = Number(amount) || 0;
  const items = [
    {
      id: `installment-${orderId}`,
      name: `Installment for Order #${orderId}`,
      description: 'Secure installment payment',
      price: safeAmount,
      quantity: 1
    }
  ];

  return await createCheckoutSession({
    items,
    countryCode,
    customerEmail,
    installmentPlan: {
      ...installmentPlan,
      orderId,
      installmentPayment: true,
      payNowAmount: safeAmount
    },
    successUrl: successUrl || `${window.location.origin}/dashboard/installments?order=${orderId}&status=success`,
    cancelUrl: cancelUrl || `${window.location.origin}/dashboard/installments?order=${orderId}&status=cancel`
  });
};

/**
 * Generate or fetch a receipt for an installment/order
 */
export const generateInstallmentReceipt = async (orderId) => {
  return await installmentsAPI.generateReceipt(orderId);
};

/**
 * Schedule a reminder email ahead of the next due date (default 1 day before)
 */
export const scheduleInstallmentReminder = async ({ orderId, daysBefore = 1 }) => {
  return await installmentsAPI.scheduleReminder({ orderId, daysBefore });
};

/**
 * List receipts for a user (history surface)
 */
export const listInstallmentReceipts = async (userUid) => {
  return await installmentsAPI.listReceipts(userUid);
};

// ===================================
// SUBSCRIPTION DEVICE LINKING
// ===================================

/**
 * Link a device to user's subscription
 * XtraPush Plus/Premium must be linked to specific device(s)
 * @param {string} userUid - User's unique identifier
 * @param {number} deviceId - Device ID to link
 * @param {string} linkedBy - How it was linked ('MANUAL', 'AUTO_CHECKOUT', 'AUTO_RECENT')
 * @returns {Promise<Object>} - Link result with device details
 */
export const linkDeviceToSubscription = async (userUid, deviceId, linkedBy = 'MANUAL') => {
  try {
    if (!userUid || !deviceId) {
      throw new Error('Missing userUid or deviceId');
    }
    return await subscriptionsAPI.linkDevice(userUid, deviceId, linkedBy);
  } catch (error) {
    console.error('Failed to link device to subscription:', error);
    throw error;
  }
};

/**
 * Get device linked to user's subscription
 * @param {string} userUid - User's unique identifier
 * @returns {Promise<Object>} - Linked device info and metadata
 */
export const getLinkedDevice = async (userUid) => {
  try {
    if (!userUid) {
      throw new Error('Missing userUid');
    }
    return await subscriptionsAPI.getLinkedDevice(userUid);
  } catch (error) {
    console.error('Failed to get linked device:', error);
    throw error;
  }
};

/**
 * Get recent devices for subscription device linking
 * Returns user's recently purchased devices to choose from
 * @param {string} userUid - User's unique identifier
 * @param {number} limit - Max number of devices to return
 * @returns {Promise<Object>} - Array of recent devices
 */
export const getRecentDevicesForLinking = async (userUid, limit = 5) => {
  try {
    if (!userUid) {
      throw new Error('Missing userUid');
    }
    return await subscriptionsAPI.getRecentDevices(userUid, limit);
  } catch (error) {
    console.error('Failed to get recent devices:', error);
    throw error;
  }
};

/**
 * Unlink device from subscription
 * @param {string} userUid - User's unique identifier
 * @returns {Promise<Object>} - Unlink result
 */
export const unlinkDeviceFromSubscription = async (userUid) => {
  try {
    if (!userUid) {
      throw new Error('Missing userUid');
    }
    return await subscriptionsAPI.unlinkDevice(userUid);
  } catch (error) {
    console.error('Failed to unlink device from subscription:', error);
    throw error;
  }
};

export default {
  PAYMENT_GATEWAYS,
  CURRENCIES,
  getPaymentGateway,
  getCurrencyForCountry,
  getGatewayDisplayName,
  getCurrencySymbol,
  createCheckoutSession,
  createSquareCheckout,
  verifyPayment,
  getAvailablePaymentMethods,
  formatPrice,
  paymentConfig,
  startInstallmentPayment,
  generateInstallmentReceipt,
  scheduleInstallmentReminder,
  listInstallmentReceipts,
  linkDeviceToSubscription,
  getLinkedDevice,
  getRecentDevicesForLinking,
  unlinkDeviceFromSubscription};