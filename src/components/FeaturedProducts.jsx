import React from 'react';
import { formatMWK } from '../utils/formatters';
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
  Rating,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';

const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: theme.shadows[12],
    '& .product-actions': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

const ProductActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  opacity: 0,
  transform: 'translateY(-10px)',
  transition: 'all 0.3s ease-in-out',
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  width: 36,
  height: 36,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    transform: 'scale(1.1)'
  }
}));

const BadgeChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: 1,
  fontWeight: 'bold',
  fontSize: '0.75rem'
}));

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = React.useState(new Set());

  const featuredProducts = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      brand: 'Apple',
      price: 1199,
      originalPrice: 1299,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      rating: 4.9,
      reviews: 2847,
      condition: 'Brand New',
      badge: 'NEW',
      badgeColor: 'success',
      features: ['5G Ready', 'Pro Camera', 'Titanium Build'],
      inStock: true
    },
    {
      id: 2,
      title: 'MacBook Pro 16" M3',
      brand: 'Apple',
      price: 2299,
      originalPrice: 2499,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 1523,
      condition: 'Like New',
      badge: 'TRENDING',
      badgeColor: 'warning',
      features: ['M3 Chip', '18-hour Battery', 'Liquid Retina XDR'],
      inStock: true
    },
    {
      id: 3,
      title: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      price: 999,
      originalPrice: 1199,
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop',
      rating: 4.7,
      reviews: 1876,
      condition: 'Excellent',
      badge: 'HOT DEAL',
      badgeColor: 'error',
      features: ['S Pen Included', '200MP Camera', '5000mAh Battery'],
      inStock: true
    },
    {
      id: 4,
      title: 'Sony WH-1000XM5',
      brand: 'Sony',
      price: 329,
      originalPrice: 399,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 3421,
      condition: 'Very Good',
      badge: 'BESTSELLER',
      badgeColor: 'primary',
      features: ['30h Battery', 'Noise Cancelling', 'Quick Charge'],
      inStock: true
    },
    {
      id: 5,
      title: 'iPad Pro 12.9" M2',
      brand: 'Apple',
      price: 899,
      originalPrice: 1099,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
      rating: 4.9,
      reviews: 987,
      condition: 'Like New',
      badge: 'FEATURED',
      badgeColor: 'secondary',
      features: ['M2 Chip', 'Liquid Retina XDR', 'Apple Pencil Ready'],
      inStock: true
    },
    {
      id: 6,
      title: 'Nintendo Switch OLED',
      brand: 'Nintendo',
      price: 299,
      originalPrice: 349,
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
      rating: 4.6,
      reviews: 2156,
      condition: 'Good',
      badge: 'POPULAR',
      badgeColor: 'info',
      features: ['7" OLED Screen', 'Enhanced Audio', '64GB Storage'],
      inStock: true
    }
  ];

  const handleFavoriteToggle = (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const handleProductClick = (product) => {
    navigate(`/gadgets/${product.id}`);
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'NEW': return <NewReleasesIcon fontSize="small" />;
      case 'TRENDING': return <TrendingUpIcon fontSize="small" />;
      case 'BESTSELLER': return <StarIcon fontSize="small" />;
      default: return null;
    }
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
          ⭐ Featured Products
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Handpicked premium tech products with verified quality and great prices
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {featuredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <ProductCard>
              <Box position="relative">
                <BadgeChip 
                  icon={getBadgeIcon(product.badge)}
                  label={product.badge}
                  size="small"
                  color={product.badgeColor}
                />
                
                <ProductActions className="product-actions">
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(product.id);
                    }}
                    size="small"
                  >
                    {favorites.has(product.id) ? 
                      <FavoriteIcon fontSize="small" color="error" /> : 
                      <FavoriteBorderIcon fontSize="small" />
                    }
                  </ActionButton>
                  <ActionButton size="small">
                    <CompareArrowsIcon fontSize="small" />
                  </ActionButton>
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    size="small"
                  >
                    <VisibilityIcon fontSize="small" />
                  </ActionButton>
                </ProductActions>

                <CardMedia
                  component="img"
                  height="220"
                  image={product.image}
                  alt={product.title}
                  sx={{ 
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleProductClick(product)}
                />
              </Box>
              
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography 
                  variant="caption" 
                  color="primary.main" 
                  fontWeight="bold"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {product.brand}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  {product.title}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Rating value={product.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="caption" color="text.secondary">
                    ({product.reviews})
                  </Typography>
                </Stack>

                <Chip 
                  label={product.condition} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Box mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography 
                      variant="h6" 
                      color="primary.main" 
                      fontWeight="bold"
                    >
                      {formatMWK(product.price)}
                    </Typography>
                    {product.originalPrice > product.price && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatMWK(product.originalPrice)}
                      </Typography>
                    )}
                  </Stack>
                  
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {product.features.slice(0, 2).map((feature, index) => (
                      <Chip 
                        key={index}
                        label={feature} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleProductClick(product)}
                  sx={{ 
                    mt: 'auto',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </ProductCard>
          </Grid>
        ))}
      </Grid>

      <Box textAlign="center" mt={5}>
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
          View All Products
        </Button>
      </Box>
    </Container>
  );
};

export default FeaturedProducts;