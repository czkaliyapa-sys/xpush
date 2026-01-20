import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
  Divider,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Star as StarIcon,
  LocalShipping as DeliveryIcon,
  Shield as InsuranceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Diamond as DiamondIcon,
  Bolt as BoltIcon,
  WorkspacePremium as PremiumIcon,
  Whatshot as WhatshotIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { usePricing } from '../hooks/usePricing';
import { useLocation } from '../contexts/LocationContext';
import { formatMWK } from '../utils/formatters';
import { paymentsAPI, gadgetsAPI, subscriptionsAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { recordEvent } from '../services/analyticsApi.js';
import AuthAlertModal from './AuthAlertModal.tsx';
import { SUBSCRIPTION_PLAN, getSubscriptionStatus } from '../services/paymentService.js';

const CartModal = ({ open, onClose, gadget }) => {
  const { items, removeFromCart, updateQuantity, updateItemStock, updateItemCondition, updateItemStorage, updateItemColor, updateItemPrice, updateItemPriceGbp, updateItemPriceMwk, updateItemVariantId, clearCart, getCartTotal, addToCart } = useCart();
  const { user, userProfile } = useAuth();
  const { currency, formatLocalPrice } = usePricing();
  const { country, isMalawi } = useLocation();
  const navigate = useNavigate();
  // Enhanced processing state with status tracking
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    'Validating cart items...',
    'Checking inventory...',
    'Preparing payment session...',
    'Redirecting to payment gateway...'
  ];
  // Payment method auto-selected based on location
  const [selectedPayment, setSelectedPayment] = useState(isMalawi ? 'paychangu' : 'square');
  const [userCountry, setUserCountry] = useState('');
  const [detectedCountry, setDetectedCountry] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [storageOptionsMap, setStorageOptionsMap] = useState({});
  const [variantsMap, setVariantsMap] = useState({});
  const [conditionOptionsMap, setConditionOptionsMap] = useState({});
  const [colorOptionsMap, setColorOptionsMap] = useState({});
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  // Handler for subscription tier selection with validation
  const handleSubscriptionSelect = (tier) => {
    // If user already has this subscription tier, prevent selection
    if (hasSubscription && subscriptionTier === tier) {
      alert(`You already have an active ${tier === 'premium' ? 'Premium' : 'Plus'} subscription. You cannot purchase the same tier again.`);
      return;
    }
    
    // If user has a different tier, show upgrade/downgrade confirmation
    if (hasSubscription && subscriptionTier && subscriptionTier !== tier) {
      const isUpgrade = subscriptionTier === 'plus' && tier === 'premium';
      const confirmMsg = isUpgrade
        ? `Upgrade to Premium? Your current Plus subscription will be replaced. You'll get coverage for all your devices.`
        : `Downgrade to Plus? Your current Premium subscription will be replaced. Only ONE device will be covered.`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    setSelectedSubscription(tier);
    // Only reset agreement when switching between subscription tiers (Plus/Premium)
    // Keep agreement when switching to/from Standard delivery ('none')
    if (tier !== 'none' && selectedSubscription !== 'none') {
      setAgreedToTerms(false);
    }
  };

  // Subscription state - now with Plus and Premium tiers
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState(null); // null = no subscription, 'plus', 'premium'
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState('none'); // 'none', 'plus', 'premium'
  const [agreedToTerms, setAgreedToTerms] = useState(false); // Policy agreement checkbox
  // Collapsible description state per item
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
  // Update payment method when location changes
  useEffect(() => {
    setSelectedPayment(isMalawi ? 'paychangu' : 'square');
  }, [isMalawi]);

  // Check subscription status for users
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.uid || !open) return;
      setLoadingSubscription(true);
      try {
        const status = await getSubscriptionStatus(user.uid);
        setHasSubscription(status?.isActive || status?.hasSubscription || false);
        setSubscriptionTier(status?.tier || null); // 'plus' or 'premium'
      } catch (err) {
        console.error('Failed to check subscription:', err);
        setHasSubscription(false);
        setSubscriptionTier(null);
      } finally {
        setLoadingSubscription(false);
      }
    };
    checkSubscription();
  }, [user, open]);

  // Refresh cart item prices when modal opens to fix existing items with wrong prices
  useEffect(() => {
    const refreshPrices = async () => {
      if (open && items.length > 0) {
        console.log('Refreshing cart item prices...');
        
        // Process all items in parallel
        const refreshPromises = items.map(async (item) => {
          try {
            // Always fetch fresh gadget data to ensure we have latest pricing
            console.log(`Fetching fresh data for item ${item.id}`);
            const response = await gadgetsAPI.getById(item.id);
            
            if (response?.success && response?.data) {
              const gadgetData = response.data;
              console.log(`Got gadget data for ${item.id}:`, {
                lowest_variant_price_gbp: gadgetData.lowest_variant_price_gbp,
                lowest_variant_price: gadgetData.lowest_variant_price,
                price_gbp: gadgetData.price_gbp,
                price: gadgetData.price
              });
              
              // Use variant-based pricing if available, with fallback chain
              const effectivePrice = gadgetData.lowest_variant_price_gbp || 
                                   gadgetData.lowest_variant_price || 
                                   gadgetData.price_gbp || 
                                   gadgetData.price_mwk || 
                                   gadgetData.price || 0;
              
              const effectivePriceGbp = gadgetData.lowest_variant_price_gbp || 
                                      gadgetData.price_gbp || 
                                      gadgetData.price || 0;
              
              const effectivePriceMwk = gadgetData.lowest_variant_price_mwk || 
                                      gadgetData.price_mwk || 
                                      gadgetData.price || 0;
              
              console.log(`Updating item ${item.id} prices:`, {
                oldPrice: item.price,
                oldPriceGbp: item.price_gbp,
                oldPriceMwk: item.price_mwk,
                newPrice: effectivePrice,
                newPriceGbp: effectivePriceGbp,
                newPriceMwk: effectivePriceMwk
              });
              
              // Update all price fields to ensure consistency
              updateItemPrice(item.id, effectivePrice);
              updateItemPriceGbp(item.id, effectivePriceGbp);
              updateItemPriceMwk(item.id, effectivePriceMwk);
              
              return { id: item.id, success: true };
            }
            return { id: item.id, success: false, reason: 'No gadget data' };
          } catch (error) {
            console.error('Failed to refresh price for item', item.id, error);
            return { id: item.id, success: false, error: error.message };
          }
        });
        
        // Wait for all price refreshes to complete
        const results = await Promise.all(refreshPromises);
        console.log('Price refresh results:', results);
        
        // Force total recalculation by updating refresh trigger
        console.log('Triggering total recalculation after price refresh');
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    refreshPrices();
  }, [open, items, updateItemPrice, updateItemPriceGbp, updateItemPriceMwk]);

  // Add gadget to cart when modal opens with a gadget prop
  useEffect(() => {
    if (open && gadget && gadget.id) {
      console.log('📦 CartModal: Adding gadget to cart', {
        id: gadget.id,
        name: gadget.name || gadget.title,
        priceFields: {
          lowest_variant_price_gbp: gadget.lowest_variant_price_gbp,
          lowest_variant_price: gadget.lowest_variant_price,
          price_gbp: gadget.price_gbp,
          price_mwk: gadget.price_mwk,
          price: gadget.price
        }
      });
      
      // Use variant-based pricing if available
      const effectivePrice = gadget.lowest_variant_price_gbp || gadget.lowest_variant_price || 
                            gadget.price_gbp || gadget.price_mwk || gadget.price || 0;
      
      const cartItem = {
        id: gadget.id,
        title: gadget.name || gadget.title,
        brand: gadget.brand || '',
        price: effectivePrice,
        price_gbp: gadget.lowest_variant_price_gbp || gadget.price_gbp || gadget.price || 0,
        price_mwk: gadget.lowest_variant_price_mwk || gadget.price_mwk || gadget.price || 0,
        image: gadget.image || '',
        condition: 'like_new',
        quantity: 1,
        isPreOrder: gadget.is_pre_order === 1 || gadget.is_pre_order === true || gadget.number === 0
      };
      
      console.log('🛒 CartModal: Final cart item to add:', cartItem);
      addToCart(cartItem);
    }
  }, [open, gadget, addToCart]);

  // Condition label/token mapping for selector
  const CONDITION_TOKEN_TO_LABEL = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair'
  };

  const handleConditionSelect = (itemId, selectedLabel) => {
    const token = CONDITION_LABEL_TO_TOKEN[selectedLabel] || selectedLabel;
    updateItemCondition(itemId, token);
    resolveAndApplyVariant(itemId);
  };
  const CONDITION_LABEL_TO_TOKEN = {
    'New': 'new',
    'Like New': 'like_new',
    'Good': 'good',
    'Fair': 'fair'
  };
  const ALLOWED_CONDITION_TOKENS = ['new','like_new','good','fair'];
  const CONDITION_OPTIONS_FALLBACK = ['New', 'Like New', 'Good', 'Fair'];

  // Detect user's location when modal opens
  useEffect(() => {
    if (open) {
      detectUserLocation();
    }
  }, [open]);

  // Sync live stock when modal opens
  useEffect(() => {
    const syncLiveStock = async () => {
      try {
        const fetches = await Promise.all(
          items.map(async (it) => {
            try {
              const res = await gadgetsAPI.getById(it.id);
              if (res?.success && res?.data) {
                const rawStock = (res.data.stockQuantity ?? res.data.stock ?? res.data.in_stock ?? 0);
                const live = Math.max(0, parseInt(rawStock, 10) || 0);
                const specs = res.data.specifications || {};
                const variants = Array.isArray(res.data.variants)
                  ? res.data.variants
                      .map(v => ({
                        ...v,
                        condition_status: v.condition_status ?? v.condition,
                        stock_quantity: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity,
                        is_active: typeof v.is_active !== 'undefined' ? v.is_active : v.active
                      }))
                      .filter(v => ((v?.is_active ?? 1) === 1) && String(v.condition_status) !== 'poor')
                  : [];
                // Storage options priority order:
                // 1. Admin-created variants (highest priority - always shown if they exist)
                // 2. Main gadget storage field (if set by admin)
                // 3. Category-based defaults (only if no admin-set values exist)
                const storageFromVariants = variants.length > 0
                  ? Array.from(new Set(variants.map(v => v.storage).filter(Boolean)))
                  : [];
                const mainGadgetStorage = res.data?.storage || it?.storage;
                // Category-based default storage (only used if no variants or main storage)
                const categoryLower = (res.data?.category || it?.category || '').toLowerCase();
                let defaultStorage = null;
                if (categoryLower.includes('smartphone') || categoryLower.includes('phone') || categoryLower.includes('iphone') || categoryLower.includes('samsung')) {
                  defaultStorage = '256GB';
                } else if (categoryLower.includes('laptop') || categoryLower.includes('macbook')) {
                  defaultStorage = '512GB';
                }
                // Apply priority: variants > main gadget > category default
                const storageOpts = storageFromVariants.length > 0
                  ? storageFromVariants
                  : (mainGadgetStorage ? [mainGadgetStorage] : (defaultStorage ? [defaultStorage] : []));
                // Extract color options from variants
                const colorOpts = variants.length > 0
                  ? Array.from(new Map(
                      variants
                        .filter(v => v.color)
                        .map(v => [v.color, { name: v.color, hex: v.color_hex }])
                    ).values())
                  : [];
                // Condition options priority order:
                // 1. Admin-created variant conditions (highest priority - always shown if they exist)
                // 2. Main gadget condition field (fallback if no variants exist)
                const condTokensFromVariants = variants.length > 0
                  ? Array.from(new Set(
                      variants
                        .map(v => String(v.condition_status))
                        .filter(Boolean)
                        .map(t => t.toLowerCase())
                        .filter(t => ALLOWED_CONDITION_TOKENS.includes(t))
                    ))
                  : [];
                const rawFallback = String(res.data?.condition || res.data?.condition_status || it?.condition || 'new').toLowerCase();
                const fallbackCondToken = ALLOWED_CONDITION_TOKENS.includes(rawFallback) ? rawFallback : 'new';
                const condTokens = condTokensFromVariants.length > 0 ? condTokensFromVariants : [fallbackCondToken];
                const condLabels = condTokens.map(t => CONDITION_TOKEN_TO_LABEL[t] || t);
                return { id: it.id, stock: live, storageOptions: storageOpts, colorOptions: colorOpts, variants, conditionLabels: condLabels, conditionTokens: condTokens };
              }
            } catch (e) {
              console.warn('Stock/specs sync error for item', it.id, e);
            }
            // Fallbacks
            return { id: it.id, stock: it.number || 0, storageOptions: [], colorOptions: [], variants: variantsMap[it.id] || [], conditionLabels: conditionOptionsMap[it.id] || CONDITION_OPTIONS_FALLBACK, conditionTokens: [] };
          })
        );
        // Apply stock updates and collect storage options and variants
        const newStorageMap = { ...storageOptionsMap };
        const newVariantsMap = { ...variantsMap };
        const newConditionMap = { ...conditionOptionsMap };
        const newColorMap = { ...colorOptionsMap };
        fetches.forEach((u) => {
          updateItemStock(u.id, u.stock);
          // Handle color options
          if (u.colorOptions && u.colorOptions.length > 0) {
            newColorMap[u.id] = u.colorOptions;
            const cartItem = items.find(ci => ci.id === u.id);
            if (cartItem && !cartItem.color) {
              updateItemColor(u.id, u.colorOptions[0]?.name);
            }
          } else {
            newColorMap[u.id] = [];
          }
          if (u.storageOptions && u.storageOptions.length > 0) {
            newStorageMap[u.id] = u.storageOptions;
            // Set default storage if none selected
            const cartItem = items.find(ci => ci.id === u.id);
            if (cartItem && !cartItem.storage) {
              updateItemStorage(u.id, u.storageOptions[0]);
            }
          } else {
            // No variant-defined storage: clear any stale storage selection
            const cartItem = items.find(ci => ci.id === u.id);
            if (cartItem && cartItem.storage) {
              updateItemStorage(u.id, undefined);
            }
            newStorageMap[u.id] = [];
          }
          if (u.conditionLabels && u.conditionLabels.length > 0) {
            newConditionMap[u.id] = u.conditionLabels;
            const cartItem = items.find(ci => ci.id === u.id);
            const condToken = cartItem?.condition || undefined;
            const allowedTokens = u.conditionTokens || [];
            const normalizedCond = condToken && ALLOWED_CONDITION_TOKENS.includes(String(condToken).toLowerCase())
              ? String(condToken).toLowerCase()
              : allowedTokens[0] || 'new';
            if (!condToken || !allowedTokens.includes(condToken)) {
              updateItemCondition(u.id, normalizedCond);
            }
          }
          if (u.variants && u.variants.length > 0) {
            newVariantsMap[u.id] = u.variants;
            const cartItem = items.find(ci => ci.id === u.id);
            const cond = cartItem?.condition || 'new';
            const stor = cartItem?.storage || (u.storageOptions && u.storageOptions[0]);
            const clr = cartItem?.color || (u.colorOptions && u.colorOptions[0]?.name);
            if (stor || clr) {
              const normalizedCond = (cond === 'poor') ? 'new' : cond;
              if (cond === 'poor') { updateItemCondition(u.id, normalizedCond); }
              // Match variant by color + storage + condition
              const match = u.variants.find(v => 
                (!clr || String(v.color) === String(clr)) &&
                (!stor || String(v.storage) === String(stor)) &&
                String(v.condition_status) === String(normalizedCond)
              );
              if (match) {
                // Preserve currency-specific pricing when updating variant match
                const variantPriceGbp = match.price_gbp || match.priceGbp || match.price || 0;
                const variantPriceMwk = match.price_mwk || match.priceMwk || match.price || 0;
                
                // Update ALL price fields to maintain dual-currency support
                updateItemPrice(u.id, isMalawi ? variantPriceMwk : variantPriceGbp);
                updateItemPriceGbp(u.id, variantPriceGbp);
                updateItemPriceMwk(u.id, variantPriceMwk);
                updateItemVariantId(u.id, match.id);
                const vStock = Math.max(0, parseInt(match.stock_quantity ?? 0, 10) || 0);
                updateItemStock(u.id, vStock);
              }
            }
          }
        });
        setStorageOptionsMap(newStorageMap);
        setVariantsMap(newVariantsMap);
        setConditionOptionsMap(newConditionMap);
        setColorOptionsMap(newColorMap);
      } catch (err) {
        console.warn('Stock sync error:', err);
      }
    };
    if (open && items.length > 0) {
      syncLiveStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Check if user has manually set their country
      const savedCountry = localStorage.getItem('userCountry');
      if (savedCountry) {
        setUserCountry(savedCountry);
        setDetectedCountry(savedCountry);
        updatePaymentMethod(savedCountry);
        return;
      }
      
      // Fallback to IP geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code;
      setDetectedCountry(countryCode);
      setUserCountry(countryCode);
      updatePaymentMethod(countryCode);
      
      console.log('🌍 Location detected:', countryCode);
    } catch (error) {
      console.warn('Could not detect user location:', error);
      setDetectedCountry('Unknown');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const updatePaymentMethod = (countryCode) => {
    // Use PayChangu as the only payment method
    setSelectedPayment('paychangu');
  };

  const handleColorSelect = (itemId, value) => {
    updateItemColor(itemId, value);
    // After updating color, check if current storage/condition is still available
    setTimeout(() => resolveAndApplyVariant(itemId, value), 0);
  };

  const handleStorageSelect = (itemId, value) => {
    updateItemStorage(itemId, value);
    // After updating storage, auto-select first available condition
    const variants = variantsMap[itemId] || [];
    const cartItem = items.find(ci => ci.id === itemId);
    const currentCondition = cartItem?.condition || 'new';
    
    // Check if current condition is available for this storage
    const availableForStorage = variants.filter(v => 
      v.storage === value && parseInt(v.stock_quantity ?? 0, 10) > 0
    );
    const conditionAvailable = availableForStorage.some(v => v.condition_status === currentCondition);
    
    if (!conditionAvailable && availableForStorage.length > 0) {
      // Auto-select first available condition
      const firstAvailable = availableForStorage[0];
      updateItemCondition(itemId, firstAvailable.condition_status);
    }
    
    setTimeout(() => resolveAndApplyVariant(itemId), 0);
  };

  const resolveAndApplyVariant = (itemId, overrideColor = null) => {
    const cartItem = items.find(ci => ci.id === itemId);
    if (!cartItem) return;
    const selectedColor = overrideColor || cartItem.color;
    const selectedStorage = cartItem.storage;
    const selectedCondition = cartItem.condition || 'new';
    const variants = variantsMap[itemId] || [];
    if (variants.length === 0) return;
    // Match by color + storage + condition
    const match = variants.find(v => 
      (!selectedColor || String(v.color) === String(selectedColor)) &&
      (!selectedStorage || String(v.storage) === String(selectedStorage)) &&
      String(v.condition_status) === String(selectedCondition)
    );
    if (match) {
      // Preserve currency-specific pricing when resolving variant
      const variantPriceGbp = match.price_gbp || match.priceGbp || match.price || 0;
      const variantPriceMwk = match.price_mwk || match.priceMwk || match.price || 0;
      
      // Update ALL price fields to maintain dual-currency support
      const effectivePrice = isMalawi ? variantPriceMwk : variantPriceGbp;
      updateItemPrice(itemId, effectivePrice);
      updateItemPriceGbp(itemId, variantPriceGbp);
      updateItemPriceMwk(itemId, variantPriceMwk);
      updateItemVariantId(itemId, match.id);
      const vStock = Math.max(0, parseInt(match.stock_quantity ?? 0, 10) || 0);
      updateItemStock(itemId, vStock);
    }
  };
  
  // Helper to check if a variant combination has stock
  const getVariantStock = (itemId, storage, condition) => {
    const variants = variantsMap[itemId] || [];
    const match = variants.find(v => 
      v.storage === storage && v.condition_status === condition
    );
    return match ? parseInt(match.stock_quantity ?? 0, 10) : 0;
  };
  
  // Get available conditions for a specific storage with stock info
  const getConditionsWithStock = (itemId, storage) => {
    const variants = variantsMap[itemId] || [];
    const condLabels = conditionOptionsMap[itemId] || CONDITION_OPTIONS_FALLBACK;
    
    if (!storage || variants.length === 0) {
      return condLabels.map(label => ({ label, hasStock: true }));
    }
    
    return condLabels.map(label => {
      const token = CONDITION_LABEL_TO_TOKEN[label] || label;
      const match = variants.find(v => v.storage === storage && v.condition_status === token);
      const stock = match ? parseInt(match.stock_quantity ?? 0, 10) : 0;
      return { label, token, hasStock: stock > 0, stock };
    });
  };
  
  // Get storage options with stock info
  const getStoragesWithStock = (itemId) => {
    const variants = variantsMap[itemId] || [];
    const storageOpts = storageOptionsMap[itemId] || [];
    
    return storageOpts.map(storage => {
      const hasStock = variants.some(v => 
        v.storage === storage && parseInt(v.stock_quantity ?? 0, 10) > 0
      );
      return { storage, hasStock };
    });
  };

  const handleCountryChange = (event) => {
    const newCountry = event.target.value;
    setUserCountry(newCountry);
    localStorage.setItem('userCountry', newCountry);
    updatePaymentMethod(newCountry);
  };

  // Normalize stock to integer
  const coerceStock = (val) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  // Resolve live stock & variant match for an item
  const fetchLiveStockForItem = async (item) => {
    const res = await gadgetsAPI.getById(item.id);
    if (!res?.success || !res?.data) {
      return { ok: false, message: `${item.title || 'Item'} could not be validated. Try again.` };
    }

    const data = res.data;
    const variants = Array.isArray(data.variants) ? data.variants : [];
    let matchedVariantId = null;
    let availableStock = 0;

    if (variants.length > 0) {
      const match = variants.find((v) => {
        const cond = (v.condition_status || v.condition || 'new').toString().toLowerCase();
        const targetCond = (item.condition || 'new').toString().toLowerCase();
        const storageOk = item.storage ? String(v.storage) === String(item.storage) : true;
        const colorOk = item.color ? String(v.color) === String(item.color) : true;
        return storageOk && colorOk && cond === targetCond;
      });

      if (match) {
        matchedVariantId = match.id ?? null;
        availableStock = coerceStock(match.stock_quantity ?? match.stock);
      } else {
        // If no exact match, consider max available among variants
        availableStock = Math.max(...variants.map((v) => coerceStock(v.stock_quantity ?? v.stock)), 0);
      }
    } else {
      availableStock = coerceStock(data.stock_quantity ?? data.stock ?? data.in_stock ?? data.number);
    }

    return { ok: true, availableStock, matchedVariantId };
  };

  const validateStockBeforeCheckout = async () => {
    const issues = [];

    for (const item of items) {
      const result = await fetchLiveStockForItem(item);
      if (!result.ok) {
        issues.push(result.message);
        continue;
      }

      const { availableStock, matchedVariantId } = result;

      // Update variant id so backend can decrement correct record
      if (matchedVariantId) {
        updateItemVariantId(item.id, matchedVariantId);
      }

      // Update local stock cache
      updateItemStock(item.id, availableStock);

      if (availableStock <= 0) {
        removeFromCart(item.id);
        issues.push(`${item.title || 'Item'} is now out of stock and was removed from your cart.`);
        continue;
      }

      if (availableStock < item.quantity) {
        updateQuantity(item.id, availableStock);
        issues.push(`${item.title || 'Item'} quantity reduced to ${availableStock} based on live stock.`);
      }
    }

    if (issues.length > 0) {
      alert(issues.join('\n'));
      return false;
    }
    return true;
  };

  // Quantity adjustments are disabled in cart modal per requirements.

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    // Check if user is authenticated
    if (!user || !user.uid) {
      setAuthAlertOpen(true);
      return;
    }
    
    // Block checkout if any item is out of stock or has zero quantity
    // Exception: Allow pre-order items (isPreOrder: true) even with zero stock
    console.log('🔐 Checkout validation - items:', items.map(it => ({
      id: it.id,
      title: it.title,
      number: it.number,
      quantity: it.quantity,
      isPreOrder: it.isPreOrder,
      isValid: ((it?.number || 0) > 0 || it?.isPreOrder) && ((it?.quantity || 0) > 0 || it?.isPreOrder)
    })));
    
    const hasInvalidItem = items.some(it => {
      const isInvalid = ((it?.number || 0) <= 0 && !it?.isPreOrder) || 
                       ((it?.quantity || 0) <= 0 && !it?.isPreOrder);
      console.log(`Item ${it.id} (${it.title}): number=${it.number}, quantity=${it.quantity}, isPreOrder=${it.isPreOrder}, isInvalid=${isInvalid}`);
      return isInvalid;
    });
    if (hasInvalidItem) {
      alert('Your cart contains out-of-stock items. Please remove them before checkout.');
      return;
    }
    
    // Validate required profile fields
    const missingFields = [];
    if (!userProfile?.email?.trim()) missingFields.push('Email');
    if (!userProfile?.fullName?.trim()) missingFields.push('Full Name');
    if (!userProfile?.address?.trim()) missingFields.push('Address');
    
    if (missingFields.length > 0) {
      alert(`Please complete your profile before checkout. Missing: ${missingFields.join(', ')}`);
      try { navigate('/dashboard/settings'); } catch (_) {}
      return;
    }
    
    const stockOk = await validateStockBeforeCheckout();
    if (!stockOk) return;

    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingStatus(processingSteps[0]);

    try {
      // Step 1: Validate cart items
      setProcessingStep(1);
      setProcessingStatus(processingSteps[1]);
      
      // Record checkout_start event for analytics
      const sid = (typeof window !== 'undefined') ? localStorage.getItem('xp_analytics_sid') : null;
      if (sid) {
        const payload = {
          items: items.map(it => ({ id: it.id, title: it.title, quantity: it.quantity, price: it.price })),
          payment: selectedPayment,
          total: finalTotal
        };
        try { await recordEvent(sid, 'checkout_start', payload); } catch (_) {}
      }
      
      // Convert cart items to backend format
      const itemsForPayment = items.map(item => {
        let price;
        // Use appropriate price based on location
        if (isMalawi) {
          price = parseFloat(item.price_mwk || item.priceMwk || item.price) || 0;
        } else {
          price = parseFloat(item.price_gbp || item.priceGbp || item.price) || 0;
        }
        return {
          id: item.id,
          name: item.title,
          price,
          quantity: item.quantity,
          image: item.image,
          brand: item.brand,
          color: item.color || undefined,
          condition: item.condition || 'new',
          storage: item.storage || undefined
        };
      });

      // Extra safety: exclude any zero-quantity items
      const filteredItemsForPayment = itemsForPayment.filter(i => i.quantity > 0);
      let sessionItems = filteredItemsForPayment.map(it => ({
        ...it,
        variantId: items.find(ci => ci.id === it.id)?.variantId || undefined
      }));
      
      // Add delivery fee as a separate line item if applicable
      if (deliveryFee > 0) {
        sessionItems.push({
          id: 'delivery_fee',
          name: isMalawi ? 'Standard Delivery' : 'Standard Postage',
          price: deliveryFee,
          quantity: 1,
          isDeliveryFee: true
        });
      }
      
      // Add subscription fee as a separate line item if applicable
      if (subscriptionFee > 0 && subscriptionToInclude) {
        const subscriptionNames = {
          'plus': 'Xtrapush Plus',
          'premium': 'Xtrapush Premium'
        };
        sessionItems.push({
          id: `subscription_${subscriptionToInclude}`,
          name: `${subscriptionNames[subscriptionToInclude] || 'Subscription'} (Monthly)` ,
          price: subscriptionFee,
          quantity: 1,
          isSubscription: true,
          note: 'Free delivery, insurance & discounts - Monthly subscription'
        });
      }
      
      // Step 2: Prepare payment session
      setProcessingStep(2);
      setProcessingStatus(processingSteps[2]);
      
      let session;
      const paymentCurrency = isMalawi ? 'MWK' : 'GBP';
      const subscriptionToInclude = selectedSubscription !== 'none' && !hasSubscription ? selectedSubscription : null;
      
      if (isMalawi) {
        // Use PayChangu for Malawi (MWK)
        session = await paymentsAPI.createCheckoutSession(sessionItems, {
          successUrl: 'https://itsxtrapush.com/payment/success',
          cancelUrl: 'https://itsxtrapush.com/payment/cancel',
          customerEmail: user?.email || undefined,
          currency: 'MWK',
          subscriptionTier: subscriptionToInclude,
          userUid: user?.uid || undefined
        });
      } else {
        // Use Square for international (GBP)
        // Include subscription if user opted in
        session = await paymentsAPI.createSquareCheckout({
          items: sessionItems,
          successUrl: 'https://itsxtrapush.com/payment/success',
          cancelUrl: 'https://itsxtrapush.com/payment/cancel',
          customerEmail: user?.email || undefined,
          currency: 'GBP',
          // Subscription opt-in - now with tier info
          includeSubscription: subscriptionToInclude !== null,
          subscriptionTier: subscriptionToInclude,
          userUid: user?.uid || undefined
        });
      }

      if (!session?.success || (!session.url && !session.checkout_url)) {
        const msg = session?.error || 'Failed to create checkout session';
        throw new Error(msg);
      }

      // Step 3: Redirect to payment gateway
      setProcessingStep(3);
      setProcessingStatus(processingSteps[3]);
      
      const checkoutUrl = session.url || session.checkout_url;
      // Cache checkout details for email notification on success page
      try {
        localStorage.setItem('xp_lastCheckout', JSON.stringify({
          items: sessionItems,
          subtotal: total,
          deliveryFee: deliveryFee,
          subscriptionFee: subscriptionFee,
          subscriptionTier: subscriptionToInclude,
          installmentPlan: null,
          customerEmail: user?.email || null,
          provider: isMalawi ? 'paychangu' : 'square',
          currency: paymentCurrency,
          includesSubscription: subscriptionToInclude !== null
        }));
      } catch (_) {}
      
      // Keep processing overlay visible during redirection
      // Modal stays open to prevent user confusion during page redirect
      setTimeout(() => {
        window.location.href = checkoutUrl;
        clearCart();
        // Don't close modal - let it remain visible during redirect
      }, 800);
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingStep(0);
    }
  };

  const paymentOptions = isMalawi 
    ? [{ id: 'paychangu', name: 'PayChangu (Mobile Money)', icon: <PaymentIcon />, countries: ['all'] }]
    : [{ id: 'square', name: 'Square (Card Payment)', icon: <PaymentIcon />, countries: ['all'] }];

  // Filter payment options based on user's country (now location-aware)

  // Filter payment options based on user's country
  const availablePaymentOptions = paymentOptions.filter(option => 
    option.countries.includes('all') || option.countries.includes(userCountry)
  );

  // Calculate total with force refresh to ensure latest prices are used
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Recalculate total when items or refresh trigger changes
  const total = useMemo(() => {
    console.log('Recalculating cart total with items:', items);
    return getCartTotal();
  }, [getCartTotal, items, refreshTrigger]);
  // Calculate fees based on region and selected subscription tier
  // UK/International (GBP): Plus £6.00/mo, Premium £9.99/mo, Standard Postage £4.99
  // Malawi (MWK): Plus MWK 6,000/mo, Premium MWK 10,000/mo, Standard Delivery MWK 2,000
  const getSubscriptionFee = () => {
    if (hasSubscription) return 0; // Already subscribed
    if (isMalawi) {
      if (selectedSubscription === 'plus') return 6000;
      if (selectedSubscription === 'premium') return 10000;
      return 0;
    } else {
      if (selectedSubscription === 'plus') return 6.00;
      if (selectedSubscription === 'premium') return 9.99;
      return 0;
    }
  };
  const getDeliveryFee = () => {
    if (hasSubscription || selectedSubscription !== 'none') return 0; // Subscribed users get free delivery
    return isMalawi ? 2000 : 4.99;
  };
  const subscriptionFee = getSubscriptionFee();
  const deliveryFee = getDeliveryFee();
  const finalTotal = total + subscriptionFee + deliveryFee;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0d2137',
          color: 'white',
          borderRadius: '20px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <ShoppingCartIcon />
        Shopping Cart ({items.length} items)
      </DialogTitle>
      
      <DialogContent sx={{ 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-track': { bgcolor: 'rgba(72, 206, 219, 0.15)' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(72, 206, 219, 0.6)', borderRadius: 4, '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.8)' } }
      }}>
        {items.length === 0 ? (
          <Box textAlign="center" py={4}>
            <ShoppingCartIcon sx={{ fontSize: 64, opacity: 0.5, mb: 2 }} />
            <Typography variant="h6">Your cart is empty</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Add some items to get started!
            </Typography>
          </Box>
        ) : (
          <>
            {/* Cart Items */}
            <List>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      mb: 2,
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                      position: 'relative'
                    }}
                  >
                    {/* Delete button - top right */}
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.id)}
                      sx={{ 
                        color: '#ff6b6b', 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        bgcolor: 'rgba(255,107,107,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    
                    {/* Centered Product Image */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mb: 2 }}>
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.title}
                        sx={{ 
                          width: 210, 
                          height: 210, 
                          objectFit: 'contain', 
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.05)',
                          p: 1,
                          mb: 1.5
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', color: 'white' }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                        {(() => {
                          // Comprehensive debug logging
                          console.log('🔍 Cart item debug:', {
                            id: item.id,
                            title: item.title,
                            quantity: item.quantity,
                            price: item.price,
                            price_gbp: item.price_gbp,
                            price_mwk: item.price_mwk,
                            lowest_variant_price: item.lowest_variant_price,
                            lowest_variant_price_gbp: item.lowest_variant_price_gbp,
                            lowest_variant_price_mwk: item.lowest_variant_price_mwk,
                            number: item.number
                          });
                          
                          // Use variant-based pricing if available, with proper fallback chain
                          let unitPrice;
                          
                          // Priority 1: Currency-specific variant prices
                          if (isMalawi && item.price_mwk) {
                            unitPrice = parseFloat(item.price_mwk);
                          } else if (!isMalawi && item.price_gbp) {
                            unitPrice = parseFloat(item.price_gbp);
                          }
                          // Priority 2: Use variant-based lowest prices if main prices aren't set
                          else if (isMalawi && item.lowest_variant_price_mwk) {
                            unitPrice = parseFloat(item.lowest_variant_price_mwk);
                          } else if (!isMalawi && item.lowest_variant_price_gbp) {
                            unitPrice = parseFloat(item.lowest_variant_price_gbp);
                          }
                          // Priority 3: General variant prices
                          else if (item.lowest_variant_price) {
                            unitPrice = parseFloat(item.lowest_variant_price);
                          }
                          // Priority 4: Fallback to general price field
                          else if (item.price) {
                            if (typeof item.price === 'string') {
                              unitPrice = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
                            } else {
                              unitPrice = parseFloat(item.price);
                            }
                          }
                          // Final fallback
                          else {
                            console.warn('No unit price found for item:', item.id, item.title);
                            unitPrice = 0;
                          }
                          
                          // Ensure we have a valid price
                          const finalUnitPrice = unitPrice && !isNaN(unitPrice) ? unitPrice : 0;
                          
                          if (finalUnitPrice === 0) {
                            console.warn('Item has zero unit price:', item.id, item.title);
                          }
                          
                          return `${formatLocalPrice(finalUnitPrice)} each`;
                        })()}
                      </Typography>
                      
                      {/* Collapsible Description */}
                      {item.description && (
                        <Box sx={{ mt: 1, width: '100%' }}>
                          <Box
                            onClick={() => setExpandedDescriptions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              cursor: 'pointer',
                              color: '#48CEDB',
                              '&:hover': { color: '#6ad8e6' }
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {expandedDescriptions[item.id] ? 'Hide Details' : 'View Details'}
                            </Typography>
                            {expandedDescriptions[item.id] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </Box>
                          <Collapse in={expandedDescriptions[item.id]}>
                            <Box sx={{ 
                              mt: 1, 
                              p: 1.5, 
                              bgcolor: 'rgba(255,255,255,0.03)', 
                              borderRadius: 1,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                {item.description}
                              </Typography>
                              {item.specifications && Object.keys(item.specifications).length > 0 && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                  <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                    Specifications
                                  </Typography>
                                  {Object.entries(item.specifications).slice(0, 5).map(([key, value]) => {
                                    const displayValue = Array.isArray(value) 
                                      ? value.join(', ') 
                                      : (typeof value === 'object' && value !== null)
                                        ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')
                                        : String(value);
                                    return (
                                      <Typography key={key} variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span> {displayValue}
                                      </Typography>
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Variant Options - Button Picker Style */}
                    <Box sx={{ width: '100%', mb: 2 }}>
                      {/* Storage Picker */}
                      {Array.isArray(storageOptionsMap[item.id]) && storageOptionsMap[item.id].length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                            Storage: <span style={{ color: 'white' }}>{item.storage || storageOptionsMap[item.id][0]}</span>
                            {variantsMap[item.id]?.length === 0 && (
                              <Chip 
                                label={(() => {
                                  const categoryLower = (item.category || '').toLowerCase();
                                  if (categoryLower.includes('smartphone') || categoryLower.includes('phone')) return 'Default: 256GB';
                                  if (categoryLower.includes('laptop')) return 'Default: 512GB';
                                  return 'Default';
                                })()}
                                size="small" 
                                sx={{ ml: 1, bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', height: 18, fontSize: '0.7rem' }} 
                              />
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                            {getStoragesWithStock(item.id).map(({ storage, hasStock }) => {
                              const isSelected = (item.storage || storageOptionsMap[item.id][0]) === storage;
                              const categoryLower = (item.category || '').toLowerCase();
                              const isDefaultStorage = variantsMap[item.id]?.length === 0 && (
                                (storage === '256GB' && (categoryLower.includes('smartphone') || categoryLower.includes('phone'))) ||
                                (storage === '512GB' && categoryLower.includes('laptop'))
                              );
                              return (
                                <Box
                                  key={storage}
                                  onClick={() => hasStock && handleStorageSelect(item.id, storage)}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: 1,
                                    border: isSelected ? '2px solid #48CEDB' : (isDefaultStorage ? '2px solid rgba(72, 206, 219, 0.5)' : '1px solid rgba(255,255,255,0.3)'),
                                    bgcolor: isSelected ? 'rgba(72, 206, 219, 0.15)' : (isDefaultStorage ? 'rgba(72, 206, 219, 0.08)' : 'transparent'),
                                    color: hasStock ? 'white' : 'rgba(255,255,255,0.3)',
                                    cursor: hasStock ? 'pointer' : 'not-allowed',
                                    opacity: hasStock ? 1 : 0.5,
                                    fontSize: '0.85rem',
                                    fontWeight: isSelected ? 600 : (isDefaultStorage ? 500 : 400),
                                    transition: 'all 0.2s ease',
                                    '&:hover': hasStock ? {
                                      borderColor: '#48CEDB',
                                      bgcolor: 'rgba(72, 206, 219, 0.1)'
                                    } : {}
                                  }}
                                >
                                  {storage}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      )}

                      {/* Color Picker */}
                      {Array.isArray(colorOptionsMap[item.id]) && colorOptionsMap[item.id].length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                            Colour: <span style={{ color: 'white' }}>{item.color || colorOptionsMap[item.id][0]?.name}</span>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                            {colorOptionsMap[item.id].map((c) => {
                              const isSelected = (item.color || colorOptionsMap[item.id][0]?.name) === c.name;
                              return (
                                <Box
                                  key={c.name}
                                  onClick={() => handleColorSelect(item.id, c.name)}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: 1,
                                    border: isSelected ? '2px solid #48CEDB' : '1px solid rgba(255,255,255,0.3)',
                                    bgcolor: isSelected ? 'rgba(72, 206, 219, 0.15)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: isSelected ? 600 : 400,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      borderColor: '#48CEDB',
                                      bgcolor: 'rgba(72, 206, 219, 0.1)'
                                    }
                                  }}
                                >
                                  {c.hex && (
                                    <Box sx={{ 
                                      width: 14, 
                                      height: 14, 
                                      borderRadius: '50%', 
                                      bgcolor: c.hex, 
                                      border: '1px solid rgba(255,255,255,0.5)',
                                      flexShrink: 0
                                    }} />
                                  )}
                                  {c.name}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      )}

                      {/* Condition Picker */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                          Condition: <span style={{ color: 'white' }}>{CONDITION_TOKEN_TO_LABEL[item.condition] || (Array.isArray(conditionOptionsMap[item.id]) && conditionOptionsMap[item.id][0]) || 'New'}</span>
                          {variantsMap[item.id]?.length === 0 && (
                            <Chip label="Default: New" size="small" sx={{ ml: 1, bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', height: 18, fontSize: '0.7rem' }} />
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {getConditionsWithStock(item.id, item.storage).map(({ label, hasStock, stock }) => {
                            const currentCondition = CONDITION_TOKEN_TO_LABEL[item.condition] || (Array.isArray(conditionOptionsMap[item.id]) && conditionOptionsMap[item.id][0]) || 'New';
                            const isSelected = currentCondition === label;
                            const isDefault = label === 'New' && variantsMap[item.id]?.length === 0;
                            return (
                              <Box
                                key={label}
                                onClick={() => hasStock && handleConditionSelect(item.id, label)}
                                sx={{
                                  px: 2,
                                  py: 1,
                                  borderRadius: 1,
                                  border: isSelected ? '2px solid #48CEDB' : (isDefault ? '2px solid rgba(72, 206, 219, 0.5)' : '1px solid rgba(255,255,255,0.3)'),
                                  bgcolor: isSelected ? 'rgba(72, 206, 219, 0.15)' : (isDefault ? 'rgba(72, 206, 219, 0.08)' : 'transparent'),
                                  color: hasStock ? 'white' : 'rgba(255,255,255,0.3)',
                                  cursor: hasStock ? 'pointer' : 'not-allowed',
                                  opacity: hasStock ? 1 : 0.5,
                                  fontSize: '0.85rem',
                                  fontWeight: isSelected ? 600 : (isDefault ? 500 : 400),
                                  transition: 'all 0.2s ease',
                                  '&:hover': hasStock ? {
                                    borderColor: '#48CEDB',
                                    bgcolor: 'rgba(72, 206, 219, 0.1)'
                                  } : {}
                                }}
                              >
                                {label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Price Row */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '100%',
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Typography sx={{ 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: 'white'
                      }}>
                        {(() => {
                          // Comprehensive debug logging for total price
                          console.log('💰 Total price calculation:', {
                            id: item.id,
                            title: item.title,
                            rawQuantity: item.quantity,
                            parsedQuantity: parseInt(item.quantity),
                            finalQuantity: parseInt(item.quantity) || 1,
                            priceFields: {
                              price: item.price,
                              price_gbp: item.price_gbp,
                              price_mwk: item.price_mwk,
                              lowest_variant_price: item.lowest_variant_price,
                              lowest_variant_price_gbp: item.lowest_variant_price_gbp,
                              lowest_variant_price_mwk: item.lowest_variant_price_mwk
                            }
                          });
                          
                          // Use variant-based pricing if available, with proper fallback chain
                          let price;
                          
                          // Priority 1: Currency-specific variant prices
                          if (isMalawi && item.price_mwk) {
                            price = parseFloat(item.price_mwk);
                          } else if (!isMalawi && item.price_gbp) {
                            price = parseFloat(item.price_gbp);
                          } 
                          // Priority 2: Use variant-based lowest prices if main prices aren't set
                          else if (isMalawi && item.lowest_variant_price_mwk) {
                            price = parseFloat(item.lowest_variant_price_mwk);
                          } else if (!isMalawi && item.lowest_variant_price_gbp) {
                            price = parseFloat(item.lowest_variant_price_gbp);
                          } 
                          // Priority 3: General variant prices
                          else if (item.lowest_variant_price) {
                            price = parseFloat(item.lowest_variant_price);
                          }
                          // Priority 4: Fallback to general price field
                          else if (item.price) {
                            if (typeof item.price === 'string') {
                              price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
                            } else {
                              price = parseFloat(item.price);
                            }
                          }
                          // Final fallback - this should rarely happen
                          else {
                            console.warn('No price found for item:', item.id, item.title);
                            price = 0;
                          }
                          
                          // Ensure we have a valid price
                          const finalPrice = price && !isNaN(price) ? price : 0;
                          const quantity = parseInt(item.quantity) || 1; // Default to 1 if quantity is invalid
                          
                          console.log('🧮 Price calculation result:', {
                            itemId: item.id,
                            title: item.title,
                            finalPrice: finalPrice,
                            quantity: quantity,
                            totalPrice: finalPrice * quantity
                          });
                          
                          if (finalPrice === 0) {
                            console.warn('Item has zero price:', item.id, item.title, {
                              price_mwk: item.price_mwk,
                              price_gbp: item.price_gbp,
                              lowest_variant_price_mwk: item.lowest_variant_price_mwk,
                              lowest_variant_price_gbp: item.lowest_variant_price_gbp,
                              lowest_variant_price: item.lowest_variant_price,
                              price: item.price,
                              quantity: item.quantity
                            });
                          }
                          
                          // Debug logging for zero total issue
                          if (finalPrice > 0 && quantity > 0 && finalPrice * quantity === 0) {
                            console.error('Price calculation anomaly:', {
                              itemId: item.id,
                              title: item.title,
                              finalPrice: finalPrice,
                              quantity: quantity,
                              calculatedTotal: finalPrice * quantity,
                              priceType: typeof finalPrice,
                              quantityType: typeof quantity
                            });
                          }
                          
                          const totalPrice = finalPrice * quantity;
                          return formatLocalPrice(totalPrice);
                        })()}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.3)' }} />



            {/* Country Selection hidden per request */}
            {/* <Box sx={{ mb: 3 }}> ... </Box> */}

            {/* Delivery & Subscription Options */}
            {!loadingSubscription && (
              <Box sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(72, 206, 219, 0.2)'
              }}>
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'white' }}>
                    🚚 Delivery & Protection Plans
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Choose the right plan for your needs
                  </Typography>
                </Box>
                
                {hasSubscription ? (
                  // User already has a subscription
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    border: '2px solid #4caf50',
                    bgcolor: 'rgba(76, 175, 80, 0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <StarIcon sx={{ color: '#4caf50' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                        Xtrapush {subscriptionTier === 'premium' ? 'Premium' : 'Plus'} Active
                      </Typography>
                      <Chip label="Active" size="small" sx={{ bgcolor: '#4caf50', color: 'white', ml: 1 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Free delivery included with your {subscriptionTier === 'premium' ? 'Premium' : 'Plus'} membership
                    </Typography>
                  </Box>
                ) : (
                  // Three-tier choice: Plus, Premium, or Standard
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Option 1: Xtrapush Plus */}
                    <Box
                      onClick={() => handleSubscriptionSelect('plus')}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: selectedSubscription === 'plus' ? '2px solid #48CEDB' : '1px solid rgba(255,255,255,0.15)',
                        bgcolor: selectedSubscription === 'plus' ? 'rgba(72, 206, 219, 0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: '#48CEDB',
                          bgcolor: 'rgba(72, 206, 219, 0.08)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(72, 206, 219, 0.2)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: selectedSubscription === 'plus' ? '7px solid #48CEDB' : '2px solid rgba(255,255,255,0.3)',
                          bgcolor: selectedSubscription === 'plus' ? '#48CEDB' : 'transparent',
                          flexShrink: 0,
                          mt: 0.3,
                          transition: 'all 0.3s ease',
                          boxShadow: selectedSubscription === 'plus' ? '0 0 0 4px rgba(72, 206, 219, 0.2)' : 'none'
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StarIcon sx={{ color: '#48CEDB', fontSize: 20 }} />
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                                Xtrapush Plus
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#48CEDB' }}>
                              {isMalawi ? '+6k' : '+£6'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block', mb: 1, lineHeight: 1.5 }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> Free unlimited delivery
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <SecurityIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> <strong>Single gadget</strong> insurance (1 year)
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AttachMoneyIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> Member-only discounts
                            </Box>
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(72, 206, 219, 0.9)', display: 'block', fontStyle: 'italic' }}>
                            Perfect for protecting your favorite device
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Option 2: Xtrapush Premium - Most Popular */}
                    <Box
                      onClick={() => handleSubscriptionSelect('premium')}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: selectedSubscription === 'premium' ? '2px solid #48CEDB' : '1px solid rgba(72, 206, 219, 0.3)',
                        bgcolor: selectedSubscription === 'premium' ? 'rgba(72, 206, 219, 0.15)' : 'rgba(72, 206, 219, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: selectedSubscription === 'premium' ? '0 4px 16px rgba(72, 206, 219, 0.3)' : '0 2px 8px rgba(72, 206, 219, 0.1)',
                        '&:hover': {
                          borderColor: '#48CEDB',
                          bgcolor: 'rgba(72, 206, 219, 0.12)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(72, 206, 219, 0.35)'
                        }
                      }}
                    >
                      <Chip 
                        label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WhatshotIcon sx={{ fontSize: 14 }} /> Most Popular</Box>}
                        size="small" 
                        sx={{ 
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: '#48CEDB', 
                          color: '#0f172a', 
                          fontWeight: 700,
                          fontSize: '0.65rem'
                        }} 
                      />
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: selectedSubscription === 'premium' ? '7px solid #48CEDB' : '2px solid rgba(72, 206, 219, 0.5)',
                          bgcolor: selectedSubscription === 'premium' ? '#48CEDB' : 'transparent',
                          flexShrink: 0,
                          mt: 0.3,
                          transition: 'all 0.3s ease',
                          boxShadow: selectedSubscription === 'premium' ? '0 0 0 4px rgba(72, 206, 219, 0.3)' : 'none'
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pr: 10 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PremiumIcon sx={{ color: '#48CEDB', fontSize: 20 }} />
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                                Xtrapush Premium
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#48CEDB' }}>
                              {isMalawi ? '+10k' : '+£9.99'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.95)', display: 'block', mb: 1, lineHeight: 1.5 }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> Free unlimited delivery
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <SecurityIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> <strong>Multiple gadget</strong> insurance (1 year each)
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <DiamondIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> Exclusive member discounts
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BoltIcon sx={{ fontSize: 14, color: '#48CEDB' }} /> Priority support • Early access
                            </Box>
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(72, 206, 219, 1)', display: 'block', fontWeight: 600 }}>
                            Best value — protect all your devices!
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Option 3: Standard Delivery */}
                    <Box
                      onClick={() => handleSubscriptionSelect('none')}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: selectedSubscription === 'none' ? '2px solid #48CEDB' : '1px solid rgba(255,255,255,0.15)',
                        bgcolor: selectedSubscription === 'none' ? 'rgba(72, 206, 219, 0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: '#48CEDB',
                          bgcolor: 'rgba(72, 206, 219, 0.08)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(72, 206, 219, 0.2)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: selectedSubscription === 'none' ? '7px solid #48CEDB' : '2px solid rgba(255,255,255,0.3)',
                          bgcolor: selectedSubscription === 'none' ? '#48CEDB' : 'transparent',
                          flexShrink: 0,
                          mt: 0.3,
                          transition: 'all 0.3s ease',
                          boxShadow: selectedSubscription === 'none' ? '0 0 0 4px rgba(72, 206, 219, 0.2)' : 'none'
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DeliveryIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                                Standard {isMalawi ? 'Delivery' : 'Postage'}
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                              {isMalawi ? 'MWK 2,000' : '£4.99'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                            {isMalawi 
                              ? 'One-time delivery fee (Same day Lilongwe, next day Blantyre/Mzuzu)'
                              : 'One-time delivery fee (UK delivery 1-3 business days)'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Policy Agreement Checkbox - Required for Plus/Premium */}
                    {selectedSubscription !== 'none' && (
                      <Box sx={{ 
                        mt: 1, 
                        p: 1.5, 
                        borderRadius: 1, 
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(72, 206, 219, 0.3)'
                      }}>
                        <Box 
                          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, cursor: 'pointer' }}
                          onClick={() => setAgreedToTerms(!agreedToTerms)}
                        >
                          <Box sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '4px',
                            border: agreedToTerms ? '2px solid #48CEDB' : '2px solid rgba(255,255,255,0.4)',
                            bgcolor: agreedToTerms ? '#48CEDB' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.3
                          }}>
                            {agreedToTerms && (
                              <CheckCircleIcon sx={{ color: '#0d2137', fontSize: 16 }} />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                            I have read and agree to the{' '}
                            <a href="/terms" target="_blank" style={{ color: '#48CEDB', textDecoration: 'none' }}>
                              subscription terms and insurance policy
                            </a>
                            . I understand that gadget insurance covers laptops, smartphones, and tablets only.
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="h6" gutterBottom>Payment Method</Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
              {isMalawi 
                ? 'Selecting checkout will redirect you to PayChangu to complete payment securely.'
                : 'Selecting checkout will redirect you to Square to complete your card payment securely.'
              }
            </Typography>
            <Grid container spacing={2}>
              {availablePaymentOptions.map((option) => (
                <Grid item xs={6} key={option.id}>
                  <Card
                    sx={{
                      bgcolor: selectedPayment === option.id ? 'rgba(72, 206, 219, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: selectedPayment === option.id ? '2px solid #48CEDB' : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setSelectedPayment(option.id)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      {option.icon}
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {option.name}
                      </Typography>
                      {(option.id === 'paychangu' || option.id === 'square') && (
                        <Chip label="Live" size="small" sx={{ ml: 'auto', bgcolor: '#4caf50', color: 'white' }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Continue Shopping
        </Button>
        {items.length > 0 && (
          <>
            <Button 
              onClick={clearCart} 
              sx={{ color: '#ff6b6b' }}
            >
              Clear Cart
            </Button>
            <Button
              variant="contained"
              onClick={handleCheckout}
              disabled={
                isProcessing || 
                items.some(it => (it?.number || 0) <= 0 || (it?.quantity || 0) <= 0) ||
                (selectedSubscription !== 'none' && !hasSubscription && !agreedToTerms)
              }
              sx={{
                bgcolor: '#48CEDB',
                '&:hover': { bgcolor: '#3ba8b8' },
                '&:disabled': { bgcolor: 'rgba(72, 206, 219, 0.3)', color: 'rgba(255,255,255,0.5)' }
              }}
            >
              {isProcessing ? 'Processing...' : `Checkout ${formatLocalPrice(finalTotal)}`}
            </Button>
          </>
        )}
      </DialogActions>

      <AuthAlertModal
        open={authAlertOpen}
        onClose={() => setAuthAlertOpen(false)}
        title="Sign In Required"
        message="Please sign in to complete your purchase. Your cart will be saved for you."
        actionLabel="Sign In"
        onAction={() => navigate('/signin')}
      />
      
      {/* Processing Modal */}
      <Dialog
        open={isProcessing}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0d2137',
            color: 'white',
            borderRadius: '20px',
            textAlign: 'center',
            p: 3
          }
        }}
      >
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {/* Animated Spinner */}
            <Box sx={{
              width: 60,
              height: 60,
              border: '4px solid rgba(72, 206, 219, 0.3)',
              borderTop: '4px solid #48CEDB',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
            
            {/* Status Message */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#48CEDB' }}>
              Processing Order
            </Typography>
            
            {/* Dynamic Status */}
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', minHeight: '1.5em' }}>
              {processingStatus}
            </Typography>
            
            {/* Progress Steps */}
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              {processingSteps.map((step, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1.5,
                    opacity: index <= processingStep ? 1 : 0.4
                  }}
                >
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: index < processingStep 
                      ? '#48CEDB' 
                      : index === processingStep 
                        ? 'rgba(72, 206, 219, 0.3)' 
                        : 'rgba(255,255,255,0.1)',
                    border: index === processingStep 
                      ? '2px solid #48CEDB' 
                      : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    transition: 'all 0.3s ease'
                  }}>
                    {index < processingStep ? (
                      <CheckCircleIcon sx={{ color: '#0d2137', fontSize: 16 }} />
                    ) : index === processingStep ? (
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#48CEDB',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }} />
                    ) : null}
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: index <= processingStep ? 'white' : 'rgba(255,255,255,0.5)',
                      fontWeight: index === processingStep ? 600 : 400
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Loading Bar */}
            <Box sx={{ width: '100%', maxWidth: 300, mt: 1 }}>
              <Box sx={{
                height: 6,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${((processingStep + 1) / processingSteps.length) * 100}%`,
                  bgcolor: '#48CEDB',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(72, 206, 219, 0.5)'
                }} />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block' }}>
                {Math.round(((processingStep + 1) / processingSteps.length) * 100)}% Complete
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default CartModal;