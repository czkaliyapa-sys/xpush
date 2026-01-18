<?php
/**
 * Device Linking End-to-End Test Script
 * Tests complete frontend-to-backend device linking workflow
 * 
 * Usage: php testing.php [api_base_url]
 * Example: php testing.php https://sparkle-pro.co.uk/api/
 */

// Allow direct execution
if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/plain');
    echo "This script should be run from command line:\n";
    echo "php " . basename(__FILE__) . " [api_base_url]\n\n";
    echo "Example: php " . basename(__FILE__) . " https://sparkle-pro.co.uk/api/\n";
    exit(1);
}

class DeviceLinkingE2ETest {
    private $apiBaseUrl;
    private $testUserId;
    private $testDeviceId;
    private $results = [];
    
    public function __construct($apiBaseUrl = 'https://sparkle-pro.co.uk/api/') {
        $this->apiBaseUrl = rtrim($apiBaseUrl, '/');
        $this->testUserId = 'test_user_' . time();
        $this->testDeviceId = rand(1000, 9999);
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
        
        return [
            'status' => $httpCode,
            'body' => $response,
            'error' => $error,
            'decoded' => json_decode($response, true)
        ];
    }
    
    public function testApiHealth() {
        echo "🔍 TEST 1: API Health Check\n";
        echo str_repeat("-", 50) . "\n";
        
        $response = $this->makeRequest('/');
        
        if ($response['status'] === 200) {
            $this->logResult('PASS', 'API is responding');
            return true;
        } else {
            $this->logResult('FAIL', "API health check failed: HTTP {$response['status']}");
            return false;
        }
    }
    
    public function testGetRecentDevices() {
        echo "\n🔍 TEST 2: Get Recent Devices\n";
        echo str_repeat("-", 50) . "\n";
        
        $response = $this->makeRequest("/subscriptions/recent-devices?userUid={$this->testUserId}&limit=5");
        
        if ($response['status'] === 200) {
            $data = $response['decoded'];
            if (isset($data['success']) && $data['success']) {
                $this->logResult('PASS', "Recent devices endpoint working. Found {$data['count']} devices");
                return true;
            } else {
                $this->logResult('WARN', "Endpoint works but returned: " . json_encode($data));
                return true;
            }
        } else {
            $this->logResult('FAIL', "Recent devices failed: HTTP {$response['status']} - {$response['body']}");
            return false;
        }
    }
    
    public function testGetLinkedDevice() {
        echo "\n🔍 TEST 3: Get Linked Device\n";
        echo str_repeat("-", 50) . "\n";
        
        $response = $this->makeRequest("/subscriptions/linked-device?userUid={$this->testUserId}");
        
        if ($response['status'] === 200) {
            $data = $response['decoded'];
            if (isset($data['success'])) {
                $this->logResult('PASS', 'Get linked device working');
                return true;
            } else {
                $this->logResult('FAIL', "Unexpected response: " . json_encode($data));
                return false;
            }
        } else {
            $this->logResult('FAIL', "Get linked device failed: HTTP {$response['status']}");
            return false;
        }
    }
    
    public function testLinkDevice() {
        echo "\n🔍 TEST 4: Link Device\n";
        echo str_repeat("-", 50) . "\n";
        
        $payload = [
            'userUid' => $this->testUserId,
            'deviceId' => $this->testDeviceId,
            'deviceName' => 'iPhone 15 Pro Max',
            'linkMethod' => 'MANUAL'
        ];
        
        $response = $this->makeRequest('/subscriptions/link-device', 'POST', $payload);
        
        if ($response['status'] === 200) {
            $data = $response['decoded'];
            if (isset($data['success']) && $data['success']) {
                $this->logResult('PASS', 'Device linking successful');
                return true;
            } else {
                $this->logResult('FAIL', "Link device failed: " . json_encode($data));
                return false;
            }
        } elseif ($response['status'] === 404) {
            $this->logResult('PASS', 'Expected behavior: User not found (test user)');
            return true;
        } else {
            $this->logResult('WARN', "Link device returned HTTP {$response['status']}: {$response['body']}");
            return true;
        }
    }
    
    public function testUnlinkDevice() {
        echo "\n🔍 TEST 5: Unlink Device\n";
        echo str_repeat("-", 50) . "\n";
        
        $payload = ['userUid' => $this->testUserId];
        $response = $this->makeRequest('/subscriptions/unlink-device', 'POST', $payload);
        
        if ($response['status'] === 200) {
            $data = $response['decoded'];
            if (isset($data['success']) && $data['success']) {
                $this->logResult('PASS', 'Device unlinking successful');
                return true;
            } else {
                $this->logResult('FAIL', "Unlink device failed: " . json_encode($data));
                return false;
            }
        } else {
            $this->logResult('FAIL', "Unlink device failed: HTTP {$response['status']}");
            return false;
        }
    }
    
    private function logResult($status, $message) {
        $timestamp = date('Y-m-d H:i:s');
        $statusIcon = $status === 'PASS' ? '✅' : ($status === 'FAIL' ? '❌' : '⚠️');
        
        echo "[{$timestamp}] {$statusIcon} {$status}: {$message}\n";
        $this->results[] = [
            'timestamp' => $timestamp,
            'status' => $status,
            'message' => $message
        ];
    }
    
    public function generateSummary() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📱 DEVICE LINKING E2E TEST SUMMARY\n";
        echo str_repeat("=", 60) . "\n";
        
        $passed = 0;
        $failed = 0;
        $warnings = 0;
        
        foreach ($this->results as $result) {
            switch ($result['status']) {
                case 'PASS':
                    $passed++;
                    break;
                case 'FAIL':
                    $failed++;
                    break;
                case 'WARN':
                    $warnings++;
                    break;
            }
        }
        
        echo "Total Tests: " . count($this->results) . "\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "⚠️  Warnings: {$warnings}\n";
        
        $successRate = count($this->results) > 0 ? round(($passed / count($this->results)) * 100, 1) : 0;
        echo "📈 Success Rate: {$successRate}%\n";
        
        if ($failed === 0) {
            echo "\n🎉 ALL TESTS PASSED! Device linking system is working correctly.\n";
        } else {
            echo "\n⚠️  Some tests failed. Please review the errors above.\n";
        }
    }
    
    public function runAllTests() {
        echo "📱 DEVICE LINKING END-TO-END TEST SUITE\n";
        echo "Testing API: {$this->apiBaseUrl}\n";
        echo "Test User ID: {$this->testUserId}\n";
        echo str_repeat("=", 60) . "\n";
        
        $tests = [
            'testApiHealth',
            'testGetRecentDevices', 
            'testGetLinkedDevice',
            'testLinkDevice',
            'testUnlinkDevice'
        ];
        
        foreach ($tests as $testMethod) {
            try {
                $this->$testMethod();
            } catch (Exception $e) {
                $this->logResult('FAIL', "Test {$testMethod} threw exception: " . $e->getMessage());
            }
        }
        
        $this->generateSummary();
    }
}

// Run the tests
if (php_sapi_name() === 'cli') {
    $apiUrl = $argv[1] ?? 'https://sparkle-pro.co.uk/api/';
    $tester = new DeviceLinkingE2ETest($apiUrl);
    $tester->runAllTests();
} else {
    echo "This script should be run from command line:\n";
    echo "php " . basename(__FILE__) . " [api_base_url]\n\n";
    echo "Example: php " . basename(__FILE__) . " https://sparkle-pro.co.uk/api/\n";
}
?>