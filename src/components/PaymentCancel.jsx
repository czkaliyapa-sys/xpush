import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CancelIcon from '@mui/icons-material/Cancel';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CancelContainer = styled(Paper)(({ theme }) => ({
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

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleContinueShopping = () => {
    navigate('/gadgets');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <CancelContainer elevation={3}>
      <IconContainer>
        <CancelIcon 
          sx={{ 
            fontSize: 80, 
            color: 'warning.main' 
          }} 
        />
      </IconContainer>
      
      <Typography variant="h3" gutterBottom color="warning.main">
        Payment Cancelled
      </Typography>
      
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Your payment was not processed
      </Typography>
      
      <Alert severity="info" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="body1">
          No charges were made to your account. You can try again or continue browsing our products.
        </Typography>
      </Alert>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        If you experienced any issues during checkout, please contact our support team.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={handleGoBack}
          startIcon={<ArrowBackIcon />}
        >
          Go Back
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleGoHome}
          startIcon={<HomeIcon />}
        >
          Go to Home
        </Button>
        
        <Button
          variant="contained"
          onClick={handleContinueShopping}
          startIcon={<ShoppingBagIcon />}
        >
          Continue Shopping
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        Need help? Contact us at conrad@itsxtrapush.com
      </Typography>
    </CancelContainer>
  );
};

export default PaymentCancel;