# Analytics Tracking Integration Guide

## Frontend Tracking Implementation

The `analyticsTracker` service is now available at `src/services/analyticsTracker.js`

### Integration Points

#### 1. **Page Views** - Track when user navigates to pages
Add this to page components or route handlers:

```javascript
import { analyticsTracker } from '../services/analyticsTracker';

useEffect(() => {
  analyticsTracker.trackPageView('Home', { 
    source: 'navigation',
    category: 'homepage'
  });
}, []);
```

#### 2. **Product Views** - Track when user views product details
```javascript
useEffect(() => {
  if (product) {
    analyticsTracker.trackProductView(product.id, {
      name: product.name,
      category: product.category,
      price: product.price
    });
  }
}, [product]);
```

#### 3. **Add to Cart** - Track cart additions
```javascript
const handleAddToCart = (product, quantity) => {
  // ... add to cart logic
  analyticsTracker.trackAddToCart(product.id, quantity, {
    name: product.name,
    price: product.price
  });
};
```

#### 4. **Remove from Cart** - Track cart removals
```javascript
const handleRemoveFromCart = (productId, quantity) => {
  // ... remove logic
  analyticsTracker.trackRemoveFromCart(productId, quantity);
};
```

#### 5. **Checkout Start** - Track when checkout begins
```javascript
const handleCheckoutStart = () => {
  analyticsTracker.trackCheckoutStart({
    items_count: cart.items.length,
    total_amount: cart.total,
    currency: 'MWK'
  });
};
```

#### 6. **Checkout Complete** - Track successful orders
```javascript
const handleOrderSuccess = (order) => {
  analyticsTracker.trackCheckoutComplete({
    order_id: order.id,
    total_amount: order.total,
    items_count: order.items.length,
    currency: order.currency,
    payment_method: order.payment_method
  });
};
```

#### 7. **Wishlist Actions**
```javascript
analyticsTracker.trackWishlistAdd(product.id, { name: product.name });
analyticsTracker.trackWishlistRemove(product.id);
```

#### 8. **Search Tracking**
```javascript
const handleSearch = (query, results) => {
  analyticsTracker.trackSearch(query, results.length);
};
```

#### 9. **Filters**
```javascript
const handleFilterChange = (filterType, filterValue) => {
  analyticsTracker.trackFilterApplied(filterType, filterValue);
};
```

#### 10. **Special Features** - Trade-in, Installment, Subscriptions
```javascript
// Trade-in inquiry
analyticsTracker.trackTradeInInquiry({
  brand: 'Apple',
  model: 'iPhone 12',
  condition: 'good',
  estimated_value: 500000
});

// Installment plan selection
analyticsTracker.trackInstallmentSelected({
  plan_type: '12_months',
  number_of_months: 12,
  monthly_amount: 50000
});

// Subscription plan selection
analyticsTracker.trackSubscriptionSelected({
  plan_type: 'premium',
  plan_price: 25000,
  currency: 'MWK'
});
```

### Key Features

- **Automatic Session Tracking**: Session ID is automatically generated and persisted
- **Silent Failures**: Tracking errors don't disrupt user experience
- **Console Logging**: Events are logged to browser console (dev mode)
- **Batch Processing**: Events are sent individually but can be aggregated by backend
- **No Authentication Required**: Tracking works for both logged-in and anonymous users

### Available Methods

```javascript
analyticsTracker.trackPageView(pageName, pageData)
analyticsTracker.trackProductView(productId, productData)
analyticsTracker.trackAddToCart(productId, quantity, productData)
analyticsTracker.trackRemoveFromCart(productId, quantity)
analyticsTracker.trackCheckoutStart(cartData)
analyticsTracker.trackCheckoutComplete(orderData)
analyticsTracker.trackWishlistAdd(productId, productData)
analyticsTracker.trackWishlistRemove(productId)
analyticsTracker.trackSearch(query, resultsCount)
analyticsTracker.trackFilterApplied(filterType, filterValue)
analyticsTracker.trackTradeInInquiry(deviceData)
analyticsTracker.trackInstallmentSelected(planData)
analyticsTracker.trackSubscriptionSelected(subscriptionData)
analyticsTracker.trackEvent(eventType, eventData) // Generic event
analyticsTracker.getSessionId() // Get current session ID
```

## Backend Processing

The `/api/analytics/track` endpoint:
- Receives event data from frontend
- Stores in `analytics_events` table
- No authentication required
- Events are processed by cron every minute

## Dashboard Updates

The cron job (`subscription_renewal_manager.php`) now:
1. Calculates real visitor counts from `analytics_events`
2. Builds complete conversion funnel:
   - Page viewers → Product viewers → Cart users → Checkout users → Completed orders
3. Tracks event types: page_view, product_view, add_to_cart, checkout_start, etc.
4. Updates analytics cache every minute

## Testing

Check browser console for tracking logs:
```
[Analytics] Page View: ProductDetail
[Analytics] Product View: 12345
[Analytics] Add to Cart: 12345 x 1
```

Check database:
```sql
SELECT event_type, COUNT(*) FROM analytics_events 
WHERE created_at >= CURDATE() 
GROUP BY event_type;
```

## Migration

Run the cleanup migration to remove old data and add indexes:
```bash
mysql -u user -p database < migrations/003_clean_analytics_events.sql
```
