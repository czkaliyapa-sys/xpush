#!/bin/bash

# Deployment Script for Sparkle Pro API
# Ensures all dependencies are properly installed and ready for deployment

echo "🚀 Sparkle Pro API Deployment Preparation"
echo "=========================================="

# Navigate to API directory
cd sparkle-pro-api

echo "📁 Current directory: $(pwd)"

# Check if composer is available
if ! command -v composer &> /dev/null; then
    echo "❌ Composer not found. Please install Composer first."
    echo "   Visit: https://getcomposer.org/download/"
    exit 1
fi

echo "✅ Composer found"

# Check if composer.json exists
if [ ! -f "composer.json" ]; then
    echo "❌ composer.json not found"
    exit 1
fi

echo "✅ composer.json found"

# Install/update dependencies
echo "📥 Installing/updating dependencies..."
composer install --no-dev --optimize-autoloader

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Verify vendor directory exists
if [ -d "vendor" ]; then
    echo "✅ Vendor directory exists"
    
    # Check if PHPMailer is installed
    if [ -d "vendor/phpmailer" ]; then
        echo "✅ PHPMailer is installed"
    else
        echo "❌ PHPMailer not found in vendor directory"
        exit 1
    fi
    
    # Check if autoload.php exists
    if [ -f "vendor/autoload.php" ]; then
        echo "✅ Autoload file exists"
    else
        echo "❌ Autoload file not found"
        exit 1
    fi
else
    echo "❌ Vendor directory not found"
    exit 1
fi

# Show what will be deployed
echo ""
echo "📦 Files to be deployed:"
echo "------------------------"
find . -name "*.php" -not -path "./vendor/*" | head -10
echo "..."
echo "./vendor/ (directory with all dependencies)"
echo "./composer.json"
echo "./composer.lock"

echo ""
echo "✅ Deployment preparation complete!"
echo "Ready to deploy to production server."

# Instructions for deployment
echo ""
echo "📋 Deployment Instructions:"
echo "1. Upload the entire sparkle-pro-api directory to your production server"
echo "2. Ensure the vendor/ directory is included in the upload"
echo "3. Make sure the web server has proper permissions to read the files"
echo "4. Test the /payments/notify-success endpoint after deployment"