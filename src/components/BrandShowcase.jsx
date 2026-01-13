import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Container,
  Avatar,
  Stack,
  Button,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const BrandCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  border: `2px solid transparent`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  }
}));

const BrandLogo = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  marginBottom: theme.spacing(2),
  backgroundColor: 'white',
  border: `3px solid ${theme.palette.grey[200]}`,
  '& img': {
    objectFit: 'contain',
    padding: theme.spacing(1)
  }
}));

const BrandShowcase = () => {
  const navigate = useNavigate();

  const brands = [
    {
      id: 1,
      name: 'Apple',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      productCount: 150,
      isVerified: true,
      isTrending: true,
      description: 'Premium smartphones, laptops & accessories',
      popularProducts: ['iPhone', 'MacBook', 'iPad']
    },
    {
      id: 2,
      name: 'Samsung',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
      productCount: 200,
      isVerified: true,
      isTrending: true,
      description: 'Innovative mobile devices & electronics',
      popularProducts: ['Galaxy S24', 'Galaxy Tab', 'Galaxy Watch']
    },
    {
      id: 3,
      name: 'Sony',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
      productCount: 120,
      isVerified: true,
      isTrending: false,
      description: 'Audio equipment & gaming consoles',
      popularProducts: ['PlayStation', 'WH-1000XM5', 'Camera']
    },
    {
      id: 4,
      name: 'Microsoft',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      productCount: 80,
      isVerified: true,
      isTrending: false,
      description: 'Surface devices & Xbox gaming',
      popularProducts: ['Surface Pro', 'Xbox', 'Surface Laptop']
    },
    {
      id: 5,
      name: 'Google',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      productCount: 60,
      isVerified: true,
      isTrending: true,
      description: 'Pixel phones & smart home devices',
      popularProducts: ['Pixel 8', 'Nest Hub', 'Pixel Buds']
    },
    {
      id: 6,
      name: 'Dell',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg',
      productCount: 90,
      isVerified: true,
      isTrending: false,
      description: 'Professional laptops & workstations',
      popularProducts: ['XPS 13', 'Alienware', 'OptiPlex']
    },
    {
      id: 7,
      name: 'HP',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg',
      productCount: 110,
      isVerified: true,
      isTrending: false,
      description: 'Laptops, printers & business solutions',
      popularProducts: ['Spectre x360', 'Pavilion', 'EliteBook']
    },
    {
      id: 8,
      name: 'Nintendo',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg',
      productCount: 45,
      isVerified: true,
      isTrending: true,
      description: 'Gaming consoles & accessories',
      popularProducts: ['Switch OLED', 'Pro Controller', 'Joy-Con']
    }
  ];

  const handleBrandClick = (brand) => {
    navigate('/gadgets', { state: { brand: brand.name } });
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
          🏆 Featured Brands
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Shop from the world's most trusted technology brands
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {brands.map((brand) => (
          <Grid item xs={12} sm={6} md={3} key={brand.id}>
            <BrandCard onClick={() => handleBrandClick(brand)}>
              <Box position="relative" mb={2}>
                <BrandLogo 
                  src={brand.logo} 
                  alt={brand.name}
                  variant="rounded"
                />
                {brand.isVerified && (
                  <VerifiedIcon 
                    color="primary" 
                    sx={{ 
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      fontSize: 20
                    }} 
                  />
                )}
              </Box>
              
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                {brand.name}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center"
                sx={{ mb: 2, minHeight: 40 }}
              >
                {brand.description}
              </Typography>

              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" justifyContent="center">
                {brand.isTrending && (
                  <Chip 
                    icon={<TrendingUpIcon />}
                    label="Trending" 
                    size="small" 
                    color="warning"
                    variant="outlined"
                  />
                )}
                {brand.isVerified && (
                  <Chip 
                    icon={<VerifiedIcon />}
                    label="Verified" 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Typography 
                variant="body2" 
                color="primary.main" 
                fontWeight="bold"
                textAlign="center"
                mb={2}
              >
                {brand.productCount}+ Products Available
              </Typography>

              <Box mb={2}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  textAlign="center"
                  display="block"
                  mb={1}
                >
                  Popular: {brand.popularProducts.join(', ')}
                </Typography>
              </Box>

              <Button 
                variant="outlined" 
                size="small"
                sx={{ 
                  mt: 'auto',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  minWidth: 120
                }}
              >
                Shop {brand.name}
              </Button>
            </BrandCard>
          </Grid>
        ))}
      </Grid>

      <Box textAlign="center" mt={5}>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          mb={3}
        >
          Can't find your favorite brand?
        </Typography>
        <Button 
          variant="contained" 
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
          Browse All Products
        </Button>
      </Box>
    </Container>
  );
};

export default BrandShowcase;