/**
 * Payment Context - Manages payment gateway selection and state
 * 
 * Provides:
 * - Automatic gateway selection based on user location
 * - Payment method management
 * - Currency handling for dual-currency system
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation as useLocationContext } from './LocationContext';
import {
  PAYMENT_GATEWAYS,
  CURRENCIES,
  getPaymentGateway,
  getCurrencyForCountry,
  getAvailablePaymentMethods,
  createCheckoutSession as createCheckout,
  verifyPayment,
  paymentConfig
} from '../services/paymentService';

const PaymentContext = createContext(null);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const { country, currency: locationCurrency, isInMalawi } = useLocationContext();
  
  // Payment state
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paymentCurrency, setPaymentCurrency] = useState(CURRENCIES.GBP);
  const [squareConfig, setSquareConfig] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);

  // Determine gateway and currency based on location
  useEffect(() => {
    const gateway = getPaymentGateway(country);
    const currency = getCurrencyForCountry(country);
    
    setSelectedGateway(gateway);
    setPaymentCurrency(currency);
    
    console.log('💳 Payment gateway set:', gateway, 'Currency:', currency, 'Country:', country);
  }, [country]);

  // Load Square config for international users
  useEffect(() => {
    const loadSquareConfig = async () => {
      if (selectedGateway === PAYMENT_GATEWAYS.SQUARE && !squareConfig) {
        try {
          const appId = await paymentConfig.square.getAppId();
          if (appId) {
            setSquareConfig({ appId });
            console.log('💳 Square config loaded');
          }
        } catch (error) {
          console.warn('Failed to load Square config:', error);
        }
      }
    };
    
    loadSquareConfig();
  }, [selectedGateway, squareConfig]);

  // Get available payment methods for current location
  const availablePaymentMethods = useMemo(() => {
    return getAvailablePaymentMethods(country);
  }, [country]);

  // Create checkout session
  const initiateCheckout = useCallback(async ({
    items,
    customerEmail,
    installmentPlan = null,
    successUrl,
    cancelUrl
  }) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const response = await createCheckout({
        items,
        countryCode: country,
        customerEmail,
        installmentPlan,
        successUrl,
        cancelUrl
      });

      if (response.success) {
        setLastTransaction({
          gateway: selectedGateway,
          reference: response.tx_ref || response.sessionId,
          items,
          timestamp: new Date().toISOString()
        });

        // Store checkout info for success page
        try {
          localStorage.setItem('xp_lastCheckout', JSON.stringify({
            items,
            installmentPlan,
            customerEmail,
            gateway: selectedGateway,
            currency: paymentCurrency
          }));
        } catch (_) {}

        return response;
      } else {
        throw new Error(response.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setPaymentError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [country, selectedGateway, paymentCurrency]);

  // Verify payment
  const verifyTransaction = useCallback(async (reference) => {
    try {
      const result = await verifyPayment(selectedGateway, reference);
      return result;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }, [selectedGateway]);

  // Check if Square is available (for international users)
  const isSquareAvailable = useMemo(() => {
    return selectedGateway === PAYMENT_GATEWAYS.SQUARE && squareConfig?.appId;
  }, [selectedGateway, squareConfig]);

  // Check if PayChangu is available (for Malawi users)
  const isPayChanguAvailable = useMemo(() => {
    return selectedGateway === PAYMENT_GATEWAYS.PAYCHANGU;
  }, [selectedGateway]);

  const value = {
    // Gateway info
    selectedGateway,
    isSquareGateway: selectedGateway === PAYMENT_GATEWAYS.SQUARE,
    isPayChanguGateway: selectedGateway === PAYMENT_GATEWAYS.PAYCHANGU,
    
    // Currency
    paymentCurrency,
    isGBP: paymentCurrency === CURRENCIES.GBP,
    isMWK: paymentCurrency === CURRENCIES.MWK,
    
    // Available methods
    availablePaymentMethods,
    isSquareAvailable,
    isPayChanguAvailable,
    
    // Square config
    squareConfig,
    squareAppId: squareConfig?.appId,
    
    // State
    isProcessing,
    paymentError,
    lastTransaction,
    
    // Actions
    initiateCheckout,
    verifyTransaction,
    clearError: () => setPaymentError(null),
    
    // Constants
    PAYMENT_GATEWAYS,
    CURRENCIES
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentContext;
