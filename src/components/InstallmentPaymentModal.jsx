import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useMediaQuery
} from '@mui/material';
import { Payment as PaymentIcon, Check as CheckIcon } from '@mui/icons-material';
import { paymentsAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePricing } from '../hooks/usePricing';
import { useNavigate } from 'react-router-dom';

// Safely parse JSON notes, supporting raw strings and nested objects
function parseNotes(notes) {
  if (!notes) return null;
  if (typeof notes === 'object') return notes;
  try {
    const obj = JSON.parse(notes);
    return obj;
  } catch {
    return null;
  }
}

function extractPlan(order) {
  const notesObj = parseNotes(order?.notes);
  const plan = notesObj?.installmentPlan || notesObj || null;
  const createdAt = order?.createdAt || order?.created_at;
  const paidAt = order?.paidAt || order?.paid_at;
  const totalAmount = Number(order?.totalAmount ?? order?.total_amount ?? 0);

  const depositAmount = Number(plan?.depositAmount ?? plan?.deposit ?? 0);
  const weeks = Number(plan?.weeks ?? plan?.durationWeeks ?? plan?.duration ?? 0);
  const weeklyAmount = Number(plan?.weeklyAmount ?? plan?.weekly ?? Math.ceil(Math.max(totalAmount - depositAmount, 0) / (weeks || 1)));
  const amountPaid = Number(plan?.amountPaid ?? (plan?.partials ? plan.partials.reduce((s, p) => s + Number(p?.amount || 0), 0) + depositAmount : depositAmount));
  const remainingAmount = Math.max((Number(plan?.totalAmount ?? totalAmount) - amountPaid), 0);
  const startDate = paidAt || createdAt;
  const expiryDate = startDate ? new Date(new Date(startDate).getTime() + (weeks * 7 * 24 * 60 * 60 * 1000)) : null;

  const status = remainingAmount <= 0 ? 'paid' : 'ongoing';

  return {
    raw: plan,
    weeks,
    weeklyAmount,
    depositAmount,
    amountPaid,
    remainingAmount,
    totalAmount: Number(plan?.totalAmount ?? totalAmount),
    startDate,
    expiryDate,
    status,
  };
}

const InstallmentPaymentModal = ({ open, onClose, order, customerEmail, initialPayMode = 'weekly', initialCustomAmount = null }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    'Preparing payment session...',
    'Creating secure checkout...',
    'Redirecting to payment gateway...'
  ];
  const [error, setError] = useState('');
  const [payMode, setPayMode] = useState(initialPayMode); // 'weekly' | 'remaining' | 'custom'
  const [customAmount, setCustomAmount] = useState(() => {
    if (typeof initialCustomAmount === 'number' && initialCustomAmount > 0) return Math.round(initialCustomAmount);
    return 0;
  });
  const { userProfile } = useAuth();
  const { currency } = usePricing();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  const plan = useMemo(() => extractPlan(order || {}), [order]);
  const weekly = Math.round(Number(plan?.weeklyAmount || 0));
  const remaining = Math.round(Number(plan?.remainingAmount || 0));
  const disabled = plan?.status === 'paid' || (weekly <= 0 && remaining <= 0);

  const payAmount = payMode === 'weekly' ? weekly : (payMode === 'remaining' ? remaining : Math.round(Number(customAmount || 0)));

  const handleProceed = async () => {
    // Require valid Malawi phone number before proceeding
    const malawiPhoneRegex = /^\+265\d{9}$/;
    const phoneVal = (userProfile?.phone || '').trim();
    if (!malawiPhoneRegex.test(phoneVal)) {
      setError('Please add an active phone number (+265 followed by 9 digits) in Profile Settings before making an installment payment.');
      try { navigate('/dashboard/settings'); } catch (_) {}
      return;
    }
    // Validate custom amount when in custom mode
    if (payMode === 'custom') {
      const amt = Math.round(Number(customAmount || 0));
      if (!Number.isFinite(amt) || amt <= 0) {
        setError('Enter a valid custom amount greater than 0.');
        return;
      }
      if (remaining > 0 && amt > remaining) {
        setError('Custom amount cannot exceed remaining balance.');
        return;
      }
    }
    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingStatus(processingSteps[0]);
    
    try {
      setError('');

      // Step 1: Prepare payment session
      setProcessingStep(1);
      setProcessingStatus(processingSteps[1]);

      const items = [
        {
          id: `order:${order?.id}`,
          name: payMode === 'weekly' ? 'Weekly Installment Payment' : (payMode === 'remaining' ? 'Final Installment Payment' : 'Custom Installment Payment'),
          price: Math.round(payAmount),
          quantity: 1
        }
      ];

      const installmentPlan = {
        enabled: true,
        paymentType: 'installment_payment',
        orderId: order?.id,
        weeks: Number(plan?.weeks || 0),
        weeklyAmount: weekly,
        remainingAmount: remaining,
        totalAmount: Math.round(Number(plan?.totalAmount || 0)),
        payAmount: Math.round(payAmount),
        payMode
      };

      const options = {
        customerEmail: customerEmail || null,
        successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || 'https://itsxtrapush.com/payment/success',
        cancelUrl: process.env.REACT_APP_PAYMENT_CANCEL_URL || 'https://itsxtrapush.com/payment/cancel',
        installmentPlan,
        currency: currency
      };

      const res = await paymentsAPI.createCheckoutSession(items, options);

      // Step 2: Redirect to payment gateway
      setProcessingStep(2);
      setProcessingStatus(processingSteps[2]);

      if (res?.success && res?.url) {
        try {
          localStorage.setItem('xp_lastCheckout', JSON.stringify({
            items,
            installmentPlan,
            customerEmail: customerEmail || null
          }));
        } catch (_) {}
        // Keep processing overlay visible during redirection
        window.location.href = res.url;
      } else if (res?.url) {
        try {
          localStorage.setItem('xp_lastCheckout', JSON.stringify({
            items,
            installmentPlan,
            customerEmail: customerEmail || null
          }));
        } catch (_) {}
        // Keep processing overlay visible during redirection
        window.location.href = res.url;
      } else {
        setError(res?.error || 'Failed to create checkout session');
        setIsProcessing(false);
      }
    } catch (e) {
      console.error('Installment payment checkout failed:', e);
      const data = e?.response?.data;
      setError(data?.details || data?.error || e?.message || 'Unexpected error');
      // Clear processing state on error
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingStep(0);
    }
  };

  if (!open) return null;

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      ModalProps={{ keepMounted: true, disableEnforceFocus: true, disableRestoreFocus: true }}
      PaperProps={{
        sx: {
          bgcolor: '#1565c0',
          color: 'white',
          borderRadius: '20px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon />
        Pay Installment
      </DialogTitle>
      <DialogContent sx={{ color: 'rgba(255,255,255,0.92)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Weekly amount</Typography>
            <Typography variant="body1">MWK {weekly.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Remaining balance</Typography>
            <Typography variant="body1">MWK {remaining.toLocaleString()}</Typography>
          </Box>
        </Box>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: 'white' }}>Payment amount</InputLabel>
          <Select
            value={payMode}
            label="Payment amount"
            onChange={(e) => setPayMode(e.target.value)}
            native={isMobile}
            sx={isMobile ? {
              bgcolor: 'white',
              color: '#111',
              borderRadius: 1,
            } : {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }
            }}
            MenuProps={{
              disablePortal: true,
              disableScrollLock: true,
              PaperProps: { sx: { bgcolor: '#1565c0', color: 'white' } }
            }}
          >
            {isMobile ? (
              <>
                <option value="weekly">Weekly installment (MWK {weekly.toLocaleString()})</option>
                <option value="remaining">Pay remaining balance (MWK {remaining.toLocaleString()})</option>
                <option value="custom">Pay custom amount</option>
              </>
            ) : (
              <>
                <MenuItem value="weekly">Weekly installment (MWK {weekly.toLocaleString()})</MenuItem>
                <MenuItem value="remaining">Pay remaining balance (MWK {remaining.toLocaleString()})</MenuItem>
                <MenuItem value="custom">Pay custom amount</MenuItem>
              </>
            )}
          </Select>
        </FormControl>

        {payMode === 'custom' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Enter amount (MWK)</Typography>
            <TextField
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ min: 0, step: 100 }}
              sx={{ mt: 0.5, bgcolor: 'white', borderRadius: 1 }}
            />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
              Max: MWK {remaining.toLocaleString()}
            </Typography>
          </Box>
        )}

        {error ? (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" disabled={isProcessing} sx={{ bgcolor: '#000', color: 'white', '&:hover': { bgcolor: '#111' } }}>Cancel</Button>
        <Button variant="contained" onClick={handleProceed} disabled={isProcessing || disabled || payAmount <= 0} sx={{ bgcolor: '#000', color: 'white', '&:hover': { bgcolor: '#111' } }}>
          {isProcessing ? 'Processing...' : 'Proceed'}
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Processing Modal */}
    <Dialog
      open={isProcessing}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1565c0',
          color: 'white',
          borderRadius: '20px',
          textAlign: 'center',
          p: 3
        }
      }}
    >
      <DialogContent sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* Animated Spinner */}
          <Box sx={{
            width: 60,
            height: 60,
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          
          {/* Status Message */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Processing Payment
          </Typography>
          
          {/* Dynamic Status */}
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', minHeight: '1.5em' }}>
            {processingStatus}
          </Typography>
          
          {/* Progress Steps */}
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            {processingSteps.map((step, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1.5,
                  opacity: index <= processingStep ? 1 : 0.4
                }}
              >
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: index < processingStep 
                    ? 'white' 
                    : index === processingStep 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255,255,255,0.1)',
                  border: index === processingStep 
                    ? '2px solid white' 
                    : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  transition: 'all 0.3s ease'
                }}>
                  {index < processingStep ? (
                    <CheckIcon sx={{ color: '#1565c0', fontSize: 16 }} />
                  ) : index === processingStep ? (
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'white',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                  ) : null}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: index <= processingStep ? 'white' : 'rgba(255,255,255,0.5)',
                    fontWeight: index === processingStep ? 600 : 400
                  }}
                >
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Loading Bar */}
          <Box sx={{ width: '100%', maxWidth: 300, mt: 1 }}>
            <Box sx={{
              height: 6,
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <Box sx={{
                height: '100%',
                width: `${((processingStep + 1) / processingSteps.length) * 100}%`,
                bgcolor: 'white',
                borderRadius: 3,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block' }}>
              {Math.round(((processingStep + 1) / processingSteps.length) * 100)}% Complete
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default InstallmentPaymentModal;