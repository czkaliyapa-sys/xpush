import React from 'react';
import { useLocation } from '../contexts/LocationContext';
import { usePricing } from '../hooks/usePricing';

/**
 * Example component showing how to use location-based pricing
 */
const PricingExample = ({ priceInGbp }) => {
  const { location } = useLocation();
  const { formatLocalPrice, formatLocalPriceCompact, currency, isInMalawi } = usePricing();

  return (
    <div>
      <h3>Pricing Example</h3>
      
      {location.loading ? (
        <p>Detecting location...</p>
      ) : (
        <>
          <p>
            Country: <strong>{location.country}</strong> ({location.countryCode})
          </p>
          <p>
            Currency: <strong>{currency}</strong>
            {isInMalawi && <span> 🇲🇼</span>}
          </p>
          
          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <p>Original Price (GBP): <strong>£{priceInGbp.toFixed(2)}</strong></p>
            <p>Price in Local Currency: <strong>{formatLocalPrice(priceInGbp)}</strong></p>
            <p>Compact Format: <strong>{formatLocalPriceCompact(priceInGbp)}</strong></p>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingExample;
