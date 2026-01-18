<?php
/**
 * Optimized Data Retrieval Functions
 * 
 * Performance-enhanced versions of key data fetching functions
 * Focus on reducing database queries and improving join efficiency
 */

/**
 * Optimized fetchOrderItems with improved performance
 * 
 * Key optimizations:
 * 1. Single query with all necessary joins
 * 2. Better NULL handling and fallback logic
 * 3. Reduced redundant queries
 * 4. Improved data structure for frontend consumption
 */
function fetchOrderItemsOptimized($conn, $orderId) {
    try {
        // Optimized query with all joins in single statement
        $sql = "
            SELECT 
                oi.id,
                oi.order_id,
                oi.item_type,
                oi.quantity,
                oi.unit_price,
                oi.unit_price_gbp,
                oi.total_price,
                oi.total_price_gbp,
                oi.storage as item_storage,
                oi.variant_id,
                oi.gadget_id,
                oi.seller_gadget_id,
                oi.seller_id,
                oi.created_at,
                
                -- Admin gadget data (LEFT JOIN)
                g.id as gadget_id_joined,
                g.name as gadget_name,
                g.brand as gadget_brand,
                g.model as gadget_model,
                g.image_url as gadget_image,
                g.description as gadget_description,
                g.category as gadget_category,
                g.specifications as gadget_specs,
                
                -- Seller gadget data (LEFT JOIN)
                sg.id as seller_gadget_id_joined,
                sg.name as seller_gadget_name,
                sg.brand as seller_gadget_brand,
                sg.model as seller_gadget_model,
                sg.images as seller_gadget_images,
                sg.description as seller_gadget_description,
                
                -- Variant data (LEFT JOIN)
                gv.id as variant_id_joined,
                gv.storage as variant_storage,
                gv.color as variant_color,
                gv.condition as variant_condition,
                gv.price_adjustment as variant_price_adjustment
                
            FROM order_items oi
            
            -- Join all related tables in single query
            LEFT JOIN gadgets g ON oi.gadget_id = g.id AND oi.item_type = 'admin_gadget'
            LEFT JOIN seller_gadgets sg ON oi.seller_gadget_id = sg.id AND oi.item_type = 'seller_gadget'
            LEFT JOIN gadget_variants gv ON oi.variant_id = gv.id
            
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        ";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            error_log("Failed to prepare optimized order items query: " . $conn->error);
            return [];
        }
        
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            // Determine item type and source
            $isSeller = ($row['item_type'] === 'seller_gadget');
            
            // Get primary data based on item type
            $itemName = $isSeller ? $row['seller_gadget_name'] : $row['gadget_name'];
            $itemBrand = $isSeller ? $row['seller_gadget_brand'] : $row['gadget_brand'];
            $itemModel = $isSeller ? $row['seller_gadget_model'] : $row['gadget_model'];
            $itemImage = $isSeller ? 
                (json_decode($row['seller_gadget_images'], true)[0] ?? null) : 
                $row['gadget_image'];
            $itemDescription = $isSeller ? 
                $row['seller_gadget_description'] : 
                $row['gadget_description'];
                
            // Use variant storage if available, otherwise item storage
            $storage = $row['variant_storage'] ?? $row['item_storage'];
            $color = $row['variant_color'] ?? null;
            $condition = $row['variant_condition'] ?? null;
            
            // Price selection based on currency preference
            $unitPrice = $row['unit_price'];
            $unitPriceGbp = $row['unit_price_gbp'];
            $totalPrice = $row['total_price'];
            $totalPriceGbp = $row['total_price_gbp'];
            
            $items[] = [
                'id' => $row['id'],
                'order_id' => $row['order_id'],
                'item_type' => $row['item_type'],
                'gadget_id' => $row['gadget_id'],
                'seller_gadget_id' => $row['seller_gadget_id'],
                'variant_id' => $row['variant_id'],
                'seller_id' => $row['seller_id'],
                
                // Core item data
                'name' => $itemName,
                'brand' => $itemBrand,
                'model' => $itemModel,
                'description' => $itemDescription,
                'image' => $itemImage,
                'category' => $isSeller ? null : $row['gadget_category'],
                'specifications' => $isSeller ? null : json_decode($row['gadget_specs'], true),
                
                // Pricing
                'quantity' => $row['quantity'],
                'unit_price' => $unitPrice,
                'unit_price_gbp' => $unitPriceGbp,
                'total_price' => $totalPrice,
                'total_price_gbp' => $totalPriceGbp,
                
                // Variant attributes
                'storage' => $storage,
                'color' => $color,
                'condition' => $condition,
                'price_adjustment' => $row['variant_price_adjustment'],
                
                'created_at' => $row['created_at']
            ];
        }
        
        $stmt->close();
        return $items;
        
    } catch (Exception $e) {
        error_log("Error in optimized fetchOrderItems: " . $e->getMessage());
        return [];
    }
}

/**
 * Batch order retrieval with optimized joins
 * For retrieving multiple orders with their items efficiently
 */
function getOrdersWithItemsBatch($conn, $orderIds = []) {
    if (empty($orderIds)) return [];
    
    $placeholders = str_repeat('?,', count($orderIds) - 1) . '?';
    
    $sql = "
        SELECT 
            o.id as order_id,
            o.user_id,
            o.total_amount,
            o.total_amount_gbp,
            o.currency,
            o.status,
            o.payment_status,
            o.provider,
            o.created_at,
            o.paid_at,
            o.notes,
            
            oi.id as item_id,
            oi.item_type,
            oi.quantity,
            oi.unit_price,
            oi.unit_price_gbp,
            oi.total_price,
            oi.total_price_gbp,
            oi.storage as item_storage,
            oi.variant_id,
            oi.gadget_id,
            oi.seller_gadget_id,
            
            g.name as gadget_name,
            g.brand as gadget_brand,
            g.image_url as gadget_image,
            sg.name as seller_gadget_name,
            sg.brand as seller_gadget_brand,
            sg.images as seller_gadget_images,
            gv.storage as variant_storage
            
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN gadgets g ON oi.gadget_id = g.id AND oi.item_type = 'admin_gadget'
        LEFT JOIN seller_gadgets sg ON oi.seller_gadget_id = sg.id AND oi.item_type = 'seller_gadget'
        LEFT JOIN gadget_variants gv ON oi.variant_id = gv.id
        
        WHERE o.id IN ($placeholders)
        ORDER BY o.id DESC, oi.id ASC
    ";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) return [];
    
    $stmt->bind_param(str_repeat('i', count($orderIds)), ...$orderIds);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    $currentOrderId = null;
    $currentOrder = null;
    
    while ($row = $result->fetch_assoc()) {
        $orderId = $row['order_id'];
        
        // Create new order object when we encounter a new order
        if ($orderId !== $currentOrderId) {
            if ($currentOrder) {
                $orders[] = $currentOrder;
            }
            
            $currentOrderId = $orderId;
            $currentOrder = [
                'id' => $orderId,
                'user_id' => $row['user_id'],
                'total_amount' => $row['total_amount'],
                'total_amount_gbp' => $row['total_amount_gbp'],
                'currency' => $row['currency'],
                'status' => $row['status'],
                'payment_status' => $row['payment_status'],
                'provider' => $row['provider'],
                'created_at' => $row['created_at'],
                'paid_at' => $row['paid_at'],
                'notes' => $row['notes'],
                'items' => []
            ];
        }
        
        // Add item to current order if it exists
        if ($row['item_id']) {
            $isSeller = ($row['item_type'] === 'seller_gadget');
            $itemName = $isSeller ? $row['seller_gadget_name'] : $row['gadget_name'];
            $itemBrand = $isSeller ? $row['seller_gadget_brand'] : $row['gadget_brand'];
            $itemImage = $isSeller ? 
                (json_decode($row['seller_gadget_images'], true)[0] ?? null) : 
                $row['gadget_image'];
            
            $currentOrder['items'][] = [
                'id' => $row['item_id'],
                'item_type' => $row['item_type'],
                'name' => $itemName,
                'brand' => $itemBrand,
                'image' => $itemImage,
                'quantity' => $row['quantity'],
                'unit_price' => $row['unit_price'],
                'unit_price_gbp' => $row['unit_price_gbp'],
                'total_price' => $row['total_price'],
                'total_price_gbp' => $row['total_price_gbp'],
                'storage' => $row['variant_storage'] ?? $row['item_storage'],
                'gadget_id' => $row['gadget_id'],
                'seller_gadget_id' => $row['seller_gadget_id'],
                'variant_id' => $row['variant_id']
            ];
        }
    }
    
    // Don't forget the last order
    if ($currentOrder) {
        $orders[] = $currentOrder;
    }
    
    $stmt->close();
    return $orders;
}

/**
 * Cached gadget data retrieval for better performance
 * Reduces repeated database queries for the same gadgets
 */
class GadgetDataCache {
    private static $cache = [];
    private static $maxCacheSize = 1000;
    
    public static function getGadgets($conn, $gadgetIds) {
        if (empty($gadgetIds)) return [];
        
        // Filter out already cached items
        $uncachedIds = array_filter($gadgetIds, function($id) {
            return !isset(self::$cache[$id]);
        });
        
        // Fetch uncached items from database
        if (!empty($uncachedIds)) {
            $placeholders = str_repeat('?,', count($uncachedIds) - 1) . '?';
            $sql = "SELECT id, name, brand, model, image_url, description, category, specifications 
                    FROM gadgets WHERE id IN ($placeholders)";
            
            $stmt = $conn->prepare($sql);
            if ($stmt) {
                $stmt->bind_param(str_repeat('i', count($uncachedIds)), ...$uncachedIds);
                $stmt->execute();
                $result = $stmt->get_result();
                
                while ($row = $result->fetch_assoc()) {
                    self::$cache[$row['id']] = $row;
                }
                $stmt->close();
            }
        }
        
        // Return requested gadgets
        $result = [];
        foreach ($gadgetIds as $id) {
            if (isset(self::$cache[$id])) {
                $result[$id] = self::$cache[$id];
            }
        }
        
        // Maintain cache size
        if (count(self::$cache) > self::$maxCacheSize) {
            // Remove oldest entries (simple FIFO)
            self::$cache = array_slice(self::$cache, -self::$maxCacheSize, null, true);
        }
        
        return $result;
    }
    
    public static function clear() {
        self::$cache = [];
    }
}

/**
 * Optimized receipt data generation
 * Combines all necessary data in minimal queries
 */
function generateReceiptDataOptimized($conn, $orderId) {
    try {
        // Single query to get order with user and items
        $sql = "
            SELECT 
                o.id as order_id,
                o.user_id,
                o.total_amount,
                o.total_amount_gbp,
                o.currency,
                o.status,
                o.payment_status,
                o.provider,
                o.created_at,
                o.paid_at,
                o.external_tx_ref,
                o.notes,
                
                u.email,
                u.display_name,
                u.phone,
                
                oi.id as item_id,
                oi.item_type,
                oi.quantity,
                oi.unit_price,
                oi.unit_price_gbp,
                oi.total_price,
                oi.total_price_gbp,
                oi.storage as item_storage,
                oi.variant_id,
                oi.gadget_id,
                oi.seller_gadget_id,
                
                g.name as gadget_name,
                g.brand as gadget_brand,
                g.model as gadget_model,
                g.image_url as gadget_image,
                g.description as gadget_description,
                g.category as gadget_category,
                
                sg.name as seller_gadget_name,
                sg.brand as seller_gadget_brand,
                sg.model as seller_gadget_model,
                sg.images as seller_gadget_images,
                sg.description as seller_gadget_description,
                
                gv.storage as variant_storage,
                gv.color as variant_color,
                gv.condition as variant_condition
                
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN gadgets g ON oi.gadget_id = g.id AND oi.item_type = 'admin_gadget'
            LEFT JOIN seller_gadgets sg ON oi.seller_gadget_id = sg.id AND oi.item_type = 'seller_gadget'
            LEFT JOIN gadget_variants gv ON oi.variant_id = gv.id
            
            WHERE o.id = ?
            ORDER BY oi.id ASC
        ";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            return ['success' => false, 'error' => 'Failed to prepare receipt query'];
        }
        
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $orderData = null;
        $items = [];
        
        while ($row = $result->fetch_assoc()) {
            // Capture order data from first row
            if (!$orderData) {
                $orderData = [
                    'id' => $row['order_id'],
                    'user_id' => $row['user_id'],
                    'customer' => [
                        'name' => $row['display_name'],
                        'email' => $row['email'],
                        'phone' => $row['phone']
                    ],
                    'financial' => [
                        'total_amount' => $row['total_amount'],
                        'total_amount_gbp' => $row['total_amount_gbp'],
                        'currency' => $row['currency']
                    ],
                    'status' => $row['status'],
                    'payment_status' => $row['payment_status'],
                    'provider' => $row['provider'],
                    'created_at' => $row['created_at'],
                    'paid_at' => $row['paid_at'],
                    'transaction_ref' => $row['external_tx_ref'],
                    'notes' => $row['notes']
                ];
            }
            
            // Process items
            if ($row['item_id']) {
                $isSeller = ($row['item_type'] === 'seller_gadget');
                $itemName = $isSeller ? $row['seller_gadget_name'] : $row['gadget_name'];
                $itemBrand = $isSeller ? $row['seller_gadget_brand'] : $row['gadget_brand'];
                $itemModel = $isSeller ? $row['seller_gadget_model'] : $row['gadget_model'];
                $itemImage = $isSeller ? 
                    (json_decode($row['seller_gadget_images'], true)[0] ?? null) : 
                    $row['gadget_image'];
                $itemDescription = $isSeller ? 
                    $row['seller_gadget_description'] : 
                    $row['gadget_description'];
                
                $items[] = [
                    'id' => $row['item_id'],
                    'name' => $itemName,
                    'brand' => $itemBrand,
                    'model' => $itemModel,
                    'description' => $itemDescription,
                    'image' => $itemImage,
                    'category' => $isSeller ? null : $row['gadget_category'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                    'unit_price_gbp' => $row['unit_price_gbp'],
                    'total_price' => $row['total_price'],
                    'total_price_gbp' => $row['total_price_gbp'],
                    'storage' => $row['variant_storage'] ?? $row['item_storage'],
                    'color' => $row['variant_color'],
                    'condition' => $row['variant_condition'],
                    'gadget_id' => $row['gadget_id'],
                    'seller_gadget_id' => $row['seller_gadget_id']
                ];
            }
        }
        
        $stmt->close();
        
        if (!$orderData) {
            return ['success' => false, 'error' => 'Order not found'];
        }
        
        return [
            'success' => true,
            'data' => [
                'order' => $orderData,
                'items' => $items
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Receipt generation error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to generate receipt'];
    }
}

?>