<?php
/**
 * Critical Application Fixes
 * 
 * This file contains critical fixes for the application code to address
 * data integrity, payment processing, and error handling issues.
 */

// 1. Enhanced Database Connection Class with Better Error Handling
class SafeDatabaseConnection {
    private static $instance = null;
    private $connection = null;
    private $config = [
        'host' => 'localhost',
        'username' => 'xuser',
        'password' => 'Xpush2025?',
        'database' => 'itsxtrapush_db'
    ];
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $this->connection = new mysqli(
                $this->config['host'],
                $this->config['username'],
                $this->config['password'],
                $this->config['database']
            );
            
            if ($this->connection->connect_error) {
                throw new Exception("Database connection failed: " . $this->connection->connect_error);
            }
            
            // Set charset
            $this->connection->set_charset('utf8mb4');
            
        } catch (Exception $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getConnection() {
        if (!$this->connection || !$this->connection->ping()) {
            $this->connect();
        }
        return $this->connection;
    }
    
    public function close() {
        if ($this->connection) {
            $this->connection->close();
            $this->connection = null;
        }
    }
    
    public function __destruct() {
        $this->close();
    }
}

// 2. Payment Processor with Idempotency and Validation
class CriticalPaymentProcessor {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = SafeDatabaseConnection::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Process payment with full idempotency and validation
     */
    public function processPayment($txRef, $paymentData) {
        // Validate required data
        $validation = $this->validatePaymentData($paymentData);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => $validation['error'],
                'error_code' => 'VALIDATION_FAILED'
            ];
        }
        
        // Check if already processed (idempotency)
        if ($this->isTransactionProcessed($txRef)) {
            return [
                'success' => true,
                'message' => 'Transaction already processed',
                'duplicate' => true
            ];
        }
        
        // Begin transaction
        $this->conn->begin_transaction();
        
        try {
            // Verify payment with gateway (placeholder for actual verification)
            $verification = $this->verifyPaymentWithGateway($txRef, $paymentData);
            if (!$verification['verified']) {
                throw new Exception($verification['error']);
            }
            
            // Validate amount consistency
            if (!$this->validateAmountConsistency($paymentData, $verification)) {
                throw new Exception('Payment amount mismatch detected');
            }
            
            // Check stock availability
            $stockCheck = $this->checkStockAvailability($paymentData['items'] ?? []);
            if (!$stockCheck['available']) {
                throw new Exception('Insufficient stock for requested items: ' . implode(', ', $stockCheck['shortages']));
            }
            
            // Create or update order
            $orderResult = $this->createOrUpdateOrder($txRef, $paymentData);
            if (!$orderResult['success']) {
                throw new Exception($orderResult['error']);
            }
            
            // Update inventory with locking
            $this->updateInventory($paymentData['items'] ?? []);
            
            // Record successful transaction
            $this->recordProcessedTransaction($txRef, $paymentData);
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'success' => true,
                'order_id' => $orderResult['order_id'],
                'message' => 'Payment processed successfully'
            ];
            
        } catch (Exception $e) {
            // Rollback on any error
            $this->conn->rollback();
            error_log("Payment processing failed for $txRef: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_code' => 'PAYMENT_PROCESSING_FAILED'
            ];
        }
    }
    
    private function validatePaymentData($data) {
        $required = ['amount', 'currency', 'customerEmail'];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return [
                    'valid' => false,
                    'error' => "Missing required field: $field"
                ];
            }
        }
        
        // Validate currency
        if (!in_array($data['currency'], ['MWK', 'GBP'])) {
            return [
                'valid' => false,
                'error' => 'Invalid currency code. Must be MWK or GBP'
            ];
        }
        
        // Validate amount
        if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
            return [
                'valid' => false,
                'error' => 'Invalid payment amount'
            ];
        }
        
        return ['valid' => true];
    }
    
    private function isTransactionProcessed($txRef) {
        $stmt = $this->conn->prepare("
            SELECT id FROM processed_transactions 
            WHERE tx_ref = ? 
            AND processed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->bind_param('s', $txRef);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        $stmt->close();
        
        return $exists;
    }
    
    private function verifyPaymentWithGateway($txRef, $paymentData) {
        // In production, this would integrate with actual payment gateways
        // For now, simulate verification
        return [
            'verified' => true,
            'gateway_amount' => $paymentData['amount'],
            'gateway_currency' => $paymentData['currency']
        ];
    }
    
    private function validateAmountConsistency($expected, $actual) {
        $tolerance = 0.01; // 1 cent/penny tolerance
        
        if ($expected['currency'] !== $actual['gateway_currency']) {
            return false;
        }
        
        return abs($expected['amount'] - $actual['gateway_amount']) <= $tolerance;
    }
    
    private function checkStockAvailability($items) {
        $availability = [
            'available' => true,
            'shortages' => []
        ];
        
        foreach ($items as $item) {
            $gadgetId = $item['gadget_id'] ?? null;
            $variantId = $item['variant_id'] ?? null;
            $quantity = $item['quantity'] ?? 1;
            
            if ($variantId) {
                $stmt = $this->conn->prepare("
                    SELECT stock_quantity 
                    FROM gadget_variants 
                    WHERE id = ? AND stock_quantity >= ?
                    FOR UPDATE
                ");
                $stmt->bind_param('ii', $variantId, $quantity);
            } else {
                $stmt = $this->conn->prepare("
                    SELECT stock_quantity 
                    FROM gadgets 
                    WHERE id = ? AND stock_quantity >= ?
                    FOR UPDATE
                ");
                $stmt->bind_param('ii', $gadgetId, $quantity);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $availability['available'] = false;
                $availability['shortages'][] = $gadgetId ?? $variantId;
            }
            $stmt->close();
        }
        
        return $availability;
    }
    
    private function createOrUpdateOrder($txRef, $paymentData) {
        // Check if order already exists
        $stmt = $this->conn->prepare("
            SELECT id, payment_status 
            FROM orders 
            WHERE external_tx_ref = ?
        ");
        $stmt->bind_param('s', $txRef);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $existingOrder = $result->fetch_assoc();
            $stmt->close();
            
            // If already paid, return existing order
            if ($existingOrder['payment_status'] === 'paid') {
                return [
                    'success' => true,
                    'order_id' => $existingOrder['id'],
                    'existing' => true
                ];
            }
            
            // Update existing pending order
            $updateStmt = $this->conn->prepare("
                UPDATE orders 
                SET payment_status = 'paid',
                    paid_at = NOW(),
                    status = 'confirmed'
                WHERE id = ?
            ");
            $updateStmt->bind_param('i', $existingOrder['id']);
            $updateStmt->execute();
            $updateStmt->close();
            
            return [
                'success' => true,
                'order_id' => $existingOrder['id'],
                'existing' => true
            ];
        }
        $stmt->close();
        
        // Create new order with proper GBP handling
        return $this->createNewOrder($txRef, $paymentData);
    }
    
    private function createNewOrder($txRef, $paymentData) {
        // Resolve user by email
        $userId = null;
        if (!empty($paymentData['customerEmail'])) {
            $userStmt = $this->conn->prepare("
                SELECT id FROM users WHERE email = ? LIMIT 1
            ");
            $userStmt->bind_param('s', $paymentData['customerEmail']);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            if ($userRow = $userResult->fetch_assoc()) {
                $userId = $userRow['id'];
            }
            $userStmt->close();
        }
        
        // Calculate GBP amount if needed
        $amount = $paymentData['amount'];
        $currency = $paymentData['currency'];
        $amountGbp = $currency === 'GBP' ? $amount : round($amount / 2800, 2);
        
        // Insert order with all required fields
        $orderStmt = $this->conn->prepare("
            INSERT INTO orders 
            (user_id, external_tx_ref, provider, total_amount, total_amount_gbp, 
             currency, status, payment_status, paid_at, shipping_address, billing_address, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'paid', NOW(), ?, ?, ?)
        ");
        
        $provider = $paymentData['provider'] ?? ($currency === 'GBP' ? 'square' : 'paychangu');
        $shippingAddr = $paymentData['shipping_address'] ?? '';
        $billingAddr = $paymentData['billing_address'] ?? $shippingAddr;
        $notes = json_encode($paymentData);
        
        $orderStmt->bind_param(
            'issddsssss', 
            $userId, $txRef, $provider, $amount, $amountGbp, 
            $currency, $shippingAddr, $billingAddr, $notes
        );
        
        if (!$orderStmt->execute()) {
            $orderStmt->close();
            throw new Exception("Failed to create order: " . $this->conn->error);
        }
        
        $orderId = $orderStmt->insert_id;
        $orderStmt->close();
        
        // Create order items if provided
        if (!empty($paymentData['items'])) {
            $this->createOrderItems($orderId, $paymentData['items']);
        }
        
        return [
            'success' => true,
            'order_id' => $orderId
        ];
    }
    
    private function createOrderItems($orderId, $items) {
        foreach ($items as $item) {
            $stmt = $this->conn->prepare("
                INSERT INTO order_items 
                (order_id, gadget_id, variant_id, item_type, storage, quantity, 
                 unit_price, unit_price_gbp, total_price, total_price_gbp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $gadgetId = $item['gadget_id'] ?? null;
            $variantId = $item['variant_id'] ?? null;
            $itemType = $item['item_type'] ?? 'admin_gadget';
            $storage = $item['storage'] ?? null;
            $quantity = $item['quantity'] ?? 1;
            $unitPrice = $item['price'] ?? 0;
            $unitPriceGbp = $item['price_gbp'] ?? ($item['currency'] === 'GBP' ? $unitPrice : round($unitPrice / 2800, 2));
            $totalPrice = $unitPrice * $quantity;
            $totalPriceGbp = $unitPriceGbp * $quantity;
            
            $stmt->bind_param(
                'iiissidddd',
                $orderId, $gadgetId, $variantId, $itemType, $storage, $quantity,
                $unitPrice, $unitPriceGbp, $totalPrice, $totalPriceGbp
            );
            
            $stmt->execute();
            $stmt->close();
        }
    }
    
    private function updateInventory($items) {
        foreach ($items as $item) {
            $quantity = $item['quantity'] ?? 1;
            
            if (!empty($item['variant_id'])) {
                // Update variant stock
                $stmt = $this->conn->prepare("
                    UPDATE gadget_variants 
                    SET stock_quantity = GREATEST(stock_quantity - ?, 0)
                    WHERE id = ?
                ");
                $stmt->bind_param('ii', $quantity, $item['variant_id']);
                $stmt->execute();
                $stmt->close();
                
                // Update parent gadget stock
                $this->updateParentGadgetStock($item['gadget_id']);
                
            } elseif (!empty($item['gadget_id'])) {
                // Update gadget stock
                $stmt = $this->conn->prepare("
                    UPDATE gadgets 
                    SET stock_quantity = GREATEST(stock_quantity - ?, 0),
                        in_stock = CASE WHEN stock_quantity - ? > 0 THEN 1 ELSE 0 END
                    WHERE id = ?
                ");
                $stmt->bind_param('iii', $quantity, $quantity, $item['gadget_id']);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
    
    private function updateParentGadgetStock($gadgetId) {
        $stmt = $this->conn->prepare("
            UPDATE gadgets g
            SET 
                stock_quantity = (
                    SELECT COALESCE(SUM(stock_quantity), 0) 
                    FROM gadget_variants gv 
                    WHERE gv.gadget_id = g.id
                ),
                in_stock = (
                    SELECT CASE 
                        WHEN COALESCE(SUM(stock_quantity), 0) > 0 THEN 1 
                        ELSE 0 
                    END
                    FROM gadget_variants gv 
                    WHERE gv.gadget_id = g.id
                )
            WHERE g.id = ?
        ");
        $stmt->bind_param('i', $gadgetId);
        $stmt->execute();
        $stmt->close();
    }
    
    private function recordProcessedTransaction($txRef, $paymentData) {
        $stmt = $this->conn->prepare("
            INSERT INTO processed_transactions 
            (tx_ref, amount, currency, user_id)
            VALUES (?, ?, ?, ?)
        ");
        
        $userId = null;
        if (!empty($paymentData['customerEmail'])) {
            $userStmt = $this->conn->prepare("
                SELECT id FROM users WHERE email = ? LIMIT 1
            ");
            $userStmt->bind_param('s', $paymentData['customerEmail']);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            if ($userRow = $userResult->fetch_assoc()) {
                $userId = $userRow['id'];
            }
            $userStmt->close();
        }
        
        $stmt->bind_param(
            'sdii', 
            $txRef, 
            $paymentData['amount'], 
            $paymentData['currency'], 
            $userId
        );
        $stmt->execute();
        $stmt->close();
    }
}

// 3. Standardized Error Handler
class CriticalErrorHandler {
    const ERROR_CODES = [
        'VALIDATION_FAILED' => ['code' => 422, 'message' => 'Validation failed'],
        'PAYMENT_PROCESSING_FAILED' => ['code' => 500, 'message' => 'Payment processing failed'],
        'INSUFFICIENT_STOCK' => ['code' => 422, 'message' => 'Insufficient stock'],
        'DUPLICATE_TRANSACTION' => ['code' => 422, 'message' => 'Duplicate transaction'],
        'DATABASE_ERROR' => ['code' => 500, 'message' => 'Database error'],
        'INVALID_CURRENCY' => ['code' => 422, 'message' => 'Invalid currency'],
        'INVALID_PAYMENT_STATUS' => ['code' => 422, 'message' => 'Invalid payment status']
    ];
    
    public static function sendError($errorCode, $additionalData = []) {
        if (!isset(self::ERROR_CODES[$errorCode])) {
            $errorCode = 'DATABASE_ERROR';
        }
        
        $errorInfo = self::ERROR_CODES[$errorCode];
        http_response_code($errorInfo['code']);
        
        $response = [
            'success' => false,
            'error' => $errorInfo['message'],
            'error_code' => $errorCode,
            'timestamp' => date('c')
        ];
        
        if (!empty($additionalData)) {
            $response['details'] = $additionalData;
        }
        
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
    
    public static function sendSuccess($data = [], $message = 'Operation completed successfully') {
        $response = [
            'success' => true,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if (!empty($data)) {
            $response = array_merge($response, $data);
        }
        
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
}

// 4. Usage example in your existing index.php
/*
// Replace your existing payment processing with this enhanced version:

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === '/payments/notify-success') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $processor = new CriticalPaymentProcessor();
    $result = $processor->processPayment($input['txRef'], $input);
    
    if ($result['success']) {
        CriticalErrorHandler::sendSuccess([
            'order_id' => $result['order_id'],
            'message' => $result['message'] ?? 'Payment processed successfully'
        ]);
    } else {
        CriticalErrorHandler::sendError($result['error_code'] ?? 'PAYMENT_PROCESSING_FAILED', [
            'details' => $result['error']
        ]);
    }
}
*/

?>