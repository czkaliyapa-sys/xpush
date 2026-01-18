import React, { useEffect, useMemo, useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  Chip,
  Collapse
} from '@mui/material';
import { Payment as PaymentIcon, CreditCard as CreditCardIcon, PhoneAndroid as PhoneAndroidIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { paymentsAPI, gadgetsAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePricing } from '../hooks/usePricing';
import { useLocation } from '../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import AuthAlertModal from './AuthAlertModal.tsx';
import VerificationEligibilityScreen from './VerificationEligibilityScreen.jsx';
import InstallmentApplicationForm from './InstallmentApplicationForm.jsx';

/**
 * InstallmentModal
 * Collects installment plan details and starts an installment checkout.
 * - Weeks: 2, 4, 6
 * - Deposit: fixed by weeks (2w:35%, 4w:50%, 6w:65%)
 * - Total increases by weeks (2w:+0%, 4w:+5%, 6w:+10%)
 * - If gadget has variants, user selects storage + condition to update pricing
 * - Shows gadget image
 */
const InstallmentModal = ({ open, onClose, item, customerEmail }) => {
  const [weeks, setWeeks] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  const [installmentType, setInstallmentType] = useState('pay-to-own'); // 'pay-to-own', 'pay-as-you-go', or 'pay-to-lease'
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Function to calculate lease total based on selected duration with interest
  const calculateLeaseTotal = () => {
    let totalMonths = 0;
    
    if (leaseDurationType === 'custom') {
      // For custom date range, calculate based on actual dates if available
      if (leaseCustomStart && leaseCustomEnd) {
        const startDate = new Date(leaseCustomStart);
        const endDate = new Date(leaseCustomEnd);
        const diffTime = Math.abs(endDate - startDate);
        // Calculate exact days and convert to months more accurately
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalMonths = diffDays / 30.44; // Average days in a month (365.25/12)
      }
    } else {
      // Convert selected duration to months
      switch (leaseDurationType) {
        case 'days':
          totalMonths = leaseDurationValue / 30.44; // More accurate conversion
          break;
        case 'weeks':
          totalMonths = leaseDurationValue / 4.35; // More accurate conversion (30.44/7)
          break;
        case 'months':
          totalMonths = leaseDurationValue;
          break;
        default:
          totalMonths = 48; // Default to 48 months
      }
    }
    
    // Calculate interest rate based on duration
    // Shorter periods have lower interest (15% for 48 months as baseline)
    const baseInterestRate = 0.15; // 15% for 48 months
    const baseDurationMonths = 48;
    
    // Calculate interest rate based on duration (shorter = less interest, longer = more interest)
    const interestRate = (totalMonths / baseDurationMonths) * baseInterestRate;
    
    // Calculate total based on monthly rate (2.2% of base price) with interest
    const monthlyRate = basePrice * 0.022;
    const total = monthlyRate * totalMonths * (1 + interestRate);
    
    return formatLocalPrice(total);
  };

  // Only reset installmentType to default when modal transitions from closed to open (never after user interaction)
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setInstallmentType('pay-to-own');
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  // Pay to Lease enhancements
  const [leaseDurationType, setLeaseDurationType] = useState('weeks'); // 'days' | 'weeks' | 'months' | 'custom'
  const [leaseDurationValue, setLeaseDurationValue] = useState(1);
  const [leaseCustomStart, setLeaseCustomStart] = useState(null);
  const [leaseCustomEnd, setLeaseCustomEnd] = useState(null);
  const [leaseCalendarOpen, setLeaseCalendarOpen] = useState(false);
  const [leaseUseCase, setLeaseUseCase] = useState('');
  const { userProfile } = useAuth();
  const { currency } = usePricing();
  const { isMalawi } = useLocation();
  const navigate = useNavigate();
  
  // Determine payment gateway based on location
  const paymentGateway = isMalawi ? 'paychangu' : 'square';
  const paymentCurrency = isMalawi ? 'MWK' : 'GBP';

  // Condition label/token mapping (defined early for initial state)
  const CONDITION_TOKEN_TO_LABEL_MAP = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };
  
  // Variant and selection state (Color + Storage + Condition)
  const [variants, setVariants] = useState([]);
  const [colorOptions, setColorOptions] = useState([]); // Array of { color: string, colorHex: string }
  const [storageOptions, setStorageOptions] = useState([]);
  // Initialize conditionOptions with item's condition or default to ['New']
  const initialConditionToken = item?.condition || 'new';
  const initialConditionLabel = CONDITION_TOKEN_TO_LABEL_MAP[initialConditionToken] || 'New';
  const [conditionOptions, setConditionOptions] = useState([initialConditionLabel]);
  const [selectedColor, setSelectedColor] = useState(item?.color || '');
  const [selectedStorage, setSelectedStorage] = useState(item?.storage || '');
  const [selectedCondition, setSelectedCondition] = useState(initialConditionToken);
  const [variantId, setVariantId] = useState(item?.variantId || undefined);
  const [imageUrl, setImageUrl] = useState(item?.image || '');
  const [name, setName] = useState(item?.name || item?.title || 'Gadget');
  const [gadgetDescription, setGadgetDescription] = useState(item?.description || '');
  const [gadgetSpecifications, setGadgetSpecifications] = useState(item?.specifications || null);
  const [category, setCategory] = useState(item?.category || '');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const { formatLocalPrice } = usePricing();

  // Categories that typically have color/storage/condition variants (like MusicMagpie)
  const VARIANT_ELIGIBLE_CATEGORIES = ['smartphones', 'tablets', 'laptops', 'phones', 'mobile', 'iphone', 'samsung', 'ipad'];
  const isVariantEligibleCategory = category 
    ? VARIANT_ELIGIBLE_CATEGORIES.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
    : false;

  // Default storage order by category
  const DEFAULT_ORDER = ['32GB','64GB','128GB','256GB','512GB'];

  // Helper: parse price - expects GBP value
  const parsePrice = (p) => {
    if (typeof p === 'string') return parseFloat(p.replace(/[^0-9.-]+/g, '')) || 0;
    return Number(p) || 0;
  };

  // Normalize stock to integer
  const coerceStock = (val) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const fetchLiveStockForSelection = async () => {
    if (!item?.id) {
      return { ok: false, message: 'Unable to validate stock for this item.' };
    }

    try {
      const res = await gadgetsAPI.getById(item.id);
      if (!res?.success || !res?.data) {
        return { ok: false, message: 'Unable to validate stock. Please try again.' };
      }

      const normalizeVariants = (arr = []) => arr
        .map(v => ({
          ...v,
          color: v.color || null,
          color_hex: v.color_hex || v.colorHex || null,
          condition_status: v.condition_status ?? v.condition,
          stock_quantity: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : (typeof v.stockQuantity !== 'undefined' ? v.stockQuantity : v.stock),
          is_active: typeof v.is_active !== 'undefined' ? v.is_active : v.active,
          price_gbp: v.price_gbp || v.priceGbp || null
        }))
        .filter(v => (v?.is_active ?? 1) === 1);

      const liveVariants = normalizeVariants(Array.isArray(res.data.variants) ? res.data.variants : []);
      if (liveVariants.length > 0) {
        setVariants(liveVariants);
      }

      const match = findVariantMatch(liveVariants, selectedColor, selectedStorage, selectedCondition);
      let availableStock = 0;
      let matchedVariantId = null;

      if (match) {
        availableStock = coerceStock(match.stock_quantity ?? match.stock);
        matchedVariantId = match.id ?? null;

        // Keep price in sync with the latest variant pricing
        const variantPrice = isMalawi
          ? parsePrice(match.price || match.price_gbp || res.data?.price || res.data?.price_gbp)
          : parsePrice(match.price_gbp || match.price || res.data?.price_gbp || res.data?.price);
        if (variantPrice) {
          setBasePrice(variantPrice);
        }
      } else {
        availableStock = coerceStock(res.data.stock_quantity ?? res.data.stock ?? res.data.in_stock ?? res.data.number);
      }

      return { ok: true, availableStock, matchedVariantId };
    } catch (e) {
      console.warn('InstallmentModal: live stock validation failed', e);
      return { ok: false, message: 'Could not validate stock. Please try again.' };
    }
  };

  const validateStockBeforeProceed = async () => {
    const result = await fetchLiveStockForSelection();
    if (!result?.ok) {
      setError(result?.message || 'Unable to validate stock. Please try again.');
      return false;
    }

    const { availableStock, matchedVariantId } = result;

    if (matchedVariantId) {
      setVariantId(matchedVariantId);
    }

    if (availableStock <= 0) {
      setError('This selection is currently out of stock. Please choose another option.');
      return false;
    }

    return true;
  };

  // Base price from selected variant or fallback to item.priceGbp (always GBP)
  const [basePrice, setBasePrice] = useState(parsePrice(item?.priceGbp ?? item?.price));

  // Helper function to find variant match based on color, storage, and condition
  const findVariantMatch = (variants, color, storage, condition) => {
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

  // Fetch gadget detail to populate variants and image
  useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !item?.id) return;
      try {
        const res = await gadgetsAPI.getById(item.id);
        if (res?.success && res?.data) {
          setName(res.data?.name || name);
          setImageUrl(res.data?.image || imageUrl);
          setGadgetDescription(res.data?.description || item?.description || '');
          setGadgetSpecifications(res.data?.specifications || item?.specifications || null);
          setCategory(res.data?.category || item?.category || '');
          const rawVariants = Array.isArray(res.data.variants) ? res.data.variants.map(v => ({
            ...v,
            color: v.color || null,
            color_hex: v.color_hex || v.colorHex || null,
            condition_status: v.condition_status ?? v.condition,
            stock_quantity: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity,
            is_active: typeof v.is_active !== 'undefined' ? v.is_active : v.active,
            price_gbp: v.price_gbp || v.priceGbp || null
          })).filter(v => (v?.is_active ?? 1) === 1) : [];
          setVariants(rawVariants);

          // Extract unique colors with their hex values
          const colorMap = new Map();
          rawVariants.forEach(v => {
            if (v.color) {
              colorMap.set(v.color, { color: v.color, colorHex: v.color_hex || null });
            }
          });
          const colorOpts = Array.from(colorMap.values());
          setColorOptions(colorOpts);

          // Storage options priority order:
          // 1. Admin-created variants (highest priority - always shown if they exist)
          // 2. Main gadget storage field (if set by admin)
          // 3. Category-based defaults (only if no admin-set values exist)
          const storageFromVariants = rawVariants.length > 0
            ? Array.from(new Set(rawVariants.map(v => String(v.storage)).filter(Boolean)))
            : [];
          const mainGadgetStorage = res.data?.storage || item?.storage;
          // Category-based default storage (only used if no variants or main storage)
          const categoryLower = (res.data?.category || item?.category || '').toLowerCase();
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
          setStorageOptions(storageOpts);

          // Condition options priority order:
          // 1. Admin-created variant conditions (highest priority - always shown if they exist)
          // 2. Main gadget condition field (fallback if no variants exist)
          // Condition options priority order:
          // 1. Admin-created variant conditions (highest priority - always shown if they exist)
          // 2. Main gadget condition field (fallback if no variants exist)
          const ALLOWED_CONDITION_TOKENS = ['new','like_new','good','fair'];
          const condTokensFromVariants = rawVariants.length > 0
            ? Array.from(new Set(
                rawVariants
                  .map(v => String(v.condition_status))
                  .filter(Boolean)
                  .map(t => t.toLowerCase())
                  .filter(t => ALLOWED_CONDITION_TOKENS.includes(t))
              ))
            : [];
          const rawFallback = String(res.data?.condition || res.data?.condition_status || item?.condition || 'new').toLowerCase();
          const fallbackCondToken = ALLOWED_CONDITION_TOKENS.includes(rawFallback) ? rawFallback : 'new';
          // Always show at least the main gadget's condition, even if no variants
          const condOptsTokens = condTokensFromVariants.length > 0 ? condTokensFromVariants : [fallbackCondToken];
          const tokenToLabel = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };
          const condOpts = condOptsTokens.map(t => tokenToLabel[t] || t);
          setConditionOptions(condOpts);

          // Initial selections including color
          const initialColor = item?.color || (colorOpts.length > 0 ? colorOpts[0].color : '');
          const initialStorage = item?.storage || (storageOpts[0] || '');
          const initialCondToken = item?.condition || (condOptsTokens[0] || 'new');
          setSelectedColor(initialColor);
          setSelectedStorage(initialStorage);
          setSelectedCondition(initialCondToken);

          // Resolve initial variant price considering color
          let match = findVariantMatch(rawVariants, initialColor, initialStorage, initialCondToken);
          // Ensure price is in GBP: use price_gbp if available, otherwise fall back to price
          const variantPrice = parsePrice(match ? (match.price_gbp || match.price) : ((res.data?.price_gbp || res.data?.price) ?? (item?.priceGbp ?? item?.price)));
          setBasePrice(variantPrice);
          setVariantId(match?.id || undefined);
        }
      } catch (e) {
        console.warn('InstallmentModal: gadget detail fetch failed, using passed item.', e);
        // Fallbacks already set via props
      }
    };
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  // Track dialog open globally to suppress background navigation
  useEffect(() => {
    try {
      if (open) {
        window.__dialogOpen = true;
      } else {
        window.__dialogOpen = false;
      }
    } catch {}
    return () => {
      try { window.__dialogOpen = false; } catch {}
    };
  }, [open]);

  // Map label <-> token for condition select
  const CONDITION_LABEL_TO_TOKEN = {
    'New': 'new',
    'Like New': 'like_new',
    'Good': 'good',
    'Fair': 'fair'
  };
  const CONDITION_TOKEN_TO_LABEL = {
    new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair'
  };

  // Get variant stock for a specific combination
  const getVariantStock = (storage, condition) => {
    const match = variants.find(v => 
      v.storage === storage && v.condition_status === condition
    );
    return match ? parseInt(match.stock_quantity ?? 0, 10) : 0;
  };

  // Get storage options with stock info
  const getStoragesWithStock = () => {
    return storageOptions.map(storage => {
      const hasStock = variants.some(v => 
        v.storage === storage && parseInt(v.stock_quantity ?? 0, 10) > 0
      );
      return { storage, hasStock };
    });
  };

  // Get conditions available for selected storage with stock info
  const getConditionsWithStock = () => {
    return conditionOptions.map(label => {
      const token = CONDITION_LABEL_TO_TOKEN[label] || label;
      if (!selectedStorage) {
        const hasStock = variants.some(v => 
          v.condition_status === token && parseInt(v.stock_quantity ?? 0, 10) > 0
        );
        return { label, token, hasStock };
      }
      const match = variants.find(v => 
        v.storage === selectedStorage && v.condition_status === token
      );
      const stock = match ? parseInt(match.stock_quantity ?? 0, 10) : 0;
      return { label, token, hasStock: stock > 0, stock };
    });
  };

  // Handle color/storage/condition changes and update price
  const handleColorChange = (value) => {
    setSelectedColor(value);
    const match = findVariantMatch(variants, value, selectedStorage, selectedCondition);
    // Use appropriate price based on location
    const price = isMalawi 
      ? (match ? parsePrice(match.price || match.price_gbp) : basePrice)
      : (match ? parsePrice(match.price_gbp || match.price) : basePrice);
    setBasePrice(price);
    setVariantId(match?.id || undefined);
  };

  const handleStorageChange = (value) => {
    setSelectedStorage(value);
    
    // Check if current condition is available for new storage
    const availableForStorage = variants.filter(v => 
      v.storage === value && parseInt(v.stock_quantity ?? 0, 10) > 0
    );
    const conditionAvailable = availableForStorage.some(v => v.condition_status === selectedCondition);
    
    let effectiveCondition = selectedCondition;
    if (!conditionAvailable && availableForStorage.length > 0) {
      effectiveCondition = availableForStorage[0].condition_status;
      setSelectedCondition(effectiveCondition);
    }
    
    const match = findVariantMatch(variants, selectedColor, value, effectiveCondition);
    // Use appropriate price based on location
    const price = isMalawi 
      ? (match ? parsePrice(match.price || match.price_gbp) : basePrice)
      : (match ? parsePrice(match.price_gbp || match.price) : basePrice);
    setBasePrice(price);
    setVariantId(match?.id || undefined);
  };

  const handleConditionChange = (labelOrToken) => {
    const token = CONDITION_LABEL_TO_TOKEN[labelOrToken] || labelOrToken;
    setSelectedCondition(token);
    const match = findVariantMatch(variants, selectedColor, selectedStorage, token);
    // Use appropriate price based on location
    const price = isMalawi 
      ? (match ? parsePrice(match.price || match.price_gbp) : basePrice)
      : (match ? parsePrice(match.price_gbp || match.price) : basePrice);
    setBasePrice(price);
    setVariantId(match?.id || undefined);
  };

  // Check if current selection has stock
  const currentSelectionInStock = useMemo(() => {
    if (!selectedStorage) return true;
    const match = variants.find(v => 
      v.storage === selectedStorage && v.condition_status === selectedCondition
    );
    return match ? parseInt(match.stock_quantity ?? 0, 10) > 0 : false;
  }, [variants, selectedStorage, selectedCondition]);

  // Deposit percentages and total adjustments by weeks
  const { depositAmount, remainingBalance, weeklyAmount, adjustedTotal, depositPercentage, totalAdjustmentPercentage, isValidCalculation } = useMemo(() => {
    const totalBase = Number(basePrice) || 0;
    const hasValidPrice = totalBase > 0;
    
    if (!hasValidPrice) {
      return {
        depositAmount: 0,
        remainingBalance: 0,
        weeklyAmount: 0,
        adjustedTotal: 0,
        depositPercentage: 0,
        totalAdjustmentPercentage: 0,
        isValidCalculation: false
      };
    }
    
    let totalWithIncrease = totalBase;
    let depositPercent = 0.35; // default for 2 weeks
    let totalAdjustment = 0; // percentage adjustment

    if (weeks === 4) {
      totalWithIncrease = totalBase * 1.05; // +5%
      depositPercent = 0.50;
      totalAdjustment = 5;
    } else if (weeks === 6) {
      totalWithIncrease = totalBase * 1.10; // +10%
      depositPercent = 0.65;
      totalAdjustment = 10;
    }

    const deposit = totalWithIncrease * depositPercent;
    const remaining = totalWithIncrease - deposit;
    const weekly = weeks > 0 ? remaining / weeks : 0;

    return {
      depositAmount: deposit,
      remainingBalance: remaining,
      weeklyAmount: weekly,
      adjustedTotal: totalWithIncrease,
      depositPercentage: Math.round(depositPercent * 100),
      totalAdjustmentPercentage: totalAdjustment,
      isValidCalculation: true
    };
  }, [basePrice, weeks]);

  // Function to capture all required data when Proceed is clicked
  const captureInstallmentData = () => {
    // Gadget data
    const gadgetData = {
      id: item?.id,
      name,
      price: Math.round(basePrice),
      image: imageUrl || item?.image || null,
      category,
      description: gadgetDescription,
      specifications: gadgetSpecifications,
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(selectedStorage ? { storage: selectedStorage } : {}),
      ...(selectedCondition ? { condition: selectedCondition } : {}),
      ...(variantId ? { variantId } : {})
    };
    
    // User data
    const userData = {
      uid: userProfile?.uid,
      email: userProfile?.email || customerEmail,
      phone: userProfile?.phone,
      displayName: userProfile?.displayName,
      location: { isMalawi }
    };
    
    // Variant selections
    const variantSelections = {
      selectedColor,
      selectedStorage,
      selectedCondition,
      variantId,
      basePrice,
      currentSelectionInStock
    };
    
    // Installment plan data
    const installmentPlan = {
      enabled: true,
      planWeeks: weeks,
      depositAmount: Math.round(depositAmount),
      remainingBalance: Math.round(remainingBalance),
      weeklyAmount: Math.round(weeklyAmount),
      totalPrice: Math.round(adjustedTotal),
      paymentType: 'installment_deposit',
      planType: installmentType // 'pay-to-own' or 'pay-as-you-go'
    };
    
    // Add lease-specific pricing if applicable
    if (installmentType === 'pay-to-lease') {
      const monthlyRate = basePrice * 0.022;
      const totalLeaseCost = monthlyRate * 48;
      
      installmentPlan.leaseMonthlyRate = Math.round(monthlyRate);
      installmentPlan.leaseWeeklyRate = Math.round(monthlyRate / 4);
      installmentPlan.leaseTotalCost = Math.round(totalLeaseCost);
      installmentPlan.leaseDurationMonths = 48; // Default lease duration
      installmentPlan.leaseRatePercentage = 0.022; // 2.2%
    }
    
    // Lease specific data if applicable
    let leaseData = null;
    if (installmentType === 'pay-to-lease') {
      // Calculate lease pricing
      const monthlyRate = basePrice * 0.022;
      const weeklyRate = monthlyRate / 4;
      
      // Calculate total based on selected duration
      let totalLeaseMonths = 48; // Default
      if (leaseDurationType === 'custom') {
        if (leaseCustomStart && leaseCustomEnd) {
          const startDate = new Date(leaseCustomStart);
          const endDate = new Date(leaseCustomEnd);
          const diffTime = Math.abs(endDate - startDate);
          // Calculate exact days and convert to months more accurately
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalLeaseMonths = diffDays / 30.44; // Average days in a month (365.25/12)
        }
      } else {
        switch (leaseDurationType) {
          case 'days':
            totalLeaseMonths = leaseDurationValue / 30.44; // More accurate conversion
            break;
          case 'weeks':
            totalLeaseMonths = leaseDurationValue / 4.35; // More accurate conversion (30.44/7)
            break;
          case 'months':
            totalLeaseMonths = leaseDurationValue;
            break;
        }
      }
      
      // Calculate interest rate based on duration
      // Shorter periods have lower interest (15% for 48 months as baseline)
      const baseInterestRate = 0.15; // 15% for 48 months
      const baseDurationMonths = 48;
      
      // Calculate interest rate based on duration (shorter = less interest, longer = more interest)
      const interestRate = (totalLeaseMonths / baseDurationMonths) * baseInterestRate;
      
      const totalLeaseCost = monthlyRate * totalLeaseMonths * (1 + interestRate);
      
      leaseData = {
        leaseDurationType,
        leaseDurationValue,
        leaseCustomStart,
        leaseCustomEnd,
        leaseUseCase,
        monthlyRate,
        totalLeaseCost,
        weeklyRate,
        basePrice,
        leasePercentage: 0.022, // 2.2%
        leaseDurationMonths: 48
      };
    }
    
    return {
      gadgetData,
      userData,
      variantSelections,
      installmentPlan,
      leaseData,
      policyAccepted
    };
  };
  
  const handleProceed = async () => {
    setError('');

    if (!policyAccepted) {
      setError('Please read and accept the Installment Policy before proceeding.');
      return;
    }
    
    // Check if user is authenticated
    if (!userProfile || !userProfile.uid) {
      setAuthAlertOpen(true);
      return;
    }
    
    // Validate required profile fields
    const missingFields = [];
    if (!userProfile.email?.trim()) missingFields.push('Email');
    if (!userProfile.fullName?.trim()) missingFields.push('Full Name');
    if (!userProfile.address?.trim()) missingFields.push('Address');
    
    if (missingFields.length > 0) {
      setError(`Please complete your profile before starting an installment plan. Missing: ${missingFields.join(', ')}`);
      try { navigate('/dashboard/settings'); } catch (_) {}
      return;
    }

    setIsProcessing(true);

    const stockOk = await validateStockBeforeProceed();
    if (!stockOk) {
      setIsProcessing(false);
      return;
    }
    
    // Capture all required data
    const capturedData = captureInstallmentData();
    
    try {
      // Show application form directly instead of verification screen
      setShowApplicationForm(true);
      setIsProcessing(false);
    } catch (e) {
      console.error('Installment verification failed:', e);
      const data = e?.response?.data;
      setError(data?.details || data?.error || e?.message || 'Unexpected error');
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      ModalProps={{ keepMounted: true, disableEnforceFocus: true, disableRestoreFocus: true }}
      BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.35)' } }}
      PaperProps={{
        sx: {
          bgcolor: '#0d2137',
          color: 'white',
          borderRadius: '20px',
          maxHeight: isMobile ? '100vh' : '90vh',
          position: 'relative',
          zIndex: 1500,
          pointerEvents: 'auto'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <PaymentIcon />
        Pay in Installments
      </DialogTitle>
      <DialogContent sx={{ 
        color: 'rgba(255,255,255,0.92)', 
        px: isMobile ? 2 : 3,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-track': { bgcolor: 'rgba(72, 206, 219, 0.15)' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(72, 206, 219, 0.6)', borderRadius: 4, '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.8)' } },
        // Conditionally adjust height when verification or application screen is shown
        ...((showVerificationScreen || showApplicationForm) && { display: 'flex', flexDirection: 'column', height: '100%' })
      }}>
        {!showApplicationForm && !showVerificationScreen && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'rgba(72, 206, 219, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(72, 206, 219, 0.3)'
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block', mb: 0.5 }}>
              📋 <strong>Application Required:</strong> All installment purchases require verification
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              • Complete the form with personal & employment details • Upload required documents (ID, proof of income, etc.) • Review within 24-48 hours
            </Typography>
          </Box>
        )}
        {showApplicationForm ? (
          <InstallmentApplicationForm
            gadget={{
              id: item?.id,
              name,
              category,
              image: imageUrl
            }}
            variant={{
              id: variantId,
              storage: selectedStorage,
              color: selectedColor,
              condition: selectedCondition
            }}
            installmentPlan={{
              type: installmentType,
              weeks: weeks,
              depositAmount: Math.round(depositAmount),
              weeklyAmount: Math.round(weeklyAmount),
              totalAmount: Math.round(adjustedTotal)
            }}
            user={userProfile}
            formatPrice={formatLocalPrice}
            onSubmit={(response) => {
              console.log('Application submitted:', response);
              setShowApplicationForm(false);
              try { navigate('/dashboard/applications'); } catch (_) {}
              onClose();
            }}
            onCancel={() => {
              setShowApplicationForm(false);
              onClose();
            }}
          />
        ) : showVerificationScreen ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <VerificationEligibilityScreen 
              onComplete={() => {
                // Handle completion of verification
                setShowVerificationScreen(false);
                // Close the modal after verification is complete
                onClose();
              }} 
              onCancel={() => {
                // Handle cancellation of verification
                setShowVerificationScreen(false);
              }} 
              userAuthenticated={!!userProfile}
            />
          </Box>
        ) : (
          <>
            {/* Gadget image centered and larger */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, mb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box
            component="img"
            src={imageUrl}
            alt={name}
            sx={{ 
              width: 294, 
              height: 294, 
              objectFit: 'contain', 
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              p: 1,
              mb: 2
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', color: 'white' }}>{name}</Typography>
          
          {/* Collapsible Description */}
          {gadgetDescription && (
            <Box sx={{ mt: 1, width: '100%' }}>
              <Box
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
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
                  {descriptionExpanded ? 'Hide Details' : 'View Details'}
                </Typography>
                {descriptionExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={descriptionExpanded}>
                <Box sx={{ 
                  mt: 1, 
                  p: 1.5, 
                  bgcolor: 'rgba(255,255,255,0.03)', 
                  borderRadius: 1,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', lineHeight: 1.5, textAlign: 'left' }}>
                    {gadgetDescription}
                  </Typography>
                  {gadgetSpecifications && Object.keys(gadgetSpecifications).length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Specifications
                      </Typography>
                      {Object.entries(gadgetSpecifications).slice(0, 5).map(([key, value]) => {
                        const displayValue = Array.isArray(value) 
                          ? value.join(', ') 
                          : (typeof value === 'object' && value !== null)
                            ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')
                            : String(value);
                        return (
                          <Typography key={key} variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'left' }}>
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

        {/* Variant selectors - Button Picker Style */}
        {(conditionOptions.length > 0 || storageOptions.length > 0 || colorOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'white', opacity: 0.9 }}>Select Options</Typography>
            
            {/* Storage Picker */}
            {(storageOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                  Storage: <span style={{ color: 'white' }}>{storageOptions.length > 0 ? (selectedStorage || storageOptions[0]) : 'Not specified'}</span>
                  {variants.length === 0 && storageOptions.length > 0 && (
                    <Chip 
                      label={(() => {
                        const categoryLower = (category || '').toLowerCase();
                        if (categoryLower.includes('smartphone') || categoryLower.includes('phone')) return 'Default: 256GB';
                        if (categoryLower.includes('laptop')) return 'Default: 512GB';
                        return 'Default';
                      })()}
                      size="small" 
                      sx={{ ml: 1, bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', height: 18, fontSize: '0.7rem' }} 
                    />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {storageOptions.length === 0 ? (
                    <Box sx={{
                      px: 2, py: 1, borderRadius: 1,
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed'
                    }}>
                      Not specified
                    </Box>
                  ) : (
                    getStoragesWithStock().map(({ storage, hasStock }) => {
                      const isSelected = (selectedStorage || storageOptions[0]) === storage;
                      const categoryLower = (category || '').toLowerCase();
                      const isDefaultStorage = variants.length === 0 && (
                        (storage === '256GB' && (categoryLower.includes('smartphone') || categoryLower.includes('phone'))) ||
                        (storage === '512GB' && categoryLower.includes('laptop'))
                      );
                      return (
                        <Box
                          key={storage}
                          onClick={() => hasStock && handleStorageChange(storage)}
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
                    })
                  )}
                </Box>
              </Box>
            )}

            {/* Color Picker */}
            {(colorOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                  Colour: <span style={{ color: 'white' }}>{colorOptions.length > 0 ? (selectedColor || colorOptions[0]?.color) : 'Not specified'}</span>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {colorOptions.length === 0 ? (
                    <Box sx={{
                      px: 2, py: 1, borderRadius: 1,
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed'
                    }}>
                      Not specified
                    </Box>
                  ) : (
                    colorOptions.map((c) => {
                      const isSelected = (selectedColor || colorOptions[0]?.color) === c.color;
                      return (
                        <Box
                          key={c.color}
                          onClick={() => handleColorChange(c.color)}
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
                          {c.colorHex && (
                            <Box sx={{ 
                              width: 14, 
                              height: 14, 
                              borderRadius: '50%', 
                              bgcolor: c.colorHex || '#cccccc', 
                              border: '1px solid rgba(255,255,255,0.5)',
                              flexShrink: 0
                            }} />
                          )}
                          <span style={{ color: c.colorHex ? 'inherit' : '#ffffff' }}>{c.color}</span>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            )}

            {/* Condition Picker */}
            {(conditionOptions.length > 0 || (isVariantEligibleCategory && variants.length === 0)) && (
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, display: 'block' }}>
                  Condition: <span style={{ color: 'white' }}>{conditionOptions.length > 0 ? (CONDITION_TOKEN_TO_LABEL[selectedCondition] || 'New') : 'New'}</span>
                  {variants.length === 0 && (
                    <Chip label="Default: New" size="small" sx={{ ml: 1, bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', height: 18, fontSize: '0.7rem' }} />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {conditionOptions.length === 0 ? (
                    <Box sx={{
                      px: 2, py: 1, borderRadius: 1,
                      border: '2px solid #48CEDB',
                      bgcolor: 'rgba(72, 206, 219, 0.15)',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      New
                    </Box>
                  ) : (
                    getConditionsWithStock().map(({ label, hasStock, stock }) => {
                      const currentCondition = CONDITION_TOKEN_TO_LABEL[selectedCondition] || 'New';
                      const isSelected = currentCondition === label;
                      const isDefault = label === 'New' && variants.length === 0;
                      return (
                        <Box
                          key={label}
                          onClick={() => hasStock && handleConditionChange(label)}
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
                    })
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Installment Plan Type Selection */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'white' }}>Select Payment Plan</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Pay to Own */}
            <Box 
              onClick={(e) => {
                e.stopPropagation();
                setInstallmentType('pay-to-own');
              }}
              sx={{ 
                p: 1.5, 
                border: installmentType === 'pay-to-own' ? '2px solid #48CEDB' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: 1, 
                bgcolor: installmentType === 'pay-to-own' ? 'rgba(72, 206, 219, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#48CEDB',
                  bgcolor: 'rgba(72, 206, 219, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Radio 
                  checked={installmentType === 'pay-to-own'}
                  onChange={() => setInstallmentType('pay-to-own')}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    '&.Mui-checked': { color: '#48CEDB' },
                    p: 0,
                    mt: 0.5
                  }} 
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Pay to Own</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5 }}>
                    Pay deposit + weekly installments. Receive item after all payments complete.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Pay to Lease */}
            <Box 
              onClick={(e) => {
                e.stopPropagation();
                setInstallmentType('pay-to-lease');
              }}
              sx={{ 
                p: 1.5, 
                border: installmentType === 'pay-to-lease' ? '2px solid #48CEDB' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: 1, 
                bgcolor: installmentType === 'pay-to-lease' ? 'rgba(72, 206, 219, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#48CEDB',
                  bgcolor: 'rgba(72, 206, 219, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Radio 
                  checked={installmentType === 'pay-to-lease'}
                  onChange={() => setInstallmentType('pay-to-lease')}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    '&.Mui-checked': { color: '#48CEDB' },
                    p: 0,
                    mt: 0.5
                  }} 
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Pay to Lease</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5 }}>
                    Pay to borrow and use the device temporarily. Device remains under Xtrapush ownership.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Pay as You Go - DISABLED */}
            <Box 
              sx={{ 
                p: 1.5, 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: 1, 
                bgcolor: 'rgba(255, 255, 255, 0.02)', 
                opacity: 0.5, 
                cursor: 'not-allowed'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Radio 
                  disabled
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.3)', 
                    '&.Mui-checked': { color: 'white' },
                    p: 0,
                    mt: 0.5
                  }} 
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>
                    Pay as You Go
                    <Typography component="span" sx={{ ml: 1, fontSize: '0.7rem', bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', px: 1, py: 0.25, borderRadius: 1, fontWeight: 500 }}>
                      COMING SOON
                    </Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mt: 0.5 }}>
                    Receive and use device as yours while paying installments.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Plan-specific information */}
        {installmentType === 'pay-to-own' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderLeft: '3px solid rgba(72, 206, 219, 0.5)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              ✓ You will receive the item after completing all installment payments. Full ownership transfers to you.
            </Typography>
          </Box>
        )}

        {installmentType === 'pay-to-lease' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderLeft: '3px solid rgba(72, 206, 219, 0.5)', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2, fontWeight: 700 }}>Lease Details</Typography>
            
            {/* Lease Pricing Estimation */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1, border: '1px solid rgba(72, 206, 219, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 1, fontWeight: 600 }}>💰 Lease Pricing Estimate</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Gadget Price</Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{formatLocalPrice(basePrice)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Total with Interest</Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{calculateLeaseTotal()}</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 1.5 }}>
                * Earlier payments have lower interest rates. Longer periods result in higher interest charges.
              </Typography>
            </Box>
            
            {/* Lease Duration Picker */}
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1.5 }}>How long do you intend to use it?</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
              <Button variant={leaseDurationType === 'days' ? 'contained' : 'outlined'} onClick={() => setLeaseDurationType('days')} sx={{ color: 'white', borderColor: '#48CEDB', bgcolor: leaseDurationType === 'days' ? '#48CEDB' : 'transparent', flex: 1, minWidth: 80, py: 1 }}>Days</Button>
              <Button variant={leaseDurationType === 'weeks' ? 'contained' : 'outlined'} onClick={() => setLeaseDurationType('weeks')} sx={{ color: 'white', borderColor: '#48CEDB', bgcolor: leaseDurationType === 'weeks' ? '#48CEDB' : 'transparent', flex: 1, minWidth: 80, py: 1 }}>Weeks</Button>
              <Button variant={leaseDurationType === 'months' ? 'contained' : 'outlined'} onClick={() => setLeaseDurationType('months')} sx={{ color: 'white', borderColor: '#48CEDB', bgcolor: leaseDurationType === 'months' ? '#48CEDB' : 'transparent', flex: 1, minWidth: 80, py: 1 }}>Months</Button>
              <Button variant={leaseDurationType === 'custom' ? 'contained' : 'outlined'} onClick={() => setLeaseCalendarOpen(true)} sx={{ color: 'white', borderColor: '#48CEDB', bgcolor: leaseDurationType === 'custom' ? '#48CEDB' : 'transparent', flex: 1, minWidth: 80, py: 1 }}>Pick Dates</Button>
            </Box>
            {leaseDurationType !== 'custom' && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                  Enter number of {leaseDurationType}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <TextField
                      type="number"
                      label={leaseDurationType.charAt(0).toUpperCase() + leaseDurationType.slice(1)}
                      value={leaseDurationValue}
                      onChange={e => setLeaseDurationValue(Math.max(1, Number(e.target.value)))}
                      inputProps={{ min: 1 }}
                      fullWidth
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          color: '#333',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(14px, -9px) scale(0.85)',
                          background: 'white',
                          px: 0.5,
                          borderRadius: '2px'
                        }
                      }}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            )}
            {/* Calendar Modal for custom range */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Dialog open={leaseCalendarOpen} onClose={() => setLeaseCalendarOpen(false)}>
                <DialogTitle>Select Lease Dates</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                    <DatePicker
                      label="Start Date"
                      value={leaseCustomStart}
                      onChange={setLeaseCustomStart}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                    <DatePicker
                      label="End Date"
                      value={leaseCustomEnd}
                      onChange={setLeaseCustomEnd}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setLeaseCalendarOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setLeaseDurationType('custom');
                    setLeaseCalendarOpen(false);
                  }} disabled={!leaseCustomStart || !leaseCustomEnd}>Set</Button>
                </DialogActions>
              </Dialog>
            </LocalizationProvider>
            {/* Use Case Input */}
            <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'stretch' : 'flex-start' }}>
              <Typography variant="subtitle2" sx={{ color: 'white', minWidth: 180, mb: isMobile ? 1 : 0, alignSelf: isMobile ? 'flex-start' : 'center' }}>What do you want to use it for?</Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                value={leaseUseCase}
                onChange={e => setLeaseUseCase(e.target.value)}
                placeholder="Describe your intended use (e.g. work, school, travel, etc.)"
                sx={{ bgcolor: 'white', borderRadius: 1, flex: '2 1 240px' }}
              />
            </Box>
            {/* Policy Checklist (reuse existing) */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>Installment Policy Checklist</Typography>
              {/* Reuse policy acceptance UI below */}
            </Box>
          </Box>
        )}

        {installmentType === 'pay-as-you-go' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.15)', borderLeft: '3px solid rgba(33, 150, 243, 0.7)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block', mb: 1, fontWeight: 600 }}>
              ℹ️ Estimated Pricing
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 1 }}>
              The pricing and payment amounts shown below are ESTIMATED based on initial information.
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 200, 124, 0.95)', display: 'block', mb: 1 }}>
              Your actual payment plan will be finalized after our verification and assessment of your profile.
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Final amounts may vary. We will review your application and confirm final details.
            </Typography>
          </Box>
        )}

        {installmentType === 'pay-as-you-go' && (
          <>
            {/* Pay as You Go Benefits & Features */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 1.5, fontWeight: 600 }}>✨ Why Choose Pay as You Go?</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ color: '#48CEDB', fontWeight: 700 }}>📱</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block' }}>Get Device Today</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>Use immediately upon approval</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ color: '#48CEDB', fontWeight: 700 }}>💳</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block' }}>Flexible Payments</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>Pay over 2, 4, or 6 weeks</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ color: '#48CEDB', fontWeight: 700 }}>⚡</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block' }}>Quick Approval</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>Fast verification process</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ color: '#48CEDB', fontWeight: 700 }}>🎁</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block' }}>Better Terms Later</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>Unlock upgrades after completion</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Verification & Assessment Notice */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 152, 0, 0.95)', mb: 1, fontWeight: 600 }}>🔍 Verification & Assessment</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.8 }}>
                After you submit this request, our team will:
              </Typography>
              <Box sx={{ ml: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mb: 0.5 }}>
                  ✓ Verify your identity and contact details
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mb: 0.5 }}>
                  ✓ Assess your payment eligibility
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mb: 0.5 }}>
                  ✓ Confirm your final payment schedule
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  ✓ Arrange device delivery/pickup
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 152, 0, 0.85)', display: 'block', mt: 1, fontWeight: 600 }}>
                Approval typically takes 24-48 hours
              </Typography>
            </Box>

            {/* Pricing Breakdown with Assessment Note */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
              <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 1.5, fontWeight: 600 }}>💰 Estimated Payment Breakdown</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Base price</Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{formatLocalPrice(basePrice)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                    Adjusted total {totalAdjustmentPercentage > 0 ? `(+${totalAdjustmentPercentage}%)` : ''}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{formatLocalPrice(adjustedTotal)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                    Deposit ({depositPercentage}%)
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{formatLocalPrice(depositAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Remaining balance</Typography>
                  <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>{formatLocalPrice(remainingBalance)}</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 200, 124, 0.9)', display: 'block', mt: 1.5, fontWeight: 600 }}>
                * All amounts are estimated and subject to change after assessment
              </Typography>
            </Box>
          </>
        )}

        {(installmentType === 'pay-to-own') && (
          <>
            {/* Pay to Own / Pay to Lease Summary */}
            <Box sx={{ display: 'flex', gap: isMobile ? 1.5 : 2, mb: 2, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'white' }}>Weeks</Typography>
              <ToggleButtonGroup
                value={weeks}
                exclusive
                onChange={(event, newWeeks) => {
                  if (newWeeks !== null) {
                    setWeeks(newWeeks);
                  }
                }}
                sx={{
                  width: '100%',
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              >
                <ToggleButton value={2}>14 days</ToggleButton>
                <ToggleButton value={4}>28 days</ToggleButton>
                <ToggleButton value={6}>42 days</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Summary (weekly amount hidden, but show deposit and totals) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Base price</Typography>
                <Typography variant="body1">
                  {basePrice > 0 ? formatLocalPrice(basePrice) : 'Price not available'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Adjusted total {totalAdjustmentPercentage > 0 ? `(+${totalAdjustmentPercentage}%)` : ''}
                </Typography>
                <Typography variant="body1">
                  {isValidCalculation ? formatLocalPrice(adjustedTotal) : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Deposit ({depositPercentage}% paying)
                </Typography>
                <Typography variant="body1">
                  {isValidCalculation ? formatLocalPrice(depositAmount) : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Remaining</Typography>
                <Typography variant="body1">
                  {isValidCalculation ? formatLocalPrice(remainingBalance) : 'N/A'}
                </Typography>
              </Box>
            </Box>

            {installmentType === 'pay-to-lease' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 152, 0, 0.95)', mb: 1, fontWeight: 600 }}>📋 Lease Terms</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                  • Device must be returned in good condition after lease period
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                  • Option to purchase at end of lease (Pay to Own conversion)
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                  • Early termination fees may apply
                </Typography>
              </Box>
            )}
          </>
        )}

        {installmentType === 'pay-as-you-go' && (
          <>
            {/* Pay as You Go Weeks Selection */}
            <Box sx={{ display: 'flex', gap: isMobile ? 1.5 : 2, mb: 2, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'white' }}>Payment Period</Typography>
              <ToggleButtonGroup
                value={weeks}
                exclusive
                onChange={(event, newWeeks) => {
                  if (newWeeks !== null) {
                    setWeeks(newWeeks);
                  }
                }}
                sx={{
                  width: '100%',
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              >
                <ToggleButton value={2}>14 days</ToggleButton>
                <ToggleButton value={4}>28 days</ToggleButton>
                <ToggleButton value={6}>42 days</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </>
        )}

        {error ? (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
        ) : null}

        {/* Policy acceptance with toggle buttons (more reliable than radios) */}
        <Box sx={{ mt: 2, p: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                Do you accept the Installment Policy?
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={policyAccepted ? 'yes' : 'no'}
                onChange={(e, val) => { if (val) setPolicyAccepted(val === 'yes'); }}
                aria-label="policy acceptance"
                sx={{
                  width: isMobile ? '100%' : 'auto',
                  '& .MuiToggleButton-root': {
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.35)',
                    px: 1.5,
                    ...(isMobile ? { flex: 1 } : {})
                  },
                  '& .Mui-selected': {
                    bgcolor: 'rgba(72, 206, 219, 0.3)',
                    color: 'white'
                  }
                }}
              >
                <ToggleButton value="yes" aria-label="accept yes">Yes</ToggleButton>
                <ToggleButton value="no" aria-label="accept no">No</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Button
              onClick={() => navigate('/installment-policy')}
              variant="text"
              sx={{ color: '#48CEDB', textDecoration: 'underline' }}
            >
              Read Policy guide
            </Button>
          </Box>
          {!policyAccepted && (
            <Typography variant="caption" sx={{ mt: 1, color: 'rgba(255,255,255,0.8)' }}>
              You must select Yes to proceed.
            </Typography>
          )}
        </Box>
      </>
    )}
  </DialogContent>
      {!showVerificationScreen && (
        <DialogActions sx={{ p: 2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.5 }}>
          <Button onClick={onClose} variant="contained" disabled={isProcessing} sx={{ bgcolor: '#000', color: 'white', '&:hover': { bgcolor: '#111' }, width: isMobile ? '100%' : 'auto' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setError('');

              if (installmentType === 'pay-to-lease') {
                // Verification/eligibility logic for lease
                if (!leaseDurationType || (leaseDurationType !== 'custom' && !leaseDurationValue) || (leaseDurationType === 'custom' && (!leaseCustomStart || !leaseCustomEnd))) {
                  setError('Please select a valid lease duration.');
                  return;
                }
                if (!leaseUseCase.trim()) {
                  setError('Please describe your intended use.');
                  return;
                }
                if (!policyAccepted) {
                  setError('Please accept the Installment Policy.');
                  return;
                }

                setIsProcessing(true);
                const stockOk = await validateStockBeforeProceed();
                if (!stockOk) {
                  setIsProcessing(false);
                  return;
                }
                // Show verification screen for lease
                setShowVerificationScreen(true);
                setIsProcessing(false);
                return;
              }
              if (!policyAccepted) {
                setError('Please read and accept the Installment Policy before proceeding.');
                return;
              }
              await handleProceed();
            }}
            disabled={isProcessing || !policyAccepted || !isValidCalculation || (installmentType !== 'pay-to-lease' && (adjustedTotal <= 0 || depositAmount <= 0))}
            sx={{ bgcolor: '#000', color: 'white', '&:hover': { bgcolor: '#111' }, width: isMobile ? '100%' : 'auto' }}
          >
            Proceed
          </Button>
        </DialogActions>
      )}

      <AuthAlertModal
        open={authAlertOpen}
        onClose={() => setAuthAlertOpen(false)}
        title="Sign In Required"
        message="Please sign in to start an installment plan. Your installment details will be saved for you."
        actionLabel="Sign In"
        onAction={() => navigate('/signin')}
      />
    </Dialog>
  );
};

export default InstallmentModal;
