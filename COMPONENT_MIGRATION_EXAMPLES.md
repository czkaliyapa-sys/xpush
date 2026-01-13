# Component Migration Examples

This document shows how to update your existing components to use location-based pricing.

## GadgetDetail Component

### Before:
```jsx
import { formatMWK } from '../utils/formatters';

const GadgetDetail = ({ gadgetId }) => {
  const [gadget, setGadget] = useState(null);

  return (
    <div>
      <h1>{gadget.name}</h1>
      <p>Price: {formatMWK(gadget.price)}</p>
    </div>
  );
};
```

### After:
```jsx
import { usePricing } from '../hooks/usePricing';

const GadgetDetail = ({ gadgetId }) => {
  const [gadget, setGadget] = useState(null);
  const { formatLocalPrice, isInMalawi } = usePricing();

  return (
    <div>
      <h1>{gadget.name}</h1>
      <p>Price: {formatLocalPrice(gadget.price)}</p>
      {isInMalawi && <span>🇲🇼 Malawi Pricing</span>}
    </div>
  );
};
```

## GadgetsPage Component

### Before:
```jsx
const GadgetsPage = () => {
  const [gadgets, setGadgets] = useState([]);

  return (
    <div className="gadgets-grid">
      {gadgets.map(gadget => (
        <div key={gadget.id} className="gadget-card">
          <h3>{gadget.name}</h3>
          <p className="price">{formatMWK(gadget.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

### After:
```jsx
import { usePricing } from '../hooks/usePricing';

const GadgetsPage = () => {
  const [gadgets, setGadgets] = useState([]);
  const { formatLocalPrice } = usePricing();

  return (
    <div className="gadgets-grid">
      {gadgets.map(gadget => (
        <div key={gadget.id} className="gadget-card">
          <h3>{gadget.name}</h3>
          <p className="price">{formatLocalPrice(gadget.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

## Billing Component

### Before:
```jsx
const Billing = ({ items, total }) => {
  return (
    <div className="billing">
      <h2>Order Summary</h2>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{formatMWK(item.price)}</span>
        </div>
      ))}
      <div className="total">
        <strong>Total: {formatMWK(total)}</strong>
      </div>
    </div>
  );
};
```

### After:
```jsx
import { usePricing } from '../hooks/usePricing';

const Billing = ({ items, total }) => {
  const { formatLocalPrice } = usePricing();

  return (
    <div className="billing">
      <h2>Order Summary</h2>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{formatLocalPrice(item.price)}</span>
        </div>
      ))}
      <div className="total">
        <strong>Total: {formatLocalPrice(total)}</strong>
      </div>
    </div>
  );
};
```

## WishlistPage Component

### Before:
```jsx
import { formatMWK } from '../utils/formatters';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);

  return (
    <div>
      {wishlist.map(item => (
        <div key={item.id} className="wishlist-item">
          <h3>{item.name}</h3>
          <p>{formatMWK(item.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

### After:
```jsx
import { usePricing } from '../hooks/usePricing';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const { formatLocalPrice } = usePricing();

  return (
    <div>
      {wishlist.map(item => (
        <div key={item.id} className="wishlist-item">
          <h3>{item.name}</h3>
          <p>{formatLocalPrice(item.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

## CartModal Component

### Before:
```jsx
const CartModal = ({ isOpen, items }) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Modal open={isOpen}>
      <div className="cart-modal">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item} 
            price={formatMWK(item.price * item.quantity)} 
          />
        ))}
        <div className="total">{formatMWK(total)}</div>
      </div>
    </Modal>
  );
};
```

### After:
```jsx
import { usePricing } from '../hooks/usePricing';

const CartModal = ({ isOpen, items }) => {
  const { formatLocalPrice } = usePricing();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Modal open={isOpen}>
      <div className="cart-modal">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item} 
            price={formatLocalPrice(item.price * item.quantity)} 
          />
        ))}
        <div className="total">{formatLocalPrice(total)}</div>
      </div>
    </Modal>
  );
};
```

## With Compact Formatting

For larger price displays, use the compact format:

```jsx
import { usePricing } from '../hooks/usePricing';

const PriceDisplay = ({ gadget }) => {
  const { formatLocalPriceCompact } = usePricing();

  return (
    <div className="price-display">
      {/* Large format for headers */}
      <h2>{formatLocalPrice(gadget.price)}</h2>
      
      {/* Compact format for lists */}
      <span className="price-badge">{formatLocalPriceCompact(gadget.price)}</span>
    </div>
  );
};
```

## With Loading State

Always handle the loading state from location detection:

```jsx
import { usePricing } from '../hooks/usePricing';

const ProductListing = ({ products }) => {
  const { formatLocalPrice, loading } = usePricing();

  if (loading) {
    return <div>Loading pricing...</div>;
  }

  return (
    <div className="products">
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{formatLocalPrice(product.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

## Currency Toggle (Optional)

If you want to allow users to toggle currencies:

```jsx
import { useLocation } from '../contexts/LocationContext';
import { usePricing } from '../hooks/usePricing';
import { getPriceInLocalCurrency, formatPrice } from '../services/currencyService';

const CurrencyToggle = ({ price }) => {
  const { location, updateLocation } = useLocation();
  const { formatLocalPrice } = usePricing();
  const [showOtherCurrency, setShowOtherCurrency] = useState(false);

  const otherCurrency = location.currency === 'USD' ? 'MWK' : 'USD';
  const otherPrice = location.currency === 'USD' 
    ? getPriceInLocalCurrency(price, 'MWK')
    : price / 1020.4;

  return (
    <div className="currency-toggle">
      <p>{formatLocalPrice(price)}</p>
      <button onClick={() => setShowOtherCurrency(!showOtherCurrency)}>
        View in {otherCurrency}
      </button>
      {showOtherCurrency && (
        <p>{formatPrice(otherPrice, otherCurrency)}</p>
      )}
    </div>
  );
};
```

## Database Verification

Before deploying, verify all product prices are in USD:

```sql
-- SQL to check and convert prices if needed
-- Backup first!

-- View all products with their prices
SELECT id, name, price FROM gadgets;

-- If prices are in MWK, convert to USD (example):
-- Assuming column has MWK values
UPDATE gadgets SET price = price / 1020.4 WHERE price > 1000;
```

## Testing Checklist

- [ ] Test with VPN set to Malawi IP - should show MWK
- [ ] Test with VPN set to US IP - should show USD
- [ ] Test with no VPN (your current location)
- [ ] Clear browser cache and localStorage, test location detection
- [ ] Test on mobile devices
- [ ] Test with slow network (2G/3G) - location detection should timeout gracefully
- [ ] Test all price displays in your app
