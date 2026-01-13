import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const SquareCardModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  tier, 
  amount, 
  currency = 'GBP' 
}) => {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState(null);
  const [card, setCard] = useState(null);

  // Load Square Web Payments SDK
  useEffect(() => {
    if (!open) return;

    const loadSquareSDK = async () => {
      // Check if already loaded
      if (window.Square) {
        initializeSquare();
        return;
      }

      // Load Square SDK
      const script = document.createElement('script');
      // Use production or sandbox based on environment
      const squareEnv = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'production';
      script.src = squareEnv === 'sandbox' 
        ? 'https://sandbox.web.squarecdn.com/v1/square.js'
        : 'https://web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = () => initializeSquare();
      script.onerror = () => setError('Failed to load Square payment system');
      document.body.appendChild(script);
    };

    const initializeSquare = async () => {
      if (!window.Square) {
        setError('Square SDK not loaded');
        return;
      }

      try {
        const appId = process.env.REACT_APP_SQUARE_APP_ID;
        const locationId = process.env.REACT_APP_SQUARE_LOCATION_ID;
        
        if (!appId || !locationId) {
          throw new Error('Square credentials not configured. Please add REACT_APP_SQUARE_APP_ID and REACT_APP_SQUARE_LOCATION_ID to your .env file.');
        }
        
        const paymentsInstance = window.Square.payments(appId, locationId);
        
        setPayments(paymentsInstance);
        
        // Initialize card element
        const cardInstance = await paymentsInstance.card();
        await cardInstance.attach('#card-container');
        setCard(cardInstance);
      } catch (e) {
        console.error('Square initialization error:', e);
        setError('Failed to initialize payment form: ' + e.message);
      }
    };

    loadSquareSDK();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please confirm you agree to the subscription terms');
      return;
    }

    if (!card) {
      setError('Payment form not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Tokenize card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Pass card nonce to parent
        onSuccess(result.token);
      } else {
        let errorMessage = 'Card verification failed';
        
        if (result.errors) {
          errorMessage = result.errors.map(error => error.message).join(', ');
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    } catch (e) {
      console.error('Tokenization error:', e);
      setError('Failed to process card: ' + e.message);
      setLoading(false);
    }
  };

  const tierName = tier === 'premium' ? 'Premium' : 'Plus';
  const formattedAmount = currency === 'GBP' 
    ? `£${(amount / 100).toFixed(2)}`
    : `${currency} ${amount}`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
          bgcolor: '#fff',
          color: '#333'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: '#fff',
        color: '#333'
      }}>
        <CreditCardIcon sx={{ color: '#48cedb' }} />
        <Box component="span">
          Setup Payment Method
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: '#fff' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
            Xtrapush {tierName} Subscription
          </Typography>
          <Typography variant="h4" sx={{ color: '#48cedb', fontWeight: 700 }}>
            {formattedAmount}<Typography component="span" variant="body2" sx={{ color: '#666' }}>/month</Typography>
          </Typography>
        </Box>

        <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f7f8', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
            ✅ Free unlimited delivery
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
            ✅ {tier === 'premium' ? 'Multiple' : 'Single'} device insurance
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
            ✅ Member discounts
          </Typography>
          {tier === 'premium' && (
            <>
              <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
                ✅ Priority support
              </Typography>
              <Typography variant="body2" sx={{ color: '#333' }}>
                ✅ Early access to new gadgets
              </Typography>
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
            Card Details
          </Typography>
          <Box 
            id="card-container" 
            sx={{ 
              border: '1px solid #ccc',
              borderRadius: 1,
              padding: 2,
              minHeight: 100,
              bgcolor: '#fff'
            }}
          />
        </Box>

        <FormControlLabel
          control={
            <Checkbox 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              sx={{
                color: '#48cedb',
                '&.Mui-checked': {
                  color: '#48cedb',
                }
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: '#333' }}>
              I confirm my subscription to Xtrapush {tierName} for {formattedAmount}/month. 
              My card will be charged automatically each month. I can cancel anytime.
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff' }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!agreed || loading || !card}
          variant="contained"
          startIcon={loading && <CircularProgress size={20} />}
          sx={{
            bgcolor: '#48cedb',
            '&:hover': { bgcolor: '#3aa6b8' },
            '&:disabled': { bgcolor: '#ccc' }
          }}
        >
          {loading ? 'Processing...' : `Subscribe for ${formattedAmount}/month`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SquareCardModal;
