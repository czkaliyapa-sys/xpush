import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI, ordersAPI } from '../services/api.js';
import { recordEvent } from '../services/analyticsApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatOrderReference, generateCompactReference } from '../utils/orderReference.js';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PrintableOrder from './PrintableOrder.jsx';
import { exportNodeToPdf, renderNodeToPdfUrl } from '../utils/pdf.js';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Logo from './Logo.jsx';

const SuccessContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  maxWidth: 600,
  margin: '0 auto',
  marginTop: theme.spacing(8),
  textAlign: 'center'
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(3)
}));

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [checkoutCache, setCheckoutCache] = useState(null);
  const { user } = useAuth();
  const eventSentRef = useRef(false);
  const notifySentRef = useRef(false);
  const receiptRef = useRef(null);
  const orderPrintRef = useRef(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);

  const tableStyles = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
    th: { textAlign: 'left', border: '1px solid #ddd', padding: '8px', background: '#f7f7f7' },
    td: { border: '1px solid #ddd', padding: '8px' },
    right: { border: '1px solid #ddd', padding: '8px', textAlign: 'right' }
  };

  const resolveImageUrl = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      const host = (parsed.hostname || '').replace(/^www\./, '');
      if (host === 'sparkle-pro.co.uk') {
        let path = parsed.pathname || '/';
        if (!/^\/api\//i.test(path)) {
          path = `/api${path.startsWith('/') ? '' : '/'}${path}`;
        }
        return `${path}${parsed.search || ''}`;
      }
      return url;
    } catch (_) {
      return url;
    }
  };

  // PayChangu verification via tx_ref or reference fallback
  const txRef = searchParams.get('tx_ref') || searchParams.get('reference') || searchParams.get('txRef');

  // Read any cached checkout details set before redirect (preserve in state)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('xp_lastCheckout');
      const cached = raw ? JSON.parse(raw) : null;
      setCheckoutCache(cached);
    } catch (_) {
      setCheckoutCache(null);
    }
  }, []);

  useEffect(() => {
    const verifyPayment = async () => {
      // Declare provider outside try block so it's accessible in catch
      let provider = 'paychangu'; // default fallback
      
      try {
        if (txRef) {
          console.log('🔍 Verifying payment with txRef:', txRef);
          
          // First, try to get session data from cache
          const cachedCheckout = localStorage.getItem('xp_lastCheckout');
          
          // Detect provider from transaction reference prefix as primary method
          if (txRef?.startsWith('SQ-')) {
            provider = 'square';
            console.log('💳 Detected Square payment from txRef prefix');
          } else if (txRef?.startsWith('PC-')) {
            provider = 'paychangu';
            console.log('💳 Detected PayChangu payment from txRef prefix');
          } else if (txRef?.startsWith('RENEWAL-')) {
            // Subscription renewals - detect gateway from user's subscription data
            console.log('🔄 Detected subscription renewal payment');
            // For renewals, we'll try to detect from cache or default to paychangu (most renewals are PayChangu)
            // In future, we could fetch user's subscription_gateway from backend
          }
          
          let expectedAmount = null;
          let expectedCurrency = null;
          
          if (cachedCheckout) {
            try {
              const checkoutData = JSON.parse(cachedCheckout);
              // Override with cached provider if available (more reliable)
              if (checkoutData.provider) {
                provider = checkoutData.provider;
                console.log('💳 Payment provider from cache (override):', provider);
              }
              expectedAmount = checkoutData.totalAmount || null;
              expectedCurrency = checkoutData.currency || (provider === 'square' ? 'GBP' : 'MWK');
              console.log('💰 Expected amount:', expectedAmount, expectedCurrency);
            } catch (e) {
              console.warn('Failed to parse cached checkout data');
            }
          } else {
            // Set default currency based on detected provider
            expectedCurrency = provider === 'square' ? 'GBP' : 'MWK';
            console.log('💳 No cache found, using default currency:', expectedCurrency);
          }
          
          let data;
          if (provider === 'square') {
            console.log('🔄 Verifying Square payment');
            data = await paymentsAPI.verifySquarePayment(txRef);
          } else {
            console.log('🔄 Verifying PayChangu payment');
            data = await paymentsAPI.verifyPayChangu(txRef);
          }
          
          console.log('📊 Verification response:', data);
          
          if (data.success) {
            const verifiedAmount = data.data?.amount;
            const verifiedCurrency = data.data?.currency;
            
            console.log('💰 Verified amount:', verifiedAmount, verifiedCurrency);
            
            // Compare expected vs actual amounts
            if (expectedAmount && verifiedAmount) {
              const expectedFormatted = typeof expectedAmount === 'number' ? expectedAmount : parseFloat(expectedAmount);
              const verifiedFormatted = typeof verifiedAmount === 'number' ? verifiedAmount : parseFloat(verifiedAmount);
              
              if (Math.abs(expectedFormatted - verifiedFormatted) > 1) {
                console.warn('⚠️ Amount mismatch detected!', {
                  expected: expectedFormatted,
                  verified: verifiedFormatted,
                  difference: Math.abs(expectedFormatted - verifiedFormatted)
                });
              }
            }
            
            setSessionData(data.data);
            console.log('✅ Payment verified successfully');
          } else {
            const errorMsg = data.error || 'Failed to verify payment';
            console.error('❌ Payment verification failed:', errorMsg);
            setError(errorMsg);
          }
        } else {
          console.error('❌ No payment reference found');
          setError('No payment reference found');
        }
      } catch (err) {
        console.error('💥 Error verifying payment:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data,
          status: err.response?.status,
          provider: provider,
          txRef: txRef,
          endpoint: provider === 'square' ? `/payments/square/verify/${txRef}` : `/payments/paychangu/verify/${txRef}`
        });
        
        // More descriptive error messages
        let errorMessage = 'Failed to verify payment status';
        
        // Check if this is a subscription renewal
        const isRenewal = txRef?.startsWith('RENEWAL-');
        
        // Specific handling for 502 errors (Bad Gateway)
        if (err.response?.status === 502) {
          if (provider === 'square') {
            errorMessage = 'Unable to verify Square payment. The payment may have been processed successfully. Please check your email for confirmation or contact support with your order reference.';
          } else if (isRenewal) {
            errorMessage = 'Unable to verify subscription renewal payment. The payment may have been processed successfully. Please check your email for confirmation or contact support with your renewal reference.';
          } else {
            errorMessage = 'Unable to verify PayChangu payment. The payment may have been processed successfully. Please check your email for confirmation or contact support with your order reference.';
          }
        } else if (err.message?.includes('Network Error')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (err.message?.includes('timeout')) {
          errorMessage = 'Payment verification timed out. Please refresh the page.';
        } else if (err.response?.status === 404) {
          if (isRenewal) {
            errorMessage = 'Subscription renewal reference not found. Please contact support with your renewal details.';
          } else {
            errorMessage = 'Payment reference not found. Please contact support.';
          }
        } else if (err.response?.status === 500) {
          errorMessage = 'Server error occurred. Please try again or contact support.';
        } else if (err.message?.includes('verify')) {
          if (isRenewal) {
            errorMessage = 'Subscription renewal verification failed. Please check your renewal details or contact support.';
          } else {
            errorMessage = 'Payment verification failed. Please check your transaction details or contact support.';
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [txRef]);

  // Record checkout completion as a purchase event and link with orders
  useEffect(() => {
    const recordPurchase = async () => {
      if (!sessionData || eventSentRef.current) return;
      const sessionId = localStorage.getItem('xp_analytics_sid');
      const baseData = {
        txRef,
        paymentReference: sessionData?.id,
        amount: sessionData?.amount,
        currency: sessionData?.currency,
        paymentStatus: sessionData?.payment_status,
      };

      try {
        // Attempt to link to a user order if available
        const uid = user?.uid || null;
        if (uid) {
          const res = await ordersAPI.getUserOrders(uid);
          if (res?.success && Array.isArray(res.orders)) {
            // Prefer most recent paid order
            const paid = res.orders.filter((o) => String(o.paymentStatus || o.status || '').toLowerCase().includes('paid'));
            const candidate = paid[0] || res.orders[0] || null;
            if (candidate) {
              baseData.orderId = candidate.id;
              baseData.order = {
                id: candidate.id,
                totalAmount: candidate.totalAmount,
                currency: candidate.currency,
                createdAt: candidate.createdAt,
                itemCount: Array.isArray(candidate.items) ? candidate.items.length : undefined,
              };
            }
          }
        }
      } catch (e) {
        // Non-blocking: proceed even if orders fetch fails
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Orders linkage failed:', e?.message || e);
        }
      }

      // Fire-and-forget purchase event
      if (sessionId) {
        await recordEvent(sessionId, 'purchase', baseData);
      }
      eventSentRef.current = true;
    };

    recordPurchase();
  }, [sessionData, user, txRef]);

  // Send payment confirmation emails via backend (customer + admin)
  useEffect(() => {
    const sendEmails = async () => {
      if (!sessionData || notifySentRef.current) return;

      const payload = {
        txRef,
        amount: sessionData?.amount,
        currency: sessionData?.currency,
        customerEmail: sessionData?.customer_email || user?.email || null,
        paymentStatus: sessionData?.payment_status || 'success',
        items: checkoutCache?.items || null,
        installmentPlan: checkoutCache?.installmentPlan || null,
      };

      try {
        await paymentsAPI.notifyPaymentSuccess(payload);
      } catch (e) {
        // Non-blocking: swallow errors to avoid impacting UX
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Notify payment success failed:', e?.message || e);
        }
      } finally {
        notifySentRef.current = true;
        try { localStorage.removeItem('xp_lastCheckout'); } catch (_) {}
      }
    };

    sendEmails();
  }, [sessionData, txRef, user]);

  const formatAmount = (amount, currency) => {
    const code = currency?.toUpperCase() || 'MWK';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const divisor = code === 'MWK' ? 1 : 100; // MWK amounts come as whole numbers
    const finalAmount = (numAmount || 0) / divisor;
    
    // Debug logging for pricing issues
    if (process.env.NODE_ENV !== 'production') {
      console.log('Formatting amount:', { amount, currency: code, divisor, finalAmount });
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code
    }).format(finalAmount);
  };

  const handleContinueShopping = () => {
    navigate('/dashboard/gadgets');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    await exportNodeToPdf(receiptRef.current, 'Xtrapush-Receipt.pdf');
  };

  const handleDownloadOrder = async () => {
    if (!orderPrintRef.current) return;
    await exportNodeToPdf(orderPrintRef.current, 'Xtrapush-Order.pdf');
  };

  const handleViewReceipt = async () => {
    if (!receiptRef.current) return;
    const url = await renderNodeToPdfUrl(receiptRef.current);
    setPdfViewerUrl(url);
    setPdfViewerOpen(true);
  };

  const handleViewOrder = async () => {
    if (!orderPrintRef.current) return;
    const url = await renderNodeToPdfUrl(orderPrintRef.current);
    setPdfViewerUrl(url);
    setPdfViewerOpen(true);
  };


  if (loading) {
    return (
      <SuccessContainer elevation={3}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verifying your payment...
        </Typography>
      </SuccessContainer>
    );
  }

  if (error) {
    return (
      <SuccessContainer elevation={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={handleGoHome}
          startIcon={<HomeIcon />}
        >
          Go to Home
        </Button>
      </SuccessContainer>
    );
  }

  return (
    <SuccessContainer elevation={3}>
      <IconContainer>
        <CheckCircleOutlineIcon 
          sx={{ 
            fontSize: 80, 
            color: 'success.main' 
          }} 
        />
      </IconContainer>
      
      <Typography variant="h3" gutterBottom color="success.main">
        Payment Successful!
      </Typography>
      
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Thank you for your purchase
      </Typography>
      
      {sessionData && (
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Order Details:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order Reference: {formatOrderReference(sessionData.id)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: {formatAmount(sessionData.amount, sessionData.currency)}
          </Typography>
          {sessionData.customer_email && (
            <Typography variant="body2" color="text.secondary">
              Email: {sessionData.customer_email}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Status: {sessionData.payment_status}
          </Typography>
        </Box>
      )}
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        Your order has been confirmed and you will receive an email confirmation shortly.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handleContinueShopping}
          startIcon={<ShoppingBagIcon />}
          size="large"
        >
          Continue Shopping
        </Button>
        
        {(sessionData || checkoutCache) && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleViewOrder}
            size="large"
          >
            View Order
          </Button>
        )}
      </Box>

      {/* Hidden printable receipt (neat layout) */}
      {sessionData && (
        <Box
          ref={receiptRef}
          sx={{ position: 'absolute', left: -9999, top: -9999, width: 640, p: 0, background: '#fff', color: '#000' }}
        >
          {/* Centered brand header */}
          <Box sx={{ background: '#fff', color: '#000', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
            <Logo style={{ width: 110, height: 'auto', transform: 'none', marginRight: 10 }} />
            <Typography variant="subtitle1" fontWeight={700}>Payment Receipt</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {/* Summary details */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Summary</Typography>
            <table style={tableStyles.table}>
              <tbody>
                <tr>
                  <td style={tableStyles.td}>Reference</td>
                  <td style={tableStyles.right}>{txRef || '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Order Reference</td>
                  <td style={tableStyles.right}>{generateCompactReference(sessionData.id)}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Email</td>
                  <td style={tableStyles.right}>{sessionData.customer_email || user?.email || '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Amount Paid</td>
                  <td style={tableStyles.right}>{formatAmount(sessionData.amount, sessionData.currency)}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Paid at</td>
                  <td style={tableStyles.right}>{new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Status</td>
                  <td style={tableStyles.right}>{sessionData.payment_status}</td>
                </tr>
              </tbody>
            </table>

            {/* Fee Breakdown */}
            {(checkoutCache?.subtotal || checkoutCache?.deliveryFee > 0 || checkoutCache?.subscriptionFee > 0) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Order Summary</Typography>
                <table style={tableStyles.table}>
                  <tbody>
                    {typeof checkoutCache.subtotal === 'number' && (
                      <tr>
                        <td style={tableStyles.td}>Subtotal</td>
                        <td style={tableStyles.right}>{formatAmount(checkoutCache.subtotal, sessionData.currency)}</td>
                      </tr>
                    )}
                    {typeof checkoutCache.subscriptionFee === 'number' && checkoutCache.subscriptionFee > 0 && (
                      <tr>
                        <td style={tableStyles.td}>Xtrapush {checkoutCache.subscriptionTier === 'premium' ? 'Premium' : 'Plus'} (Monthly)</td>
                        <td style={tableStyles.right}>{formatAmount(checkoutCache.subscriptionFee, sessionData.currency)}</td>
                      </tr>
                    )}
                    {typeof checkoutCache.deliveryFee === 'number' && checkoutCache.deliveryFee > 0 && (
                      <tr>
                        <td style={tableStyles.td}>Delivery Fee</td>
                        <td style={tableStyles.right}>{formatAmount(checkoutCache.deliveryFee, sessionData.currency)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{...tableStyles.td, fontWeight: 600}}>Total Amount</td>
                      <td style={{...tableStyles.right, fontWeight: 600}}>{formatAmount(sessionData.amount, sessionData.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            )}

            {/* Items block */}
            {(checkoutCache?.items || []).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Items</Typography>
                <table style={tableStyles.table}>
                  <thead>
                    <tr>
                      <th style={tableStyles.th}>Image</th>
                      <th style={tableStyles.th}>Item</th>
                      <th style={tableStyles.th}>Details</th>
                      <th style={tableStyles.th}>Qty</th>
                      <th style={tableStyles.th}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutCache.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={tableStyles.td}>
                          {it?.image ? (
                            <img
                              src={resolveImageUrl(it.image)}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              alt={it.name || it.title || 'Item'}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : '—'}
                        </td>
                        <td style={tableStyles.td}>
                          <strong>{it?.name || it?.title || 'Item'}</strong>
                        </td>
                        <td style={tableStyles.td}>
                          {[it?.brand, it?.model, it?.storage, it?.condition].filter(Boolean).join(' • ') || '—'}
                        </td>
                        <td style={tableStyles.right}>{Number(it?.quantity || 1)}</td>
                        <td style={tableStyles.right}>{formatAmount(it?.price || 0, sessionData.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            {/* Installment plan details (if present) */}
            {checkoutCache?.installmentPlan && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Installment Plan</Typography>
                <table style={tableStyles.table}>
                  <tbody>
                    <tr>
                      <td style={tableStyles.td}>Weeks</td>
                      <td style={tableStyles.right}>{checkoutCache.installmentPlan.weeks ?? '—'}</td>
                    </tr>
                    <tr>
                      <td style={tableStyles.td}>Weekly Amount</td>
                      <td style={tableStyles.right}>{typeof checkoutCache.installmentPlan.weeklyAmount === 'number' ? formatAmount(Number(checkoutCache.installmentPlan.weeklyAmount), sessionData.currency) : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tableStyles.td}>Total</td>
                      <td style={tableStyles.right}>{typeof checkoutCache.installmentPlan.totalAmount === 'number' ? formatAmount(Number(checkoutCache.installmentPlan.totalAmount), sessionData.currency) : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tableStyles.td}>Amount Paid</td>
                      <td style={tableStyles.right}>{typeof checkoutCache.installmentPlan.amountPaid === 'number' ? formatAmount(Number(checkoutCache.installmentPlan.amountPaid), sessionData.currency) : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tableStyles.td}>Remaining</td>
                      <td style={tableStyles.right}>{typeof checkoutCache.installmentPlan.remainingAmount === 'number' ? formatAmount(Number(checkoutCache.installmentPlan.remainingAmount), sessionData.currency) : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tableStyles.td}>Next Due</td>
                      <td style={tableStyles.right}>{checkoutCache.installmentPlan.nextDueDate ? new Date(checkoutCache.installmentPlan.nextDueDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            )}

            <Typography variant="body2" sx={{ mt: 2 }}>Thank you for your purchase.</Typography>
          </Box>
        </Box>
      )}

      {/* Hidden printable order summary */}
      {(sessionData || checkoutCache) && (
        <PrintableOrder
          ref={orderPrintRef}
          order={{
            id: sessionData?.id || null,
            userEmail: sessionData?.customer_email || user?.email || null,
            createdAt: new Date().toISOString(),
            currency: sessionData?.currency || 'MWK',
            totalAmount: Math.round(Number(sessionData?.amount || (checkoutCache?.items || []).reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0))),
            items: checkoutCache?.items || []
          }}
          plan={checkoutCache?.installmentPlan || null}
        />
      )}
      <Dialog open={pdfViewerOpen} onClose={() => { setPdfViewerOpen(false); if (pdfViewerUrl) { try { URL.revokeObjectURL(pdfViewerUrl); } catch {} setPdfViewerUrl(null); } }} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          PDF Preview
          <IconButton aria-label="close" onClick={() => { setPdfViewerOpen(false); if (pdfViewerUrl) { try { URL.revokeObjectURL(pdfViewerUrl); } catch {} setPdfViewerUrl(null); } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pdfViewerUrl ? (
            <iframe title="PDF" src={pdfViewerUrl} style={{ width: '100%', height: '80vh', border: 'none' }} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </SuccessContainer>
  );
};

export default PaymentSuccess;