import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
  Stack,
  Alert,
  useTheme,
  TextField,
  CircularProgress,
  Container,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { InputAdornment } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import {
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  LocalShipping as ShippingIcon,
  EventAvailable as EventIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ContactSupport as SupportIcon,
  MonetizationOn as MonetizationOnIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Verified as VerifiedIcon,
  Devices as DevicesIcon,
  Recycling as RecyclingIcon,
  SwapHoriz as SwapHorizIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  StarBorder as StarBorderIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  EmojiEvents as EmojiEventsIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Search as SearchIcon, CalendarToday as CalendarTodayIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import { usePricing } from '../hooks/usePricing';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { ordersAPI, gadgetsAPI, subscriptionsAPI, tradeInAPI, analyticsAPI } from '../services/api.js';
import { startInstallmentPayment, generateInstallmentReceipt, scheduleInstallmentReminder, createSubscription, SUBSCRIPTION_PLAN } from '../services/paymentService.js';
import SubscriptionPaymentNotice from '../components/SubscriptionPaymentNotice.jsx';
import SubscriptionDeviceStatus from '../components/SubscriptionDeviceStatus.jsx';
import CartModal from '../components/CartModal.jsx';
import InstallmentModal from '../components/InstallmentModal.jsx';
import SquareCardModal from '../components/SquareCardModal.jsx';

const UserDashboard = () => {
  const { user, userRole, isAdmin, isSeller, isBuyer, userProfile, updateUserProfile } = useAuth();
  const { currency: locationCurrency = 'GBP' } = useLocation();
  const { currency: pricingCurrency, formatLocalPrice, formatLocalPriceCompact } = usePricing();
  const { items: wishlistItems } = useWishlist();
  const userCurrency = pricingCurrency || locationCurrency || 'GBP';

  const coveragePlans = [
    {
      name: 'XtraPush Plus',
      priceLabel: userCurrency === 'GBP' ? '£6/mo' : 'MWK 6,000/mo',
      color: '#48cedb',
      perks: [
        'Free unlimited delivery',
        'Single gadget insurance (1 year)',
        'Member discounts'
      ],
      cta: 'Activate Plus'
    },
    {
      name: 'XtraPush Premium',
      priceLabel: userCurrency === 'GBP' ? '£9.99/mo' : 'MWK 10,000/mo',
      color: '#7c3aed',
      perks: [
        'Everything in Plus',
        'Multiple gadget insurance (1 year each)',
        'Priority support & early access'
      ],
      cta: 'Upgrade to Premium'
    }
  ];
  
  // Profile state
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    town: '',
    address: '',
    postcode: '',
    phone: ''
  });

  // Helper function to get correct price based on location
  const getPriceForLocation = (gadget) => {
    if (!gadget) return 0;
    
    // For GBP users, try price_gbp or priceGbp first, fallback to price
    if (userCurrency === 'GBP') {
      const price = gadget?.price_gbp ?? gadget?.priceGbp ?? gadget?.price;
      return typeof price === 'string' ? Number(price.replace(/[^0-9.]/g, '')) : Number(price) || 0;
    }
    
    // For MWK users, use standard price field
    const price = gadget?.price;
    return typeof price === 'string' ? Number(price.replace(/[^0-9.]/g, '')) : Number(price) || 0;
  };

  // OPTIMIZED: Enhanced order item processing with better data handling
  const processOrderItemsEnhanced = (order) => {
    // Priority order for item data sources - most reliable first
    const itemSources = [
      // 1. Direct items array (most reliable)
      order.items,
        
      // 2. Cart data
      order.cart,
        
      // 3. Parse from notes (fallback)
      (() => {
        try {
          const notes = typeof order.notes === 'string' ? 
            JSON.parse(order.notes) : order.notes;
            
          // Try multiple note structures
          return notes?.items || 
                 notes?.items_details || 
                 notes?.cart || 
                 notes?.order_items || 
                 [];
        } catch (e) {
          console.warn('Could not parse order items from notes for order:', order.id);
          return [];
        }
      })()
    ];
  
    // Find the first valid item source with actual data
    const rawItems = itemSources.find(source => 
      Array.isArray(source) && source.length > 0
    ) || [];
  
    // Process and normalize items with comprehensive fallbacks
    return rawItems.map(item => {
      // Handle different item ID formats
      const itemId = item.id || 
                    item.gadget_id || 
                    item.gadgetId || 
                    item.itemId || 
                    item.product_id ||
                    null;
  
      // Comprehensive name resolution with multiple fallbacks
      const itemName = item.name || 
                      item.title || 
                      item.productName || 
                      item.gadgetName || 
                      'Unknown Item';
  
      // Brand with fallbacks
      const itemBrand = item.brand || 
                       item.manufacturer || 
                       item.make || 
                       '';
  
      // Model with fallbacks
      const itemModel = item.model || 
                       item.variant || 
                       item.spec || 
                       '';
  
      // Description hierarchy
      const itemDescription = item.description || 
                             item.desc || 
                             item.details || 
                             '';
  
      // Image with multiple fallback sources
      const itemImage = item.image || 
                       item.imageUrl || 
                       item.image_url || 
                       item.photo || 
                       item.thumbnail || 
                       '';
  
      // Category with fallbacks
      const itemCategory = item.category || 
                          item.type || 
                          item.class || 
                          '';
  
      // Storage specification
      const itemStorage = item.storage || 
                         item.capacity || 
                         item.size || 
                         '';
  
      // Color specification
      const itemColor = item.color || 
                       item.colour || 
                       '';
  
      // Condition specification
      const itemCondition = item.condition || 
                           item.quality || 
                           item.state || 
                           '';
  
      // Price resolution with currency awareness
      const baseUnitPrice = item.unitPrice || 
                           item.price || 
                           item.unit_price || 
                           0;
  
      const baseTotalPrice = item.totalPrice || 
                            item.total || 
                            item.total_price || 
                            (baseUnitPrice * (item.quantity || 1));
  
      // Quantity with proper defaults
      const itemQuantity = Math.max(1, parseInt(item.quantity) || 1);
  
      return {
        id: itemId,
        name: itemName,
        brand: itemBrand,
        model: itemModel,
        description: itemDescription,
        image: itemImage,
        category: itemCategory,
        quantity: itemQuantity,
        unitPrice: parseFloat(baseUnitPrice) || 0,
        totalPrice: parseFloat(baseTotalPrice) || 0,
        storage: itemStorage,
        color: itemColor,
        condition: itemCondition,
          
        // Preserve original data for debugging
        _original: item
      };
    });
  };
  
  // Enhanced currency formatter with better precision handling
  // Admin-specific currency formatter
  const formatAdminCurrency = (amount, currencyType = 'gbp') => {
    if (!amount || isNaN(amount)) return userCurrency === 'MWK' ? 'MWK 0' : '£0.00';
    
    const numAmount = parseFloat(amount);
    
    if (userCurrency === 'MWK') {
      if (currencyType === 'gbp') {
        // Convert GBP to MWK (approximate rate)
        return `MWK ${(numAmount * 1100).toLocaleString('en-MW')}`;
      } else {
        return `MWK ${numAmount.toLocaleString('en-MW')}`;
      }
    } else {
      if (currencyType === 'gbp') {
        return `£${numAmount.toFixed(2)}`;
      } else {
        // Convert MWK to GBP (approximate rate)
        return `£${(numAmount / 1100).toFixed(2)}`;
      }
    }
  };

  const formatCurrencyEnhanced = (amount, currencyCode = null) => {
    const displayCurrency = currencyCode || userCurrency;
      
    if (amount === null || amount === undefined) {
      return displayCurrency + ' N/A';
    }
      
    const num = Number(amount);
    if (!Number.isFinite(num)) {
      return displayCurrency + ' Invalid';
    }
      
    // Better precision handling
    if (displayCurrency === 'GBP') {
      return '£' + num.toFixed(2);
    } else {
      // MWK formatting with thousands separator
      return 'MWK ' + Math.round(num).toLocaleString('en-US');
    }
  };
  
  // Helper function to format currency based on order currency or user location
  const formatCurrency = (amount, orderCurrency = null) => {
    // Use order currency if provided, otherwise fall back to user currency
    const displayCurrency = orderCurrency || userCurrency;
      
    if (!amount && amount !== 0) return `${displayCurrency} N/A`;
    const num = Number(amount);
    if (!Number.isFinite(num)) return `${displayCurrency} N/A`;
      
    // Format based on the actual currency being displayed
    if (displayCurrency === 'GBP') {
      return '£' + num.toFixed(2);
    } else {
      return 'MWK ' + Math.round(num).toLocaleString();
    }
  };

  const [dashboardData, setDashboardData] = useState({
    orders: [],
    wishlist: [],
    recentActivity: [],
    stats: {
      totalSpent: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0
    },
    recommendations: [],
    userPreferences: {},
    installments: [],
    notifications: [],
    subscription: null,
    tradeIns: [],
    variantsSummary: { totalVariants: 0, lowStock: 0, attributes: {} },
    allGadgets: []
  });

  // Notifications anchor for header menu
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const openNotifMenu = Boolean(notifAnchorEl);
  const handleNotifClick = (e) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  // Search bar state and menu
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const openSearchMenu = Boolean(searchAnchorEl);
  const handleSearchFocus = (e) => setSearchAnchorEl(e.currentTarget);
  const handleSearchClose = () => setSearchAnchorEl(null);
  const handleSearchChange = (e) => {
    const q = e.target.value || '';
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const ql = q.toLowerCase();
    const gadgetMatches = (dashboardData.allGadgets || []).filter(g => (
      (g.name || '').toLowerCase().includes(ql) || (g.brand || '').toLowerCase().includes(ql)
    )).slice(0, 6).map(g => ({ type: 'gadget', id: g.id, label: (g.brand || '') + ' ' + (g.name || '').trim(), href: '/gadgets/' + g.id }));
    const orderMatches = (dashboardData.orders || []).filter(o => String(o.id || '').includes(q)).slice(0, 4).map(o => ({ type: 'order', id: o.id, label: 'Order #' + o.id, href: '/dashboard/orders/' + o.id }));
    const result = [...gadgetMatches, ...orderMatches];
    setSearchResults(result);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [payingInstallment, setPayingInstallment] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderScheduled, setReminderScheduled] = useState(false);
  const [leaseMessage, setLeaseMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedGadget, setSelectedGadget] = useState(null);
  const [featuredGadgets, setFeaturedGadgets] = useState([]);
  const [squareCardModalOpen, setSquareCardModalOpen] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [tradeInModalOpen, setTradeInModalOpen] = useState(false);
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [cancellingTradeIn, setCancellingTradeIn] = useState(false);

  const activeLease = dashboardData.installments?.[0];
  const leaseProgress = activeLease?.progress || 0;

  // Tab handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Initialize profile data
  useEffect(() => {
    setProfileData({
      fullName: (userProfile?.fullName ?? user?.displayName ?? ''),
      email: (userProfile?.email ?? user?.email ?? ''),
      town: (userProfile?.town ?? ''),
      address: (userProfile?.address ?? ''),
      postcode: (userProfile?.postcode ?? ''),
      phone: (userProfile?.phone ?? '')
    });
  }, [userProfile, user]);

  // Profile handlers
  const handleProfileInputChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setProfileError(null);
    setProfileSuccess(false);
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      // Accept any valid phone format - must have at least 7 digits
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
      if (profileData.phone && !phoneRegex.test(profileData.phone.trim())) {
        setProfileError('Please enter a valid phone number');
        setProfileLoading(false);
        return;
      }
      const result = await updateUserProfile(profileData);
      
      if (result.success) {
        setProfileSuccess(true);
        setProfileEditing(false);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('An unexpected error occurred');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || user?.displayName || '',
        email: userProfile.email || user?.email || '',
        town: userProfile.town || '',
        address: userProfile.address || '',
        postcode: userProfile.postcode || '',
        phone: userProfile.phone || ''
      });
    }
    setProfileEditing(false);
    setProfileError(null);
    setProfileSuccess(false);
  };

  // Modal handlers
  const handleBuyNow = (gadget) => {
    setSelectedGadget(gadget);
    setCartModalOpen(true);
  };

  const handleStartInstallment = (gadget) => {
    setSelectedGadget(gadget);
    setInstallmentModalOpen(true);
  };

  // Handler to view order items in modal - transforms order item to gadget format
  const handleViewOrderItem = (orderItem) => {
    if (!orderItem) return;
    
    // Transform order item to gadget format for modal compatibility
    const gadgetData = {
      id: orderItem.gadgetId || orderItem.id,
      name: orderItem.name || orderItem.gadgetName || 'Device',
      brand: orderItem.brand || '',
      category: orderItem.category || '',
      price: orderItem.price || 0,
      price_gbp: orderItem.priceGbp || orderItem.price_gbp,
      image: orderItem.image || orderItem.imageUrl || '/placeholder.jpg',
      condition: orderItem.condition || 'New',
      storage: orderItem.storage || null,
      color: orderItem.color || null,
      description: orderItem.description || '',
      // Keep track this is from an order (view-only mode)
      _isOrderView: true,
      _orderId: orderItem.orderId
    };
    
    setSelectedGadget(gadgetData);
    setCartModalOpen(true);
  };

  // Subscription handlers
  const handleSubscriptionClick = async (tier) => {
    if (!user?.uid || !user?.email) {
      alert('Please log in to subscribe');
      return;
    }

    // Prevent duplicate subscriptions
    if (dashboardData?.subscription?.isActive) {
      const currentTier = dashboardData.subscription.tier;
      
      if (currentTier === tier) {
        const tierName = tier === 'premium' ? 'Premium' : 'Plus';
        alert('You already have an active ' + tierName + ' subscription');
        return;
      }
      
      // Allow upgrade/downgrade between tiers
      const confirmMsg = currentTier === 'plus' && tier === 'premium'
        ? 'Upgrade to Premium? Your Plus subscription will be replaced.'
        : 'Downgrade to Plus? Your Premium subscription will be replaced.';
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      const isMalawi = locationCurrency === 'MWK';
      const countryCode = isMalawi ? 'MW' : 'GB';
      
      console.log('🌍 Location Detection:', {
        locationCurrency,
        isMalawi,
        countryCode,
        userCurrency
      });
      
      console.log('Creating subscription with params:', {
        userUid: user.uid,
        customerEmail: user.email,
        tier: tier,
        currency: isMalawi ? 'MWK' : 'GBP',
        countryCode: countryCode
      });
      
      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        currency: isMalawi ? 'MWK' : 'GBP',
        tier: tier, // 'plus' or 'premium'
        countryCode: countryCode
      });

      console.log('Subscription result:', result);

      // Handle different gateway responses
      if (result?.checkout_url) {
        // PayChangu: Redirect to mobile money checkout
        console.log('Redirecting to PayChangu checkout:', result.checkout_url);
        window.location.href = result.checkout_url;
      } else if (result?.requires_card) {
        // Square: Show card collection modal
        console.log('Square requires card - opening modal');
        setPendingSubscription({
          tier,
          amount: tier === 'premium' ? 999 : 600, // Pence
          currency: 'GBP',
          customerId: result.customer_id
        });
        setSquareCardModalOpen(true);
      } else if (result?.success) {
        // Direct success
        alert(result.message || 'Subscription created successfully!');
        window.location.reload();
      } else {
        console.error('Unexpected result:', result);
        alert('Failed to start subscription. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMsg = err?.message || err?.error || 'Unknown error';
      alert('Failed to start subscription: ' + errorMsg);
    }
  };

  // Handle Square card submission with card nonce
  const handleSquareCardSuccess = async (cardNonce) => {
    if (!pendingSubscription || !user?.uid || !user?.email) {
      alert('Session expired. Please try again.');
      setSquareCardModalOpen(false);
      return;
    }

    try {
      const isMalawi = locationCurrency === 'MWK';
      const countryCode = isMalawi ? 'MW' : 'GB';

      console.log('Completing Square subscription with card nonce');

      const result = await createSubscription({
        userUid: user.uid,
        customerEmail: user.email,
        successUrl: window.location.origin + '/dashboard?subscription=success',
        currency: 'GBP',
        tier: pendingSubscription.tier,
        countryCode: countryCode,
        cardNonce: cardNonce // Include card nonce
      });

      console.log('Square subscription with card result:', result);

      if (result?.success) {
        alert(result.message || 'Subscription activated successfully!');
        setSquareCardModalOpen(false);
        setPendingSubscription(null);
        window.location.reload();
      } else {
        throw new Error(result?.message || 'Failed to create subscription');
      }
    } catch (err) {
      console.error('Square card subscription error:', err);
      alert('Failed to complete subscription: ' + (err?.message || 'Unknown error'));
      // Keep modal open so user can try again
    }
  };

  // Trade-In handlers
  const handleViewTradeIn = (tradeIn) => {
    setSelectedTradeIn(tradeIn);
    setTradeInModalOpen(true);
  };

  const handleCancelTradeIn = async (tradeIn) => {
    if (!window.confirm('Are you sure you want to cancel trade-in application #' + tradeIn.reference + '?')) {
      return;
    }

    setCancellingTradeIn(true);
    try {
      const result = await tradeInAPI.cancel(tradeIn.reference, user?.uid);
      if (result?.success) {
        alert('Trade-in application cancelled successfully');
        // Refresh dashboard data
        window.location.reload();
      } else {
        throw new Error(result?.error || 'Failed to cancel trade-in');
      }
    } catch (err) {
      console.error('Cancel trade-in error:', err);
      alert('Failed to cancel trade-in: ' + (err?.message || 'Unknown error'));
    } finally {
      setCancellingTradeIn(false);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const uid = user?.uid || user?.id || null;
        
        if (!uid) {
          throw new Error('User not authenticated');
        }

        const [ordersRes, gadgetsRes, subscriptionRes, tradeInsRes] = await Promise.allSettled([
          ordersAPI.getUserOrders(uid),
          gadgetsAPI.getAll({ limit: 20 }),
          subscriptionsAPI.getStatus(uid),
          tradeInAPI.getHistory(uid)
        ]);

        const orders = ordersRes.status === 'fulfilled' && ordersRes.value?.orders ? ordersRes.value.orders : [];
        const allGadgets = gadgetsRes.status === 'fulfilled' && gadgetsRes.value?.data ? gadgetsRes.value.data : (gadgetsRes.status === 'fulfilled' && Array.isArray(gadgetsRes.value) ? gadgetsRes.value : []);
        const subscription = subscriptionRes.status === 'fulfilled' ? subscriptionRes.value : null;
        const tradeIns = tradeInsRes.status === 'fulfilled' && tradeInsRes.value?.tradeIns ? tradeInsRes.value.tradeIns : [];
        
        const wishlist = wishlistItems || [];
        const userPreferences = {};
        
        let recommendations = [];
        if (orders.length > 0) {
          const purchasedCategories = [];
          orders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                if (item.category && !purchasedCategories.includes(item.category)) {
                  purchasedCategories.push(item.category);
                }
              });
            }
          });
          
          recommendations = allGadgets
            .filter(gadget => purchasedCategories.includes(gadget.category))
            .slice(0, 12);
          
          if (recommendations.length < 12) {
            const popularGadgets = allGadgets
              .filter(gadget => !recommendations.some(r => r.id === gadget.id))
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 12 - recommendations.length);
            recommendations = [...recommendations, ...popularGadgets];
          }
        } else {
          recommendations = allGadgets
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 12);
        }

        const stats = {
          totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => !o.status?.includes('complete') && !o.status?.includes('delivered')).length,
          completedOrders: orders.filter(o => o.status?.includes('complete') || o.status?.includes('delivered')).length
        };

        const installments = [];
        for (const order of orders) {
          const notesObj = order?.notes ? (typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes) : {};
          if (notesObj?.installmentPlan) {
            const plan = notesObj.installmentPlan;
            installments.push({
              id: order.id,
              orderId: order.id,
              totalAmount: plan.totalAmount || order.totalAmount || 0,
              amountPaid: plan.amountPaid || 0,
              remaining: (plan.totalAmount || order.totalAmount || 0) - (plan.amountPaid || 0),
              weeks: plan.weeks || 0,
              weeklyAmount: plan.weeklyAmount || 0,
              startDate: plan.startDate || order.createdAt,
              nextDueDate: plan.nextDueDate || null,
              status: plan.status || 'pending',
              progress: plan.amountPaid && plan.totalAmount ? (plan.amountPaid / plan.totalAmount) * 100 : 0
            });
          }
        }

        const recentActivity = [];
        recentActivity.push(...orders.slice(0, 3).map((order, index) => ({
          id: 'order-' + (order.id || index),
          title: 'Order #' + (order.id || index + 1),
          description: 'Purchased ' + (order.items?.length || 1) + ' item(s)',
          date: order.createdAt || new Date(Date.now() - index * 86400000).toISOString(),
          status: order.status || 'pending',
          amount: order.totalAmount || 0,
          type: 'order'
        })));
        
        installments.forEach((installment, index) => {
          recentActivity.push({
            id: 'installment-' + (installment.id || index),
            title: 'Installment Payment',
            description: 'Payment for Order #' + installment.orderId,
            date: installment.nextDueDate || new Date().toISOString(),
            status: installment.status,
            amount: installment.weeklyAmount || 0,
            type: 'installment',
            progress: installment.progress
          });
        });
        
        recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const notifications = [];
        installments.forEach(installment => {
          if (installment.status === 'overdue') {
            notifications.push({
              id: 'notification-' + installment.id + '-overdue',
              title: 'Installment Payment Overdue',
              message: 'Payment for Order #' + installment.orderId + ' is overdue. Please make payment as soon as possible.',
              date: new Date().toISOString(),
              type: 'warning',
              priority: 'high'
            });
          } else if (installment.remaining > 0) {
            notifications.push({
              id: 'notification-' + installment.id + '-upcoming',
              title: 'Upcoming Payment Due',
              message: 'Next installment payment of ' + formatCurrency(installment.weeklyAmount) + ' due soon for Order #' + installment.orderId + '.',
              date: installment.nextDueDate || new Date().toISOString(),
              type: 'info',
              priority: 'medium'
            });
          }
        });
        
        orders.forEach(order => {
          if (order.status?.includes('shipped')) {
            notifications.push({
              id: 'notification-' + order.id + '-shipped',
              title: 'Order Shipped',
              message: 'Your order #' + order.id + ' has been shipped and is on its way.',
              date: order.updatedAt || new Date().toISOString(),
              type: 'info',
              priority: 'low'
            });
          }
        });

        // Compute variants summary for admin inventory insights
        const variantsSummary = (() => {
          const summary = { totalVariants: 0, lowStock: 0, attributes: {} };
          try {
            allGadgets.forEach(g => {
              const variants = Array.isArray(g.variants) ? g.variants : [];
              summary.totalVariants += variants.length;
              variants.forEach(v => {
                if (typeof v.stock === 'number' && v.stock <= 3) summary.lowStock += 1;
                // Aggregate attribute keys like color, storage, condition
                Object.keys(v || {}).forEach(key => {
                  if (['id','sku','price','stock'].includes(key)) return;
                  const val = v[key];
                  if (val == null) return;
                  summary.attributes[key] = summary.attributes[key] || new Set();
                  summary.attributes[key].add(String(val));
                });
              });
            });
            // Convert sets to counts
            Object.keys(summary.attributes).forEach(k => {
              summary.attributes[k] = summary.attributes[k].size;
            });
          } catch (_) {}
          return summary;
        })();

        // Fetch admin analytics if user is admin
        let adminAnalytics = null;
        if (isAdmin()) {
          try {
            const analyticsRes = await analyticsAPI.getDashboardStats();
            if (analyticsRes?.data) {
              // Transform backend data structure to match frontend expectations
              const transformedData = {
                ...analyticsRes.data,
                // Transform revenue stats
                revenue_stats: {
                  total_revenue_gbp: analyticsRes.data.revenue_stats?.gbp?.total || 0,
                  revenue_today_gbp: analyticsRes.data.revenue_stats?.gbp?.this_month || 0,
                  total_revenue_mwk: analyticsRes.data.revenue_stats?.mwk?.total || 0,
                  revenue_today_mwk: analyticsRes.data.revenue_stats?.mwk?.this_month || 0
                },
                // Transform subscription stats
                subscription_stats: {
                  active_subscriptions: parseInt(analyticsRes.data.subscription_stats?.active_count || 0),
                  plus_subscribers: parseInt(analyticsRes.data.subscription_stats?.plus_count || 0),
                  premium_subscribers: parseInt(analyticsRes.data.subscription_stats?.premium_count || 0),
                  total_subscriptions: parseInt(analyticsRes.data.subscription_stats?.total_subscriptions || 0)
                },
                // Order stats are already correctly structured but ensure numeric parsing
                order_stats: {
                  total_orders: parseInt(analyticsRes.data.order_stats?.total_orders || 0),
                  pending_orders: parseInt(analyticsRes.data.order_stats?.pending_orders || 0),
                  completed_orders: parseInt(analyticsRes.data.order_stats?.completed_orders || 0),
                  cancelled_orders: parseInt(analyticsRes.data.order_stats?.cancelled_orders || 0),
                  dispatched_orders: parseInt(analyticsRes.data.order_stats?.dispatched_orders || 0),
                  orders_this_month: parseInt(analyticsRes.data.order_stats?.orders_this_month || 0)
                }
              };
              adminAnalytics = transformedData;
            }
          } catch (e) {
            console.warn('Failed to fetch admin analytics:', e);
          }
        }

        setDashboardData({
          orders,
          wishlist,
          recentActivity,
          stats,
          recommendations: recommendations || [],
          userPreferences,
          installments,
          notifications,
          subscription,
          tradeIns,
          variantsSummary,
          allGadgets,
          adminAnalytics
        });
      } catch (err) {
        console.error('Error fetching user dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, isSeller, wishlistItems]);

  // Auto-schedule a reminder email one day before the next due date when a lease is present
  useEffect(() => {
    const scheduleReminder = async () => {
      try {
        if (!activeLease || reminderScheduled) return;
        await scheduleInstallmentReminder({ orderId: activeLease.orderId || activeLease.id, daysBefore: 1 });
        setReminderScheduled(true);
      } catch (err) {
        console.warn('Failed to schedule reminder', err);
      }
    };

    scheduleReminder();
  }, [activeLease, reminderScheduled]);

  const DashboardCard = ({ children, sx = {}, gradient = false, ...props }) => (
    <Card 
      sx={{ 
        bgcolor: gradient 
          ? 'transparent'
          : '#1e293b',
        background: gradient 
          ? 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(51,65,85,0.92))'
          : undefined,
        border: '1px solid #334155',
        borderRadius: 2,
        height: '100%',
        transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          borderColor: '#3b82f6',
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(59, 130, 246, 0.2)'
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );

  const QuickActionCard = ({ title, icon, description, onClick, count, badge }) => (
    <DashboardCard 
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: '#48cedb',
          boxShadow: '0 16px 48px rgba(72, 206, 219, 0.3)'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
          {badge ? (
            <Badge badgeContent={badge} color="error">
              {icon}
            </Badge>
          ) : (
            icon
          )}
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#f8fafc', 
            fontWeight: 600, 
            mb: 1,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1rem'
          }}
        >
          {title}
        </Typography>
        {count !== undefined && (
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#3b82f6', 
              fontWeight: 'bold', 
              mb: 1,
              fontSize: '1.75rem'
            }}
          >
            {count}
          </Typography>
        )}
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#94a3b8',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.85rem'
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </DashboardCard>
  );

  // Feature highlight card (Raylo/BackMarket style)
  const FeatureCard = ({ icon, title, description, color = '#3b82f6' }) => (
    <Card 
      sx={{ 
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
        height: '100%',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: color
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ mb: 2 }}>
          {React.cloneElement(icon, { sx: { fontSize: 40, color } })}
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#f8fafc', 
            fontWeight: 600, 
            mb: 1,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1rem'
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#94a3b8',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.85rem'
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  // Stat card (like AdminUsers MetricCard)
  const StatCard = ({ title, value, subtitle, icon, color = '#3b82f6' }) => (
    <DashboardCard>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5, fontFamily: 'Poppins' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color, fontFamily: 'Poppins' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color + '22', width: 56, height: 56, border: '2px solid ' + color + '33' }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
          </Avatar>
        </Stack>
      </CardContent>
    </DashboardCard>
  );

  const OrderStatusCard = ({ order }) => (
    <Paper sx={{ 
      p: 2, 
      mb: 1, 
      bgcolor: '#1e293b',
      border: '1px solid #334155',
      borderLeft: '4px solid ' + (order.status === 'delivered' ? '#10B981' : order.status === 'pre_order' ? '#f59e0b' : order.status === 'processing' ? '#F59E0B' : '#EF4444'),
      borderRadius: 1,
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: '#3b82f6',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)'
      }
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Order #{order.id || 'N/A'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {order.items?.length || 0} items • {order.totalAmount ? formatCurrency(order.totalAmount, order.currency) : 'Amount N/A'}
          </Typography>
          {order.status === 'pre_order' && (
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
              📦 Pre-Order - Expected delivery in ~7 days
            </Typography>
          )}
        </Box>
        <Box textAlign="right">
          <Chip 
            label={order.status === 'pre_order' ? 'PRE-ORDER' : (order.status || 'Pending')} 
            color={order.status === 'delivered' ? 'success' : order.status === 'pre_order' ? 'warning' : order.status === 'processing' ? 'warning' : 'error'} 
            size="small" 
            sx={{ 
              mb: 1,
              ...(order.status === 'pre_order' && {
                bgcolor: '#f59e0b',
                color: 'white',
                fontWeight: 700
              })
            }}
          />
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date N/A'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'white' }}>Loading your dashboard...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading dashboard: {error}</Alert>
      </Box>
    );
  }

  // Animation variants for carousel
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    const maxSlide = Math.ceil(dashboardData.recommendations.length / 1);
    setActiveSlide(prev => {
      const next = prev + newDirection;
      if (next < 0) return maxSlide - 1;
      if (next >= maxSlide) return 0;
      return next;
    });
  };

  const handlePayInstallment = async () => {
    if (!activeLease) return;
    setLeaseMessage(null);
    setPayingInstallment(true);
    try {
      const amount = Number(activeLease.weeklyAmount || activeLease.remaining || activeLease.totalAmount || 0);
      const session = await startInstallmentPayment({
        orderId: activeLease.orderId || activeLease.id,
        amount,
        currency: userCurrency,
        countryCode: locationCurrency === 'MWK' ? 'MW' : 'GB',
        customerEmail: profileData.email || user?.email,
        installmentPlan: activeLease,
        successUrl: window.location.origin + '/dashboard?installment=success&order=' + (activeLease.orderId || activeLease.id),
        cancelUrl: window.location.origin + '/dashboard?installment=cancel&order=' + (activeLease.orderId || activeLease.id)
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        setLeaseMessage('Payment session created. Continue in the checkout window.');
      }
    } catch (err) {
      console.error('Failed to start installment payment', err);
      setLeaseMessage('Could not start installment payment. Please try again.');
    } finally {
      setPayingInstallment(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!activeLease) return;
    setLeaseMessage(null);
    setReceiptLoading(true);
    try {
      const res = await generateInstallmentReceipt(activeLease.orderId || activeLease.id);
      const url = res?.receiptUrl || res?.url;
      if (url) {
        window.open(url, '_blank', 'noopener');
      } else {
        setLeaseMessage('Receipt not available yet.');
      }
    } catch (err) {
      console.error('Failed to fetch receipt', err);
      setLeaseMessage('Failed to fetch receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleScheduleReminder = async () => {
    if (!activeLease) return;
    setReminderLoading(true);
    setLeaseMessage(null);
    try {
      await scheduleInstallmentReminder({ orderId: activeLease.orderId || activeLease.id, daysBefore: 1 });
      setReminderScheduled(true);
      setLeaseMessage('Reminder scheduled — we will email you the day before.');
    } catch (err) {
      console.error('Failed to schedule reminder', err);
      setLeaseMessage('Could not schedule reminder.');
    } finally {
      setReminderLoading(false);
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      bgcolor: 'transparent',
      p: 0
    }}>
      {/* Scrollable Content Container */}
      <Box sx={{ 
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        minHeight: '100%',
        paddingBottom: 8,
        maxWidth: 1400,
        mx: 'auto'
      }}>
        {/* Hero Header Section - now pivotal with sticky header, notifications, search */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ 
            position: 'sticky', top: 0, zIndex: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
            px: { xs: 1, sm: 0 }, py: 1,
            bgcolor: 'rgba(5, 19, 35, 0.8)',
            borderBottom: '1px solid rgba(72, 206, 219, 0.15)'
          }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography 
                variant="h3" 
                component="h1"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                  mb: 0.5
                }}
              >
                Welcome back, <span style={{ color: '#48cedb' }}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.75)', 
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  maxWidth: 600
                }}
              >
                Your central hub for orders, payments, devices, and inventory.
              </Typography>
            </Box>
            {/* Go Home Button */}
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => window.location.href = '/'}
              sx={{
                color: '#48cedb',
                borderColor: '#48cedb',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#48cedb',
                  bgcolor: 'rgba(72, 206, 219, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(72, 206, 219, 0.3)'
                }
              }}
            >
              Go Home
            </Button>
            {/* Header Actions moved to EnhancedAppBar - Search, Date, Notifications now in top AppBar */}
              <Menu anchorEl={notifAnchorEl} open={openNotifMenu} onClose={handleNotifClose} 
                PaperProps={{ sx: { bgcolor: 'rgba(5, 19, 35, 0.95)', border: '1px solid rgba(72, 206, 219, 0.3)', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'auto', overflowX: 'hidden' } }}>
                {dashboardData.notifications.length === 0 ? (
                  <MenuItem sx={{ color: 'rgba(255,255,255,0.8)' }}>No notifications</MenuItem>
                ) : (
                  dashboardData.notifications.slice(0, 8).map((n) => (
                    <MenuItem key={n.id} sx={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'start', gap: 1 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {n.type === 'warning' ? <CancelIcon sx={{ color: '#F59E0B' }} /> : <InfoIcon sx={{ color: '#48cedb' }} />}
                      </ListItemIcon>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{n.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(n.date).toLocaleString()}</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>{n.message}</Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
                {dashboardData.notifications.length > 8 && (
                  <MenuItem sx={{ color: '#48cedb', fontWeight: 600 }} onClick={() => window.location.href = '/dashboard/notifications'}>
                    View all notifications
                  </MenuItem>
                )}
              </Menu>
          </Box>

        {/* Subscription Payment Notice - appears when PayChangu subscription needs payment */}
        {dashboardData.subscription && (
          <SubscriptionPaymentNotice 
            subscription={dashboardData.subscription}
            user={user}
            onPaymentInitiated={(result) => {
              console.log('Payment initiated for subscription renewal', result);
            }}
          />
        )}

        {/* Today at a glance - role-based KPIs */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {isAdmin() ? (
              <>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Revenue" value={userCurrency === "MWK" ? formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.total_revenue_mwk || 0, "mwk") : formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.total_revenue_gbp || 0, "gbp")} subtitle={userCurrency === "MWK" ? formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.revenue_today_mwk || 0, "mwk") + " today" : formatAdminCurrency(dashboardData.adminAnalytics?.revenue_stats?.revenue_today_gbp || 0, "gbp") + " today"} icon={<MonetizationOnIcon />} color="#10B981" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Orders" value={dashboardData.adminAnalytics?.order_stats?.total_orders || dashboardData.stats.totalOrders} subtitle={(dashboardData.adminAnalytics?.order_stats?.pending_orders || dashboardData.stats.pendingOrders) + ' pending'} icon={<AssignmentIcon />} color="#F59E0B" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Subscriptions" value={dashboardData.adminAnalytics?.subscription_stats?.active_subscriptions || 0} subtitle={(dashboardData.adminAnalytics?.subscription_stats?.plus_subscribers || 0) + ' Plus / ' + (dashboardData.adminAnalytics?.subscription_stats?.premium_subscribers || 0) + ' Premium'} icon={<VerifiedIcon />} color="#7c3aed" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Inventory" value={dashboardData.adminAnalytics?.gadget_stats?.total_gadgets || dashboardData.allGadgets.length} subtitle={dashboardData.variantsSummary.lowStock > 0 ? dashboardData.variantsSummary.lowStock + ' low stock' : 'All stocked'} icon={<DevicesIcon />} color={dashboardData.variantsSummary.lowStock > 0 ? '#EF4444' : '#48cedb'} /></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={3}><StatCard title="My Orders" value={dashboardData.stats.totalOrders} subtitle={dashboardData.stats.pendingOrders > 0 ? dashboardData.stats.pendingOrders + ' pending' : 'All delivered'} icon={<AssignmentIcon />} color="#F59E0B" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Active Installments" value={dashboardData.installments.filter(i=>i.remaining>0).length} subtitle={dashboardData.installments.filter(i=>i.remaining>0).length > 0 ? 'Payments due' : 'No payments due'} icon={<WalletIcon />} color="#48cedb" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Trade-Ins" value={dashboardData.tradeIns.length} subtitle={dashboardData.tradeIns.filter(t=>t.status==='pending').length > 0 ? dashboardData.tradeIns.filter(t=>t.status==='pending').length + ' pending review' : 'No active trade-ins'} icon={<SwapHorizIcon />} color="#F59E0B" /></Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Navigation Tabs - like AdminUsers */}
        <Paper 
          sx={{ 
            mb: 4, 
            bgcolor: 'rgba(5, 19, 35, 0.6)', 
            border: '1px solid rgba(72, 206, 219, 0.15)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                minHeight: 56,
                px: { xs: 2, sm: 3 },
                pr: { xs: 3, sm: 4 },
                minWidth: { xs: 'auto', sm: 160 },
                overflow: 'visible'
              },
              '& .Mui-selected': { color: '#48cedb' },
              '& .MuiTabs-indicator': { backgroundColor: '#48cedb', height: 3 },
              '& .MuiTabs-scrollButtons': {
                color: '#48cedb',
                '&.Mui-disabled': { opacity: 0.3 }
              }
            }}
          >
            <Tab icon={<SpeedIcon />} iconPosition="start" label="OVERVIEW" />
            <Tab 
              icon={<StarBorderIcon />} 
              iconPosition="start" 
              label="BILLING" 
            />
            <Tab 
              icon={<DevicesIcon />} 
              iconPosition="start" 
              label={
                <Box sx={{ display:'flex', alignItems:'center', gap:1, pr: 2 }}>
                  <span>GADGETS</span>
                  <Badge 
                    badgeContent={dashboardData.orders.length} 
                    color="primary" 
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        position: 'relative',
                        transform: 'none',
                        fontSize: '0.7rem',
                        minWidth: 20,
                        height: 20,
                        borderRadius: '10px'
                      }
                    }} 
                  />
                </Box>
              } 
            />
            <Tab 
              icon={<SwapHorizIcon />} 
              iconPosition="start" 
              label={
                <Box sx={{ display:'flex', alignItems:'center', gap:1, pr: 2 }}>
                  <span>TRADE-INS</span>
                  <Badge 
                    badgeContent={dashboardData.tradeIns.filter(t => t.status === 'pending').length} 
                    color="warning" 
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        position: 'relative',
                        transform: 'none',
                        fontSize: '0.7rem',
                        minWidth: 20,
                        height: 20,
                        borderRadius: '10px'
                      }
                    }} 
                  />
                </Box>
              } 
            />
          </Tabs>
        </Paper>

        {/* Tab 0: Overview */}
        {activeTab === 0 && (
          <>
            {/* Quick Actions */}
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#48cedb', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Poppins, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <SpeedIcon /> Quick Actions
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3} md={3}>
                <QuickActionCard
                  title="Orders"
                  icon={<AssignmentIcon sx={{ fontSize: 36, color: '#48cedb' }} />}
                  description="View all orders"
                  count={dashboardData.stats.totalOrders}
                  onClick={() => setActiveTab(0)}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <QuickActionCard
                  title="Installments"
                  icon={<WalletIcon sx={{ fontSize: 36, color: '#48cedb' }} />}
                  description="Payment plans"
                  count={dashboardData.installments.length}
                  onClick={() => setActiveTab(1)}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <QuickActionCard
                  title="Trade-Ins"
                  icon={<SwapHorizIcon sx={{ fontSize: 36, color: '#48cedb' }} />}
                  description="Trade devices"
                  count={dashboardData.tradeIns.length}
                  badge={dashboardData.tradeIns.filter(t => t.status === 'pending').length}
                  onClick={() => setActiveTab(2)}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <QuickActionCard
                  title="Support"
                  icon={<SupportIcon sx={{ fontSize: 36, color: '#48cedb' }} />}
                  description="Get help"
                  onClick={() => window.location.href = '/support'}
                />
              </Grid>
            </Grid>



            {/* Trade-In Applications */}
            {!isAdmin() && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <DashboardCard
                    sx={{
                      background: 'linear-gradient(135deg, rgba(72, 206, 219, 0.12) 0%, rgba(72, 206, 219, 0.05) 100%)',
                      border: '2px solid #48cedb'
                    }}
                  >
                    <CardHeader
                      title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SwapHorizIcon sx={{ color: '#48cedb' }} /><span>My Trade-In Applications</span></Box>}
                      subheader={dashboardData.tradeIns.length > 0 ? 'You have ' + dashboardData.tradeIns.length + ' trade-in application(s)' : "Trade in your old devices for instant credit"}
                      action={<Button variant="contained" size="small" onClick={() => setActiveTab(2)} sx={{ bgcolor: '#48cedb', color: 'black', fontWeight: 700 }}>New Trade-In</Button>}
                      sx={{ '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 700, fontSize: '1.2rem' } }}
                    />
                    <CardContent>
                      {dashboardData.tradeIns && dashboardData.tradeIns.length > 0 ? (
                        <Grid container spacing={2}>
                          {dashboardData.tradeIns.map((tradeIn, idx) => {
                            const statusColors = {
                              pending: '#F59E0B',
                              under_review: '#48cedb',
                              approved: '#10B981',
                              rejected: '#EF4444',
                              completed: '#6B7280',
                              cancelled: '#94A3B8'
                            };
                            const statusColor = statusColors[tradeIn.status] || '#F59E0B';
                            
                            return (
                              <Grid item xs={12} sm={6} md={4} lg={3} key={tradeIn.reference || idx}>
                                <Paper sx={{ 
                                  p: 2, 
                                  bgcolor: 'rgba(5, 19, 35, 0.5)', 
                                  border: `1px solid ${statusColor}40`,
                                  borderRadius: 2,
                                  transition: 'all 0.3s ease',
                                  '&:hover': { boxShadow: '0 8px 24px ' + statusColor + '30', borderColor: statusColor }
                                }}>
                                  <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Chip
                                        size="small"
                                        label={tradeIn.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                        sx={{ 
                                          bgcolor: `${statusColor}20`, 
                                          color: statusColor, 
                                          fontWeight: 700,
                                          textTransform: 'uppercase'
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        #{tradeIn.reference?.slice(-8)}
                                      </Typography>
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                                      {tradeIn.deviceModel || tradeIn.model || 'Device'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                                      {tradeIn.deviceBrand || tradeIn.brand} • {tradeIn.deviceCondition || tradeIn.condition}
                                    </Typography>
                                    {tradeIn.estimatedValue ? (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                          Estimated Value
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: statusColor, fontWeight: 700 }}>
                                          {formatCurrency(tradeIn.estimatedValue)}
                                        </Typography>
                                      </Box>
                                    ) : null}
                                    {tradeIn.finalValue ? (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                          Final Offer
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                                          {formatCurrency(tradeIn.finalValue)}
                                        </Typography>
                                      </Box>
                                    ) : null}
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                      {new Date(tradeIn.createdAt).toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Stack spacing={2} sx={{ py: 3, textAlign: 'center' }}>
                          <Box sx={{ fontSize: 48, opacity: 0.5 }}>📱</Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            No Trade-Ins Yet
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 500, mx: 'auto' }}>
                            Get instant value for your old devices. Trade in and upgrade to the latest gadgets with ease.
                          </Typography>
                          <Button 
                            variant="contained" 
                            size="large" 
                            onClick={() => setActiveTab(2)}
                            sx={{ 
                              bgcolor: '#48cedb', 
                              color: 'black', 
                              fontWeight: 700, 
                              mt: 2,
                              maxWidth: 200,
                              mx: 'auto',
                              '&:hover': { bgcolor: '#36b8c7' }
                            }}
                          >
                            Start Trade-In
                          </Button>
                        </Stack>
                      )}
                    </CardContent>
                  </DashboardCard>
                </Grid>
              </Grid>
            )}

            {/* Subscription Management Section */}
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#48cedb', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Poppins, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <StarBorderIcon /> Subscription Plans
            </Typography>

            {/* Feature Highlights - Raylo/BackMarket style */}
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#48cedb', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Poppins, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <VerifiedIcon /> Why Choose Xtrapush
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {isAdmin() && (
                <Grid item xs={12}>
                  <DashboardCard>
                    <CardHeader title="Variants & Inventory" subheader="Diversity across attributes" sx={{ '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 700 } }} />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Variants" value={dashboardData.variantsSummary.totalVariants} subtitle="Across all gadgets" icon={<DevicesIcon />} color="#48cedb" /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Low Stock" value={dashboardData.variantsSummary.lowStock} subtitle="≤3 units" icon={<SecurityIcon />} color="#EF4444" /></Grid>
                        {Object.entries(dashboardData.variantsSummary.attributes || {}).slice(0, 4).map(([attr, count]) => (
                          <Grid item xs={12} sm={6} md={3} key={attr}><StatCard title={attr.charAt(0).toUpperCase() + attr.slice(1)} value={count} subtitle="distinct values" icon={<VerifiedIcon />} color="#10B981" /></Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </DashboardCard>
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard 
                  icon={<RecyclingIcon />}
                  title="Sustainable Tech"
                  description="Reduce e-waste with certified refurbished devices"
                  color="#10B981"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard 
                  icon={<SecurityIcon />}
                  title="1-Year Warranty"
                  description="Full protection with XtraPush Plus coverage"
                  color="#48cedb"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard 
                  icon={<SwapHorizIcon />}
                  title="Easy Trade-In"
                  description="Upgrade and get value for your old device"
                  color="#F59E0B"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard 
                  icon={<SpeedIcon />}
                  title="Free Delivery"
                  description="Fast free shipping with Plus or Premium plans"
                  color="#7c3aed"
                />
              </Grid>
            </Grid>

            {/* Recommendations Carousel - Hidden for Admins */}
            {!isAdmin() && dashboardData.recommendations.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#48cedb', 
                    fontWeight: 600, 
                    mb: 3,
                    fontFamily: 'Poppins, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <StarBorderIcon /> Recommended For You
                </Typography>
                <DashboardCard gradient sx={{ overflow: 'hidden', minHeight: 500 }}>
                  <CardContent sx={{ p: 0, height: '100%' }}>
                    <Box sx={{ 
                      position: 'relative', 
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(5, 19, 35, 0.95), rgba(16, 56, 82, 0.9))'
                    }}>
                      {/* Navigation Arrows */}
                      <IconButton
                        onClick={() => paginate(-1)}
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          bgcolor: 'rgba(72, 206, 219, 0.2)',
                          color: '#48cedb',
                          '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.4)' }
                        }}
                      >
                        <ChevronLeftIcon sx={{ fontSize: 32 }} />
                      </IconButton>
                      <IconButton
                        onClick={() => paginate(1)}
                        sx={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          bgcolor: 'rgba(72, 206, 219, 0.2)',
                          color: '#48cedb',
                          '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.4)' }
                        }}
                      >
                        <ChevronRightIcon sx={{ fontSize: 32 }} />
                      </IconButton>

                      {/* Carousel Content */}
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
                              opacity: { duration: 0.4 }
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
                                padding: 4,
                                textAlign: 'center'
                              }}
                            >
                              {/* Product Image */}
                              <motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                style={{
                                  width: '280px',
                                  height: '280px',
                                  marginBottom: '1.5rem',
                                  borderRadius: '20px',
                                  overflow: 'hidden'
                                }}
                              >
                                <img
                                  src={dashboardData.recommendations[activeSlide]?.image || '/placeholder.jpg'}
                                  alt={dashboardData.recommendations[activeSlide]?.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    backgroundColor: 'rgba(5, 19, 35, 0.8)',
                                    boxShadow: '0 25px 65px rgba(72, 206, 219, 0.35)'
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
                                  variant="h5" 
                                  sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontFamily: 'Poppins' }}
                                >
                                  {dashboardData.recommendations[activeSlide]?.name}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#48cedb', mb: 2, fontFamily: 'Poppins' }}>
                                  {dashboardData.recommendations[activeSlide]?.brand}
                                </Typography>
                                <Typography 
                                  variant="h4" 
                                  sx={{ color: '#48cedb', fontWeight: 'bold', mb: 3, fontSize: '2rem', fontFamily: 'Poppins' }}
                                >
                                  {formatCurrency(getPriceForLocation(dashboardData.recommendations[activeSlide]))}
                                </Typography>
                                <Button
                                  variant="contained"
                                  size="large"
                                  onClick={() => window.location.href = '/gadgets/' + (dashboardData.recommendations[activeSlide]?.id || '')}
                                  sx={{
                                    bgcolor: '#48cedb',
                                    color: 'white',
                                    px: 4,
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: '#3aa6b8', boxShadow: '0 10px 30px rgba(72, 206, 219, 0.4)' }
                                  }}
                                >
                                  View Details
                                </Button>
                              </motion.div>

                              {/* Dot Indicators */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{ marginTop: '1.5rem', display: 'flex', gap: '8px', justifyContent: 'center' }}
                              >
                                {dashboardData.recommendations.map((_, index) => (
                                  <motion.button
                                    key={index}
                                    onClick={() => setActiveSlide(index)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                      width: activeSlide === index ? '32px' : '12px',
                                      height: '12px',
                                      borderRadius: '6px',
                                      backgroundColor: activeSlide === index ? '#48cedb' : 'rgba(255, 255, 255, 0.3)',
                                      border: 'none',
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
                    </Box>
                  </CardContent>
                </DashboardCard>
              </Box>
            )}
          </>
        )}

        {/* Tab 1: Billing (Subscriptions) */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Subscription Management */}
            <Grid item xs={12}>
              <DashboardCard 
                gradient
                sx={{
                  background: dashboardData.subscription?.isActive
                    ? 'linear-gradient(135deg, rgba(72, 206, 219, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(5, 19, 35, 0.95), rgba(16, 56, 82, 0.9))',
                  border: dashboardData.subscription?.isActive
                    ? '2px solid #10B981'
                    : '1px solid rgba(72, 206, 219, 0.3)'
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon sx={{ color: '#48cedb' }} />
                      <span>Subscription Management</span>
                    </Box>
                  }
                  subheader={
                    dashboardData.subscription?.isActive
                      ? 'Active ' + (dashboardData.subscription.tier === 'premium' ? 'Premium' : 'Plus') + ' Plan'
                      : 'Protect your devices with insurance coverage'
                  }
                  sx={{
                    '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 'bold', fontSize: '1.1rem' },
                    '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                <CardContent>
                  {dashboardData.subscription?.isActive ? (
                    <Stack spacing={2.5}>
                      {/* Device Status and Linking */}
                      <SubscriptionDeviceStatus
                        subscription={dashboardData.subscription}
                        onDeviceChanged={(device) => {
                          console.log('Device linked:', device);
                          // Refresh subscription data
                          window.location.reload();
                        }}
                      />

                      {/* Active Subscription Card */}
                      <Paper
                        sx={{
                          p: 2.5,
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(72, 206, 219, 0.1) 100%)',
                          border: '2px solid #10B981',
                          borderRadius: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                              {dashboardData.subscription.tier === 'premium' ? 'XtraPush Premium' : 'XtraPush Plus'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                              {dashboardData.subscription.tier === 'premium'
                                ? (userCurrency === 'GBP' ? '£9.99/mo' : 'MWK 10,000/mo')
                                : (userCurrency === 'GBP' ? '£6/mo' : 'MWK 6,000/mo')
                              }
                            </Typography>
                          </Box>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="ACTIVE"
                            size="small"
                            sx={{
                              bgcolor: '#10B981',
                              color: 'white',
                              fontWeight: 700
                            }}
                          />
                        </Box>

                        <Divider sx={{ mb: 2, bgcolor: 'rgba(16, 185, 129, 0.3)' }} />

                        {/* Coverage Info */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, mb: 1 }}>
                            📱 Device Coverage:
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {dashboardData.subscription.tier === 'premium'
                              ? '✅ ALL your devices are covered (laptops, smartphones, tablets)'
                              : '✅ ONE device covered (laptop, smartphone, or tablet)'
                            }
                          </Typography>
                        </Box>

                        {/* Benefits */}
                        <Stack spacing={0.75}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                              Free unlimited delivery
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                              {dashboardData.subscription.tier === 'premium' ? 'Multiple' : 'Single'} gadget insurance (1 year)
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                              Member discounts
                            </Typography>
                          </Stack>
                          {dashboardData.subscription.tier === 'premium' && (
                            <>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                  Priority support
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                  Early access to new gadgets
                                </Typography>
                              </Stack>
                            </>
                          )}
                        </Stack>

                        {/* Manage Button */}
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          href="/dashboard/subscription"
                          sx={{
                            mt: 2,
                            color: '#10B981',
                            borderColor: '#10B981',
                            borderWidth: 2,
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#10B981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderWidth: 2
                            }
                          }}
                        >
                          Manage Subscription
                        </Button>
                      </Paper>

                      {/* Upgrade Option for Plus users */}
                      {dashboardData.subscription.tier === 'plus' && (
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(124, 58, 237, 0.1)',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                            🚀 Upgrade to Premium
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 1.5 }}>
                            Cover ALL devices + priority support for just {userCurrency === 'GBP' ? '£3.99' : 'MWK 4,000'} more/month
                          </Typography>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={() => handleSubscriptionClick('premium')}
                            sx={{
                              bgcolor: '#7c3aed',
                              fontWeight: 600,
                              '&:hover': { bgcolor: '#6d28d9' }
                            }}
                          >
                            Upgrade Now
                          </Button>
                        </Paper>
                      )}
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      {/* No Subscription - Show Options */}
                      {coveragePlans.map((plan) => (
                        <Paper
                          key={plan.name}
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(5, 19, 35, 0.6)',
                            border: `2px solid ${plan.color}33`,
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 24px ${plan.color}44`,
                              border: `2px solid ${plan.color}`
                            }
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={1.5}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>
                                {plan.name}
                              </Typography>
                              <Typography variant="h6" sx={{ color: plan.color, fontWeight: 700 }}>
                                {plan.priceLabel}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSubscriptionClick(plan.name === 'XtraPush Plus' ? 'plus' : 'premium')}
                              sx={{
                                bgcolor: plan.color,
                                color: 'white',
                                fontWeight: 700,
                                '&:hover': { bgcolor: plan.color, filter: 'brightness(1.15)' }
                              }}
                            >
                              {plan.cta}
                            </Button>
                          </Stack>
                          <Stack spacing={0.5}>
                            {plan.perks.map((perk) => (
                              <Stack key={perk} direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 16, color: plan.color }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                  {perk}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Paper>
                      ))}
                      
                      <Alert 
                        severity="info" 
                        sx={{ 
                          bgcolor: 'rgba(72, 206, 219, 0.1)',
                          border: '1px solid rgba(72, 206, 219, 0.3)',
                          '& .MuiAlert-message': { color: 'rgba(255, 255, 255, 0.9)' }
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          💳 Payments via {userCurrency === 'GBP' ? 'Square' : 'PayChangu'} • Auto-renewable monthly
                        </Typography>
                      </Alert>
                    </Stack>
                  )}
                </CardContent>
              </DashboardCard>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Gadgets (My Devices) */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DashboardCard gradient>
                <CardHeader
                  title="My Devices"
                  subheader="Track your purchased gadgets and their status"
                  sx={{
                    '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 'bold', fontFamily: 'Poppins' },
                    '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                <CardContent>
                  {dashboardData.orders.length > 0 ? (
                    <Grid container spacing={3}>
                      {dashboardData.orders.map((order, idx) => (
                        <React.Fragment key={order.id || idx}>
                          {/* If order has items, show each item as a card */}
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, itemIdx) => (
                              <Grid item xs={12} sm={6} md={4} key={`${order.id}-${itemIdx}`}>
                                <Paper sx={{ 
                                  p: 2.5, 
                                  bgcolor: 'rgba(5, 19, 35, 0.5)', 
                                  border: '1px solid rgba(72, 206, 219, 0.2)',
                                  borderRadius: 2,
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 24px rgba(72, 206, 219, 0.25)',
                                    border: '1px solid rgba(72, 206, 219, 0.4)'
                                  }
                                }}
                                onClick={() => handleViewOrderItem({ ...item, orderId: order.id })}
                                >
                                  <Stack spacing={2}>
                                    {/* Device Image */}
                                    {item.image && (
                                      <Box sx={{ 
                                        width: '100%', 
                                        height: 160, 
                                        borderRadius: 1, 
                                        overflow: 'hidden',
                                        bgcolor: 'rgba(0, 0, 0, 0.3)'
                                      }}>
                                        <img 
                                          src={item.image || item.imageUrl || '/placeholder.jpg'} 
                                          alt={item.name} 
                                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }}
                                        />
                                      </Box>
                                    )}
                                    
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#48cedb', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {item.brand || 'Device'}
                                      </Typography>
                                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                                        {item.name || item.gadgetName || 'Unknown Device'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        Order #{order.id}
                                      </Typography>
                                    </Box>
                                    
                                    {/* Variant Details */}
                                    {(item.storage || item.color || item.condition) && (
                                      <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {item.storage && (
                                          <Chip 
                                            label={item.storage} 
                                            size="small" 
                                            sx={{ 
                                              bgcolor: 'rgba(72, 206, 219, 0.15)', 
                                              color: '#48cedb',
                                              fontSize: '0.7rem'
                                            }} 
                                          />
                                        )}
                                        {item.color && (
                                          <Chip 
                                            label={item.color} 
                                            size="small" 
                                            sx={{ 
                                              bgcolor: 'rgba(124, 58, 237, 0.15)', 
                                              color: '#7c3aed',
                                              fontSize: '0.7rem'
                                            }} 
                                          />
                                        )}
                                        {item.condition && (
                                          <Chip 
                                            label={item.condition} 
                                            size="small" 
                                            sx={{ 
                                              bgcolor: 'rgba(16, 185, 129, 0.15)', 
                                              color: '#10B981',
                                              fontSize: '0.7rem'
                                            }} 
                                          />
                                        )}
                                      </Stack>
                                    )}
                                    
                                    <Divider sx={{ bgcolor: 'rgba(72, 206, 219, 0.2)' }} />
                                    
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Box>
                                        <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700 }}>
                                          {formatCurrency(item.price || 0)}
                                        </Typography>
                                      </Box>
                                      <Chip 
                                        label={order.status || 'Processing'} 
                                        size="small"
                                        icon={order.status === 'delivered' ? <CheckCircleIcon /> : <AccessTimeIcon />}
                                        sx={{
                                          bgcolor: order.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                          color: order.status === 'delivered' ? '#10B981' : '#F59E0B',
                                          fontWeight: 600,
                                          border: `1px solid ${order.status === 'delivered' ? '#10B981' : '#F59E0B'}`
                                        }}
                                      />
                                    </Stack>
                                  </Stack>
                                </Paper>
                              </Grid>
                            ))
                          ) : (
                            /* Fallback: If no items array, show order card */
                            <Grid item xs={12} sm={6} md={4}>
                              <Paper sx={{ 
                                p: 2.5, 
                                bgcolor: 'rgba(5, 19, 35, 0.5)', 
                                border: '1px solid rgba(72, 206, 219, 0.2)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 8px 24px rgba(72, 206, 219, 0.25)',
                                  border: '1px solid rgba(72, 206, 219, 0.4)'
                                }
                              }}>
                                <Stack spacing={2}>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: 'rgba(72, 206, 219, 0.15)', width: 56, height: 56 }}>
                                      <DevicesIcon sx={{ color: '#48cedb', fontSize: 28 }} />
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                                        Order #{order.id}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {order.items?.length || 1} device(s)
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Divider sx={{ bgcolor: 'rgba(72, 206, 219, 0.2)' }} />
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Chip 
                                      label={order.status || 'Processing'} 
                                      size="small"
                                      icon={order.status === 'delivered' ? <CheckCircleIcon /> : <AccessTimeIcon />}
                                      sx={{
                                        bgcolor: order.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        color: order.status === 'delivered' ? '#10B981' : '#F59E0B',
                                        fontWeight: 600,
                                        border: `1px solid ${order.status === 'delivered' ? '#10B981' : '#F59E0B'}`
                                      }}
                                    />
                                    <Button 
                                      size="small" 
                                      variant="outlined"
                                      onClick={() => window.location.href = `/dashboard/orders/${order.id}`}
                                      sx={{
                                        color: '#48cedb',
                                        borderColor: '#48cedb',
                                        '&:hover': { borderColor: '#48cedb', bgcolor: 'rgba(72, 206, 219, 0.1)' }
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Paper>
                            </Grid>
                          )}
                        </React.Fragment>
                      ))}
                    </Grid>
                  ) : (
                    <Box>
                      <Box sx={{ textAlign: 'center', py: 4, mb: 4 }}>
                        <DevicesIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Start Your Collection</Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, maxWidth: 500, mx: 'auto' }}>
                          Browse quality gadgets and purchase instantly or start a flexible payment plan
                        </Typography>
                      </Box>

                      {/* Featured Gadgets - Enhanced Grid */}
                      <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarBorderIcon /> Featured Gadgets
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {(dashboardData.allGadgets || []).slice(0, 6).map((gadget) => (
                          <Grid item xs={12} sm={6} md={4} key={gadget.id}>
                            <motion.div
                              whileHover={{ y: -8 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Paper 
                                sx={{ 
                                  p: 0,
                                  bgcolor: 'rgba(5, 19, 35, 0.6)',
                                  border: '2px solid rgba(72, 206, 219, 0.2)',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  transition: 'all 0.3s ease',
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  '&:hover': {
                                    boxShadow: '0 16px 48px rgba(72, 206, 219, 0.35)',
                                    border: '2px solid rgba(72, 206, 219, 0.6)',
                                    background: 'linear-gradient(135deg, rgba(5, 19, 35, 0.9), rgba(16, 56, 82, 0.8))'
                                  }
                                }}
                              >
                                {/* Gadget Image Container - with gradient overlay */}
                                <Box 
                                  sx={{ 
                                    height: 220,
                                    bgcolor: 'rgba(5, 19, 35, 0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'linear-gradient(135deg, rgba(72, 206, 219, 0.1) 0%, transparent 100%)',
                                      pointerEvents: 'none',
                                      zIndex: 1
                                    }}
                                  />
                                  <img
                                    src={gadget.image || '/placeholder.jpg'}
                                    alt={gadget.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      padding: '20px',
                                      backgroundColor: 'rgba(5, 19, 35, 0.95)'
                                    }}
                                  />
                                </Box>

                                {/* Gadget Details */}
                                <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="caption" sx={{ color: '#48cedb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {gadget.brand || 'Brand'}
                                  </Typography>
                                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 1, height: '2.5em', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                                    {gadget.name}
                                  </Typography>
                                  
                                  {/* Condition Badge if available */}
                                  {gadget.condition && (
                                    <Chip
                                      label={gadget.condition}
                                      size="small"
                                      sx={{
                                        mb: 1.5,
                                        width: 'fit-content',
                                        bgcolor: gadget.condition === 'Like New' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: gadget.condition === 'Like New' ? '#10B981' : '#F59E0B',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}

                                  {/* Price */}
                                  <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 800, mb: 2, fontSize: '1.3rem' }}>
                                    {formatCurrency(getPriceForLocation(gadget))}
                                  </Typography>

                                  {/* Action Buttons */}
                                  <Stack spacing={1.2} sx={{ mt: 'auto' }}>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      size="small"
                                      startIcon={<ShoppingCartIcon />}
                                      onClick={() => handleBuyNow(gadget)}
                                      sx={{
                                        bgcolor: '#48cedb',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        py: 1.2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { 
                                          bgcolor: '#3aa6b8',
                                          boxShadow: '0 8px 20px rgba(72, 206, 219, 0.4)',
                                          transform: 'scale(1.02)'
                                        }
                                      }}
                                    >
                                      Buy Now
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      startIcon={<WalletIcon />}
                                      onClick={() => handleStartInstallment(gadget)}
                                      sx={{
                                        color: '#F59E0B',
                                        borderColor: '#F59E0B',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        py: 1.2,
                                        borderWidth: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          borderColor: '#F59E0B',
                                          bgcolor: 'rgba(245, 158, 11, 0.15)',
                                          borderWidth: 2,
                                          boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                                        }
                                      }}
                                    >
                                      Get in Installments
                                    </Button>
                                  </Stack>
                                </Box>
                              </Paper>
                            </motion.div>
                          </Grid>
                        ))}
                      </Grid>

                      {dashboardData.allGadgets?.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                            No gadgets available at the moment
                          </Typography>
                          <Button 
                            variant="contained" 
                            href="/gadgets"
                            sx={{ 
                              bgcolor: '#48cedb', 
                              '&:hover': { bgcolor: '#3aa6b8' } 
                            }}
                          >
                            Browse All Gadgets
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </DashboardCard>
            </Grid>

            {/* Admin: All Users Installments Summary */}
            {isAdmin() && (
              <Grid item xs={12}>
                <DashboardCard
                  sx={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(72, 206, 219, 0.1) 100%)',
                    border: '2px solid rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <CardHeader
                    title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VerifiedIcon sx={{ color: '#7c3aed' }} /><span>Admin: All Installments</span></Box>}
                    subheader="Manage all user installment payments from one place"
                    action={
                      <Button
                        variant="contained"
                        href="/dashboard/installments"
                        sx={{ bgcolor: '#7c3aed', fontWeight: 700, '&:hover': { bgcolor: '#6d28d9' } }}
                      >
                        Manage All Installments
                      </Button>
                    }
                    sx={{
                      '& .MuiCardHeader-title': { color: '#7c3aed', fontWeight: 'bold' },
                      '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(124, 58, 237, 0.3)', textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ color: '#7c3aed', fontWeight: 700 }}>
                            {dashboardData.adminAnalytics?.installment_stats?.total_installment_orders || dashboardData.installments.length || 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Plans</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                            {dashboardData.adminAnalytics?.installment_stats?.pending_installments || dashboardData.installments.filter(i => i.status !== 'completed').length || 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Pending</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 700 }}>
                            {dashboardData.adminAnalytics?.installment_stats?.completed_installments || dashboardData.installments.filter(i => i.status === 'completed').length || 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Completed</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(72, 206, 219, 0.3)', textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ color: '#48cedb', fontWeight: 700 }}>
                            {dashboardData.adminAnalytics?.installment_stats?.total_installment_value_gbp ? `£${Number(dashboardData.adminAnalytics.installment_stats.total_installment_value_gbp).toLocaleString()}` : formatCurrency(dashboardData.installments.reduce((sum, i) => sum + (i.totalAmount || 0), 0))}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Value</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </DashboardCard>
              </Grid>
            )}

            {/* Lease Snapshot */}
            <Grid item xs={12} md={7}>
              <DashboardCard gradient>
                <CardHeader
                  title="Lease & Installment Snapshot"
                  subheader={activeLease ? 'Track your latest payment plan at a glance' : 'Set up installments for flexible payments'}
                  action={
                    <Button
                      size="small"
                      variant="text"
                      href="/dashboard/installments"
                      sx={{ color: '#48cedb' }}
                    >
                      Manage Installments
                    </Button>
                  }
                  sx={{
                    '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 'bold' },
                    '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                <CardContent>
                  {activeLease ? (
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                          Order #{activeLease.orderId}
                        </Typography>
                        <Chip 
                          label={activeLease.status || 'active'}
                          size="small"
                          sx={{
                            bgcolor: activeLease.status === 'overdue' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(72, 206, 219, 0.15)',
                            color: activeLease.status === 'overdue' ? '#ef4444' : '#48cedb'
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                          Progress
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(leaseProgress, 100)}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#48cedb' }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {Math.round(leaseProgress)}% paid
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(72, 206, 219, 0.2)' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Remaining Balance</Typography>
                            <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700 }}>
                              {formatCurrency(activeLease.remaining || 0)}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.5)', border: '1px solid rgba(72, 206, 219, 0.2)' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Weekly Amount</Typography>
                            <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700 }}>
                              {formatCurrency(activeLease.weeklyAmount || 0)}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Paper sx={{ p: 2, bgcolor: 'rgba(5, 19, 35, 0.35)', border: '1px dashed rgba(72, 206, 219, 0.3)' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                          <Box>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                              Next due date
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {activeLease.nextDueDate ? new Date(activeLease.nextDueDate).toLocaleDateString() : 'We will notify you'}
                            </Typography>
                          </Box>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button
                              variant="contained"
                              size="medium"
                              onClick={handlePayInstallment}
                              disabled={payingInstallment}
                              sx={{
                                bgcolor: '#48cedb',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#3aa6b8' }
                              }}
                            >
                              {payingInstallment ? 'Starting...' : 'Pay next installment'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="medium"
                              onClick={handleDownloadReceipt}
                              disabled={receiptLoading}
                              sx={{
                                color: '#48cedb',
                                borderColor: '#48cedb',
                                borderWidth: 2,
                                '&:hover': { borderColor: '#48cedb', backgroundColor: 'rgba(72, 206, 219, 0.1)' }
                              }}
                            >
                              {receiptLoading ? 'Preparing…' : 'Download receipt'}
                            </Button>
                            <Button
                              variant="text"
                              size="medium"
                              onClick={handleScheduleReminder}
                              disabled={reminderLoading || reminderScheduled}
                              sx={{ color: reminderScheduled ? '#10B981' : '#48cedb' }}
                            >
                              {reminderScheduled ? 'Reminder set' : reminderLoading ? 'Scheduling…' : 'Email me a day before'}
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>

                      {leaseMessage && (
                        <Alert severity="info" sx={{ bgcolor: 'rgba(72, 206, 219, 0.08)', border: '1px solid rgba(72, 206, 219, 0.2)' }}>
                          <Typography variant="body2" sx={{ color: 'white' }}>{leaseMessage}</Typography>
                        </Alert>
                      )}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <WalletIcon sx={{ fontSize: 56, color: 'rgba(255, 255, 255, 0.3)', mb: 1 }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        No active installments
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        Split payments over time with flexible weekly options.
                      </Typography>
                      <Button
                        variant="contained"
                        href="/gadgets"
                        sx={{
                          bgcolor: '#48cedb',
                          fontWeight: 700,
                          px: 3,
                          '&:hover': { bgcolor: '#3aa6b8' }
                        }}
                      >
                        Start a new plan
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </DashboardCard>
            </Grid>

            {/* All Installments Grid View */}
            {dashboardData.installments && dashboardData.installments.length > 1 && (
              <Grid item xs={12}>
                <DashboardCard>
                  <CardHeader
                    title="All Payment Plans"
                    subheader="Overview of all your active and completed installments"
                    sx={{
                      '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 'bold' },
                      '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {dashboardData.installments.map((installment, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={installment.id || idx}>
                          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                            <Paper sx={{
                              p: 2.5,
                              bgcolor: 'rgba(5, 19, 35, 0.5)',
                              border: '2px solid rgba(72, 206, 219, 0.2)',
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 12px 32px rgba(72, 206, 219, 0.3)',
                                border: '2px solid rgba(72, 206, 219, 0.5)'
                              }
                            }}>
                              <Stack spacing={1.5}>
                                {/* Status Chip */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Chip
                                    label={installment.status?.toUpperCase() || 'ACTIVE'}
                                    size="small"
                                    icon={installment.status === 'overdue' ? <CancelIcon /> : installment.status === 'completed' ? <CheckCircleIcon /> : <AccessTimeIcon />}
                                    sx={{
                                      bgcolor: installment.status === 'overdue' ? 'rgba(239, 68, 68, 0.2)' : installment.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                      color: installment.status === 'overdue' ? '#EF4444' : installment.status === 'completed' ? '#10B981' : '#F59E0B',
                                      fontWeight: 700,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    #{installment.orderId || installment.id}
                                  </Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                                      Progress
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#48cedb', fontWeight: 700 }}>
                                      {Math.round(installment.progress || 0)}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={installment.progress || 0}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'rgba(255,255,255,0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: installment.progress >= 100 ? '#10B981' : '#48cedb',
                                        borderRadius: 3
                                      }
                                    }}
                                  />
                                </Box>

                                {/* Amount Info */}
                                <Divider sx={{ bgcolor: 'rgba(72, 206, 219, 0.1)', my: 1 }} />
                                <Stack spacing={0.75}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                      Total Amount
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                                      {formatCurrency(installment.totalAmount || 0)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                      Remaining
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                      {formatCurrency(installment.remaining || 0)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                      Weekly Payment
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: '#48cedb', fontWeight: 700 }}>
                                      {formatCurrency(installment.weeklyAmount || 0)}
                                    </Typography>
                                  </Box>
                                </Stack>

                                {/* Next Due Date */}
                                {installment.nextDueDate && (
                                  <Box sx={{ 
                                    p: 1.5, 
                                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: 1
                                  }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 0.5 }}>
                                      Next Due
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                      {new Date(installment.nextDueDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Action Button */}
                                {installment.status !== 'completed' && (
                                  <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    sx={{
                                      bgcolor: '#48cedb',
                                      color: 'white',
                                      fontWeight: 700,
                                      mt: 1,
                                      '&:hover': { bgcolor: '#3aa6b8' }
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                )}
                              </Stack>
                            </Paper>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </DashboardCard>
              </Grid>
            )}

            {/* Quick Shop - Start Installments or Checkout from Dashboard */}
            <Grid item xs={12}>
              <DashboardCard>
                <CardHeader
                  title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShoppingCartIcon sx={{ color: '#48cedb' }} /><span>Quick Shop</span></Box>}
                  subheader="Browse gadgets and start checkout or installments without leaving the dashboard"
                  action={
                    <Button
                      size="small"
                      variant="outlined"
                      href="/gadgets"
                      sx={{ color: '#48cedb', borderColor: '#48cedb' }}
                    >
                      View All Gadgets
                    </Button>
                  }
                  sx={{
                    '& .MuiCardHeader-title': { color: '#48cedb', fontWeight: 'bold' },
                    '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    {(dashboardData.allGadgets || []).slice(0, 6).map((gadget) => (
                      <Grid item xs={6} sm={4} md={2} key={gadget.id}>
                        <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
                          <Paper sx={{
                            p: 1.5,
                            bgcolor: 'rgba(5, 19, 35, 0.5)',
                            border: '1px solid rgba(72, 206, 219, 0.2)',
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              border: '1px solid rgba(72, 206, 219, 0.5)',
                              boxShadow: '0 8px 24px rgba(72, 206, 219, 0.15)'
                            }
                          }}>
                            <Box
                              component="img"
                              src={gadget.image || '/placeholder.jpg'}
                              alt={gadget.name}
                              sx={{
                                width: '100%',
                                height: 100,
                                objectFit: 'contain',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: 'rgba(255,255,255,0.03)'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block', mb: 0.5, lineHeight: 1.2 }} noWrap>
                              {gadget.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#48cedb', fontWeight: 700, display: 'block', mb: 1 }}>
                              {formatCurrency(getPriceForLocation(gadget))}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleBuyNow(gadget)}
                                sx={{
                                  flex: 1,
                                  bgcolor: '#48cedb',
                                  fontSize: '0.65rem',
                                  py: 0.5,
                                  minWidth: 0,
                                  '&:hover': { bgcolor: '#3aa6b8' }
                                }}
                              >
                                Buy
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleStartInstallment(gadget)}
                                sx={{
                                  flex: 1,
                                  color: '#F59E0B',
                                  borderColor: '#F59E0B',
                                  fontSize: '0.65rem',
                                  py: 0.5,
                                  minWidth: 0,
                                  '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)', borderColor: '#F59E0B' }
                                }}
                              >
                                Split
                              </Button>
                            </Stack>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </DashboardCard>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Trade-Ins Management */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            {/* Trade-Ins Header with Action Button */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ color: '#48cedb', fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHorizIcon /> Trade-In Applications
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Manage your device trade-ins and track application status
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  href="/trade-in"
                  sx={{
                    bgcolor: '#48cedb',
                    color: 'black',
                    fontWeight: 700,
                    px: 3,
                    '&:hover': { bgcolor: '#36b8c7' }
                  }}
                >
                  + New Trade-In
                </Button>
              </Stack>
            </Grid>

            {/* Trade-Ins List */}
            {dashboardData.tradeIns && dashboardData.tradeIns.length > 0 ? (
              <>
                {/* Summary Cards */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <DashboardCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h3" sx={{ color: '#48cedb', fontWeight: 'bold', mb: 1 }}>
                            {dashboardData.tradeIns.length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Total Applications
                          </Typography>
                        </CardContent>
                      </DashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DashboardCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h3" sx={{ color: '#48cedb', fontWeight: 'bold', mb: 1 }}>
                            {dashboardData.tradeIns.filter(t => t.status === 'pending' || t.status === 'under_review').length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Under Review
                          </Typography>
                        </CardContent>
                      </DashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DashboardCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 'bold', mb: 1 }}>
                            {dashboardData.tradeIns.filter(t => t.status === 'approved').length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Approved
                          </Typography>
                        </CardContent>
                      </DashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DashboardCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 'bold', mb: 1 }}>
                            {formatCurrency(
                              dashboardData.tradeIns
                                .filter(t => t.status === 'approved' || t.status === 'completed')
                                .reduce((sum, t) => sum + (t.finalValue || t.estimatedValue || 0), 0)
                            )}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Total Value
                          </Typography>
                        </CardContent>
                      </DashboardCard>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Detailed Trade-In Cards */}
                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    {dashboardData.tradeIns.map((tradeIn, idx) => {
                      const statusColors = {
                        pending: '#F59E0B',
                        under_review: '#48cedb',
                        approved: '#10B981',
                        rejected: '#EF4444',
                        completed: '#6B7280',
                        cancelled: '#94A3B8'
                      };
                      const statusColor = statusColors[tradeIn.status] || '#F59E0B';
                      const statusLabels = {
                        pending: 'Pending Review',
                        under_review: 'Under Review',
                        approved: 'Approved',
                        rejected: 'Rejected',
                        completed: 'Completed',
                        cancelled: 'Cancelled'
                      };
                      const statusLabel = statusLabels[tradeIn.status] || 'Pending';

                      return (
                        <Grid item xs={12} sm={6} md={4} key={tradeIn.reference || idx}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <DashboardCard
                              sx={{
                                background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%)`,
                                border: `2px solid ${statusColor}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 12px 32px ${statusColor}40`
                                }
                              }}
                            >
                              <CardContent>
                                <Stack spacing={2}>
                                  {/* Status & Reference */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip
                                      label={statusLabel}
                                      sx={{
                                        bgcolor: `${statusColor}30`,
                                        color: statusColor,
                                        fontWeight: 700,
                                        borderRadius: 1,
                                        textTransform: 'uppercase',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                                      #{tradeIn.reference?.slice(-8)}
                                    </Typography>
                                  </Box>

                                  {/* Device Info */}
                                  <Box>
                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                                      {tradeIn.deviceBrand || tradeIn.brand} {tradeIn.deviceModel || tradeIn.model}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                                      {tradeIn.categoryName || tradeIn.category}
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                      {tradeIn.deviceStorage && (
                                        <Chip
                                          label={tradeIn.deviceStorage}
                                          size="small"
                                          sx={{ bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48cedb', height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                      {tradeIn.deviceCondition && (
                                        <Chip
                                          label={tradeIn.deviceCondition}
                                          size="small"
                                          sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Stack>
                                  </Box>

                                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                                  {/* Pricing Info */}
                                  <Box>
                                    {tradeIn.estimatedValue && (
                                      <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                          Estimated Value
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: statusColor, fontWeight: 700 }}>
                                          {formatCurrency(tradeIn.estimatedValue)}
                                        </Typography>
                                      </Box>
                                    )}
                                    {tradeIn.finalValue && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                          Final Offer
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 700 }}>
                                          {formatCurrency(tradeIn.finalValue)}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  {/* Contact Info */}
                                  <Box sx={{ pt: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                      Contact
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'white', fontSize: '0.85rem' }}>
                                      {tradeIn.customerName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                                      {tradeIn.customerEmail}
                                    </Typography>
                                    {tradeIn.customerPhone && (
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                                        {tradeIn.customerPhone}
                                      </Typography>
                                    )}
                                  </Box>

                                  {/* Timeline */}
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                      Submitted
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                                      {new Date(tradeIn.createdAt).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Typography>
                                    {tradeIn.reviewedAt && (
                                      <>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5, mt: 1 }}>
                                          Reviewed
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                                          {new Date(tradeIn.reviewedAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>

                                  {/* Notes (if any) */}
                                  {tradeIn.notes && (
                                    <Alert
                                      severity={tradeIn.status === 'approved' ? 'success' : tradeIn.status === 'rejected' ? 'error' : 'info'}
                                      sx={{
                                        bgcolor: `${statusColor}20`,
                                        border: `1px solid ${statusColor}40`,
                                        '& .MuiAlert-message': { color: 'white' }
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        Admin Note: {tradeIn.notes}
                                      </Typography>
                                    </Alert>
                                  )}

                                  {/* Action Buttons */}
                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleViewTradeIn(tradeIn)}
                                      sx={{
                                        borderColor: statusColor,
                                        color: statusColor,
                                        fontWeight: 600,
                                        '&:hover': { borderColor: statusColor, bgcolor: `${statusColor}20` }
                                      }}
                                    >
                                      View Details
                                    </Button>
                                    {(tradeIn.status === 'pending' || tradeIn.status === 'under_review') && (
                                      <Button
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleCancelTradeIn(tradeIn)}
                                        disabled={cancellingTradeIn}
                                        sx={{
                                          borderColor: '#EF4444',
                                          color: '#EF4444',
                                          fontWeight: 600,
                                          '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                                        }}
                                      >
                                        {cancellingTradeIn ? 'Cancelling...' : 'Cancel'}
                                      </Button>
                                    )}
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </DashboardCard>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>

                {/* Help Section */}
                <Grid item xs={12}>
                  <DashboardCard
                    sx={{
                      background: 'linear-gradient(135deg, rgba(72, 206, 219, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                      border: '1px solid rgba(72, 206, 219, 0.3)'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700, mb: 2 }}>
                        📋 Trade-In Process
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack alignItems="center" spacing={1}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(72, 206, 219, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700 }}>1</Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>
                              Submit Application
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                              Fill in device details and get instant estimate
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack alignItems="center" spacing={1}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#3B82F6', fontWeight: 700 }}>2</Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>
                              Expert Review
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                              Our team reviews and verifies your device info
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack alignItems="center" spacing={1}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>3</Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>
                              Get Final Offer
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                              Receive confirmed value within 24 hours
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack alignItems="center" spacing={1}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 700 }}>4</Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>
                              Instant Credit
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                              Use credit for new purchases immediately
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </DashboardCard>
                </Grid>
              </>
            ) : (
              /* Empty State */
              <Grid item xs={12}>
                <DashboardCard>
                  <CardContent sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}>📱💰</Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                      No Trade-Ins Yet
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, maxWidth: 600, mx: 'auto' }}>
                      Turn your old devices into credit! Get instant value estimates and trade in your gadgets for cash or credit towards new purchases.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      href="/trade-in"
                      sx={{
                        bgcolor: '#48cedb',
                        color: 'black',
                        fontWeight: 700,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { bgcolor: '#36b8c7', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(72, 206, 219, 0.4)' },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Start Your First Trade-In
                    </Button>

                    {/* Benefits Grid */}
                    <Grid container spacing={2} sx={{ mt: 4, maxWidth: 900, mx: 'auto' }}>
                      <Grid item xs={12} sm={4}>
                        <Stack alignItems="center" spacing={1}>
                          <Box sx={{ fontSize: 32 }}>⚡</Box>
                          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                            Instant Estimates
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Get value quote in seconds
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Stack alignItems="center" spacing={1}>
                          <Box sx={{ fontSize: 32 }}>✅</Box>
                          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                            Fair Prices
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Market-leading trade-in values
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Stack alignItems="center" spacing={1}>
                          <Box sx={{ fontSize: 32 }}>🔄</Box>
                          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                            Easy Process
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Simple 4-step trade-in flow
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </DashboardCard>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
      
      {/* Cart Modal */}
      {selectedGadget && (
        <CartModal
          open={cartModalOpen}
          onClose={(purchaseMade = false) => {
            setCartModalOpen(false);
            setSelectedGadget(null);
            // Refresh dashboard data if purchase was made
            if (purchaseMade && user) {
              // Trigger data refresh by updating a timestamp or calling fetchUserData
              window.location.reload(); // Simple approach - reload to show new order
            }
          }}
          gadget={selectedGadget}
        />
      )}

      {/* Installment Modal */}
      {selectedGadget && (
        <InstallmentModal
          open={installmentModalOpen}
          onClose={(purchaseMade = false) => {
            setInstallmentModalOpen(false);
            setSelectedGadget(null);
            // Refresh dashboard data if purchase was made
            if (purchaseMade && user) {
              window.location.reload(); // Simple approach - reload to show new order
            }
          }}
          item={selectedGadget}
        />
      )}

      {/* Square Card Payment Modal */}
      {pendingSubscription && (
        <SquareCardModal
          open={squareCardModalOpen}
          onClose={() => {
            setSquareCardModalOpen(false);
            setPendingSubscription(null);
          }}
          onSuccess={handleSquareCardSuccess}
          tier={pendingSubscription.tier}
          amount={pendingSubscription.amount}
          currency={pendingSubscription.currency}
        />
      )}

      {/* Trade-In Detail Modal */}
      <Dialog
        open={tradeInModalOpen}
        onClose={() => {
          setTradeInModalOpen(false);
          setSelectedTradeIn(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon sx={{ color: '#48cedb' }} />
            <Typography variant="h6" sx={{ color: '#48cedb', fontWeight: 700 }}>
              Trade-In Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTradeIn && (
            <Stack spacing={3}>
              {/* Status */}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedTradeIn.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  sx={{
                    bgcolor: selectedTradeIn.status === 'approved' ? '#10B981' : 
                             selectedTradeIn.status === 'rejected' ? '#EF4444' : 
                             selectedTradeIn.status === 'under_review' ? '#48cedb' : '#F59E0B',
                    color: 'white',
                    fontWeight: 700
                  }}
                />
              </Box>

              {/* Device Info */}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Device
                </Typography>
                <Typography variant="h6">
                  {selectedTradeIn.deviceBrand || selectedTradeIn.brand} {selectedTradeIn.deviceModel || selectedTradeIn.model}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedTradeIn.categoryName || selectedTradeIn.category}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {selectedTradeIn.deviceStorage && (
                    <Chip label={selectedTradeIn.deviceStorage} size="small" />
                  )}
                  {selectedTradeIn.deviceCondition && (
                    <Chip label={selectedTradeIn.deviceCondition} size="small" />
                  )}
                </Stack>
              </Box>

              {/* Pricing */}
              <Box>
                {selectedTradeIn.estimatedValue && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Estimated Value
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#F59E0B' }}>
                      {formatCurrency(selectedTradeIn.estimatedValue)}
                    </Typography>
                  </Box>
                )}
                {selectedTradeIn.finalValue && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Final Offer
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#10B981' }}>
                      {formatCurrency(selectedTradeIn.finalValue)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Contact Info */}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Contact Information
                </Typography>
                <Typography variant="body2">{selectedTradeIn.customerName}</Typography>
                <Typography variant="body2">{selectedTradeIn.customerEmail}</Typography>
                {selectedTradeIn.customerPhone && (
                  <Typography variant="body2">{selectedTradeIn.customerPhone}</Typography>
                )}
              </Box>

              {/* Timeline */}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Timeline
                </Typography>
                <Typography variant="body2">
                  Submitted: {new Date(selectedTradeIn.createdAt).toLocaleString()}
                </Typography>
                {selectedTradeIn.reviewedAt && (
                  <Typography variant="body2">
                    Reviewed: {new Date(selectedTradeIn.reviewedAt).toLocaleDateString()}
                  </Typography>
                )}
                {selectedTradeIn.completedAt && (
                  <Typography variant="body2">
                    Completed: {new Date(selectedTradeIn.completedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              {/* Notes */}
              {selectedTradeIn.notes && (
                <Alert severity={selectedTradeIn.status === 'approved' ? 'success' : selectedTradeIn.status === 'rejected' ? 'error' : 'info'}>
                  <Typography variant="body2">
                    <strong>Admin Note:</strong> {selectedTradeIn.notes}
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTradeInModalOpen(false);
            setSelectedTradeIn(null);
          }}>
            Close
          </Button>
          {(selectedTradeIn?.status === 'pending' || selectedTradeIn?.status === 'under_review') && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => {
                setTradeInModalOpen(false);
                handleCancelTradeIn(selectedTradeIn);
              }}
            >
              Cancel Application
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard;
