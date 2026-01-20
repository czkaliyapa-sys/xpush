import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
// Removed MoreVertIcon; wishlist heart will replace header action

import { useCart } from '../contexts/CartContext';
import { usePricing } from '../hooks/usePricing';
import CombinedActionButton from '../components/CombinedActionButton.tsx';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InstallmentModal from '../components/InstallmentModal'
import QuickBookingModal from '../components/QuickBookingModal.tsx'
import CartModal from '../components/CartModal.jsx';
import { recordEvent } from '../services/analyticsApi.js';
import { isGadgetAvailableForPurchase } from '../utils/priceValidation';
import { motion } from 'framer-motion';

interface ItemCard3DProps {
  id: string | number;
  title: string;
  date: string;
  image: string;
  number: number;
  price: string | number; // MWK price
  priceGbp?: string | number; // GBP price
  priceMwk?: string | number; // Explicit MWK price (optional)
  monthlyPrice?: string | number;
  monthlyPriceGbp?: string | number;
  description?: string;
  brand?: string;
  condition?: string;
  category?: string;
  is_pre_order?: boolean | number; // Pre-order status from API
}

const ItemCard3D: React.FC<ItemCard3DProps> = ({
  id,
  title,
  date,
  image,
  number,
  price,
  priceGbp,
  priceMwk,
  monthlyPrice,
  monthlyPriceGbp,
  description,
  brand,
  condition,
  category,
  is_pre_order
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [preOrderCartOpen, setPreOrderCartOpen] = React.useState(false);
  const { addToCart } = useCart();
  const { toggle: toggleWish, isWished } = useWishlist();
  const { user } = useAuth();
  const { currency, isInMalawi, formatLocalPrice } = usePricing();
  const [installmentOpen, setInstallmentOpen] = React.useState(false);
  
  // Check if gadget is available for purchase
  const purchaseAvailability = React.useMemo(() => 
    isGadgetAvailableForPurchase(
      { 
        price, 
        priceMwk, 
        priceGbp, 
        number, 
        in_stock: number > 0,
        isPreOrder: is_pre_order === 1 || is_pre_order === true
      }, 
      isInMalawi ? 'MWK' : 'GBP'
    ), 
    [price, priceMwk, priceGbp, number, is_pre_order, isInMalawi]
  );

  // Determine if item should show pre-order button
  const shouldShowPreOrder = React.useMemo(() => {
    // Show pre-order when:
    // 1. Item is marked as pre-order in database
    // 2. OR item has zero stock (fallback logic)
    const hasZeroStock = number === 0;
    const isMarkedPreOrder = is_pre_order === 1 || is_pre_order === true;
    
    return isMarkedPreOrder || hasZeroStock;
  }, [number, is_pre_order]);
  
  // Debug logging for zero stock items
  React.useEffect(() => {
    if (number === 0 && (price === 0 || price === null)) {
      console.log('🔍 Zero stock item with potential pricing issue:', {
        id,
        title,
        is_pre_order,
        number,
        price,
        priceGbp,
        priceMwk,
        shouldShowPreOrder
      });
    }
  }, [id, title, is_pre_order, number, price, priceGbp, priceMwk, shouldShowPreOrder]);

  // Determine which price to use based on user's location
  // For Malawi users: use MWK price directly (no conversion)
  // For international users: use GBP price (formatLocalPrice handles display)
  const displayPrice = React.useMemo(() => {
    if (isInMalawi) {
      // Malawi users see MWK price directly
      const mwkPrice = priceMwk ?? price;
      const numPrice = typeof mwkPrice === 'string' ? parseFloat(mwkPrice.replace(/[^0-9.]/g, '')) : Number(mwkPrice);
      if (!Number.isFinite(numPrice)) return 'MWK —';
      return `MWK ${Math.round(numPrice).toLocaleString('en-US')}`;
    } else {
      // International users see GBP price
      const gbpPrice = priceGbp ?? price;
      return formatLocalPrice(gbpPrice);
    }
  }, [price, priceGbp, priceMwk, currency, isInMalawi, formatLocalPrice]);

  React.useEffect(() => {
    setShareUrl(`${window.location.origin}/gadgets/${id}`);
  }, [id]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoading(false);
  };

  const getFallbackImage = () => {
    // Return a default placeholder image or SVG
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBjLTguMjg0IDAtMTUgNi43MTYtMTUgMTVzNi43MTYgMTUgMTUgMTUgMTUtNi43MTYgMTUtMTUtNi43MTYtMTUtMTUtMTV6bTAgMjBjLTIuNzYxIDAtNS0yLjIzOS01LTVzMi4yMzktNSA1LTUgNSAyLjIzOSA1IDUtMi4yMzkgNS01IDV6IiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY3Mzg1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+";
  };

  const resolveImageUrl = React.useCallback((src: string | undefined) => {
    if (!src) return getFallbackImage();
    try {
      const isAbsolute = /^https?:\/\//.test(src);
      const base = (process.env.REACT_APP_IMAGES_BASE_URL || 'https://sparkle-pro.co.uk/api/images');
      let path = src.trim();
      // Remove spaces and common stray characters
      path = path.replace(/\s+/g, '').replace(/^\.\//, '').replace(/^\//, '');
      // Fix common filename typos
      path = path.replace(/iphon[\-_.]?13pro/i, 'iphone-13pro');
      path = path.replace(/galaxys23ultra/i, 'galaxy-s23ultra');
      // Normalize domain if absolute but wrong domain used
      if (isAbsolute) {
        const url = new URL(path);
        // If pointing to /api/images already, keep pathname
        if (/\/api\/images\//.test(url.pathname)) {
          return `https://sparkle-pro.co.uk${url.pathname}`;
        }
        // Otherwise, treat last segment as filename under images base
        const fname = url.pathname.split('/').filter(Boolean).pop();
        return `${base}/${fname}`;
      }
      // Relative path or filename
      if (/^api\/images\//.test(path)) {
        return `https://sparkle-pro.co.uk/${path}`;
      }
      // Only filename
      return `${base}/${path}`;
    } catch {
      return src;
    }
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if item is available for purchase
    if (!purchaseAvailability.isValid) {
      setSnackbarMessage(purchaseAvailability.reason);
      setSnackbarOpen(true);
      return;
    }
    
    // Don't return early for zero-stock items - they should be treated as pre-order
    
    setIsProcessing(true);
    
    try {
      const cat = String(category || '').toLowerCase();
      const defaultStorage = ['smartphone','phone','tablet','laptop'].includes(cat) ? '32GB' : undefined;
      // Use appropriate price based on location
      const cartPrice = isInMalawi 
        ? Number(priceMwk ?? price) 
        : Number(priceGbp ?? price);
      // For zero-stock items, mark as pre-order to allow checkout
      const isZeroStockItem = number === 0;
      
      const cartItem = {
        id,
        title,
        price: cartPrice,
        priceGbp: Number(priceGbp ?? price),
        priceMwk: Number(priceMwk ?? price),
        image,
        number,
        brand,
        condition: condition || 'new',
        storage: defaultStorage,
        category,
        description: description || '',
        isPreOrder: isZeroStockItem // Mark zero-stock items as pre-order
      };
      
      console.log('🛒 Adding item to cart:', cartItem);
      
      addToCart(cartItem);
      
      const sid = (typeof window !== 'undefined') ? localStorage.getItem('xp_analytics_sid') : null;
      if (sid) {
        try { recordEvent(sid, 'add_to_cart', { id, title, price: cartPrice, brand, category }); } catch (_) {}
      }
      
      // Ensure snackbar shows with a small delay to allow state updates
      setTimeout(() => {
        setSnackbarMessage('Item added to cart!');
        setSnackbarOpen(true);
        console.log('✅ Snackbar notification shown for item:', title);
      }, 100);
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for pre-order - opens cart modal with pre-order context
  const handlePreOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For pre-order items, validate that we have valid pricing
    // But allow zero stock (that's the whole point of pre-order)
    if (!purchaseAvailability.isValid) {
      setSnackbarMessage(purchaseAvailability.reason);
      setSnackbarOpen(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const cat = String(category || '').toLowerCase();
      const defaultStorage = ['smartphone','phone','tablet','laptop'].includes(cat) ? '32GB' : undefined;
      // Use appropriate price based on location
      const cartPrice = isInMalawi 
        ? Number(priceMwk ?? price) 
        : Number(priceGbp ?? price);
      
      // Add to cart with pre-order flag and treat as available (number=1 for cart purposes)
      const preOrderItem = {
        id,
        title,
        price: cartPrice,
        priceGbp: Number(priceGbp ?? price),
        priceMwk: Number(priceMwk ?? price),
        image,
        number: 1, // Treat as available for pre-order
        brand,
        condition: condition || 'new',
        storage: defaultStorage,
        category,
        description: description || '',
        isPreOrder: true // Mark as pre-order
      };
      
      console.log('🛒 Adding pre-order item to cart:', preOrderItem);
      
      addToCart(preOrderItem);
      
      const sid = (typeof window !== 'undefined') ? localStorage.getItem('xp_analytics_sid') : null;
      if (sid) {
        try { recordEvent(sid, 'pre_order', { id, title, price: cartPrice, brand, category }); } catch (_) {}
      }
      
      // Show notification first
      setSnackbarMessage('Pre-order item added to cart!');
      setSnackbarOpen(true);
      
      // Open the cart modal for pre-order checkout after ensuring state updates
      // Longer delay to allow React context state to propagate and notification to show
      setTimeout(() => {
        console.log('📦 Opening pre-order cart modal');
        setPreOrderCartOpen(true);
      }, 300);
    } catch (error) {
      console.error('Pre-order error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareDialogOpen(true);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const strId = String(id);
    const wasWished = isWished(strId);
    toggleWish(strId);
    const sid = (typeof window !== 'undefined') ? localStorage.getItem('xp_analytics_sid') : null;
    if (sid) {
      try { recordEvent(sid, wasWished ? 'wishlist_remove' : 'wishlist_add', { id, title, brand, category }); } catch (_) {}
    }
    setSnackbarMessage(wasWished ? 'Removed from wishlist!' : 'Added to wishlist!');
    setSnackbarOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackbarMessage('Link copied to clipboard!');
      setSnackbarOpen(true);
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleViewInGadgetDetail = () => {
    window.open(shareUrl, '_blank');
    setShareDialogOpen(false);
  };

  // Determine stock status - check multiple possible field names
  const resolveStockQuantity = () => {
    // Try different possible stock field names and formats
    if (typeof number === 'number' && Number.isFinite(number)) {
      return number;
    }
    return 0;
  };

  const stockQuantity = resolveStockQuantity();
  const outOfStock = stockQuantity === 0;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
      <Card
        sx={{
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { xs: 'none', sm: 380, md: 320 },
          mx: { xs: 'auto', sm: 0 },
          backgroundColor: "#1565c0",
          borderRadius: "30px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignSelf: "flex-start",
          padding: "20px",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: `2px 2px 5px #0c3266, -2px -2px 5px #1a5bbf`,
            transform: "scale(1.05)",
          },
        }}
      >
        <CardHeader
          action={
            <IconButton 
              aria-label={isWished(String(id)) ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={handleWishlistToggle}
              sx={{ color: 'white' }}
            >
              {isWished(String(id)) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
          }
          title={<Typography variant="h6" sx={{ color: 'white', fontWeight: 700, textAlign: 'center', display: 'block' }}>{title}</Typography>}
          subheader={
             <span style={{ color: 'white', opacity: 0.9, fontSize: '0.9rem', fontWeight: 600, display: 'block', textAlign: 'center' }}>
               {outOfStock
                 ? 'Out of Stock · Coming Soon'
                 : (stockQuantity < 20 ? 'Available now · Limited Amount' : 'Available now')}
             </span>
           }
        />

        <div
          style={{
            width: "100%",
            height: "240px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            borderRadius: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.1)"
          }}
        >
          {imageLoading && !imageError && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "14px"
            }}>
              Loading...
            </div>
          )}
          
          <motion.img 
            layoutId={`gadget-media-${id}`}
            src={imageError ? getFallbackImage() : image}
            style={{ 
              width: "95%", 
              height: "auto",
              maxHeight: "100%",
              display: imageLoading && !imageError ? "none" : "block",
              objectFit: "contain",
              opacity: imageError ? 0.7 : 1
            }} 
            alt={title}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          
          {imageError && (
            <div style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              backgroundColor: "rgba(255, 165, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "bold"
            }}>
              Image Unavailable
            </div>
          )}
        </div>

        <CardContent>
          {description && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, fontSize: '0.9rem' }}>
               {description.length > 80 ? `${description.substring(0, 80)}...` : description}
             </Typography>
          )}
        </CardContent>

        <CardActions 
          disableSpacing 
          sx={{
            flexDirection: 'column',
            gap: 1,
            alignItems: 'stretch'
          }}
        >
          {/* Show Pre-Order button ONLY when pre-order mode, otherwise show normal buttons */}
          {shouldShowPreOrder ? (
            /* PRE-ORDER BUTTON - Only visible when item is out of stock */
            <Box
              sx={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #0b1220 0%, #050a14 100%)',
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                display: 'flex',
                alignItems: 'stretch',
                opacity: purchaseAvailability.isValid ? 1 : 0.6,
                '&:hover': {
                  transform: purchaseAvailability.isValid ? 'translateY(-2px)' : 'none',
                  boxShadow: purchaseAvailability.isValid 
                    ? '0 14px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)' 
                    : '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                },
                '&:active': {
                  transform: purchaseAvailability.isValid ? 'translateY(-1px)' : 'none',
                  boxShadow: purchaseAvailability.isValid 
                    ? '0 12px 26px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
                    : '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                },
              }}
            >
              <ButtonBase
                onClick={handlePreOrder}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={isProcessing || !purchaseAvailability.isValid}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: { xs: 3, sm: 2.75 },
                  py: { xs: 1.75, sm: 1.35 },
                  color: 'white',
                  transition: 'background-color 160ms ease',
                  backgroundColor: 'transparent',
                  cursor: purchaseAvailability.isValid ? 'pointer' : 'not-allowed',
                  '&:hover': { 
                    backgroundColor: purchaseAvailability.isValid ? 'rgba(255, 255, 255, 0.1)' : 'transparent' 
                  },
                  '&:active': { 
                    backgroundColor: purchaseAvailability.isValid ? 'rgba(255, 255, 255, 0.15)' : 'transparent' 
                  },
                }}
              >
                <ShoppingCartIcon sx={{ color: 'white', fontSize: { xs: 20, sm: 19 } }} />
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '0.9rem' } }}
                >
                  {isProcessing 
                    ? 'Processing...' 
                    : purchaseAvailability.isValid 
                      ? 'Pre-Order Now' 
                      : 'Price not set'}
                </Typography>
              </ButtonBase>
            </Box>
          ) : (
            /* NORMAL BUTTONS - Visible when item is in stock */
            <>
              {(() => {
                const priceLabel = isProcessing
                  ? 'Adding...'
                  : purchaseAvailability.isValid
                    ? `From ${displayPrice}`
                    : 'Price not set';
                
                const buttonDisabled = isProcessing || !purchaseAvailability.isValid;
                
                return (
                  <CombinedActionButton
                    onAddToCart={handleAddToCart}
                    addDisabled={buttonDisabled}
                    priceLabel={priceLabel}
                  />
                );
              })()}

              {/* Installments button appears directly underneath the combined action control */}
              <Box
                sx={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #0b1220 0%, #050a14 100%)',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  display: 'flex',
                  alignItems: 'stretch',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 12px 26px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  },
                }}
              >
                <ButtonBase
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if item is available for installment purchase
                    if (!purchaseAvailability.isValid) {
                      setSnackbarMessage(purchaseAvailability.reason);
                      setSnackbarOpen(true);
                      return;
                    }
                    
                    setInstallmentOpen(true);
                  }}
                  onMouseDown={(e) => {
                    // Extra guard to prevent parent Link from handling navigation
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: { xs: 3, sm: 2.75 },
                    py: { xs: 1.75, sm: 1.35 },
                    color: 'white',
                    transition: 'background-color 160ms ease',
                    backgroundColor: 'transparent',
                    opacity: purchaseAvailability.isValid ? 1 : 0.6,
                    cursor: purchaseAvailability.isValid ? 'pointer' : 'not-allowed',
                    '&:hover': { 
                      backgroundColor: purchaseAvailability.isValid ? 'rgba(59, 130, 246, 0.18)' : 'transparent' 
                    },
                    '&:active': { 
                      backgroundColor: purchaseAvailability.isValid ? 'rgba(59, 130, 246, 0.28)' : 'transparent' 
                    },
                  }}
                >
                  <PaymentsIcon sx={{ color: 'white', fontSize: { xs: 20, sm: 19 } }} />
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '0.9rem' } }}
                  >
                    Buy / Use 
                    in installments
                  </Typography>
                </ButtonBase>
              </Box>

              {/* Book Viewing button */}
              <Box
                sx={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #0b1220 0%, #050a14 100%)',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  display: 'flex',
                  alignItems: 'stretch',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 12px 26px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  },
                }}
              >
                <ButtonBase
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBookingOpen(true);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: { xs: 3, sm: 2.75 },
                    py: { xs: 1.75, sm: 1.35 },
                    color: 'white',
                    transition: 'background-color 160ms ease',
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.18)' },
                    '&:active': { backgroundColor: 'rgba(59, 130, 246, 0.28)' },
                  }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 18 }} />
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '0.9rem' } }}
                  >
                    Book Viewing
                  </Typography>
                </ButtonBase>
              </Box>
            </>
          )}
        </CardActions>
      </Card>
      </motion.div>

      {/* Pre-Order Cart Modal */}
      <CartModal 
        open={preOrderCartOpen} 
        onClose={() => setPreOrderCartOpen(false)}
        gadget={null}
      />

      <InstallmentModal
        open={installmentOpen}
        onClose={() => setInstallmentOpen(false)}
        item={{ id, name: title, price, priceGbp: priceGbp || price, priceMwk: priceMwk || price, image, condition, description: description || '' }}
        customerEmail={user?.email ?? null}
      />

      <QuickBookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        gadgetId={id}
        gadgetName={title}
        gadgetImage={image}
      />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share this item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Share URL"
            value={shareUrl}
            InputProps={{
              readOnly: true,
            }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCopyLink} variant="contained">Copy Link</Button>
          <Button onClick={handleViewInGadgetDetail} variant="outlined">View in Gadget Detail</Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default ItemCard3D;