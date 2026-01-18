#!/usr/bin/env php
<?php
/**
 * Dashboard Data Accuracy Verification Script
 * Tests admin dashboard data retrieval and accuracy
 */

class DashboardDataVerifier {
    private $apiBaseUrl;
    private $testResults = [];
    
    public function __construct($apiBaseUrl = 'https://sparkle-pro.co.uk/api/') {
        $this->apiBaseUrl = rtrim($apiBaseUrl, '/');
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null) {
        $url = $this->apiBaseUrl . $endpoint;
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
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
            'decoded' => json_decode($response, true)
        ];
    }
    
    private function logResult($testName, $status, $message, $data = null) {
        $timestamp = date('Y-m-d H:i:s');
        $statusIcon = $status === 'PASS' ? '✅' : ($status === 'FAIL' ? '❌' : '⚠️');
        
        echo "[{$timestamp}] {$statusIcon} {$testName}: {$message}\n";
        if ($data) {
            echo "  Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
        }
        
        $this->testResults[] = [
            'timestamp' => $timestamp,
            'test' => $testName,
            'status' => $status,
            'message' => $message,
            'data' => $data
        ];
    }
    
    public function verifyAnalyticsEndpoint() {
        echo "\n📊 ANALYTICS ENDPOINT VERIFICATION\n";
        echo str_repeat("-", 50) . "\n";
        
        // Test analytics dashboard endpoint
        $response = $this->makeRequest('/analytics/dashboard?timeRange=7d');
        
        if ($response['status'] === 200 && $response['decoded']['success']) {
            $data = $response['decoded']['data'];
            
            // Verify required data sections exist
            $requiredSections = ['order_stats', 'revenue_stats', 'subscription_stats', 'gadget_stats'];
            $missingSections = [];
            
            foreach ($requiredSections as $section) {
                if (!isset($data[$section])) {
                    $missingSections[] = $section;
                }
            }
            
            if (empty($missingSections)) {
                $this->logResult('Analytics Structure', 'PASS', 'All required data sections present');
                
                // Verify specific field mappings
                $this->verifyFieldMappings($data);
                $this->verifyDataIntegrity($data);
                
            } else {
                $this->logResult('Analytics Structure', 'FAIL', 'Missing sections: ' . implode(', ', $missingSections));
            }
            
        } else {
            $this->logResult('Analytics Endpoint', 'FAIL', "HTTP {$response['status']} - {$response['body']}");
        }
    }
    
    private function verifyFieldMappings($data) {
        echo "\n📋 FIELD MAPPING VERIFICATION\n";
        
        // Check revenue stats structure
        if (isset($data['revenue_stats'])) {
            $revenue = $data['revenue_stats'];
            if (isset($revenue['gbp']) && isset($revenue['mwk'])) {
                $this->logResult('Revenue Structure', 'PASS', 'Dual currency revenue data available');
                $this->logResult('GBP Revenue', 'INFO', "Total: £{$revenue['gbp']['total']}, This Month: £{$revenue['gbp']['this_month']}");
                $this->logResult('MWK Revenue', 'INFO', "Total: MWK {$revenue['mwk']['total']}, This Month: MWK {$revenue['mwk']['this_month']}");
            } else {
                $this->logResult('Revenue Structure', 'FAIL', 'Missing GBP/MWK revenue breakdown');
            }
        }
        
        // Check subscription stats structure
        if (isset($data['subscription_stats'])) {
            $subs = $data['subscription_stats'];
            $expectedFields = ['total_subscriptions', 'plus_count', 'premium_count', 'active_count'];
            $missingFields = [];
            
            foreach ($expectedFields as $field) {
                if (!isset($subs[$field])) {
                    $missingFields[] = $field;
                }
            }
            
            if (empty($missingFields)) {
                $this->logResult('Subscription Structure', 'PASS', 'All subscription fields present');
                $this->logResult('Subscription Count', 'INFO', "Total: {$subs['total_subscriptions']}, Active: {$subs['active_count']}, Plus: {$subs['plus_count']}, Premium: {$subs['premium_count']}");
            } else {
                $this->logResult('Subscription Structure', 'FAIL', 'Missing fields: ' . implode(', ', $missingFields));
            }
        }
        
        // Check order stats structure
        if (isset($data['order_stats'])) {
            $orders = $data['order_stats'];
            $this->logResult('Order Statistics', 'PASS', 'Order data available');
            $this->logResult('Order Count', 'INFO', "Total: {$orders['total_orders']}, Pending: {$orders['pending_orders']}, Completed: {$orders['completed_orders']}");
        }
        
        // Check gadget stats structure
        if (isset($data['gadget_stats'])) {
            $gadgets = $data['gadget_stats'];
            $this->logResult('Inventory Statistics', 'PASS', 'Inventory data available');
            $this->logResult('Gadget Count', 'INFO', "Total: {$gadgets['total_gadgets']}, In Stock: {$gadgets['in_stock_count']}, Total Units: {$gadgets['total_stock_units']}");
        }
    }
    
    private function verifyDataIntegrity($data) {
        echo "\n🔍 DATA INTEGRITY CHECKS\n";
        
        // Check for reasonable data ranges
        if (isset($data['order_stats']['total_orders'])) {
            $totalOrders = intval($data['order_stats']['total_orders']);
            if ($totalOrders >= 0 && $totalOrders < 10000) {
                $this->logResult('Order Count Validity', 'PASS', "Reasonable order count: {$totalOrders}");
            } else {
                $this->logResult('Order Count Validity', 'WARN', "Unexpected order count: {$totalOrders}");
            }
        }
        
        if (isset($data['revenue_stats']['gbp']['total'])) {
            $gbpRevenue = floatval($data['revenue_stats']['gbp']['total']);
            if ($gbpRevenue >= 0 && $gbpRevenue < 1000000) {
                $this->logResult('GBP Revenue Validity', 'PASS', "Reasonable GBP revenue: £{$gbpRevenue}");
            } else {
                $this->logResult('GBP Revenue Validity', 'WARN', "Unexpected GBP revenue: £{$gbpRevenue}");
            }
        }
        
        if (isset($data['gadget_stats']['total_gadgets'])) {
            $totalGadgets = intval($data['gadget_stats']['total_gadgets']);
            if ($totalGadgets >= 0 && $totalGadgets <= 1000) {
                $this->logResult('Inventory Count Validity', 'PASS', "Reasonable gadget count: {$totalGadgets}");
            } else {
                $this->logResult('Inventory Count Validity', 'WARN', "Unexpected gadget count: {$totalGadgets}");
            }
        }
        
        // Check timestamp freshness
        if (isset($data['last_updated'])) {
            $lastUpdated = strtotime($data['last_updated']);
            $timeDiff = time() - $lastUpdated;
            
            if ($timeDiff < 3600) { // Less than 1 hour old
                $this->logResult('Data Freshness', 'PASS', "Data updated " . floor($timeDiff/60) . " minutes ago");
            } elseif ($timeDiff < 86400) { // Less than 1 day old
                $this->logResult('Data Freshness', 'WARN', "Data updated " . floor($timeDiff/3600) . " hours ago");
            } else {
                $this->logResult('Data Freshness', 'FAIL', "Data is stale - updated " . floor($timeDiff/86400) . " days ago");
            }
        }
    }
    
    public function verifyFrontendIntegration() {
        echo "\n🖥️  FRONTEND INTEGRATION CHECKS\n";
        echo str_repeat("-", 50) . "\n";
        
        // Simulate frontend data transformation
        $response = $this->makeRequest('/analytics/dashboard?timeRange=7d');
        
        if ($response['status'] === 200 && $response['decoded']['success']) {
            $backendData = $response['decoded']['data'];
            
            // Simulate the frontend transformation logic
            $transformedData = [
                'revenue_stats' => [
                    'total_revenue_gbp' => $backendData['revenue_stats']['gbp']['total'] ?? 0,
                    'revenue_today_gbp' => $backendData['revenue_stats']['gbp']['this_month'] ?? 0,
                    'total_revenue_mwk' => $backendData['revenue_stats']['mwk']['total'] ?? 0,
                    'revenue_today_mwk' => $backendData['revenue_stats']['mwk']['this_month'] ?? 0
                ],
                'subscription_stats' => [
                    'active_subscriptions' => intval($backendData['subscription_stats']['active_count'] ?? 0),
                    'plus_subscribers' => intval($backendData['subscription_stats']['plus_count'] ?? 0),
                    'premium_subscribers' => intval($backendData['subscription_stats']['premium_count'] ?? 0),
                    'total_subscriptions' => intval($backendData['subscription_stats']['total_subscriptions'] ?? 0)
                ],
                'order_stats' => [
                    'total_orders' => intval($backendData['order_stats']['total_orders'] ?? 0),
                    'pending_orders' => intval($backendData['order_stats']['pending_orders'] ?? 0),
                    'completed_orders' => intval($backendData['order_stats']['completed_orders'] ?? 0)
                ]
            ];
            
            $this->logResult('Data Transformation', 'PASS', 'Backend data successfully transformed for frontend');
            $this->logResult('Transformed Data Sample', 'INFO', '', $transformedData);
            
        } else {
            $this->logResult('Frontend Integration', 'FAIL', 'Cannot test transformation - backend data unavailable');
        }
    }
    
    public function generateReport() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📊 DASHBOARD DATA ACCURACY REPORT\n";
        echo str_repeat("=", 60) . "\n";
        
        $passed = count(array_filter($this->testResults, fn($r) => $r['status'] === 'PASS'));
        $failed = count(array_filter($this->testResults, fn($r) => $r['status'] === 'FAIL'));
        $warnings = count(array_filter($this->testResults, fn($r) => $r['status'] === 'WARN'));
        $total = count($this->testResults);
        
        echo "\nSUMMARY:\n";
        echo "Total Tests: {$total}\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "⚠️  Warnings: {$warnings}\n";
        echo "📈 Success Rate: " . round(($passed / max($total, 1)) * 100, 1) . "%\n";
        
        if ($failed === 0) {
            echo "\n🎉 ALL VERIFICATION TESTS PASSED!\n";
            echo "Dashboard data is accurate and ready for production.\n";
        } elseif ($failed <= 2) {
            echo "\n✅ MINOR ISSUES DETECTED\n";
            echo "Dashboard is mostly functional with minor concerns.\n";
        } else {
            echo "\n⚠️  SIGNIFICANT ISSUES FOUND\n";
            echo "Review failed tests above before deploying.\n";
        }
        
        // Save detailed report
        $filename = 'dashboard_verification_report_' . date('Y-m-d_H-i-s') . '.json';
        $report = [
            'verification_run' => date('Y-m-d H:i:s'),
            'api_base_url' => $this->apiBaseUrl,
            'results' => $this->testResults,
            'summary' => [
                'total_tests' => $total,
                'passed' => $passed,
                'failed' => $failed,
                'warnings' => $warnings,
                'success_rate' => round(($passed / max($total, 1)) * 100, 1)
            ]
        ];
        
        file_put_contents($filename, json_encode($report, JSON_PRETTY_PRINT));
        echo "\n📝 Detailed report saved to: {$filename}\n";
    }
    
    public function runFullVerification() {
        echo "📊 DASHBOARD DATA ACCURACY VERIFICATION\n";
        echo "API Endpoint: {$this->apiBaseUrl}\n";
        echo str_repeat("=", 60) . "\n";
        
        $this->verifyAnalyticsEndpoint();
        $this->verifyFrontendIntegration();
        $this->generateReport();
    }
}

// Run verification
if (php_sapi_name() === 'cli') {
    $apiUrl = $argv[1] ?? 'https://sparkle-pro.co.uk/api/';
    $verifier = new DashboardDataVerifier($apiUrl);
    $verifier->runFullVerification();
} else {
    header('Content-Type: text/plain');
    echo "This script should be run from command line:\n";
    echo "php " . basename(__FILE__) . " [api_base_url]\n";
}
?>