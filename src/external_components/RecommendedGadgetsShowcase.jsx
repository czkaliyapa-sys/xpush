import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { usePricing } from '../hooks/usePricing';
import { gadgetsAPI } from '../services/api.js';

const RecommendedGadgetsShowcase = () => {
  const { formatLocalPrice, currency } = usePricing();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState(null);

  const getPriceForLocation = (gadget) => {
    if (!gadget) return 0;
    
    // Always get GBP price - formatLocalPrice will handle conversion
    const price = gadget?.price_gbp ?? gadget?.priceGbp ?? gadget?.price;
    return typeof price === 'string' ? Number(price.replace(/[^0-9.]/g, '')) : Number(price) || 0;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return `${currency} N/A`;
    const num = Number(amount);
    if (!Number.isFinite(num)) return `${currency} N/A`;
    // Use the hook's formatLocalPrice which handles currency conversion
    return formatLocalPrice(num);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🎯 [RecommendedGadgetsShowcase] Fetching featured gadgets from database...');
        
        const response = await gadgetsAPI.getAll({ limit: 12 });
        console.log('📦 [RecommendedGadgetsShowcase] API Response:', response);
        
        const gadgets = response?.data || [];
        console.log(`✅ [RecommendedGadgetsShowcase] Found ${gadgets.length} gadgets`);
        
        if (gadgets.length > 0) {
          console.log('🔍 [RecommendedGadgetsShowcase] Sample gadget:', gadgets[0]);
        }
        
        const sorted = gadgets
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 12);
        
        setRecommendations(sorted);
        console.log(`✨ [RecommendedGadgetsShowcase] Set ${sorted.length} recommendations`);
      } catch (error) {
        console.error('❌ [RecommendedGadgetsShowcase] Error fetching:', error);
        setError(error.message || 'Failed to load gadgets');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    const maxSlide = recommendations.length;
    setActiveSlide(prev => {
      const next = prev + newDirection;
      if (next < 0) return maxSlide - 1;
      if (next >= maxSlide) return 0;
      return next;
    });
  };

  const DashboardCard = ({ children, sx = {}, ...props }) => (
    <Card 
      sx={{ 
        bgcolor: 'rgba(5, 19, 35, 0.95)',
        border: '2px solid rgba(72, 206, 219, 0.3)',
        borderRadius: 3,
        height: '100%',
        transition: 'transform 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: 'rgba(72, 206, 219, 0.5)',
          transform: 'translateY(-2px)',
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        width: '100%',
        py: 6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '600px',
        bgcolor: 'rgba(5, 19, 35, 0.5)',
        borderRadius: 3,
        border: '1px solid rgba(72, 206, 219, 0.2)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#48cedb', mb: 2 }} size={60} thickness={4} />
          <Typography variant="h6" sx={{ color: 'white', fontFamily: 'Poppins, sans-serif', mt: 2 }}>
            Loading Featured Gadgets...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1 }}>
            Fetching from database
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardCard>
        <CardHeader 
          title="Featured Gadgets" 
          sx={{
            '& .MuiCardHeader-title': { 
              color: '#ff6b6b', 
              fontSize: '1.75rem', 
              fontWeight: 'bold',
              fontFamily: 'Poppins, sans-serif'
            }
          }}
        />
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'rgba(255, 107, 107, 0.3)', mb: 3 }} />
          <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2, fontFamily: 'Poppins, sans-serif' }}>
            Unable to Load Featured Gadgets
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: '#48cedb',
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#3aa6b8' }
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </DashboardCard>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    console.warn('⚠️ [RecommendedGadgetsShowcase] No recommendations to display');
    return (
      <DashboardCard>
        <CardHeader 
          title="Featured Gadgets" 
          subheader="Coming soon"
          sx={{
            '& .MuiCardHeader-title': { 
              color: '#48cedb', 
              fontSize: '1.75rem', 
              fontWeight: 'bold',
              fontFamily: 'Poppins, sans-serif'
            },
            '& .MuiCardHeader-subheader': { 
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'Poppins, sans-serif'
            }
          }}
        />
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'rgba(72, 206, 219, 0.3)', mb: 3 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
            No Featured Gadgets Yet
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3, px: 2 }}>
            We're updating our featured collection. Check back soon for amazing deals on the latest tech!
          </Typography>
          <Button
            variant="contained"
            href="/gadgets"
            sx={{
              bgcolor: '#48cedb',
              px: 5,
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              fontFamily: 'Poppins, sans-serif',
              '&:hover': { 
                bgcolor: '#3aa6b8'
              }
            }}
          >
            Browse All Gadgets
          </Button>
        </CardContent>
      </DashboardCard>
    );
  }

  console.log(`🎨 [RecommendedGadgetsShowcase] Rendering carousel with ${recommendations.length} items`);

  // Main carousel render
  return (
    <DashboardCard sx={{ overflow: 'hidden' }}>
      <CardHeader 
        title="Featured Gadgets" 
        subheader="Discover our most popular products"
        sx={{
          '& .MuiCardHeader-title': { 
            color: '#48cedb', 
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 'bold',
            fontFamily: 'Poppins, sans-serif'
          },
          '& .MuiCardHeader-subheader': { 
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: 'Poppins, sans-serif'
          }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => paginate(-1)}
              sx={{ 
                color: '#48cedb',
                bgcolor: 'rgba(72, 206, 219, 0.1)',
                border: '1px solid rgba(72, 206, 219, 0.3)',
                '&:hover': { 
                  bgcolor: 'rgba(72, 206, 219, 0.2)',
                  borderColor: 'rgba(72, 206, 219, 0.5)'
                }
              }}
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => paginate(1)}
              sx={{ 
                color: '#48cedb',
                bgcolor: 'rgba(72, 206, 219, 0.1)',
                border: '1px solid rgba(72, 206, 219, 0.3)',
                '&:hover': { 
                  bgcolor: 'rgba(72, 206, 219, 0.2)',
                  borderColor: 'rgba(72, 206, 219, 0.5)'
                }
              }}
            >
              <KeyboardArrowRightIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent sx={{ pb: 6, position: 'relative', height: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence initial={false} custom={1} mode="wait">
            <motion.div
              key={activeSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
                rotateY: { duration: 0.5 }
              }}
              drag="x"
              dragElastic={0.2}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: { xs: 2, md: 4 },
                  textAlign: 'center'
                }}
              >
                {/* Product Image - Smaller, glow ONLY on image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ 
                    delay: 0.1, 
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: 5,
                    transition: { duration: 0.3 }
                  }}
                  style={{
                    marginBottom: '2rem',
                    perspective: '1000px'
                  }}
                >
                  <img
                    src={recommendations[activeSlide]?.image || '/placeholder.jpg'}
                    alt={recommendations[activeSlide]?.name}
                    style={{
                      width: '350px',
                      height: '350px',
                      objectFit: 'contain',
                      borderRadius: '16px',
                      filter: 'drop-shadow(0 15px 40px rgba(72, 206, 219, 0.3))'
                    }}
                  />
                </motion.div>

                {/* Product Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }}
                  >
                    {recommendations[activeSlide]?.name}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#48cedb', 
                      mb: 3,
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    {recommendations[activeSlide]?.brand}
                  </Typography>

                  {/* Single Action Button - NO GLOW */}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => window.location.href = `/gadgets/${recommendations[activeSlide]?.id}`}
                    sx={{
                      bgcolor: '#48cedb',
                      color: 'white',
                      px: 5,
                      py: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      borderRadius: 2,
                      fontFamily: 'Poppins, sans-serif',
                      transition: 'all 0.3s ease',
                      mb: 2,
                      '&:hover': {
                        bgcolor: '#3aa6b8',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Explore Details & Options
                  </Button>
                </motion.div>

                {/* Slide Counter */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ marginTop: '1.5rem' }}
                >
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Poppins, sans-serif' }}>
                    {activeSlide + 1} / {recommendations.length}
                  </Typography>
                </motion.div>

                {/* Dot Indicators - NO GLOW */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  {recommendations.slice(0, 10).map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        width: activeSlide === index ? '40px' : '14px',
                        height: '14px',
                        borderRadius: '7px',
                        backgroundColor: activeSlide === index ? '#48cedb' : 'rgba(255, 255, 255, 0.3)',
                        border: activeSlide === index ? '2px solid #48cedb' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </motion.div>
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </CardContent>
    </DashboardCard>
  );
};

export default RecommendedGadgetsShowcase;