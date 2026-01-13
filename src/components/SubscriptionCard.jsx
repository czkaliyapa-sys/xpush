/**
 * SubscriptionCard Component
 * 
 * Displays user's subscription status and management options in the dashboard.
 * Supports both UK (GBP) and Malawi (MWK) currencies.
 * Now includes two tiers: Xtrapush Plus and Xtrapush Premium.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import {
  Star as StarIcon,
  LocalShipping as DeliveryIcon,
  Shield as InsuranceIcon,
  SupportAgent as SupportIcon,
  NewReleases as EarlyAccessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Upgrade as UpgradeIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import { 
  getSubscriptionStatus, 
  createSubscription, 
  cancelSubscription,
  SUBSCRIPTION_PLAN 
} from '../services/paymentService.js';

const SubscriptionCard = () => {
  const { user } = useAuth();
  const { isMalawi, countryCode } = useLocation();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null); // 'plus' or 'premium'
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const status = await getSubscriptionStatus(user.uid);
        setSubscription(status);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const handleSubscribe = async (tier) => {
    if (!user?.uid || !user?.email) {
      setError('Please log in to subscribe');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    // Prevent duplicate subscriptions - check if already subscribed to this tier
    if (subscription?.isActive && subscription?.tier === tier) {
      setError(`You already have an active ${tier === 'premium' ? 'Premium' : 'Plus'} subscription`);
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        currency: isMalawi ? 'MWK' : 'GBP',
        tier: tier, // 'plus' or 'premium'
        countryCode: countryCode || (isMalawi ? 'MW' : 'GB') // Add countryCode for gateway detection
      });

      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to start subscription. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to start subscription. Please try again.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const openSubscribeDialog = (tier) => {
    // Check if trying to subscribe to same tier
    if (subscription?.isActive && subscription?.tier === tier) {
      setError(`You already have an active ${tier === 'premium' ? 'Premium' : 'Plus'} subscription`);
      return;
    }
    
    setSelectedTier(tier);
    setAgreedToTerms(false);
    setSubscribeDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    setActionLoading(true);
    setError(null);

    try {
      await cancelSubscription(user.uid);
      setSubscription(prev => ({
        ...prev,
        isActive: false,
        status: 'CANCELED'
      }));
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Cancel error:', err);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  const isActive = subscription?.isActive;
  const currentTier = subscription?.tier || 'plus'; // default to 'plus' for existing subscriptions

  // Currency-specific pricing
  const plusPrice = isMalawi ? 'MWK 6,000/month' : '£6.00/month';
  const premiumPrice = isMalawi ? 'MWK 10,000/month' : '£9.99/month';

  const plusBenefits = [
    { icon: <DeliveryIcon sx={{ color: '#48CEDB' }} />, text: 'Free Unlimited Delivery – Included with every order' },
    { icon: <InsuranceIcon sx={{ color: '#48CEDB' }} />, text: 'Single Gadget Insurance (1 Year) – Covers ONE laptop, smartphone, or tablet' },
    { icon: <VerifiedIcon sx={{ color: '#48CEDB' }} />, text: 'Minor Discounts – Small savings on selected items' }
  ];

  const premiumBenefits = [
    { icon: <DeliveryIcon sx={{ color: '#48CEDB' }} />, text: 'Free Unlimited Delivery – Included with every order' },
    { icon: <InsuranceIcon sx={{ color: '#48CEDB' }} />, text: 'Multiple Gadget Insurance (1 Year Each) – Covers ALL eligible laptops, smartphones, and tablets' },
    { icon: <PremiumIcon sx={{ color: '#48CEDB' }} />, text: 'Exclusive Discounts – Members-only deals on all gadgets' },
    { icon: <SupportIcon sx={{ color: '#48CEDB' }} />, text: 'Priority Support – Fast-track customer service' }
  ];

  return (
    <>
      {/* Active Subscription Card */}
      {isActive ? (
        <Card 
          sx={{ 
            mb: 3,
            background: currentTier === 'premium' 
              ? 'linear-gradient(135deg, rgba(72, 206, 219, 0.15) 0%, rgba(72, 206, 219, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(72, 206, 219, 0.1) 0%, rgba(72, 206, 219, 0.05) 100%)',
            border: currentTier === 'premium' ? '2px solid #48CEDB' : '2px solid #48CEDB'
          }}
        >
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentTier === 'premium' ? (
                  <PremiumIcon sx={{ color: '#48CEDB' }} />
                ) : (
                  <VerifiedIcon sx={{ color: '#48CEDB' }} />
                )}
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Xtrapush {currentTier === 'premium' ? 'Premium' : 'Plus'}
                </Typography>
              </Box>
              <Chip
                icon={<CheckIcon />}
                label="Active"
                color="success"
                variant="filled"
              />
            </Box>

            {/* Status message */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {currentTier === 'premium'
                ? 'You are enjoying Premium benefits including multiple gadget insurance, free delivery, and exclusive discounts!'
                : 'You are enjoying Plus benefits including single gadget insurance, free delivery, and exclusive discounts!'
              }
            </Typography>

            {/* Benefits list */}
            <List dense sx={{ mb: 2 }}>
              {(currentTier === 'premium' ? premiumBenefits : plusBenefits).map((benefit, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {benefit.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={benefit.text}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.primary'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {currentTier === 'plus' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => openSubscribeDialog('premium')}
                  disabled={actionLoading}
                  startIcon={<UpgradeIcon />}
                  sx={{ bgcolor: '#48CEDB', color: '#fff', '&:hover': { bgcolor: '#3ba8b8' } }}
                >
                  Upgrade to Premium
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelDialogOpen(true)}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={16} /> : <CancelIcon />}
              >
                Cancel Subscription
              </Button>
            </Box>

            {/* Subscription details */}
            {subscription?.updatedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Member since {new Date(subscription.updatedAt).toLocaleDateString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Not Subscribed - Show Both Tiers */
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
            Subscription Plans
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Subscribe to unlock free delivery, gadget insurance, and exclusive discounts. <strong>Insurance covers laptops, smartphones, and tablets only.</strong>
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Xtrapush Plus Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(72, 206, 219, 0.08) 0%, rgba(72, 206, 219, 0.04) 100%)',
                  border: '1px solid rgba(72, 206, 219, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(72, 206, 219, 0.2)',
                    borderColor: '#48CEDB'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(72, 206, 219, 0.15)',
                        display: 'flex'
                      }}>
                        <VerifiedIcon sx={{ color: '#48CEDB', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        Plus
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Essential protection & free delivery
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#48CEDB' }}>
                        {isMalawi ? '6,000' : '6'}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        {isMalawi ? 'MWK' : '£'}/month
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Billed monthly • Cancel anytime
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <List dense sx={{ mb: 3 }}>
                    {plusBenefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                          <CheckIcon sx={{ color: '#48CEDB', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.primary',
                            fontWeight: 500
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={() => openSubscribeDialog('plus')}
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={20} /> : null}
                    sx={{ 
                      borderColor: '#48CEDB',
                      color: '#48CEDB',
                      fontWeight: 600,
                      py: 1.5,
                      '&:hover': { 
                        bgcolor: 'rgba(72, 206, 219, 0.1)',
                        borderColor: '#48CEDB'
                      }
                    }}
                  >
                    {actionLoading ? 'Processing...' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Xtrapush Premium Card - Popular */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(72, 206, 219, 0.15) 0%, rgba(72, 206, 219, 0.08) 100%)',
                  border: '2px solid #48CEDB',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(72, 206, 219, 0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(72, 206, 219, 0.35)'
                  }
                }}
              >
                <Chip 
                  label="Most Popular" 
                  size="small" 
                  sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: '#48CEDB', 
                    color: '#0f172a', 
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: 0.5
                  }} 
                />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(72, 206, 219, 0.25)',
                        display: 'flex'
                      }}>
                        <PremiumIcon sx={{ color: '#48CEDB', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        Premium
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Complete protection & exclusive perks
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#48CEDB' }}>
                        {isMalawi ? '10,000' : '9.99'}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        {isMalawi ? 'MWK' : '£'}/month
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Billed monthly • Cancel anytime
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <List dense sx={{ mb: 3 }}>
                    {premiumBenefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                          <CheckIcon sx={{ color: '#48CEDB', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.primary',
                            fontWeight: 500
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => openSubscribeDialog('premium')}
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={20} /> : null}
                    sx={{ 
                      bgcolor: '#48CEDB', 
                      color: '#0f172a',
                      fontWeight: 700,
                      py: 1.5,
                      boxShadow: '0 4px 12px rgba(72, 206, 219, 0.4)',
                      '&:hover': { 
                        bgcolor: '#3ab9c7',
                        boxShadow: '0 6px 16px rgba(72, 206, 219, 0.5)'
                      }
                    }}
                  >
                    {actionLoading ? 'Processing...' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Subscribe confirmation dialog with terms agreement */}
      <Dialog open={subscribeDialogOpen} onClose={() => setSubscribeDialogOpen(false)}>
        <DialogTitle>
          Subscribe to Xtrapush {selectedTier === 'premium' ? 'Premium' : 'Plus'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to subscribe to <strong>Xtrapush {selectedTier === 'premium' ? 'Premium' : 'Plus'}</strong> for{' '}
            <strong>{selectedTier === 'premium' ? premiumPrice : plusPrice}</strong>.
          </DialogContentText>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.04)', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              {selectedTier === 'premium' ? 'Premium Benefits:' : 'Plus Benefits:'}
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Free unlimited delivery on all orders</li>
              <li>{selectedTier === 'premium' 
                ? 'Multiple gadget insurance (1 year each) – covers all laptops, smartphones, and tablets'
                : 'Single gadget insurance (1 year) – covers one laptop, smartphone, or tablet'}
              </li>
              <li>{selectedTier === 'premium' ? 'Exclusive member discounts on all gadgets' : 'Minor discounts on selected items'}</li>
              {selectedTier === 'premium' && <li>Priority customer support</li>}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox 
                checked={agreedToTerms} 
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I have read and agree to the{' '}
                <Link href="/terms" target="_blank" sx={{ color: '#48CEDB' }}>
                  subscription terms and insurance policy
                </Link>
                . I understand that gadget insurance covers laptops, smartphones, and tablets only.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscribeDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setSubscribeDialogOpen(false);
              handleSubscribe(selectedTier);
            }}
            variant="contained"
            disabled={!agreedToTerms || actionLoading}
            sx={{
              bgcolor: '#48CEDB',
              color: '#fff',
              '&:hover': { bgcolor: '#3ba8b8' }
            }}
          >
            {actionLoading ? 'Processing...' : 'Confirm Subscription'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your Xtrapush {currentTier === 'premium' ? 'Premium' : 'Plus'} subscription? 
            You will lose access to free insurance and delivery benefits.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubscriptionCard;
