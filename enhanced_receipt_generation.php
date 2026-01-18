<?php
/**
 * Enhanced Receipt Generation System
 * 
 * Provides complete and accurate receipt data for all orders including:
 * - Detailed gadget information
 * - Complete installment plan details
 * - Accurate currency handling
 * - Proper itemized breakdowns
 */

require_once __DIR__ . '/sparkle-pro-api/config.php';

/**
 * Generate comprehensive receipt data for an order
 */
function generateCompleteReceiptData($orderId) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    
    if (!$conn || $conn->connect_errno) {
        return ['success' => false, 'error' => 'Database connection failed'];
    }
    
    $orderId = (int)$orderId;
    if ($orderId <= 0) {
        return ['success' => false, 'error' => 'Invalid order ID'];
    }
    
    try {
        // Get order details with user information
        $orderStmt = $conn->prepare("
            SELECT o.*, u.email, u.display_name, u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
            LIMIT 1
        ");
        
        if (!$orderStmt) {
            return ['success' => false, 'error' => 'Failed to prepare order query'];
        }
        
        $orderStmt->bind_param('i', $orderId);
        $orderStmt->execute();
        $orderResult = $orderStmt->get_result();
        
        if ($orderResult->num_rows === 0) {
            return ['success' => false, 'error' => 'Order not found'];
        }
        
        $order = $orderResult->fetch_assoc();
        $orderStmt->close();
        
        // Get order items with complete gadget details
        $itemsStmt = $conn->prepare("
            SELECT oi.*, 
                   g.name as gadget_name, g.brand, g.model, g.image_url, g.description,
                   g.category, g.specifications,
                   gv.storage, gv.color, gv.condition, gv.price_adjustment,
                   sg.name as seller_gadget_name, sg.brand as seller_brand,
                   sg.model as seller_model, sg.images as seller_images
            FROM order_items oi
            LEFT JOIN gadgets g ON oi.gadget_id = g.id
            LEFT JOIN gadget_variants gv ON oi.variant_id = gv.id
            LEFT JOIN seller_gadgets sg ON oi.seller_gadget_id = sg.id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        ");
        
        if (!$itemsStmt) {
            return ['success' => false, 'error' => 'Failed to prepare items query'];
        }
        
        $itemsStmt->bind_param('i', $orderId);
        $itemsStmt->execute();
        $itemsResult = $itemsStmt->get_result();
        
        $items = [];
        while ($item = $itemsResult->fetch_assoc()) {
            $items[] = [
                'id' => $item['id'],
                'gadget_id' => $item['gadget_id'],
                'seller_gadget_id' => $item['seller_gadget_id'],
                'item_type' => $item['item_type'],
                'name' => $item['gadget_name'] ?: $item['seller_gadget_name'] ?: 'Custom Item',
                'brand' => $item['brand'] ?: $item['seller_brand'] ?: '',
                'model' => $item['model'] ?: $item['seller_model'] ?: '',
                'description' => $item['description'] ?: '',
                'category' => $item['category'] ?: '',
                'specifications' => $item['specifications'] ? json_decode($item['specifications'], true) : [],
                'image' => $item['image_url'] ?: ($item['seller_images'] ? json_decode($item['seller_images'], true)[0] ?? '' : ''),
                'storage' => $item['storage'] ?: '',
                'color' => $item['color'] ?: '',
                'condition' => $item['condition'] ?: '',
                'quantity' => (int)$item['quantity'],
                'unit_price' => (float)$item['unit_price'],
                'unit_price_gbp' => (float)$item['unit_price_gbp'],
                'total_price' => (float)$item['total_price'],
                'total_price_gbp' => (float)$item['total_price_gbp'],
                'price_adjustment' => (float)($item['price_adjustment'] ?? 0)
            ];
        }
        $itemsStmt->close();
        
        // Get installment plan details (if exists)
        $installmentPlan = null;
        $installmentStmt = $conn->prepare("
            SELECT ip.*, 
                   COUNT(ipmt.id) as payments_made,
                   COALESCE(SUM(ipmt.amount), 0) as total_paid,
                   MAX(ipmt.paid_at) as last_payment_date
            FROM installment_plans ip
            LEFT JOIN installment_payments ipmt ON ip.id = ipmt.plan_id
            WHERE ip.order_id = ?
            GROUP BY ip.id
            LIMIT 1
        ");
        
        if ($installmentStmt) {
            $installmentStmt->bind_param('i', $orderId);
            $installmentStmt->execute();
            $installmentResult = $installmentStmt->get_result();
            
            if ($installmentResult->num_rows > 0) {
                $plan = $installmentResult->fetch_assoc();
                $installmentPlan = [
                    'id' => $plan['id'],
                    'weeks' => (int)$plan['weeks'],
                    'deposit_amount' => (float)$plan['deposit_amount'],
                    'weekly_amount' => (float)$plan['weekly_amount'],
                    'total_amount' => (float)$plan['total_amount'],
                    'amount_paid' => (float)$plan['total_paid'],
                    'remaining_amount' => max(0, (float)$plan['total_amount'] - (float)$plan['total_paid']),
                    'payments_made' => (int)$plan['payments_made'],
                    'start_date' => $plan['start_at'],
                    'expiry_date' => $plan['expiry_at'],
                    'next_due_date' => $plan['next_due_at'],
                    'status' => $plan['status'],
                    'last_payment_date' => $plan['last_payment_date']
                ];
            }
            $installmentStmt->close();
        }
        
        // Calculate totals in correct currency
        $currency = $order['currency'] ?: 'MWK';
        $totalAmount = $currency === 'GBP' ? 
            ($order['total_amount_gbp'] ?: round($order['total_amount'] / 2800, 2)) : 
            $order['total_amount'];
            
        // Format dates
        $orderDate = date('F j, Y g:i A', strtotime($order['created_at']));
        $paymentDate = $order['paid_at'] ? date('F j, Y g:i A', strtotime($order['paid_at'])) : null;
        
        // Generate receipt data
        $receiptData = [
            'success' => true,
            'receipt' => [
                // Order Information
                'order_id' => $order['id'],
                'order_number' => '#' . $order['id'],
                'order_date' => $orderDate,
                'payment_date' => $paymentDate,
                'status' => $order['status'],
                'provider' => $order['provider'],
                'currency' => $currency,
                
                // Customer Information
                'customer' => [
                    'name' => $order['display_name'] ?: 'Customer',
                    'email' => $order['email'],
                    'phone' => $order['phone'] ?: ''
                ],
                
                // Financial Summary
                'totals' => [
                    'subtotal' => $totalAmount,
                    'tax' => 0, // Add tax calculation if needed
                    'shipping' => 0, // Add shipping if applicable
                    'discount' => 0, // Add discount if applicable
                    'total' => $totalAmount
                ],
                
                // Items
                'items' => $items,
                
                // Installment Plan (if applicable)
                'installment_plan' => $installmentPlan,
                
                // Company Information
                'company' => [
                    'name' => 'Xtrapush Gadgets',
                    'address' => 'Blantyre, Malawi',
                    'phone' => '+265 888 888 888',
                    'email' => 'support@itsxtrapush.com',
                    'website' => 'https://itsxtrapush.com'
                ]
            ]
        ];
        
        return $receiptData;
        
    } catch (Exception $e) {
        error_log("Receipt generation error for order $orderId: " . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to generate receipt: ' . $e->getMessage()];
    }
}

/**
 * Generate HTML receipt for printing/email
 */
function generateHTMLReceipt($orderId) {
    $receiptData = generateCompleteReceiptData($orderId);
    
    if (!$receiptData['success']) {
        return '<div class="error">Failed to generate receipt: ' . htmlspecialchars($receiptData['error']) . '</div>';
    }
    
    $receipt = $receiptData['receipt'];
    $currencySymbol = $receipt['currency'] === 'GBP' ? '£' : 'MK';
    
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Receipt #' . $receipt['order_id'] . '</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt-header { text-align: center; margin-bottom: 30px; }
            .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .company-info { font-size: 14px; color: #666; }
            .order-info { margin: 20px 0; }
            .info-row { margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .totals-section { margin-top: 20px; text-align: right; }
            .total-row { font-weight: bold; font-size: 16px; }
            .installment-section { margin-top: 30px; padding: 15px; background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <div class="receipt-header">
            <div class="receipt-title">' . htmlspecialchars($receipt['company']['name']) . '</div>
            <div class="company-info">
                ' . htmlspecialchars($receipt['company']['address']) . '<br>
                Phone: ' . htmlspecialchars($receipt['company']['phone']) . '<br>
                Email: ' . htmlspecialchars($receipt['company']['email']) . '<br>
                Website: ' . htmlspecialchars($receipt['company']['website']) . '
            </div>
        </div>
        
        <div class="order-info">
            <h2>Receipt #' . $receipt['order_id'] . '</h2>
            <div class="info-row"><strong>Date:</strong> ' . $receipt['order_date'] . '</div>
            <div class="info-row"><strong>Customer:</strong> ' . htmlspecialchars($receipt['customer']['name']) . '</div>
            <div class="info-row"><strong>Email:</strong> ' . htmlspecialchars($receipt['customer']['email']) . '</div>
            <div class="info-row"><strong>Payment Method:</strong> ' . strtoupper($receipt['provider']) . '</div>
            <div class="info-row"><strong>Status:</strong> ' . strtoupper($receipt['status']) . '</div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>';
    
    foreach ($receipt['items'] as $item) {
        $unitPrice = $receipt['currency'] === 'GBP' ? $item['unit_price_gbp'] : $item['unit_price'];
        $totalPrice = $receipt['currency'] === 'GBP' ? $item['total_price_gbp'] : $item['total_price'];
        
        $itemName = htmlspecialchars($item['name']);
        if ($item['storage']) $itemName .= ' (' . htmlspecialchars($item['storage']) . ')';
        if ($item['color']) $itemName .= ' - ' . htmlspecialchars($item['color']);
        if ($item['condition']) $itemName .= ' (' . htmlspecialchars($item['condition']) . ')';
        
        $html .= '
                <tr>
                    <td>' . $itemName . '</td>
                    <td>' . $item['quantity'] . '</td>
                    <td>' . $currencySymbol . number_format($unitPrice, 2) . '</td>
                    <td>' . $currencySymbol . number_format($totalPrice, 2) . '</td>
                </tr>';
    }
    
    $html .= '
            </tbody>
        </table>
        
        <div class="totals-section">
            <div class="total-row">Total: ' . $currencySymbol . number_format($receipt['totals']['total'], 2) . '</div>
        </div>';
    
    if ($receipt['installment_plan']) {
        $plan = $receipt['installment_plan'];
        $html .= '
        <div class="installment-section">
            <h3>Installment Plan Details</h3>
            <div class="info-row"><strong>Plan:</strong> ' . $plan['weeks'] . '-week plan</div>
            <div class="info-row"><strong>Deposit:</strong> ' . $currencySymbol . number_format($plan['deposit_amount'], 2) . '</div>
            <div class="info-row"><strong>Weekly Payment:</strong> ' . $currencySymbol . number_format($plan['weekly_amount'], 2) . '</div>
            <div class="info-row"><strong>Total Amount:</strong> ' . $currencySymbol . number_format($plan['total_amount'], 2) . '</div>
            <div class="info-row"><strong>Amount Paid:</strong> ' . $currencySymbol . number_format($plan['amount_paid'], 2) . '</div>
            <div class="info-row"><strong>Remaining Balance:</strong> ' . $currencySymbol . number_format($plan['remaining_amount'], 2) . '</div>
            <div class="info-row"><strong>Payments Made:</strong> ' . $plan['payments_made'] . '</div>
            <div class="info-row"><strong>Status:</strong> ' . ucfirst($plan['status']) . '</div>
        </div>';
    }
    
    $html .= '
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #888;">
            Thank you for your purchase!<br>
            This is an official receipt from ' . htmlspecialchars($receipt['company']['name']) . '
        </div>
    </body>
    </html>';
    
    return $html;
}

/**
 * API endpoint for receipt generation
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['orderId'])) {
    header('Content-Type: application/json');
    
    $orderId = (int)$_GET['orderId'];
    $format = $_GET['format'] ?? 'json';
    
    if ($format === 'html') {
        header('Content-Type: text/html');
        echo generateHTMLReceipt($orderId);
    } else {
        echo json_encode(generateCompleteReceiptData($orderId));
    }
    exit;
}
?>