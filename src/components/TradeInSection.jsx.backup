import React, { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
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
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LaptopIcon from '@mui/icons-material/Laptop';
import TabletIcon from '@mui/icons-material/Tablet';
import WatchIcon from '@mui/icons-material/Watch';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DevicesIcon from '@mui/icons-material/Devices';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import { tradeInAPI, gadgetsAPI } from '../services/api';

const TradeInCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid'
  }
}));

const StepContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(2)
}));

const TradeInSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({
    brand: '',
    model: '',
    storage: '',
    condition: '',
    accessories: []
  });
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [tradeInReference, setTradeInReference] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const steps = ['Select Device', 'Device Details', 'Condition Assessment', 'Contact Info', 'Quote Review'];

  // Icon mapping for categories
  const getCategoryIcon = (slug) => {
    const iconMap = {
      smartphone: PhoneAndroidIcon,
      laptop: LaptopIcon,
      tablet: TabletIcon,
      wearable: WatchIcon,
      wearables: WatchIcon,
      audio: HeadphonesIcon,
      accessories: DevicesIcon,
      gaming: SportsEsportsIcon,
      desktop: DesktopWindowsIcon,
      productivity: DesktopWindowsIcon
    };
    return iconMap[slug] || DevicesIcon;
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
              name: cat.name,
              icon: getCategoryIcon(cat.slug),
              baseValue: getCategoryBaseValue(cat.slug),
              count: cat.count
            }));
          setCategories(transformedCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories if API fails
        setCategories([
          { id: 'smartphone', name: 'Smartphone', icon: PhoneAndroidIcon, baseValue: 200 },
          { id: 'laptop', name: 'Laptop', icon: LaptopIcon, baseValue: 400 },
          { id: 'tablet', name: 'Tablet', icon: TabletIcon, baseValue: 150 },
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
    smartphone: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'],
    laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Microsoft', 'ASUS'],
    tablet: ['Apple', 'Samsung', 'Microsoft', 'Amazon'],
    smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fitbit'],
    headphones: ['Apple', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica'],
    camera: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic']
  };

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', multiplier: 1.0, description: 'Like new, no visible wear' },
    { value: 'very-good', label: 'Very Good', multiplier: 0.85, description: 'Minor signs of use, fully functional' },
    { value: 'good', label: 'Good', multiplier: 0.7, description: 'Noticeable wear, fully functional' },
    { value: 'fair', label: 'Fair', multiplier: 0.5, description: 'Heavy wear, may have minor issues' },
    { value: 'poor', label: 'Poor', multiplier: 0.3, description: 'Significant damage, limited functionality' }
  ];

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

  const handleNext = () => {
    if (activeStep === 2) {
      setEstimatedValue(calculateEstimate());
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
      const tradeInData = {
        category: selectedCategory,
        categoryName: deviceCategories.find(cat => cat.id === selectedCategory)?.name,
        deviceInfo: {
          ...deviceInfo,
          baseValue: deviceCategories.find(cat => cat.id === selectedCategory)?.baseValue
        },
        contactInfo,
        estimatedValue,
        submittedAt: new Date().toISOString()
      };

      const response = await tradeInAPI.submit(tradeInData);
      
      if (response.success) {
        setSubmitSuccess(true);
        setTradeInReference(response.reference || 'TI-' + Date.now());
        setSnackbarOpen(true);
        // Move to success step or reset form
        setActiveStep(5); // Add a success step
      } else {
        setSubmitError(response.error || 'Failed to submit trade-in request. Please try again.');
      }
    } catch (error) {
      console.error('Trade-in submission error:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setActiveStep(0);
    setSelectedCategory('');
    setDeviceInfo({ brand: '', model: '', storage: '', condition: '', accessories: [] });
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
            <Typography variant="h6" gutterBottom>
              What type of device would you like to trade in?
            </Typography>
            {loadingCategories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {deviceCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={category.id}>
                      <TradeInCard
                        className={selectedCategory === category.id ? 'selected' : ''}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          <IconComponent sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            {category.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Starting from ${category.baseValue}
                          </Typography>
                          {category.count && (
                            <Chip 
                              label={`${category.count} items`} 
                              size="small" 
                              sx={{ mt: 1 }}
                              color="primary"
                              variant="outlined"
                            />
                          )}
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
            <Typography variant="h6" gutterBottom>
              Tell us about your {deviceCategories.find(cat => cat.id === selectedCategory)?.name}
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={deviceInfo.brand}
                    label="Brand"
                    onChange={(e) => setDeviceInfo({ ...deviceInfo, brand: e.target.value })}
                  >
                    {deviceBrands[selectedCategory]?.map((brand) => (
                      <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={deviceInfo.model}
                  onChange={(e) => setDeviceInfo({ ...deviceInfo, model: e.target.value })}
                  placeholder="e.g., iPhone 14 Pro, MacBook Air M2"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Storage/Memory"
                  value={deviceInfo.storage}
                  onChange={(e) => setDeviceInfo({ ...deviceInfo, storage: e.target.value })}
                  placeholder="e.g., 256GB, 16GB RAM"
                />
              </Grid>
            </Grid>
          </StepContent>
        );

      case 2:
        return (
          <StepContent>
            <Typography variant="h6" gutterBottom>
              What's the condition of your device?
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {conditionOptions.map((condition) => (
                <Grid item xs={12} key={condition.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: deviceInfo.condition === condition.value ? 2 : 1,
                      borderColor: deviceInfo.condition === condition.value ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => setDeviceInfo({ ...deviceInfo, condition: condition.value })}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">{condition.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
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
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  required
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  required
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
                />
              </Grid>
            </Grid>
          </StepContent>
        );

      case 4:
        return (
          <StepContent>
            <Typography variant="h6" gutterBottom>
              Your Trade-In Quote
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Card sx={{ p: 3, mb: 3, backgroundColor: 'success.light', color: 'success.contrastText' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AttachMoneyIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      ${estimatedValue}
                    </Typography>
                    <Typography variant="body1">
                      Estimated Trade-In Value
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              <Typography variant="h6" gutterBottom>
                Device Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Device"
                    secondary={`${deviceInfo.brand} ${deviceInfo.model}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Storage"
                    secondary={deviceInfo.storage}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Condition"
                    secondary={conditionOptions.find(c => c.value === deviceInfo.condition)?.label}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                What happens next?
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Free Device Inspection"
                    secondary="We'll verify the condition and finalize your quote"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalShippingIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Free Pickup Service"
                    secondary="We'll collect your device from your address"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Payment"
                    secondary="Get paid within 24 hours of device verification"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
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
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="success.main">
          Trade-In Request Submitted!
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Reference Number: <strong>{tradeInReference}</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your estimated trade-in value is <strong>${estimatedValue}</strong>
        </Typography>
        <Alert severity="success" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
          We've sent a confirmation email to <strong>{contactInfo.email}</strong>.
          Our team will contact you within 24 hours to arrange device inspection and pickup.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please keep your reference number for tracking your trade-in status.
        </Typography>
        <Button
          variant="contained"
          onClick={handleResetForm}
          size="large"
          sx={{ mt: 2 }}
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
      case 3: return contactInfo.name && contactInfo.email && contactInfo.phone && contactInfo.address;
      default: return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        {!submitSuccess ? (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                sx={{ mr: 1 }}
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
                  sx={{ px: 4 }}
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
    </Container>
  );
};

export default TradeInSection;