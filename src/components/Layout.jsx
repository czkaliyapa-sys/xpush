import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../style';
import MainNav from '../MainNav.jsx';
import { Footer } from '../components';
import CookieConsent from 'react-cookie-consent';
import ChatBot from './ChatBot';

const deriveTitle = (pathname) => {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/gadgets')) return 'Gadgets';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/contact')) return 'Contact';
  if (pathname.startsWith('/warranty')) return 'Warranty';
  if (pathname.startsWith('/find-us')) return 'Find Us';
  if (pathname.startsWith('/properties')) return 'Properties';
  if (pathname.startsWith('/wishlist')) return 'Wishlist';
  if (pathname.startsWith('/help')) return 'Help';
  if (pathname.startsWith('/installment-policy')) return 'Installment Policy';
  return 'Xtrapush';
};

// Routes that should render without the global nav/footer chrome
const HIDE_CHROME_PREFIXES = ['/signin', '/signup', '/dashboard'];
const isChromeHidden = (pathname) => HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p));

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    try { window.scrollTo(0, 0); } catch {}
  }, [location.pathname, location.search]);
  return null;
}

const Layout = () => {
  const location = useLocation();
  const [toggle, setToggle] = useState(false);
  const title = deriveTitle(location.pathname);
  const hideChrome = isChromeHidden(location.pathname);

  return (
    <div className="deep bg-primary w-full overflow-hidden">
      <ScrollToTop />
      {!hideChrome && (
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <CookieConsent
            location="bottom"
            cookieName="userConsent"
            style={{ background: '#2B373B' }}
            buttonText="Accept"
            enableDeclineButton
            declineButtonText="Decline"
            buttonStyle={{ color: '#fff', fontSize: '16px', backgroundColor: '#48CEDB' }}
            declineButtonStyle={{ color: '#fff', fontSize: '16px', backgroundColor: '#6c757d' }}
            expires={365}
            onAccept={() => {
              try {
                localStorage.setItem('userConsent', 'granted');
                if (window.gtag) window.gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' });
              } catch {}
            }}
            onDecline={() => {
              try {
                localStorage.setItem('userConsent', 'denied');
                if (window.gtag) window.gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied' });
              } catch {}
            }}
          >
            This website uses cookies to enhance the user experience.
          </CookieConsent>
          <MainNav title={title} toggle={toggle} setToggle={setToggle} mobileOnTablet={true} />
        </div>
      </div>
      )}

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`${location.pathname}${location.search || ''}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {!hideChrome && (
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Footer />
        </div>
      </div>
      )}
      {location.pathname === '/' && <ChatBot />}
    </div>
  );
};

export default Layout;