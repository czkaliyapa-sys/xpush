// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeqrUGuvzlhrEUejZ58Aygq4V34aP0AAg",
  authDomain: "xtrapush-gadgets.firebaseapp.com",
  projectId: "xtrapush-gadgets",
  storageBucket: "xtrapush-gadgets.firebasestorage.app",
  messagingSenderId: "297389749121",
  appId: "1:297389749121:web:fa9b2a33a67f71dcb9ae80",
  measurementId: "G-0GH72ZPFX5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment and production
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure provider for optimal production deployment
provider.addScope('email');
provider.addScope('profile');

// Enhanced configuration for production deployment
if (typeof window !== 'undefined') {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = window.location.hostname === 'itsxtrapush.com' || window.location.hostname === 'www.itsxtrapush.com';
  
  if (isProduction) {
    console.log('🎆 Production environment detected - configuring Google Auth for itsxtrapush.com');
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true'
    });
  } else if (isDevelopment) {
    console.log('🛠️ Development environment detected');
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true'
    });
  } else {
    // Fallback for other environments
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online'
    });
  }
}

// Enhanced domain verification with detailed production support
const checkDomainAuthorization = () => {
  const currentDomain = window.location.hostname;
  const currentOrigin = window.location.origin;
  
  const authorizedDomains = [
    'localhost',
    '127.0.0.1',
    'itsxtrapush.com',
    'www.itsxtrapush.com',
    'xtrapush-gadgets.firebaseapp.com'
  ];
  
  const authorizedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://itsxtrapush.com',
    'https://www.itsxtrapush.com',
    'https://xtrapush-gadgets.firebaseapp.com'
  ];
  
  console.log('🌍 Firebase Domain Check:', {
    currentDomain,
    currentOrigin,
    isAuthorized: authorizedDomains.includes(currentDomain)
  });
  
  const isDomainAuthorized = authorizedDomains.includes(currentDomain);
  const isOriginAuthorized = authorizedOrigins.includes(currentOrigin);
  
  if (!isDomainAuthorized) {
    console.error('❗ CRITICAL: Domain not authorized in Firebase!');
    console.error('📝 Required Action: Add this domain to Firebase Console:');
    console.error('   1. Go to https://console.firebase.google.com/');
    console.error('   2. Select your project: xtrapush-gadgets');
    console.error('   3. Go to Authentication → Settings → Authorized domains');
    console.error(`   4. Add domain: ${currentDomain}`);
    console.error(`   5. Add origin: ${currentOrigin}`);
    
    // Show user-friendly error for production
    if (currentDomain === 'itsxtrapush.com' || currentDomain === 'www.itsxtrapush.com') {
      console.error('😱 Production domain authorization missing!');
    }
  }
  
  return isDomainAuthorized && isOriginAuthorized;
};

// Initialize domain check on load
if (typeof window !== 'undefined') {
  // Run domain check after a brief delay to ensure DOM is ready
  setTimeout(() => {
    checkDomainAuthorization();
  }, 100);
}

export { auth, provider, signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword, analytics, checkDomainAuthorization };
