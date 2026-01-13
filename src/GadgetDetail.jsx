import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gadgetsAPI } from "./services/api.js";

import styles from "./style";
import SEOMeta from './components/SEOMeta.jsx';
import { 
  generateGadgetTitle, 
  generateGadgetDescription, 
  generateGadgetStructuredData,
  parseGadgetUrl,
  getCanonicalUrl
} from './utils/seoUtils.js';
import { CircularProgress, Alert, Tabs, Tab, Box, Snackbar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import BookingCalendar from './components/BookingCalendar.jsx';

import { formatMWK } from './utils/formatters';
import { usePricing } from './hooks/usePricing';
import { useAuth } from './contexts/AuthContext.jsx';
import { useCart } from './contexts/CartContext.jsx';
import model3DService from './services/model3DService.js';
import InstallmentModal from './components/InstallmentModal.jsx';
import ReviewsSection from './components/ReviewsSection.jsx';
import { recordEvent } from './services/analyticsApi.js';
const Model3DViewer = React.lazy(() => import('./components/Model3DViewer.jsx'));

const GadgetDetail = () => {
  const navigate = useNavigate();
  const [activeTitle] = useState('Gadgets');
  const [toggle, setToggle] = useState(false);
  const { id, category, slug } = useParams();
  
  // Extract ID from SEO-friendly URL or use direct id param
  const gadgetId = slug ? parseGadgetUrl(`/gadgets/${category}/${slug}`) : id;
  
  const [gadget, setGadget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  // Add to cart processing state no longer needed
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [tabValue, setTabValue] = useState(0);
  const [bookingComplete, setBookingComplete] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { formatLocalPrice, currency, isInMalawi, loading: pricingLoading } = usePricing();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [checking3D, setChecking3D] = useState(false);
  const [modelUnavailable, setModelUnavailable] = useState(false);
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const lastViewRecordedIdRef = useRef(null);

  // Variant handling state for dynamic selections (Color + Storage + Condition)
  const [variants, setVariants] = useState([]);
  const [colorOptions, setColorOptions] = useState([]); // Array of { color: string, colorHex: string }
  const [storageOptions, setStorageOptions] = useState([]);
  const [conditionOptions, setConditionOptions] = useState([]); // labels
  const [selectedColor, setSelectedColor] = useState(''); // color name
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('new'); // token
  const [variantId, setVariantId] = useState(undefined);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [selectedVariantStock, setSelectedVariantStock] = useState(null);

  // Condition mappings (canonical)
  const CONDITION_TOKEN_TO_LABEL = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair'
  };
  const CONDITION_LABEL_TO_TOKEN = {
    'New': 'new',
    'Like New': 'like_new',
    'Good': 'good',
    'Fair': 'fair'
  };
  const ALLOWED_CONDITION_TOKENS = ['new','like_new','good','fair'];

  // Categories that typically have color/storage/condition variants (like MusicMagpie)
  const VARIANT_ELIGIBLE_CATEGORIES = ['smartphones', 'tablets', 'laptops', 'phones', 'mobile', 'iphone', 'samsung', 'ipad'];
  
  // Check if this gadget's category should show variant selectors
  const isVariantEligibleCategory = gadget?.category 
    ? VARIANT_ELIGIBLE_CATEGORIES.some(cat => 
        gadget.category.toLowerCase().includes(cat.toLowerCase())
      )
    : false;

  // Cascading availability: filter options based on what's in stock
  // Only show storage options that have at least one variant in stock
  const availableStorages = React.useMemo(() => {
    if (variants.length === 0) return storageOptions;
    const inStockStorages = new Set();
    variants.forEach(v => {
      const stock = parseInt(v.stock_quantity ?? 0, 10);
      if (stock > 0) {
        inStockStorages.add(v.storage);
      }
    });
    return storageOptions.filter(s => inStockStorages.has(s));
  }, [variants, storageOptions]);

  // Only show conditions that are available for the selected storage
  const availableConditions = React.useMemo(() => {
    if (variants.length === 0) return conditionOptions;
    const relevantVariants = selectedStorage 
      ? variants.filter(v => v.storage === selectedStorage)
      : variants;
    const inStockConditions = new Set();
    relevantVariants.forEach(v => {
      const stock = parseInt(v.stock_quantity ?? 0, 10);
      if (stock > 0) {
        inStockConditions.add(v.condition_status);
      }
    });
    // Convert tokens to labels and filter
    return conditionOptions.filter(label => {
      const token = CONDITION_LABEL_TO_TOKEN[label];
      return inStockConditions.has(token);
    });
  }, [variants, selectedStorage, conditionOptions]);

  // Check if current selection has stock
  const currentSelectionInStock = React.useMemo(() => {
    if (selectedVariantStock !== null) return selectedVariantStock > 0;
    if (!selectedStorage) return true; // No selection yet
    const match = variants.find(v => 
      v.storage === selectedStorage && 
      v.condition_status === selectedCondition
    );
    return match ? parseInt(match.stock_quantity ?? 0, 10) > 0 : false;
  }, [variants, selectedStorage, selectedCondition, selectedVariantStock]);

  const parsePrice = (p) => {
    if (typeof p === 'string') return parseFloat(p.replace(/[^0-9.-]+/g, '')) || 0;
    return Number(p) || 0;
  };

  // Helper function to get stock count from gadget
  const getStockCount = () => {
    if (!gadget) return 0;
    const coerceNumeric = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const m = v.match(/-?\d+/);
        if (m) {
          const n = parseInt(m[0], 10);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      }
      return null;
    };
    const numericCandidates = [gadget?.stock_quantity, gadget?.stockQuantity, gadget?.stock];
    let stockCount = null;
    for (const c of numericCandidates) {
      const n = coerceNumeric(c);
      if (n !== null) { stockCount = n; break; }
    }
    if (stockCount === null) {
      if (typeof gadget?.in_stock !== 'undefined') stockCount = gadget.in_stock ? 1 : 0;
      else if (typeof gadget?.inStock !== 'undefined') stockCount = gadget.inStock ? 1 : 0;
      else stockCount = 0;
    }
    return Math.max(0, stockCount);
  };

  // Orchestrated motion variants for panels coming together
  const panelsContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, when: 'beforeChildren' }
    }
  };
  const leftPanelVariants = {
    hidden: { opacity: 0, x: -32, y: 8, scale: 0.98 },
    show: {
      opacity: 1, x: 0, y: 0, scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };
  const rightPanelVariants = {
    hidden: { opacity: 0, x: 32, y: 8, scale: 0.98 },
    show: {
      opacity: 1, x: 0, y: 0, scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.04 }
    }
  };

  const summaryContainer = {
    hidden: {},
    show: {
      transition: { delayChildren: 0.12, staggerChildren: 0.08 }
    }
  };
  const summaryItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
  };
  const ctaItem = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 22 } }
  };



  // Fetch gadget data from backend
  useEffect(() => {
    const fetchGadget = async () => {
      try {
        setLoading(true);
        const response = await gadgetsAPI.getById(id);
        if (response.success) {
          const data = response.data;
          setGadget(data);

          // Normalize variants and build options (Color + Storage + Condition)
          const rawVariants = Array.isArray(data.variants)
            ? data.variants
                .map(v => ({
                  ...v,
                  color: v.color || null,
                  color_hex: v.color_hex || v.colorHex || null,
                  condition_status: v.condition_status ?? v.condition,
                  stock_quantity: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity,
                  is_active: typeof v.is_active !== 'undefined' ? v.is_active : v.active,
                  price_gbp: v.price_gbp || v.priceGbp || null
                }))
                .filter(v => (v?.is_active ?? 1) === 1 && String(v.condition_status) !== 'poor')
            : [];
          setVariants(rawVariants);

          if (rawVariants.length > 0) {
            // Extract unique colors with their hex values
            const colorMap = new Map();
            rawVariants.forEach(v => {
              if (v.color) {
                colorMap.set(v.color, { color: v.color, colorHex: v.color_hex || null });
              }
            });
            const colorOpts = Array.from(colorMap.values());
            setColorOptions(colorOpts);

            // Extract unique storage options
            const storOpts = Array.from(new Set(rawVariants.map(v => String(v.storage)).filter(Boolean)));
            setStorageOptions(storOpts);

            // Derive condition tokens, sanitize to allowed, then map to labels
            const condTokens = Array.from(new Set(rawVariants.map(v => String(v.condition_status)).filter(Boolean)))
              .filter(t => ALLOWED_CONDITION_TOKENS.includes(t));
            const condLabels = condTokens.map(t => CONDITION_TOKEN_TO_LABEL[t]).filter(Boolean);
            setConditionOptions(condLabels);

            // Initialize selection to first available from variants
            const initialColor = colorOpts.length > 0 ? colorOpts[0].color : '';
            const initialStorage = storOpts[0] || '';
            const initialConditionToken = condTokens.includes(String(data.condition || data.condition_status))
              ? String(data.condition || data.condition_status)
              : (condTokens[0] || 'new');
            setSelectedColor(initialColor);
            setSelectedStorage(initialStorage);
            setSelectedCondition(initialConditionToken);

            // Resolve initial match considering color, storage, and condition
            let match = null;
            if (initialColor && initialStorage) {
              match = rawVariants.find(v => 
                String(v.color) === String(initialColor) && 
                String(v.storage) === String(initialStorage) && 
                String(v.condition_status) === String(initialConditionToken)
              );
            }
            if (!match && initialStorage) {
              match = rawVariants.find(v => String(v.storage) === String(initialStorage) && String(v.condition_status) === String(initialConditionToken));
            }
            if (!match) {
              match = rawVariants.find(v => String(v.condition_status) === String(initialConditionToken));
            }
            // Use appropriate price based on user location
            // For Malawi users: use MWK price directly (price field)
            // For international users: use GBP price
            const effectivePrice = isInMalawi 
              ? (match ? parsePrice(match.price_mwk || match.price) : parsePrice(data.price_mwk || data.priceMwk || data.price))
              : (match ? parsePrice(match.price_gbp || match.price) : parsePrice(data.price_gbp || data.priceGbp || data.price / 2358));
            setDisplayPrice(effectivePrice);
            setVariantId(match?.id || undefined);
            const vStock = match ? Math.max(0, parseInt(match.stock_quantity ?? 0, 10) || 0) : null;
            setSelectedVariantStock(vStock);
          } else {
            // No variants: do not show selectors if not admin-defined
            setColorOptions([]);
            setStorageOptions([]);
            setConditionOptions([]); // hide condition selector when no variants
            setSelectedColor('');
            setSelectedStorage('');
            setSelectedCondition(String(data.condition || data.condition_status || 'new'));
            // Use appropriate price based on user location
            const basePrice = isInMalawi 
              ? (data.price_mwk || data.priceMwk || data.price)
              : (data.price_gbp || data.priceGbp || (data.price / 2358));
            setDisplayPrice(parsePrice(basePrice));
            setVariantId(undefined);
            setSelectedVariantStock(null);
          }

          // Analytics: record product view once per product id
          try {
            const sessionId = localStorage.getItem('xp_analytics_sid');
            const gid = data?.id;
            if (sessionId && gid && lastViewRecordedIdRef.current !== gid) {
              const payload = {
                productId: gid,
                name: data?.name,
                brand: data?.brand,
                model: data?.model,
                category: data?.category,
                price: parsePrice(data?.price),
                condition: String(data?.condition || data?.condition_status || ''),
              };
              await recordEvent(sessionId, 'view_product', payload);
              lastViewRecordedIdRef.current = gid;
            }
          } catch (e) {
            // swallow analytics errors
          }
        } else {
          setError('Gadget not found');
        }
      } catch (err) {
        console.error('Error fetching gadget:', err);
        setError('Failed to load gadget details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGadget();
    }
  }, [gadgetId]);

  // Route-level SEO for product detail: title, description, canonical, OG/Twitter, JSON-LD
  const [seoMeta, setSeoMeta] = useState(null);
  useEffect(() => {
    if (!gadget) return;

    const metaTitle = generateGadgetTitle(gadget.name, gadget.brand, gadget.category);
    const metaDescription = generateGadgetDescription(gadget.name, gadget.brand, gadget.description, displayPrice);
    const structuredData = generateGadgetStructuredData({
      ...gadget,
      price: displayPrice
    });
    const canonicalUrl = getCanonicalUrl(`/gadgets/${gadget.id}`);

    setSeoMeta({
      title: metaTitle,
      description: metaDescription,
      canonical: canonicalUrl,
      ogImage: gadget.image,
      structuredData
    });

    document.title = metaTitle;
  }, [gadget, id]);

  if (loading) {
    return (
      <div className="deep bg-primary w-full overflow-hidden min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <CircularProgress sx={{ color: 'white', mb: 2 }} size={60} />
          <div className="text-white text-xl">Loading gadget details...</div>
        </div>
      </div>
    );
  }

  if (error || !gadget) {
    return (
      <div className="deep bg-primary w-full overflow-hidden min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Gadget not found'}
          </Alert>
          <Link
            to="/gadgets"
            className="text-lg text-blue-400 hover:underline"
            onClick={(e) => { e.preventDefault(); navigate('/gadgets'); }}
          >
            &larr; Return to Gadgets
          </Link>
        </div>
      </div>
    );
  }



  const handleNext = () => {
    const images = gadget.more_img || [gadget.image];
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    const images = gadget.more_img || [gadget.image];
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    // Normalize stock consistently with Product Details rendering
    const coerceNumeric = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const m = v.match(/-?\d+/);
        if (m) {
          const n = parseInt(m[0], 10);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      }
      return null;
    };
    const numericCandidates = [gadget?.stock_quantity, gadget?.stockQuantity, gadget?.stock];
    let stockCount = null;
    for (const c of numericCandidates) {
      const n = coerceNumeric(c);
      if (n !== null) { stockCount = n; break; }
    }
    if (stockCount === null) {
      // Fallback to booleans only if no numeric field is present
      if (typeof gadget?.in_stock !== 'undefined') stockCount = gadget.in_stock ? 1 : 0;
      else if (typeof gadget?.inStock !== 'undefined') stockCount = gadget.inStock ? 1 : 0;
      else stockCount = 0;
    }
    const stockAvailable = stockCount;
    const isAvailable = stockAvailable > 0;
    if (!isAvailable) {
      alert('This item is currently out of stock.');
      return;
    }
    // Use selected variant details if available (no fallback to specs)
    const defaultStorage = selectedStorage || undefined;
    const priceToUse = displayPrice || parsePrice(gadget.price);
    const conditionToUse = selectedCondition || (gadget.condition || gadget.condition_status || 'new');
    const stockToUse = (selectedVariantStock !== null && selectedVariantStock !== undefined) ? selectedVariantStock : stockAvailable;
    addToCart({
      id: gadget.id,
      title: gadget.name,
      price: priceToUse,
      image: gadget.image,
      number: stockToUse,
      brand: gadget.brand || '',
      condition: conditionToUse,
      storage: defaultStorage,
      color: selectedColor || undefined,
      variantId: variantId,
      description: gadget.description || '',
      specifications: gadget.specifications || null
    });
    setSnackbarMessage('Item added to cart!');
    setSnackbarOpen(true);
  };

  // Helper function to find variant match based on color, storage, and condition
  const findVariantMatch = (color, storage, condition) => {
    if (variants.length === 0) return null;
    // Try exact match with color, storage, and condition
    if (color && storage) {
      const exact = variants.find(v => 
        String(v.color) === String(color) && 
        String(v.storage) === String(storage) && 
        String(v.condition_status) === String(condition)
      );
      if (exact) return exact;
    }
    // Try match with storage and condition only (no color)
    if (storage) {
      const storageMatch = variants.find(v => 
        String(v.storage) === String(storage) && 
        String(v.condition_status) === String(condition)
      );
      if (storageMatch) return storageMatch;
    }
    // Try match with color and condition only
    if (color) {
      const colorMatch = variants.find(v => 
        String(v.color) === String(color) && 
        String(v.condition_status) === String(condition)
      );
      if (colorMatch) return colorMatch;
    }
    // Fallback to condition only
    return variants.find(v => String(v.condition_status) === String(condition));
  };

  // Update price and stock based on variant match
  const updateVariantSelection = (match) => {
    // Use appropriate price based on user location
    const effectivePrice = isInMalawi
      ? (match ? parsePrice(match.price_mwk || match.price) : parsePrice(gadget.price_mwk || gadget.priceMwk || gadget.price))
      : (match ? parsePrice(match.price_gbp || match.price) : parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price));
    setDisplayPrice(effectivePrice);
    setVariantId(match?.id || undefined);
    const vStock = match ? Math.max(0, parseInt(match.stock_quantity ?? 0, 10) || 0) : null;
    setSelectedVariantStock(vStock);
  };

  // Handlers for variant selectors (Color + Storage + Condition)
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (variants.length === 0) {
      setVariantId(undefined);
      setSelectedVariantStock(null);
      const fallbackPrice = isInMalawi 
        ? parsePrice(gadget.price_mwk || gadget.priceMwk || gadget.price)
        : parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price);
      setDisplayPrice(fallbackPrice);
      return;
    }
    const match = findVariantMatch(color, selectedStorage, selectedCondition);
    updateVariantSelection(match);
  };

  const handleStorageSelect = (value) => {
    setSelectedStorage(value);
    if (variants.length === 0) {
      setVariantId(undefined);
      setSelectedVariantStock(null);
      const fallbackPrice = isInMalawi 
        ? parsePrice(gadget.price_mwk || gadget.priceMwk || gadget.price)
        : parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price);
      setDisplayPrice(fallbackPrice);
      return;
    }
    
    // When storage changes, check if current condition is available for new storage
    const variantsForStorage = variants.filter(v => v.storage === value);
    const currentConditionAvailable = variantsForStorage.some(v => 
      v.condition_status === selectedCondition && parseInt(v.stock_quantity ?? 0, 10) > 0
    );
    
    // If current condition not available, auto-select first available condition
    let effectiveCondition = selectedCondition;
    if (!currentConditionAvailable && variantsForStorage.length > 0) {
      const firstAvailable = variantsForStorage.find(v => parseInt(v.stock_quantity ?? 0, 10) > 0);
      if (firstAvailable) {
        effectiveCondition = firstAvailable.condition_status;
        setSelectedCondition(effectiveCondition);
      }
    }
    
    const match = findVariantMatch(selectedColor, value, effectiveCondition);
    updateVariantSelection(match);
  };

  const handleConditionSelect = (labelOrToken) => {
    const token = CONDITION_LABEL_TO_TOKEN[labelOrToken] || labelOrToken;
    setSelectedCondition(token);
    if (variants.length === 0) {
      setVariantId(undefined);
      setSelectedVariantStock(null);
      const fallbackPrice = isInMalawi 
        ? parsePrice(gadget.price_mwk || gadget.priceMwk || gadget.price)
        : parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price);
      setDisplayPrice(fallbackPrice);
      return;
    }
    const match = findVariantMatch(selectedColor, selectedStorage, token);
    updateVariantSelection(match);
  };

  return (
    <>
      {seoMeta && <SEOMeta {...seoMeta} />}
      <motion.div
        className="deep bg-primary w-full min-h-screen overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
<section className="flex flex-col items-center text-center p-6 sm:p-12 gap-8">
  <h1 className="text-white text-3xl sm:text-4xl md:text-5xl mb-4">
    {gadget.name}
  </h1>

  <Link
    to="/gadgets"
    className="text-lg text-blue-400 hover:underline mb-4"
    onClick={(e) => { e.preventDefault(); navigate('/gadgets'); }}
  >
    &larr; Return to Gadgets
  </Link>

  {/* Hero & Details Split (desktop) */}
  <div className="w-[95%] sm:w-[90%] md:w-[92%] lg:w-[90%] xl:w-[85%] max-w-6xl mx-auto">
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
      variants={panelsContainer}
      initial="hidden"
      animate="show"
    >
      {/* Left: Media */}
      <motion.div
        className="rounded-lg overflow-hidden shadow-lg"
        variants={leftPanelVariants}
      >
        {/* View Mode Toggle (placed above media) */}
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 rounded-md transition ${
                viewMode === '2d' 
                  ? 'bg-blue-700 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Normal View
            </button>
            <button
              onClick={async () => {
                if (!gadget) return;
                setChecking3D(true);
                try {
                  const info = await model3DService.getBestModelPath(
                    gadget?.name,
                    gadget?.brand,
                    gadget?.model
                  );
                  if (info && info.path) {
                    setModelUnavailable(false);
                    setViewMode('3d');
                  } else {
                    setModelUnavailable(true);
                    setViewMode('missing');
                  }
                } catch (e) {
                  setModelUnavailable(true);
                  setViewMode('missing');
                } finally {
                  setChecking3D(false);
                }
              }}
              className={`px-4 py-2 rounded-md transition ${
                viewMode === '3d' 
                  ? 'bg-blue-700 text-white' 
                  : 'text-gray-300 hover:text-white'
              } ${checking3D ? 'opacity-50 cursor-wait' : ''} ${!(model3DService.hasModel(gadget) || !!model3DService.getModelConfig(gadget?.name, gadget?.brand, gadget?.model)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-disabled={checking3D || !(model3DService.hasModel(gadget) || !!model3DService.getModelConfig(gadget?.name, gadget?.brand, gadget?.model))}
            >
              Detailed View
            </button>
          </div>
        </div>

        {viewMode === '3d' && (
          <div className="text-gray-400 text-sm text-center mb-4" role="status" aria-live="polite">
            Note: This 3D model is licensed and sourced from Sketchfab. It’s provided for visual reference only and may not perfectly represent the actual product.
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'missing' ? (
          <div className="h-[400px] flex items-center justify-center rounded-lg bg-gray-800 text-gray-200 shadow-lg">
            Sorry , Detailed View is not available for this Gadget
          </div>
        ) : viewMode === '2d' ? (
          <motion.img
            src={(gadget.more_img && gadget.more_img[imgIndex]) || gadget.image}
            alt={`${gadget.name} view ${imgIndex + 1}`}
            className="w-full h-auto rounded-lg shadow-lg"
            layoutId={`gadget-media-${gadget.id}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.div className="h-[700px] md:h-[800px] rounded-lg overflow-hidden shadow-lg" layoutId={`gadget-media-${gadget.id}`}>
            <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-gray-300">Loading 3D view…</div>}>
              <Model3DViewer
                gadgetName={gadget.name}
                gadgetBrand={gadget.brand}
                gadgetModel={gadget.model}
                fallbackImage={gadget.image}
                className="w-full h-full"
                onModelError={() => {
                  setModelUnavailable(true);
                  setViewMode('missing');
                }}
              />
            </Suspense>
          </motion.div>
        )}

        {/* Prev/Next Buttons (only show if multiple images) */}
        {viewMode === '2d' && gadget.more_img && gadget.more_img.length > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
            <button
              onClick={handlePrev}
              className="px-6 py-2 rounded bg-blue-700 text-white hover:bg-black transition shadow-lg"
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded bg-blue-700 text-white hover:bg-black transition shadow-lg"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Right: Summary details panel (sticky on desktop) */}
      <motion.div
        className="bg-gray-900 rounded-xl p-6 shadow-xl text-left md:sticky md:top-24"
        variants={rightPanelVariants}
      >
        <motion.div className="flex flex-col gap-4" variants={summaryContainer}>
          <motion.p className="text-gray-400" variants={summaryItem}>Brand: <span className="text-white">{gadget.brand}</span></motion.p>
          <motion.p className="text-gray-400" variants={summaryItem}>Model: <span className="text-white">{gadget.model}</span></motion.p>
          <motion.p className="text-gray-400" variants={summaryItem}>Category: <span className="text-white">{gadget.category}</span></motion.p>
          
          {/* Color selector - shows when admin-defined colors exist, or shows disabled default for eligible categories */}
          {(colorOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
            <Box sx={{ mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: colorOptions.length === 0 ? 'rgba(255,255,255,0.5)' : 'white' }}>Color</InputLabel>
                <Select
                  value={colorOptions.length > 0 ? (selectedColor || colorOptions[0]?.color || '') : ''}
                  label="Color"
                  onChange={(e) => handleColorSelect(e.target.value)}
                  disabled={colorOptions.length <= 1}
                  displayEmpty
                  sx={{
                    color: colorOptions.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&.Mui-disabled': { 
                      color: 'rgba(255,255,255,0.5)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                    }
                  }}
                  MenuProps={{
                    PaperProps: { sx: { bgcolor: '#1565c0', color: 'white' } }
                  }}
                >
                  {colorOptions.length === 0 ? (
                    <MenuItem value="" disabled>Not specified</MenuItem>
                  ) : (
                    colorOptions.map((opt) => (
                      <MenuItem key={opt.color} value={opt.color}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {opt.colorHex && (
                            <Box 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                backgroundColor: opt.colorHex,
                                border: '1px solid rgba(255,255,255,0.3)'
                              }} 
                            />
                          )}
                          {opt.color}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Condition selector shows when admin-defined conditions exist, or shows disabled default for eligible categories */}
          {(conditionOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
            <Box sx={{ mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: conditionOptions.length === 0 ? 'rgba(255,255,255,0.5)' : 'white' }}>Condition</InputLabel>
                <Select
                  value={conditionOptions.length > 0 ? (CONDITION_TOKEN_TO_LABEL[selectedCondition] || 'New') : 'New'}
                  label="Condition"
                  onChange={(e) => handleConditionSelect(e.target.value)}
                  disabled={conditionOptions.length <= 1}
                  sx={{
                    color: conditionOptions.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&.Mui-disabled': { 
                      color: 'rgba(255,255,255,0.5)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                    }
                  }}
                  MenuProps={{
                    PaperProps: { sx: { bgcolor: '#1565c0', color: 'white' } }
                  }}
                >
                  {availableConditions.length === 0 ? (
                    <MenuItem value="New" disabled>New</MenuItem>
                  ) : (
                    availableConditions.map((label) => {
                      const token = CONDITION_LABEL_TO_TOKEN[label];
                      // Check if this condition has stock for selected storage
                      const hasStock = variants.some(v => 
                        v.condition_status === token && 
                        (!selectedStorage || v.storage === selectedStorage) &&
                        parseInt(v.stock_quantity ?? 0, 10) > 0
                      );
                      return (
                        <MenuItem 
                          key={label} 
                          value={label}
                          sx={{ 
                            opacity: hasStock ? 1 : 0.5,
                            '&::after': !hasStock ? { content: '" (Out of stock)"', fontSize: '0.75rem', ml: 1, color: 'rgba(255,255,255,0.5)' } : {}
                          }}
                        >
                          {label}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Storage selector shows when admin-defined storages exist, or shows disabled default for eligible categories */}
          {(availableStorages.length > 0 || storageOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
            <Box sx={{ mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: availableStorages.length === 0 ? 'rgba(255,255,255,0.5)' : 'white' }}>Storage</InputLabel>
                <Select
                  value={availableStorages.length > 0 ? (selectedStorage || availableStorages[0]) : (storageOptions.length > 0 ? storageOptions[0] : '')}
                  label="Storage"
                  onChange={(e) => handleStorageSelect(e.target.value)}
                  disabled={availableStorages.length <= 1 && storageOptions.length <= 1}
                  displayEmpty
                  sx={{
                    color: availableStorages.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&.Mui-disabled': { 
                      color: 'rgba(255,255,255,0.5)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                    }
                  }}
                  MenuProps={{
                    PaperProps: { sx: { bgcolor: '#1565c0', color: 'white' } }
                  }}
                >
                  {storageOptions.length === 0 ? (
                    <MenuItem value="" disabled>Not specified</MenuItem>
                  ) : (
                    storageOptions.map((opt) => {
                      // Check if this storage has stock
                      const hasStock = variants.some(v => 
                        v.storage === opt && parseInt(v.stock_quantity ?? 0, 10) > 0
                      );
                      return (
                        <MenuItem 
                          key={opt} 
                          value={opt}
                          disabled={!hasStock}
                          sx={{ 
                            opacity: hasStock ? 1 : 0.5,
                          }}
                        >
                          {opt}{!hasStock ? ' (Out of stock)' : ''}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>
            </Box>
          )}
        </motion.div>

        {(() => {
          const coerceNumeric = (v) => {
            if (v === null || v === undefined) return null;
            if (typeof v === 'number' && Number.isFinite(v)) return v;
            if (typeof v === 'string') {
              const m = v.match(/-?\d+/);
              if (m) {
                const n = parseInt(m[0], 10);
                return Number.isFinite(n) ? n : null;
              }
              return null;
            }
            return null;
          };
          const numericCandidates = [gadget?.stock_quantity, gadget?.stockQuantity, gadget?.stock];
          let stockCount = null;
          for (const c of numericCandidates) {
            const n = coerceNumeric(c);
            if (n !== null) { stockCount = n; break; }
          }
          if (stockCount === null) {
            if (typeof gadget?.in_stock !== 'undefined') stockCount = gadget.in_stock ? 1 : 0;
            else if (typeof gadget?.inStock !== 'undefined') stockCount = gadget.inStock ? 1 : 0;
            else stockCount = 0;
          }
          const isAvailable = stockCount > 0;
          const hidePrice = stockCount < 0;
          const showActions = stockCount > 0;
          
          // Get the correct price for display based on user location
          const getPriceDisplay = () => {
            if (!isAvailable) return 'Coming Soon';
            if (displayPrice) {
              // For Malawi users, format as MWK directly
              if (isInMalawi) {
                const numPrice = typeof displayPrice === 'string' ? parseFloat(displayPrice.replace(/[^0-9.]/g, '')) : Number(displayPrice);
                if (Number.isFinite(numPrice)) {
                  return `MWK ${Math.round(numPrice).toLocaleString('en-US')}`;
                }
              }
              // For international users, use formatLocalPrice (GBP)
              return formatLocalPrice(displayPrice);
            }
            // Fallback to gadget price
            const fallbackPrice = isInMalawi 
              ? parsePrice(gadget.price_mwk || gadget.priceMwk || gadget.price)
              : parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price / 2358);
            if (isInMalawi) {
              return `MWK ${Math.round(fallbackPrice).toLocaleString('en-US')}`;
            }
            return formatLocalPrice(fallbackPrice);
          };
          
          return (
            <motion.div className="mt-4 flex flex-col gap-3" variants={summaryContainer}>
              {!hidePrice && (
                <motion.p className="text-gray-400" variants={summaryItem}>Price:
                  <span className="text-white text-2xl font-bold ml-2">
                    From {getPriceDisplay()}
                  </span>
                </motion.p>
              )}
              <motion.p className="text-gray-400" variants={summaryItem}>Stock:
                <span className={isAvailable ? "text-green-500 ml-2" : "text-yellow-400 ml-2"}>
                  {(() => {
                    const vStock = (selectedVariantStock !== null && selectedVariantStock !== undefined) ? selectedVariantStock : stockCount;
                    return vStock > 0 ? "In Stock" : "Coming Soon";
                  })()}
                </span>
              </motion.p>
              {showActions && (
                <motion.button
                  variants={ctaItem}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className={`px-6 py-3 rounded-lg text-white font-bold shadow-lg transition bg-blue-700 hover:bg-blue-800`}
                >
                  Add to Cart
                </motion.button>
              )}
              {showActions && (
                <motion.button
                  variants={ctaItem}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInstallmentOpen(true)}
                  className="px-6 py-3 rounded-lg text-white font-bold shadow-lg transition bg-blue-700 hover:bg-blue-800"
                >
                  Pay in installments
                </motion.button>
              )}
            </motion.div>
          );
        })()}
      </motion.div>
    </motion.div>
  </div>

  {/* Tabs for Product Info, Booking, and Location */}
  <Box sx={{ width: '100%', maxWidth: '4xl', mb: 4 }}>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)}
        variant="fullWidth"
        sx={{ 
          '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
          '& .Mui-selected': { color: 'white' },
          '& .MuiTabs-indicator': { backgroundColor: '#3f51b5' }
        }}
      >
        <Tab label="Product Details" />
        <Tab label="Schedule Viewing" disabled={getStockCount() === 0} />
      </Tabs>
    </Box>
    
    {/* Product Details Tab: keep only content sections (no duplicate summary panel) */}
    <div role="tabpanel" hidden={tabValue !== 0}>
      {tabValue === 0 && (
        <>
        <div className="w-full max-w-4xl mt-4 mx-auto">
          <div className="text-left">
            <h2 className="text-white text-xl mb-4">Description</h2>
            <p className="text-gray-300">{gadget.description}</p>
          </div>
          {gadget.specifications && (
            <div className="mt-8 text-left">
              <h2 className="text-white text-xl mb-4">Specifications</h2>
              <div className="text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(gadget.specifications).map(([key, value]) => {
                  let displayValue = '';
                  try {
                    if (value === null || value === undefined) {
                      displayValue = 'N/A';
                    } else if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (typeof value === 'object') {
                      displayValue = Object.entries(value)
                        .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
                        .join(', ');
                    } else {
                      displayValue = String(value);
                    }
                  } catch (error) {
                    console.warn('Error processing specification:', key, value, error);
                    displayValue = 'Unable to display';
                  }
                  return (
                    <div key={key} className="flex justify-between mb-1">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-right max-w-md">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="mt-10 w-full mx-auto">
          <ReviewsSection gadgetId={gadget.id} />
        </div>
        </>
      )}
    </div>
    
    {/* Booking Tab */}
    <div role="tabpanel" hidden={tabValue !== 1}>
      {tabValue === 1 && (
        <div className="mt-4">
          {/* Authentication and stock availability check */}
          {gadget && (
            <>
              {!isAuthenticated ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  ℹ️ Please sign in to schedule a viewing appointment. <Link to="/signin" className="text-blue-400 hover:underline">Sign in here</Link>
                </Alert>
              ) : (
                <>
                  {(() => {
                    const stockCount = Math.max(0, parseInt(gadget?.stock_quantity ?? gadget?.stockQuantity ?? gadget?.stock ?? 0, 10) || 0);
                    return (
                      <>
                        {stockCount > 0 ? (
                          <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                              ✓ Item in stock - You can schedule a viewing appointment to see it in person at our mobile van!
                            </Alert>
                            <BookingCalendar 
                              gadgetId={gadget.id}
                              gadgetName={gadget.name}
                              onBookingComplete={(details) => {
                                setBookingComplete(true);
                                setSnackbarMessage(`✓ Appointment booked! Confirmation sent to ${details.userEmail}`);
                                setSnackbarOpen(true);
                              }}
                            />
                          </>
                        ) : (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            ❌ This item is currently out of stock and cannot be scheduled for viewing. Please check back soon or subscribe to notifications.
                          </Alert>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
    
  </Box>
</section>

          {/* Installment Modal */}
          {gadget && (
            <InstallmentModal
              open={installmentOpen}
              onClose={() => setInstallmentOpen(false)}
              item={{
                id: gadget.id,
                name: gadget.name,
                price: displayPrice || parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price / 2358),
                priceGbp: displayPrice || parsePrice(gadget.price_gbp || gadget.priceGbp || gadget.price / 2358),
                image: gadget.image,
                condition: selectedCondition || (gadget.condition || gadget.condition_status || 'new'),
                storage: selectedStorage || undefined,
                variantId: variantId,
                description: gadget.description || '',
                specifications: gadget.specifications || null
              }}
              customerEmail={user?.email ?? null}
            />
          )}

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert onClose={() => setSnackbarOpen(false)} severity="success">
              {snackbarMessage}
            </Alert>
          </Snackbar>

      
        </div>
      </div>
      </motion.div>
    </>
  );
};

export default GadgetDetail;
