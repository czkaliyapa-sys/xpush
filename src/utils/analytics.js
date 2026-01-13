/**
 * Analytics Tracking Utility
 * 
 * Provides real-time page view and event tracking for Xtrapush
 * Integrates with the backend analytics system
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : 'https://sparkle-pro.co.uk/api');

// Create axios instance for analytics (no auth required)
const analyticsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Session management
let sessionId = null;
let sessionStartTime = null;

/**
 * Initialize analytics session
 * Creates a unique session ID for tracking
 */
const initSession = () => {
  if (sessionId) return sessionId;
  
  // Generate a unique session ID
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStartTime = new Date().toISOString();
  
  // Store in sessionStorage for persistence across page reloads
  sessionStorage.setItem('analytics_session_id', sessionId);
  sessionStorage.setItem('analytics_session_start', sessionStartTime);
  
  return sessionId;
};

/**
 * Get or create session ID
 */
const getSessionId = () => {
  if (sessionId) return sessionId;
  
  // Try to restore from sessionStorage
  const stored = sessionStorage.getItem('analytics_session_id');
  const storedStart = sessionStorage.getItem('analytics_session_start');
  
  if (stored && storedStart) {
    sessionId = stored;
    sessionStartTime = storedStart;
    return sessionId;
  }
  
  return initSession();
};

/**
 * Track a page view
 * @param {string} path - Page path (e.g., '/gadgets', '/about')
 * @param {string} title - Page title
 */
export const trackPageView = async (path, title = document.title) => {
  try {
    const sid = getSessionId();
    
    // Backend expects camelCase: sessionId, path, title
    await analyticsClient.post('/analytics/pageview', {
      sessionId: sid,  // Backend expects camelCase
      path,
      title,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    console.log('📊 Page view tracked:', path);
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to track page view:', error?.message);
    }
  }
};

/**
 * Track a custom event
 * @param {string} eventType - Type of event (e.g., 'product_view', 'add_to_cart', 'checkout_start')
 * @param {object} data - Event data
 */
export const trackEvent = async (eventType, data = {}) => {
  try {
    const sid = getSessionId();
    
    // Backend expects camelCase: sessionId, eventType, data
    await analyticsClient.post('/analytics/event', {
      sessionId: sid,  // Backend expects camelCase
      eventType,       // Backend expects camelCase
      data,            // Backend expects 'data' not 'data_json'
      timestamp: new Date().toISOString()
    });
    
    console.log('📊 Event tracked:', eventType, data);
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to track event:', error?.message);
    }
  }
};

/**
 * Track product view
 * @param {object} product - Product object with id, name, category, price
 */
export const trackProductView = (product) => {
  if (!product || !product.id) return;
  
  trackEvent('product_view', {
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    price_mwk: product.price || product.price_mwk,
    price_gbp: product.price_gbp,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track add to cart
 * @param {object} product - Product object
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product || !product.id) return;
  
  trackEvent('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    quantity,
    price_mwk: product.price || product.price_mwk,
    price_gbp: product.price_gbp,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track checkout start
 * @param {array} items - Cart items
 * @param {number} total - Total amount
 * @param {string} currency - Currency (MWK/GBP)
 */
export const trackCheckoutStart = (items, total, currency) => {
  trackEvent('checkout_start', {
    item_count: items.length,
    total_amount: total,
    currency,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track order completion
 * @param {object} order - Order object
 */
export const trackOrderComplete = (order) => {
  if (!order || !order.id) return;
  
  trackEvent('order_complete', {
    order_id: order.id,
    total_amount: order.total_amount,
    currency: order.currency,
    payment_method: order.payment_method,
    item_count: order.items?.length || 0,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track search
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results
 */
export const trackSearch = (query, resultCount = 0) => {
  trackEvent('search', {
    query,
    result_count: resultCount,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track user action
 * @param {string} action - Action name (e.g., 'signup', 'login', 'wishlist_add')
 * @param {object} data - Additional data
 */
export const trackUserAction = (action, data = {}) => {
  trackEvent('user_action', {
    action,
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get session duration in seconds
 */
export const getSessionDuration = () => {
  if (!sessionStartTime) return 0;
  
  const start = new Date(sessionStartTime);
  const now = new Date();
  return Math.floor((now - start) / 1000);
};

/**
 * End session and track session data
 */
export const endSession = async () => {
  if (!sessionId) return;
  
  const duration = getSessionDuration();
  
  try {
    await trackEvent('session_end', {
      session_id: sessionId,
      duration_seconds: duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track session end:', error);
  }
  
  // Clear session data
  sessionId = null;
  sessionStartTime = null;
  sessionStorage.removeItem('analytics_session_id');
  sessionStorage.removeItem('analytics_session_start');
};

// Initialize session on page load
initSession();

// Track session end on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliable tracking on page unload
    if (navigator.sendBeacon && sessionId) {
      // Backend expects camelCase: sessionId, eventType, data
      const blob = new Blob(
        [JSON.stringify({
          sessionId: sessionId,  // Backend expects camelCase
          eventType: 'session_end',  // Backend expects camelCase
          data: {  // Backend expects 'data' not 'data_json'
            duration_seconds: getSessionDuration(),
            timestamp: new Date().toISOString()
          }
        })],
        { type: 'application/json' }
      );
      
      navigator.sendBeacon(`${API_BASE_URL}/analytics/event`, blob);
    }
  });
}

export default {
  trackPageView,
  trackEvent,
  trackProductView,
  trackAddToCart,
  trackCheckoutStart,
  trackOrderComplete,
  trackSearch,
  trackUserAction,
  getSessionDuration,
  endSession
};
