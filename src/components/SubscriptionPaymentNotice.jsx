import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { subscriptionsAPI } from '../services/api.js';

/**
 * Urgent payment notice for subscription renewals
 * Shows when PayChangu subscriptions require payment
 */
const SubscriptionPaymentNotice = ({ subscription, user, onPaymentInitiated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only show for PayChangu subscriptions that require payment
  if (!subscription || subscription.gateway !== 'paychangu' || !subscription.requiresPayment) {
    return null;
  }

  const handleContinuePlan = async () => {
    if (!user?.uid) {
      setError('Please log in to continue your subscription');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await subscriptionsAPI.renewWithPaychangu({
        userUid: user.uid,
        tier: subscription.tier || 'plus'
      });

      if (result?.checkout_url) {
        // Notify parent component
        if (onPaymentInitiated) {
          onPaymentInitiated(result);
        }
        // Redirect to PayChangu checkout
        window.location.href = result.checkout_url;
      } else {
        setError(result?.error || 'Failed to create checkout. Please try again.');
      }
    } catch (err) {
      console.error('Renewal checkout error:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription.gracePeriodEnd) return null;
    const now = new Date();
    const endDate = new Date(subscription.gracePeriodEnd);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining !== null && daysRemaining <= 3;
  const price = subscription.price || 'MWK 10,000/month';

  return (
    <Card
      elevation={isUrgent ? 8 : 3}
      sx={{
        mb: 3,
        border: isUrgent ? '2px solid' : '1px solid',
        borderColor: isUrgent ? 'error.main' : 'warning.main',
        backgroundColor: isUrgent ? 'error.light' : 'warning.light',
        animation: isUrgent ? 'pulse 2s ease-in-out infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' }
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <WarningIcon 
            sx={{ 
              fontSize: 48, 
              color: isUrgent ? 'error.main' : 'warning.main',
              animation: isUrgent ? 'shake 0.5s ease-in-out infinite' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'rotate(0deg)' },
                '25%': { transform: 'rotate(-5deg)' },
                '75%': { transform: 'rotate(5deg)' }
              }
            }} 
          />
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AlertTitle sx={{ m: 0, fontWeight: 'bold', fontSize: '1.25rem' }}>
                {isUrgent ? '🚨 URGENT: Payment Required!' : '⚠️ Subscription Payment Due'}
              </AlertTitle>
              {daysRemaining !== null && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={daysRemaining === 0 ? 'Due Today' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
                  color={isUrgent ? 'error' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>

            <Typography variant="body1" gutterBottom>
              Your <strong>{subscription.tier === 'premium' ? 'Xtrapush Premium' : 'Xtrapush Plus'}</strong> subscription 
              renewal payment is due. Complete your payment now to continue enjoying:
            </Typography>

            <Box 
              component="ul" 
              sx={{ 
                my: 2, 
                pl: 3,
                '& li': { mb: 0.5 }
              }}
            >
              <li>✨ Free gadget insurance</li>
              <li>🚚 Free delivery on all orders</li>
              {subscription.tier === 'premium' && (
                <>
                  <li>📱 Multiple gadget coverage</li>
                  <li>⚡ Priority customer support</li>
                </>
              )}
            </Box>

            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                mb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount Due:
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {price.split('/')[0]}
                </Typography>
              </Box>
              {daysRemaining !== null && daysRemaining <= 0 && (
                <Typography variant="caption" color="error" fontWeight="bold">
                  Grace period ending soon!
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                onClick={handleContinuePlan}
                disabled={loading}
                sx={{
                  backgroundColor: isUrgent ? 'error.main' : 'warning.dark',
                  '&:hover': {
                    backgroundColor: isUrgent ? 'error.dark' : 'warning.main'
                  },
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5
                }}
              >
                {loading ? 'Processing...' : 'Continue Plan - Pay Now'}
              </Button>

              <Typography variant="caption" color="text.secondary" alignSelf="center">
                Secure payment via PayChangu
              </Typography>
            </Box>

            {daysRemaining !== null && daysRemaining > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                💡 <strong>Note:</strong> If payment is not received within {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}, 
                your subscription will be suspended and benefits will be temporarily unavailable.
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPaymentNotice;
