# XtraPush Production Build Configuration

## Required URLs and Endpoints

### Backend API Configuration
- **Base API URL**: `https://sparkle-pro.co.uk/api`
- **Images Base URL**: `https://sparkle-pro.co.uk/api/images`
- **CORS Origins**: Multiple origins supported:
  - `https://itsxtrapush.com`
  - `https://www.itsxtrapush.com` 
  - `http://localhost:3000`
  - `http://localhost:3001`

### API Endpoints Used by Frontend
1. **Gadgets API**:
   - `GET /api/gadgets` - List all gadgets with filtering
   - `GET /api/gadgets/{id}` - Get specific gadget details
   - `GET /api/gadgets/categories` - Get categories with counts
   - `GET /api/gadgets/brands` - Get brands with counts

2. **User Management API**:
   - `GET /api/user/profile/{uid}` - Get user profile
   - `POST /api/user/profile/{uid}` - Update user profile
   - `POST /api/auth/register` - Register/create user
   - `GET /api/orders/user/{uid}` - Get user order history

3. **PayChangu Payment API**:
   - `POST /api/payments/create-checkout-session` - Create PayChangu checkout
   - `GET /api/payments/paychangu/verify/{txRef}` - Verify PayChangu payments

4. **Health Check**:
   - `GET /api/health` - API status check

### PayChangu Configuration
- **Success URL**: `https://itsxtrapush.com/payment/success?tx_ref={TX_REF}`
- **Cancel URL**: `https://itsxtrapush.com/payment/cancel`
### Search Functionality
- **Frontend Search**: Real-time search in GadgetsPage and HomeSearchBar
- **Backend Integration**: Searches gadgets by name, description, brand, model
- **Filter Support**: Category, brand, price range, stock status

### Image Handling
- All gadget images served from: `https://sparkle-pro.co.uk/api/images/`
- Required image files:
  - `macbookm4.png` (MacBook Pro M4)
  - `iphone16max.png` (iPhone 16 Pro Max)
  - `iphone16.png` (iPhone 16)
  - `s25ul.png` (Samsung S25 Ultra)
  - `s25.png` (Samsung S25)
  - `s24.png` (Samsung S24)
  - `s24ul.png` (Samsung S24 Ultra)
  - `tuf1.png` (ASUS TUF F15)

## Build Commands

### Development Build
```bash
npm start
```

### Production Build for itsxtrapush.com
```bash
npm run build:itsxtrapush
```

This command sets:
- `NODE_ENV=production`
- `REACT_APP_DOMAIN=itsxtrapush.com`
- Uses production API URLs

### Deploy Check
```bash
npm run deploy:check
```

## Backend Requirements

1. **Database Setup**: Run `database_setup.sql` to create tables and sample data
2. **PHP Backend**: Upload `index.php` to `https://sparkle-pro.co.uk/api/`
3. **Database Credentials**: Update lines 8-9 in `index.php`:
   ```php
   define('DB_USER', 'your_actual_username');
   define('DB_PASS', 'your_actual_password');
   ```

## Frontend Features Verified

✅ **Gadgets Page**: Loads gadgets from database via API
✅ **Search Functionality**: Real-time search with backend integration  
✅ **Gadget Detail**: Shows full product info with specifications
✅ **Stripe Checkout**: Creates sessions with proper success/cancel URLs
✅ **Image Display**: Serves images from sparkle-pro.co.uk/api/images
✅ **User Authentication**: Firebase auth with profile management
✅ **Dashboard Integration**: Profile editing and order history
✅ **Mobile Responsive**: Works on all device sizes

## Troubleshooting

### If Search Doesn't Work
- Check API endpoint: `https://sparkle-pro.co.uk/api/gadgets`
- Verify CORS headers allow itsxtrapush.com
- Check database connection in PHP

### If Stripe Checkout Fails  
- Verify success/cancel URLs in Stripe dashboard
- Check API endpoint: `https://sparkle-pro.co.uk/api/payments/create-checkout-session`
- Ensure Stripe keys are configured correctly

### If Images Don't Load
- Verify images exist at: `https://sparkle-pro.co.uk/api/images/`
- Check image file names match database entries
- Ensure proper CORS headers for image requests