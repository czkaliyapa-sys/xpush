import React from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const CategoryCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: 280,
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12],
    '& .category-overlay': {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    '& .category-button': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
    }
  }
}));

const CategoryOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease-in-out',
  padding: theme.spacing(3),
}));

const ProductCategories = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      title: 'Gaming',
      key: 'gaming',
      description: 'Consoles, gaming laptops, and accessories',
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Explore gaming gear'
    },
    {
      id: 2,
      title: 'Smartphones',
      key: 'smartphone',
      description: 'Latest phones and mobile tech',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Top smartphones'
    },
    {
      id: 3,
      title: 'Laptops',
      key: 'laptop',
      description: 'Ultrabooks, workstations, and more',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Powerful laptops'
    },
    {
      id: 4,
      title: 'Tablets',
      key: 'tablet',
      description: 'Portable tablets for work and play',
      image: 'https://images.unsplash.com/photo-1510552776732-43a8a4f1a194?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Latest tablets'
    },
    {
      id: 5,
      title: 'Accessories',
      key: 'accessories',
      description: 'Chargers, cases, audio, and more',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Popular accessories'
    },
    {
      id: 6,
      title: 'Productivity',
      key: 'productivity',
      description: 'Work-ready devices and tools',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop',
      route: '/gadgets',
      count: 'Boost your workflow'
    }
  ];

  const handleCategoryClick = (category) => {
    navigate(category.route, { state: { category: category.key, categoryTitle: category.title } });
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
          Shop by Category
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Discover the latest tech gadgets and electronics across all categories
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <CategoryCard onClick={() => handleCategoryClick(category)}>
              <CardMedia
                component="img"
                height="280"
                image={category.image}
                alt={category.title}
                sx={{ objectFit: 'cover' }}
              />
              <CategoryOverlay className="category-overlay">
                <Typography 
                  variant="h5" 
                  component="h3" 
                  color="white" 
                  fontWeight="bold"
                  textAlign="center"
                  mb={1}
                >
                  {category.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="white" 
                  textAlign="center"
                  mb={2}
                  sx={{ opacity: 0.9 }}
                >
                  {category.description}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="white" 
                  mb={2}
                  sx={{ opacity: 0.8 }}
                >
                  {category.count}
                </Typography>
                <Button 
                  variant="outlined" 
                  className="category-button"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white'
                    }
                  }}
                >
                  Explore Now
                </Button>
              </CategoryOverlay>
            </CategoryCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductCategories;