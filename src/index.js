import React, { useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
// Route transitions are handled inside Layout via AnimatePresence
import { StyledEngineProvider } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WishlistProvider } from './contexts/WishlistContext.jsx';
import { LocationProvider } from './contexts/LocationContext.jsx';
import OnboardingWrapper from './components/OnboardingWrapper.jsx';
import analytics from './utils/analytics';
import { RequireAuth } from './components/RouteGuards.jsx';
import Layout from './components/Layout.jsx';

const SignIn = React.lazy(() => import('./external_components/SignIn.tsx'));
const GadgetsPage = React.lazy(() => import('./GadgetsPage.jsx'));
const PropertiesPage = React.lazy(() => import('./PropertiesPage.jsx'));
const ContactPage = React.lazy(() => import('./ContactPage.jsx'));
const TermsPage = React.lazy(() => import('./TermsPage.jsx'));
const Help = React.lazy(() => import('./Help.jsx'));
const SignUp = React.lazy(() => import('./external_components/Signup.tsx'));
const GadgetDetail = React.lazy(() => import('./GadgetDetail.jsx'));
// import FashionDetail from './FashionDetail.jsx';
const DashboardPage = React.lazy(() => import('./Dashboard.jsx'));
const PaymentSuccess = React.lazy(() => import('./components/PaymentSuccess.jsx'));
const PaymentCancel = React.lazy(() => import('./components/PaymentCancel.jsx'));
const TestPage = React.lazy(() => import('./TestPage.jsx'));
const InstallmentPolicy = React.lazy(() => import('./InstallmentPolicy.jsx'));
const FindUsPage = React.lazy(() => import('./FindUsPage.jsx'));
const WishlistPage = React.lazy(() => import('./WishlistPage.jsx'));
const AboutPage = React.lazy(() => import('./AboutPage.jsx'));
const TradeInPage = React.lazy(() => import('./TradeInPage.jsx'));


function AnimatedRoutes() {
  const location = useLocation();
  
  // Track page views on route changes using improved analytics utility
  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;
    const title = document.title;
    
    // Track page view with better analytics utility
    analytics.trackPageView(path, title);
    
    // Log for debugging
    console.log('📍 Page tracked:', path, title);
  }, [location.pathname, location.search]);
  
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading…</div>}>
      <Routes location={location} key={location.key}>
        <Route element={<Layout />}> 
          <Route index element={<App />} />  {/* Home page route */}
          <Route path="/signin"  element={<SignIn />} />
          <Route path="/dashboard/*" element={
            <RequireAuth>
              <OnboardingWrapper>
                <DashboardPage />
              </OnboardingWrapper>
            </RequireAuth>
          } />
          <Route path="/signup"  element={<SignUp />} />
          <Route path="/test"  element={<TestPage />} />
          { /* Removed Finance and Fashion routes as requested */ }
          
          {/* SEO-friendly category routes */}
          <Route path="/smartphones" element={<GadgetsPage category="smartphone" />} />
          <Route path="/laptops" element={<GadgetsPage category="laptop" />} />
          <Route path="/gaming" element={<GadgetsPage category="gaming" />} />
          <Route path="/accessories" element={<GadgetsPage category="accessories" />} />
          <Route path="/tablets" element={<GadgetsPage category="tablet" />} />
          <Route path="/smart-watches" element={<GadgetsPage category="watch" />} />
          
          {/* General gadgets route */}
          <Route path="/gadgets"  element={<GadgetsPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/find-us" element={<FindUsPage />} />
          <Route path="/installment-policy" element={<InstallmentPolicy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/trade-in" element={<TradeInPage />} />
          <Route path="/contact"  element={<ContactPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          
          {/* SEO-friendly gadget detail routes: /gadgets/category/product-name-id */}
          <Route path="/gadgets/:category/:slug" element={<GadgetDetail />} />
          {/* Fallback for older route format */}
          <Route path="/gadgets/:id" element={<GadgetDetail />} />
          
          { /* Removed Fashion detail route since Fashion page is not needed */ }
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HelmetProvider>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <WishlistProvider>
              <BrowserRouter>
                <AnimatedRoutes />
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </StyledEngineProvider>
  </HelmetProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
