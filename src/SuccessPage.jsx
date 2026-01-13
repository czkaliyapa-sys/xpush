import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import styles from "./style";
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';

const SuccessPage = () => {
  const [activeTitle, setActiveTitle] = useState('Success');
  const [toggle, setToggle] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionId = searchParams.get('session_id');

  return (
    <>
      <SEOMeta
        title="Payment Successful | Order Confirmed - Xtrapush Gadgets"
        description="Your payment has been processed successfully. Thank you for your purchase at Xtrapush Gadgets."
        keywords="payment success, order confirmed, purchase complete"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Payment Successful"
        ogDescription="Your order has been confirmed successfully"
        ogUrl={getCanonicalUrl(location.pathname)}
        robots="noindex, nofollow"
      />
    <div className="deep bg-primary w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          
          <section className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <div className="max-w-md mx-auto">
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-white text-3xl md:text-4xl font-bold mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                Thank you for your purchase. Your order has been confirmed.
              </p>

              {sessionId && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <p className="text-gray-400 text-sm mb-2">Order Reference:</p>
                  <p className="text-white font-mono text-sm break-all">{sessionId}</p>
                </div>
              )}

              <div className="space-y-4">
                <Link 
                  to="/dashboard" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Go to Dashboard
                </Link>
                
                <Link 
                  to="/gadgets" 
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Continue Shopping
                </Link>
              </div>

              <p className="text-gray-400 text-sm mt-8">
                You will receive a confirmation email shortly with your order details.
              </p>
            </div>
          </section>

          
        </div>
      </div>
    </div>
    </>
  );
};

export default SuccessPage;