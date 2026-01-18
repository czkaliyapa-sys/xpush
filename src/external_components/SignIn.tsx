import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { keyframes } from '@mui/system';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
// @ts-ignore
import ForgotPassword from './ForgotPassword.tsx';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// @ts-ignore
import { GoogleIcon } from './CustomIcons.tsx';
import AppTheme from '../external_themes/shared-theme/AppTheme.tsx';
import SVGComponent from '../components/Logo.jsx';
import { auth, provider, signInWithPopup, checkDomainAuthorization } from '../firebase.jsx';
import { signOut } from 'firebase/auth';
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SignInContainer = styled(Stack)(({ theme }) => ({
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
}));

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [displayedHeaderText, setDisplayedHeaderText] = React.useState('');
  const [displayedSloganText, setDisplayedSloganText] = React.useState('');
  const [googleSigninLoading, setGoogleSigninLoading] = React.useState(false);
  const navigate = useNavigate();
  const { hydrateBackendSession } = useAuth();

  const headerText = 'Welcome Back!';

  // Typing animation effect for header (once)
  React.useEffect(() => {
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < headerText.length) {
        currentIndex++;
        setDisplayedHeaderText(headerText.slice(0, currentIndex));
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  const sloganText = 'A little push to get you there';

  // Typing animation effect for slogan (mobile)
  React.useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= sloganText.length) {
        setDisplayedSloganText(sloganText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80); // 80ms per character

    return () => clearInterval(typingInterval);
  }, []);

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

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    if (!validateInputs()) {
      return;
    }

    try {
      console.log('🔄 Attempting sign in with backend (email/password) ...');
      
      // Backend-first login attempt
      try {
        const backendResponse = await authAPI.login({
          email: email.value,
          password: password.value
        });
        
        console.log('✅ Backend login response:', backendResponse);
        
        if (backendResponse?.success) {
          // Persist backend session for AuthContext consumption
          localStorage.setItem('backendUser', JSON.stringify(backendResponse.user));
          localStorage.setItem('backendSession', 'true');
          
          // Special admin handling if provided
          if (backendResponse?.accountType === 'admin' || backendResponse?.bypassFirebase) {
            localStorage.setItem('adminUser', JSON.stringify(backendResponse.user));
            localStorage.setItem('adminSession', 'true');
          }
          
          // Immediately hydrate AuthContext to reflect admin role without refresh
          try {
            await hydrateBackendSession(backendResponse.user);
          } catch (e) {
            console.warn('Failed to hydrate backend session in context:', e);
          }

          console.log('🏠 Backend authentication complete - redirecting to dashboard...');
          navigate('/dashboard');
          return;
        }
      } catch (backendError: any) {
        console.log('⚠️ Backend login failed, evaluating error...', backendError?.response?.data);
        
        const data = backendError?.response?.data;
        if (backendError?.response?.status === 401) {
          if (data?.errorType === 'user_not_found') {
            setEmailError(true);
            setEmailErrorMessage('No account found with this email address');
            alert('No account found with this email address. Please sign up first.');
            return;
          }
          if (data?.errorType === 'password_not_set') {
            setPasswordError(true);
            setPasswordErrorMessage('No password set for this account. Please create a new one.');
            setOpen(true);
            return;
          }
          if (data?.errorType === 'invalid_password') {
            setPasswordError(true);
            setPasswordErrorMessage(data?.accountType === 'admin' ? 'Invalid admin password' : 'Invalid password');
            setOpen(true);
            return;
          }
        }
        
        if (data?.errorType === 'wrong_signup_method') {
          const signupMethod = data?.signupMethod;
          if (signupMethod === 'google') {
            const errorMessage = 'This account was created with Google sign-in. Please use "Sign in with Google" instead.';
            setPasswordError(true);
            setPasswordErrorMessage('Use Google sign-in');
            setEmailError(true);
            setEmailErrorMessage('Google account detected');
            alert(errorMessage);
            return;
          }
        }
        
        // Do not fallback to Firebase; enforce backend DB auth only
        console.log('⛔ No Firebase fallback. Enforcing DB-only login.');
        setPasswordError(true);
        setPasswordErrorMessage('Login failed. Please check your credentials.');
        return;
      }
    } catch (error: any) {
      console.error('❌ Sign-in error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Sign-in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          setEmailError(true);
          setEmailErrorMessage('Email not found');
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          setPasswordError(true);
          setPasswordErrorMessage('Incorrect password');
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          setEmailError(true);
          setEmailErrorMessage('Invalid email format');
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          setPasswordError(true);
          setPasswordErrorMessage('Account temporarily locked');
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          setEmailError(true);
          setPasswordError(true);
          setEmailErrorMessage('Invalid credentials');
          setPasswordErrorMessage('Invalid credentials');
          break;
        default:
          // Generic error - could be wrong password or email
          setEmailError(true);
          setPasswordError(true);
          setEmailErrorMessage('Invalid email or password');
          setPasswordErrorMessage('Invalid email or password');
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      }
      
      // Show user-friendly error message
      alert(errorMessage);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;

    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline />
      <SignInContainer>
        {/* Floating decorative elements */}
        <Box sx={{ position: 'absolute', top: 60, left: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', animation: 'float 6s ease-in-out infinite', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: 80, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', animation: 'float 8s ease-in-out infinite reverse', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: '50%', left: 100, width: 60, height: 60, borderRadius: '30%', background: 'rgba(255,255,255,0.09)', animation: 'float 10s ease-in-out infinite', transform: 'rotate(45deg)', zIndex: 0 }} />
        
        <ContentWrapper>
          {/* Left Side - Branding & Features */}
          <Box sx={{ 
            display: { xs: 'none', lg: 'block' },
            textAlign: 'center'
          }}>
            {/* Logo */}
            <Box 
              onClick={() => navigate('/')}
              sx={{ 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 4,
                filter: 'brightness(0) invert(1)'
              }}
            >
              <SVGComponent style={{ width: '280px', height: 'auto' }} />
            </Box>
            
            {/* Header */}
            <Typography variant="h2" sx={{ 
              color: 'white', 
              fontWeight: 800, 
              mb: 6, 
              fontSize: { xs: '2.5rem', md: '3rem' }, 
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minHeight: { xs: '3.5rem', md: '4rem' },
            }}>
              {displayedHeaderText}
            </Typography>

            {/* Feature Carousel */}
            <Box sx={{ 
              position: 'relative', 
              minHeight: 280,
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

            {/* Carousel dots */}
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

          {/* Right Side - Sign In Form */}
          <Box>
            {/* Mobile Logo */}
            <Box 
              onClick={() => navigate('/')}
              sx={{ 
                cursor: 'pointer', 
                display: { xs: 'flex', lg: 'none' }, 
                justifyContent: 'center',
                mb: 3,
                filter: 'brightness(0) invert(1)'
              }}
            >
              <SVGComponent style={{ width: '180px', height: 'auto' }} />
            </Box>

            {/* Mobile Slogan */}
            <Typography variant="h5" sx={{ 
              display: { xs: 'block', lg: 'none' },
              color: 'white', 
              textAlign: 'center',
              mb: 4,
              fontSize: '1.1rem',
              fontWeight: 300,
              minHeight: '2rem',
              '&::after': {
                content: '"|"',
                marginLeft: '4px',
                animation: 'blink 1s step-end infinite',
                opacity: displayedSloganText.length < sloganText.length ? 1 : 0
              },
              '@keyframes blink': {
                '50%': { opacity: 0 }
              }
            }}>
              {displayedSloganText}
            </Typography>

        <Card variant="outlined" sx={{
          background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(45, 166, 179, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(45, 166, 179, 0.1)',
          color: '#ffffff',
          '& .MuiFormLabel-root': {
            color: '#b0b0b0',
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
              '& input::placeholder': {
                color: '#606060',
                opacity: 1,
              }
            }
          },
          '& .MuiTypography-root': {
            color: '#ffffff',
          },
          '& .MuiLink-root': {
            color: '#48cedb',
            '&:hover': {
              color: '#2da6b3',
            }
          },
          '& .MuiCheckbox-root': {
            color: '#48cedb',
            '&.Mui-checked': {
              color: '#48cedb',
            }
          },
          '& .MuiFormControlLabel-label': {
            color: '#b0b0b0',
          },
          '& .MuiButton-contained': {
            background: 'linear-gradient(135deg, #2da6b3 0%, #48cedb 100%)',
            color: '#ffffff',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(45, 166, 179, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1a8895 0%, #2da6b3 100%)',
              boxShadow: '0 6px 16px rgba(45, 166, 179, 0.5)',
            }
          },
          '& .MuiButton-outlined': {
            borderColor: '#404040',
            color: '#ffffff',
            backgroundColor: '#0a0a0a',
            '&:hover': {
              borderColor: '#48cedb',
              backgroundColor: 'rgba(45, 166, 179, 0.08)',
            }
          },
          '& .MuiDivider-root': {
            borderColor: '#404040',
            color: '#808080',
            '&::before, &::after': {
              borderColor: '#404040',
            }
          },
          '& .MuiIconButton-root': {
            color: '#b0b0b0',
            '&:hover': {
              color: '#48cedb',
            }
          }
        }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2rem)', textAlign: 'center', fontWeight: 700 }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
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
                color={emailError ? 'error' : 'primary'}
                sx={{ ariaLabel: 'email' }}
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Link
                  component="button"
                  type="button"
                  onClick={handleClickOpen}
                  variant="body2"
                  sx={{ alignSelf: 'baseline' }}
                >
                  Forgot your password?
                </Link>
              </Box>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <ForgotPassword open={open} handleClose={handleClose} initialEmail={(document.getElementById('email') as HTMLInputElement)?.value || ''} />
            <Button
              type="submit"
              fullWidth
              variant="contained"
        
            >
              Sign in
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <span>
                <Link
                  component={RouterLink} to="/signup"
                  variant="body2"
                  sx={{ alignSelf: 'center' }}
                >
                  Sign up
                </Link>
              </span>
            </Typography>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
  fullWidth
  variant="outlined"
  onClick={async () => {
    setGoogleSigninLoading(true);
    try {
      console.log('🔄 Initiating Google Sign-In...');
      
      const isDomainAuthorized = checkDomainAuthorization();
      if (!isDomainAuthorized) {
        console.warn('⚠️ Domain authorization check failed - proceeding anyway for production');
      }
      
      const customProvider = provider;
      
      console.log('🔐 Starting Google OAuth popup...');
      const result = await signInWithPopup(auth, customProvider);
      const user = result.user;
      
      console.log('✅ Google Sign-In Successful:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        domain: window.location.hostname
      });
      
      // Register on backend; if conflict with email/password, auto-link
      try {
        console.log('📡 Registering/Syncing Google account with backend...');
        const response = await authAPI.register({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          signupMethod: 'google',
          domain: window.location.hostname
        });
        console.log('✅ Backend Google registration successful');
        if (response?.success && response?.user) {
          localStorage.setItem('backendUser', JSON.stringify(response.user));
          localStorage.setItem('backendSession', 'true');
          try { await hydrateBackendSession(response.user); } catch (e) { console.warn('Hydrate failed:', e); }
          navigate('/dashboard');
        }
      } catch (backendError: any) {
        console.warn('⚠️ Backend registration failed:', backendError?.response?.data || backendError?.message);
        const existingMethod = backendError?.response?.data?.existingSignupMethod;
        if (existingMethod === 'email_password') {
          console.log('🔗 Existing email/password account detected — attempting auto-link');
          try {
            const linkResp = await authAPI.linkGoogle({
              email: String(user.email || ''),
              googleUid: String(user.uid),
              displayName: String(user.displayName || '')
            });
            if (linkResp?.success && linkResp?.user) {
              console.log('✅ Google account linked to existing email/password user');
              localStorage.setItem('backendUser', JSON.stringify(linkResp.user));
              localStorage.setItem('backendSession', 'true');
              try { await hydrateBackendSession(linkResp.user); } catch (e) { console.warn('Hydrate failed:', e); }
              navigate('/dashboard');
            } else {
              setGoogleSigninLoading(false);
              alert('An account with this email already exists. Please sign in with your email and password, then link Google in your account settings.');
              await signOut(auth);
            }
          } catch (linkErr: any) {
            setGoogleSigninLoading(false);
            console.error('❌ Linking failed:', linkErr?.response?.data || linkErr?.message);
            alert('An account with this email already exists. Please sign in with your email and password, then link Google in your account settings.');
            await signOut(auth);
          }
        } else {
          console.warn('Proceeding without backend session due to non-linkable error');
          navigate('/dashboard');
        }
      }
      
    } catch (error: unknown) {
      setGoogleSigninLoading(false);
      console.error('❌ Google Sign-In Error:', error);
      
      let errorCode = 'unknown';
      let errMessage = 'Unknown error';
      if (typeof error === 'object' && error !== null) {
        const e: any = error;
        if (typeof e.code === 'string') errorCode = e.code;
        if (typeof e.message === 'string') errMessage = e.message;
      }
      
      console.error('📝 Full error context:', {
        code: errorCode,
        message: errMessage,
        domain: window.location.hostname
      });
      
      let errorMessage = 'Sign-in with Google failed. Please try again.';
      
      switch (errorCode) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Please enable pop-ups in your browser settings and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact support.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account with this email exists with a different sign-in method. Try signing in with email/password instead.';
          break;
        case 'auth/internal-error':
          errorMessage = 'Internal authentication error. Please try again or contact support.';
          break;
        default:
          errorMessage = errorCode === 'unknown' ? 'Sign-in failed. Please try again.' : `Authentication failed: ${errMessage}`;
      }
      
      alert(errorMessage);
    }
  }}
  disabled={googleSigninLoading}
  startIcon={<GoogleIcon />}
>
              {googleSigninLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </Box>
        </Card>
          </Box>
        </ContentWrapper>
      </SignInContainer>
    </AppTheme>
  );
}
