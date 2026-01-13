import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from "./style";
 

const CancelPage = () => {
  const location = useLocation();

  return (
    <>
      <SEOMeta
        title="Payment Cancelled | Xtrapush Gadgets"
        description="Your payment was cancelled. You can return to shopping or contact our support team."
        keywords="payment cancelled, checkout cancelled"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Payment Cancelled"
        ogDescription="Your payment was not completed"
        ogUrl={getCanonicalUrl(location.pathname)}
        robots="noindex, nofollow"
      />
    <div className="deep bg-primary w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          
          <section className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <div className="max-w-md mx-auto">
              {/* Cancel Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h1 className="text-white text-3xl md:text-4xl font-bold mb-4">
                Payment Cancelled
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                Your payment was cancelled. No charges have been made to your account.
              </p>

              <div className="space-y-4">
                <Link 
                  to="/gadgets" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Back to Shopping
                </Link>
                
                <Link 
                  to="/" 
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Go to Home
                </Link>
              </div>

              <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Need Help?</h3>
                <p className="text-gray-400 text-sm mb-3">
                  If you experienced any issues during checkout, please contact our support team.
                </p>
                <a 
                  href="mailto:conrad@itsxtrapush.com" 
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </section>

          
        </div>
      </div>
    </div>
    </>
  );
};

export default CancelPage;