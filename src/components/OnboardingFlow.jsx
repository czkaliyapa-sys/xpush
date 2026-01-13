import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Slide,
  IconButton,
  LinearProgress,
  Alert,
  Stack,
  CssBaseline
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import AppTheme from '../external_themes/shared-theme/AppTheme.tsx';
import { authAPI } from '../services/api.js';

const OnboardingContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  background: 'linear-gradient(135deg, #2da6b3 0%, #48cedb 50%, #1a8895 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(3),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    animation: 'pulse 8s ease-in-out infinite',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '80%',
    height: '80%',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    animation: 'float 15s ease-in-out infinite',
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.8 },
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
    '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
    '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
  },
}));

const StepCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 650,
  padding: theme.spacing(4),
  textAlign: 'center',
  borderRadius: 20,
  background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
  backdropFilter: 'blur(20px)',
  border: '2px solid rgba(45, 166, 179, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(45, 166, 179, 0.1)',
  color: '#ffffff',
  '& .MuiFormLabel-root': {
    color: '#b0b0b0',
    fontWeight: 600,
    fontSize: '0.95rem',
    '&.Mui-focused': {
      color: '#48cedb',
    }
  },
  '& .MuiTextField-root': {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      '& fieldset': {
        borderColor: '#404040',
      },
      '&:hover fieldset': {
        borderColor: '#2da6b3',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#48cedb',
        borderWidth: '2px',
      },
      '& input': {
        color: '#ffffff',
      },
      '& textarea': {
        color: '#ffffff',
      },
      '& input::placeholder': {
        color: '#606060',
        opacity: 1,
      },
      '& textarea::placeholder': {
        color: '#606060',
        opacity: 1,
      }
    }
  },
  '& .MuiFormHelperText-root': {
    color: '#808080',
    '&.Mui-error': {
      color: '#ff6b6b',
    }
  },
  '& .MuiTypography-root': {
    color: '#ffffff',
  },
  '& .MuiButton-contained': {
    background: 'linear-gradient(135deg, #2da6b3 0%, #48cedb 100%)',
    color: '#ffffff',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(45, 166, 179, 0.4)',
    '&:hover': {
      background: 'linear-gradient(135deg, #1a8895 0%, #2da6b3 100%)',
      boxShadow: '0 6px 16px rgba(45, 166, 179, 0.5)',
    },
    '&:disabled': {
      background: '#404040',
      color: '#808080'
    }
  },
  '& .MuiButton-outlined': {
    borderColor: 'rgba(45, 166, 179, 0.4)',
    color: '#48cedb',
    backgroundColor: 'transparent',
    '&:hover': {
      borderColor: '#48cedb',
      backgroundColor: 'rgba(45, 166, 179, 0.08)',
    }
  },
  '& .MuiAlert-root': {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    color: '#ff6b6b',
  },
}));

const StepIcon = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  background: 'linear-gradient(135deg, #2da6b3 0%, #48cedb 100%)',
  color: '#fff',
  fontSize: '32px',
  boxShadow: '0 8px 24px rgba(45, 166, 179, 0.4)',
  '& > svg': {
    fontSize: '32px'
  }
}));

const OnboardingFlow = ({ user, onComplete, disableCustomTheme }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    town: '',
    address: '',
    postcode: '',
    phone: '',
    dob: ''
  });
  const [phoneError, setPhoneError] = useState('');

  const steps = [
    {
      label: 'Location',
      icon: <LocationOnIcon />,
      title: 'Where should we deliver?',
      subtitle: 'Enter your town/city and delivery address'
    },
    {
      label: 'Postcode',
      icon: <LocationOnIcon />,
      title: 'What\'s your postcode?',
      subtitle: 'For accurate delivery estimates and shipping'
    },
    {
      label: 'Contact',
      icon: <PhoneIcon />,
      title: 'Your phone number',
      subtitle: 'We\'ll send order updates and delivery notifications via SMS'
    },
    {
      label: 'Complete',
      icon: <CheckCircleIcon />,
      title: 'You\'re all set!',
      subtitle: 'Welcome to XtraPush - start shopping now'
    }
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
    if (field === 'phone') setPhoneError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.town.trim().length > 0 && formData.address.trim().length > 0;
      case 1:
        return formData.postcode.trim().length > 0;
      case 2:
        {
          const val = formData.phone.trim();
          // Accept international format (+), local format (0), or any valid phone pattern
          const phoneRegex = /^[+\d\s()\-]{7,}$/;
          const ok = phoneRegex.test(val);
          if (!ok) {
            setPhoneError('Please enter a valid phone number');
          }
          return ok;
        }
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }

    if (currentStep < steps.length - 1) {
      setSlideDirection('left');
      setTimeout(() => setCurrentStep(prev => prev + 1), 100);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection('right');
      setTimeout(() => setCurrentStep(prev => prev - 1), 100);
    } else {
      // If on first step, ask user if they want to skip onboarding
      const confirmSkip = window.confirm('Do you want to skip the setup and go directly to dashboard?');
      if (confirmSkip) {
        onComplete(formData); // Complete with minimal data
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting user onboarding data...');
      
      // Register minimally so backend user exists, then let context persist full profile
      const registerPayload = {
        uid: user?.uid,
        email: formData.email,
        fullName: formData.fullName,
        signupMethod: 'google'
      };

      const response = await authAPI.register(registerPayload);

      if (response?.success) {
        const userData = {
          uid: user?.uid,
          email: formData.email,
          fullName: formData.fullName,
          town: formData.town,
          address: formData.address,
          postcode: formData.postcode,
          phone: formData.phone,
          photoURL: user?.photoURL || null
        };
        console.log('✅ User onboarding data saved successfully');
        onComplete(userData);
      } else {
        throw new Error(response?.error || 'Failed to save user data');
      }

    } catch (err) {
      console.error('❌ Onboarding submission failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Town/City"
              value={formData.town}
              onChange={handleInputChange('town')}
              margin="normal"
              required
              variant="outlined"
              disabled={loading}
              placeholder="e.g., London, Manchester, Birmingham"
            />
            <TextField
              fullWidth
              label="Delivery Address"
              value={formData.address}
              onChange={handleInputChange('address')}
              margin="normal"
              required
              variant="outlined"
              disabled={loading}
              multiline
              rows={2}
              placeholder="e.g., 123 High Street, Apartment 4B"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Postcode"
              value={formData.postcode}
              onChange={handleInputChange('postcode')}
              margin="normal"
              required
              variant="outlined"
              disabled={loading}
              placeholder="e.g., SW1A 1AA, M1 1AA"
              helperText="Enter your UK postcode for delivery"
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              margin="normal"
              required
              variant="outlined"
              disabled={loading}
              placeholder="e.g., +44 7911 123456 or 07911 123456"
              error={!!phoneError}
              helperText={phoneError || "For order updates and delivery notifications"}
            />
          </Box>
        );

      case 3:
        return null;  // Complete step - no form fields

      default:
        return null;
    }
  };

  return (
    <AppTheme disableCustomTheme={disableCustomTheme}>
      <CssBaseline />
      <OnboardingContainer direction="column" justifyContent="space-between">
        <StepCard>
          <CardContent>
            {/* Progress Stepper */}
            <Stepper activeStep={currentStep} sx={{ 
              mb: 4,
              '& .MuiStepLabel-label': {
                color: '#808080',
                fontWeight: 500,
                '&.Mui-active': {
                  color: '#48cedb',
                  fontWeight: 600
                },
                '&.Mui-completed': {
                  color: '#48cedb'
                }
              },
              '& .MuiStepIcon-root': {
                color: '#404040',
                '&.Mui-active': {
                  color: '#48cedb'
                },
                '&.Mui-completed': {
                  color: '#48cedb'
                }
              },
              '& .MuiStepConnector-line': {
                borderColor: '#404040'
              }
            }}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Progress Bar */}
            <LinearProgress 
              variant="determinate" 
              value={((currentStep + 1) / steps.length) * 100} 
              sx={{ 
                mb: 4, 
                borderRadius: 2, 
                height: 8,
                backgroundColor: 'rgba(45, 166, 179, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #2da6b3 0%, #48cedb 100%)',
                  borderRadius: 2,
                  boxShadow: '0 0 8px rgba(45, 166, 179, 0.5)'
                }
              }}
            />

            {/* Step Content */}
            <Slide direction={slideDirection} in={true} timeout={300}>
              <Box>
                <StepIcon>
                  {steps[currentStep].icon}
                </StepIcon>
                
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#ffffff', mb: 1 }}>
                  {steps[currentStep].title}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', color: '#b0b0b0' }}>
                  {steps[currentStep].subtitle}
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.95rem' }}>
                    {error}
                  </Alert>
                )}

                {renderStepContent(currentStep)}
              </Box>
            </Slide>

            {/* Navigation Buttons */}
            {currentStep < steps.length - 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 5 }}>
                <Button
                  onClick={handleBack}
                  disabled={loading}
                  startIcon={<ArrowBackIcon />}
                  variant="outlined"
                  size="large"
                  sx={{ px: 3 }}
                >
                  {currentStep === 0 ? 'Skip Setup' : 'Back'}
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  endIcon={currentStep === steps.length - 2 ? null : <ArrowForwardIcon />}
                  variant="contained"
                  size="large"
                  sx={{ px: 4 }}
                >
                  {loading ? 'Saving...' : currentStep === steps.length - 2 ? 'Complete Setup' : 'Next'}
                </Button>
              </Box>
            )}
          </CardContent>
        </StepCard>
      </OnboardingContainer>
    </AppTheme>
  );
};

export default OnboardingFlow;