# Sparkle Pro API

A simple PHP backend API for the Sparkle Pro e-commerce platform with PayChangu integration.

## Setup

1. Install dependencies:
   ```bash
   composer install
   ```

2. Configure your PayChangu credentials in `index.php`:
   - Set `PAYCHANGU_API_KEY` and related constants

## API Endpoints

### Gadgets
- `GET /api/gadgets` - Get all gadgets
- `GET /api/gadgets/{id}` - Get specific gadget by ID

### Payments
- `POST /api/payments/create-checkout-session` - Create PayChangu checkout session and returns `checkout_url`
- `GET /api/payments/paychangu/verify/{txRef}` - Verify PayChangu payment by `tx_ref`

### Authentication (Basic)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth

### Admin: Users
- `GET /api/admin/users/stats` - Summary counts (admins, sellers, buyers, verified)
- `GET /api/admin/users?adminUid=ADMIN_UID` - List users (filters: `role`, `active`, `sellerVerified`)
- `GET /api/admin/users/{uid}?adminUid=ADMIN_UID` - Get user detail by `uid` (excluding password)
- `POST /api/admin/users/actions` - Account status actions
  - Body: `{ action: 'deactivate'|'reactivate'|'close', targetUid: 'USER_UID', adminUid: 'ADMIN_UID' }`
  - Deactivate/Reactivate toggles `is_active`; Close anonymizes PII and deactivates

### Admin: Platform Stats
- `GET /api/admin/stats` - Platform analytics for dashboard charts
  - Returns: `visitors.daily[]`, `pageViews.monthly[]`, `downloads.monthly[]`
  - Query params: `days` (default 30), `months` (default 6), optional `adminUid` to enforce admin access

### Health Check
- `GET /api/health` - API health status

## Features

- ✅ CORS enabled for cross-origin requests
- ✅ PayChangu payment integration
- ✅ JSON-based gadget data storage
- ✅ Error handling and validation
- ✅ RESTful API design

## Frontend Integration

The frontend is configured to use `https://www.sparkle-pro.co.uk/api` as the base URL.

## Files

- `index.php` - Main API router and handlers
- `gadgets.json` - Product data storage
- `composer.json` - PHP dependencies
- `vendor/` - Composer packages (auto-generated)