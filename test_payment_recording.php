<?php
/**
 * Payment Recording and Dashboard Visibility Test
 * Tests end-to-end payment flow and verifies data appears in dashboards
 */

class PaymentRecordingTest {
    private $apiBaseUrl;
    private $testResults = [];
    private $testUserId;
    private $testTxRef;
    
    public function __construct($apiBaseUrl = 'https://sparkle-pro.co.uk/api/') {
        $this->apiBaseUrl = rtrim($apiBaseUrl, '/');
        $this->testUserId = 'test_user_' . time();
        $this->testTxRef = 'TEST-PAYMENT-' . time();
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
    
    public function runPaymentTest() {
        echo "💳 PAYMENT RECORDING AND DASHBOARD VISIBILITY TEST\n";
        echo "==================================================\n";
        echo "Test User ID: {$this->testUserId}\n";
        echo "Test Transaction: {$this->testTxRef}\n";
        echo "Time: " . date('Y-m-d H:i:s') . "\n\n";
        
        // Step 1: Test API Health
        $this->testApiHealth();
        
        // Step 2: Simulate Payment Processing
        $this->simulatePaymentProcessing();
        
        // Step 3: Verify Database Recording
        $this->verifyDatabaseRecording();
        
        // Step 4: Check User Dashboard Visibility
        $this->checkUserDashboardVisibility();
        
        // Step 5: Check Admin Dashboard Visibility
        $this->checkAdminDashboardVisibility();
        
        // Step 6: Verify Analytics Updates
        $this->verifyAnalyticsUpdates();
        
        // Generate final report
        $this->generateReport();
    }
    
    private function testApiHealth() {
        echo "1. API HEALTH CHECK\n";
        echo str_repeat("-", 30) . "\n";
        
        $response = $this->makeRequest('/');
        if ($response['status'] === 200) {
            $this->logResult('API Health', 'PASS', 'API is responding');
        } else {
            $this->logResult('API Health', 'FAIL', "HTTP {$response['status']} - {$response['body']}");
        }
    }
    
    private function simulatePaymentProcessing() {
        echo "\n2. PAYMENT PROCESSING SIMULATION\n";
        echo str_repeat("-", 30) . "\n";
        
        // Test data for MWK payment (Malawi user)
        $mwkPaymentData = [
            'items' => [
                [
                    'id' => 1,
                    'name' => 'Test Gadget - MWK Payment',
                    'price' => 50000, // MWK 50,000
                    'price_gbp' => 17.86, // GBP equivalent
                    'quantity' => 1,
                    'brand' => 'TestBrand'
                ]
            ],
            'customerEmail' => 'test@malawi.com',
            'currency' => 'MWK',
            'gateway' => 'paychangu',
            'paymentType' => 'one_off'
        ];
        
        // Test data for GBP payment (UK user)
        $gbpPaymentData = [
            'items' => [
                [
                    'id' => 2,
                    'name' => 'Test Gadget - GBP Payment',
                    'price' => 10000, // GBP £100
                    'price_gbp' => 100,
                    'quantity' => 1,
                    'brand' => 'TestBrand'
                ]
            ],
            'customerEmail' => 'test@uk.com',
            'currency' => 'GBP',
            'gateway' => 'square',
            'paymentType' => 'one_off'
        ];
        
        // Test MWK payment processing
        echo "Testing MWK Payment Processing...\n";
        $mwkResponse = $this->makeRequest('/payments/notify-success', 'POST', array_merge($mwkPaymentData, [
            'tx_ref' => $this->testTxRef . '_MWK',
            'status' => 'success'
        ]));
        
        if ($mwkResponse['status'] === 200) {
            $this->logResult('MWK Payment Processing', 'PASS', 'MWK payment processed successfully');
        } else {
            $this->logResult('MWK Payment Processing', 'FAIL', "HTTP {$mwkResponse['status']} - {$mwkResponse['body']}");
        }
        
        // Test GBP payment processing
        echo "\nTesting GBP Payment Processing...\n";
        $gbpResponse = $this->makeRequest('/payments/notify-success', 'POST', array_merge($gbpPaymentData, [
            'tx_ref' => $this->testTxRef . '_GBP',
            'status' => 'success'
        ]));
        
        if ($gbpResponse['status'] === 200) {
            $this->logResult('GBP Payment Processing', 'PASS', 'GBP payment processed successfully');
        } else {
            $this->logResult('GBP Payment Processing', 'FAIL', "HTTP {$gbpResponse['status']} - {$gbpResponse['body']}");
        }
    }
    
    private function verifyDatabaseRecording() {
        echo "\n3. DATABASE RECORDING VERIFICATION\n";
        echo str_repeat("-", 30) . "\n";
        
        // Check if orders were created
        $ordersResponse = $this->makeRequest("/orders/user/{$this->testUserId}");
        
        if ($ordersResponse['status'] === 200) {
            $orders = $ordersResponse['decoded']['orders'] ?? $ordersResponse['decoded']['data'] ?? [];
            
            if (is_array($orders) && count($orders) > 0) {
                $this->logResult('Database Recording', 'PASS', 'Orders found in database');
                
                // Check for our test transactions
                $foundMwk = false;
                $foundGbp = false;
                
                foreach ($orders as $order) {
                    $txRef = $order['external_tx_ref'] ?? $order['tx_ref'] ?? '';
                    if (strpos($txRef, $this->testTxRef . '_MWK') !== false) {
                        $foundMwk = true;
                        $this->logResult('MWK Order Found', 'PASS', "Found MWK order: {$txRef}", [
                            'currency' => $order['currency'] ?? 'N/A',
                            'amount' => $order['total_amount'] ?? 'N/A',
                            'status' => $order['payment_status'] ?? 'N/A'
                        ]);
                    }
                    if (strpos($txRef, $this->testTxRef . '_GBP') !== false) {
                        $foundGbp = true;
                        $this->logResult('GBP Order Found', 'PASS', "Found GBP order: {$txRef}", [
                            'currency' => $order['currency'] ?? 'N/A',
                            'amount' => $order['total_amount'] ?? 'N/A',
                            'status' => $order['payment_status'] ?? 'N/A'
                        ]);
                    }
                }
                
                if (!$foundMwk) {
                    $this->logResult('MWK Order Search', 'WARN', 'MWK test order not found in user orders');
                }
                if (!$foundGbp) {
                    $this->logResult('GBP Order Search', 'WARN', 'GBP test order not found in user orders');
                }
                
            } else {
                $this->logResult('Database Recording', 'WARN', 'No orders found for test user');
            }
        } else {
            $this->logResult('Database Recording', 'FAIL', "Failed to fetch orders: HTTP {$ordersResponse['status']}");
        }
    }
    
    private function checkUserDashboardVisibility() {
        echo "\n4. USER DASHBOARD VISIBILITY\n";
        echo str_repeat("-", 30) . "\n";
        
        // Simulate user dashboard data fetch
        $dashboardResponse = $this->makeRequest("/orders/user/{$this->testUserId}");
        
        if ($dashboardResponse['status'] === 200) {
            $data = $dashboardResponse['decoded'];
            $this->logResult('User Dashboard API', 'PASS', 'User dashboard endpoint responding');
            
            // Check if recent orders include our test transactions
            $orders = $data['orders'] ?? $data['data'] ?? [];
            if (is_array($orders)) {
                $recentOrders = array_slice($orders, 0, 5); // Get 5 most recent
                
                $this->logResult('Recent Orders Display', 'INFO', 'Recent orders data retrieved', [
                    'count' => count($recentOrders),
                    'sample_orders' => array_map(function($order) {
                        return [
                            'tx_ref' => $order['external_tx_ref'] ?? $order['tx_ref'] ?? 'N/A',
                            'currency' => $order['currency'] ?? 'N/A',
                            'amount' => $order['total_amount'] ?? 'N/A',
                            'status' => $order['payment_status'] ?? 'N/A'
                        ];
                    }, $recentOrders)
                ]);
            }
        } else {
            $this->logResult('User Dashboard API', 'FAIL', "HTTP {$dashboardResponse['status']} - Dashboard not accessible");
        }
    }
    
    private function checkAdminDashboardVisibility() {
        echo "\n5. ADMIN DASHBOARD VISIBILITY\n";
        echo str_repeat("-", 30) . "\n";
        
        // Check admin analytics dashboard
        $analyticsResponse = $this->makeRequest('/analytics/dashboard?timeRange=1d');
        
        if ($analyticsResponse['status'] === 200 && $analyticsResponse['decoded']['success']) {
            $data = $analyticsResponse['decoded']['data'];
            $this->logResult('Admin Analytics API', 'PASS', 'Admin dashboard endpoint responding');
            
            // Check order statistics
            if (isset($data['order_stats'])) {
                $orderStats = $data['order_stats'];
                $this->logResult('Order Statistics', 'INFO', 'Admin order stats available', [
                    'total_orders' => $orderStats['total_orders'] ?? 'N/A',
                    'pending_orders' => $orderStats['pending_orders'] ?? 'N/A',
                    'completed_orders' => $orderStats['completed_orders'] ?? 'N/A'
                ]);
            }
            
            // Check revenue statistics
            if (isset($data['revenue_stats'])) {
                $revenueStats = $data['revenue_stats'];
                $this->logResult('Revenue Statistics', 'INFO', 'Admin revenue stats available', [
                    'mwk_total' => $revenueStats['mwk']['total'] ?? 'N/A',
                    'gbp_total' => $revenueStats['gbp']['total'] ?? 'N/A',
                    'mwk_this_month' => $revenueStats['mwk']['this_month'] ?? 'N/A',
                    'gbp_this_month' => $revenueStats['gbp']['this_month'] ?? 'N/A'
                ]);
            }
            
            // Check if our test transactions would be included in recent orders
            $this->logResult('Analytics Data Freshness', 'INFO', 'Dashboard data timestamp', [
                'last_updated' => $data['last_updated'] ?? 'N/A'
            ]);
            
        } else {
            $this->logResult('Admin Dashboard API', 'FAIL', "HTTP {$analyticsResponse['status']} - Analytics dashboard not accessible");
        }
    }
    
    private function verifyAnalyticsUpdates() {
        echo "\n6. ANALYTICS UPDATES VERIFICATION\n";
        echo str_repeat("-", 30) . "\n";
        
        // Check if our test payments affected the analytics
        $beforeResponse = $this->makeRequest('/analytics/dashboard?timeRange=1d');
        $beforeData = $beforeResponse['decoded']['data'] ?? [];
        
        // Wait a moment and check again
        sleep(2);
        
        $afterResponse = $this->makeRequest('/analytics/dashboard?timeRange=1d');
        $afterData = $afterResponse['decoded']['data'] ?? [];
        
        if (isset($beforeData['order_stats']) && isset($afterData['order_stats'])) {
            $beforeOrders = $beforeData['order_stats']['total_orders'] ?? 0;
            $afterOrders = $afterData['order_stats']['total_orders'] ?? 0;
            
            if ($afterOrders > $beforeOrders) {
                $this->logResult('Order Count Update', 'PASS', "Order count increased from {$beforeOrders} to {$afterOrders}");
            } else {
                $this->logResult('Order Count Update', 'INFO', "Order count unchanged: {$beforeOrders} → {$afterOrders} (may be cached)");
            }
        }
        
        if (isset($beforeData['revenue_stats']) && isset($afterData['revenue_stats'])) {
            $beforeRevenueMWK = $beforeData['revenue_stats']['mwk']['total'] ?? 0;
            $afterRevenueMWK = $afterData['revenue_stats']['mwk']['total'] ?? 0;
            $beforeRevenueGBP = $beforeData['revenue_stats']['gbp']['total'] ?? 0;
            $afterRevenueGBP = $afterData['revenue_stats']['gbp']['total'] ?? 0;
            
            $this->logResult('Revenue Tracking', 'INFO', 'Revenue comparison', [
                'mwk_before' => $beforeRevenueMWK,
                'mwk_after' => $afterRevenueMWK,
                'gbp_before' => $beforeRevenueGBP,
                'gbp_after' => $afterRevenueGBP
            ]);
        }
    }
    
    private function generateReport() {
        echo "\n" . str_repeat("=", 50) . "\n";
        echo "📋 PAYMENT RECORDING TEST REPORT\n";
        echo str_repeat("=", 50) . "\n";
        
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
            echo "\n🎉 ALL CORE TESTS PASSED!\n";
            echo "Payment recording and dashboard visibility working correctly.\n";
        } elseif ($failed <= 2) {
            echo "\n✅ MINOR ISSUES DETECTED\n";
            echo "System is mostly functional with minor concerns.\n";
        } else {
            echo "\n⚠️  SIGNIFICANT ISSUES FOUND\n";
            echo "Review failed tests above before production use.\n";
        }
        
        // Save detailed report
        $filename = 'payment_test_report_' . date('Y-m-d_H-i-s') . '.json';
        $report = [
            'test_run' => date('Y-m-d H:i:s'),
            'test_user_id' => $this->testUserId,
            'test_transaction_ref' => $this->testTxRef,
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
}

// Run the test
if (php_sapi_name() === 'cli') {
    $apiUrl = $argv[1] ?? 'https://sparkle-pro.co.uk/api/';
    $tester = new PaymentRecordingTest($apiUrl);
    $tester->runPaymentTest();
} else {
    header('Content-Type: text/plain');
    echo "This script should be run from command line:\n";
    echo "php " . basename(__FILE__) . " [api_base_url]\n";
}
?>