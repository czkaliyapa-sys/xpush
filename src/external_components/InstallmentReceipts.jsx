import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import { installmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: 12,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white',
  '&:hover': {
    borderColor: 'rgba(72, 206, 219, 0.3)',
    boxShadow: '0 4px 20px rgba(72, 206, 219, 0.1)'
  },
  transition: 'all 0.3s ease'
}));

const InstallmentReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadReceipts();
    }
  }, [user?.uid]);

  const loadReceipts = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await installmentsAPI.listReceipts(user.uid);
      
      if (response?.success && Array.isArray(response.receipts)) {
        setReceipts(response.receipts);
      } else {
        setReceipts([]);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError('Failed to load receipts');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setDetailsOpen(true);
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      const response = await installmentsAPI.generateReceipt(receiptId);
      if (response?.success && response.pdfUrl) {
        // Open PDF in new tab
        window.open(response.pdfUrl, '_blank');
      } else {
        alert('Receipt PDF not available');
      }
    } catch (err) {
      console.error('Failed to download receipt:', err);
      alert('Failed to download receipt');
    }
  };

  const formatPrice = (amount, currency = 'MWK') => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#ff9800';
      case 'failed':
      case 'cancelled':
        return '#f44336';
      default:
        return '#48CEDB';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#48CEDB' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (receipts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <ReceiptIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          No Receipts Yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Your payment receipts will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 32, color: '#48CEDB' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          Payment Receipts
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {receipts.map((receipt) => (
          <Grid item xs={12} md={6} key={receipt.id}>
            <GlassCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                      Receipt #{receipt.id || receipt.reference}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>
                      {formatPrice(receipt.amount, receipt.currency)}
                    </Typography>
                  </Box>
                  <Chip
                    label={receipt.status || 'Paid'}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(receipt.status),
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
                    Product
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {receipt.product_name || receipt.gadget_name || 'Installment Payment'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
                    Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {formatDate(receipt.payment_date || receipt.created_at)}
                  </Typography>
                </Box>

                {receipt.payment_method && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
                      Payment Method
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', textTransform: 'capitalize' }}>
                      {receipt.payment_method}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewReceipt(receipt)}
                    sx={{
                      flex: 1,
                      color: '#48CEDB',
                      borderColor: 'rgba(72, 206, 219, 0.5)',
                      '&:hover': { borderColor: '#48CEDB', bgcolor: 'rgba(72, 206, 219, 0.1)' }
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReceipt(receipt.id)}
                    sx={{
                      flex: 1,
                      bgcolor: '#48CEDB',
                      color: '#0f172a',
                      '&:hover': { bgcolor: '#3ab9c7' }
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Receipt Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0d2137',
            color: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ color: '#48CEDB' }} />
            Receipt Details
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedReceipt && (
            <Box>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#48CEDB', fontWeight: 700 }}>
                  {formatPrice(selectedReceipt.amount, selectedReceipt.currency)}
                </Typography>
                <Chip
                  label={selectedReceipt.status || 'Paid'}
                  sx={{
                    mt: 1,
                    bgcolor: getStatusColor(selectedReceipt.status),
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Receipt ID
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    #{selectedReceipt.id || selectedReceipt.reference}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {formatDate(selectedReceipt.payment_date || selectedReceipt.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Product
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedReceipt.product_name || selectedReceipt.gadget_name || 'Installment Payment'}
                  </Typography>
                </Grid>
                {selectedReceipt.payment_method && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Payment Method
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, textTransform: 'capitalize' }}>
                      {selectedReceipt.payment_method}
                    </Typography>
                  </Grid>
                )}
                {selectedReceipt.transaction_id && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Transaction ID
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, wordBreak: 'break-all' }}>
                      {selectedReceipt.transaction_id}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button
            onClick={() => setDetailsOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => selectedReceipt && handleDownloadReceipt(selectedReceipt.id)}
            sx={{
              bgcolor: '#48CEDB',
              color: '#0f172a',
              '&:hover': { bgcolor: '#3ab9c7' }
            }}
          >
            Print / Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstallmentReceipts;
