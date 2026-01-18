/**
 * Unified Error Handling System
 * Provides consistent error messaging and categorization across all components
 */

// Error categories and their user-friendly messages
const ERROR_CATEGORIES = {
  NETWORK: {
    codes: ['NETWORK_ERROR', 'ECONNABORTED', 'TIMEOUT'],
    userMessage: 'Network connection failed. Please check your internet connection.',
    logLevel: 'warn'
  },
  VALIDATION: {
    codes: ['VALIDATION_ERROR', 'INVALID_INPUT'],
    userMessage: 'Please check your input and try again.',
    logLevel: 'info'
  },
  AUTHENTICATION: {
    codes: ['UNAUTHORIZED', 'FORBIDDEN', 401, 403],
    userMessage: 'Authentication failed. Please sign in and try again.',
    logLevel: 'warn'
  },
  SERVER: {
    codes: ['INTERNAL_SERVER_ERROR', 500, 502, 503],
    userMessage: 'Server error occurred. Please try again or contact support.',
    logLevel: 'error'
  },
  NOT_FOUND: {
    codes: ['NOT_FOUND', 404],
    userMessage: 'Resource not found. Please check the details and try again.',
    logLevel: 'warn'
  },
  PAYMENT: {
    codes: ['PAYMENT_FAILED', 'PAYMENT_DECLINED'],
    userMessage: 'Payment processing failed. Please check your payment details.',
    logLevel: 'error'
  },
  TIMEOUT: {
    codes: ['TIMEOUT', 'ETIMEDOUT'],
    userMessage: 'Request timed out. Please try again.',
    logLevel: 'warn'
  }
};

/**
 * Categorize error based on error object or response
 */
export const categorizeError = (error) => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.response?.status || error?.code || '';
  
  for (const [category, config] of Object.entries(ERROR_CATEGORIES)) {
    if (config.codes.some(code => 
      errorMessage.includes(code.toString().toLowerCase()) || 
      errorCode === code
    )) {
      return category;
    }
  }
  
  // Default fallback
  return 'UNKNOWN';
};

/**
 * Generate user-friendly error message
 */
export const getUserFriendlyMessage = (error, context = '') => {
  const category = categorizeError(error);
  const baseMessage = ERROR_CATEGORIES[category]?.userMessage || 'An unexpected error occurred. Please try again.';
  
  // Add context-specific prefix if provided
  if (context) {
    return `${context}: ${baseMessage}`;
  }
  
  return baseMessage;
};

/**
 * Log error with appropriate level and details
 */
export const logError = (error, context = '', additionalData = {}) => {
  const category = categorizeError(error);
  const logLevel = ERROR_CATEGORIES[category]?.logLevel || 'error';
  
  const errorDetails = {
    timestamp: new Date().toISOString(),
    context,
    category,
    message: error?.message,
    code: error?.response?.status || error?.code,
    stack: error?.stack,
    ...additionalData
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console[logLevel](`[${category}] ${context}:`, errorDetails);
  }
  
  // In production, you might want to send to error tracking service
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Handle error with both user feedback and logging
 */
export const handleError = (error, context = '', showUserFeedback = true) => {
  // Log the error
  logError(error, context);
  
  // Return user-friendly message
  const userMessage = getUserFriendlyMessage(error, context);
  
  if (showUserFeedback) {
    // This would integrate with your toast/notification system
    // For now, we'll return the message to be handled by the component
    return userMessage;
  }
  
  return null;
};

/**
 * Create standardized API error handler
 */
export const createApiErrorHandler = (context) => {
  return (error) => {
    const userMessage = handleError(error, context, true);
    
    // Return structured error response
    return {
      success: false,
      error: userMessage,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  };
};

/**
 * Component-specific error handlers
 */
export const componentErrorHandlers = {
  // Cart Modal specific errors
  cart: {
    STOCK_UNAVAILABLE: 'Selected items are out of stock. Please remove them from your cart.',
    PROFILE_INCOMPLETE: (missingFields) => `Please complete your profile before checkout. Missing: ${missingFields.join(', ')}`,
    CHECKOUT_FAILED: 'Checkout failed. Please try again.',
    SUBSCRIPTION_EXISTS: (tier) => `You already have an active ${tier === 'premium' ? 'Premium' : 'Plus'} subscription.`
  },
  
  // Trade-in specific errors
  tradeIn: {
    IMAGE_UPLOAD_FAILED: 'Failed to upload images. Please try again.',
    ESTIMATE_FAILED: 'Unable to generate estimate. Please check your device details.',
    SUBMISSION_FAILED: 'Trade-in submission failed. Please try again later.'
  },
  
  // Payment specific errors
  payment: {
    VERIFICATION_FAILED: 'Unable to verify payment. Please check your transaction details.',
    GATEWAY_ERROR: 'Payment gateway error. Please try a different payment method.',
    AMOUNT_MISMATCH: 'Payment amount mismatch detected. Please contact support.'
  }
};

export default {
  categorizeError,
  getUserFriendlyMessage,
  logError,
  handleError,
  createApiErrorHandler,
  componentErrorHandlers
};