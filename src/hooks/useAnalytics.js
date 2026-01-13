/**
 * Analytics Hook
 * 
 * React hook for easy analytics tracking in components
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    analytics.trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};

/**
 * Hook to provide analytics tracking functions
 */
export const useAnalytics = () => {
  const trackProductView = useCallback((product) => {
    analytics.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback((product, quantity) => {
    analytics.trackAddToCart(product, quantity);
  }, []);

  const trackCheckoutStart = useCallback((items, total, currency) => {
    analytics.trackCheckoutStart(items, total, currency);
  }, []);

  const trackOrderComplete = useCallback((order) => {
    analytics.trackOrderComplete(order);
  }, []);

  const trackSearch = useCallback((query, resultCount) => {
    analytics.trackSearch(query, resultCount);
  }, []);

  const trackUserAction = useCallback((action, data) => {
    analytics.trackUserAction(action, data);
  }, []);

  const trackEvent = useCallback((eventType, data) => {
    analytics.trackEvent(eventType, data);
  }, []);

  return {
    trackProductView,
    trackAddToCart,
    trackCheckoutStart,
    trackOrderComplete,
    trackSearch,
    trackUserAction,
    trackEvent
  };
};

export default useAnalytics;
