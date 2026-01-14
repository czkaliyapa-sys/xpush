# Xtrapush Mobile App

A React Native (Expo) mobile application for Xtrapush Gadgets - your premium electronics marketplace.

## Features

### 📱 Core Features
- **Product Browsing** - Browse products by category, search, filter
- **Product Details** - View images, variants (color, storage), reviews
- **Shopping Cart** - Add/remove items, update quantities
- **Wishlist** - Save products for later
- **Checkout** - PayChangu & Square payment integration
- **User Authentication** - Sign in/Sign up
- **Order History** - View past orders and their status

### 💫 Premium Features
- **Subscriptions** - Plus & Premium tiers with benefits
- **Trade-In** - Get value for your old devices
- **Dark/Light Theme** - Auto or manual toggle
- **Multi-Currency** - GBP & MWK support

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)
- Expo CLI (optional): `npm install -g expo-cli`

### Installation

1. **Clone/Download the project**

2. **Install dependencies**
```bash
cd mobile
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm start
# or
yarn start
# or
npx expo start
```

4. **Run on your device**
- Install **Expo Go** from App Store (iOS) or Play Store (Android)
- Scan the QR code from the terminal
- Or press `i` for iOS simulator / `a` for Android emulator

### Running on Simulators

**iOS Simulator** (macOS only):
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

## Project Structure

```
mobile/
├── App.js                 # Main entry point
├── app.json               # Expo configuration
├── package.json
├── assets/                # Images, fonts, icons
└── src/
    ├── components/        # Reusable components
    │   └── ProductCard.js
    ├── context/           # React Context providers
    │   ├── AuthContext.js
    │   ├── CartContext.js
    │   ├── ThemeContext.js
    │   └── WishlistContext.js
    ├── hooks/             # Custom hooks
    ├── lib/               # Utilities
    │   ├── api.js         # API client
    │   └── theme.js       # Colors, spacing, etc.
    ├── navigation/        # Navigation config
    │   └── index.js
    └── screens/           # App screens
        ├── HomeScreen.js
        ├── ProductsScreen.js
        ├── ProductDetailScreen.js
        ├── CartScreen.js
        ├── CheckoutScreen.js
        ├── WishlistScreen.js
        ├── ProfileScreen.js
        ├── LoginScreen.js
        ├── RegisterScreen.js
        ├── OrdersScreen.js
        ├── SubscriptionsScreen.js
        ├── TradeInScreen.js
        └── SearchScreen.js
```

## Backend Integration

The app connects to the PHP backend at `https://itsxtrapush.com`. 

To change the API URL, edit `src/lib/api.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.com';
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure project:
```bash
eas build:configure
```

4. Build for iOS:
```bash
eas build --platform ios
```

5. Build for Android:
```bash
eas build --platform android
```

### Local Build (Bare Workflow)

If you need native code access:
```bash
npx expo prebuild
```

Then use Xcode (iOS) or Android Studio (Android) to build.

## Customization

### Theme Colors
Edit `src/lib/theme.js` to change the color scheme.

### App Icon & Splash
- Replace `assets/icon.png` (1024x1024)
- Replace `assets/splash.png` (1284x2778)
- Update `app.json` with your colors

## Environment Variables

For production, you may want to use environment variables:

1. Create `.env` file:
```
API_URL=https://itsxtrapush.com
```

2. Install dotenv:
```bash
npm install react-native-dotenv
```

## Support

For issues or questions, contact:
- Email: conrad@itsxtrapush.com
- Website: https://itsxtrapush.com

## License

© 2025 Xtrapush Gadgets. All rights reserved.
