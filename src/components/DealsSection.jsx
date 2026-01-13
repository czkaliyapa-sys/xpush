import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  Container,
  Chip,
  Stack,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const DealCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  }
}));

const DiscountBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: 1,
  backgroundColor: theme.palette.error.main,
  color: 'white',
  fontWeight: 'bold',
  '& .MuiChip-icon': {
    color: 'white'
  }
}));

const FlashDealBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 1,
  backgroundColor: theme.palette.warning.main,
  color: 'white',
  fontWeight: 'bold',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.05)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  '& .MuiChip-icon': {
    color: 'white'
  }
}));

const DealsSection = () => {
  const navigate = useNavigate();

  const deals = [
    {
      id: 1,
      title: 'iPhone 14 Pro Max',
      description: 'Latest flagship with Pro camera system',
      originalPrice: 1199,
      salePrice: 999,
      discount: 17,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 1250,
      isFlashDeal: true,
      timeLeft: '2h 15m',
      condition: 'Like New'
    },
    {
      id: 2,
      title: 'MacBook Air M2',
      description: 'Powerful performance in a thin design',
      originalPrice: 1299,
      salePrice: 1099,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
      rating: 4.9,
      reviews: 890,
      isFlashDeal: false,
      condition: 'Excellent'
    },
    {
      id: 3,
      title: 'Sony WH-1000XM5',
      description: 'Industry-leading noise cancellation',
      originalPrice: 399,
      salePrice: 299,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
      rating: 4.7,
      reviews: 2100,
      isFlashDeal: true,
      timeLeft: '5h 42m',
      condition: 'Very Good'
    },
    {
      id: 4,
      title: 'iPad Pro 12.9"',
      description: 'Ultimate iPad experience with M2 chip',
      originalPrice: 1099,
      salePrice: 899,
      discount: 18,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 756,
      isFlashDeal: false,
      condition: 'Like New'
    }
  ];

  const handleDealClick = (deal) => {
    navigate(`/gadgets/${deal.id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
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
          🔥 Hot Deals & Flash Sales
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Limited time offers on premium tech gadgets - Don't miss out!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {deals.map((deal) => (
          <Grid item xs={12} sm={6} md={3} key={deal.id}>
            <DealCard onClick={() => handleDealClick(deal)} sx={{ cursor: 'pointer' }}>
              <Box position="relative">
                <DiscountBadge 
                  icon={<LocalOfferIcon />}
                  label={`${deal.discount}% OFF`}
                  size="small"
                />
                {deal.isFlashDeal && (
                  <FlashDealBadge 
                    icon={<FlashOnIcon />}
                    label="FLASH"
                    size="small"
                  />
                )}
                <CardMedia
                  component="img"
                  height="200"
                  image={deal.image}
                  alt={deal.title}
                  sx={{ objectFit: 'cover' }}
                />
              </Box>
              
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    lineHeight: 1.3
                  }}
                >
                  {deal.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2 }}
                >
                  {deal.description}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Rating value={deal.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="caption" color="text.secondary">
                    ({deal.reviews})
                  </Typography>
                </Stack>

                <Chip 
                  label={deal.condition} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Box mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography 
                      variant="h6" 
                      color="primary.main" 
                      fontWeight="bold"
                    >
                      ${deal.salePrice}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      ${deal.originalPrice}
                    </Typography>
                  </Stack>
                </Box>

                {deal.isFlashDeal && deal.timeLeft && (
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={2}>
                    <AccessTimeIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="warning.main" fontWeight="bold">
                      Ends in {deal.timeLeft}
                    </Typography>
                  </Stack>
                )}

                <Button 
                  variant="contained" 
                  fullWidth
                  sx={{ 
                    mt: 'auto',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  View Deal
                </Button>
              </CardContent>
            </DealCard>
          </Grid>
        ))}
      </Grid>

      <Box textAlign="center" mt={4}>
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => navigate('/gadgets')}
          sx={{ 
            borderRadius: 3,
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          View All Deals
        </Button>
      </Box>
    </Container>
  );
};

export default DealsSection;