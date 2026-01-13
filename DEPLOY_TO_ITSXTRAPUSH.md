+# Firebase Authentication Setup for itsxtrapush.com Deployment

## CRITICAL: Firebase Console Configuration Required

### 1. Firebase Authorized Domains Setup

**MANDATORY STEP:** Before deploying to itsxtrapush.com, you MUST add your domain to Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `phpconn-23dda`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add the following domains:
   - `itsxtrapush.com`
   - `www.itsxtrapush.com`
   - `localhost` (for development)
   - `127.0.0.1` (for development)

### 2. Google OAuth Configuration

Ensure Google Sign-In is properly configured:

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Set authorized domains (same as above)
4. Configure OAuth consent screen in Google Cloud Console

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `phpconn-23dda`
3. Navigate to **APIs & Services** → **Credentials**
4. Edit OAuth 2.0 client ID
5. Add to **Authorized JavaScript origins**:
   - `https://itsxtrapush.com`
   - `https://www.itsxtrapush.com`
   - `http://localhost:3000` (for development)
   - `http://localhost:3001` (for development)
6. Add to **Authorized redirect URIs**:
   - `https://itsxtrapush.com/__/auth/handler`
   - `https://www.itsxtrapush.com/__/auth/handler`

## Deployment Steps for Plesk

### 1. Build for Production
```bash
# Build optimized version for itsxtrapush.com
npm run build:itsxtrapush

# Alternative using environment file
npm run build
```

### 2. Upload to Plesk
1. Upload the `build` folder contents to your domain's `httpdocs` directory
2. Ensure the following files are in the root:
   - `index.html`
   - `static/` folder
   - `manifest.json`
   - `robots.txt`

### 3. Configure Plesk Settings
1. **Domain Settings:**
   - Document root: `/httpdocs`
   - Enable HTTPS/SSL
   - Set up SSL certificate for itsxtrapush.com

2. **Node.js Settings** (if using backend):
   - Node.js version: 18+ recommended
   - Application mode: Production
   - Environment variables: Set from `.env.production`

### 4. Configure .htaccess for SPA
Create `.htaccess` in your `httpdocs` directory:

```apache
Options -MultiViews
RewriteEngine On

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security Headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# HTTPS Redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

## Testing the Deployment

### 1. Pre-deployment Testing
```bash
# Test build locally
npm run deploy:check

# Serve locally to test
npx serve -s build
```

### 2. Post-deployment Verification
1. Visit `https://itsxtrapush.com`
2. Test Google Sign-In functionality
3. Check browser console for errors
4. Verify Firebase authentication

### 3. Common Issues & Solutions

**Issue: Google Sign-In popup blocked**
- Solution: Ensure HTTPS is enabled
- Verify domain authorization in Firebase

**Issue: CORS errors**
- Solution: Check authorized origins in Google Cloud Console
- Verify Firebase authorized domains

**Issue: Firebase auth/unauthorized-domain**
- Solution: Add itsxtrapush.com to Firebase authorized domains
- Clear browser cache and test again

## Environment Variables for Production

Ensure these are set in your Plesk environment or .env.production:

```
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
REACT_APP_DOMAIN=itsxtrapush.com
PUBLIC_URL=https://itsxtrapush.com
```

## Security Considerations

1. **Content Security Policy**: Enabled in production build
2. **HTTPS Only**: All authentication requires HTTPS
3. **Secure Headers**: Configured in .htaccess
4. **Firebase Security Rules**: Review and update as needed

## Monitoring & Debugging

### Check for Issues:
1. Browser Developer Tools → Console
2. Network tab for failed requests
3. Firebase Console → Authentication → Users
4. Google Analytics for page views

### Logs to Monitor:
- Authentication success/failure
- Domain authorization warnings
- CORS errors
- Network connectivity issues

## Support Checklist

Before going live, verify:
- [ ] Firebase authorized domains configured
- [ ] Google Cloud OAuth settings updated
- [ ] HTTPS enabled on domain
- [ ] .htaccess file configured
- [ ] Environment variables set
- [ ] Build process completed successfully
- [ ] Google Sign-In tested and working
- [ ] Dashboard redirect functioning

## Emergency Rollback Plan

If issues occur:
1. Keep a backup of previous working build
2. Document all configuration changes
3. Have Firebase Console access ready
4. Test rollback in staging environment first

---

**Critical Success Factors:**
1. Domain authorization in Firebase Console
2. HTTPS enabled on itsxtrapush.com
3. Proper OAuth configuration in Google Cloud
4. SPA routing configured correctly

Follow this guide step-by-step to ensure successful deployment with working Google authentication on itsxtrapush.com.