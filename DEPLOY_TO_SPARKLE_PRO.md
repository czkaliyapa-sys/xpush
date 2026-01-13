# Deployment Instructions for sparkle-pro.co.uk

## Critical Issue to Fix

Your production site `https://itsxtrapush.com` cannot load gadgets because the server at `sparkle-pro.co.uk` doesn't have the correct CORS configuration. This deployment will fix both:
1. **Production**: `https://itsxtrapush.com` → `https://sparkle-pro.co.uk/api`
2. **Development**: `http://localhost:3001` → `https://sparkle-pro.co.uk/api` (recommended)
   - Localhost ports `3000–3020` are allowed for development

## Files to Upload IMMEDIATELY

### 1. Main API File (REQUIRED)
Upload: `sparkle-pro-api/index.php`
To: `https://sparkle-pro.co.uk/api/index.php`
**This fixes the CORS issue for your production site!**

### 2. Gadgets Data File (REQUIRED)
Upload: `sparkle-pro-api/gadgets.json`
To: `https://sparkle-pro.co.uk/api/gadgets.json`

### 3. CORS Test Script (RECOMMENDED)
Upload: `sparkle-pro-api/test-cors.php`
To: `https://sparkle-pro.co.uk/api/test-cors.php`
**Use this to verify CORS is working**

### 4. Composer Dependencies (if needed)
Upload: `sparkle-pro-api/vendor/` (entire directory)
To: `https://sparkle-pro.co.uk/api/vendor/`

## Key Changes Made

### CORS Configuration
The updated `index.php` now includes:
- Support for multiple origins including `http://localhost:3001`
- Localhost port-range allowance: `http://localhost:{3000..3020}`
- Better origin detection (fallback to referer if origin header missing)
- Debug headers to help troubleshoot CORS issues
- Temporary wildcard origin for development (`Access-Control-Allow-Origin: *`)

### API Response Format
- All responses now follow standardized format: `{"success": true, "data": ...}`
- Error responses: `{"success": false, "error": "message"}`

### Data Structure
- Added `inStock` property to all gadgets in `gadgets.json`

## Testing After Deployment

### Immediate Verification
1. **Test CORS endpoint**: Visit `https://sparkle-pro.co.uk/api/test-cors.php` in your browser
2. **Test Gadgets API**: Visit `https://sparkle-pro.co.uk/api/gadgets` in your browser
3. **Test from your production site**: Visit `https://itsxtrapush.com` and check if gadgets load
4. **Test search functionality**: Try searching for gadgets on your production site
5. **Test from multiple dev ports**: Use `http://localhost:3000`, `3001`, `3010` and confirm CORS works

### Using the Test Page
1. Open `test-cors.html` in your browser from both:
   - Your production domain: `https://itsxtrapush.com`
   - Your local development: `http://localhost:3001`
2. Click the test buttons to verify CORS is working
3. Check browser console for any errors

### Expected Results
- ✅ **Production site**: `https://itsxtrapush.com` should load gadgets without errors
- ✅ **Local development**: `http://localhost:3001` should also work
- ✅ **Search functionality**: Should work on both environments
- ✅ **No CORS errors**: Check browser console for confirmation

### Debug Information
The updated API includes debug headers:
- `X-Debug-Origin`: Shows detected origin
- `X-Debug-Timestamp`: Shows request timestamp
- Server logs will contain CORS debug information

## Security Note

For production, you should remove the wildcard CORS (`Access-Control-Allow-Origin: *`) and only allow specific origins:

```php
// Remove this line in production:
header('Access-Control-Allow-Origin: *');

// Keep only this logic:
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
```

## Troubleshooting

If you still get CORS errors after deployment:
1. Check the `X-Debug-Origin` header in browser network tab
2. Verify the origin is in the `$allowedOrigins` array
3. Ensure file permissions are correct (644 for PHP files)
4. Check server error logs