# Firebase Domain Authorization Setup for itsxtrapush.com

## Critical: Firebase Domain Authorization Required

The `auth/internal-error` you're experiencing is caused by **itsxtrapush.com not being authorized** in your Firebase project. This is a security feature that prevents unauthorized domains from using your Firebase authentication.

## Step-by-Step Fix:

### 1. Access Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: **phpconn-23dda**
3. Navigate to **Authentication** in the left sidebar

### 2. Add Authorized Domains
1. Click on **Settings** tab in Authentication
2. Scroll down to **Authorized domains** section
3. Click **Add domain**
4. Add these domains one by one:
   - `itsxtrapush.com`
   - `www.itsxtrapush.com`

### 3. Verify Domain Settings
After adding the domains, ensure you have these domains listed:
- ✅ localhost (should already be there)
- ✅ itsxtrapush.com (ADD THIS)
- ✅ www.itsxtrapush.com (ADD THIS)  
- ✅ phpconn-23dda.firebaseapp.com (should already be there)

### 4. Test Authentication
1. Deploy your app to itsxtrapush.com
2. Try Google Sign-In/Sign-Up
3. The `auth/internal-error` should be resolved

## Additional Security Considerations:

### OAuth Consent Screen (If Required)
If you're still getting errors, you may also need to update your Google Cloud Console:

1. Go to https://console.cloud.google.com/
2. Select project: **phpconn-23dda**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Add `itsxtrapush.com` to authorized domains there as well

### Firebase Project Settings
Verify in Firebase Console → Project Settings → General tab:
- **Project ID**: phpconn-23dda
- **Web API Key**: AIzaSyB3OpPy8j2sSlWkDHQ6VzbSSFkPelayGHI

## Error Resolution Timeline:
- ⚡ **Immediate**: Domain authorization changes take effect within 5 minutes
- 🔄 **Cache**: Clear browser cache after making changes
- 🌐 **DNS**: Ensure itsxtrapush.com is properly pointed to your hosting

## Testing Locally:
The app should work fine on `localhost:3001` since localhost is already authorized. The production error will only occur on the live domain.

---

**Need Help?** If you continue getting `auth/internal-error` after adding the domains, double-check:
1. Domain spelling is exact (no typos)
2. Both www and non-www versions are added
3. Changes have been saved in Firebase Console
4. Browser cache has been cleared