#!/bin/bash

# Device Linking End-to-End Test Runner
# Runs comprehensive device linking tests and provides summary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="${1:-http://localhost/sparkle-pro-api}"

echo "📱 DEVICE LINKING E2E TEST RUNNER"
echo "================================="
echo "API URL: $API_URL"
echo ""

# Run the PHP test script
echo "🚀 Running comprehensive tests..."
echo ""

php "$SCRIPT_DIR/device_linking_e2e_test.php" "$API_URL"

echo ""
echo "✅ Test execution completed!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Review the test results above"
echo "2. Check the generated JSON report file for detailed results" 
echo "3. If all tests pass, device linking is working correctly"
echo "4. If tests fail, check the error messages and fix accordingly"

exit 0