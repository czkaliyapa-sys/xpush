import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Container,
  Stack,
  Avatar,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentIcon from '@mui/icons-material/Payment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${theme.palette.grey[200]}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  }
}));

const IconWrapper = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    fontSize: 30
  }
}));

const DeliveryOptions = () => {
  const deliveryFeatures = [
    {
      id: 1,
      icon: <LocalShippingIcon />,
      title: 'Free Delivery',
      description: 'Free delivery on orders over £40',
      details: 'Standard delivery 1-3 business days',
      color: 'primary'
    },
    {
      id: 2,
      icon: <FlashOnIcon />,
      title: 'Express Delivery',
      description: 'Next-day delivery available',
      details: 'Order before 2 PM for next-day delivery',
      color: 'warning'
    },
    {
      id: 3,
      icon: <TrackChangesIcon />,
      title: 'Real-time Tracking',
      description: 'Track your order every step',
      details: 'Live updates via SMS and email',
      color: 'info'
    },
    {
      id: 4,
      icon: <SecurityIcon />,
      title: 'Secure Packaging',
      description: 'Protected & insured delivery',
      details: 'Anti-static bags and bubble wrap',
      color: 'success'
    }
  ];

  const guarantees = [
    {
      id: 1,
      icon: <AssignmentReturnIcon />,
      title: '30-Day Returns',
      description: 'Easy returns within 30 days',
      highlight: 'No questions asked'
    },
    {
      id: 2,
      icon: <VerifiedUserIcon />,
      title: 'Quality Guarantee',
      description: 'All products tested & verified',
      highlight: '100% authentic'
    },
    {
      id: 3,
      icon: <PaymentIcon />,
      title: 'Secure Payment',
      description: 'Multiple payment options',
      highlight: 'SSL encrypted'
    },
    {
      id: 4,
      icon: <SupportAgentIcon />,
      title: '24/7 Support',
      description: 'Customer service always available',
      highlight: 'Live chat & phone'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Delivery Options Section */}
      <Box textAlign="center" mb={5}>
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          🚚 Delivery Options
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Fast, secure, and reliable delivery options for all your tech needs
        </Typography>
      </Box>

      <Grid container spacing={3} mb={6}>
        {deliveryFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.id}>
            <FeatureCard>
              <IconWrapper sx={{ bgcolor: `${feature.color}.main` }}>
                {feature.icon}
              </IconWrapper>
              
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                {feature.title}
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.primary" 
                textAlign="center"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {feature.description}
              </Typography>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center"
              >
                {feature.details}
              </Typography>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 6 }} />

      {/* Guarantees Section */}
      <Box textAlign="center" mb={5}>
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          🛡️ Our Guarantees
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Shop with confidence knowing you're protected every step of the way
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {guarantees.map((guarantee) => (
          <Grid item xs={12} sm={6} md={3} key={guarantee.id}>
            <FeatureCard>
              <IconWrapper sx={{ bgcolor: 'secondary.main' }}>
                {guarantee.icon}
              </IconWrapper>
              
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                {guarantee.title}
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.primary" 
                textAlign="center"
                sx={{ mb: 1 }}
              >
                {guarantee.description}
              </Typography>

              <Typography 
                variant="body2" 
                color="primary.main" 
                textAlign="center"
                sx={{ fontWeight: 'bold' }}
              >
                {guarantee.highlight}
              </Typography>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>

      {/* Additional Info */}
      <Box 
        sx={{ 
          mt: 6, 
          p: 4, 
          bgcolor: 'grey.50', 
          borderRadius: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Need Help with Your Order?
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          justifyContent="center"
          alignItems="center"
          mt={2}
        >
          <Box>
            <Typography variant="body1" fontWeight="bold">📞 Call Us</Typography>
            <Typography variant="body2" color="text.secondary">1-800-TECH-HELP</Typography>
          </Box>
          <Box>
            <Typography variant="body1" fontWeight="bold">💬 Live Chat</Typography>
            <Typography variant="body2" color="text.secondary">Available 24/7</Typography>
          </Box>
          <Box>
            <Typography variant="body1" fontWeight="bold">📧 Email</Typography>
            <Typography variant="body2" color="text.secondary">conrad@itsxtrapush.com</Typography>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
};

export default DeliveryOptions;