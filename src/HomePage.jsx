import React from 'react';
import styles from './style';
import { Billing, Business, CardDeal, Stats, Testimonials, Hero, Clients, EbayTrust } from './components';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeSearchBar from './external_components/HomeSearchBar';
import RecommendedGadgetsShowcase from './external_components/RecommendedGadgetsShowcase';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/gadgets?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <>
      <SEOMeta
        title="Buy Gadgets Online with Flexible Installments | Xtrapush Gadgets"
        description="Shop the latest smartphones, laptops, gaming devices and accessories with flexible installment plans. Best deals on gadgets in Malawi."
        keywords="gadgets, smartphones, laptops, gaming, online shopping, Malawi, installments"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Xtrapush Gadgets - Best Gadgets Deals"
        ogDescription="Discover amazing deals on gadgets with installment payment options"
        ogImage="https://itsxtrapush.com/logo512.png"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
      <div className="bg-primary w-full overflow-hidden">
      <div className={`bg-primary ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <div className="px-2 sm:px-4 py-2 sm:py-4 mb-6 sm:mb-8">
          <HomeSearchBar onSearch={handleSearch} />
          </div>
          <Hero />
        </div>
      </div>
      
      <div className={`bg-primary ${styles.paddingX} ${styles.flexCenter}`}>
         <div className={`${styles.boxWidth}`}>
           {/* <Stats /> */}
           <Business />
           <Billing />
           <CardDeal />
           <Testimonials />
           <Clients />
           <EbayTrust />
           
           {/* Featured Gadgets Showcase */}
           <div style={{ marginTop: '60px', marginBottom: '60px' }}>
             <RecommendedGadgetsShowcase />
           </div>
         </div>
       </div>
    </div>
    </>
  );
};

export default HomePage;