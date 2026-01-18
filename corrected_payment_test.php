<?php
/**
 * Corrected Payment Recording Test
 * Uses proper field names expected by the backend
 */

class CorrectedPaymentTest {
    private $apiBaseUrl;
    private $testResults = [];
    private $testTxRef;
    
    public function __construct($apiBaseUrl = 'https://sparkle-pro.co.uk/api/') {
        $this->apiBaseUrl = rtrim($apiBaseUrl, '/');
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
    
    public function runTest() {
        echo "💳 CORRECTED PAYMENT RECORDING TEST\n";
        echo "=====================================\n";
        echo "Test Transaction: {$this->testTxRef}\n";
        echo "Time: " . date('Y-m-d H:i:s') . "\n\n";
        
        // Test 1: API Health
        $this->testApiHealth();
        
        // Test 2: MWK Payment Processing (Malawi)
        $this->testMwkPayment();
        
        // Test 3: GBP Payment Processing (UK)
        $this->testGbpPayment();
        
        // Test 4: Admin Dashboard Verification
        $this->verifyAdminDashboard();
        
        // Generate report
        $this->generateReport();
    }
    
    private function testApiHealth() {
        echo "1. API HEALTH CHECK\n";
        echo str_repeat("-", 25) . "\n";
        
        $response = $this->makeRequest('/');
        if ($response['status'] === 200) {
            $this->logResult('API Health', 'PASS', 'API is responding');
        } else {
            $this->logResult('API Health', 'FAIL', "HTTP {$response['status']}");
        }
    }
    
    private function testMwkPayment() {
        echo "\n2. MWK PAYMENT PROCESSING (MALAWI)\n";
        echo str_repeat("-", 25) . "\n";
        
        $paymentData = [
            'txRef' => $this->testTxRef . '_MWK',
            'amount' => 50000, // MWK 50,000
            'currency' => 'MWK',
            'customerEmail' => 'test.malawi@sparkle-pro.co.uk',
            'paymentStatus' => 'success',
            'items' => [
                [
                    'id' => 'test-item-mwk',
                    'name' => 'Test Gadget - Malawi Payment',
                    'price' => 50000,
                    'quantity' => 1,
                    'brand' => 'TestBrand'
                ]
            ]
        ];
        
        $response = $this->makeRequest('/payments/notify-success', 'POST', $paymentData);
        
        if ($response['status'] === 200) {
            $this->logResult('MWK Payment', 'PASS', 'MWK payment processed successfully');
        } else {
            $this->logResult('MWK Payment', 'FAIL', "HTTP {$response['status']} - " . ($response['decoded']['error'] ?? $response['body']));
        }
    }
    
    private function testGbpPayment() {
        echo "\n3. GBP PAYMENT PROCESSING (UK)\n";
        echo str_repeat("-", 25) . "\n";
        
        $paymentData = [
            'txRef' => $this->testTxRef . '_GBP',
            'amount' => 10000, // GBP £100
            'currency' => 'GBP',
            'customerEmail' => 'test.uk@sparkle-pro.co.uk',
            'paymentStatus' => 'success',
            'items' => [
                [
                    'id' => 'test-item-gbp',
                    'name' => 'Test Gadget - UK Payment',
                    'price' => 10000,
                    'quantity' => 1,
                    'brand' => 'TestBrand'
                ]
            ]
        ];
        
        $response = $this->makeRequest('/payments/notify-success', 'POST', $paymentData);
        
        if ($response['status'] === 200) {
            $this->logResult('GBP Payment', 'PASS', 'GBP payment processed successfully');
        } else {
            $this->logResult('GBP Payment', 'FAIL', "HTTP {$response['status']} - " . ($response['decoded']['error'] ?? $response['body']));
        }
    }
    
    private function verifyAdminDashboard() {
        echo "\n4. ADMIN DASHBOARD VERIFICATION\n";
        echo str_repeat("-", 25) . "\n";
        
        // Check analytics dashboard for updated data
        $response = $this->makeRequest('/analytics/dashboard?timeRange=1d');
        
        if ($response['status'] === 200 && $response['decoded']['success']) {
            $data = $response['decoded']['data'];
            $this->logResult('Admin Dashboard', 'PASS', 'Dashboard accessible');
            
            // Show current statistics
            if (isset($data['order_stats'])) {
                $stats = $data['order_stats'];
                $this->logResult('Order Statistics', 'INFO', 'Current order counts', [
                    'total_orders' => $stats['total_orders'],
                    'pending_orders' => $stats['pending_orders'],
                    'completed_orders' => $stats['completed_orders']
                ]);
            }
            
            if (isset($data['revenue_stats'])) {
                $revenue = $data['revenue_stats'];
                $this->logResult('Revenue Statistics', 'INFO', 'Current revenue', [
                    'mwk_total' => $revenue['mwk']['total'] ?? 'N/A',
                    'gbp_total' => $revenue['gbp']['total'] ?? 'N/A',
                    'last_updated' => $data['last_updated']
                ]);
            }
            
        } else {
            $this->logResult('Admin Dashboard', 'FAIL', "HTTP {$response['status']}");
        }
    }
    
    private function generateReport() {
        echo "\n" . str_repeat("=", 45) . "\n";
        echo "📋 PAYMENT TEST RESULTS\n";
        echo str_repeat("=", 45) . "\n";
        
        $passed = count(array_filter($this->testResults, fn($r) => $r['status'] === 'PASS'));
        $failed = count(array_filter($this->testResults, fn($r) => $r['status'] === 'FAIL'));
        $total = count($this->testResults);
        
        echo "\nSUMMARY:\n";
        echo "Total Tests: {$total}\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "📈 Success Rate: " . round(($passed / max($total, 1)) * 100, 1) . "%\n";
        
        if ($failed === 0) {
            echo "\n🎉 ALL TESTS PASSED!\n";
            echo "Payment recording system is working correctly.\n";
        } else {
            echo "\n⚠️  SOME TESTS FAILED\n";
            echo "Review the failed tests above.\n";
        }
        
        // Save report
        $filename = 'corrected_payment_test_' . date('Y-m-d_H-i-s') . '.json';
        $report = [
            'test_run' => date('Y-m-d H:i:s'),
            'test_transaction_ref' => $this->testTxRef,
            'api_base_url' => $this->apiBaseUrl,
            'results' => $this->testResults,
            'summary' => [
                'total_tests' => $total,
                'passed' => $passed,
                'failed' => $failed,
                'success_rate' => round(($passed / max($total, 1)) * 100, 1)
            ]
        ];
        
        file_put_contents($filename, json_encode($report, JSON_PRETTY_PRINT));
        echo "\n📝 Report saved to: {$filename}\n";
    }
}

// Run the test
if (php_sapi_name() === 'cli') {
    $apiUrl = $argv[1] ?? 'https://sparkle-pro.co.uk/api/';
    $tester = new CorrectedPaymentTest($apiUrl);
    $tester->runTest();
} else {
    header('Content-Type: text/plain');
    echo "Run from command line: php " . basename(__FILE__) . " [api_base_url]\n";
}
?>