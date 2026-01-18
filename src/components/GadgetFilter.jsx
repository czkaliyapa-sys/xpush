import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Slider,
  Button,
  Chip,
  FormControl,
  Radio,
  RadioGroup,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Rating,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import VerifiedIcon from '@mui/icons-material/Verified';
// Removed unused icons related to Special Features
import { gadgetsAPI } from '../services/api.js';
import { formatPriceByLocation, formatPriceByLocationCompact } from '../utils/formatters.js';
import { useLocation } from '../contexts/LocationContext';

const GadgetFilter = ({ onFiltersChange, currentFilters = {}, isMobile = false, maxPrice = 2000000, currency: propCurrency }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [loading, setLoading] = useState(true);
  const prevMaxRef = useRef(maxPrice);
  
  // Get user's currency from location context
  const { location, isMalawi } = useLocation();
  const currency = propCurrency || location?.currency || 'GBP';
  const currencySymbol = currency === 'MWK' ? 'MWK ' : '£';
  
  // Currency-aware formatting helpers
  const formatPriceDisplay = (value) => formatPriceByLocation(value, currency);
  const formatPriceCompact = (value) => formatPriceByLocationCompact(value, currency);
  
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expandedPanels, setExpandedPanels] = useState({
    category: false,
    brand: false,
    price: false,
    stock: false,
    condition: false
  });
  
  // Debounce timer for price slider
  const priceDebounceTimer = useRef(null);
  
  // Track previous slider values for proper thumb separation
  const prevSliderValues = useRef([0, maxPrice]);

  // Map friendly condition labels to backend enum tokens
  const CONDITION_LABEL_TO_TOKEN = {
    'New': 'new',
    'Like New': 'like_new',
    // Backwards-compatible synonyms (if ever present)
    'Excellent': 'like_new',
    'Very Good': 'good',
    'Good': 'good',
    'Fair': 'fair'
  };
  const CONDITION_OPTIONS = ['New', 'Like New', 'Good', 'Fair'];
  const CONDITION_ALLOWED_TOKENS = new Set(['new', 'like_new', 'good', 'fair']);

  // Internal filter state with enhanced eBay/BackMarket features
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    priceMin: 0,
    priceMax: maxPrice,
    inStock: null, // Default to show all products (in-stock + out-of-stock)
    condition: [], // Product condition (mapped to backend tokens on apply)
    warranty: [], // New: Warranty options (1 year, 2 years, etc.)
    rating: 0, // New: Minimum rating filter
    sortBy: 'newest', // New: Sort options (default to Newest)
    ...currentFilters
  });

  // Update price range and filters when maxPrice changes significantly (e.g., after data fetch)
  // Only adjust if there's a substantial change that indicates new data, not user interaction
  useEffect(() => {
    const prevMax = prevMaxRef.current;
    const significantChangeThreshold = 100; // Only adjust if change is more than 100 units
    
    // Only proceed if maxPrice changed substantially (indicating new data load)
    if (Math.abs(maxPrice - prevMax) < significantChangeThreshold) {
      prevMaxRef.current = maxPrice;
      return;
    }

    // If the previous selection was at the old max, expand to the new max;
    // otherwise, preserve the user's lower max selection while clamping to bounds.
    setFilters(prev => {
      const nextMin = Math.max(0, Math.min(prev.priceMin, maxPrice));
      const nextMax = (maxPrice > prevMax && prev.priceMax === prevMax)
        ? maxPrice
        : Math.max(nextMin, Math.min(prev.priceMax, maxPrice));
      return { ...prev, priceMin: nextMin, priceMax: nextMax };
    });

    setPriceRange(prev => {
      const nextMin = Math.max(0, Math.min(prev[0], maxPrice));
      const prevUpper = prev[1];
      const nextUpper = (maxPrice > prevMax && prevUpper === prevMax)
        ? maxPrice
        : Math.max(nextMin, Math.min(prevUpper, maxPrice));
      return [nextMin, nextUpper];
    });

    prevMaxRef.current = maxPrice;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice]);

  // Monitor price range changes for debugging
  useEffect(() => {
    // console.log('Price range updated:', priceRange);
    // console.log('Filters updated:', filters.priceMin, filters.priceMax);
  }, [priceRange, filters.priceMin, filters.priceMax]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (priceDebounceTimer.current) {
        clearTimeout(priceDebounceTimer.current);
      }
    };
  }, []);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        
        const [categoriesResponse, brandsResponse] = await Promise.all([
          gadgetsAPI.getCategories(),
          gadgetsAPI.getBrands()
        ]);

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }

        if (brandsResponse.success) {
          setBrands(brandsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Handle panel expansion
  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  // Handle category filter
  const handleCategoryChange = (categorySlug) => {
    const newCategories = filters.categories.includes(categorySlug)
      ? filters.categories.filter(c => c !== categorySlug)
      : [...filters.categories, categorySlug];
    
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Handle brand filter
  const handleBrandChange = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    
    const newFilters = { ...filters, brands: newBrands };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Handle price range change with debouncing and proper validation
  const handlePriceChange = (event, newValue) => {
    // Validate that min <= max with proper thumb separation
    let [newMin, newMax] = newValue;
    
    // Store current values for next comparison
    const [prevMin, prevMax] = prevSliderValues.current;
    
    // Ensure min doesn't exceed max - but maintain proper separation
    if (newMin > newMax) {
      // Instead of forcing min = max, swap them to maintain logical order
      [newMin, newMax] = [newMax, newMin];
    }
    
    // Ensure values stay within bounds
    newMin = Math.max(0, Math.min(newMin, maxPrice));
    newMax = Math.max(0, Math.min(newMax, maxPrice));
    
    // Maintain minimum separation between thumbs (at least 1 step)
    const minSeparation = 1;
    if (newMax - newMin < minSeparation) {
      // Determine which thumb was actively moved by comparing to previous values
      const minChanged = newMin !== prevMin;
      const maxChanged = newMax !== prevMax;
      
      if (minChanged && !maxChanged) {
        // Only min thumb was moved - adjust max to maintain separation
        newMax = Math.min(newMin + minSeparation, maxPrice);
      } else if (maxChanged && !minChanged) {
        // Only max thumb was moved - adjust min to maintain separation
        newMin = Math.max(newMax - minSeparation, 0);
      } else {
        // Both changed or neither changed significantly - favor the one with larger movement
        const minDelta = Math.abs(newMin - prevMin);
        const maxDelta = Math.abs(newMax - prevMax);
        
        if (minDelta > maxDelta) {
          // Min had larger movement, adjust max
          newMax = Math.min(newMin + minSeparation, maxPrice);
        } else {
          // Max had larger movement or equal, adjust min
          newMin = Math.max(newMax - minSeparation, 0);
        }
      }
    }
    
    const validatedValue = [newMin, newMax];
    
    const newFilters = { 
      ...filters, 
      priceMin: newMin, 
      priceMax: newMax 
    };
    
    // Update both states synchronously
    setFilters(newFilters);
    setPriceRange(validatedValue);
    
    // Update previous values reference
    prevSliderValues.current = validatedValue;
    
    // Clear existing timer
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current);
    }
    
    // Set new timer to apply filters after 300ms of inactivity
    priceDebounceTimer.current = setTimeout(() => {
      applyFilters(newFilters);
    }, 300);
  };

  // Apply price filter (on mouseup to avoid too many API calls) with improved validation
  const handlePriceCommit = (event, newValue) => {
    // Clear any pending debounced calls
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current);
      priceDebounceTimer.current = null;
    }
    
    // Validate values with proper thumb separation
    let [commitMin, commitMax] = newValue;
    
    // Use same logic as handlePriceChange for consistency
    const [prevMin, prevMax] = prevSliderValues.current;
    
    // Ensure min <= max with proper separation
    if (commitMin > commitMax) {
      // Swap to maintain logical order instead of forcing equality
      [commitMin, commitMax] = [commitMax, commitMin];
    }
    
    // Ensure values stay within bounds
    commitMin = Math.max(0, Math.min(commitMin, maxPrice));
    commitMax = Math.max(0, Math.min(commitMax, maxPrice));
    
    // Maintain minimum separation between thumbs
    const minSeparation = 1;
    if (commitMax - commitMin < minSeparation) {
      // Determine which thumb was actively moved
      const minChanged = commitMin !== prevMin;
      const maxChanged = commitMax !== prevMax;
      
      if (minChanged && !maxChanged) {
        commitMax = Math.min(commitMin + minSeparation, maxPrice);
      } else if (maxChanged && !minChanged) {
        commitMin = Math.max(commitMax - minSeparation, 0);
      } else {
        const minDelta = Math.abs(commitMin - prevMin);
        const maxDelta = Math.abs(commitMax - prevMax);
        
        if (minDelta > maxDelta) {
          commitMax = Math.min(commitMin + minSeparation, maxPrice);
        } else {
          commitMin = Math.max(commitMax - minSeparation, 0);
        }
      }
    }
    
    const newFilters = { 
      ...filters, 
      priceMin: commitMin, 
      priceMax: commitMax 
    };
    
    // Ensure UI stays in sync
    const finalValues = [commitMin, commitMax];
    setPriceRange(finalValues);
    setFilters(newFilters);
    prevSliderValues.current = finalValues;
    
    applyFilters(newFilters);
  };

  // Handle stock filter
  const handleStockChange = (event) => {
    const value = event.target.value;
    const stockValue = value === 'all' ? null : value === 'inStock';
    const newFilters = { ...filters, inStock: stockValue };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Enhanced filter handlers inspired by eBay/BackMarket
  const handleConditionChange = (condition) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter(c => c !== condition)
      : [...filters.condition, condition];
    
    const newFilters = { ...filters, condition: newConditions };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleWarrantyChange = (warranty) => {
    const newWarranties = filters.warranty.includes(warranty)
      ? filters.warranty.filter(w => w !== warranty)
      : [...filters.warranty, warranty];
    
    const newFilters = { ...filters, warranty: newWarranties };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Removed toggle handler used only for Special Features

  const handleRatingChange = (event, newValue) => {
    const newFilters = { ...filters, rating: newValue };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleSortChange = (event) => {
    const newFilters = { ...filters, sortBy: event.target.value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Apply filters with enhanced eBay/BackMarket features
  const applyFilters = (filterData) => {
    const apiFilters = {};
    
    if (filterData.categories.length > 0) {
      apiFilters.category = filterData.categories[0]; // API expects slug
    }
    
    if (filterData.brands.length > 0) {
      apiFilters.brand = filterData.brands[0]; // API supports single brand
    }
    
    // Always send price filters to ensure proper range filtering
    apiFilters.minPrice = filterData.priceMin;
    apiFilters.maxPrice = filterData.priceMax;
    
    // Pass currency to ensure API filters by correct price column
    apiFilters.currency = currency;
    
    if (filterData.inStock !== null) {
      apiFilters.inStock = filterData.inStock ? 1 : 0;
    }

    // Enhanced filters
    if (filterData.condition.length > 0) {
      // Map UI labels to backend enum tokens, dedupe, and exclude disallowed values
      const tokens = Array.from(new Set(filterData.condition.map((c) => CONDITION_LABEL_TO_TOKEN[c] || c)))
        .filter((t) => CONDITION_ALLOWED_TOKENS.has(t));
      if (tokens.length > 0) {
        apiFilters.condition = tokens;
      }
    }
    
    if (filterData.warranty.length > 0) {
      apiFilters.warranty = filterData.warranty;
    }
    
    if (filterData.rating > 0) {
      apiFilters.minRating = filterData.rating;
    }
    
    // Always pass sortBy to ensure consistent local sorting
    if (filterData.sortBy) {
      apiFilters.sortBy = filterData.sortBy;
    }

    onFiltersChange(apiFilters);
  };

  // Keep UI checkboxes in sync when currentFilters (tokens) change externally
  useEffect(() => {
    if (currentFilters && Array.isArray(currentFilters.condition)) {
      const filteredTokens = currentFilters.condition.filter((t) => CONDITION_ALLOWED_TOKENS.has(t));
      const labels = filteredTokens.map((token) => {
        const entry = Object.entries(CONDITION_LABEL_TO_TOKEN).find(([, t]) => t === token);
        return entry ? entry[0] : null;
      }).filter(Boolean);
      setFilters((prev) => ({ ...prev, condition: labels }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters?.condition]);

  // Clear all filters including enhanced ones
  const clearAllFilters = () => {
    const clearedFilters = {
      categories: [],
      brands: [],
      priceMin: 0,
      priceMax: maxPrice,
      inStock: null,
      condition: [],
      warranty: [],
      rating: 0,
      sortBy: 'newest',
    };
    setFilters(clearedFilters);
    setPriceRange([0, maxPrice]);
    onFiltersChange({});
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.priceMin > 0 || filters.priceMax < maxPrice) count++;
    if (filters.inStock !== null) count++;
    if (filters.condition.length > 0) count++;
    return count;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#051323', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <CircularProgress size={24} sx={{ color: 'white' }} />
          <Typography sx={{ ml: 2, color: 'white' }}>Loading filters...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: isMobile ? 1 : 2, 
      mb: 2,
      width: '100%',
      bgcolor: '#051323',
      color: 'white',
      ...(isMobile && {
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none'
      })
    }}>
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between" 
        mb={isMobile ? 1 : 2}
        flexWrap={isSmallMobile ? 'wrap' : 'nowrap'}
        gap={1}
      >
        <Box display="flex" alignItems="center" minWidth={0} flex={1}>
          <FilterListIcon sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem', color: 'white' }} />
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ fontWeight: 600, color: 'white' }}
          >
            Filters
          </Typography>
          {getActiveFilterCount() > 0 && (
            <Chip 
              label={getActiveFilterCount()} 
              size="small" 
              color="primary" 
              sx={{ ml: 1 }} 
            />
          )}
        </Box>
        
        {getActiveFilterCount() > 0 && (
          <Button
            startIcon={!isSmallMobile ? <ClearIcon /> : null}
            onClick={clearAllFilters}
            size="small"
            sx={{
              minWidth: isSmallMobile ? 'auto' : 'unset',
              px: isSmallMobile ? 1 : 2,
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            variant="outlined"
          >
            {isSmallMobile ? <ClearIcon /> : 'Clear'}
          </Button>
        )}
      </Box>

      {/* Category Filter */}
      <Accordion 
        expanded={expandedPanels.category} 
        onChange={handlePanelChange('category')}
        elevation={0}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mb: 0.5,
          bgcolor: 'transparent',
          color: 'white'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 0.5 : 1,
            minHeight: isMobile ? 40 : 48,
            bgcolor: 'transparent'
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              Category
            </Typography>
            {filters.categories.length > 0 && (
              <Chip 
                label={filters.categories.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isMobile ? 0.5 : 2, py: isMobile ? 1 : 1.5 }}>
          <Box sx={{ maxHeight: isMobile ? 200 : 'none', overflowY: 'auto' }}>
            {categories.map((category) => (
              <FormControlLabel
                key={category.slug || category.name}
                control={
                  <Checkbox
                    checked={filters.categories.includes(category.slug || category.name)}
                    onChange={() => handleCategoryChange(category.slug || category.name)}
                    size="small"
                    sx={{ 
                      py: isMobile ? 0.5 : 1,
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white'
                      }
                    }}
                  />
                }
                label={
                  <Box display="flex" justifyContent="space-between" width="100%" pr={1}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      sx={{ 
                        textTransform: 'capitalize',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'white'
                      }}
                    >
                      {category.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      ({category.count})
                    </Typography>
                  </Box>
                }
                sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  m: 0,
                  py: isMobile ? 0.25 : 0.5
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: isMobile ? 0.5 : 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Brand Filter */}
      <Accordion 
        expanded={expandedPanels.brand} 
        onChange={handlePanelChange('brand')}
        elevation={0}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mb: 0.5,
          bgcolor: 'transparent',
          color: 'white'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 0.5 : 1,
            minHeight: isMobile ? 40 : 48,
            bgcolor: 'transparent'
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              Brand
            </Typography>
            {filters.brands.length > 0 && (
              <Chip 
                label={filters.brands.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isMobile ? 0.5 : 2, py: isMobile ? 1 : 1.5 }}>
          <Box sx={{ maxHeight: isMobile ? 200 : 'none', overflowY: 'auto' }}>
            {brands.map((brand) => (
              <FormControlLabel
                key={brand.name}
                control={
                  <Checkbox
                    checked={filters.brands.includes(brand.name)}
                    onChange={() => handleBrandChange(brand.name)}
                    size="small"
                    sx={{ 
                      py: isMobile ? 0.5 : 1,
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white'
                      }
                    }}
                  />
                }
                label={
                  <Box display="flex" justifyContent="space-between" width="100%" pr={1}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"}
                      sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'white'
                      }}
                    >
                      {brand.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      ({brand.count})
                    </Typography>
                  </Box>
                }
                sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  m: 0,
                  py: isMobile ? 0.25 : 0.5
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: isMobile ? 0.5 : 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Price Range Filter */}
      <Accordion 
        expanded={expandedPanels.price} 
        onChange={handlePanelChange('price')}
        elevation={0}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mb: 0.5,
          bgcolor: 'transparent',
          color: 'white'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 0.5 : 1,
            minHeight: isMobile ? 40 : 48,
            bgcolor: 'transparent'
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              Price Range
            </Typography>
            {(filters.priceMin > 0 || filters.priceMax < maxPrice) && (
              <Chip 
                label={`${formatPriceCompact(filters.priceMin)} - ${filters.priceMax >= maxPrice ? formatPriceCompact(maxPrice) + '+' : formatPriceCompact(filters.priceMax)}`} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isMobile ? 1 : 2, py: isMobile ? 1 : 1.5 }}>
          <Box sx={{ px: isMobile ? 0 : 1 }}>
            {(() => {
              // Dynamic marks and step based on currency
              const isMWK = currency === 'MWK';
              const step = isMWK ? 50000 : 1; // MWK uses larger steps, GBP uses £1 steps for smoother dragging
              const midPoint = Math.round(maxPrice / 2);
              
              const marks = isMWK 
                ? (maxPrice >= 1000000
                    ? [
                        { value: 0, label: `${currencySymbol} 0` },
                        { value: 1000000, label: `${currencySymbol} 1M` },
                        { value: maxPrice, label: formatPriceCompact(maxPrice) + '+' }
                      ]
                    : [
                        { value: 0, label: `${currencySymbol} 0` },
                        { value: midPoint, label: formatPriceCompact(midPoint) },
                        { value: maxPrice, label: formatPriceCompact(maxPrice) }
                      ])
                : [
                    { value: 0, label: `${currencySymbol}0` },
                    { value: midPoint, label: formatPriceCompact(midPoint) },
                    { value: maxPrice, label: formatPriceCompact(maxPrice) }
                  ];
              return (
                <Slider
                  value={priceRange}
                  onChange={handlePriceChange}
                  onChangeCommitted={handlePriceCommit}
                  valueLabelDisplay="auto"
                  min={0}
                  max={maxPrice}
                  step={step}
                  marks={marks}
                  valueLabelFormat={(value) => formatPriceCompact(value)}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      color: 'white'
                    },
                    '& .MuiSlider-valueLabel': {
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    },
                    '& .MuiSlider-thumb': {
                      color: 'white'
                    },
                    '& .MuiSlider-track': {
                      color: 'white'
                    },
                    '& .MuiSlider-rail': {
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                />
              );
            })()}
            <Box display="flex" justifyContent="space-between" mt={isMobile ? 0.5 : 1}>
              <Typography 
                variant="caption"
                sx={{ 
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'white'
                }}
              >
                Min: {formatPriceDisplay(priceRange[0])}
              </Typography>
              <Typography 
                variant="caption"
                sx={{ 
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'white'
                }}
              >
                Max: {formatPriceDisplay(priceRange[1])}
              </Typography>
            </Box
            >
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: isMobile ? 0.5 : 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Stock Status Filter */}
      <Accordion 
        expanded={expandedPanels.stock} 
        onChange={handlePanelChange('stock')}
        elevation={0}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mb: 0.5,
          bgcolor: 'transparent',
          color: 'white'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 0.5 : 1,
            minHeight: isMobile ? 40 : 48,
            bgcolor: 'transparent'
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              Availability
            </Typography>
            {filters.inStock !== null && (
              <Chip 
                label={filters.inStock ? 'In Stock' : 'Out of Stock'} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isMobile ? 0.5 : 2, py: isMobile ? 1 : 1.5 }}>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              value={filters.inStock === null ? 'all' : filters.inStock ? 'inStock' : 'outOfStock'}
              onChange={handleStockChange}
              sx={{ gap: isMobile ? 0 : 0.5 }}
            >
              <FormControlLabel 
                value="all" 
                control={<Radio size="small" sx={{ 
                  py: isMobile ? 0.5 : 1,
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'white'
                  }
                }} />} 
                label={
                  <Typography 
                    variant={isMobile ? "caption" : "body2"}
                    sx={{ 
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: 'white'
                    }}
                  >
                    All Products
                  </Typography>
                }
                sx={{ py: isMobile ? 0.25 : 0.5 }}
              />
              <FormControlLabel 
                value="inStock" 
                control={<Radio size="small" sx={{ 
                  py: isMobile ? 0.5 : 1,
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'white'
                  }
                }} />} 
                label={
                  <Typography 
                    variant={isMobile ? "caption" : "body2"}
                    sx={{ 
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: 'white'
                    }}
                  >
                    In Stock Only
                  </Typography>
                }
                sx={{ py: isMobile ? 0.25 : 0.5 }}
              />
              <FormControlLabel 
                value="outOfStock" 
                control={<Radio size="small" sx={{ 
                  py: isMobile ? 0.5 : 1,
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'white'
                  }
                }} />} 
                label={
                  <Typography 
                    variant={isMobile ? "caption" : "body2"}
                    sx={{ 
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: 'white'
                    }}
                  >
                    Out of Stock
                  </Typography>
                }
                sx={{ py: isMobile ? 0.25 : 0.5 }}
              />
            </RadioGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: isMobile ? 0.5 : 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Enhanced Filters - Product Condition */}
      <Accordion 
        expanded={expandedPanels.condition} 
        onChange={handlePanelChange('condition')}
        elevation={0}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mb: 0.5,
          bgcolor: 'transparent',
          color: 'white'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 0.5 : 1,
            minHeight: isMobile ? 40 : 48,
            bgcolor: 'transparent'
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <VerifiedIcon sx={{ mr: 1, fontSize: '1rem', color: 'white' }} />
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              Condition
            </Typography>
            {filters.condition.length > 0 && (
              <Chip 
                label={filters.condition.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isMobile ? 0.5 : 2, py: isMobile ? 1 : 1.5 }}>
          <Box sx={{ maxHeight: isMobile ? 200 : 'none', overflowY: 'auto', overflowX: 'hidden' }}>
            {CONDITION_OPTIONS.map((condition) => (
              <FormControlLabel
                key={condition}
                control={
                  <Checkbox
                    checked={filters.condition.includes(condition)}
                    onChange={() => handleConditionChange(condition)}
                    size="small"
                    sx={{
                      py: isMobile ? 0.5 : 1,
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white'
                      }
                    }}
                  />
                }
                label={
                  <Typography 
                    variant={isMobile ? "caption" : "body2"}
                    sx={{ 
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: 'white'
                    }}
                  >
                    {condition}
                  </Typography>
                }
                sx={{ 
                  display: 'flex',
                  width: '100%',
                  py: isMobile ? 0.25 : 0.5
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: isMobile ? 0.5 : 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Special Features section removed */}

      {/* Sort Options */}
      <Box sx={{ px: isMobile ? 0.5 : 2, py: isMobile ? 1 : 1.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: 'white' }}>Sort By</InputLabel>
          <Select
            value={filters.sortBy}
            onChange={handleSortChange}
            label="Sort By"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '& .MuiSvgIcon-root': {
                color: 'white',
              },
            }}
          >
            <MenuItem value="price_low">Price: Low to High</MenuItem>
            <MenuItem value="price_high">Price: High to Low</MenuItem>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="rating">Highest Rated</MenuItem>
            <MenuItem value="condition">Best Condition</MenuItem>
          </Select>
        </FormControl>
      </Box>

    </Paper>
  );
};

export default GadgetFilter;
