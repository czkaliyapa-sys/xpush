import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Badge,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LaptopIcon from '@mui/icons-material/Laptop';
import TabletIcon from '@mui/icons-material/Tablet';
import WatchIcon from '@mui/icons-material/Watch';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CableIcon from '@mui/icons-material/Cable';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { tradeInAPI, gadgetsAPI } from '../services/api';
import { useToast } from './ToastProvider.jsx';
import { handleError, componentErrorHandlers } from '../utils/errorHandler.js';

const TradeInCard = styled(Card)(({ theme }) => ({
  height: '100%',
    minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  '&:hover': {
    transform: 'translateY(-4px)',
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(72, 206, 219, 0.5)',
  },
  '&.selected': {
    borderColor: '#48CEDB',
    borderWidth: 2,
    borderStyle: 'solid',
    background: 'rgba(72, 206, 219, 0.1)'
  }
}));

const StepContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
}));

const ImageUploadZone = styled(Box)(({ theme, isDragging }) => ({
  border: `2px dashed ${isDragging ? '#48CEDB' : 'rgba(255, 255, 255, 0.3)'}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  background: isDragging ? 'rgba(72, 206, 219, 0.1)' : 'rgba(255, 255, 255, 0.03)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#48CEDB',
    background: 'rgba(72, 206, 219, 0.08)'
  }
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  '& .delete-overlay': {
    position: 'absolute',
    top: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)'
  }
}));

const TradeInSection = () => {
  const { showError, showSuccess, showWarning } = useToast();
  // Glass styling for form inputs
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      fontSize: '1rem',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: '#48CEDB' },
      '&.Mui-focused fieldset': { borderColor: '#48CEDB' }
    },
    '& .MuiInputLabel-root': { 
      color: 'rgba(255,255,255,0.7)',
      fontSize: '1rem',
      fontWeight: 600
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' },
    '& .MuiSelect-select': {
      padding: '16.5px 14px !important',
      minHeight: 'auto !important'
    }
  };

  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({
    brand: '',
    customBrand: '',
    model: '',
    storage: '',
    condition: '',
    accessories: '',
    color: '',
    batteryHealth: '',
    serialNumber: '',
    imei: '',
    cpu: '',
    ram: '',
    gpu: '',
    screenSize: '',
    year: '',
    controllers: '',
    bundledItems: '',
    networkLock: '',
    conditionNotes: ''
  });
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [marketValue, setMarketValue] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [tradeInReference, setTradeInReference] = useState('');
  const [swapReference, setSwapReference] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState(null);
  
  // Image upload states
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Swap feature states
  const [swapEnabled, setSwapEnabled] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedSwapGadget, setSelectedSwapGadget] = useState(null);
  const [availableGadgets, setAvailableGadgets] = useState([]);
  const [loadingGadgets, setLoadingGadgets] = useState(false);

  const steps = ['Select Device', 'Device Details', 'Condition Assessment', 'Upload Photos', 'Contact Info', 'Quote Review'];

  // Icon mapping for categories
  const getCategoryIcon = (slug) => {
    const iconMap = {
      smartphone: PhoneAndroidIcon,
      laptop: LaptopIcon,
      tablet: TabletIcon,
      wearable: WatchIcon,
      wearables: WatchIcon,
      audio: HeadphonesIcon,
      accessories: CableIcon,
      gaming: SportsEsportsIcon,
      desktop: DesktopWindowsIcon,
      productivity: DesktopWindowsIcon
    };
    return iconMap[slug] || CableIcon;
  };

    // Category descriptions
    const getCategoryDescription = (slug) => {
      const descriptions = {
        smartphone: 'Trade in your smartphones for instant cash or upgrade credit. We accept all models including iPhone (from iPhone X and newer), Samsung Galaxy (S-series, Note, Z-series), Google Pixel, OnePlus, Xiaomi, Huawei, and other premium Android devices. Get competitive prices based on model, storage capacity, and condition.',
        laptop: 'Turn your old laptop into cash or credit. We accept MacBooks (2015 and newer), Windows laptops from Dell, HP, Lenovo, Microsoft Surface, gaming laptops from ASUS, MSI, Razer, and Chromebooks. Whether it\'s an ultrabook, workstation, or gaming rig, we\'ll give you a fair quote based on specs, condition, and market demand.',
        tablet: 'Trade in your tablet for cash or swap credit. We accept iPads (Air, Pro, Mini from 2018+), Samsung Galaxy Tabs (A-series, S-series), Microsoft Surface tablets, Amazon Fire tablets, and other Android tablets. Value depends on screen size, storage, cellular capability, and overall condition.',
        wearable: 'Get value for your smartwatches and fitness trackers. We accept Apple Watch (Series 3 and newer), Samsung Galaxy Watch, Garmin fitness watches, Fitbit trackers, Huawei Watch, and other premium wearables. Value is based on model, condition, battery health, and included accessories (straps, charging cables).',
        wearables: 'Get value for your smartwatches and fitness trackers. We accept Apple Watch (Series 3 and newer), Samsung Galaxy Watch, Garmin fitness watches, Fitbit trackers, Huawei Watch, and other premium wearables. Value is based on model, condition, battery health, and included accessories (straps, charging cables).',
        audio: 'Trade in your premium headphones, earbuds, and audio accessories. We accept AirPods (all generations including Pro and Max), Bose headphones, Sony WH/WF series, Beats by Dre, Sennheiser, and other high-end audio devices. Original charging cases, cables, and boxes increase value significantly.',
        accessories: 'Trade in your device accessories for credit. We accept official Apple accessories (Magic Keyboard, Apple Pencil, MagSafe chargers), high-quality third-party keyboards, mice, styluses, chargers (65W+), premium cases, and other tech accessories. Must be in working condition with minimal wear.',
        gaming: 'Trade in your gaming consoles and get cash or upgrade credit. We accept PlayStation 4/5, Xbox One/Series X/S, Nintendo Switch (standard and OLED), handheld gaming devices, and gaming controllers. Bundle with games and accessories for maximum value. Console condition, storage size, and included items affect pricing.',
        desktop: 'Trade in your desktop computers and workstations. We accept iMacs (2017+), pre-built Windows PCs, custom gaming rigs, all-in-one computers, and Mac Minis. High-value components (GPU, CPU, RAM, SSD) increase your quote. Must be functional with no major hardware issues.',
        productivity: 'Trade in your work and productivity devices. We accept monitors (24" and larger, 1080p+), printers (laser/inkjet), scanners, document shredders, projectors, and office equipment. Professional-grade devices from brands like HP, Epson, Canon, Dell, and LG get better valuations.'
      };
      return descriptions[slug] || 'Trade in your device and get cash value based on its condition, specifications, and market demand. We provide instant quotes and fast payment processing.';
    };

  // Base value mapping for categories
  const getCategoryBaseValue = (slug) => {
    const valueMap = {
      smartphone: 200,
      laptop: 400,
      tablet: 150,
      wearable: 100,
      wearables: 100,
      audio: 80,
      accessories: 50,
      gaming: 350,
      desktop: 450,
      productivity: 400
    };
    return valueMap[slug] || 150;
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await gadgetsAPI.getCategories();
        if (response.success && response.data) {
          // Transform API categories to match our format
          const transformedCategories = response.data
            .filter(cat => cat.count > 0) // Only show categories with gadgets
            .map(cat => ({
              id: cat.slug,
              name: cat.slug === 'laptop' ? 'PC' : cat.name, // Rename Laptop to PC
              icon: getCategoryIcon(cat.slug),
              baseValue: getCategoryBaseValue(cat.slug),
              count: cat.count
            }));
          
          // Always include tablet category for trade-ins even if no gadgets yet
          const hasTablet = transformedCategories.some(cat => cat.id === 'tablet');
          if (!hasTablet) {
            transformedCategories.push({
              id: 'tablet',
              name: 'Tablet',
              icon: TabletIcon,
              baseValue: 150,
              count: 0
            });
          }
          
          setCategories(transformedCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories if API fails
        setCategories([
          { id: 'smartphone', name: 'Smartphone', icon: PhoneAndroidIcon, baseValue: 200 },
          { id: 'tablet', name: 'Tablet', icon: TabletIcon, baseValue: 150 },
          { id: 'laptop', name: 'PC', icon: LaptopIcon, baseValue: 400 },
          { id: 'wearable', name: 'Wearables', icon: WatchIcon, baseValue: 100 },
          { id: 'audio', name: 'Audio', icon: HeadphonesIcon, baseValue: 80 },
          { id: 'gaming', name: 'Gaming', icon: SportsEsportsIcon, baseValue: 350 }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Use dynamic categories instead of hardcoded
  const deviceCategories = categories;

  const deviceBrands = {
    smartphone: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Tecno', 'Infinix', 'Oppo', 'Vivo', 'Other'],
    laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Microsoft', 'ASUS', 'Acer', 'MSI', 'Razer', 'Other'],
    tablet: ['Apple', 'Samsung', 'Microsoft', 'Amazon', 'Lenovo', 'Other'],
    smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei', 'Other'],
    headphones: ['Apple', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica', 'JBL', 'Beats', 'Other'],
    camera: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Other']
  };

  // Category-specific advanced fields
  const categoryFieldConfig = {
    smartphone: [
      { key: 'color', label: 'Color', placeholder: 'e.g., Midnight Black' },
      { key: 'batteryHealth', label: 'Battery Health (%)', placeholder: 'e.g., 92%' },
      { key: 'storage', label: 'Storage', placeholder: 'e.g., 256GB' },
      { key: 'networkLock', label: 'Network Lock', type: 'select', options: ['Unlocked', 'Carrier Locked'] },
      { key: 'imei', label: 'IMEI / Serial', placeholder: '15-digit IMEI or serial number' }
    ],
    laptop: [
      { key: 'cpu', label: 'CPU', placeholder: 'e.g., Intel i7-12700H / M2 Pro' },
      { key: 'ram', label: 'RAM', placeholder: 'e.g., 16GB' },
      { key: 'storage', label: 'Storage', placeholder: 'e.g., 512GB NVMe' },
      { key: 'gpu', label: 'GPU', placeholder: 'e.g., RTX 3060 / Integrated' },
      { key: 'screenSize', label: 'Screen Size', placeholder: 'e.g., 15.6"' },
      { key: 'year', label: 'Purchase Year', placeholder: 'e.g., 2022' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'Laptop serial number' }
    ],
    tablet: [
      { key: 'color', label: 'Color', placeholder: 'e.g., Space Gray' },
      { key: 'storage', label: 'Storage', placeholder: 'e.g., 128GB' },
      { key: 'networkLock', label: 'Cellular / Wi-Fi', type: 'select', options: ['Wi-Fi only', 'Wi-Fi + Cellular'] },
      { key: 'batteryHealth', label: 'Battery Health (%)', placeholder: 'e.g., 90%' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'Device serial number' }
    ],
    wearables: [
      { key: 'size', label: 'Case Size / Strap Size', placeholder: 'e.g., 44mm' },
      { key: 'batteryHealth', label: 'Battery Health (%)', placeholder: 'e.g., 88%' },
      { key: 'color', label: 'Color / Finish', placeholder: 'e.g., Midnight' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'Watch serial number' }
    ],
    audio: [
      { key: 'model', label: 'Exact Model', placeholder: 'e.g., AirPods Pro 2 / Sony WH-1000XM5' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'If available' },
      { key: 'conditionNotes', label: 'Audio Issues', placeholder: 'e.g., crackling, battery wear' }
    ],
    gaming: [
      { key: 'storage', label: 'Storage', placeholder: 'e.g., 1TB' },
      { key: 'controllers', label: 'Controllers Included', placeholder: 'e.g., 2' },
      { key: 'bundledItems', label: 'Games / Accessories Included', placeholder: 'List any games or accessories' },
      { key: 'serialNumber', label: 'Serial Number', placeholder: 'Console serial number' }
    ],
    accessories: [
      { key: 'model', label: 'Accessory Type / Model', placeholder: 'e.g., Magic Keyboard, 65W Charger' },
      { key: 'conditionNotes', label: 'Condition Notes', placeholder: 'Scratches, missing parts, cable wear, etc.' }
    ],
    default: [
      { key: 'color', label: 'Color', placeholder: 'e.g., Silver' },
      { key: 'storage', label: 'Storage / Capacity', placeholder: 'e.g., 512GB' },
      { key: 'serialNumber', label: 'Serial / Identifier', placeholder: 'Serial or identifying number' }
    ]
  };

  const getCategoryFields = () => {
    if (!selectedCategory) return categoryFieldConfig.default;
    return categoryFieldConfig[selectedCategory] || categoryFieldConfig.default;
  };

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', multiplier: 1.0, description: 'Like new, no visible wear' },
    { value: 'very-good', label: 'Very Good', multiplier: 0.85, description: 'Minor signs of use, fully functional' },
    { value: 'good', label: 'Good', multiplier: 0.7, description: 'Noticeable wear, fully functional' },
    { value: 'fair', label: 'Fair', multiplier: 0.5, description: 'Heavy wear, may have minor issues' },
    { value: 'poor', label: 'Poor', multiplier: 0.3, description: 'Significant damage, limited functionality' }
  ];

  const handleDeviceFieldChange = (key, value) => {
    setDeviceInfo((prev) => ({ ...prev, [key]: value }));
    
    // Trigger real-time estimate update if key fields change
    if (['brand', 'model', 'storage', 'condition', 'year', 'conditionNotes'].includes(key)) {
      debouncedEstimateUpdate();
    }
  };

  // Image compression to WebP
  const compressImageToWebP = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions: 1200px width/height
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with 85% quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now()
                }));
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (files, imageType = 'other') => {
    setUploadingImages(true);
    setUploadProgress(0);
    
    try {
      const fileArray = Array.from(files);
      const totalFiles = fileArray.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        // Compress to WebP
        const compressedFile = await compressImageToWebP(file);
        
        // Create preview
        const preview = URL.createObjectURL(compressedFile);
        
        // Store locally for display
        setUploadedImages(prev => [
          ...prev,
          {
            file: compressedFile,
            preview,
            type: imageType,
            uploaded: false,
            url: null
          }
        ]);
        
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Image upload failed', true);
      showError(errorMessage);
      setSubmitError(componentErrorHandlers.tradeIn.IMAGE_UPLOAD_FAILED);
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  }, [compressImageToWebP]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files, 'other');
    }
  }, [handleImageUpload]);

  const handleFileSelect = useCallback((e, imageType = 'other') => {
    const files = e.target.files;
    if (files.length > 0) {
      handleImageUpload(files, imageType);
    }
  }, [handleImageUpload]);

  const handleDeleteImage = useCallback((index) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview); // Clean up memory
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Upload images to server
  const uploadImagesToServer = useCallback(async (reference) => {
    if (uploadedImages.length === 0) return [];
    
    const uploadPromises = uploadedImages.map(async (img) => {
      const formData = new FormData();
      formData.append('image', img.file);
      formData.append('reference', reference);
      formData.append('imageType', img.type);
      
      try {
        const response = await fetch('https://sparkle-pro.co.uk/api/tradeins/upload-image', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.success) {
          return { ...img, uploaded: true, url: data.imageUrl };
        }
        throw new Error(data.error || 'Upload failed');
      } catch (error) {
        const errorMessage = handleError(error, 'Server image upload failed', false);
        return { ...img, uploaded: false, error: errorMessage };
      }
    });
    
    return await Promise.all(uploadPromises);
  }, [uploadedImages]);

  // Real-time estimate update with debounce
  const debouncedEstimateUpdate = useCallback(() => {
    const timer = setTimeout(async () => {
      if (!deviceInfo.brand || !deviceInfo.condition) return;
      
      try {
        const response = await fetch('https://sparkle-pro.co.uk/api/trade-in/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: selectedCategory,
            brand: deviceInfo.brand,
            model: deviceInfo.model,
            storage: deviceInfo.storage,
            condition: deviceInfo.condition,
            year: deviceInfo.year,
            conditionNotes: deviceInfo.conditionNotes
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setEstimatedValue(data.estimate);
          setMarketValue(data.marketValue);
          setAiSuggestion(data.aiConditionSuggestion);
          setAiConfidence(data.aiConfidenceScore);
          setPricingBreakdown(data.breakdown);
        }
      } catch (error) {
        const errorMessage = handleError(error, 'Estimate update failed', false);
        // Silently fail for estimate updates - don't show user-facing errors
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [deviceInfo, selectedCategory]);

  // Load available gadgets for swap
  const loadSwapGadgets = useCallback(async () => {
    setLoadingGadgets(true);
    try {
      const response = await gadgetsAPI.getAllGadgets();
      if (response.success && response.data) {
        // Filter to show popular devices
        const popular = response.data.filter(g => 
          g.is_featured || ['smartphone', 'laptop', 'tablet'].includes(g.category)
        ).slice(0, 20);
        setAvailableGadgets(popular);
      }
    } catch (error) {
      console.error('Failed to load gadgets:', error);
    } finally {
      setLoadingGadgets(false);
    }
  }, []);

  // Handle swap selection
  const handleSwapSelect = useCallback((gadget) => {
    setSelectedSwapGadget(gadget);
    setSwapEnabled(true);
    setSwapDialogOpen(false);
  }, []);

  const calculateEstimate = () => {
    const category = deviceCategories.find(cat => cat.id === selectedCategory);
    if (!category || !deviceInfo.condition) return 0;
    
    const condition = conditionOptions.find(cond => cond.value === deviceInfo.condition);
    const baseValue = category.baseValue || 150;
    const conditionMultiplier = condition?.multiplier || 0.5;
    
    // Brand multiplier
    let brandMultiplier = 1.0;
    if (['Apple', 'Samsung'].includes(deviceInfo.brand)) brandMultiplier = 1.2;
    else if (['Google', 'Sony', 'Dell', 'HP', 'Lenovo'].includes(deviceInfo.brand)) brandMultiplier = 1.1;
    
    return Math.round(baseValue * conditionMultiplier * brandMultiplier);
  };

  const handleNext = async () => {
    // Calculate estimate when moving from condition assessment step
    if (activeStep === 2) {
      const estimate = calculateEstimate();
      setEstimatedValue(estimate);
      
      // Fetch advanced pricing if device details available
      if (deviceInfo.brand && deviceInfo.model) {
        try {
          const response = await fetch('https://sparkle-pro.co.uk/api/trade-in/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: selectedCategory,
              brand: deviceInfo.brand,
              model: deviceInfo.model,
              storage: deviceInfo.storage,
              condition: deviceInfo.condition,
              year: deviceInfo.year,
              conditionNotes: deviceInfo.conditionNotes
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setEstimatedValue(data.estimate);
            setMarketValue(data.marketValue);
            setAiSuggestion(data.aiConditionSuggestion);
            setAiConfidence(data.aiConfidenceScore);
            setPricingBreakdown(data.breakdown);
          }
        } catch (error) {
          console.error('Advanced pricing error:', error);
        }
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setDeviceInfo({ ...deviceInfo, brand: '', model: '' });
  };

  const handleSubmitQuote = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Prepare swap data if enabled
      const swapData = swapEnabled && selectedSwapGadget ? {
        swapRequested: true,
        swapGadgetId: selectedSwapGadget.id,
        swapGadgetName: selectedSwapGadget.name,
        swapGadgetPrice: selectedSwapGadget.price || selectedSwapGadget.price_gbp,
        swapBalanceDue: (selectedSwapGadget.price || selectedSwapGadget.price_gbp) - estimatedValue
      } : {
        swapRequested: false
      };
      
      const tradeInData = {
        category: selectedCategory,
        categoryName: deviceCategories.find(cat => cat.id === selectedCategory)?.name,
        deviceInfo: {
          ...deviceInfo,
          baseValue: deviceCategories.find(cat => cat.id === selectedCategory)?.baseValue,
          marketValue,
          ageDepreciationFactor: pricingBreakdown?.ageDepreciationFactor,
          specMultiplier: pricingBreakdown?.specMultiplier,
          damageDeduction: pricingBreakdown?.damageDeduction,
          aiConditionSuggestion: aiSuggestion,
          aiConfidenceScore: aiConfidence
        },
        contactInfo,
        estimatedValue,
        ...swapData,
        submittedAt: new Date().toISOString(),
        notify: true,
        notifyEmail: contactInfo.email
      };

      const response = await tradeInAPI.submit(tradeInData);
      
      if (response.success) {
        const reference = response.reference || 'TI-' + Date.now();
        setTradeInReference(reference);
        
        if (response.swapReference) {
          setSwapReference(response.swapReference);
        }
        
        // Upload images to server if any
        if (uploadedImages.length > 0) {
          await uploadImagesToServer(reference);
        }
        
        setSubmitSuccess(true);
        setSnackbarOpen(true);
        setActiveStep(6); // Success step
      } else {
        const errorMessage = response.error || componentErrorHandlers.tradeIn.SUBMISSION_FAILED;
        showError(errorMessage);
        setSubmitError(errorMessage);
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Trade-in submission failed', true);
      showError(errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setActiveStep(0);
    setSelectedCategory('');
    setDeviceInfo({
      brand: '',
      model: '',
      storage: '',
      condition: '',
      accessories: '',
      color: '',
      batteryHealth: '',
      serialNumber: '',
      imei: '',
      cpu: '',
      ram: '',
      gpu: '',
      screenSize: '',
      year: '',
      controllers: '',
      bundledItems: '',
      networkLock: '',
      conditionNotes: ''
    });
    setContactInfo({ name: '', email: '', phone: '', address: '' });
    setEstimatedValue(0);
    setSubmitSuccess(false);
    setSubmitError('');
    setTradeInReference('');
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <StepContent>
            {loadingCategories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ mt: 1, justifyContent: 'center' }}>
                {deviceCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={category.id}>
                      <TradeInCard
                        className={selectedCategory === category.id ? 'selected' : ''}
                        onClick={() => {
                          setSelectedCategoryInfo(category);
                          setInfoDialogOpen(true);
                        }}
                      >
                        <CardContent sx={{ 
                          textAlign: 'center', 
                          py: 4,
                          px: 2,
                          height: '100%',
                          minHeight: 180,
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, height: 60 }}>
                            <IconComponent sx={{ fontSize: 56, color: '#48CEDB' }} />
                          </Box>
                          <Typography variant="h6" sx={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>
                            {category.name}
                          </Typography>
                        </CardContent>
                      </TradeInCard>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </StepContent>
        );

      case 1:
        return (
          <StepContent>
            <Stack spacing={3}>
              {/* Basic Information Card */}
              <Card sx={{
                background: 'rgba(72, 206, 219, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(72, 206, 219, 0.3)',
                borderRadius: 2,
                p: 3
              }}>
                <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 700, mb: 3, fontSize: '1.1rem' }}>
                  📝 Basic Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{
                      ...textFieldSx,
                      minWidth: 200
                    }} size="medium">
                      <InputLabel sx={{ fontWeight: 600, fontSize: '1rem' }}>Brand *</InputLabel>
                      <Select
                        value={deviceInfo.brand === 'Other' ? 'Other' : (deviceBrands[selectedCategory]?.includes(deviceInfo.brand) ? deviceInfo.brand : '')}
                        label="Brand *"
                        onChange={(e) => {
                          if (e.target.value === 'Other') {
                            handleDeviceFieldChange('brand', 'Other');
                          } else {
                            handleDeviceFieldChange('brand', e.target.value);
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: '#051323',
                              '& .MuiMenuItem-root': {
                                color: 'white',
                                fontSize: '1rem',
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.1)' },
                                '&.Mui-selected': { bgcolor: 'rgba(72, 206, 219, 0.2)' }
                              }
                            }
                          }
                        }}
                      >
                        {deviceBrands[selectedCategory]?.map((brand) => (
                          <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Show custom brand input if "Other" is selected */}
                  {deviceInfo.brand === 'Other' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Custom Brand Name *"
                        value={deviceInfo.customBrand || ''}
                        onChange={(e) => handleDeviceFieldChange('customBrand', e.target.value)}
                        placeholder="Enter brand name"
                        sx={textFieldSx}
                        size="medium"
                        InputLabelProps={{ sx: { fontWeight: 600, fontSize: '1rem' } }}
                        helperText="Please specify the brand name"
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Model *"
                      value={deviceInfo.model}
                      onChange={(e) => handleDeviceFieldChange('model', e.target.value)}
                      placeholder="e.g., iPhone 15 Pro, PS5, MacBook Air M3"
                      sx={textFieldSx}
                      size="medium"
                      InputLabelProps={{ sx: { fontWeight: 600, fontSize: '1rem' } }}
                    />
                  </Grid>
                </Grid>
              </Card>

              {/* Technical Specifications Card */}
              {getCategoryFields().length > 0 && (
                <Card sx={{
                  background: 'rgba(72, 206, 219, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(72, 206, 219, 0.3)',
                  borderRadius: 2,
                  p: 3
                }}>
                  <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 700, mb: 3, fontSize: '1.1rem' }}>
                    ⚙️ Technical Specifications
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {getCategoryFields().map((field) => (
                      <Grid item xs={12} sm={6} key={field.key}>
                        {field.type === 'select' ? (
                          <FormControl fullWidth sx={textFieldSx} size="medium">
                            <InputLabel sx={{ fontWeight: 600, fontSize: '1rem' }}>{field.label}</InputLabel>
                            <Select
                              value={deviceInfo[field.key] || ''}
                              label={field.label}
                              onChange={(e) => handleDeviceFieldChange(field.key, e.target.value)}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    bgcolor: '#051323',
                                    '& .MuiMenuItem-root': {
                                      color: 'white',
                                      fontSize: '1rem',
                                      py: 1.5,
                                      '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.1)' },
                                      '&.Mui-selected': { bgcolor: 'rgba(72, 206, 219, 0.2)' }
                                    }
                                  }
                                }
                              }}
                            >
                              {field.options?.map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            fullWidth
                            label={field.label}
                            value={deviceInfo[field.key] || ''}
                            onChange={(e) => handleDeviceFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            helperText={field.helperText}
                            sx={textFieldSx}
                            size="medium"
                            InputLabelProps={{ sx: { fontWeight: 600, fontSize: '1rem' } }}
                          />
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              )}

              {/* Additional Details Card */}
              <Card sx={{
                background: 'rgba(72, 206, 219, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(72, 206, 219, 0.3)',
                borderRadius: 2,
                p: 3
              }}>
                <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 700, mb: 3, fontSize: '1.1rem' }}>
                  📦 Additional Details
                </Typography>
                
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Accessories Included"
                    value={deviceInfo.accessories}
                    onChange={(e) => handleDeviceFieldChange('accessories', e.target.value)}
                    placeholder="e.g., charger, box, cables, extra controllers, games"
                    sx={textFieldSx}
                    size="medium"
                    InputLabelProps={{ sx: { fontWeight: 600, fontSize: '1rem' } }}
                  />

                  <TextField
                    fullWidth
                    label="Condition Notes"
                    value={deviceInfo.conditionNotes}
                    onChange={(e) => handleDeviceFieldChange('conditionNotes', e.target.value)}
                    placeholder="Describe any scratches, dents, battery issues, screen problems, functional defects, etc."
                    sx={textFieldSx}
                    size="medium"
                    multiline
                    rows={4}
                    InputLabelProps={{ sx: { fontWeight: 600, fontSize: '1rem' } }}
                    helperText="Be as detailed as possible for an accurate quote"
                  />
                </Stack>
              </Card>
            </Stack>
          </StepContent>
        );

      case 2:
        return (
          <StepContent>
            {/* AI Suggestion Badge */}
            {aiSuggestion && (
              <Alert 
                severity="info" 
                icon={<AutoAwesomeIcon />}
                sx={{ 
                  mb: 3,
                  bgcolor: 'rgba(72, 206, 219, 0.1)',
                  color: '#48CEDB',
                  border: '1px solid rgba(72, 206, 219, 0.3)',
                  '& .MuiAlert-icon': { color: '#48CEDB' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  AI Suggestion: {conditionOptions.find(c => c.value === aiSuggestion)?.label}
                </Typography>
                <Typography variant="caption">
                  Based on your description (Confidence: {Math.round((aiConfidence || 0) * 100)}%)
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {conditionOptions.map((condition) => (
                <Grid item xs={12} key={condition.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      background: deviceInfo.condition === condition.value 
                        ? 'rgba(72, 206, 219, 0.1)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: deviceInfo.condition === condition.value ? 2 : 1,
                      borderColor: deviceInfo.condition === condition.value ? '#48CEDB' : 'rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(72, 206, 219, 0.5)'
                      }
                    }}
                    onClick={() => setDeviceInfo({ ...deviceInfo, condition: condition.value })}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white' }}>{condition.label}</Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {condition.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${Math.round(condition.multiplier * 100)}% of base value`}
                          color={condition.multiplier > 0.8 ? 'success' : condition.multiplier > 0.6 ? 'warning' : 'error'}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </StepContent>
        );

      case 3:
        return (
          <StepContent>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, textAlign: 'center' }}>
              📸 Photos help us provide a more accurate valuation. Upload 4-6 clear images showing your device's condition.
            </Typography>
            
            {/* Upload Progress */}
            {uploadingImages && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#48CEDB' }
                }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                  Compressing images... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
            
            {/* Upload Zone */}
            <input
              type="file"
              accept="image/*"
              multiple
              id="image-upload-input"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e, 'other')}
            />
            
            <ImageUploadZone
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-upload-input').click()}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: '#48CEDB', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Drag & drop images here
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                or click to browse
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Accepted: JPG, PNG, WebP • Max 10MB per image • Auto-compressed to WebP
              </Typography>
            </ImageUploadZone>
            
            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Uploaded Images ({uploadedImages.length})
                </Typography>
                <Grid container spacing={2}>
                  {uploadedImages.map((img, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <ImagePreview>
                        <Box sx={{ aspectRatio: '1/1', position: 'relative' }}>
                          <img src={img.preview} alt={`Device ${index + 1}`} />
                          <Box className="delete-overlay">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteImage(index)}
                              sx={{ color: 'white' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'white' }}>
                            {img.type === 'front' ? '📱 Front' : 
                             img.type === 'back' ? '📱 Back' : 
                             img.type === 'screen' ? '📺 Screen' : 
                             img.type === 'damage' ? '⚠️ Damage' : 
                             '📸 Photo'}
                          </Typography>
                        </Box>
                      </ImagePreview>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Quick Add Buttons */}
                <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap">
                  {['front', 'back', 'screen', 'damage'].map((type) => (
                    <Button
                      key={type}
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleFileSelect(e, type);
                        input.click();
                      }}
                      sx={{
                        borderColor: 'rgba(72, 206, 219, 0.5)',
                        color: '#48CEDB',
                        '&:hover': {
                          borderColor: '#48CEDB',
                          bgcolor: 'rgba(72, 206, 219, 0.1)'
                        }
                      }}
                    >
                      Add {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}
          </StepContent>
        );

      case 4:
        return (
          <StepContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  required
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  required
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  required
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  placeholder="We'll arrange free pickup from this address"
                  required
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>
          </StepContent>
        );

      case 5:
        return (
          <StepContent>
            <Box sx={{ mt: 3 }}>
              {/* Main Value Card */}
              <Card 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(76, 175, 80, 0.4)',
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AttachMoneyIcon sx={{ fontSize: 48, color: '#4CAF50' }} />
                    <Box>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                        ${estimatedValue}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        Estimated Trade-In Value
                      </Typography>
                      {marketValue && marketValue !== estimatedValue && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Market Avg: ${marketValue}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Swap Option Button */}
                  {!swapEnabled && (
                    <Button
                      variant="outlined"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => {
                        loadSwapGadgets();
                        setSwapDialogOpen(true);
                      }}
                      sx={{
                        borderColor: '#48CEDB',
                        color: '#48CEDB',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#48CEDB',
                          bgcolor: 'rgba(72, 206, 219, 0.1)'
                        }
                      }}
                    >
                      Use as Credit
                    </Button>
                  )}
                </Stack>
              </Card>
              
              {/* Swap Details if Enabled */}
              {swapEnabled && selectedSwapGadget && (
                <Card sx={{ 
                  p: 3, 
                  mb: 3,
                  background: 'rgba(72, 206, 219, 0.1)',
                  border: '2px solid rgba(72, 206, 219, 0.4)'
                }}>
                  <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHorizIcon /> Swap to New Device
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>Trade-In Credit</Typography>
                      <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                        ${estimatedValue}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>New Device</Typography>
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {selectedSwapGadget.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        ${selectedSwapGadget.price || selectedSwapGadget.price_gbp}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                        <Typography variant="h6" sx={{ color: 'white' }}>Balance Due:</Typography>
                        <Typography variant="h4" sx={{ color: '#48CEDB', fontWeight: 700 }}>
                          ${((selectedSwapGadget.price || selectedSwapGadget.price_gbp) - estimatedValue).toFixed(2)}
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => {
                          setSwapEnabled(false);
                          setSelectedSwapGadget(null);
                        }}
                        sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }}
                      >
                        Cancel Swap
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              )}
              
              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <Card sx={{ p: 3, mb: 3, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Device Photos ({uploadedImages.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {uploadedImages.slice(0, 4).map((img, idx) => (
                      <Grid item xs={3} key={idx}>
                        <Box sx={{ 
                          aspectRatio: '1/1',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid rgba(72, 206, 219, 0.3)'
                        }}>
                          <img src={img.preview} alt={`Device ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {uploadedImages.length > 4 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block' }}>
                      +{uploadedImages.length - 4} more images
                    </Typography>
                  )}
                </Card>
              )}

              <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 2, mt: 4 }}>
                📋 Device Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Device"
                    secondary={`${deviceInfo.brand} ${deviceInfo.model}`}
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Storage"
                    secondary={deviceInfo.storage || 'Not specified'}
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Condition"
                    secondary={conditionOptions.find(c => c.value === deviceInfo.condition)?.label}
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                {deviceInfo.color && (
                  <ListItem>
                    <ListItemText
                      primary="Color"
                      secondary={deviceInfo.color}
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                      secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    />
                  </ListItem>
                )}
                {deviceInfo.batteryHealth && (
                  <ListItem>
                    <ListItemText
                      primary="Battery Health"
                      secondary={deviceInfo.batteryHealth}
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                      secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    />
                  </ListItem>
                )}
                {(deviceInfo.serialNumber || deviceInfo.imei) && (
                  <ListItem>
                    <ListItemText
                      primary="Serial / IMEI"
                      secondary={deviceInfo.serialNumber || deviceInfo.imei}
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                      secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    />
                  </ListItem>
                )}
                {deviceInfo.accessories && (
                  <ListItem>
                    <ListItemText
                      primary="Accessories"
                      secondary={deviceInfo.accessories}
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                      secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    />
                  </ListItem>
                )}
                {deviceInfo.conditionNotes && (
                  <ListItem>
                    <ListItemText
                      primary="Condition Notes"
                      secondary={deviceInfo.conditionNotes}
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                      secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Typography variant="h6" gutterBottom sx={{ color: 'white', mt: 4 }}>
                ⏱️ What happens next?
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Free Device Inspection"
                    secondary="We'll verify the condition and finalize your quote"
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalShippingIcon sx={{ color: '#48CEDB' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Free Pickup Service"
                    secondary="We'll collect your device from your address"
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon sx={{ color: '#48CEDB' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Payment"
                    secondary="Get paid within 24 hours of device verification"
                    primaryTypographyProps={{ sx: { color: 'white' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
              </List>

              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  color: '#2196F3',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  '& .MuiAlert-icon': { color: '#2196F3' }
                }}
              >
                This is an estimated quote. Final value may vary based on actual device inspection.
              </Alert>
            </Box>
          </StepContent>
        );

      default:
        return null;
    }
  };

  // Success step content
  const renderSuccessContent = () => (
    <StepContent>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ color: '#4CAF50' }}>
          Trade-In Request Submitted!
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'white' }}>
          Trade-In Reference: <strong>{tradeInReference}</strong>
        </Typography>
        {swapReference && (
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Swap Reference: <strong>{swapReference}</strong>
          </Typography>
        )}
        <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
          Your estimated trade-in value is <strong>${estimatedValue}</strong>
        </Typography>
        
        {swapEnabled && selectedSwapGadget && (
          <Alert severity="success" sx={{ mb: 3, maxWidth: 500, mx: 'auto', bgcolor: 'rgba(72, 206, 219, 0.1)', color: '#48CEDB' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              🔄 Swap Initiated!
            </Typography>
            <Typography variant="body2">
              Your ${estimatedValue} credit will be applied to {selectedSwapGadget.name}.
              Balance due: ${((selectedSwapGadget.price || selectedSwapGadget.price_gbp) - estimatedValue).toFixed(2)}
            </Typography>
          </Alert>
        )}
        
        <Alert severity="success" sx={{ mb: 3, maxWidth: 500, mx: 'auto', bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
          We've sent a confirmation email to <strong>{contactInfo.email}</strong>.
          Our team will contact you within 24 hours to arrange device inspection and pickup.
        </Alert>
        
        {uploadedImages.length > 0 && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            📸 {uploadedImages.length} photo(s) uploaded successfully
          </Typography>
        )}
        
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
          Please keep your reference number for tracking your trade-in status.
        </Typography>
        <Button
          variant="contained"
          onClick={handleResetForm}
          size="large"
          sx={{ 
            mt: 2,
            bgcolor: '#48CEDB',
            color: '#0f172a',
            fontWeight: 600,
            '&:hover': { bgcolor: '#6DD5ED' }
          }}
        >
          Submit Another Trade-In
        </Button>
      </Box>
    </StepContent>
  );

  const isStepComplete = (step) => {
    switch (step) {
      case 0: return selectedCategory !== '';
      case 1: return deviceInfo.brand && deviceInfo.model;
      case 2: return deviceInfo.condition !== '';
      case 3: return true; // Photos are optional
      case 4: return contactInfo.name && contactInfo.email && contactInfo.phone && contactInfo.address;
      default: return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper 
        sx={{ 
          p: 4,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {!submitSuccess ? (
          <>
            {/* Minimalist Progress Indicator */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              {steps.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: index <= activeStep ? '#48CEDB' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>

            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                sx={{ 
                  mr: 1,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': { 
                    color: '#48CEDB', 
                    borderColor: '#48CEDB',
                    bgcolor: 'rgba(72, 206, 219, 0.1)' 
                  },
                  '&:disabled': { color: 'rgba(255,255,255,0.3)' }
                }}
                variant="outlined"
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmitQuote}
                  size="large"
                  disabled={isSubmitting}
                  sx={{ 
                    px: 4,
                    bgcolor: '#48CEDB',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#6DD5ED' },
                    '&:disabled': { bgcolor: 'rgba(72, 206, 219, 0.3)' }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quote Request'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(activeStep)}
                  sx={{
                    bgcolor: '#48CEDB',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#6DD5ED' },
                    '&:disabled': { bgcolor: 'rgba(72, 206, 219, 0.3)' }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        ) : (
          renderSuccessContent()
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message="Trade-in request submitted successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Category Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(5, 19, 35, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(72, 206, 219, 0.3)',
            borderRadius: 3,
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 2
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #48CEDB 0%, #6DD5ED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            INFO
          </Typography>
          <IconButton 
            onClick={() => setInfoDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {selectedCategoryInfo && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                {React.createElement(selectedCategoryInfo.icon, { 
                  sx: { fontSize: 60, color: '#48CEDB', mb: 2 } 
                })}
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  {selectedCategoryInfo.name}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, lineHeight: 1.7 }}>
                {getCategoryDescription(selectedCategoryInfo.id)}
              </Typography>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box sx={{ 
                bgcolor: 'rgba(72, 206, 219, 0.1)', 
                border: '1px solid rgba(72, 206, 219, 0.3)',
                borderRadius: 2, 
                p: 2, 
                mb: 2 
              }}>
                <Typography variant="subtitle2" sx={{ color: '#48CEDB', fontWeight: 600, mb: 1 }}>
                  What we look for:
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="• Device functionality and condition"
                      primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="• Physical appearance (scratches, dents)"
                      primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="• Original accessories included"
                      primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="• Device age and specifications"
                      primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                </List>
              </Box>

              <Alert 
                severity="info" 
                sx={{ 
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  color: '#2196F3',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  '& .MuiAlert-icon': { color: '#2196F3' }
                }}
              >
                Final trade-in value will be determined after device inspection.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button 
            onClick={() => setInfoDialogOpen(false)}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (selectedCategoryInfo) {
                handleCategorySelect(selectedCategoryInfo.id);
              }
              setInfoDialogOpen(false);
            }}
            variant="contained"
            sx={{ 
              bgcolor: '#48CEDB',
              color: '#051323',
              fontWeight: 600,
              '&:hover': { bgcolor: '#6DD5ED' }
            }}
          >
            Continue with {selectedCategoryInfo?.name}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Swap Device Dialog */}
      <Dialog
        open={swapDialogOpen}
        onClose={() => setSwapDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(5, 19, 35, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(72, 206, 219, 0.3)',
            borderRadius: 3,
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 2
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#48CEDB'
          }}>
            <SwapHorizIcon /> Apply Credit to New Device
          </Typography>
          <IconButton 
            onClick={() => setSwapDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ 
            mb: 3,
            bgcolor: 'rgba(72, 206, 219, 0.1)',
            color: '#48CEDB',
            border: '1px solid rgba(72, 206, 219, 0.3)'
          }}>
            Your ${estimatedValue} trade-in credit can be applied toward any device. You'll only pay the difference!
          </Alert>
          
          {loadingGadgets ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#48CEDB' }} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {availableGadgets.map((gadget) => {
                const price = gadget.price || gadget.price_gbp;
                const balance = price - estimatedValue;
                
                return (
                  <Grid item xs={12} sm={6} key={gadget.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          background: 'rgba(72, 206, 219, 0.1)',
                          borderColor: '#48CEDB',
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleSwapSelect(gadget)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {gadget.image && (
                            <Box sx={{ 
                              width: 80, 
                              height: 80, 
                              borderRadius: 1,
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              <img 
                                src={gadget.image} 
                                alt={gadget.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem', mb: 0.5 }}>
                              {gadget.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                              {gadget.category}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip 
                                label={`$${price}`}
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4CAF50',
                                  fontWeight: 600
                                }}
                              />
                              <Chip 
                                label={balance > 0 ? `Pay $${balance.toFixed(2)}` : 'FREE'}
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(72, 206, 219, 0.2)',
                                  color: '#48CEDB',
                                  fontWeight: 600
                                }}
                              />
                            </Stack>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button 
            onClick={() => setSwapDialogOpen(false)}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TradeInSection;