import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { keyframes } from '@mui/system';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { GoogleIcon } from './CustomIcons.tsx';
import AppTheme from '../external_themes/shared-theme/AppTheme.tsx';
import SVGComponent from '../components/Logo.jsx';
import { auth, provider, signInWithPopup, checkDomainAuthorization } from '../firebase.jsx';
import { authAPI } from '../services/api.js';
// @ts-ignore
import { useAuth } from '../contexts/AuthContext.jsx';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

const ContentWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: '1400px',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(6),
  alignItems: 'center',
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: '1fr',
    maxWidth: '500px',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: 'calc(100% - 32px)',
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
  },
}));

const DarkCard = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(3),
  gap: theme.spacing(1.5),
  margin: 'auto',
  position: 'relative',
  zIndex: 1,
  maxWidth: '520px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    maxWidth: '100%',
  },
  background: 'rgba(30, 30, 30, 0.95)',
  color: '#fff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '& .MuiTextField-root': {
    '& .MuiOutlinedInput-root': {
      color: '#fff',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#48cedb',
      },
    },
    '& .MuiOutlinedInput-input::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
  },
  '& .MuiFormLabel-root': {
    color: 'rgba(255, 255, 255, 0.8)',
    '&.Mui-focused': {
      color: '#48cedb',
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
}));

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [googleSignupLoading, setGoogleSignupLoading] = React.useState(false);
  const navigate = useNavigate();
  const { hydrateBackendSession } = useAuth();

  const slides = [
    {
      icon: SecurityIcon,
      title: 'Device Protection',
      description: 'Comprehensive coverage for all your gadgets with instant claims and repairs'
    },
    {
      icon: PaymentIcon,
      title: 'Flexible Payment Plans',
      description: 'Buy now, pay later with our easy installment options tailored for you'
    },
    {
      icon: AutorenewIcon,
      title: 'Trade-In Program',
      description: 'Turn your old devices into value and upgrade to the latest technology'
    },
    {
      icon: LocalShippingIcon,
      title: 'Fast Delivery',
      description: 'Secure delivery you can trust, with speedy dispatch and careful handling'
    },
    {
      icon: CardGiftcardIcon,
      title: 'Exclusive Deals',
      description: 'Members-only discounts and early access to new product launches'
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const email = document.getElementById('email') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const phone = document.getElementById('phone') as HTMLInputElement;
    const passwordField = document.getElementById('password') as HTMLInputElement;

    if (!validateInputs()) {
      return;
    }

    try {
      // Validate password strength before backend call
      const passwordValidation = validatePasswordStrength(passwordField.value);
      if (!passwordValidation.isValid) {
        setPasswordError(true);
        setPasswordErrorMessage(passwordValidation.errors[0]);
        return;
      }
      
      // Prepare user data for backend-only registration
      const userData = {
        uid: crypto.randomUUID(),
        email: email.value,
        fullName: name.value,
        signupMethod: 'email_password',
        password: passwordField.value,
        photoURL: null
      };

      // Send to backend
      const response = await authAPI.register(userData);
      
      if (response && response.success) {
        // Persist backend session and hydrate context
        if (response?.user) {
          localStorage.setItem('backendUser', JSON.stringify(response.user));
          localStorage.setItem('backendSession', 'true');
          try { await hydrateBackendSession(response.user); } catch (e) { console.warn('Hydrate failed:', e); }
        }
        navigate('/dashboard');
      } else {
        throw new Error(response?.error || 'Failed to save user data');
      }
      
    } catch (error) {
      // Handle different types of errors with specific field targeting
      let errorMessage = 'Signup failed. Please try again.';

      if (typeof error === 'object' && error !== null) {
        const err: any = error;

        if (typeof err.code === 'string') {
          if (err.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists.';
            setEmailError(true);
            setEmailErrorMessage('Email already in use');
          } else if (err.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            setPasswordError(true);
            setPasswordErrorMessage('Password is too weak');
          } else if (err.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
            setEmailError(true);
            setEmailErrorMessage('Invalid email format');
          }
        } else if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
          
          const field = err.response.data.field;
          const existingMethod = err.response.data.existingSignupMethod;
          
          if (field === 'email') {
            setEmailError(true);
            
            if (existingMethod === 'google') {
              setEmailErrorMessage('Account exists with Google sign-in');
            } else if (existingMethod === 'email_password') {
              setEmailErrorMessage('Account exists with email/password');
            } else {
              setEmailErrorMessage(err.response.data.error);
            }
          } else if (field === 'password') {
            setPasswordError(true);
            setPasswordErrorMessage(err.response.data.error);
          }
        }
      }
      
      alert(errorMessage);
    }
  };

  // Basic form validation with field-specific error messaging
  const validateInputs = (): boolean => {
    // Reset previous errors
    setEmailError(false); setEmailErrorMessage('');
    setNameError(false); setNameErrorMessage('');
    setPasswordError(false); setPasswordErrorMessage('');
    setConfirmPasswordError(false); setConfirmPasswordErrorMessage('');

    const emailEl = document.getElementById('email') as HTMLInputElement | null;
    const nameEl = document.getElementById('name') as HTMLInputElement | null;
    const phoneEl = document.getElementById('phone') as HTMLInputElement | null;

    const emailVal = (emailEl?.value || '').trim();
    const nameVal = (nameEl?.value || '').trim();

    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setEmailError(true);
      setEmailErrorMessage(!emailVal ? 'Email is required' : 'Enter a valid email address');
      valid = false;
    }

    if (!nameVal || nameVal.length < 2) {
      setNameError(true);
      setNameErrorMessage(!nameVal ? 'Full name is required' : 'Name must be at least 2 characters');
      valid = false;
    }

    // Phone and address fields removed; collected during onboarding

    // Validate password and confirmation
    const pwValidation = validatePasswordStrength(password);
    if (!pwValidation.isValid) {
      setPasswordError(true);
      setPasswordErrorMessage(pwValidation.errors[0]);
      valid = false;
    }

    if (!confirmPassword || password !== confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage(!confirmPassword ? 'Please confirm your password' : 'Passwords do not match');
      valid = false;
    }

    return valid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline />
      <SignUpContainer>
        <ContentWrapper>
          <LeftPanel>
            <Box sx={{ textAlign: 'center', maxWidth: 550, position: 'relative', zIndex: 1 }}>
              <Box onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                <SVGComponent style={{ width: 'min(220px, 60vw)', height: 'auto', filter: 'brightness(0) invert(1)' }} />
              </Box>
              <Typography variant="h2" sx={{ 
                color: 'white', 
                fontWeight: 800, 
                mb: 6, 
                fontSize: { xs: '2.5rem', md: '3rem' }, 
                textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                minHeight: { xs: '3.5rem', md: '4rem' },
              }}>
                Start Your Journey
              </Typography>
              
              <Box sx={{ 
                position: 'relative', 
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {slides.map((slide, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      opacity: activeSlide === index ? 1 : 0,
                      transform: activeSlide === index ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
                      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: activeSlide === index ? 'auto' : 'none',
                      textAlign: 'center',
                    }}
                  >
                    <Box component={slide.icon} sx={{ 
                      fontSize: { xs: '4rem', md: '5rem' }, 
                      mb: 2, 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                    }} />
                    <Typography variant="h4" sx={{ 
                      color: 'white', 
                      fontWeight: 700, 
                      mb: 2, 
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                      {slide.title}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'rgba(255,255,255,0.95)', 
                      lineHeight: 1.7, 
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      textShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}>
                      {slide.description}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 4 }}>
                {slides.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    sx={{
                      width: activeSlide === index ? 32 : 12,
                      height: 12,
                      borderRadius: 6,
                      background: activeSlide === index ? 'white' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        background: 'white',
                        transform: 'scale(1.15)'
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </LeftPanel>

          <RightPanel>
            <DarkCard variant="outlined">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/signin')}
                  variant="text"
                  sx={{ color: '#48cedb', '&:hover': { background: 'rgba(72, 206, 219, 0.1)' } }}
                >
                  Back
                </Button>
              </Box>
              <Typography
                component="h1"
                variant="h5"
                sx={{ width: '100%', fontSize: 'clamp(1.3rem, 18vw, 1.4rem)', color: '#fff', textAlign: 'center', mb: 2 }}
              >
                Create Account
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  gap: 1.2,
                }}
              >
            <FormControl>
              <FormLabel htmlFor="email" sx={{ fontSize: '0.85rem', mb: 0.5 }}>Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                size="small"
                color={emailError ? 'error' : 'primary'}
                inputProps={{ 'aria-label': 'email' }}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="name" sx={{ fontSize: '0.85rem', mb: 0.5 }}>Full Name</FormLabel>
              <TextField
                error={nameError}
                helperText={nameErrorMessage}
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                autoComplete="name"
                required
                fullWidth
                variant="outlined"
                size="small"
                color={nameError ? 'error' : 'primary'}
                inputProps={{ 'aria-label': 'name' }}
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password" sx={{ fontSize: '0.85rem', mb: 0.5 }}>Password</FormLabel>
              </Box>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                size="small"
                color={passwordError ? 'error' : 'primary'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: '#48cedb' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Password Strength Indicator - Only show if password has been entered */}
              {password.length > 0 && (
                <PasswordStrengthIndicator 
                  password={password} 
                  confirmPassword={confirmPassword}
                  showConfirmMatch={confirmPassword.length > 0}
                />
              )}
            </FormControl>
            
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="confirmPassword" sx={{ fontSize: '0.85rem', mb: 0.5 }}>Confirm Password</FormLabel>
              </Box>
              <TextField
                error={confirmPasswordError}
                helperText={confirmPasswordErrorMessage}
                name="confirmPassword"
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                size="small"
                color={confirmPasswordError ? 'error' : 'primary'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: '#48cedb' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
        
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                background: 'linear-gradient(135deg, #48cedb 0%, #2da6b3 100%)',
                color: '#fff',
                fontWeight: 600,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #38b8cb 0%, #2190a0 100%)',
                  boxShadow: '0 4px 20px rgba(72, 206, 219, 0.4)'
                },
                mt: 1
              }}
            >
              Sign Up
            </Button>
            <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
              Already have an account?{' '}
              <span>
                <Link component={RouterLink} to="/signin" sx={{ color: '#48cedb', '&:hover': { color: '#5dd9e8' } }}>
                  Sign In
                </Link>
              </span>
            </Typography>
          </Box>
          <Divider sx={{ background: 'rgba(255,255,255,0.2)', my: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>or</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
  fullWidth
  variant="outlined"
  sx={{
    borderColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
    '&:hover': {
      borderColor: '#48cedb',
      background: 'rgba(72, 206, 219, 0.1)'
    }
  }}
  onClick={async () => {
    setGoogleSignupLoading(true);
    try {
      // Pre-check domain authorization
      const isDomainAuthorized = checkDomainAuthorization();
      if (!isDomainAuthorized) {
        if (window.location.hostname.includes('itsxtrapush.com')) {
          alert('Domain authorization error: itsxtrapush.com needs to be added to Firebase authorized domains. Please contact support.');
          setGoogleSignupLoading(false);
          return;
        }
      }
      
      const result = await signInWithPopup(auth, provider);
      
      // Register on backend; if conflict with email/password, auto-link
      try {
        const response = await authAPI.register({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          signupMethod: 'google',
          domain: window.location.hostname
        });
        if (response?.success && response?.user) {
          localStorage.setItem('backendUser', JSON.stringify(response.user));
          localStorage.setItem('backendSession', 'true');
          try { await hydrateBackendSession(response.user); } catch (e) { console.warn('Hydrate failed:', e); }
          navigate('/dashboard');
        }
      } catch (backendError: any) {
        console.warn('Backend signup failed:', backendError?.response?.data || backendError?.message);
        const existingMethod = backendError?.response?.data?.existingSignupMethod;
        if (existingMethod === 'email_password') {
          try {
            const linkResp = await authAPI.linkGoogle({
              email: String(result.user.email || ''),
              googleUid: String(result.user.uid),
              displayName: String(result.user.displayName || '')
            });
            if (linkResp?.success && linkResp?.user) {
              localStorage.setItem('backendUser', JSON.stringify(linkResp.user));
              localStorage.setItem('backendSession', 'true');
              try { await hydrateBackendSession(linkResp.user); } catch (e) { console.warn('Hydrate failed:', e); }
              navigate('/dashboard');
            } else {
              setGoogleSignupLoading(false);
              alert('An account with this email already exists. Please sign in instead.');
            }
          } catch (linkErr: any) {
            setGoogleSignupLoading(false);
            alert('An account with this email already exists with email/password. Please sign in with your email and password, then link Google in settings.');
          }
        } else {
          setGoogleSignupLoading(false);
          alert(backendError?.response?.data?.error || 'Sign-up failed. Please try again.');
        }
      }
    } catch (error) {
      setGoogleSignupLoading(false);
      console.error('Google Sign-Up Error:', error);
      
      // Safely narrow unknown error for code/message extraction
      let errorCode = 'unknown';
      let errMessage = 'Unknown error';
      if (typeof error === 'object' && error !== null) {
        const e: any = error;
        if (typeof e.code === 'string') errorCode = e.code;
        if (typeof e.message === 'string') errMessage = e.message;
      }
      
      console.error('Error context:', { code: errorCode, message: errMessage });
      
      // Enhanced error handling
      let errorMessage = 'Sign-up with Google failed. Please try again.';
      
      switch (errorCode) {
        case 'auth/internal-error':
          errorMessage = 'Authentication service error. This usually means the domain needs to be authorized in Firebase. Please contact support.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = `This domain is not authorized for Google sign-up. Please contact support.`;
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-up was cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Please enable pop-ups in your browser settings and try again.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account with this email already exists. Please sign in instead.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = errorCode === 'unknown' ? 'Sign-up failed. Please try again.' : `Sign-up failed: ${errMessage}`;
      }
      
      alert(errorMessage);
    }
  }}
      disabled={googleSignupLoading}
      startIcon={<GoogleIcon />}
    >
      {googleSignupLoading ? 'Signing up...' : 'Sign up with Google'}
    </Button>
            </Box>
            </DarkCard>
          </RightPanel>
        </ContentWrapper>
      </SignUpContainer>
    </AppTheme>
  );
}


type PasswordValidationResult = { isValid: boolean; errors: string[]; score: number };
function validatePasswordStrength(pw: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  if (pw.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else {
    score += 1;
  }
  if (/[A-Z]/.test(pw)) score += 1; else errors.push('Include at least one uppercase letter.');
  if (/[a-z]/.test(pw)) score += 1; else errors.push('Include at least one lowercase letter.');
  if (/[0-9]/.test(pw)) score += 1; else errors.push('Include at least one number.');
  if (/[^A-Za-z0-9]/.test(pw)) score += 1; else errors.push('Include at least one symbol.');
  return { isValid: errors.length === 0, errors, score };
}

function PasswordStrengthIndicator({ password, confirmPassword, showConfirmMatch = false }: { password: string; confirmPassword: string; showConfirmMatch?: boolean }) {
  const validation = validatePasswordStrength(password);
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const label = strengthLabels[Math.min(validation.score, strengthLabels.length - 1)];
  const mismatch = showConfirmMatch && !!confirmPassword && password !== confirmPassword;
  
  return (
    <Box sx={{ mt: 1 }}>
      {validation.isValid ? (
        <Typography variant="caption" sx={{ color: '#81c784', fontWeight: 500 }}>
          ✓ Password strength: {label}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {validation.errors.map((error, idx) => (
            <Typography key={idx} variant="caption" sx={{ color: '#e57373', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span style={{ fontSize: '0.9rem' }}>•</span> {error}
            </Typography>
          ))}
        </Box>
      )}
      {mismatch && (
        <Typography variant="caption" sx={{ color: '#e57373', display: 'block', mt: 0.5, fontWeight: 500 }}>
          ✗ Passwords do not match.
        </Typography>
      )}
    </Box>
  );
}
