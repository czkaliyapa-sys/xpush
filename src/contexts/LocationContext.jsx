import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    country: null,
    countryCode: null,
    currency: 'GBP',
    isInMalawi: false,
    // Alias maintained for legacy components (e.g., AboutPage)
    isMalawi: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        console.log('🔍 Starting location detection...');
        
        // First, try to get location from localStorage (cached)
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          console.log('📍 Using cached location data:', cached);
          const parsed = JSON.parse(cached);
          console.log('Cached location:', parsed);
          setLocation(prev => ({ ...prev, ...parsed, loading: false }));
          return;
        }

        console.log('⏳ No cache found, fetching fresh location...');

        // Try multiple geolocation services for redundancy
        let result = null;

        // Method 1: geojs.io (reliable, no rate limiting, CORS-friendly)
        try {
          console.log('📡 Trying geojs.io method 1...');
          const response = await fetch('https://get.geojs.io/v1/ip/country.json', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('✅ geojs.io method 1 success:', data);
            result = {
              country: data.country,
              countryCode: data.ip_as, // geojs returns country code in different format
            };
            // For geojs, we need to fetch country code separately or use the country name
            // Let's use a fallback approach
            if (!result.countryCode) {
              // Fetch country code using another call
              try {
                console.log('📡 Trying geojs.io method 2 (geo endpoint)...');
                const codeResponse = await fetch('https://get.geojs.io/v1/ip/geo.json', {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                });
                if (codeResponse.ok) {
                  const geoData = await codeResponse.json();
                  console.log('✅ geojs.io method 2 success:', geoData);
                  result.countryCode = geoData.country_code || '';
                  result.country = geoData.country_name || result.country;
                }
              } catch (err) {
                console.warn('❌ geojs geo fetch failed:', err);
              }
            }
          }
        } catch (err) {
          console.warn('❌ geojs.io method 1 failed:', err);
        }

        // Method 2: Fallback to cloudflare (very reliable)
        if (!result) {
          try {
            console.log('📡 Trying Cloudflare trace method...');
            const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
              method: 'GET',
              headers: { 'Accept': 'text/plain' },
            });
            if (response.ok) {
              const text = await response.text();
              console.log('✅ Cloudflare trace success:', text);
              // Parse cloudflare trace format: key=value pairs
              const lines = text.split('\n');
              let countryCode = '';
              for (const line of lines) {
                if (line.startsWith('loc=')) {
                  countryCode = line.substring(4).trim();
                  break;
                }
              }
              if (countryCode) {
                result = {
                  country: countryCode,
                  countryCode: countryCode,
                };
              }
            }
          } catch (err) {
            console.warn('Cloudflare trace failed:', err);
          }
        }

        // Method 3: Fallback to ipapi.co (if above fails)
        if (!result) {
          try {
            console.log('📡 Trying ipapi.co method...');
            const response = await fetch('https://ipapi.co/json/', {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
              const data = await response.json();
              console.log('✅ ipapi.co success:', data);
              result = {
                country: data.country_name,
                countryCode: data.country_code,
              };
            }
          } catch (err) {
            console.warn('❌ ipapi.co failed:', err);
          }
        }

        if (!result) {
          console.error('❌ All location detection methods failed!');
          throw new Error('Unable to detect location from any service');
        }

        console.log('🎯 Location result:', result);
        const isInMalawi = result.countryCode === 'MW';
        const currency = isInMalawi ? 'MWK' : 'GBP';

        const locationData = {
          country: result.country,
          countryCode: result.countryCode,
          currency,
          isInMalawi,
          isMalawi: isInMalawi,
          loading: false,
          error: null,
        };

        // Log detected location to console
        console.log('✅✅✅ Location detected successfully!');
        console.log('   Country:', locationData.country);
        console.log('   Country Code:', locationData.countryCode);
        console.log('   Currency:', locationData.currency);
        console.log('   Is In Malawi:', locationData.isInMalawi);
        console.log('   Full Data:', locationData);

        setLocation(locationData);
        
        // Cache for 24 hours
        const cacheData = {
          ...locationData,
          cachedAt: new Date().toISOString(),
        };
        localStorage.setItem('userLocation', JSON.stringify(cacheData));
      } catch (err) {
        console.error('❌❌❌ Location detection failed:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);

        // Default to GBP if detection fails
        setLocation(prev => ({
          ...prev,
          currency: 'GBP',
          isInMalawi: false,
          isMalawi: false,
          loading: false,
          error: err.message,
        }));
      }
    };

    detectLocation();
  }, []);

  const updateLocation = (newLocation) => {
    const normalized = {
      ...newLocation,
      isMalawi: typeof newLocation.isMalawi === 'boolean' ? newLocation.isMalawi : !!newLocation.isInMalawi,
      isInMalawi: typeof newLocation.isInMalawi === 'boolean' ? newLocation.isInMalawi : !!newLocation.isMalawi,
    };
    setLocation(normalized);
    localStorage.setItem('userLocation', JSON.stringify(normalized));
  };

  return (
    <LocationContext.Provider value={{ location, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  // Spread location properties for easier access
  const loc = context.location || {};
  return {
    ...loc,
    // Ensure both flags are always available
    isMalawi: typeof loc.isMalawi === 'boolean' ? loc.isMalawi : !!loc.isInMalawi,
    isInMalawi: typeof loc.isInMalawi === 'boolean' ? loc.isInMalawi : !!loc.isMalawi,
    updateLocation: context.updateLocation,
  };
};
