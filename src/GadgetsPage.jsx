import styles from "./style";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { motion } from 'framer-motion';
import { Link, useLocation, useParams } from "react-router-dom";

import SearchBar from "./external_components/SearchBar.jsx";
import GadgetFilter from "./components/GadgetFilter.jsx";
import { LazyLoadGadgetCard } from "./components/LazyLoadImage.jsx";
import SEOMeta from "./components/SEOMeta.jsx";
import { gadgetsAPI } from "./services/api.js";
import { 
  generateCategoryTitle, 
  generateCategoryDescription, 
  generateBreadcrumbData,
  getCanonicalUrl,
  CATEGORY_META
} from "./utils/seoUtils.js";
import { useLocation as useLocationContext } from "./contexts/LocationContext";
import { CircularProgress, Alert, Box, Typography, Drawer, IconButton, Button, useTheme, useMediaQuery } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

const ItemCard3D = React.lazy(() => import('./external_components/ItemCard3D.tsx'));




 

const GadgetsPage = ({ category: propCategory }) => {
  // Quick-return cache to avoid white flashes on back navigation
  const CACHE_KEY = 'gadgets_cache_v1';
  const [activeTitle, setActiveTitle] = useState('Gadgets');
  const [toggle, setToggle] = useState(false);
  const [gadgets, setGadgets] = useState([]);
  const [filteredGadgets, setFilteredGadgets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ inStock: true });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(propCategory || null);
  const location = useLocation();
  const { category: routeCategory } = useParams();
  const [didHydrateFromCache, setDidHydrateFromCache] = useState(false);
  
  // Get user's currency from location context
  const { location: userLocation } = useLocationContext();
  const userCurrency = userLocation?.currency || 'GBP';
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Set category from route or props
  useEffect(() => {
    if (propCategory) {
      setCurrentCategory(propCategory);
      const categoryMeta = CATEGORY_META[propCategory];
      if (categoryMeta) {
        setActiveTitle(categoryMeta.name);
        setFilters(prev => ({ ...prev, categories: [propCategory] }));
      }
    } else if (routeCategory) {
      setCurrentCategory(routeCategory);
      const categoryMeta = Object.values(CATEGORY_META).find(m => m.slug === routeCategory);
      if (categoryMeta) {
        setCurrentCategory(Object.keys(CATEGORY_META).find(k => CATEGORY_META[k].slug === routeCategory));
        setActiveTitle(categoryMeta.name);
        setFilters(prev => ({ ...prev, categories: [Object.keys(CATEGORY_META).find(k => CATEGORY_META[k].slug === routeCategory)] }));
      }
    }
  }, [propCategory, routeCategory]);

  // Derive dynamic max price from currently loaded page - uses currency-appropriate price field
  const pageMaxPrice = useMemo(() => {
    try {
      const priceOf = (item) => {
        // Use price_gbp for GBP users, price for MWK users
        const p = userCurrency === 'GBP' 
          ? (item?.price_gbp ?? item?.priceGbp ?? item?.price)
          : item?.price;
        const n = typeof p === 'string' ? Number(p.replace(/[^0-9.]/g, '')) : Number(p);
        return Number.isFinite(n) ? n : 0;
      };
      const prices = Array.isArray(gadgets) ? gadgets.map(priceOf).filter((n) => Number.isFinite(n) && n > 0) : [];
      if (prices.length === 0) return userCurrency === 'GBP' ? 2000 : 2000000; // Default max based on currency
      return Math.max(...prices);
    } catch (_) {
      return userCurrency === 'GBP' ? 2000 : 2000000;
    }
  }, [gadgets, userCurrency]);

  // Compute a global-ish max price by fetching a larger slice once per filter context
  const defaultMax = userCurrency === 'GBP' ? 2000 : 2000000;
  const [globalMaxPrice, setGlobalMaxPrice] = useState(defaultMax);
  useEffect(() => {
    const fetchGlobalMax = async () => {
      try {
        const { category, brand, inStock, condition } = filters;
        const res = await gadgetsAPI.getAll({ page: 1, limit: 1000, category, brand, inStock, condition, currency: userCurrency });
        if (res && res.success && Array.isArray(res.data)) {
          const priceOf = (item) => {
            // Use price_gbp for GBP users, price for MWK users
            const p = userCurrency === 'GBP' 
              ? (item?.price_gbp ?? item?.priceGbp ?? item?.price)
              : item?.price;
            const n = typeof p === 'string' ? Number(p.replace(/[^0-9.]/g, '')) : Number(p);
            return Number.isFinite(n) ? n : 0;
          };
          const prices = res.data.map(priceOf).filter((n) => Number.isFinite(n) && n > 0);
          if (prices.length > 0) {
            const max = Math.max(...prices);
            setGlobalMaxPrice(max);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Failed to compute global max price:', e?.message || e);
        }
      }
    };
    fetchGlobalMax();
    // Only recompute when the filter context changes (not on price slider changes)
  }, [filters.category, filters.brand, filters.inStock, filters.condition, userCurrency]);

  // Effective max: prefer larger of page max vs global max slice
  const effectiveMaxPrice = useMemo(() => {
    const fallback = userCurrency === 'GBP' ? 2000 : 2000000;
    return Math.max(globalMaxPrice || fallback, pageMaxPrice || fallback);
  }, [globalMaxPrice, pageMaxPrice, userCurrency]);

  // Staggered grid animation
  const gridContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.04 }
    }
  };
  const gridItem = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
  };

  // Sorting helper
  const sortGadgets = (list = [], sortBy = 'newest') => {
    const data = Array.isArray(list) ? [...list] : [];
    const priceOf = (item) => {
      const p = item?.price;
      const n = typeof p === 'string' ? Number(p.replace(/[^0-9.]/g, '')) : Number(p);
      return Number.isFinite(n) ? n : 0;
    };
    const ratingOf = (item) => Number(item?.rating ?? 0);
    const dateOf = (item) => {
      const d = item?.date ? new Date(item.date) : null;
      return d instanceof Date && !isNaN(d) ? d.getTime() : 0;
    };
    const conditionRank = (cond) => {
      const order = { Excellent: 4, 'Very Good': 3, Good: 2, Fair: 1 };
      return order[String(cond)] ?? 0;
    };

    switch (sortBy) {
      case 'price_low':
        return data.sort((a, b) => priceOf(a) - priceOf(b));
      case 'price_high':
        return data.sort((a, b) => priceOf(b) - priceOf(a));
      case 'newest':
        return data.sort((a, b) => dateOf(b) - dateOf(a));
      case 'rating':
        return data.sort((a, b) => ratingOf(b) - ratingOf(a));
      case 'condition':
        return data.sort((a, b) => conditionRank(b?.condition) - conditionRank(a?.condition));
      default:
        return data; // keep API order if unknown
    }
  };
  
  // Route-level SEO: title, description, keywords, canonical, OG/Twitter
  useEffect(() => {
    const title = 'Xtrapush Gadgets : A little push to get you there';
    const description = 'Shop phones, tablets, computers, and accessories with finance, warranty, and trade‑in options.';
    const keywords = 'Xtrapush Gadgets, Xtrapush, gadgets, phones, tablets, accessories, computers, laptops, PCs, chargers, cases, headphones, earbuds, smartwatches, wearables, warranty, finance, trade-in';
    const canonicalHref = 'https://itsxtrapush.com/gadgets';

    document.title = title;

    const setNamedMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setPropertyMeta = (prop, content) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Update description and keywords
    setNamedMeta('description', description);
    setNamedMeta('keywords', keywords);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // Open Graph
    setPropertyMeta('og:title', 'Xtrapush Gadgets : A little push to get you there');
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', canonicalHref);

    // Twitter
    setNamedMeta('twitter:title', 'Xtrapush Gadgets : A little push to get you there');
    setNamedMeta('twitter:description', description);

    // Structured Data: CollectionPage + Breadcrumb
    try {
      const ldData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Xtrapush Gadgets",
        "description": description,
        "url": canonicalHref,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Xtrapush Gadgets",
          "url": "https://itsxtrapush.com/"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://itsxtrapush.com/" },
            { "@type": "ListItem", "position": 2, "name": "Gadgets", "item": canonicalHref }
          ]
        }
      };
      let ldScript = document.getElementById('ld-collectionpage');
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.id = 'ld-collectionpage';
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(ldData);
    } catch {}
  }, []);

  // Fetch gadgets from backend with filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchGadgets = async (appliedFilters = {}) => {
    try {
      // If we already hydrated from cache, avoid showing the loader again
      if (!didHydrateFromCache) setLoading(true);
      setError(null);
      const mergedFilters = { page, limit: 20, ...appliedFilters, currency: userCurrency };
      console.log('🔍 Fetching gadgets with filters:', mergedFilters);
      console.log('API URL:', process.env.REACT_APP_API_URL || 'https://sparkle-pro.co.uk/api');
      
      const response = await gadgetsAPI.getAll(mergedFilters);
      console.log('📡 Raw API response:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('✅ Valid gadgets response:', response.data.length, 'gadgets');
        // If loading subsequent pages, append; otherwise replace
        setGadgets(prev => (page > 1 ? [...prev, ...response.data] : response.data));
        const newTotal = response.pagination?.total ?? response.count ?? response.data.length;
        setTotal(newTotal);
        
        // Combine current list for proper sorting across pages
        const baseList = page > 1 ? [...gadgets, ...response.data] : response.data;
        console.log('🧮 Base list count:', baseList.length);
        
        let afterStock = baseList;
        
        // Local search filter
        const afterSearch = searchQuery ? afterStock.filter(gadget => {
          const text = `${gadget.name} ${gadget.description} ${gadget.brand} ${gadget.model}`.toLowerCase();
          return text.includes(searchQuery.toLowerCase());
        }) : afterStock;
        console.log('🔎 After search filter count:', afterSearch.length);
        
        // Apply sorting (prefer freshly applied filters to avoid stale state)
        const selectedSort = (appliedFilters?.sortBy ?? filters.sortBy ?? 'newest');
        const sorted = sortGadgets(afterSearch, selectedSort);
        console.log('📊 Final sorted count:', sorted.length);
        setFilteredGadgets(sorted);

        // Persist lightweight cache for smoother back navigation
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            gadgets: baseList,
            total: newTotal,
            filters: { ...filters },
            page
          }));
        } catch {}
      } else {
        console.error('❌ Invalid response structure:', response);
        setGadgets([]);
        setFilteredGadgets([]);
        setError('Invalid response from server');
      }
        
        // Cleaned duplicate block removed
    } catch (err) {
      console.error('❌ Error fetching gadgets:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        url: err.config?.url,
        responseData: err.response?.data
      });
      setError(`Failed to connect to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    // Try to hydrate from session cache for instant UI on back navigation
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache = JSON.parse(raw);
        const ageMs = Date.now() - (cache?.timestamp || 0);
        // Use cache if it is fresh (<= 3 minutes) and has data
        if (Array.isArray(cache?.gadgets) && cache.gadgets.length > 0 && ageMs <= 3 * 60 * 1000) {
          setGadgets(cache.gadgets);
          setTotal(Number(cache.total) || cache.gadgets.length);
          // Respect cached sort order
          setFilteredGadgets(sortGadgets(cache.gadgets, cache.filters?.sortBy || 'newest'));
          setFilters({ ...filters, ...cache.filters });
          setPage(Number(cache.page) || 1);
          setLoading(false);
          setDidHydrateFromCache(true);
        }
      }
    } catch {}
    fetchGadgets(filters);
  }, [page]);

  // Handle search from other pages
  useEffect(() => {
    if (location.state && location.state.searchQuery) {
      const query = location.state.searchQuery;
      setSearchQuery(query);
      filterGadgets(query, gadgets);
    }
  }, [location.state, gadgets]);

  // Respond to query string changes (e.g., /gadgets?search=term)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
      filterGadgets(q, gadgets);
    }
  }, [location.search, gadgets]);

  // Apply initial category filter from navigation state (e.g., ProductCategories)
  useEffect(() => {
    if (location.state && location.state.category) {
      const navCategory = location.state.category;
      const newFilters = { ...filters, category: navCategory };
      setFilters(newFilters);
      setPage(1);
      setGadgets([]);
      setFilteredGadgets([]);
      fetchGadgets(newFilters);
      // Optionally update page title to human-readable title if provided
      if (location.state.categoryTitle) {
        setActiveTitle(location.state.categoryTitle);
      }
    }
  }, [location.state]);
  
  const filterGadgets = (query, gadgetList = filteredGadgets) => {
    if (!query || query.trim() === '') {
      // Apply sorting to the current list when query cleared
      setFilteredGadgets(sortGadgets(gadgetList, filters.sortBy ?? 'newest'));
      return;
    }
    
    const filtered = gadgetList.filter(gadget => 
      gadget.name.toLowerCase().includes(query.toLowerCase()) ||
      gadget.description.toLowerCase().includes(query.toLowerCase())
    );
    // Apply sorting to filtered results
    setFilteredGadgets(sortGadgets(filtered, filters.sortBy ?? 'newest'));
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    filterGadgets(query, gadgets);
  };
  
  // Function to handle real-time search as user types
  const handleSearchInputChange = (inputValue) => {
    setSearchQuery(inputValue);
    filterGadgets(inputValue, gadgets);
  };

  // Handle filter changes from sidebar
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Reset pagination when applying new filters
    setPage(1);
    setGadgets([]);
    setFilteredGadgets([]);
    fetchGadgets(newFilters);
  };

  // Toggle mobile filter drawer
  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };

  // Generate SEO meta data
  const metaTitle = generateCategoryTitle(currentCategory, searchQuery);
  const metaDescription = generateCategoryDescription(currentCategory, searchQuery);
  const breadcrumbData = generateBreadcrumbData([
    { name: 'Home', url: '/' },
    { name: 'Gadgets', url: '/gadgets' },
    ...(currentCategory && CATEGORY_META[currentCategory] ? [{
      name: CATEGORY_META[currentCategory].name,
      url: `/${CATEGORY_META[currentCategory].slug}`
    }] : [])
  ]);

  return (
    <>
      <SEOMeta
        title={metaTitle}
        description={metaDescription}
        canonical={getCanonicalUrl(location.pathname)}
        structuredData={breadcrumbData}
      />

      <motion.div
        className="deep bg-primary w-full min-h-screen overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
      
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          {/* Search Bar */}
          <div className="flex justify-center px-2 sm:px-4 mt-2 sm:mt-4 mb-4 sm:mb-6">
            <SearchBar 
              onSearch={handleSearch} 
              onInputChange={handleSearchInputChange}
            initialQuery={searchQuery}
          />
        </div>
        
        {/* Mobile Filter Button - positioned under search bar */}
        {isMobile && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', px: 2 }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={toggleMobileFilter}
              variant="contained"
              sx={{ 
                bgcolor: '#051323',
                color: 'white',
                '&:hover': {
                  bgcolor: '#0a2540'
                },
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Filter Gadgets
            </Button>
          </Box>
        )}
        
        {/* Main Content with Sidebar */}
        <Box sx={{ display: 'flex', gap: 2, px: 2 }}>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Box sx={{ 
              width: 280, 
              flexShrink: 0,
              '& > *': {
                bgcolor: '#051323 !important',
                color: 'white !important'
              }
            }}>
              <GadgetFilter 
                onFiltersChange={handleFiltersChange}
                currentFilters={filters}
                maxPrice={effectiveMaxPrice}
                currency={userCurrency}
              />
            </Box>
          )}
          
          {/* Mobile Filter Drawer */}
          <Drawer
            anchor="left"
            open={mobileFilterOpen}
            onClose={toggleMobileFilter}
            sx={{
              '& .MuiDrawer-paper': {
                width: { xs: '90vw', sm: '400px' },
                maxWidth: '400px',
                bgcolor: '#051323',
                color: 'white',
                p: 0
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              bgcolor: '#051323'
            }}>
              <Typography variant="h6" component="h2" sx={{ color: 'white' }}>
                Filter Gadgets
              </Typography>
              <IconButton 
                onClick={toggleMobileFilter}
                size="small"
                sx={{ 
                  color: 'white'
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ p: 1, overflow: 'auto', height: 'calc(100% - 65px)', bgcolor: '#051323' }}>
              <GadgetFilter 
                onFiltersChange={(filters) => {
                  handleFiltersChange(filters);
                  // Don't auto-close drawer to allow multiple filter selections
                }}
                currentFilters={filters}
                isMobile={true}
                maxPrice={effectiveMaxPrice}
                currency={userCurrency}
              />
            </Box>
          </Drawer>
          
          {/* Main Content Area */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <section className="flex flex-col items-center text-center w-[95%] mx-auto px-3 py-4 sm:w-auto sm:p-12 sm:pt-4">
              <h1 className="font-poppins font-semibold text-[32px] xs:text-[40px] sm:text-[52px] text-white leading-tight mb-6">
                Explore Our <span className="text-gradient">Gadgets</span>
              </h1>
              
              {loading ? (
                <div className="flex flex-col items-center mt-8 mb-16">
                  <CircularProgress sx={{ color: 'white', mb: 2 }} />
                  <div className="text-white text-xl">Loading gadgets...</div>
                </div>
              ) : error ? (
                <div className="mt-8 mb-16">
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                  <div className="text-white text-lg">
                    API URL: {process.env.REACT_APP_API_URL || 'https://sparkle-pro.co.uk/api'}
                  </div>
                  <div className="text-white text-sm mt-2">
                    Check browser console for detailed error information.
                  </div>
                </div>
              ) : filteredGadgets.length === 0 ? (
                <div className="text-white text-xl mt-8 mb-16">
                  {searchQuery ? `No gadgets found matching "${searchQuery}". Try a different search term.` : 'No gadgets available.'}
                </div>
              ) : (
                <>
                  {/* Results Count */}
                  <Typography 
                    variant="body1" 
                    sx={{ color: 'white', mb: 3, opacity: 0.8 }}
                  >
                    Showing {filteredGadgets.length} of {total} gadget{total !== 1 ? 's' : ''}
                    {searchQuery && ` for "${searchQuery}"`}
                  </Typography>
                  
                  {/* Gadgets Grid */}
                  <Suspense fallback={<div className="text-white opacity-70">Loading items…</div>}>
                    <motion.div
                      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                      variants={gridContainer}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredGadgets.map((gadget) => (
                        <motion.div variants={gridItem} key={`card-${gadget.id}`}>
                        <LazyLoadGadgetCard gadgetId={gadget.id}>
                          <Link
                            key={gadget.id}
                            to={`/gadgets/${gadget.id}`}
                            onClick={(e) => {
                              try {
                                if (window.__dialogOpen) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              } catch {}
                            }}
                          >
                            <ItemCard3D 
                              id={gadget.id}
                              title={gadget.name} 
                              date={gadget.date || 'Available Now'} 
                              number={(() => { 
                                // Try to get stock quantity from various possible field names
                                const candidates = [gadget?.stock_quantity, gadget?.qty, gadget?.number];
                                for (const val of candidates) {
                                  const n = Number(val);
                                  if (Number.isFinite(n) && n >= 0) return n;
                                }
                                // Fallback to in_stock boolean flag
                                if (gadget?.in_stock || gadget?.inStock) return 1;
                                return 0;
                              })()} 
                              image={gadget.image} 
                              description={gadget.description} 
                              price={gadget.price}
                              priceMwk={gadget.price_mwk ?? gadget.priceMwk ?? gadget.price}
                              priceGbp={gadget.price_gbp ?? gadget.priceGbp}
                              monthlyPrice={gadget.monthly_price ?? gadget.monthlyPrice}
                              monthlyPriceGbp={gadget.monthly_price_gbp ?? gadget.monthlyPriceGbp}
                              brand={gadget.brand}
                              condition={gadget.condition}
                            />
                          </Link>
                        </LazyLoadGadgetCard>
                        </motion.div>
                      ))}
                    </motion.div>
                  </Suspense>

                  {/* View More */}
                  {filteredGadgets.length < total && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Button variant="contained" color="primary" onClick={() => setPage(prev => prev + 1)}>
                        View More
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </section>
          </Box>
        </Box>
      </div>
    </div>
    </motion.div>
    </>
  );
};

export default GadgetsPage;
