# Backend API Deployment Guide

## Files to Upload to https://sparkle-pro.co.uk/api/

### Required Files:
1. `index.php` - Main API file
2. `gadgets.json` - Gadgets data
3. `.htaccess` - URL rewriting configuration
4. `test-api.php` - Diagnostic test file
5. `vendor/` folder - Composer dependencies (only if additional libraries are used)

### Deployment Steps:

1. **Upload all files** to the `/api/` directory on your server
2. **Test the diagnostic endpoint** first: `https://sparkle-pro.co.uk/api/test-api.php`
3. **Test the health check**: `https://sparkle-pro.co.uk/api/`
4. **Test the gadgets endpoint**: `https://sparkle-pro.co.uk/api/gadgets`

### Troubleshooting:

#### If you get 404 errors:

1. **Check file paths**: Ensure all files are in the correct `/api/` directory
2. **Check .htaccess**: The server needs to support URL rewriting
3. **Check permissions**: Files should have proper read permissions (644 for files, 755 for directories)

#### If you get 500 errors:

1. **Check PHP version**: Requires PHP 7.4 or higher
2. **Check Composer dependencies**: If you use external libraries, ensure `vendor/` is uploaded
3. **Check file permissions**: Ensure PHP can read the files

#### Alternative deployment without URL rewriting:

If `.htaccess` doesn't work, you can access endpoints directly:
- Health: `https://sparkle-pro.co.uk/api/index.php`
- Gadgets: `https://sparkle-pro.co.uk/api/index.php?endpoint=gadgets`

### Testing Commands:

```bash
# Test diagnostic (should work first)
curl https://sparkle-pro.co.uk/api/test-api.php

# Test health check
curl https://sparkle-pro.co.uk/api/

# Test gadgets
curl https://sparkle-pro.co.uk/api/gadgets
```

### File Structure on Server:
```
/public_html/api/
├── index.php
├── gadgets.json
├── .htaccess
├── test-api.php
└── vendor/ (if used)
    └── autoload.php
```