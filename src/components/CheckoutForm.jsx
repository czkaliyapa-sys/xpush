import React, { useState, useEffect } from 'react';
import { formatMWK } from '../utils/formatters';
import { usePricing } from '../hooks/usePricing';
import { useLocation } from '../contexts/LocationContext';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

const CheckoutContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 600,
  margin: '0 auto',
  marginTop: theme.spacing(4)
}));


import { paymentsAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = ({ gadget, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { formatLocalPrice, currency } = usePricing();
  const { country, isMalawi } = useLocation();

  // Determine payment gateway based on location
  const paymentGateway = isMalawi ? 'paychangu' : 'square';
  const paymentCurrency = isMalawi ? 'MWK' : 'GBP';

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate required profile fields
    const missingFields = [];
    if (!userProfile?.email?.trim()) missingFields.push('Email');
    if (!userProfile?.fullName?.trim()) missingFields.push('Full Name');
    if (!userProfile?.address?.trim()) missingFields.push('Address');
    
    if (missingFields.length > 0) {
      setError(`Please complete your profile before checkout. Missing: ${missingFields.join(', ')}`);
      try { navigate('/dashboard/settings'); } catch (_) {}
      return;
    }

    setError(null);
    setProcessing(true);
    setLoading(true);

    try {
      const storageOptions = Array.isArray(gadget?.specifications?.storage) ? gadget.specifications.storage.filter(Boolean) : [];
      const defaultStorage = storageOptions.length > 0 ? storageOptions[0] : undefined;
      
      // Use appropriate price based on location
      const priceToUse = isMalawi 
        ? (gadget.price_mwk || gadget.priceMwk || gadget.price)
        : (gadget.price_gbp || gadget.priceGbp || gadget.price / 2358);
      
      const payloadItems = [{
        id: gadget.id,
        name: gadget.name,
        price: Number(priceToUse),
        quantity: 1,
        description: gadget.description,
        image: gadget.image,
        storage: defaultStorage
      }];

      let response;
      
      if (isMalawi) {
        // Use PayChangu for Malawi (MWK)
        response = await paymentsAPI.createCheckoutSession(payloadItems, {
          successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || 'https://itsxtrapush.com/payment/success',
          cancelUrl: process.env.REACT_APP_PAYMENT_CANCEL_URL || 'https://itsxtrapush.com/payment/cancel',
          customerEmail: user?.email || undefined,
          currency: 'MWK'
        });
      } else {
        // Use Square for international (GBP)
        response = await paymentsAPI.createSquareCheckout(payloadItems, {
          successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || 'https://itsxtrapush.com/payment/success',
          cancelUrl: process.env.REACT_APP_PAYMENT_CANCEL_URL || 'https://itsxtrapush.com/payment/cancel',
          customerEmail: user?.email || undefined,
          currency: 'GBP'
        });
      }

      const session = response;

      if (!session.success) {
        throw new Error(session.error || 'Failed to create checkout session');
      }

      // Redirect to payment provider checkout
      const checkoutUrl = session.url || session.checkout_url;
      if (!checkoutUrl) {
        throw new Error('No checkout URL returned');
      }
      
      // Cache checkout details for success notification
      try {
        localStorage.setItem('xp_lastCheckout', JSON.stringify({
          items: payloadItems,
          installmentPlan: null,
          customerEmail: user?.email || null,
          provider: paymentGateway,
          currency: paymentCurrency
        }));
      } catch (_) {}
      // Keep processing state active during redirection
      window.location.href = checkoutUrl;

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment processing.');
      // Clear states on error
      setProcessing(false);
      setLoading(false);
    }
  };

  const formatPrice = (price) => formatLocalPrice(
    isMalawi 
      ? (gadget.price_mwk || gadget.priceMwk || price)
      : (gadget.price_gbp || gadget.priceGbp || price / 2358)
  );

  return (
    <CheckoutContainer elevation={3}>
      <Typography variant="h4" gutterBottom align="center">
        Checkout
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Payment Method Indicator */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Chip 
          icon={isMalawi ? <PhoneAndroidIcon /> : <CreditCardIcon />}
          label={isMalawi ? 'PayChangu (MWK)' : 'Square (GBP)'}
          color={isMalawi ? 'success' : 'primary'}
          variant="outlined"
        />
      </Box>
      
      {/* Order Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8}>
            <Typography variant="body1">{gadget.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {gadget.description}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="right">
            <Typography variant="h6">
              {formatPrice(gadget.price)}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">Total:</Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6" color="primary">
              {formatPrice(gadget.price)}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Payment Action */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          fullWidth
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || processing}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : (isMalawi ? <PhoneAndroidIcon /> : <CreditCardIcon />)}
        >
          {loading ? 'Processing...' : `Pay ${formatPrice(gadget.price)}`}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
        {isMalawi 
          ? 'Pay securely with mobile money via PayChangu.'
          : 'Pay securely with card via Square.'}
      </Typography>
    </CheckoutContainer>
  );
};

export default CheckoutForm;