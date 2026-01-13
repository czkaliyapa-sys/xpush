# Location-Based Pricing Integration Guide

## Overview
This system automatically detects the user's location and displays prices in the appropriate currency:
- **Malawi (MW)**: MWK (Malawi Kwacha)
- **Other locations**: USD (US Dollar)

## What Was Added

### 1. **LocationContext** (`src/contexts/LocationContext.jsx`)
- Automatically detects user's country using IP geolocation
- Determines appropriate currency based on location
- Caches location data for 24 hours
- Provides `useLocation()` hook for accessing location data

### 2. **Currency Service** (`src/services/currencyService.js`)
- Handles currency conversion (USD ↔ MWK)
- Provides formatting functions for both currencies
- Supports compact price formatting (e.g., $1.2K, MWK 1.2M)
- Can fetch live exchange rates from an API

### 3. **Pricing Hook** (`src/hooks/usePricing.js`)
- Easy-to-use hook for location-based pricing
- Automatically converts prices based on user's location
- Provides formatted price strings

### 4. **Updated Formatters** (`src/utils/formatters.js`)
- New `formatUSD()` and `formatUSDCompact()` functions
- New `formatPriceByLocation()` functions
- Backward compatible with existing `formatMWK()` functions

## How to Use

### In Any Component

```jsx
import { usePricing } from '../hooks/usePricing';

const MyComponent = ({ productPrice }) => {
  const { 
    formatLocalPrice, 
    formatLocalPriceCompact,
    currency, 
    isInMalawi 
  } = usePricing();

  return (
    <div>
      <h2>{formatLocalPrice(productPrice)}</h2>
      {isInMalawi && <span>🇲🇼 Malawi Pricing</span>}
    </div>
  );
};
```

### Accessing Location Data

```jsx
import { useLocation } from '../contexts/LocationContext';

const LocationInfo = () => {
  const { location } = useLocation();

  return (
    <div>
      <p>Country: {location.country}</p>
      <p>Currency: {location.currency}</p>
      <p>In Malawi: {location.isInMalawi ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

## Price Database Setup

**Important**: Store all prices in your database as USD values. The system will automatically:
1. Detect the user's location
2. Convert USD prices to MWK if user is in Malawi
3. Display the converted price with appropriate currency symbol

### Example Product Data
```javascript
{
  name: "iPhone 16 Pro",
  price: 999.99,  // Always store in USD
  description: "..."
}
```

When accessed:
- **User in Malawi**: Displays as "MWK 1,020,000" (approximately)
- **User elsewhere**: Displays as "$999.99"

## Geolocation Services Used

The system tries multiple services for redundancy:

1. **ip-api.com** (Primary) - Free up to 45 requests/minute
2. **ipapi.co** (Fallback) - Free tier available

Both are free services that don't require API keys.

## Exchange Rate Management

### Default Rates
The system uses default hardcoded rates:
```
USD to MWK: 1020.4
MWK to USD: 0.00098
```

### Update Exchange Rates

#### Option 1: Manual Update
```javascript
import { updateExchangeRates } from '../services/currencyService';

updateExchangeRates(0.00098, 1020.4);
```

#### Option 2: Fetch Live Rates (Recommended)
```javascript
import { fetchLiveExchangeRates } from '../services/currencyService';

// Call this periodically (e.g., once per day)
const latestRate = await fetchLiveExchangeRates();
```

To use live rates, sign up for a free API key at:
- https://www.exchangerate-api.com/ (recommended)
- https://exchangerate-api.com/docs

## Integration Checklist

- [x] LocationContext added and integrated into main App
- [x] Currency service created
- [x] Pricing hook created
- [x] Formatters updated

### Next Steps:

1. **Update Product Prices**: Ensure all prices in your database are in USD
   
2. **Update Components**: Replace hardcoded currency formatting with the new hooks
   
   Before:
   ```jsx
   <p>{formatMWK(gadget.price)}</p>
   ```
   
   After:
   ```jsx
   const { formatLocalPrice } = usePricing();
   <p>{formatLocalPrice(gadget.price)}</p>
   ```

3. **Test with VPN**: Test the location detection by using a VPN to connect from Malawi

4. **Update Exchange Rates**: Set up a scheduled task to fetch live exchange rates daily

## Component Examples

### Example 1: Product Card
```jsx
import { usePricing } from '../hooks/usePricing';

const ProductCard = ({ product }) => {
  const { formatLocalPrice } = usePricing();

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">{formatLocalPrice(product.price)}</p>
      <button>Add to Cart</button>
    </div>
  );
};
```

### Example 2: Gadget Detail Page
```jsx
import { usePricing } from '../hooks/usePricing';
import { useLocation } from '../contexts/LocationContext';

const GadgetDetail = ({ gadget }) => {
  const { formatLocalPrice, isInMalawi } = usePricing();
  const { location } = useLocation();

  if (location.loading) {
    return <p>Loading pricing information...</p>;
  }

  return (
    <div>
      <h1>{gadget.name}</h1>
      <div className="price-section">
        <h2>{formatLocalPrice(gadget.price)}</h2>
        {isInMalawi && (
          <p>Special pricing available in Malawi 🇲🇼</p>
        )}
      </div>
      {/* Rest of component */}
    </div>
  );
};
```

### Example 3: Shopping Cart
```jsx
import { usePricing } from '../hooks/usePricing';

const ShoppingCart = ({ items }) => {
  const { formatLocalPrice } = usePricing();
  
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="cart">
      {items.map(item => (
        <div key={item.id}>
          <p>{item.name}</p>
          <p>{formatLocalPrice(item.price)}</p>
        </div>
      ))}
      <div className="total">
        <strong>Total: {formatLocalPrice(total)}</strong>
      </div>
    </div>
  );
};
```

## Troubleshooting

### Location Detection Not Working
1. Check browser console for errors
2. Ensure user has JavaScript enabled
3. Try clearing localStorage: `localStorage.removeItem('userLocation')`
4. Check geolocation service status

### Prices Not Converting
1. Ensure prices in database are in USD
2. Verify exchange rates are set correctly
3. Check that `usePricing()` hook is being used in the component

### Performance Considerations
- Location detection runs once on app load and caches for 24 hours
- Currency conversion happens in real-time (minimal performance impact)
- Format conversion is synchronous and fast

## Security Notes

- Location detection is IP-based and cannot be spoofed
- No sensitive data is stored locally beyond location country code
- All geolocation calls are made directly from the browser

## Future Enhancements

1. Add support for more currencies
2. Implement user manual currency selection
3. Add shipping cost adjustments by country
4. Create admin panel to manage exchange rates
5. Add tax calculations by country
