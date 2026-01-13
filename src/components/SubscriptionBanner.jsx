/**
 * SubscriptionBanner Component
 * 
 * Displays subscription offer banner showing Xtrapush Premium benefits.
 * Shows before checkout and after installment completion.
 * Only visible to international (non-Malawi) users who aren't subscribed.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  LocalShipping as DeliveryIcon,
  Shield as InsuranceIcon,
  SupportAgent as SupportIcon,
  NewReleases as EarlyAccessIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useLocation } from '../contexts/LocationContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getSubscriptionStatus, createSubscription, SUBSCRIPTION_PLAN } from '../services/paymentService.js';

const SubscriptionBanner = ({ 
  variant = 'default', // 'default', 'checkout', 'installment-complete'
  onDismiss,
  showDismiss = true 
}) => {
  const { isMalawi, countryCode } = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      // Only show to international users with accounts
      if (isMalawi || !user?.uid) {
        setIsLoading(false);
        setIsVisible(false);
        return;
      }

      // Check if user already dismissed the banner this session
      const sessionDismissed = sessionStorage.getItem('xp_sub_banner_dismissed');
      if (sessionDismissed === 'true' && variant === 'default') {
        setIsLoading(false);
        setIsVisible(false);
        return;
      }

      try {
        const status = await getSubscriptionStatus(user.uid);
        setSubscriptionStatus(status);
        // Show banner if user doesn't have an active subscription
        setIsVisible(!status?.isActive);
      } catch (err) {
        console.error('Failed to check subscription:', err);
        setIsVisible(true); // Show by default if check fails
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isMalawi, user, variant]);

  const handleSubscribe = async () => {
    if (!user?.uid || !user?.email) {
      setError('Please log in to subscribe');
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        countryCode: countryCode || (isMalawi ? 'MW' : 'GB') // Add countryCode for gateway detection
      });

      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else if (result?.success) {
        // Subscription created directly (unlikely without card on file)
        setIsVisible(false);
        window.location.href = '/dashboard?subscription=success';
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to start subscription. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to start subscription. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('xp_sub_banner_dismissed', 'true');
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  // Don't render for Malawi users or if already subscribed
  if (isLoading) {
    return null;
  }

  if (!isVisible || isMalawi) {
    return null;
  }

  const benefits = [
    { icon: <InsuranceIcon />, text: 'Free insurance on all purchases', highlight: true },
    { icon: <DeliveryIcon />, text: 'Free delivery on all orders', highlight: true },
    { icon: <SupportIcon />, text: 'Priority customer support' },
    { icon: <EarlyAccessIcon />, text: 'Early access to new products' }
  ];

  // Different styles based on variant
  const getStyles = () => {
    switch (variant) {
      case 'checkout':
        return {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          mb: 2
        };
      case 'installment-complete':
        return {
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          mb: 2
        };
      default:
        return {
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          mb: 0
        };
    }
  };

  const getMessage = () => {
    switch (variant) {
      case 'checkout':
        return 'Subscribe now and get FREE insurance & delivery on this order!';
      case 'installment-complete':
        return 'Congratulations! Get FREE insurance & delivery on future orders.';
      default:
        return 'Unlock premium benefits with Xtrapush Premium';
    }
  };

  const styles = getStyles();

  return (
    <Collapse in={!dismissed}>
      <Paper
        elevation={3}
        sx={{
          ...styles,
          color: 'white',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Dismiss button */}
        {showDismiss && (
          <IconButton
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <StarIcon sx={{ color: '#fbbf24' }} />
            <Typography variant="h6" fontWeight="bold">
              Xtrapush Premium
            </Typography>
            <Chip
              label="£5/month"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Message */}
          <Typography variant="body1" sx={{ mb: 2, opacity: 0.95 }}>
            {getMessage()}
          </Typography>

          {/* Benefits grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
            mb: 2
          }}>
            {benefits.map((benefit, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  bgcolor: benefit.highlight ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75
                }}
              >
                {React.cloneElement(benefit.icon, { 
                  fontSize: 'small',
                  sx: { color: benefit.highlight ? '#fbbf24' : 'white' }
                })}
                <Typography variant="body2" sx={{ fontWeight: benefit.highlight ? 600 : 400 }}>
                  {benefit.text}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Subscribe button */}
          <Button
            variant="contained"
            onClick={handleSubscribe}
            disabled={isSubscribing}
            sx={{
              bgcolor: 'white',
              color: variant === 'installment-complete' ? '#065f46' : '#7c3aed',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              },
              '&:disabled': {
                bgcolor: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            {isSubscribing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                Processing...
              </>
            ) : (
              <>
                <CheckIcon sx={{ mr: 1 }} />
                Subscribe for £5/month
              </>
            )}
          </Button>

          {/* Cancel anytime note */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              opacity: 0.7 
            }}
          >
            Cancel anytime. No commitment required.
          </Typography>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default SubscriptionBanner;
