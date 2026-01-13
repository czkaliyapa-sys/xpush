# 🚀 Backend Deployment Checklist

## Current Issue Analysis
- ✅ Base API health check works: `https://sparkle-pro.co.uk/api/`
- ❌ Gadgets endpoint returns 404: `https://sparkle-pro.co.uk/api/gadgets`
- ❌ Diagnostic endpoint not found: `https://sparkle-pro.co.uk/api/test-api.php`

## Files to Upload to Server

Upload these files to your `https://sparkle-pro.co.uk/api/` directory:

### 📁 Required Files:
- [ ] `index.php` (Main API file)
- [ ] `gadgets.json` (Product data)
- [ ] `.htaccess` (URL rewriting rules)
- [ ] `test-api.php` (Diagnostic tool)

### 📋 Upload Steps:

1. **Access your web hosting control panel** (cPanel, DirectAdmin, etc.)

2. **Navigate to File Manager** or use FTP client

3. **Go to the `/api/` directory** under your domain root:
   ```
   /public_html/api/
   or
   /htdocs/api/
   or
   /www/api/
   ```

4. **Upload all files** from your local `sparkle-pro-api` folder

5. **Set proper permissions**:
   - Files: 644 (readable)
   - Directories: 755 (executable)

### 🧪 Testing Steps (in order):

1. **Test Diagnostic** (should work first):
   ```
   https://sparkle-pro.co.uk/api/test-api.php
   ```

2. **Test Health Check**:
   ```
   https://sparkle-pro.co.uk/api/
   ```

3. **Test Gadgets Endpoint**:
   ```
   https://sparkle-pro.co.uk/api/gadgets
   ```

### 🔧 Troubleshooting:

**If 404 errors persist:**
- Check file paths are correct
- Verify .htaccess is uploaded
- Check if server supports URL rewriting
- Contact hosting provider if needed

**Alternative access (if URL rewriting fails):**
- Direct access: `https://sparkle-pro.co.uk/api/index.php`
- With parameters: `https://sparkle-pro.co.uk/api/index.php?endpoint=gadgets`

### ✅ Success Indicators:

When working correctly, you should see:
- Diagnostic returns server info and file status
- Health check returns `{"status":"OK","message":"Sparkle Pro API running"}`
- Gadgets returns `{"success":true,"data":[...]}`

### 🎯 Next Steps:

Once the backend is working:
1. Frontend test page will show all green checkmarks
2. Gadgets will load on your main site
3. CORS issues will be resolved