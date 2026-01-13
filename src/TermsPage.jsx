import React, { useState, useEffect } from 'react';
import TermsPolicy from './components/TermsPolicy';
import { useMediaQuery } from '@mui/material';
import { useLocation } from 'react-router-dom';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from './style';
 

const TermsPage = () => {
  const location = useLocation();
  const [activeTitle, setActiveTitle] = useState('');
  const isMobile = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    document.title = 'Terms & Conditions | Xtrapush Gadgets';
  }, []);

  return (
    <>
      <SEOMeta
        title="Terms & Conditions | Xtrapush Gadgets"
        description="Read our complete terms and conditions for using Xtrapush Gadgets online shopping platform. Learn about our policies and user agreements."
        keywords="terms and conditions, legal, policies, user agreement, Xtrapush Gadgets"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Terms & Conditions"
        ogDescription="Xtrapush Gadgets Terms & Conditions"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
      <div className="deep w-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #051323 0%, #081c2f 100%)' }}>
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          
          <section className="flex flex-col items-center text-center p-12">
            <TermsPolicy />
          </section>
          
          
        </div>
      </div>
    </div>
    </>
  );
};

export default TermsPage;
