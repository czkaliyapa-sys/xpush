import React, { useState } from 'react';
import { styled, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EnhancedAppBar from './components/EnhancedAppBar.jsx';
import { MainListItems } from './external_components/listItems';
import Orders from './external_components/Orders.jsx';
import Installments from './external_components/Installments.jsx';
import AdminUsers from './external_components/AdminUsers.jsx';
import { RequireAdmin } from './components/RouteGuards.jsx';
import MetricCard from './external_components/MetricCard';
import SessionsChart from './external_components/SessionsChart';
import PageViewsChart from './external_components/PageViewsChart';
import HomeOverview from './external_components/HomeOverview.jsx';
import InsightsCard from './external_components/InsightsCard';
import SVGComponent from './components/Logo';
import { useAuth } from './contexts/AuthContext.jsx';
import UserProfile from './components/UserProfile.jsx';
import { gadgetsAPI, ordersAPI } from './services/api.js';
import { getPlatformStats } from './services/verificationApi.js';
import EnhancedAnalyticsDashboard from './external_components/EnhancedAnalyticsDashboard.jsx';
import UserDashboard from './external_components/UserDashboard.jsx';
import InstallmentApplications from './external_components/InstallmentApplications.jsx';
import NotificationsPanel from './external_components/NotificationsPanel.jsx';
import InstallmentReceipts from './external_components/InstallmentReceipts.jsx';
import TradeInPage from './TradeInPage.jsx';
import AdminSubscriptions from './external_components/AdminSubscriptions.jsx';
import AdminTradeIns from './external_components/AdminTradeIns.jsx';

const drawerWidth = 264;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
        },
      },
    },
  },
});

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: '#0f172a',
  borderBottom: '1px solid #334155',
  boxShadow: 'none',
  [theme.breakpoints.up('md')]: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  },
  // Accessibility: Focus styles for keyboard navigation
  '& .Mui-focused': {
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
  },
}));

const DesktopDrawer = styled(MuiDrawer)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    '& .MuiDrawer-paper': {
      position: 'fixed',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      height: '100vh',
      top: 0,
      left: 0,
      maxHeight: '100vh',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #334155',
      boxSizing: 'border-box',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: theme.zIndex.drawer,
      scrollbarWidth: 'thin',
      scrollbarColor: '#334155 #0f172a',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#0f172a',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#334155',
        borderRadius: '3px',
        '&:hover': {
          background: '#475569',
        },
      },
    },
  },
}));

const MobileDrawer = styled(MuiDrawer)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      height: '100vh',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #334155',
      boxSizing: 'border-box',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      scrollbarWidth: 'thin',
      scrollbarColor: '#334155 #0f172a',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#0f172a',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#334155',
        borderRadius: '3px',
        '&:hover': {
          background: '#475569',
        },
      },
    },
  },
}));

const PlanCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  margin: theme.spacing(2),
  marginTop: 'auto',
  [theme.breakpoints.down('md')]: {
    margin: theme.spacing(1),
  },
}));

// Create simple components for dashboard inner pages
const DashboardAnalytics = () => {
  return (
    <EnhancedAnalyticsDashboard />
  );
};

// Component to redirect admin users to Analytics, regular users to UserDashboard
const DashboardIndex = () => {
  const { isAdmin } = useAuth();
  
  // Admin users go directly to Analytics (their home page)
  if (isAdmin()) {
    return <Navigate to="/dashboard/analytics" replace />;
  }
  
  // Regular users see UserDashboard
  return <UserDashboard />;
};

const DashboardClients = () => (
  <Container>
    <Typography variant="h4" fontWeight="bold" gutterBottom>Clients Management</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body1">Client management dashboard content will appear here.</Typography>
    </Paper>
  </Container>
);

// Category options for gadgets - variants required for all except 'accessories'
const GADGET_CATEGORIES = [
  { value: 'smartphone', label: 'Smartphones' },
  { value: 'tablet', label: 'Tablets' },
  { value: 'laptop', label: 'Laptops' },
  { value: 'desktop', label: 'Desktops' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'audio', label: 'Audio' },
  { value: 'wearable', label: 'Wearables' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'accessories', label: 'Accessories' }
];

const DashboardGadgets = () => {
  const { user, isAdmin } = useAuth();
  const [form, setForm] = useState({
    name: '', description: '', category: '', brand: '', model: '',
    image: '', inStock: true, stockQuantity: 0, condition: 'new',
    more_img: [], specifications: ''
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [gadgets, setGadgets] = useState([]);
  // Admin search state
  const [gadgetSearch, setGadgetSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  // Variant management state - Simplified single form approach
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ color: '', colorHex: '', storage: '', condition: 'new', price: '', priceGbp: '', stockQuantity: '', sku: '' });
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantStatus, setVariantStatus] = useState(null);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  
  // Quick add mode for batch variant creation
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [storagePresets] = useState(['64GB', '128GB', '256GB', '512GB', '1TB']);
  const [conditionPresets] = useState(['new', 'like_new', 'good', 'fair']);
  
  // Computed: Get unique storages and conditions from existing variants
  const existingStorages = React.useMemo(() => 
    [...new Set(variants.map(v => v.storage).filter(Boolean))], [variants]);
  const existingConditions = React.useMemo(() => 
    [...new Set(variants.map(v => v.condition || v.condition_status).filter(Boolean))], [variants]);
  const totalVariantStock = React.useMemo(() => 
    variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity || v.stockQuantity || 0, 10)), 0), [variants]);

  const loadGadgets = async () => {
    try {
      const res = await gadgetsAPI.getAll({ limit: 50 });
      if (res.success) setGadgets(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => { loadGadgets(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (g) => {
    setSelectedId(g.id);
    // Convert specifications object back to text format for editing
    const specsText = g.specifications && typeof g.specifications === 'object' 
      ? Object.entries(g.specifications).map(([k, v]) => `${k}: ${v}`).join('\n')
      : '';
    setForm({
      name: g.name || '',
      description: g.description || '',
      price: g.price ?? '',
      priceGbp: g.price_gbp ?? '',
      monthlyPrice: g.monthlyPrice ?? g.monthly_price ?? '',
      monthlyPriceGbp: g.monthly_price_gbp ?? '',
      category: g.category || '',
      brand: g.brand || '',
      model: g.model || '',
      image: g.image || '',
      condition: g.condition || 'new',
      inStock: !!(g.inStock ?? (g.in_stock ?? (g.stock > 0))),
      stockQuantity: (g.stockQuantity ?? g.stock_quantity ?? g.stock ?? 0),
      more_img: Array.isArray(g.more_img) ? g.more_img : [],
      specifications: specsText
    });
    setStatus({ type: 'success', msg: `Selected gadget #${g.id} for editing` });
    // Load variants for selected gadget
    loadVariants(g.id, includeInactive);
  };

  const clearSelection = () => {
    setSelectedId(null);
    resetForm();
    setStatus({ type: 'success', msg: 'Cleared selection' });
  };

  // ===== Gadget Search (admin) =====
  const handleGadgetSearchChange = (e) => {
    setGadgetSearch(e.target.value);
  };

  React.useEffect(() => {
    let timer;
    const run = async () => {
      if (!gadgetSearch.trim()) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const res = await gadgetsAPI.search(gadgetSearch.trim());
        if (res.success) {
          setSearchResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setSearching(false);
      }
    };
    timer = setTimeout(run, 300);
    return () => clearTimeout(timer);
  }, [gadgetSearch]);

  const handleUploadChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadLoading(true);
    setStatus(null);
    try {
      const res = await gadgetsAPI.uploadImages(files);
      if (res && res.success && Array.isArray(res.images)) {
        const [primary, ...rest] = res.images;
        setForm(prev => ({
          ...prev,
          image: primary || prev.image,
          more_img: rest.length ? rest : prev.more_img
        }));
        setStatus({ type: 'success', msg: `Uploaded ${res.count || res.images.length} image(s)` });
      } else {
        setStatus({ type: 'error', msg: res?.error || 'Image upload failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Error uploading images' });
    } finally {
      setUploadLoading(false);
      // Clear file input value so same file can be selected again
      e.target.value = '';
    }
  };

  const resetForm = () => setForm({
    name: '', description: '', category: '', brand: '', model: '',
    image: '', inStock: true, stockQuantity: 0, condition: 'new',
    more_img: [], specifications: ''
  });

  // Helper to parse specifications from text input to object
  const parseSpecifications = (specsText) => {
    if (!specsText || typeof specsText !== 'string') return {};
    const specs = {};
    specsText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    });
    return specs;
  };

  // Category is required. For non-accessories, variants are required (validated when saving)
  const required = ['name','description','category','brand','model'];

  const onCreate = async () => {
    if (!isAdmin() || !user?.uid) { setStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    for (const f of required) {
      if (!String(form[f] || '').trim()) { setStatus({ type: 'error', msg: `Missing required field: ${f}` }); return; }
    }
    // Validate category is from allowed list
    if (!GADGET_CATEGORIES.some(c => c.value === form.category)) {
      setStatus({ type: 'error', msg: 'Please select a valid category' }); return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: 0, // Base price - actual pricing is managed via variants
        priceGbp: 0,
        monthlyPrice: 0,
        monthlyPriceGbp: 0,
        image: form.image || null,
        more_img: Array.isArray(form.more_img) ? form.more_img : [],
        category: form.category,
        brand: form.brand,
        model: form.model,
        condition: form.condition,
        specifications: parseSpecifications(form.specifications),
        inStock: form.inStock ? 1 : 0,
        stockQuantity: parseInt(form.stockQuantity || 0, 10)
      };
      const res = await gadgetsAPI.adminCreate(user.uid, payload);
      if (res.success) { setStatus({ type: 'success', msg: 'Created gadget successfully' }); resetForm(); await loadGadgets(); }
      else { setStatus({ type: 'error', msg: res.error || 'Failed to create gadget' }); }
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Error creating gadget' });
    } finally { setLoading(false); }
  };

  const onUpdate = async (id) => {
    if (!isAdmin() || !user?.uid) { setStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        // Keep existing price if updating, or 0 - pricing is managed via variants
        price: 0,
        priceGbp: 0,
        monthlyPrice: 0,
        monthlyPriceGbp: 0,
        image: form.image || null,
        more_img: Array.isArray(form.more_img) ? form.more_img : [],
        category: form.category,
        brand: form.brand,
        model: form.model,
        condition: form.condition,
        specifications: parseSpecifications(form.specifications),
        inStock: form.inStock ? 1 : 0,
        stockQuantity: parseInt(form.stockQuantity || 0, 10)
      };
      const res = await gadgetsAPI.adminUpdate(id, user.uid, payload);
      if (res.success) { setStatus({ type: 'success', msg: 'Updated gadget successfully' }); resetForm(); await loadGadgets(); }
      else { setStatus({ type: 'error', msg: res.error || 'Failed to update gadget' }); }
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Error updating gadget' });
    } finally { setLoading(false); }
  };

  const onDelete = async (id) => {
    if (!isAdmin() || !user?.uid) { setStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    setLoading(true);
    try {
      const res = await gadgetsAPI.adminDelete(id, user.uid);
      if (res.success) { setStatus({ type: 'success', msg: 'Deleted gadget successfully' }); await loadGadgets(); }
      else { setStatus({ type: 'error', msg: res.error || 'Failed to delete gadget' }); }
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Error deleting gadget' });
    } finally { setLoading(false); }
  };

  // ===== Variant Management =====
  const loadVariants = async (gadgetId = selectedId, include = includeInactive) => {
    if (!gadgetId || !isAdmin() || !user?.uid) return;
    try {
      setVariantLoading(true);
      const res = await gadgetsAPI.adminGetVariants(gadgetId, user.uid, { includeInactive: include });
      if (res.success) {
        setVariants(Array.isArray(res.data) ? res.data : []);
      } else {
        setVariantStatus({ type: 'error', msg: res.error || 'Failed to load variants' });
      }
    } catch (e) {
      setVariantStatus({ type: 'error', msg: e.message || 'Error loading variants' });
    } finally {
      setVariantLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedId) {
      loadVariants(selectedId, includeInactive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, includeInactive]);

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm(prev => ({ ...prev, [name]: value }));
  };

  const resetVariantForm = () => {
    setVariantForm({ color: '', colorHex: '', storage: '', condition: 'new', price: '', priceGbp: '', stockQuantity: '', sku: '' });
    setEditingVariantId(null);
  };

  // Quick preset handlers for faster variant creation
  const applyStoragePreset = (storage) => {
    setVariantForm(prev => ({ ...prev, storage }));
  };
  
  const applyConditionPreset = (condition) => {
    setVariantForm(prev => ({ ...prev, condition }));
  };

  // Quick stock adjuster for variants
  const updateVariantStock = async (variantId, delta) => {
    if (!isAdmin() || !user?.uid || !selectedId) { setVariantStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    const v = variants.find(x => x.id === variantId);
    const currentQty = (typeof v?.stock_quantity !== 'undefined' ? v.stock_quantity : v?.stockQuantity) ?? 0;
    let nextQty = currentQty + delta;
    if (nextQty < 0) nextQty = 0;
    setVariantLoading(true);
    try {
      const res = await gadgetsAPI.adminUpdateVariant(selectedId, variantId, user.uid, {
        stockQuantity: nextQty
      });
      if (res.success) {
        setVariantStatus({ type: 'success', msg: `Stock updated to ${nextQty}` });
        await loadVariants();
      } else {
        setVariantStatus({ type: 'error', msg: res.error || 'Failed to update stock' });
      }
    } catch (e) {
      setVariantStatus({ type: 'error', msg: e.message || 'Error updating stock' });
    } finally {
      setVariantLoading(false);
    }
  };

  const onCreateVariant = async () => {
    if (!isAdmin() || !user?.uid || !selectedId) { setVariantStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    if (!variantForm.storage || !String(variantForm.price).trim()) { setVariantStatus({ type: 'error', msg: 'Storage and price are required' }); return; }
    setVariantLoading(true);
    try {
      const res = await gadgetsAPI.adminCreateVariant(selectedId, user.uid, {
        color: variantForm.color ? String(variantForm.color).trim() : '',
        colorHex: variantForm.colorHex ? String(variantForm.colorHex).trim() : '',
        storage: String(variantForm.storage).trim(),
        condition: variantForm.condition || 'new',
        price: parseFloat(variantForm.price),
        priceGbp: variantForm.priceGbp ? parseFloat(variantForm.priceGbp) : undefined,
        stockQuantity: variantForm.stockQuantity ? parseInt(variantForm.stockQuantity, 10) : 0,
        sku: variantForm.sku ? String(variantForm.sku).trim() : ''
      });
      if (res.success) {
        setVariantStatus({ type: 'success', msg: 'Variant created successfully' });
        resetVariantForm();
        await loadVariants();
      } else {
        setVariantStatus({ type: 'error', msg: res.error || 'Failed to create variant' });
      }
    } catch (e) {
      setVariantStatus({ type: 'error', msg: e.message || 'Error creating variant' });
    } finally { setVariantLoading(false); }
  };

  const onUpdateVariant = async () => {
    if (!isAdmin() || !user?.uid || !selectedId || !editingVariantId) { setVariantStatus({ type: 'error', msg: 'Admin permissions required or no variant selected' }); return; }
    setVariantLoading(true);
    try {
      const res = await gadgetsAPI.adminUpdateVariant(selectedId, editingVariantId, user.uid, {
        color: variantForm.color !== undefined ? String(variantForm.color).trim() : undefined,
        colorHex: variantForm.colorHex !== undefined ? String(variantForm.colorHex).trim() : undefined,
        storage: String(variantForm.storage).trim(),
        condition: variantForm.condition || 'new',
        price: String(variantForm.price).trim() ? parseFloat(variantForm.price) : undefined,
        priceGbp: String(variantForm.priceGbp || '').trim() ? parseFloat(variantForm.priceGbp) : undefined,
        stockQuantity: String(variantForm.stockQuantity).trim() ? parseInt(variantForm.stockQuantity, 10) : undefined,
        sku: typeof variantForm.sku !== 'undefined' ? String(variantForm.sku).trim() : undefined
      });
      if (res.success) {
        setVariantStatus({ type: 'success', msg: 'Variant updated successfully' });
        resetVariantForm();
        await loadVariants();
      } else {
        setVariantStatus({ type: 'error', msg: res.error || 'Failed to update variant' });
      }
    } catch (e) {
      setVariantStatus({ type: 'error', msg: e.message || 'Error updating variant' });
    } finally { setVariantLoading(false); }
  };

  const onDeleteVariant = async (id) => {
    if (!isAdmin() || !user?.uid || !selectedId) { setVariantStatus({ type: 'error', msg: 'Admin permissions required' }); return; }
    setVariantLoading(true);
    try {
      const res = await gadgetsAPI.adminDeleteVariant(selectedId, id, user.uid);
      if (res.success) {
        setVariantStatus({ type: 'success', msg: 'Variant deleted successfully' });
        await loadVariants();
      } else {
        setVariantStatus({ type: 'error', msg: res.error || 'Failed to delete variant' });
      }
    } catch (e) {
      setVariantStatus({ type: 'error', msg: e.message || 'Error deleting variant' });
    } finally { setVariantLoading(false); }
  };

  const handleVariantSelect = (v) => {
    setEditingVariantId(v.id);
    setVariantForm({
      color: v.color ?? '',
      colorHex: v.color_hex ?? v.colorHex ?? '',
      storage: v.storage || '',
      condition: v.condition ?? v.condition_status ?? 'new',
      price: v.price ?? '',
      priceGbp: v.price_gbp ?? v.priceGbp ?? '',
      stockQuantity: (typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity) ?? '',
      sku: v.sku ?? ''
    });
    setVariantStatus({ type: 'success', msg: `Selected variant #${v.id} for editing` });
  };

  return (
    <Container sx={{ height: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Gadgets Management</Typography>
      <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
        {!isAdmin() && (
          <Typography color="error" sx={{ mb: 2 }}>Admin permissions required to manage gadgets.</Typography>
        )}
  
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Name" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required
              sx={{ mb: 2, '& .MuiInputBase-root': { overflow: 'hidden' } }} 
            />
            <TextField 
              fullWidth 
              label="Description" 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              required
              multiline
              rows={3}
              placeholder="Enter a detailed description of the gadget..."
              sx={{ mb: 2, '& .MuiInputBase-root': { overflow: 'hidden' } }} 
            />
            <TextField 
              fullWidth 
              label="Specifications" 
              name="specifications" 
              value={form.specifications} 
              onChange={handleChange} 
              multiline
              rows={4}
              placeholder="Enter specifications (one per line)&#10;e.g.&#10;Display: 6.1-inch Super Retina XDR&#10;Chip: A17 Pro&#10;Storage: 128GB"
              helperText="Enter one specification per line in format: Key: Value"
              sx={{ mb: 2, '& .MuiInputBase-root': { overflow: 'hidden' } }} 
            />
              
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField 
                  fullWidth 
                  select 
                  label="Category" 
                  name="category" 
                  value={form.category} 
                  onChange={handleChange}
                  required
                  helperText={form.category && form.category !== 'accessories' ? 'Variants required for this category' : ''}
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                >
                  {GADGET_CATEGORIES.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Brand" name="brand" value={form.brand} onChange={handleChange} sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }} /></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}><TextField fullWidth label="Model" name="model" value={form.model} onChange={handleChange} sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Image URL" name="image" value={form.image} onChange={handleChange} sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }} /></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Condition" name="condition" value={form.condition} onChange={handleChange} sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like_new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={8}>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={!isAdmin() || uploadLoading}
                >
                  {uploadLoading ? 'Uploading...' : 'Upload Images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleUploadChange}
                  />
                </Button>
                {Array.isArray(form.more_img) && form.more_img.length > 0 && (
                  <Typography variant="caption" sx={{ ml: 2 }}>
                    {form.more_img.length} additional image(s) attached
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                {form.image && (
                  <Box sx={{ width: 80, height: 80, borderRadius: 1, overflow: 'hidden', border: '1px solid #334155' }}>
                    <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Stock Quantity" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} type="number" sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }} /></Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 1
                }}>
                  <Button fullWidth variant="contained" disabled={!isAdmin() || loading} onClick={onCreate}>Create</Button>
                  <Button fullWidth variant="outlined" disabled={!isAdmin() || loading || !selectedId} onClick={() => onUpdate(selectedId)}>Update Selected</Button>
                  <Button fullWidth color="error" variant="outlined" disabled={!isAdmin() || loading || !selectedId} onClick={() => onDelete(selectedId)}>Delete Selected</Button>
                  <Button fullWidth variant="text" disabled={loading && !!selectedId} onClick={clearSelection}>Clear</Button>
                </Box>
              </Grid>
            </Grid>
            {status && (<Typography sx={{ mt: 2 }} color={status.type === 'error' ? 'error' : 'success.main'}>{status.msg}</Typography>)},
          </Grid>
  
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Existing Gadgets</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search gadgets by name, brand, or model"
                value={gadgetSearch}
                onChange={handleGadgetSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
              />
              <Button variant="text" onClick={() => setGadgetSearch('')} disabled={searching || !gadgetSearch}>Clear</Button>
            </Box>
            <Box sx={{ maxHeight: { xs: 320, md: 520 }, overflowY: 'auto', pr: 1 }}>
              <Grid container spacing={2}>
                {(searchResults.length ? searchResults : gadgets).map(g => (
                  <Grid item xs={12} key={g.id}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight="medium">{g.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{g.brand} • {g.model} • {g.category}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" disabled={!isAdmin() || loading} onClick={() => handleSelect(g)}>{selectedId === g.id ? 'Selected' : 'Select'}</Button>
                        <Button size="small" color="error" variant="outlined" disabled={!isAdmin() || loading} onClick={() => onDelete(g.id)}>Delete</Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
                {!(searchResults.length ? searchResults : gadgets).length && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">No gadgets found.</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {selectedId && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Variant Management {form.category !== 'accessories' && <Typography component="span" color="error.main" variant="caption">(Required)</Typography>}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Stock: {totalVariantStock} units across {variants.length} variants
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => setIncludeInactive((prev) => !prev)}>
                {includeInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
              <Button size="small" variant="text" onClick={() => loadVariants()}>Refresh</Button>
            </Box>
          </Box>
          
          {/* Warning if variants required but none exist */}
          {form.category !== 'accessories' && variants.length === 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <Typography color="warning.main" variant="body2">
                ⚠️ Variants are required for {form.category || 'this category'}. Please add at least one variant with pricing and stock.
              </Typography>
            </Paper>
          )}
          
          {!isAdmin() && (
            <Typography color="error" sx={{ mb: 2 }}>Admin permissions required to manage variants.</Typography>
          )}
          
          {/* Single Smart Variant Form */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', overflow: 'hidden' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {editingVariantId ? `Edit Variant #${editingVariantId}` : 'Add New Variant'}
            </Typography>
            
            {/* Quick Storage Presets */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Quick Storage:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {storagePresets.map(s => (
                  <Button 
                    key={s} 
                    size="small" 
                    variant={variantForm.storage === s ? 'contained' : 'outlined'}
                    onClick={() => applyStoragePreset(s)}
                    sx={{ minWidth: 60 }}
                  >
                    {s}
                  </Button>
                ))}
              </Box>
            </Box>
            
            {/* Quick Condition Presets */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Condition:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {conditionPresets.map(c => (
                  <Button 
                    key={c} 
                    size="small" 
                    variant={variantForm.condition === c ? 'contained' : 'outlined'}
                    onClick={() => applyConditionPreset(c)}
                    color={c === 'new' ? 'success' : c === 'like_new' ? 'info' : c === 'good' ? 'warning' : 'inherit'}
                  >
                    {c === 'like_new' ? 'Like New' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </Button>
                ))}
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              {/* Row 1: Storage & Condition (manual input) */}
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Storage" 
                  name="storage" 
                  value={variantForm.storage} 
                  onChange={handleVariantChange}
                  placeholder="e.g., 256GB"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  select 
                  label="Condition" 
                  name="condition" 
                  value={variantForm.condition} 
                  onChange={handleVariantChange}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like_new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                </TextField>
              </Grid>
              
              {/* Row 2: Price (MWK & GBP) */}
              <Grid item xs={6} sm={3}>
                <TextField 
                  fullWidth 
                  label="Price (MWK)" 
                  name="price" 
                  value={variantForm.price} 
                  onChange={handleVariantChange} 
                  type="number"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField 
                  fullWidth 
                  label="Price (GBP)" 
                  name="priceGbp" 
                  value={variantForm.priceGbp} 
                  onChange={handleVariantChange} 
                  type="number"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              
              {/* Row 2 cont: Stock & SKU */}
              <Grid item xs={6} sm={3}>
                <TextField 
                  fullWidth 
                  label="Stock Qty" 
                  name="stockQuantity" 
                  value={variantForm.stockQuantity} 
                  onChange={handleVariantChange} 
                  type="number"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField 
                  fullWidth 
                  label="SKU" 
                  name="sku" 
                  value={variantForm.sku} 
                  onChange={handleVariantChange}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              
              {/* Row 3: Color (optional) */}
              <Grid item xs={8} sm={4}>
                <TextField 
                  fullWidth 
                  label="Color Name (optional)" 
                  name="color" 
                  value={variantForm.color} 
                  onChange={handleVariantChange}
                  placeholder="e.g., Black Titanium"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField 
                  fullWidth 
                  label="Hex" 
                  name="colorHex" 
                  value={variantForm.colorHex} 
                  onChange={handleVariantChange}
                  placeholder="#000000"
                  size="small"
                  sx={{ '& .MuiInputBase-root': { overflow: 'hidden' } }}
                  InputProps={{
                    startAdornment: variantForm.colorHex ? (
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: variantForm.colorHex, border: '1px solid #ccc', mr: 0.5 }} />
                    ) : null
                  }}
                />
              </Grid>
              
              {/* Actions */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {editingVariantId ? (
                    <>
                      <Button variant="contained" disabled={!isAdmin() || variantLoading} onClick={onUpdateVariant}>
                        Update Variant
                      </Button>
                      <Button variant="outlined" onClick={resetVariantForm}>Cancel</Button>
                    </>
                  ) : (
                    <Button 
                      variant="contained" 
                      disabled={!isAdmin() || variantLoading || !variantForm.storage || !variantForm.price} 
                      onClick={onCreateVariant}
                    >
                      Add Variant
                    </Button>
                  )}
                  <Button variant="text" onClick={resetVariantForm}>Clear</Button>
                </Box>
              </Grid>
            </Grid>
            
            {variantStatus && (
              <Typography sx={{ mt: 2 }} color={variantStatus.type === 'error' ? 'error' : 'success.main'}>
                {variantStatus.msg}
              </Typography>
            )}
          </Paper>
          
          {/* Variant Matrix View - grouped by storage */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Current Variants ({variants.length})
          </Typography>
          
          {existingStorages.length > 0 ? (
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Box sx={{ minWidth: 600, overflow: 'hidden' }}>
                {/* Header row */}
                <Grid container spacing={1} sx={{ mb: 1, px: 1 }}>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">STORAGE</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">CONDITION</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">PRICE</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">STOCK</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">ACTIONS</Typography>
                  </Grid>
                </Grid>
                
                {/* Variant rows */}
                {variants.map(v => {
                  const stock = parseInt(v.stock_quantity ?? v.stockQuantity ?? 0, 10);
                  const isOutOfStock = stock <= 0;
                  const condition = v.condition ?? v.condition_status ?? 'new';
                  
                  return (
                    <Paper 
                      key={v.id} 
                      sx={{ 
                        mb: 1, 
                        p: 1.5,
                        opacity: isOutOfStock ? 0.6 : 1,
                        bgcolor: editingVariantId === v.id ? 'rgba(59, 130, 246, 0.1)' : 'background.paper',
                        border: editingVariantId === v.id ? '2px solid #3b82f6' : '1px solid transparent',
                        overflow: 'hidden'
                      }}
                    >
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                            {v.color_hex && (
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: v.color_hex, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                            )}
                            <Typography variant="body2" fontWeight="medium" noWrap>{v.storage}</Typography>
                          </Box>
                          {v.color && <Typography variant="caption" color="text.secondary" noWrap>{v.color}</Typography>}
                        </Grid>
                        <Grid item xs={2}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              px: 1, 
                              py: 0.25, 
                              borderRadius: 1, 
                              display: 'inline-block',
                              bgcolor: condition === 'new' ? 'success.main' : condition === 'like_new' ? 'info.main' : condition === 'good' ? 'warning.main' : 'grey.500',
                              color: 'white',
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            noWrap
                          >
                            {condition === 'like_new' ? 'Like New' : condition.charAt(0).toUpperCase() + condition.slice(1)}
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" noWrap>
                            MWK {Number(v.price || 0).toLocaleString()}
                          </Typography>
                          {v.price_gbp && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              £{Number(v.price_gbp).toFixed(2)}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              disabled={!isAdmin() || variantLoading || stock <= 0} 
                              onClick={() => updateVariantStock(v.id, -1)}
                              sx={{ minWidth: 28, p: 0.5 }}
                            >
                              -
                            </Button>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={isOutOfStock ? 'error.main' : 'text.primary'}
                              sx={{ minWidth: 30, textAlign: 'center' }}
                            >
                              {stock}
                            </Typography>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              disabled={!isAdmin() || variantLoading} 
                              onClick={() => updateVariantStock(v.id, +1)}
                              sx={{ minWidth: 28, p: 0.5 }}
                            >
                              +
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button 
                              size="small" 
                              variant={editingVariantId === v.id ? 'contained' : 'outlined'}
                              disabled={!isAdmin() || variantLoading} 
                              onClick={() => handleVariantSelect(v)}
                            >
                              {editingVariantId === v.id ? 'Editing' : 'Edit'}
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              variant="outlined" 
                              disabled={!isAdmin() || variantLoading} 
                              onClick={() => onDeleteVariant(v.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography variant="body2" color="text.secondary">
                No variants yet. Add storage/condition variants above to enable customer selection.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Tip: For smartphones/tablets, create variants for each storage size and condition combination.
              </Typography>
            </Paper>
          )}
        </Paper>
      )}
    </Container>
  );
};

const DashboardSettings = () => (
  <Box sx={{ p: 3 }}>
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <Card 
          sx={{ 
            bgcolor: 'rgba(5, 19, 35, 0.6)',
            border: '1px solid rgba(72, 206, 219, 0.15)',
            borderRadius: 3,
            height: '100%',
          }}
        >
          <CardHeader 
            title="Profile Settings" 
            sx={{
              '& .MuiCardHeader-title': { color: '#48cedb' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
          <CardContent>
            <UserProfile />
          </CardContent>
        </Card>
      </Grid>
      
    </Grid>
  </Box>
);

const DashboardAbout = () => (
  <Container>
    <Typography variant="h4" fontWeight="bold" gutterBottom>About Dashboard</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body1">About dashboard content will appear here.</Typography>
    </Paper>
  </Container>
);

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { user, userRole, isAdmin, isSeller, isBuyer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Header search state
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerSearchResults, setHeaderSearchResults] = useState([]);
  const [showHeaderSearchResults, setShowHeaderSearchResults] = useState(false);
  const searchDebounceRef = React.useRef(null);
  // Notifications: pending installments count
  const [pendingInstallments, setPendingInstallments] = useState(0);

  // Compute a realistic, dynamic date label for the header using Malawi timezone (Africa/Blantyre)
  const dateLabel = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Blantyre',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date());
    } catch (e) {
      // Fallback in case of environment-specific Intl issues
      const d = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  }, []);

  // Helper: parse notes JSON if possible
  const parseNotes = (notes) => {
    if (!notes) return {};
    try {
      if (typeof notes === 'object') return notes;
      const txt = String(notes).trim();
      if (!txt) return {};
      return JSON.parse(txt);
    } catch (_) {
      return {};
    }
  };

  // Fetch installments to compute pending count
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const uid = user?.uid || user?.id || null;
        const isAdminRole = isAdmin();
        const res = isAdminRole ? await ordersAPI.getAllOrders() : (uid ? await ordersAPI.getUserOrders(uid) : null);
        const orders = res?.orders || [];
        let pending = 0;
        for (const order of orders) {
          const notesObj = parseNotes(order?.notes);
          const isInstallment = !!(notesObj?.installmentPlan || notesObj?.paymentType === 'installment_deposit' || notesObj?.paymentType === 'installment_payment');
          if (!isInstallment) continue;
          const status = (order?.paymentStatus || order?.status || '').toLowerCase();
          if (!status.includes('paid')) pending += 1;
        }
        if (mounted) setPendingInstallments(pending);
      } catch (e) {
        // silently ignore; keep badge at 0
        if (mounted) setPendingInstallments(0);
      }
    };
    run();
    return () => { mounted = false; };
  }, [user, isAdmin]);

  // Header search handlers
  const handleHeaderSearchChange = (e) => {
    setHeaderSearch(e.target.value);
    // show results panel when typing
    if (!showHeaderSearchResults) setShowHeaderSearchResults(true);
  };
  const handleHeaderSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = headerSearch.trim();
      if (q) {
        // If we have suggestions, go to the first relevant one
        const first = headerSearchResults && headerSearchResults[0];
        if (first) {
          if (first.type === 'route' && first.to) {
            navigate(first.to);
          } else if (first.id) {
            navigate(`/gadgets/${first.id}`);
          } else {
            navigate(`/gadgets?search=${encodeURIComponent(q)}`);
          }
        } else {
          navigate(`/gadgets?search=${encodeURIComponent(q)}`);
        }
      }
    }
  };

  // Live search suggestions (gadgets + quick dashboard links)
  React.useEffect(() => {
    const q = headerSearch.trim();
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (!q) {
      setHeaderSearchResults([]);
      setShowHeaderSearchResults(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const dashboardQuickLinks = [
          { label: 'Installments', to: '/dashboard/installments', type: 'route' },
          { label: 'Orders', to: '/dashboard/orders', type: 'route' },
          { label: 'Analytics', to: '/dashboard/analytics', type: 'route' },
          { label: 'Clients', to: '/dashboard/clients', type: 'route' },
        ].filter(link => link.label.toLowerCase().includes(q.toLowerCase()));

        let gadgetResults = [];
        try {
          const res = await gadgetsAPI.search(q);
          if (res && res.success && Array.isArray(res.data)) {
            gadgetResults = res.data.slice(0, 5);
          }
        } catch (_) { gadgetResults = []; }

        const combined = [
          ...dashboardQuickLinks,
          ...gadgetResults.map(g => ({ ...g, type: 'gadget' }))
        ];
        setHeaderSearchResults(combined);
        setShowHeaderSearchResults(true);
      } catch (e) {
        setHeaderSearchResults([]);
        setShowHeaderSearchResults(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [headerSearch]);

  const handleResultClick = (item) => {
    setShowHeaderSearchResults(false);
    if (item.type === 'route' && item.to) {
      navigate(item.to);
    } else if (item && item.id) {
      navigate(`/gadgets/${item.id}`);
    } else if (item && item.label) {
      navigate(`/gadgets?search=${encodeURIComponent(item.label)}`);
    } else {
      const q = headerSearch.trim();
      if (q) navigate(`/gadgets?search=${encodeURIComponent(q)}`);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Extract user display name and email
  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      // Extract name from email (part before @)
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'user@email.com';
  };

  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#0f172a',
      overflow: 'hidden',
    }}>
      {/* Drawer Header with Logo */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #334155',
        backgroundColor: '#0f172a',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'inline-flex' }}>
         <SVGComponent style={{ width: 'min(140px, 40vw)', height: 'auto' }} />
        </Box>
      </Box>
      
      {/* Navigation Menu - Scrollable */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <List component="nav" sx={{ 
          px: 1, 
          py: 0.8,
          width: '100%',
        }}>
          <MainListItems />
        </List>
      </Box>

      {/* User Profile Card at Bottom */}
      <Box sx={{
        p: 2,
        pb: 3,
        borderTop: '1px solid #334155',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        flexShrink: 0,
      }}>
        <Box sx={{
          p: 2,
          borderRadius: 1.5,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          },
        }}>
          <Typography 
            variant="body2" 
            fontWeight="600" 
            sx={{ 
              color: '#f8fafc',
              mb: 0.5,
            }}
          >
            {getUserDisplayName()}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94a3b8',
              display: 'block',
              mb: 0.75,
              wordBreak: 'break-word',
            }}
          >
            {getUserEmail()}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#3b82f6',
              fontWeight: 500,
              display: 'block',
            }}
          >
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* AppBar - Fixed at top */}
      <EnhancedAppBar
        onDrawerToggle={handleDrawerToggle}
        dateLabel={dateLabel}
        headerSearch={headerSearch}
        onHeaderSearchChange={handleHeaderSearchChange}
        headerSearchResults={headerSearchResults}
        onResultClick={handleResultClick}
        pendingInstallments={pendingInstallments}
        showHeaderSearchResults={showHeaderSearchResults}
        onSearchFocus={() => setShowHeaderSearchResults(true)}
        onSearchBlur={() => setTimeout(() => setShowHeaderSearchResults(false), 150)}
        onHeaderSearchKeyDown={handleHeaderSearchKeyDown}
      />

      {/* Main Layout - Below AppBar */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 70px)',
        width: '100%',
        marginTop: '70px',
      }}>
        {/* Mobile drawer */}
        <MobileDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
          }}
        >
          {drawer}
        </MobileDrawer>

        {/* Desktop drawer */}
        <DesktopDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
          }}
        >
          {drawer}
        </DesktopDrawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            backgroundColor: '#0f172a',
            flexGrow: 1,
            overflow: 'auto',
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            marginLeft: { xs: 0, md: `${drawerWidth}px` },
            // Accessibility improvements
            '& .Mui-focusVisible': {
                outline: '2px solid #3b82f6',
                outlineOffset: '2px',
              },
            }}
            // Accessibility attributes
            role="main"
            aria-label="Main content area"
          >
            <Box sx={{ 
              mt: { xs: 2, md: 4 }, 
              mb: { xs: 2, md: 4 },
            px: { xs: 2, sm: 3 },
            height: 'auto',
            overflowY: 'auto',
            '& .MuiBox-root': {
              overflowY: 'auto'
            }
          }}>
            <Routes>
              <Route index element={<DashboardIndex />} />
              <Route path="analytics" element={<RequireAdmin><DashboardAnalytics /></RequireAdmin>} />
              <Route path="clients" element={<DashboardClients />} />
              <Route path="gadgets" element={<RequireAdmin><DashboardGadgets /></RequireAdmin>} />
              <Route path="trade-in" element={<RequireAdmin><TradeInPage /></RequireAdmin>} />
              <Route path="trade-ins-admin" element={<RequireAdmin><AdminTradeIns /></RequireAdmin>} />
              <Route path="subscriptions" element={<RequireAdmin><AdminSubscriptions /></RequireAdmin>} />
              {/* Admin Users route */}
              <Route path="users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="applications" element={<InstallmentApplications />} />
              <Route path="receipts" element={<InstallmentReceipts />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route path="about" element={<DashboardAbout />} />
              {/* Orders route */}
              <Route path="orders" element={<Orders />} />
              {/* Installments route */}
              <Route path="installments" element={<Installments />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
