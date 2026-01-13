// Pre-deployment test for Google Sign-In functionality
// Run this script before deploying to itsxtrapush.com

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting pre-deployment checks for itsxtrapush.com...\n');

// Check 1: Verify Firebase configuration
console.log('1. Checking Firebase configuration...');
const firebaseConfigPath = path.join(__dirname, 'src', 'firebase.jsx');
if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
    
    // Check for required domains
    const requiredDomains = ['itsxtrapush.com', 'www.itsxtrapush.com'];
    const hasRequiredDomains = requiredDomains.every(domain => 
        firebaseConfig.includes(domain)
    );
    
    if (hasRequiredDomains) {
        console.log('✅ Firebase domains configured correctly');
    } else {
        console.log('❌ Missing required domains in Firebase config');
        process.exit(1);
    }
} else {
    console.log('❌ Firebase config file not found');
    process.exit(1);
}

// Check 2: Verify environment files
console.log('\n2. Checking environment configuration...');
const prodEnvPath = path.join(__dirname, '.env.production');
if (fs.existsSync(prodEnvPath)) {
    console.log('✅ Production environment file exists');
} else {
    console.log('⚠️ Production environment file missing (optional)');
}

// Check 3: Verify dependencies
console.log('\n3. Checking dependencies...');
try {
    execSync('npm ls firebase axios @mui/material', { stdio: 'pipe' });
    console.log('✅ Required dependencies installed');
} catch (error) {
    console.log('❌ Missing required dependencies');
    console.log('Run: npm install');
    process.exit(1);
}

// Check 4: Test build process
console.log('\n4. Testing build process...');
try {
    console.log('Building for production...');
    execSync('npm run build:itsxtrapush', { stdio: 'inherit' });
    console.log('✅ Build process completed successfully');
} catch (error) {
    console.log('❌ Build process failed');
    process.exit(1);
}

// Check 5: Verify critical files in build
console.log('\n5. Verifying build output...');
const buildPath = path.join(__dirname, 'build');
const criticalFiles = ['index.html', 'static', 'manifest.json'];

const missingFiles = criticalFiles.filter(file => 
    !fs.existsSync(path.join(buildPath, file))
);

if (missingFiles.length === 0) {
    console.log('✅ All critical build files present');
} else {
    console.log('❌ Missing critical files:', missingFiles);
    process.exit(1);
}

// Check 6: Verify CSP configuration
console.log('\n6. Checking Content Security Policy...');
const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

if (indexHtml.includes('Content-Security-Policy')) {
    console.log('✅ CSP headers configured');
} else {
    console.log('⚠️ CSP headers not found (check if intentional)');
}

// Success message
console.log('\n🎉 Pre-deployment checks completed successfully!');
console.log('\n📋 Deployment Checklist:');
console.log('1. ✅ Build process completed');
console.log('2. ⏳ Upload build/ contents to Plesk httpdocs/');
console.log('3. ⏳ Configure .htaccess for SPA routing');
console.log('4. ⏳ Enable HTTPS on itsxtrapush.com');
console.log('5. ⏳ Add itsxtrapush.com to Firebase Console authorized domains');
console.log('6. ⏳ Update Google Cloud OAuth authorized origins');
console.log('7. ⏳ Test Google Sign-In on live domain');

console.log('\n📚 Refer to DEPLOY_TO_ITSXTRAPUSH.md for detailed instructions');
console.log('\n🚀 Ready for deployment to itsxtrapush.com!');