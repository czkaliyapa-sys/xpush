<?php
/**
 * CRITICAL FRONTEND ERROR ANALYSIS
 * Comprehensive testing of all frontend components and error handling
 */

echo "🔍 CRITICAL FRONTEND ERROR ANALYSIS\n";
echo "====================================\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

class FrontendErrorAnalyzer {
    private $baseUrl = 'https://sparkle-pro.co.uk';
    private $apiBase = 'https://sparkle-pro.co.uk/api';
    private $errors = [];
    private $warnings = [];
    private $successes = [];
    
    public function runFullAnalysis() {
        echo "🚀 STARTING COMPREHENSIVE FRONTEND ANALYSIS\n";
        echo str_repeat("=", 50) . "\n\n";
        
        // Test 1: Core API Endpoints
        $this->testCoreAPIEndpoints();
        
        // Test 2: Payment Related Endpoints
        $this->testPaymentEndpoints();
        
        // Test 3: Dashboard and User Data
        $this->testDashboardEndpoints();
        
        // Test 4: Gadget and Product Data
        $this->testGadgetEndpoints();
        
        // Test 5: Authentication Endpoints
        $this->testAuthEndpoints();
        
        // Test 6: Error Handling Patterns
        $this->analyzeErrorHandling();
        
        // Generate final report
        $this->generateReport();
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null, $headers = []) {
        $url = strpos($endpoint, 'http') === 0 ? $endpoint : $this->apiBase . $endpoint;
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => array_merge([
                'Content-Type: application/json',
                'Accept: application/json'
            ], $headers)
        ]);
        
        if ($method !== 'GET') {
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) {
                curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        
        return [
            'status' => $httpCode,
            'body' => $response,
            'error' => $error,
            'decoded' => json_decode($response, true),
            'url' => $url
        ];
    }
    
    private function logResult($category, $type, $message, $data = null) {
        $entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'category' => $category,
            'message' => $message,
            'data' => $data
        ];
        
        switch($type) {
            case 'ERROR':
                $this->errors[] = $entry;
                echo "[❌ ERROR] {$category}: {$message}\n";
                break;
            case 'WARNING':
                $this->warnings[] = $entry;
                echo "[⚠️  WARN]  {$category}: {$message}\n";
                break;
            case 'SUCCESS':
                $this->successes[] = $entry;
                echo "[✅ OK]    {$category}: {$message}\n";
                break;
        }
        
        if ($data && $type !== 'SUCCESS') {
            echo "  Details: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
        }
    }
    
    private function testCoreAPIEndpoints() {
        echo "1. TESTING CORE API ENDPOINTS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Health check
        $response = $this->makeRequest('/');
        if ($response['status'] === 200) {
            $this->logResult('Core API', 'SUCCESS', 'Health endpoint responding');
        } else {
            $this->logResult('Core API', 'ERROR', 'Health endpoint failed', $response);
        }
        
        // Config endpoints
        $configs = ['/payments/config', '/payments/square/config'];
        foreach ($configs as $config) {
            $response = $this->makeRequest($config);
            if ($response['status'] === 200 && ($response['decoded']['success'] ?? false)) {
                $this->logResult('Config API', 'SUCCESS', "{$config} accessible");
            } else {
                $this->logResult('Config API', 'ERROR', "{$config} failed", $response);
            }
        }
        
        echo "\n";
    }
    
    private function testPaymentEndpoints() {
        echo "2. TESTING PAYMENT ENDPOINTS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Test payment notification (this is what we know works)
        $testPayment = [
            'txRef' => 'FRONTEND-TEST-' . time(),
            'amount' => 10000,
            'currency' => 'MWK',
            'customerEmail' => 'frontend.test@sparkle-pro.co.uk',
            'paymentStatus' => 'success',
            'items' => [
                [
                    'id' => 1,
                    'name' => 'Test Item',
                    'price' => 10000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $response = $this->makeRequest('/payments/notify-success', 'POST', $testPayment);
        if ($response['status'] === 200) {
            $this->logResult('Payment API', 'SUCCESS', 'Payment notification endpoint working');
        } else {
            $this->logResult('Payment API', 'ERROR', 'Payment notification failed', $response);
        }
        
        // Test verification endpoint
        $verifyResponse = $this->makeRequest('/payments/paychangu/verify/TEST-REF');
        if ($verifyResponse['status'] === 502) {
            $this->logResult('Payment API', 'WARNING', 'Verification returns 502 (expected for test refs)');
        } elseif ($verifyResponse['status'] !== 200) {
            $this->logResult('Payment API', 'ERROR', 'Verification endpoint error', $verifyResponse);
        }
        
        echo "\n";
    }
    
    private function testDashboardEndpoints() {
        echo "3. TESTING DASHBOARD ENDPOINTS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Analytics dashboard
        $response = $this->makeRequest('/analytics/dashboard?timeRange=1d');
        if ($response['status'] === 200 && ($response['decoded']['success'] ?? false)) {
            $this->logResult('Dashboard API', 'SUCCESS', 'Analytics dashboard accessible');
            
            // Check data structure
            $data = $response['decoded']['data'] ?? [];
            if (isset($data['order_stats'])) {
                $this->logResult('Dashboard Data', 'SUCCESS', 'Order statistics available');
            } else {
                $this->logResult('Dashboard Data', 'WARNING', 'Missing order statistics');
            }
            
            if (isset($data['revenue_stats'])) {
                $this->logResult('Dashboard Data', 'SUCCESS', 'Revenue statistics available');
            } else {
                $this->logResult('Dashboard Data', 'WARNING', 'Missing revenue statistics');
            }
            
        } else {
            $this->logResult('Dashboard API', 'ERROR', 'Analytics dashboard failed', $response);
        }
        
        echo "\n";
    }
    
    private function testGadgetEndpoints() {
        echo "4. TESTING GADGET ENDPOINTS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Test gadgets listing
        $response = $this->makeRequest('/gadgets');
        if ($response['status'] === 200) {
            $this->logResult('Gadgets API', 'SUCCESS', 'Gadgets endpoint responding');
            
            $gadgets = $response['decoded']['data'] ?? $response['decoded'] ?? [];
            if (is_array($gadgets) && count($gadgets) > 0) {
                $this->logResult('Gadgets Data', 'SUCCESS', 'Gadgets data available (' . count($gadgets) . ' items)');
                
                // Check first gadget structure
                $firstGadget = $gadgets[0];
                $requiredFields = ['id', 'name', 'price'];
                $missingFields = [];
                
                foreach ($requiredFields as $field) {
                    if (!isset($firstGadget[$field])) {
                        $missingFields[] = $field;
                    }
                }
                
                if (empty($missingFields)) {
                    $this->logResult('Gadgets Structure', 'SUCCESS', 'Gadget data structure complete');
                } else {
                    $this->logResult('Gadgets Structure', 'WARNING', 'Missing required fields: ' . implode(', ', $missingFields));
                }
                
            } else {
                $this->logResult('Gadgets Data', 'WARNING', 'No gadgets data returned');
            }
            
        } else {
            $this->logResult('Gadgets API', 'ERROR', 'Gadgets endpoint failed', $response);
        }
        
        // Test categories endpoint
        $catResponse = $this->makeRequest('/gadgets/categories');
        if ($catResponse['status'] === 200) {
            $this->logResult('Categories API', 'SUCCESS', 'Categories endpoint working');
        } else {
            $this->logResult('Categories API', 'ERROR', 'Categories endpoint failed', $catResponse);
        }
        
        echo "\n";
    }
    
    private function testAuthEndpoints() {
        echo "5. TESTING AUTHENTICATION ENDPOINTS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Test register endpoint
        $registerData = [
            'email' => 'test.frontend.' . time() . '@example.com',
            'password' => 'TestPass123!',
            'fullName' => 'Frontend Test User'
        ];
        
        $response = $this->makeRequest('/auth/register', 'POST', $registerData);
        // Registration might fail due to duplicate emails, but endpoint should respond
        if ($response['status'] === 200 || $response['status'] === 400) {
            $this->logResult('Auth API', 'SUCCESS', 'Registration endpoint accessible');
        } else {
            $this->logResult('Auth API', 'ERROR', 'Registration endpoint failed', $response);
        }
        
        // Test login endpoint
        $loginData = [
            'email' => 'test@example.com',
            'password' => 'testpass'
        ];
        
        $loginResponse = $this->makeRequest('/auth/login', 'POST', $loginData);
        if ($loginResponse['status'] === 200 || $loginResponse['status'] === 401) {
            $this->logResult('Auth API', 'SUCCESS', 'Login endpoint accessible');
        } else {
            $this->logResult('Auth API', 'ERROR', 'Login endpoint failed', $loginResponse);
        }
        
        echo "\n";
    }
    
    private function analyzeErrorHandling() {
        echo "6. ANALYZING ERROR HANDLING PATTERNS\n";
        echo str_repeat("-", 30) . "\n";
        
        // Test intentional errors to see error response format
        $errorResponses = [
            '/nonexistent-endpoint',
            '/payments/paychangu/verify/NONEXISTENT_REF',
            '/gadgets/999999' // Non-existent gadget
        ];
        
        foreach ($errorResponses as $endpoint) {
            $response = $this->makeRequest($endpoint);
            
            // Check if error responses are consistent
            if ($response['status'] >= 400) {
                $errorData = $response['decoded'];
                
                // Check for consistent error structure
                if (isset($errorData['success']) && isset($errorData['error'])) {
                    $this->logResult('Error Handling', 'SUCCESS', "Consistent error format for {$endpoint}");
                } else {
                    $this->logResult('Error Handling', 'WARNING', "Inconsistent error format for {$endpoint}", $errorData);
                }
            }
        }
        
        echo "\n";
    }
    
    private function generateReport() {
        echo str_repeat("=", 60) . "\n";
        echo "📋 CRITICAL FRONTEND ERROR ANALYSIS REPORT\n";
        echo str_repeat("=", 60) . "\n";
        
        $totalErrors = count($this->errors);
        $totalWarnings = count($this->warnings);
        $totalSuccess = count($this->successes);
        $totalTests = $totalErrors + $totalWarnings + $totalSuccess;
        
        echo "\n📊 SUMMARY STATISTICS:\n";
        echo "Total Tests Performed: {$totalTests}\n";
        echo "✅ Success: {$totalSuccess}\n";
        echo "❌ Errors: {$totalErrors}\n";
        echo "⚠️  Warnings: {$totalWarnings}\n";
        echo "📈 Success Rate: " . round(($totalSuccess / max($totalTests, 1)) * 100, 1) . "%\n";
        
        if ($totalErrors > 0) {
            echo "\n🚨 CRITICAL ERRORS FOUND:\n";
            foreach ($this->errors as $error) {
                echo "- [{$error['category']}] {$error['message']}\n";
            }
        }
        
        if ($totalWarnings > 0) {
            echo "\n⚠️  WARNINGS IDENTIFIED:\n";
            foreach ($this->warnings as $warning) {
                echo "- [{$warning['category']}] {$warning['message']}\n";
            }
        }
        
        echo "\n✅ FUNCTIONAL COMPONENTS:\n";
        $categories = [];
        foreach ($this->successes as $success) {
            $categories[$success['category']][] = $success['message'];
        }
        
        foreach ($categories as $category => $messages) {
            echo "\n{$category}:\n";
            foreach ($messages as $message) {
                echo "  ✓ {$message}\n";
            }
        }
        
        echo "\n🎯 OVERALL ASSESSMENT:\n";
        if ($totalErrors === 0) {
            echo "✅ FRONTEND IS HEALTHY - No critical errors found\n";
            echo "The frontend API infrastructure is functioning properly.\n";
        } elseif ($totalErrors <= 3) {
            echo "⚠️  MINOR ISSUES DETECTED\n";
            echo "Frontend is mostly functional with some non-critical issues.\n";
        } else {
            echo "❌ SIGNIFICANT ISSUES FOUND\n";
            echo "Multiple critical errors require immediate attention.\n";
        }
        
        // Save detailed report
        $reportData = [
            'analysis_timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'total_tests' => $totalTests,
                'errors' => $totalErrors,
                'warnings' => $totalWarnings,
                'successes' => $totalSuccess,
                'success_rate' => round(($totalSuccess / max($totalTests, 1)) * 100, 1)
            ],
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'successes' => $this->successes
        ];
        
        $filename = 'frontend_error_analysis_' . date('Y-m-d_H-i-s') . '.json';
        file_put_contents($filename, json_encode($reportData, JSON_PRETTY_PRINT));
        echo "\n📝 Detailed report saved to: {$filename}\n";
    }
}

// Run the analysis
$analyzer = new FrontendErrorAnalyzer();
$analyzer->runFullAnalysis();
?>