<?php
// Sparkle Pro API main router
// Provides CORS, health check, gadgets endpoints (JSON-backed), payments (PayChangu stub), and admin endpoints.

// ---- Error reporting ----
error_reporting(E_ALL);
ini_set('display_errors', '1');

// ---- Composer autoload (PHPMailer and future libs) ----
try {
    $autoloadPath = __DIR__ . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
    }
} catch (Throwable $e) {
    // Autoload not critical unless email endpoint is used
    error_log('Composer autoload not available: ' . $e->getMessage());
}

// ---- CORS & headers ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$referer = $_SERVER['HTTP_REFERER'] ?? null;
$allowedOrigins = [
    'https://itsxtrapush.com',
    'https://www.itsxtrapush.com',
    'https://sparkle-pro.co.uk',
    'https://www.sparkle-pro.co.uk',
    // Common CRA/Vite dev ports will be allowed via regex below
];

// Decide if the origin is allowed
$allowSpecificOrigin = false;
$originToAllow = '*';
if ($origin) {
    if (in_array($origin, $allowedOrigins, true)) {
        $allowSpecificOrigin = true;
        $originToAllow = $origin;
    } elseif (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
        // Allow any localhost/127.0.0.1 with any port during development
        $allowSpecificOrigin = true;
        $originToAllow = $origin;
    }
}

// Apply CORS headers
header('Vary: Origin');
header('Access-Control-Allow-Origin: ' . $originToAllow);
if ($allowSpecificOrigin) {
    // Only allow credentials when a specific origin is used (never with "*")
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');
// Content Security Policy: Allow location detection services, Square payments, and other required domains
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.pmndrs.com https://www.googletagmanager.com https://web.squarecdn.com https://js.squareup.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://connect.squareup.com https://pci-connect.squareup.com https://api.squareup.com https://accounts.google.com https://securetoken.googleapis.com https://www.googleapis.com https://firebase.googleapis.com https://firestore.googleapis.com https://sparkle-pro.co.uk https://*.sparkle-pro.co.uk https://www.sparkle-pro.co.uk https://itsxtrapush.com https://www.googletagmanager.com https://cdn.pmndrs.com https://cdn.jsdelivr.net https://market-assets.fra1.digitaloceanspaces.com https://raw.githubusercontent.com https://get.geojs.io https://www.cloudflare.com blob:; frame-src 'self' https://web.squarecdn.com https://connect.squareup.com https://checkout.square.site https://accounts.google.com https://securetoken.firebase.com; object-src 'none'; base-uri 'self'; form-action 'self';");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Utils ----
function json_ok($data = []) {
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}
function json_error($message, $code = 400, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(['success' => false, 'error' => $message], $extra));
    exit;
}

// ---- Database (optional for admin endpoints) ----
// Update these with your actual credentials
if (!defined('DB_HOST')) { define('DB_HOST', 'localhost'); }
if (!defined('DB_NAME')) { define('DB_NAME', 'itsxtrapush_db'); }
if (!defined('DB_USER')) { define('DB_USER', 'xuser'); }
if (!defined('DB_PASS')) { define('DB_PASS', 'Xpush2025?'); }

// ---- PayChangu keys (for Malawi - MWK payments) ----
// Paste your keys here for quick setup. Secret key is used server-side.
// If left empty, keys will be resolved from environment or config files.
if (!defined('PAYCHANGU_PUBLIC_KEY')) { define('PAYCHANGU_PUBLIC_KEY', 'pub-live-xz1XYFcGESewLhGrETYhJibsVUaFx2Yo'); }
if (!defined('PAYCHANGU_SECRET_KEY')) { define('PAYCHANGU_SECRET_KEY', 'sec-live-Z8Yv7SbOVKEXZsMBZTJL4zZS8dlYaq6j'); }
// Alias support: some docs refer to API_KEY; treat it as secret
if (!defined('PAYCHANGU_API_KEY')) { define('PAYCHANGU_API_KEY', PAYCHANGU_SECRET_KEY); }

// ---- Square keys (for International - GBP payments) ----
// Square Checkout API for payments: https://developer.squareup.com/docs/checkout-api
// Square Subscriptions for recurring: https://developer.squareup.com/docs/subscriptions/overview
if (!defined('SQUARE_APP_ID')) { define('SQUARE_APP_ID', 'sq0idp-DEaaRhZiolzBXU8jJ2WA1A'); }
if (!defined('SQUARE_ACCESS_TOKEN')) { define('SQUARE_ACCESS_TOKEN', 'EAAAl1kApzWojA1iq6HHoOihuob_zkoCmG-Xhu89a0fMttW4K3JCsN36PyYcPCns'); }
if (!defined('SQUARE_WEBHOOK_ID')) { define('SQUARE_WEBHOOK_ID', 'wbhk_f3615f7c7b7d44fe9315394ff84b66f0'); }
if (!defined('SQUARE_WEBHOOK_SIGNATURE_KEY')) { define('SQUARE_WEBHOOK_SIGNATURE_KEY', 'EPJGCcaKhMCQvqRIgp9q3w'); }
if (!defined('SQUARE_WEBHOOK_URL')) { define('SQUARE_WEBHOOK_URL', 'https://itsxtrapush.com/gadgets/payments/hook'); }
if (!defined('SQUARE_LOCATION_ID')) { define('SQUARE_LOCATION_ID', 'LH1ZRTHXWWT5J'); } // Set your Square location ID
if (!defined('SQUARE_ENVIRONMENT')) { define('SQUARE_ENVIRONMENT', 'production'); } // 'sandbox' or 'production'

// Square API base URL
define('SQUARE_API_URL', SQUARE_ENVIRONMENT === 'sandbox' 
    ? 'https://connect.squareupsandbox.com/v2' 
    : 'https://connect.squareup.com/v2');

// ---- SMTP config for PHPMailer (optional; will fallback to mail()) ----
if (!defined('SMTP_HOST')) { define('SMTP_HOST', getenv('mail.deegits.com') ?: ''); }
if (!defined('SMTP_USER')) { define('SMTP_USER', getenv('conrad@deegits.com') ?: ''); }
if (!defined('SMTP_PASS')) { define('SMTP_PASS', getenv('brickwall2010?') ?: ''); }
if (!defined('SMTP_PORT')) { define('SMTP_PORT', intval(getenv('SMTP_PORT') ?: 587)); }
if (!defined('SMTP_SECURE')) { define('STRIPE_SECURE', getenv('SMTP_SECURE') ?: 'tls'); }
if (!defined('MAIL_FROM')) { define('MAIL_FROM', getenv('MAIL_FROM') ?: 'no-reply@support.itsxtrapush.com'); }
if (!defined('MAIL_FROM_NAME')) { define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Xtrapush Gadgets'); }

// Helper: configured PHPMailer instance
function getMailer() {
    // Ensure PHPMailer is available via Composer autoload
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        return null;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    // Transport: prefer SMTP if configured; else use mail()
    if (SMTP_HOST) {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
    } else {
        $mail->isMail();
    }

    // Defaults
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');

    return $mail;
}

class DatabaseConnection {
    private static $instance = null;
    private $conn;

    private function __construct() {
        $this->conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($this->conn->connect_errno) {
            error_log('DB connect error: ' . $this->conn->connect_error);
        } else {
            $this->conn->set_charset('utf8mb4');
        }
    }
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    public function getConnection() { return $this->conn; }
}

// ---- Gadgets (JSON-backed) ----
function read_gadgets_json() {
    $path = __DIR__ . DIRECTORY_SEPARATOR . 'gadgets.json';
    if (!file_exists($path)) { return null; }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    if (!is_array($data)) { return []; }
    return $data;
}
function gadgets_list() {
    // Filters
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    $category = $_GET['category'] ?? null;
    $brand = $_GET['brand'] ?? null;
    $minPrice = isset($_GET['minPrice']) ? floatval($_GET['minPrice']) : null;
    $maxPrice = isset($_GET['maxPrice']) ? floatval($_GET['maxPrice']) : null;
    $inStock = isset($_GET['inStock']) ? ($_GET['inStock'] === '1' || $_GET['inStock'] === 'true') : null;
    $condition = isset($_GET['condition']) ? trim($_GET['condition']) : null;
    $currency = $_GET['currency'] ?? 'MWK'; // Default to MWK if not specified
    $page = isset($_GET['page']) ? max(intval($_GET['page']),1) : 1;
    $limit = isset($_GET['limit']) ? max(intval($_GET['limit']),10) : 50;
    $offset = ($page - 1) * $limit;
    $debugFlag = isset($_GET['debug']) ? ($_GET['debug'] === '1' || $_GET['debug'] === 'true') : false;
    
    // Determine which price field to use based on currency
    $priceField = ($currency === 'GBP') ? 'price_gbp' : 'price';

    // Try DB first
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if ($conn && !$conn->connect_errno) {
        $base = "FROM gadgets WHERE is_active = 1";
        $conds = [];
        $params = [];
        $types = '';

        if ($q !== '') {
            $like = '%' . strtolower($q) . '%';
            $conds[] = "(LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(model) LIKE ?)";
            $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
            $types .= 'ssss';
        }
        if ($category) { $conds[] = "category = ?"; $params[] = $category; $types .= 's'; }
        if ($brand) { $conds[] = "brand = ?"; $params[] = $brand; $types .= 's'; }
        if ($minPrice !== null || $maxPrice !== null) {
            // For price filtering, we need to check both main gadget prices AND variant prices
            // Create a subquery to get the lowest effective price for each gadget
            if ($currency === 'GBP') {
                // For GBP, use lowest variant price GBP or main GBP price
                $priceSubquery = "(SELECT 
                    COALESCE(
                        MIN(CASE WHEN gv.is_active = 1 AND gv.price_gbp IS NOT NULL THEN gv.price_gbp END),
                        g.price_gbp,
                        CASE WHEN g.price > 0 THEN g.price / 2358 ELSE 0 END
                    ) as effective_price
                    FROM gadgets g 
                    LEFT JOIN gadget_variants gv ON g.id = gv.gadget_id AND gv.is_active = 1
                    WHERE g.id = gadgets.id
                    GROUP BY g.id
                )";
            } else {
                // For MWK, use lowest variant price or main price
                $priceSubquery = "(SELECT 
                    COALESCE(
                        MIN(CASE WHEN gv.is_active = 1 THEN gv.price END),
                        g.price
                    ) as effective_price
                    FROM gadgets g 
                    LEFT JOIN gadget_variants gv ON g.id = gv.gadget_id AND gv.is_active = 1
                    WHERE g.id = gadgets.id
                    GROUP BY g.id
                )";
            }
            
            if ($minPrice !== null) { 
                $conds[] = "$priceSubquery >= ?"; 
                $params[] = $minPrice; 
                $types .= 'd'; 
            }
            if ($maxPrice !== null) { 
                $conds[] = "$priceSubquery <= ?"; 
                $params[] = $maxPrice; 
                $types .= 'd'; 
            }
        }
        // Qty-only availability filtering
        if ($inStock !== null) {
            if ($inStock) { $conds[] = "(stock_quantity > 0)"; }
            else { $conds[] = "(stock_quantity = 0)"; }
        }
        
        // Condition filtering: check BOTH main gadget condition AND variant conditions
        if ($condition) {
            $parts = array_filter(array_map('trim', explode(',', $condition)));
            if (!empty($parts)) {
                $placeholders = implode(',', array_fill(0, count($parts), '?'));
                // Match gadgets where EITHER:
                // 1. Main gadget has matching condition_status, OR
                // 2. Gadget has active variants with matching condition_status
                $conds[] = "(condition_status IN ($placeholders) OR id IN (SELECT gadget_id FROM gadget_variants WHERE condition_status IN ($placeholders) AND is_active = 1))";
                // Add params twice: once for main gadget condition, once for variant condition
                foreach ($parts as $c) { $params[] = $c; $types .= 's'; }
                foreach ($parts as $c) { $params[] = $c; $types .= 's'; }
            }
        }

        // Append conditions to base with AND, since base already has WHERE
        $where = !empty($conds) ? (' AND ' . implode(' AND ', $conds)) : '';
        // Count total
        $countSql = "SELECT COUNT(*) AS c $base" . $where;
        $total = 0;
        $stmt = $conn->prepare($countSql);
        if ($stmt) {
            if (!empty($params)) { $stmt->bind_param($types, ...$params); }
            $stmt->execute();
            $rc = $stmt->get_result()->fetch_assoc();
            $total = (int)($rc['c'] ?? 0);
            $stmt->close();
        }

        // Fetch data with pagination
        // Qty-only ordering: all qty>0 first, then most recent
        $dataSql = "SELECT id, name, description, price, monthly_price, price_gbp, monthly_price_gbp, image_url, category, brand, model, condition_status, specifications, in_stock, stock_quantity, is_pre_order, created_at $base" . $where . " ORDER BY (CASE WHEN stock_quantity > 0 THEN 1 ELSE 0 END) DESC, created_at DESC LIMIT ? OFFSET ?";
        $dtypes = $types . 'ii';
        $dparams = $params; $dparams[] = $limit; $dparams[] = $offset;
        $dstmt = $conn->prepare($dataSql);
        if ($dstmt) {
            $dstmt->bind_param($dtypes, ...$dparams);
            $dstmt->execute();
            $res = $dstmt->get_result();
            $list = [];
            while ($row = $res->fetch_assoc()) {
                $specs = $row['specifications'] ? json_decode($row['specifications'], true) : [];
                $list[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'price' => (float)$row['price'],
                    'monthly_price' => isset($row['monthly_price']) ? (float)$row['monthly_price'] : null,
                    'price_gbp' => isset($row['price_gbp']) ? (float)$row['price_gbp'] : null,
                    'monthly_price_gbp' => isset($row['monthly_price_gbp']) ? (float)$row['monthly_price_gbp'] : null,
                    'image_url' => $row['image_url'],
                    'category' => $row['category'],
                    'brand' => $row['brand'],
                    'model' => $row['model'],
                    'condition_status' => $row['condition_status'],
                    'specifications' => is_array($specs) ? $specs : [],
                    'in_stock' => (int)$row['in_stock'],
                    'stock_quantity' => (int)$row['stock_quantity'],
                    'is_pre_order' => isset($row['is_pre_order']) ? (int)$row['is_pre_order'] : 0,
                    'qty' => (int)$row['stock_quantity'],
                    // Qty-only effective availability
                    'effective_in_stock' => (((int)$row['stock_quantity']) > 0) ? 1 : 0,
                    'date' => $row['created_at'],
                ];
            }
            $dstmt->close();
            
            // NEW: Add variant data to each gadget in the list
            $gadgetIds = array_column($list, 'id');
            if (!empty($gadgetIds)) {
                $variantsMap = get_variants_for_gadgets($gadgetIds);
                foreach ($list as &$gadget) {
                    $gadgetId = $gadget['id'];
                    $gadgetVariants = $variantsMap[$gadgetId] ?? [];
                    
                    // Calculate lowest variant prices
                    $lowestPrice = null;
                    $lowestPriceGbp = null;
                    $totalVariantStock = 0;
                    
                    foreach ($gadgetVariants as $variant) {
                        if ($lowestPrice === null || $variant['price'] < $lowestPrice) {
                            $lowestPrice = $variant['price'];
                        }
                        if ($variant['price_gbp'] !== null && 
                            ($lowestPriceGbp === null || $variant['price_gbp'] < $lowestPriceGbp)) {
                            $lowestPriceGbp = $variant['price_gbp'];
                        }
                        $totalVariantStock += $variant['stock_quantity'];
                    }
                    
                    // Add variant-aware fields
                    $gadget['variants'] = $gadgetVariants;
                    $gadget['has_variants'] = !empty($gadgetVariants);
                    $gadget['variant_count'] = count($gadgetVariants);
                    $gadget['total_variant_stock'] = $totalVariantStock;
                    $gadget['lowest_variant_price'] = $lowestPrice;
                    $gadget['lowest_variant_price_gbp'] = $lowestPriceGbp;
                    
                    // ENFORCE VARIANT-BASED PRICING: Always use variant prices when available
                    // Even if gadget has zero prices, use variant data
                    if ($lowestPrice !== null) {
                        $gadget['effective_price'] = $lowestPrice;
                        // Override the base price to ensure consistency
                        $gadget['price'] = $lowestPrice;
                    } elseif ($gadget['price'] == 0) {
                        // If no variants and gadget price is zero, mark as unavailable
                        $gadget['effective_price'] = 0;
                        $gadget['in_stock'] = 0;
                        $gadget['stock_quantity'] = 0;
                        $gadget['effective_in_stock'] = 0;
                    }
                    
                    if ($lowestPriceGbp !== null) {
                        $gadget['effective_price_gbp'] = $lowestPriceGbp;
                        // Override the base GBP price to ensure consistency
                        $gadget['price_gbp'] = $lowestPriceGbp;
                    } elseif ($gadget['price_gbp'] == 0 && $gadget['price'] > 0) {
                        // Convert MWK to GBP if GBP is zero but MWK exists
                        $gadget['effective_price_gbp'] = $gadget['price'] / 2358;
                        $gadget['price_gbp'] = $gadget['price'] / 2358;
                    } elseif ($gadget['price_gbp'] == 0) {
                        // If no GBP price available, mark as zero
                        $gadget['effective_price_gbp'] = 0;
                    }
                    
                    // Override stock quantity with variant stock
                    if ($totalVariantStock > 0) {
                        $gadget['stock_quantity'] = $totalVariantStock;
                        $gadget['qty'] = $totalVariantStock;
                        $gadget['effective_in_stock'] = 1;
                        $gadget['in_stock'] = 1;
                    } elseif ($gadget['stock_quantity'] == 0) {
                        // If no variant stock and gadget stock is zero, mark as out of stock
                        $gadget['effective_in_stock'] = 0;
                        $gadget['in_stock'] = 0;
                    }
                }
            }
            
            json_ok([
                'success' => true,
                'data' => $list,
                'count' => $total,
                'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit],
                'debug' => $debugFlag ? [
                    'source' => 'db',
                    'sql' => $dataSql,
                    'params' => $dparams,
                    'where' => $where,
                    'currency' => $currency,
                    'priceField' => $priceField
                ] : null
            ]);
        }
        // If any prepare error, fall through to JSON fallback below
    }

    // Fallback to JSON file for dev
    $data = read_gadgets_json();
    if ($data === null) { json_error('gadgets.json not found', 404); }

    $qLower = strtolower($q);
    $filtered = array_filter($data, function($item) use ($qLower, $category, $brand, $minPrice, $maxPrice, $inStock, $currency, $condition) {
        $ok = true;
        if ($qLower) {
            $hay = strtolower(($item['name'] ?? '') . ' ' . ($item['description'] ?? '') . ' ' . ($item['brand'] ?? '') . ' ' . ($item['model'] ?? ''));
            $ok = $ok && (strpos($hay, $qLower) !== false);
        }
        if ($category) { $ok = $ok && (($item['category'] ?? null) === $category); }
        if ($brand) { $ok = $ok && (($item['brand'] ?? null) === $brand); }
        // Use currency-aware price field
        $itemPrice = ($currency === 'GBP') ? floatval($item['price_gbp'] ?? $item['priceGbp'] ?? $item['price'] ?? 0) : floatval($item['price'] ?? 0);
        if ($minPrice !== null) { $ok = $ok && ($itemPrice >= $minPrice); }
        if ($maxPrice !== null) { $ok = $ok && ($itemPrice <= $maxPrice); }
        // Qty-only availability in fallback
        if ($inStock !== null) {
            $qty = intval($item['stock_quantity'] ?? $item['stockQuantity'] ?? $item['stock'] ?? $item['number'] ?? 0);
            $available = $qty > 0;
            $ok = $ok && ($inStock ? $available : !$available);
        }
        // Condition filtering for JSON fallback (check both main condition and variants)
        if ($condition) {
            $parts = array_filter(array_map('trim', explode(',', $condition)));
            if (!empty($parts)) {
                $mainCondition = strtolower($item['condition_status'] ?? $item['condition'] ?? '');
                $matchesMainCondition = in_array($mainCondition, array_map('strtolower', $parts));
                
                // Check variants if they exist
                $matchesVariantCondition = false;
                if (isset($item['variants']) && is_array($item['variants'])) {
                    foreach ($item['variants'] as $v) {
                        $varCond = strtolower($v['condition_status'] ?? $v['condition'] ?? '');
                        if (in_array($varCond, array_map('strtolower', $parts))) {
                            $matchesVariantCondition = true;
                            break;
                        }
                    }
                }
                
                $ok = $ok && ($matchesMainCondition || $matchesVariantCondition);
            }
        }
        return $ok;
    });
    // Stock-first ordering for JSON fallback
    $filtered = array_values($filtered);
    usort($filtered, function($a, $b) {
        $qtyA = intval($a['stock_quantity'] ?? $a['stockQuantity'] ?? $a['stock'] ?? $a['number'] ?? 0);
        $availA = $qtyA > 0;

        $qtyB = intval($b['stock_quantity'] ?? $b['stockQuantity'] ?? $b['stock'] ?? $b['number'] ?? 0);
        $availB = $qtyB > 0;

        if ($availA === $availB) {
            $dateA = $a['created_at'] ?? $a['date'] ?? null;
            $dateB = $b['created_at'] ?? $b['date'] ?? null;
            if ($dateA && $dateB) { return strcmp($dateB, $dateA); }
            return 0;
        }
        return $availA ? -1 : 1;
    });
    $total = count($filtered);
    $paged = array_slice($filtered, $offset, $limit);
    // Enrich with effective_in_stock and normalized stock_quantity
    $paged = array_map(function($item) {
        $qty = intval($item['stock_quantity'] ?? $item['stockQuantity'] ?? $item['stock'] ?? $item['number'] ?? 0);
        $available = $qty > 0;
        $item['stock_quantity'] = $qty;
        $item['qty'] = $qty;
        $item['effective_in_stock'] = $available ? 1 : 0;
        return $item;
    }, $paged);
    // Optional debug for JSON fallback
    $debugInfo = $debugFlag ? [
        'source' => 'json',
        'filters' => [
            'q' => $q,
            'category' => $category,
            'brand' => $brand,
            'minPrice' => $minPrice,
            'maxPrice' => $maxPrice,
            'inStock' => $inStock,
            'condition' => $condition,
            'currency' => $currency,
            'page' => $page,
            'limit' => $limit
        ],
        'totalBeforePaging' => $total,
        'firstItems' => array_map(function($it) use ($currency) {
            return [
                'id' => $it['id'] ?? null,
                'name' => $it['name'] ?? null,
                'price' => $it['price'] ?? null,
                'price_gbp' => $it['price_gbp'] ?? $it['priceGbp'] ?? null,
                'usedPrice' => ($currency === 'GBP') ? ($it['price_gbp'] ?? $it['priceGbp'] ?? $it['price']) : $it['price'],
                'effective_in_stock' => isset($it['effective_in_stock']) ? (int)$it['effective_in_stock'] : (intval($it['stock_quantity'] ?? $it['stockQuantity'] ?? $it['stock'] ?? $it['number'] ?? 0) > 0 ? 1 : 0),
                'stock_quantity' => intval($it['stock_quantity'] ?? $it['stockQuantity'] ?? $it['stock'] ?? $it['number'] ?? 0)
            ];
        }, array_slice($paged, 0, 5))
    ] : null;
    json_ok([
        'success' => true,
        'data' => $paged,
        'count' => $total,
        'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit],
        'debug' => $debugInfo
    ]);
}
function gadgets_detail($id) {
    // Try DB first for accurate pricing and variants
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if ($conn && !$conn->connect_errno) {
        $sql = "SELECT id, name, description, price, monthly_price, price_gbp, monthly_price_gbp, image_url, category, brand, model, condition_status, specifications, has_3d_model, model3d_path, in_stock, stock_quantity, is_pre_order, COALESCE(total_variant_stock, 0) as total_variant_stock, COALESCE(has_variants, 0) as has_variants, created_at FROM gadgets WHERE id = ? AND is_active = 1 LIMIT 1";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            $stmt->close();
            if ($row) {
                $specs = $row['specifications'] ? json_decode($row['specifications'], true) : [];
                // Fetch variants (including color for Color/Storage/Condition pricing matrix)
                $vstmt = $conn->prepare("SELECT id, color, color_hex, storage, condition_status, price, price_gbp, stock_quantity, sku FROM gadget_variants WHERE gadget_id = ? AND is_active = 1 ORDER BY color ASC, storage ASC, price ASC");
                $variants = [];
                if ($vstmt) {
                    $vstmt->bind_param('i', $id);
                    $vstmt->execute();
                    $vres = $vstmt->get_result();
                    while ($v = $vres->fetch_assoc()) {
                        $variants[] = [
                            'id' => (int)$v['id'],
                            'color' => $v['color'],
                            'color_hex' => $v['color_hex'],
                            'storage' => $v['storage'],
                            'condition' => $v['condition_status'],
                            'condition_status' => $v['condition_status'],
                            'price' => (float)$v['price'],
                            'price_gbp' => $v['price_gbp'] !== null ? (float)$v['price_gbp'] : null,
                            'stockQuantity' => (int)$v['stock_quantity'],
                            'stock_quantity' => (int)$v['stock_quantity'],
                            'sku' => $v['sku'],
                        ];
                    }
                    $vstmt->close();
                }
                // Calculate lowest variant prices for single gadget detail
                $lowestPrice = null;
                $lowestPriceGbp = null;
                $totalVariantStock = 0;
                
                foreach ($variants as $variant) {
                    if ($lowestPrice === null || $variant['price'] < $lowestPrice) {
                        $lowestPrice = $variant['price'];
                    }
                    if ($variant['price_gbp'] !== null && 
                        ($lowestPriceGbp === null || $variant['price_gbp'] < $lowestPriceGbp)) {
                        $lowestPriceGbp = $variant['price_gbp'];
                    }
                    $totalVariantStock += $variant['stock_quantity'];
                }
                
                // ENFORCE VARIANT-BASED PRICING for single gadget detail
                $effectivePrice = $lowestPrice !== null ? $lowestPrice : (float)$row['price'];
                $effectivePriceGbp = $lowestPriceGbp !== null ? $lowestPriceGbp : 
                                   (($row['price_gbp'] != 0) ? (float)$row['price_gbp'] : 
                                    (($row['price'] != 0) ? (float)$row['price'] / 2358 : 0));
                
                $effectiveStock = $totalVariantStock > 0 ? $totalVariantStock : (int)$row['stock_quantity'];
                $effectiveInStock = $effectiveStock > 0 ? 1 : 0;
                
                $data = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'price' => $effectivePrice,  // Use variant price if available
                    'monthly_price' => isset($row['monthly_price']) ? (float)$row['monthly_price'] : null,
                    'price_gbp' => $effectivePriceGbp,  // Use variant GBP price if available
                    'monthly_price_gbp' => isset($row['monthly_price_gbp']) ? (float)$row['monthly_price_gbp'] : null,
                    'image_url' => $row['image_url'],
                    'category' => $row['category'],
                    'brand' => $row['brand'],
                    'model' => $row['model'],
                    'condition_status' => $row['condition_status'],
                    'specifications' => is_array($specs) ? $specs : [],
                    'has_3d_model' => (bool)($row['has_3d_model'] ?? false),
                    'model3d_path' => $row['model3d_path'] ?? null,
                    'in_stock' => $effectiveInStock,
                    'stock_quantity' => $effectiveStock,
                    'qty' => $effectiveStock,
                    'effective_in_stock' => $effectiveInStock,
                    'has_variants' => (bool)($row['has_variants'] ?? false),
                    'total_variant_stock' => (int)($row['total_variant_stock'] ?? 0),
                    'variants' => $variants,
                    'lowest_variant_price' => $lowestPrice,
                    'lowest_variant_price_gbp' => $lowestPriceGbp,
                    'variant_count' => count($variants),
                    'date' => $row['created_at'],
                ];
                json_ok(['success' => true, 'data' => $data]);
            }
        }
    }
    // Fallback to JSON
    $data = read_gadgets_json();
    if ($data === null) { json_error('gadgets.json not found', 404); }
    foreach ($data as $item) {
        if (strval($item['id'] ?? '') === strval($id)) {
            json_ok(['success' => true, 'data' => $item]);
        }
    }
    json_error('Gadget not found', 404);
}
function gadgets_categories() {
    // Try DB first for accurate counts
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if ($conn && !$conn->connect_errno) {
        $sql = "SELECT category, COUNT(*) AS cnt FROM gadgets WHERE is_active = 1 AND category IS NOT NULL AND category <> '' GROUP BY category ORDER BY cnt DESC";
        $res = $conn->query($sql);
        if ($res) {
            $list = [];
            while ($row = $res->fetch_assoc()) {
                $list[] = ['category' => $row['category'], 'count' => (int)$row['cnt']];
            }
            json_ok(['success' => true, 'data' => $list]);
        }
    }
    // Fallback to JSON
    $data = read_gadgets_json();
    if ($data === null) { json_error('gadgets.json not found', 404); }
    $counts = [];
    foreach ($data as $item) {
        $cat = $item['category'] ?? 'Unknown';
        $counts[$cat] = ($counts[$cat] ?? 0) + 1;
    }
    $list = [];
    foreach ($counts as $cat => $cnt) { $list[] = ['category' => $cat, 'count' => $cnt]; }
    json_ok(['success' => true, 'data' => $list]);
}
function gadgets_brands() {
    // Try DB first for accurate counts
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if ($conn && !$conn->connect_errno) {
        $sql = "SELECT brand, COUNT(*) AS cnt FROM gadgets WHERE is_active = 1 AND brand IS NOT NULL AND brand <> '' GROUP BY brand ORDER BY cnt DESC";
        $res = $conn->query($sql);
        if ($res) {
            $list = [];
            while ($row = $res->fetch_assoc()) {
                $list[] = ['brand' => $row['brand'], 'count' => (int)$row['cnt']];
            }
            json_ok(['success' => true, 'data' => $list]);
        }
    }
    // Fallback to JSON
    $data = read_gadgets_json();
    if ($data === null) { json_error('gadgets.json not found', 404); }
    $counts = [];
    foreach ($data as $item) {
        $brand = $item['brand'] ?? 'Unknown';
        $counts[$brand] = ($counts[$brand] ?? 0) + 1;
    }
    $list = [];
    foreach ($counts as $b => $cnt) { $list[] = ['brand' => $b, 'count' => $cnt]; }
    json_ok(['success' => true, 'data' => $list]);
}

// Helper function to fetch variants for multiple gadgets
function get_variants_for_gadgets($gadgetIds) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) return [];

    if (empty($gadgetIds)) return [];
    
    $placeholders = str_repeat('?,', count($gadgetIds) - 1) . '?';
    $sql = "SELECT gadget_id, id, color, color_hex, storage, condition_status, price, price_gbp, stock_quantity, sku 
            FROM gadget_variants 
            WHERE gadget_id IN ($placeholders) AND is_active = 1 AND stock_quantity > 0
            ORDER BY color ASC, storage ASC, price ASC";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) return [];
    
    $types = str_repeat('i', count($gadgetIds));
    $stmt->bind_param($types, ...$gadgetIds);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $variants = [];
    while ($row = $result->fetch_assoc()) {
        $variants[$row['gadget_id']][] = [
            'id' => (int)$row['id'],
            'color' => $row['color'],
            'color_hex' => $row['color_hex'],
            'storage' => $row['storage'],
            'condition_status' => $row['condition_status'],
            'price' => (float)$row['price'],
            'price_gbp' => $row['price_gbp'] !== null ? (float)$row['price_gbp'] : null,
            'stock_quantity' => (int)$row['stock_quantity'],
            'sku' => $row['sku']
        ];
    }
    $stmt->close();
    return $variants;
}
function mask_identity($email, $fullName) {
    $source = $fullName && trim($fullName) !== '' ? trim($fullName) : ($email ?? 'user');
    $source = trim($source);
    // Remove domain for emails
    if (strpos($source, '@') !== false) {
        $source = substr($source, 0, strpos($source, '@'));
    }
    $prefix = substr($source, 0, 3);
    return ($prefix !== '' ? $prefix : 'usr') . '*******';
}
function getUserByUid($conn, $uid) {
    try {
        $sql = "SELECT id, uid, email, full_name FROM users WHERE (uid = ? OR google_uid = ?) AND is_active = 1 LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { return null; }
        $stmt->bind_param('ss', $uid, $uid);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();
        $stmt->close();
        return $user ?: null;
    } catch (Exception $e) {
        error_log('Error in getUserByUid: ' . $e->getMessage());
        return null;
    }
}
function userHasOrderedGadget($conn, $userId, $gadgetId) {
    try {
        $sql = "SELECT oi.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND oi.gadget_id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { return false; }
        $stmt->bind_param('ii', $userId, $gadgetId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();
        return !!$row;
    } catch (Exception $e) { error_log('Error in userHasOrderedGadget: ' . $e->getMessage()); return false; }
}
function getGadgetReviews($gadgetId) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    try {
        // Average rating
        $avg = null; $count = 0;
        $stmt = $conn->prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE gadget_id = ? AND parent_id IS NULL AND is_active = 1 AND rating IS NOT NULL");
        if ($stmt) {
            $stmt->bind_param('i', $gadgetId);
            $stmt->execute();
            $res = $stmt->get_result()->fetch_assoc();
            $avg = isset($res['avg_rating']) ? round((float)$res['avg_rating'], 2) : null;
            $count = (int)($res['cnt'] ?? 0);
            $stmt->close();
        }
        // Top-level reviews with user masking
        $sql = "SELECT r.id, r.rating, r.comment, r.likes_count, r.dislikes_count, r.created_at, u.email, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.gadget_id = ? AND r.parent_id IS NULL AND r.is_active = 1 ORDER BY r.created_at DESC";
        $stmt2 = $conn->prepare($sql);
        $stmt2->bind_param('i', $gadgetId);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        $reviews = [];
        while ($row = $res2->fetch_assoc()) {
            $rid = (int)$row['id'];
            // Reaction breakdown
            $rstmt = $conn->prepare("SELECT reaction, COUNT(*) as c FROM review_reactions WHERE review_id = ? GROUP BY reaction");
            $reactions = [];
            if ($rstmt) {
                $rstmt->bind_param('i', $rid);
                $rstmt->execute();
                $rres = $rstmt->get_result();
                while ($rrow = $rres->fetch_assoc()) { $reactions[$rrow['reaction']] = (int)$rrow['c']; }
                $rstmt->close();
            }
            // Replies
            $pstmt = $conn->prepare("SELECT r.id, r.comment, r.created_at, u.email, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.parent_id = ? AND r.is_active = 1 ORDER BY r.created_at ASC");
            $replies = [];
            if ($pstmt) {
                $pstmt->bind_param('i', $rid);
                $pstmt->execute();
                $pres = $pstmt->get_result();
                while ($prow = $pres->fetch_assoc()) {
                    $replies[] = [
                        'id' => (int)$prow['id'],
                        'comment' => $prow['comment'],
                        'userMasked' => mask_identity($prow['email'], $prow['full_name']),
                        'createdAt' => $prow['created_at']
                    ];
                }
                $pstmt->close();
            }
            $reviews[] = [
                'id' => $rid,
                'rating' => isset($row['rating']) ? (int)$row['rating'] : null,
                'comment' => $row['comment'],
                'userMasked' => mask_identity($row['email'], $row['full_name']),
                'likesCount' => (int)$row['likes_count'],
                'dislikesCount' => (int)$row['dislikes_count'],
                'reactions' => $reactions,
                'createdAt' => $row['created_at'],
                'replies' => $replies
            ];
        }
        $stmt2->close();
        echo json_encode(['success' => true, 'data' => ['averageRating' => $avg, 'count' => $count, 'reviews' => $reviews]]);
    } catch (Exception $e) {
        error_log('Error in getGadgetReviews: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch reviews']);
    }
}
function createGadgetReview($gadgetId) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    $data = json_decode(file_get_contents('php://input'), true);
    $uid = $data['userUid'] ?? null;
    $rating = isset($data['rating']) ? (int)$data['rating'] : null;
    $comment = trim((string)($data['comment'] ?? ''));
    if (!$uid || !$rating || $rating < 1 || $rating > 5 || $comment === '') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing or invalid fields']); return; }
    $user = getUserByUid($conn, $uid);
    if (!$user) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Auth required']); return; }
    if (!userHasOrderedGadget($conn, (int)$user['id'], $gadgetId)) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Only buyers who ordered this gadget can review']); return; }
    try {
        $stmt = $conn->prepare("INSERT INTO reviews (gadget_id, user_id, parent_id, rating, comment, likes_count, dislikes_count, is_active, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, 0, 0, 1, NOW(), NOW())");
        $stmt->bind_param('iiis', $gadgetId, $user['id'], $rating, $comment);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        $newId = $stmt->insert_id;
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Review added', 'id' => (int)$newId]);
    } catch (Exception $e) {
        error_log('Error in createGadgetReview: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to add review']);
    }
}
function replyToReview($reviewId) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    $data = json_decode(file_get_contents('php://input'), true);
    $uid = $data['userUid'] ?? null;
    $comment = trim((string)($data['comment'] ?? ''));
    if (!$uid || $comment === '') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing required fields']); return; }
    $user = getUserByUid($conn, $uid);
    if (!$user) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Auth required']); return; }
    // Find parent review and gadget
    $pstmt = $conn->prepare("SELECT gadget_id FROM reviews WHERE id = ? AND is_active = 1 LIMIT 1");
    $pstmt->bind_param('i', $reviewId);
    $pstmt->execute();
    $pres = $pstmt->get_result();
    $prow = $pres->fetch_assoc();
    $pstmt->close();
    if (!$prow) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Parent review not found']); return; }
    $gid = (int)$prow['gadget_id'];
    try {
        $stmt = $conn->prepare("INSERT INTO reviews (gadget_id, user_id, parent_id, rating, comment, likes_count, dislikes_count, is_active, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, 0, 0, 1, NOW(), NOW())");
        $stmt->bind_param('iiis', $gid, $user['id'], $reviewId, $comment);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        $newId = $stmt->insert_id;
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Reply added', 'id' => (int)$newId]);
    } catch (Exception $e) {
        error_log('Error in replyToReview: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to add reply']);
    }
}
function reactToReview($reviewId) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    $data = json_decode(file_get_contents('php://input'), true);
    $uid = $data['userUid'] ?? null;
    $reaction = $data['reaction'] ?? null;
    $allowed = ['like','dislike','emoji_smile','emoji_heart','emoji_fire','emoji_thumbs_up','emoji_thumbs_down'];
    if (!$uid || !$reaction || !in_array($reaction, $allowed, true)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing or invalid fields']); return; }
    $user = getUserByUid($conn, $uid);
    if (!$user) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Auth required']); return; }
    // Ensure review exists
    $existsStmt = $conn->prepare("SELECT id FROM reviews WHERE id = ? AND is_active = 1 LIMIT 1");
    $existsStmt->bind_param('i', $reviewId);
    $existsStmt->execute();
    $exists = $existsStmt->get_result()->fetch_assoc();
    $existsStmt->close();
    if (!$exists) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Review not found']); return; }
    try {
        // Toggle reaction: if exists, delete; otherwise insert
        $chk = $conn->prepare('SELECT id FROM review_reactions WHERE review_id = ? AND user_id = ? AND reaction = ? LIMIT 1');
        $chk->bind_param('iis', $reviewId, $user['id'], $reaction);
        $chk->execute();
        $cres = $chk->get_result();
        $row = $cres->fetch_assoc();
        $chk->close();
        if ($row) {
            $del = $conn->prepare('DELETE FROM review_reactions WHERE id = ?');
            $del->bind_param('i', $row['id']);
            $del->execute();
            $del->close();
            $action = 'removed';
        } else {
            $ins = $conn->prepare('INSERT INTO review_reactions (review_id, user_id, reaction, created_at) VALUES (?, ?, ?, NOW())');
            $ins->bind_param('iis', $reviewId, $user['id'], $reaction);
            $ins->execute();
            $ins->close();
            $action = 'added';
        }
        // Recompute likes/dislikes counters
        $cstmt = $conn->prepare("SELECT SUM(CASE WHEN reaction='like' THEN 1 ELSE 0 END) AS likes, SUM(CASE WHEN reaction='dislike' THEN 1 ELSE 0 END) AS dislikes FROM review_reactions WHERE review_id = ?");
        $cstmt->bind_param('i', $reviewId);
        $cstmt->execute();
        $cc = $cstmt->get_result()->fetch_assoc();
        $cstmt->close();
        $likes = (int)($cc['likes'] ?? 0);
        $dislikes = (int)($cc['dislikes'] ?? 0);
        $ustmt = $conn->prepare('UPDATE reviews SET likes_count = ?, dislikes_count = ?, updated_at = NOW() WHERE id = ?');
        $ustmt->bind_param('iii', $likes, $dislikes, $reviewId);
        $ustmt->execute();
        $ustmt->close();
        echo json_encode(['success' => true, 'message' => 'Reaction '.$action, 'likesCount' => $likes, 'dislikesCount' => $dislikes]);
    } catch (Exception $e) {
        error_log('Error in reactToReview: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to react']);
    }
}

// ---- Payments (PayChangu stub integration) ----
// Helper: resolve PayChangu secret from multiple sources (env, server vars, or config file)
function get_paychangu_secret() {
    // 0) Explicit constants (paste keys at top of file)
    if (defined('PAYCHANGU_SECRET_KEY') && PAYCHANGU_SECRET_KEY) { return PAYCHANGU_SECRET_KEY; }
    if (defined('PAYCHANGU_API_KEY') && PAYCHANGU_API_KEY) { return PAYCHANGU_API_KEY; }

    // 1) Environment variables
    $candidates = [
        getenv('PAYCHANGU_API_KEY') ?: null,
        getenv('PAYCHANGU_SECRET_KEY') ?: null,
        $_ENV['PAYCHANGU_API_KEY'] ?? null,
        $_ENV['PAYCHANGU_SECRET_KEY'] ?? null,
        $_SERVER['PAYCHANGU_API_KEY'] ?? null,
        $_SERVER['PAYCHANGU_SECRET_KEY'] ?? null,
    ];
    foreach ($candidates as $val) {
        if ($val) { return $val; }
    }

    // 2) Config files: .env-like or PHP returning array
    $paths = [
        __DIR__ . '/.env',
        __DIR__ . '/.env.local',
        __DIR__ . '/.env.production',
        __DIR__ . '/config.php',
        __DIR__ . '/secrets.php',
    ];
    foreach ($paths as $p) {
        if (!is_readable($p)) { continue; }
        // PHP array config: return ['PAYCHANGU_SECRET_KEY' => '...', 'PAYCHANGU_API_KEY' => '...'];
        if (substr($p, -4) === '.php') {
            $cfg = include $p;
            if (is_array($cfg)) {
                $candidate = $cfg['PAYCHANGU_SECRET_KEY'] ?? ($cfg['PAYCHANGU_API_KEY'] ?? null);
                if ($candidate) { return $candidate; }
            }
        } else {
            // .env format: KEY=VALUE
            $lines = @file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (is_array($lines)) {
                foreach ($lines as $ln) {
                    if (preg_match('/^\s*(PAYCHANGU_(?:API_KEY|SECRET_KEY))\s*=\s*(.+)\s*$/', $ln, $m)) {
                        $val = trim($m[2], " \t\n\r\0\x0B\"'" );
                        if ($val) { return $val; }
                    }
                }
            }
        }
    }
    return null;
}
function create_checkout_session() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { json_error('Invalid JSON'); }

    $items = $input['items'] ?? [];
    $customerEmail = $input['customerEmail'] ?? null;
    $successUrl = $input['successUrl'] ?? null;
    $cancelUrl = $input['cancelUrl'] ?? null;
    $installmentPlan = $input['installmentPlan'] ?? null;
    $currency = strtoupper(trim($input['currency'] ?? 'MWK'));

    // Determine amount
    $amount = 0;
    if (is_array($installmentPlan)) {
        $ptype = $installmentPlan['paymentType'] ?? $installmentPlan['type'] ?? null;
        if ($ptype === 'installment_payment') {
            $customAmount = floatval($installmentPlan['customAmount'] ?? 0);
            if ($customAmount <= 0) { json_error('Invalid custom amount for installment payment'); }
            $amount = $customAmount; // Partial payment for installments
        } else {
            // Fallback for other installment types (deposit)
            $deposit = floatval($installmentPlan['depositAmount'] ?? $installmentPlan['deposit'] ?? 0);
            $amount = $deposit > 0 ? $deposit : 0;
        }
    } else {
        // One-off purchase: sum items
        foreach ($items as $it) {
            $qty = intval($it['quantity'] ?? 1);
            $price = floatval($it['price'] ?? 0);
            $amount += ($qty * $price);
        }
    }

    if ($amount <= 0) { json_error('Amount must be greater than zero'); }
    if (!$successUrl || !$cancelUrl) { json_error('Missing successUrl or cancelUrl'); }

    // Resolve PayChangu secret from env/server/config
    $secret = get_paychangu_secret();
    if (!$secret) { json_error('PayChangu API key is not configured', 500); }

    // Generate tx_ref for traceability
    $txRef = 'SP-' . strtoupper(bin2hex(random_bytes(6)));

    // Build payload
    $payload = [
        'amount' => round($amount, 2),
        'currency' => $currency,
        'email' => $customerEmail,
        'first_name' => $input['firstName'] ?? null,
        'last_name' => $input['lastName'] ?? null,
        'callback_url' => $successUrl,
        'return_url' => $cancelUrl,
        'tx_ref' => $txRef,
        'customization' => [
            'title' => 'Xtrapush Gadgets',
            'description' => 'Checkout via Xtrapush Gadgets'
        ],
        'meta' => [
            'source' => 'sparkle-pro-api',
            'installmentPlan' => $installmentPlan,
            'items' => array_map(function($it) {
                return [
                    'id' => $it['id'] ?? null,
                    'name' => $it['name'] ?? null,
                    'quantity' => intval($it['quantity'] ?? 1),
                    'price' => floatval($it['price'] ?? 0)
                ];
            }, is_array($items) ? $items : [])
        ]
    ];

    // Call PayChangu create payment endpoint
    $ch = curl_init('https://api.paychangu.com/payment');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $secret,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($res === false) {
        $err = curl_error($ch);
        curl_close($ch);
        json_error('PayChangu request failed: ' . $err, 502);
    }
    curl_close($ch);

    $resp = json_decode($res, true);
    if ($httpCode < 200 || $httpCode >= 300 || !is_array($resp) || strtolower($resp['status'] ?? '') !== 'success') {
        $message = is_array($resp) ? ($resp['message'] ?? 'Unknown error') : 'Unknown error';
        json_error('Failed to create checkout session: ' . $message, 502);
    }

    $checkoutUrl = $resp['data']['checkout_url'] ?? null;
    $returnedTxRef = $resp['data']['data']['tx_ref'] ?? $txRef;
    if (!$checkoutUrl) { json_error('No checkout URL returned from PayChangu', 502); }

    // --- Server-side session store (file-based) ---
    try {
        $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'sessions.json';
        $store = [];
        if (is_readable($sessPath)) {
            $rawS = file_get_contents($sessPath);
            $tmp = json_decode($rawS, true);
            if (is_array($tmp)) { $store = $tmp; }
        }
        $normalizedItems = array_map(function($it){
            return [
                'id' => $it['id'] ?? null,
                'name' => $it['name'] ?? null,
                'quantity' => intval($it['quantity'] ?? 1),
                'price' => floatval($it['price'] ?? 0),
                'variantId' => isset($it['variantId']) && is_numeric($it['variantId']) ? (int)$it['variantId'] : null,
                'brand' => $it['brand'] ?? null,
                'image' => $it['image'] ?? null,
                'storage' => $it['storage'] ?? null,
            ];
        }, is_array($items) ? $items : []);
        $store[$returnedTxRef] = [
            'txRef' => $returnedTxRef,
            'amount' => $amount,
            'currency' => $currency,
            'customerEmail' => $customerEmail,
            'items' => $normalizedItems,
            'installmentPlan' => $installmentPlan,
            'status' => 'created',
            'createdAt' => date('Y-m-d H:i:s')
        ];
        file_put_contents($sessPath, json_encode($store, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    } catch (Throwable $se) {
        error_log('Session store write failed: ' . $se->getMessage());
    }

    json_ok([
        'success' => true,
        'tx_ref' => $returnedTxRef,
        'amount' => $amount,
        'currency' => $currency,
        'url' => $checkoutUrl,
        'checkout_url' => $checkoutUrl,
        'email' => $customerEmail,
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'installmentPlan' => $installmentPlan,
    ]);
}
/**
 * Helper: load session data by txRef from file store
 */
function get_checkout_session_by_ref($txRef) {
    try {
        $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'sessions.json';
        if (!is_readable($sessPath)) { return null; }
        $rawS = file_get_contents($sessPath);
        $store = json_decode($rawS, true);
        if (!is_array($store)) { return null; }
        return $store[$txRef] ?? null;
    } catch (Throwable $e) {
        return null;
    }
}

/**
 * Helper: load Square session data by txRef from square_sessions.json
 */
function get_square_session_by_ref($txRef) {
    try {
        $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'square_sessions.json';
        if (!is_readable($sessPath)) { return null; }
        $rawS = file_get_contents($sessPath);
        $store = json_decode($rawS, true);
        if (!is_array($store)) { return null; }
        return $store[$txRef] ?? null;
    } catch (Throwable $e) {
        return null;
    }
}
/**
 * Helper: update session status to paid and enrich
 */
function mark_session_paid($txRef, $amount = null, $currency = null, $email = null) {
    try {
        $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'sessions.json';
        $store = [];
        if (is_readable($sessPath)) {
            $rawS = file_get_contents($sessPath);
            $tmp = json_decode($rawS, true);
            if (is_array($tmp)) { $store = $tmp; }
        }
        if (!isset($store[$txRef])) { $store[$txRef] = ['txRef' => $txRef]; }
        $store[$txRef]['status'] = 'paid';
        $store[$txRef]['paidAt'] = date('Y-m-d H:i:s');
        if ($amount !== null) { $store[$txRef]['amount'] = $amount; }
        if ($currency !== null) { $store[$txRef]['currency'] = $currency; }
        if ($email !== null) { $store[$txRef]['customerEmail'] = $email; }
        file_put_contents($sessPath, json_encode($store, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    } catch (Throwable $e) {
        error_log('Session store update failed: ' . $e->getMessage());
    }
}
function verify_paychangu($txRef) {
    if (!$txRef) { json_error('Missing tx_ref', 400); }

    $secret = get_paychangu_secret();
    if (!$secret) { json_error('PayChangu API key is not configured', 500); }

    $url = 'https://api.paychangu.com/verify-payment/' . urlencode($txRef);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Authorization: Bearer ' . $secret,
    ]);

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($res === false) {
        $err = curl_error($ch);
        curl_close($ch);
        json_error('PayChangu verification failed: ' . $err, 502);
    }
    curl_close($ch);

    $resp = json_decode($res, true);
    if ($httpCode < 200 || $httpCode >= 300 || !is_array($resp) || strtolower($resp['status'] ?? '') !== 'success') {
        $message = is_array($resp) ? ($resp['message'] ?? 'Unknown error') : 'Unknown error';
        json_error('Failed to verify payment: ' . $message, 502);
    }

    $data = $resp['data'] ?? [];
    $sessionData = [
        'id' => $data['reference'] ?? $data['tx_ref'] ?? $txRef,
        'amount' => $data['amount'] ?? null,
        'currency' => $data['currency'] ?? null,
        'customer_email' => $data['customer']['email'] ?? null,
        'payment_status' => $data['status'] ?? null,
    ];

    json_ok(['success' => true, 'data' => $sessionData]);
}

// Simple config status endpoint for frontend diagnostics
function payments_config() {
    $secret = get_paychangu_secret();
    $configured = (bool)$secret;
    $hasPublic = (defined('PAYCHANGU_PUBLIC_KEY') && PAYCHANGU_PUBLIC_KEY);
    json_ok([
        'success' => true,
        'provider' => 'PayChangu',
        'configured' => $configured,
        'publicKeyConfigured' => (bool)$hasPublic
    ]);
}

/**
 * Helper: Create a PayChangu checkout session
 * Used by subscription creation and renewal flows
 * 
 * @param array $payload Checkout parameters
 * @return string|null Checkout URL on success, null on failure
 */
function paychangu_create_checkout($payload) {
    $secret = get_paychangu_secret();
    if (!$secret) {
        error_log('PayChangu API key is not configured');
        return null;
    }
    
    try {
        // Call PayChangu API
        $ch = curl_init('https://api.paychangu.com/payment');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $secret
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            error_log('PayChangu API request failed: ' . $error);
            return null;
        }
        
        curl_close($ch);
        
        // Parse response
        $data = json_decode($response, true);
        
        if ($httpCode < 200 || $httpCode >= 300) {
            $errorMsg = is_array($data) ? ($data['message'] ?? 'Unknown error') : 'HTTP ' . $httpCode;
            error_log('PayChangu API error (HTTP ' . $httpCode . '): ' . $errorMsg . ' | Response: ' . $response);
            return null;
        }
        
        if (!is_array($data) || strtolower($data['status'] ?? '') !== 'success') {
            error_log('PayChangu API returned non-success status: ' . json_encode($data));
            return null;
        }
        
        // Extract checkout URL
        $checkoutUrl = $data['data']['checkout_url'] ?? $data['data']['authorization_url'] ?? null;
        
        if (!$checkoutUrl) {
            error_log('PayChangu API response missing checkout URL: ' . json_encode($data));
            return null;
        }
        
        return $checkoutUrl;
        
    } catch (Throwable $e) {
        error_log('PayChangu checkout creation exception: ' . $e->getMessage());
        return null;
    }
}

// Send payment confirmation emails (customer + admin) using PHPMailer
function payments_notify_success() {
    // Parse JSON body
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) { $input = $_POST; }

    $txRef = trim((string)($input['txRef'] ?? $input['tx_ref'] ?? ''));
    $amount = floatval($input['amount'] ?? 0);
    $currency = strtoupper(trim((string)($input['currency'] ?? 'MWK')));
    $customerEmail = trim((string)($input['customerEmail'] ?? $input['email'] ?? ''));
    $paymentStatus = trim((string)($input['paymentStatus'] ?? 'success'));
    $items = is_array($input['items'] ?? null) ? $input['items'] : [];
    $installmentPlan = is_array($input['installmentPlan'] ?? null) ? $input['installmentPlan'] : null;

    // Enrich missing fields from server-side checkout session
    if ($txRef !== '') {
        $sess = get_checkout_session_by_ref($txRef);
        if (is_array($sess)) {
            if ($amount <= 0 && isset($sess['amount'])) { $amount = (float)$sess['amount']; }
            $curCurrency = $currency ?: 'MWK';
            if ((!$curCurrency || $curCurrency === 'MWK') && isset($sess['currency'])) {
                $currency = strtoupper(trim((string)$sess['currency']));
            }
            if (!$customerEmail && isset($sess['customerEmail'])) { $customerEmail = trim((string)$sess['customerEmail']); }
            if (empty($items) && is_array($sess['items'] ?? null)) { $items = $sess['items']; }
            if (!is_array($installmentPlan) && is_array($sess['installmentPlan'] ?? null)) { $installmentPlan = $sess['installmentPlan']; }
        }
        // Mark session as paid for idempotency and later recovery
        mark_session_paid($txRef, $amount, $currency, $customerEmail);
    }

    if ($txRef === '') { json_error('Missing txRef', 422); }
    if ($amount <= 0) { json_error('Invalid amount', 422); }

    // Prepare email content
    $isInstallment = is_array($installmentPlan);
    $installmentType = $isInstallment ? ($installmentPlan['paymentType'] ?? $installmentPlan['type'] ?? 'installment') : null;
    $subjectCustomer = $isInstallment ? 'Installment Payment Confirmation — Xtrapush' : 'Payment Confirmation — Xtrapush';
    $subjectAdmin = $isInstallment ? 'New Installment Payment — Xtrapush' : 'New Payment Received — Xtrapush';

    // Format amount for display
    $formattedAmount = number_format($amount, 2, '.', ',');
    $currencyCode = $currency ?: 'MWK';

    // Safe HTML helpers
    $h = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); };

    // Build items HTML if available (with optional image and brand)
    $itemsHtml = '';
    if (!empty($items)) {
        $itemsHtml .= '<div style="margin-top:8px">';
        foreach ($items as $it) {
            $name = $h($it['name'] ?? ($it['id'] ?? 'Item'));
            $qty = intval($it['quantity'] ?? 1);
            $price = floatval($it['price'] ?? 0);
            $brand = $h($it['brand'] ?? '');
            $image = isset($it['image']) ? trim((string)$it['image']) : '';
            $itemsHtml .= '<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #eee">'
                . ($image ? ('<img src="' . $h($image) . '" alt="' . $name . '" style="width:48px;height:48px;object-fit:cover;border-radius:6px;margin-right:12px" />') : '')
                . '<div style="flex:1">'
                . '<div style="font-weight:600;color:#111">' . $name . '</div>'
                . ($brand ? ('<div style="font-size:12px;color:#666">' . $brand . '</div>') : '')
                . '<div style="font-size:13px;color:#333">Qty: ' . $qty . '</div>'
                . '</div>'
                . '<div style="min-width:120px;text-align:right;font-weight:600;color:#111">' . $currencyCode . ' ' . number_format($price, 2, '.', ',') . '</div>'
                . '</div>';
        }
        $itemsHtml .= '</div>';
    }

    // Build installment section if present
    $instHtml = '';
    if ($isInstallment) {
        $instHtml .= '<div style="margin-top:8px">'
            . '<p><strong>Plan:</strong> ' . $h($installmentType) . '</p>'
            . '<p><strong>Weeks:</strong> ' . $h($installmentPlan['weeks'] ?? $installmentPlan['planWeeks'] ?? '') . '</p>'
            . '<p><strong>Weekly Amount:</strong> ' . $currencyCode . ' ' . number_format(floatval($installmentPlan['weeklyAmount'] ?? $installmentPlan['weekly'] ?? 0), 2, '.', ',') . '</p>'
            . '<p><strong>Total Amount:</strong> ' . $currencyCode . ' ' . number_format(floatval($installmentPlan['totalAmount'] ?? $installmentPlan['totalPrice'] ?? 0), 2, '.', ',') . '</p>'
            . '</div>';
    }

    try {
        $mail = getMailer();
        if (!$mail) {
            json_error('PHPMailer not installed. Please upload vendor/ or run composer install.', 500);
        }

        // Brand header with inline SVG logo
        $brandHeader = (
            '<div style="background:#000;color:#fff;padding:14px 18px;display:flex;align-items:center">'
          . '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:10px">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="#0ff" opacity="0.15" />
                <path d="M6 12h4l2-3 2 6 2-3h2" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>'
          . '<div style="font-size:16px;font-weight:700;letter-spacing:0.5px">Xtrapush</div>'
          . '</div>'
        );
        $mailCardStart = '<div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:0;margin:0">'
          . '<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:10px;overflow:hidden">'
          . $brandHeader
          . '<div style="padding:18px">';
        $mailCardEnd = '</div>'
          . '<div style="background:#fafafa;border-top:1px solid #eee;padding:12px 18px;color:#555;font-size:12px">'
          . 'If you have any questions, reply to this email. — Xtrapush Support'
          . '</div>'
          . '</div>'
          . '</div>';

        // 1) Send confirmation to customer (if email provided and valid)
        $customerResult = null;
        if ($customerEmail && filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            $mailCustomer = getMailer();
            if (!$mailCustomer) { json_error('PHPMailer not installed.', 500); }
            $mailCustomer->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
            $mailCustomer->addAddress($customerEmail);
            $mailCustomer->Subject = $subjectCustomer;
            $mailCustomer->Body = $mailCardStart
                . '<h2 style="margin:0 0 8px;color:#111">Thank you for your payment!</h2>'
                . '<p style="margin:0 0 12px;color:#333">Your payment has been recorded successfully.</p>'
                . '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:10px 0 14px">'
                . '<div style="color:#555">Reference</div><div style="text-align:right;color:#111;font-weight:600">' . $h($txRef) . '</div>'
                . '<div style="color:#555">Amount</div><div style="text-align:right;color:#111;font-weight:600">' . $currencyCode . ' ' . $formattedAmount . '</div>'
                . '<div style="color:#555">Status</div><div style="text-align:right;color:' . (strtolower($paymentStatus)==='success'?'#0a0':'#a00') . ';font-weight:700;text-transform:capitalize">' . $h($paymentStatus) . '</div>'
                . '</div>'
                . ($itemsHtml ? ('<h3 style="margin:18px 0 8px;color:#111">Purchase details</h3>' . $itemsHtml) : '')
                . ($instHtml ? ('<h3 style="margin:18px 0 8px;color:#111">Installment details</h3>' . $instHtml) : '')
                . $mailCardEnd;
            $mailCustomer->AltBody = "Payment Confirmation\nReference: $txRef\nAmount: $currencyCode $formattedAmount\nStatus: $paymentStatus";
            $mailCustomer->send();
            $customerResult = ['sent' => true];
        } else {
            $customerResult = ['sent' => false, 'reason' => 'missing_or_invalid_email'];
        }

        // 2) Send notification to admin with CC to customer
        $mailAdmin = getMailer();
        if (!$mailAdmin) { json_error('PHPMailer not installed.', 500); }
        $mailAdmin->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
        $mailAdmin->addAddress('conradzikomo@gmail.com', 'Xtrapush Admin');
        // CC the customer so they receive a copy on the admin notification
        if ($customerEmail && filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            $mailAdmin->addCC($customerEmail);
        }
        if ($customerEmail) { $mailAdmin->addReplyTo($customerEmail); }
        $mailAdmin->Subject = $subjectAdmin;
        $adminBody = $mailCardStart
            . '<h2 style="margin:0 0 8px;color:#111">New Payment Received</h2>'
            . '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:10px 0 14px">'
            . '<div style="color:#555">Reference</div><div style="text-align:right;color:#111;font-weight:600">' . $h($txRef) . '</div>'
            . '<div style="color:#555">Amount</div><div style="text-align:right;color:#111;font-weight:600">' . $currencyCode . ' ' . $formattedAmount . '</div>'
            . '<div style="color:#555">Status</div><div style="text-align:right;color:' . (strtolower($paymentStatus)==='success'?'#0a0':'#a00') . ';font-weight:700;text-transform:capitalize">' . $h($paymentStatus) . '</div>'
            . '<div style="color:#555">Customer Email</div><div style="text-align:right;color:#111">' . ($customerEmail ? $h($customerEmail) : '—') . '</div>'
            . '</div>'
            . ($itemsHtml ? ('<h3 style="margin:18px 0 8px;color:#111">Items</h3>' . $itemsHtml) : '')
            . ($instHtml ? ('<h3 style="margin:18px 0 8px;color:#111">Installment details</h3>' . $instHtml) : '')
            . '<p style="margin-top:16px;color:#777;font-size:12px">Source: sparkle-pro-api</p>'
            . $mailCardEnd;
        $mailAdmin->Body = $adminBody;
        $mailAdmin->AltBody = "New Payment\nReference: $txRef\nAmount: $currencyCode $formattedAmount\nStatus: $paymentStatus\nCustomer: $customerEmail";
        $mailAdmin->send();

        // --- Stock adjustments and order recording ---
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        $isPaid = (strtolower($paymentStatus) === 'success' || strtolower($paymentStatus) === 'paid');
        $isInstallment = is_array($installmentPlan);
        $paymentType = $isInstallment ? strtolower(trim((string)($installmentPlan['paymentType'] ?? $installmentPlan['type'] ?? 'installment'))) : null;

        // Relaxed condition: create an order record if payment is paid,
        // even when items payload is missing (to avoid losing orders).
        if ($isPaid && $conn && !$conn->connect_errno) {
            // Create order if not exists and adjust stock
            $conn->begin_transaction();
            try {
                // Resolve user by email if possible
                $userId = null;
                if ($customerEmail) {
                    $stmtU = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                    if ($stmtU) {
                        $stmtU->bind_param('s', $customerEmail);
                        $stmtU->execute();
                        $resU = $stmtU->get_result()->fetch_assoc();
                        if ($resU && isset($resU['id'])) { $userId = (int)$resU['id']; }
                        $stmtU->close();
                    }
                }

                // Ensure a single order per txRef
                $orderId = null;
                $stmtCheck = $conn->prepare("SELECT id FROM orders WHERE external_tx_ref = ? LIMIT 1");
                if ($stmtCheck) {
                    $stmtCheck->bind_param('s', $txRef);
                    $stmtCheck->execute();
                    $res = $stmtCheck->get_result()->fetch_assoc();
                    if ($res && isset($res['id'])) { $orderId = (int)$res['id']; }
                    $stmtCheck->close();
                }

                $notesJson = json_encode([
                    'paymentType' => $isInstallment ? ($paymentType ?: 'installment') : 'one_off',
                    'installmentPlan' => $installmentPlan ?: null,
                    'items' => $items
                ], JSON_UNESCAPED_SLASHES);

                if (!$orderId) {
                    $paidAt = date('Y-m-d H:i:s');
                    $status = $isInstallment ? 'processing' : 'pending';
                    $pstatus = 'paid';
                    
                    // Determine provider and get appropriate shipping address
                    $provider = 'paychangu'; // default
                    $currencyDb = $currencyCode ?: 'MWK';
                    $totalAmount = $amount;
                    $addr = '';
                    
                    // Check if this is a Square payment (GBP currency or SQ- prefix)
                    $isSquarePayment = ($currencyDb === 'GBP' || (strpos($txRef, 'SQ-') === 0));
                    
                    if ($isSquarePayment) {
                        $provider = 'square';
                        // Get shipping address from Square session
                        $squareSession = get_square_session_by_ref($txRef);
                        if (is_array($squareSession) && isset($squareSession['shippingAddress'])) {
                            $addr = $squareSession['shippingAddress'];
                            error_log("Using shipping address from Square session for txRef: $txRef - Address: " . substr($addr, 0, 50) . '...');
                        } else {
                            error_log("No shipping address found in Square session for txRef: $txRef");
                        }
                    }
                    $stmtIns = $conn->prepare("INSERT INTO orders (user_id, external_tx_ref, provider, total_amount, currency, status, payment_status, paid_at, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    if ($stmtIns) {
                        $uidParam = $userId ?: null;
                        $stmtIns->bind_param('issdsssssss', $uidParam, $txRef, $provider, $totalAmount, $currencyDb, $status, $pstatus, $paidAt, $addr, $addr, $notesJson);
                        $stmtIns->execute();
                        $orderId = $stmtIns->insert_id;
                        $stmtIns->close();
                    }
                } else {
                    // Update notes to include items/installment plan if missing
                    $stmtUpd = $conn->prepare("UPDATE orders SET notes = ? WHERE id = ?");
                    if ($stmtUpd) { $stmtUpd->bind_param('si', $notesJson, $orderId); $stmtUpd->execute(); $stmtUpd->close(); }
                }

                // Only decrement stock for one-off purchases or installment deposit (initial payment)
                $shouldDecrement = !$isInstallment || ($paymentType === 'installment_deposit');

                foreach ($items as $it) {
                    $gid = isset($it['id']) && is_numeric($it['id']) ? (int)$it['id'] : null;
                    $qty = (int)($it['quantity'] ?? 1);
                    $unitPrice = (float)($it['price'] ?? 0);
                    $variantId = isset($it['variantId']) && is_numeric($it['variantId']) ? (int)$it['variantId'] : null;

                    // Record order item
                    if ($orderId) {
                        $totalPrice = $unitPrice * max($qty,1);
                        $itemType = 'admin_gadget';
                        $storage = isset($it['storage']) ? (string)$it['storage'] : null;
                        $stmtOI = $conn->prepare("INSERT INTO order_items (order_id, gadget_id, variant_id, item_type, storage, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        if ($stmtOI) {
                            $stmtOI->bind_param('iiissidd', $orderId, $gid, $variantId, $itemType, $storage, $qty, $unitPrice, $totalPrice);
                            $stmtOI->execute();
                            $stmtOI->close();
                        }
                    }

                    if ($shouldDecrement && $gid) {
                        // Decrement variant stock if provided
                        if ($variantId) {
                            $stmtV = $conn->prepare("UPDATE gadget_variants SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?");
                            if ($stmtV) { $stmtV->bind_param('ii', $qty, $variantId); $stmtV->execute(); $stmtV->close(); }
                        }
                        // Decrement gadget stock and update in_stock
                        $stmtG = $conn->prepare("UPDATE gadgets SET stock_quantity = GREATEST(stock_quantity - ?, 0), in_stock = CASE WHEN stock_quantity - ? > 0 THEN 1 ELSE 0 END WHERE id = ?");
                        if ($stmtG) { $stmtG->bind_param('iii', $qty, $qty, $gid); $stmtG->execute(); $stmtG->close(); }
                    }
                }

                // Persist installment schedule and payment registries server-side
                if ($isInstallment && $orderId) {
                    $weeks = (int)($installmentPlan['weeks'] ?? $installmentPlan['planWeeks'] ?? $installmentPlan['durationWeeks'] ?? $installmentPlan['duration'] ?? 0);
                    $depositAmount = (float)($installmentPlan['depositAmount'] ?? $installmentPlan['deposit'] ?? 0);
                    $weeklyAmount = (float)($installmentPlan['weeklyAmount'] ?? $installmentPlan['weekly'] ?? 0);
                    $totalAmountPlan = (float)($installmentPlan['totalAmount'] ?? $installmentPlan['totalPrice'] ?? $amount);

                    $registryType = 'weekly';
                    $registryAmount = (float)($installmentPlan['payAmount'] ?? $amount);
                    if ($paymentType === 'installment_deposit') { $registryType = 'deposit'; $registryAmount = $depositAmount ?: $amount; }
                    if (($installmentPlan['payMode'] ?? '') === 'remaining') { $registryType = 'final'; }

                    // Fetch or create plan by order_id
                    $planId = null;
                    $stmtPlanCheck = $conn->prepare("SELECT id, start_at FROM installment_plans WHERE order_id = ? LIMIT 1");
                    if ($stmtPlanCheck) {
                        $stmtPlanCheck->bind_param('i', $orderId);
                        $stmtPlanCheck->execute();
                        $resP = $stmtPlanCheck->get_result()->fetch_assoc();
                        if ($resP && isset($resP['id'])) { $planId = (int)$resP['id']; }
                        $stmtPlanCheck->close();
                    }

                    if (!$planId && $paymentType === 'installment_deposit') {
                        $startAt = $paidAt ?: date('Y-m-d H:i:s');
                        $periodDays = 7;
                        $expiryAt = date('Y-m-d H:i:s', strtotime("$startAt +" . ($weeks * $periodDays) . " days"));
                        $nextDueAt = date('Y-m-d H:i:s', strtotime("$startAt +" . $periodDays . " days"));

                        $stmtCreatePlan = $conn->prepare("INSERT INTO installment_plans (order_id, user_id, status, start_at, expiry_at, next_due_at, period_days, weeks, deposit_amount, weekly_amount, total_amount, amount_paid, payments_made, grace_weeks) VALUES (?, ?, 'ongoing', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 2)");
                        if ($stmtCreatePlan) {
                            $uidParam = (int)($userId ?: 0);
                            $amountPaidInit = max(0.0, $registryAmount);
                            // order_id(i), user_id(i), start_at(s), expiry_at(s), next_due_at(s), period_days(i), weeks(i), deposit_amount(d), weekly_amount(d), total_amount(d), amount_paid(d)
                            $stmtCreatePlan->bind_param('iisssiiidddd', $orderId, $uidParam, $startAt, $expiryAt, $nextDueAt, $periodDays, $weeks, $depositAmount, $weeklyAmount, $totalAmountPlan, $amountPaidInit);
                            $stmtCreatePlan->execute();
                            $planId = $stmtCreatePlan->insert_id;
                            $stmtCreatePlan->close();
                        }
                    }

                    // Idempotent payment registry
                    if ($planId) {
                        $hasRegistry = false;
                        $stmtRegCheck = $conn->prepare("SELECT id FROM installment_payments WHERE tx_ref = ? LIMIT 1");
                        if ($stmtRegCheck) {
                            $stmtRegCheck->bind_param('s', $txRef);
                            $stmtRegCheck->execute();
                            $resR = $stmtRegCheck->get_result()->fetch_assoc();
                            if ($resR && isset($resR['id'])) { $hasRegistry = true; }
                            $stmtRegCheck->close();
                        }
                        if (!$hasRegistry) {
                            $stmtReg = $conn->prepare("INSERT INTO installment_payments (plan_id, tx_ref, amount, type, paid_at, provider, currency) VALUES (?, ?, ?, ?, ?, 'paychangu', ?)");
                            if ($stmtReg) {
                                $paidAtParam = $paidAt ?: date('Y-m-d H:i:s');
                                $stmtReg->bind_param('isdsss', $planId, $txRef, $registryAmount, $registryType, $paidAtParam, $currencyDb);
                                $stmtReg->execute();
                                $stmtReg->close();
                            }
                        }

                        // Update plan aggregates and next due
                        $stmtGetPlan = $conn->prepare("SELECT start_at, amount_paid, payments_made, total_amount, period_days FROM installment_plans WHERE id = ? LIMIT 1");
                        $startAtVal = null; $amountPaidCur = 0.0; $paymentsMadeCur = 0; $totalAmtCur = $totalAmountPlan; $periodDaysCur = 7;
                        if ($stmtGetPlan) {
                            $stmtGetPlan->bind_param('i', $planId);
                            $stmtGetPlan->execute();
                            $rGP = $stmtGetPlan->get_result()->fetch_assoc();
                            if ($rGP) {
                                $startAtVal = $rGP['start_at'] ?? null;
                                $amountPaidCur = (float)($rGP['amount_paid'] ?? 0);
                                $paymentsMadeCur = (int)($rGP['payments_made'] ?? 0);
                                $totalAmtCur = (float)($rGP['total_amount'] ?? $totalAmountPlan);
                                $periodDaysCur = (int)($rGP['period_days'] ?? 7);
                            }
                            $stmtGetPlan->close();
                        }

                        $amountPaidNew = $amountPaidCur + max(0.0, $registryAmount);
                        $paymentsMadeNew = $paymentsMadeCur + ($registryType === 'deposit' ? 0 : 1);
                        $nextDueAtNew = null;
                        if ($startAtVal && $registryType !== 'final') {
                            $nextDueAtNew = date('Y-m-d H:i:s', strtotime($startAtVal . ' +' . ($paymentsMadeNew + 1) * $periodDaysCur . ' days'));
                        }
                        $statusNew = ($amountPaidNew >= $totalAmtCur) ? 'paid' : 'ongoing';

                        $stmtUpdPlan = $conn->prepare("UPDATE installment_plans SET amount_paid = ?, payments_made = ?, next_due_at = ?, status = ? WHERE id = ?");
                        if ($stmtUpdPlan) {
                            $stmtUpdPlan->bind_param('dissi', $amountPaidNew, $paymentsMadeNew, $nextDueAtNew, $statusNew, $planId);
                            $stmtUpdPlan->execute();
                            $stmtUpdPlan->close();
                        }

                        // Back-compat: update orders.notes with authoritative schedule
                        $existingNotes = null;
                        $stmtGetNotes = $conn->prepare("SELECT notes FROM orders WHERE id = ? LIMIT 1");
                        if ($stmtGetNotes) { $stmtGetNotes->bind_param('i', $orderId); $stmtGetNotes->execute(); $rN = $stmtGetNotes->get_result()->fetch_assoc(); if ($rN && isset($rN['notes'])) { $existingNotes = $rN['notes']; } $stmtGetNotes->close(); }
                        $notesObj = null; if ($existingNotes) { $tmp = json_decode($existingNotes, true); if (is_array($tmp)) { $notesObj = $tmp; } }
                        if (!$notesObj) { $notesObj = ['items' => $items]; }
                        $instObj = is_array($notesObj['installmentPlan'] ?? null) ? $notesObj['installmentPlan'] : [];
                        $instObj['weeks'] = $weeks;
                        $instObj['depositAmount'] = $depositAmount;
                        $instObj['weeklyAmount'] = $weeklyAmount;
                        $instObj['totalAmount'] = $totalAmtCur;
                        $instObj['amountPaid'] = $amountPaidNew;
                        $instObj['paymentsMade'] = $paymentsMadeNew;
                        $instObj['startDate'] = $startAtVal;
                        // Get expiry from plan
                        $stmtGetExpiry = $conn->prepare("SELECT expiry_at FROM installment_plans WHERE id = ? LIMIT 1");
                        $expiryAtVal = null; if ($stmtGetExpiry) { $stmtGetExpiry->bind_param('i', $planId); $stmtGetExpiry->execute(); $rgE = $stmtGetExpiry->get_result()->fetch_assoc(); if ($rgE) { $expiryAtVal = $rgE['expiry_at'] ?? null; } $stmtGetExpiry->close(); }
                        $instObj['expiryDate'] = $expiryAtVal;
                        $instObj['nextDueDate'] = $nextDueAtNew;
                        if (!is_array($instObj['partials'] ?? null)) { $instObj['partials'] = []; }
                        $instObj['partials'][] = ['txRef' => $txRef, 'amount' => $registryAmount, 'paidAt' => ($paidAt ?: date('Y-m-d H:i:s')), 'type' => $registryType];
                        $notesObj['installmentPlan'] = $instObj;
                        $notesJsonNew = json_encode($notesObj, JSON_UNESCAPED_SLASHES);
                        $stmtSetNotes = $conn->prepare("UPDATE orders SET notes = ? WHERE id = ?");
                        if ($stmtSetNotes) { $stmtSetNotes->bind_param('si', $notesJsonNew, $orderId); $stmtSetNotes->execute(); $stmtSetNotes->close(); }
                    }
                }

                $conn->commit();
            } catch (Throwable $t) {
                error_log('Stock/order adjust failed: ' . $t->getMessage());
                $conn->rollback();
            }
        } elseif ($isPaid && !empty($items)) {
            // Fallback to JSON gadgets file if DB is unavailable
            try {
                $path = __DIR__ . DIRECTORY_SEPARATOR . 'gadgets.json';
                if (is_readable($path) && is_writable($path)) {
                    $rawJ = file_get_contents($path);
                    $dataJ = json_decode($rawJ, true);
                    if (is_array($dataJ)) {
                        $indexById = [];
                        foreach ($dataJ as $idx => $g) { $indexById[$g['id'] ?? $idx] = $idx; }
                        $isInstallment = is_array($installmentPlan);
                        $ptype = $isInstallment ? strtolower(trim((string)($installmentPlan['paymentType'] ?? $installmentPlan['type'] ?? 'installment'))) : null;
                        $shouldDecrement = !$isInstallment || ($ptype === 'installment_deposit');
                        foreach ($items as $it) {
                            $gid = isset($it['id']) && is_numeric($it['id']) ? (int)$it['id'] : null;
                            $qty = (int)($it['quantity'] ?? 1);
                            if ($gid !== null && isset($indexById[$gid]) && $shouldDecrement) {
                                $i = $indexById[$gid];
                                $cur = (int)($dataJ[$i]['stock_quantity'] ?? $dataJ[$i]['stock'] ?? 0);
                                $new = max($cur - $qty, 0);
                                $dataJ[$i]['stock_quantity'] = $new;
                                $dataJ[$i]['in_stock'] = $new > 0 ? 1 : 0;
                            }
                        }
                        file_put_contents($path, json_encode($dataJ, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
                    }
                }
            } catch (Throwable $tj) {
                error_log('JSON stock adjust failed: ' . $tj->getMessage());
            }
        }

        json_ok(['success' => true, 'customer' => $customerResult]);
    } catch (Throwable $e) {
        error_log('PHPMailer payment notify error: ' . $e->getMessage());
        json_error('Failed to send payment notifications', 500, ['details' => $e->getMessage()]);
    }
}

/**
 * Handle subscription renewal payment success
 * Called from PayChangu webhook when subscription renewal is paid
 */
function handle_subscription_renewal_payment($txRef, $amount, $currency, $userUid) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            error_log('Database connection error for renewal payment handling');
            return false;
        }
        
        // Get user subscription details
        $stmt = $conn->prepare("
            SELECT id, subscription_id, subscription_tier, subscription_status, subscription_payment_gateway
            FROM users WHERE uid = ? LIMIT 1
        ");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$user) {
            error_log("User not found for subscription renewal: $userUid");
            return false;
        }
        
        // Only process for PayChangu gateway
        if ($user['subscription_payment_gateway'] !== 'paychangu') {
            error_log("Subscription renewal payment for non-PayChangu gateway: $userUid");
            return false;
        }
        
        // Update subscription status to ACTIVE and set next renewal date
        $nextRenewal = date('Y-m-d', strtotime('+1 month'));
        $subscriptionId = $user['subscription_id'];
        
        $updateStmt = $conn->prepare("
            UPDATE users 
            SET subscription_status = 'ACTIVE', 
                subscription_active = 1,
                subscription_renewal_date = ?,
                subscription_grace_period_end = NULL,
                subscription_pending_tx_ref = NULL,
                subscription_updated_at = NOW()
            WHERE uid = ?
        ");
        $updateStmt->bind_param('ss', $nextRenewal, $userUid);
        $updateStmt->execute();
        $updateStmt->close();
        
        // Record renewal success in history
        $amountInCurrency = $amount;
        record_subscription_history($userUid, $subscriptionId, 'RENEWED', 
            'PENDING_PAYMENT', 'ACTIVE', $amountInCurrency, 
            'PayChangu renewal payment successful. Next renewal: ' . $nextRenewal);
        
        error_log("Subscription renewal successful for $userUid: $subscriptionId");
        return true;
        
    } catch (Throwable $e) {
        error_log('Error handling subscription renewal payment: ' . $e->getMessage());
        return false;
    }
}

// PayChangu webhook: receive provider callback and forward to success handler
function payments_paychangu_webhook() {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    if (!is_array($body)) { $body = $_POST; }

    // PayChangu payloads typically nest under `data`
    $data = is_array($body['data'] ?? null) ? $body['data'] : $body;
    $txRef = trim((string)($data['reference'] ?? $data['tx_ref'] ?? $data['txRef'] ?? ''));
    if ($txRef === '') { json_error('Missing txRef/reference', 422); }

    $amount = floatval($data['amount'] ?? 0);
    $currency = strtoupper(trim((string)($data['currency'] ?? 'MWK')));
    $status = trim((string)($data['status'] ?? $body['status'] ?? 'success'));
    $customerEmail = trim((string)($data['customer']['email'] ?? $data['email'] ?? ''));

    $meta = is_array($data['meta'] ?? null) ? $data['meta'] : [];
    $items = is_array($meta['items'] ?? null) ? $meta['items'] : [];
    $installmentPlan = is_array($meta['installmentPlan'] ?? null) ? $meta['installmentPlan'] : null;

    // Check if this is a subscription renewal payment by txRef pattern
    $isSubscriptionRenewal = stripos($txRef, 'RENEWAL-') === 0;
    
    // Enrich from server-side session store
    $sess = get_checkout_session_by_ref($txRef);
    if (is_array($sess)) {
        if ($amount <= 0 && isset($sess['amount'])) { $amount = (float)$sess['amount']; }
        if (empty($items) && is_array($sess['items'] ?? null)) { $items = $sess['items']; }
        if (!$customerEmail && isset($sess['customerEmail'])) { $customerEmail = trim((string)$sess['customerEmail']); }
        if (!is_array($installmentPlan) && is_array($sess['installmentPlan'] ?? null)) { $installmentPlan = $sess['installmentPlan']; }
        if ((!$currency || $currency === 'MWK') && isset($sess['currency'])) { $currency = strtoupper(trim((string)$sess['currency'])); }
    }

    // Mark session paid for idempotency
    mark_session_paid($txRef, $amount, $currency, $customerEmail);

    // Handle subscription renewal or initial payment
    if ($isSubscriptionRenewal && $status === 'success') {
        // Extract userUid from meta or find by email
        $userUid = $meta['userUid'] ?? null;
        
        if (!$userUid) {
            // Try to find the user by email
            try {
                $db = DatabaseConnection::getInstance();
                $conn = $db->getConnection();
                if ($conn && !$conn->connect_errno) {
                    $stmt = $conn->prepare("SELECT uid FROM users WHERE email = ? LIMIT 1");
                    $stmt->bind_param('s', $customerEmail);
                    $stmt->execute();
                    $result = $stmt->get_result()->fetch_assoc();
                    $stmt->close();
                    
                    if ($result && $result['uid']) {
                        $userUid = $result['uid'];
                    }
                }
            } catch (Throwable $e) {
                error_log('Error extracting user for renewal: ' . $e->getMessage());
            }
        }
        
        if ($userUid) {
            handle_subscription_renewal_payment($txRef, $amount, $currency, $userUid);
        }
        
        json_ok(['success' => true, 'message' => 'Subscription renewal payment processed']);
        return;
    }
    
    // Check if this is an initial subscription payment
    $isSubscriptionInitial = stripos($txRef, 'SUB-INITIAL-') === 0;
    $subscriptionType = $meta['type'] ?? null;
    
    if (($isSubscriptionInitial || $subscriptionType === 'subscription_initial') && $status === 'success') {
        $userUid = $meta['userUid'] ?? null;
        $tier = $meta['tier'] ?? 'plus';
        
        if (!$userUid) {
            // Try to find the user by email
            try {
                $db = DatabaseConnection::getInstance();
                $conn = $db->getConnection();
                if ($conn && !$conn->connect_errno) {
                    $stmt = $conn->prepare("SELECT uid FROM users WHERE email = ? LIMIT 1");
                    $stmt->bind_param('s', $customerEmail);
                    $stmt->execute();
                    $result = $stmt->get_result()->fetch_assoc();
                    $stmt->close();
                    
                    if ($result && $result['uid']) {
                        $userUid = $result['uid'];
                    }
                }
            } catch (Throwable $e) {
                error_log('Error extracting user for subscription: ' . $e->getMessage());
            }
        }
        
        if ($userUid) {
            try {
                $db = DatabaseConnection::getInstance();
                $conn = $db->getConnection();
                if ($conn && !$conn->connect_errno) {
                    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                    $stmt = $conn->prepare("
                        UPDATE users 
                        SET subscription_id = ?, 
                            subscription_status = 'ACTIVE', 
                            subscription_active = 1,
                            subscription_tier = ?,
                            subscription_start_date = NOW(), 
                            subscription_renewal_date = ?,
                            subscription_payment_gateway = 'paychangu',
                            subscription_pending_tx_ref = NULL,
                            subscription_updated_at = NOW()
                        WHERE uid = ?
                    ");
                    if ($stmt) {
                        $stmt->bind_param('ssss', $txRef, $tier, $nextRenewal, $userUid);
                        $stmt->execute();
                        $stmt->close();
                    }
                    
                    // Record subscription activation
                    record_subscription_history($userUid, $txRef, 'ACTIVATED', 'PENDING', 'ACTIVE', 
                        $amount, 'PayChangu subscription payment successful. Subscription activated.');
                    
                    error_log("Subscription activated for $userUid via PayChangu: $txRef");
                }
            } catch (Throwable $e) {
                error_log('Error activating subscription: ' . $e->getMessage());
            }
        }
        
        json_ok(['success' => true, 'message' => 'Subscription activated successfully']);
        return;
    }

    // Forward regular payments to unified handler
    $_POST = [
        'txRef' => $txRef,
        'amount' => $amount,
        'currency' => $currency,
        'customerEmail' => $customerEmail,
        'paymentStatus' => $status ?: 'success',
        'items' => $items,
        'installmentPlan' => $installmentPlan,
    ];
    payments_notify_success();
}

// ===================================
// SQUARE PAYMENT FUNCTIONS (International - GBP)
// ===================================

/**
 * Helper function to make Square API calls
 */
function square_api_call($endpoint, $method = 'GET', $data = null) {
    $url = SQUARE_API_URL . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Square-Version: 2024-01-18',
        'Authorization: Bearer ' . SQUARE_ACCESS_TOKEN,
        'Content-Type: application/json',
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($res === false) {
        return ['success' => false, 'error' => $error, 'httpCode' => 0];
    }
    
    $response = json_decode($res, true);
    return [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'httpCode' => $httpCode,
        'data' => $response,
        'error' => $response['errors'][0]['detail'] ?? null
    ];
}

/**
 * Create Square Checkout Payment Link for international customers (GBP)
 * Uses Square Checkout API: https://developer.squareup.com/docs/checkout-api
 */
function square_create_checkout_session() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { json_error('Invalid JSON'); }

    $items = $input['items'] ?? [];
    $customerEmail = $input['customerEmail'] ?? null;
    $successUrl = $input['successUrl'] ?? null;
    $cancelUrl = $input['cancelUrl'] ?? null;
    $installmentPlan = $input['installmentPlan'] ?? null;
    $includeSubscription = $input['includeSubscription'] ?? false;
    $subscriptionTier = $input['subscriptionTier'] ?? null; // 'plus' or 'premium'
    $userUid = $input['userUid'] ?? null;
    $currency = 'GBP';

    // Check Square configuration
    if (!defined('SQUARE_ACCESS_TOKEN') || empty(SQUARE_ACCESS_TOKEN)) {
        json_error('Square API is not configured', 500);
    }

    // Determine amount
    $amount = 0;
    if (is_array($installmentPlan)) {
        $ptype = $installmentPlan['paymentType'] ?? $installmentPlan['type'] ?? null;
        if ($ptype === 'installment_payment') {
            $customAmount = floatval($installmentPlan['customAmount'] ?? 0);
            if ($customAmount <= 0) { json_error('Invalid custom amount for installment payment'); }
            $amount = $customAmount;
        } else {
            $deposit = floatval($installmentPlan['depositAmount'] ?? $installmentPlan['deposit'] ?? 0);
            $amount = $deposit > 0 ? $deposit : 0;
        }
    } else {
        foreach ($items as $it) {
            $qty = intval($it['quantity'] ?? 1);
            $price = floatval($it['price'] ?? 0);
            $amount += ($qty * $price);
        }
    }

    if ($amount <= 0) { json_error('Amount must be greater than zero'); }
    if (!$successUrl || !$cancelUrl) { json_error('Missing successUrl or cancelUrl'); }

    // Generate tx_ref for traceability
    $txRef = 'SQ-' . strtoupper(bin2hex(random_bytes(8)));
    $idempotencyKey = uniqid('sq_', true);

    // Build line items for Square
    $lineItems = [];
    if (is_array($installmentPlan)) {
        // For installment payments, include item details in the name/note
        $itemNames = [];
        foreach ($items as $it) {
            $itemNames[] = $it['name'] ?? 'Product';
        }
        $installmentDesc = count($itemNames) > 0 ? implode(', ', $itemNames) : 'Gadget';
        
        $lineItems[] = [
            'name' => 'Installment Deposit - ' . $installmentDesc,
            'quantity' => '1',
            'base_price_money' => [
                'amount' => intval($amount * 100), // Square uses pence
                'currency' => $currency
            ],
            'note' => 'Pay-to-Own installment plan deposit'
        ];
    } else {
        foreach ($items as $it) {
            // Build comprehensive description for Square checkout
            $descParts = [];
            if (!empty($it['brand'])) { $descParts[] = $it['brand']; }
            if (!empty($it['condition'])) { 
                $condLabel = ['new' => 'New', 'like_new' => 'Like New', 'good' => 'Good', 'fair' => 'Fair'];
                $descParts[] = $condLabel[$it['condition']] ?? ucfirst($it['condition']); 
            }
            if (!empty($it['storage'])) { $descParts[] = $it['storage']; }
            if (!empty($it['color'])) { $descParts[] = $it['color']; }
            $note = !empty($descParts) ? implode(' • ', $descParts) : 'Xtrapush Gadget';
            
            // Create descriptive name with key specs
            $productName = $it['name'] ?? 'Product';
            if (!empty($it['storage']) && strpos($productName, $it['storage']) === false) {
                $productName .= ' ' . $it['storage'];
            }
            
            $lineItem = [
                'name' => $productName,
                'quantity' => strval(intval($it['quantity'] ?? 1)),
                'base_price_money' => [
                    'amount' => intval(floatval($it['price'] ?? 0) * 100),
                    'currency' => $currency
                ],
                'note' => $note
            ];
            
            // Note: Square Payment Links API does NOT support image_url on ad-hoc line items
            // Images only work with Catalog API items. The image is stored in session for success page.
            
            $lineItems[] = $lineItem;
        }
    }

    // Add subscription line item if opted in (Plus or Premium tier)
    if ($includeSubscription && $subscriptionTier) {
        // Subscription pricing: Plus £6.00, Premium £9.99
        $subscriptionPrices = [
            'plus' => ['amount' => 600, 'name' => 'Xtrapush Plus'],
            'premium' => ['amount' => 999, 'name' => 'Xtrapush Premium']
        ];
        $subInfo = $subscriptionPrices[$subscriptionTier] ?? $subscriptionPrices['plus'];
        
        $lineItems[] = [
            'name' => $subInfo['name'] . ' (Monthly)',
            'quantity' => '1',
            'base_price_money' => [
                'amount' => $subInfo['amount'],
                'currency' => $currency
            ],
            'note' => 'Free delivery, insurance & discounts - Monthly subscription'
        ];
    }

    // Build Square Checkout payload
    $checkoutPayload = [
        'idempotency_key' => $idempotencyKey,
        'order' => [
            'location_id' => SQUARE_LOCATION_ID ?: 'main',
            'reference_id' => $txRef,
            'line_items' => $lineItems,
        ],
        'checkout_options' => [
            'redirect_url' => $successUrl . '?tx_ref=' . $txRef . ($includeSubscription ? '&subscription=pending' : ''),
            'merchant_support_email' => 'support@itsxtrapush.com',
            'ask_for_shipping_address' => false, // Use user's profile address instead
            'accepted_payment_methods' => [
                'apple_pay' => true,
                'google_pay' => true,
                'cash_app_pay' => false,
                'afterpay_clearpay' => false
            ]
        ],
    ];

    // Note: Subscription will be created separately after payment completes via webhook
    // The subscription_plan_id is stored in session data for webhook processing

    // Get user profile information including address for order processing
    $shippingAddress = '';
    if ($userUid) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if ($conn && !$conn->connect_errno) {
            $stmt = $conn->prepare("SELECT full_name, address, town, postcode, phone FROM users WHERE uid = ? LIMIT 1");
            if ($stmt) {
                $stmt->bind_param('s', $userUid);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                
                if ($result) {
                    // Construct full shipping address
                    $addressParts = [];
                    if (!empty($result['address'])) {
                        $addressParts[] = $result['address'];
                    }
                    if (!empty($result['town'])) {
                        $addressParts[] = $result['town'];
                    }
                    if (!empty($result['postcode'])) {
                        $addressParts[] = $result['postcode'];
                    }
                    
                    $shippingAddress = implode(', ', $addressParts);
                    
                    // Add customer name if available
                    if (!empty($result['full_name']) && $customerEmail) {
                        $checkoutPayload['pre_populated_data'] = [
                            'buyer_email' => $customerEmail,
                            'buyer_name' => $result['full_name']
                        ];
                    }
                }
            }
        }
    } elseif ($customerEmail) {
        $checkoutPayload['pre_populated_data'] = [
            'buyer_email' => $customerEmail
        ];
    }

    // Log the payload for debugging
    error_log('Square checkout payload: ' . json_encode($checkoutPayload));

    // Call Square API to create payment link
    $result = square_api_call('/online-checkout/payment-links', 'POST', $checkoutPayload);
    
    if (!$result['success']) {
        $errorMsg = $result['error'] ?? 'Failed to create Square checkout';
        error_log('Square checkout error: ' . json_encode($result));
        json_error('Square checkout failed: ' . $errorMsg, 502);
    }

    $checkoutUrl = $result['data']['payment_link']['url'] ?? null;
    $orderId = $result['data']['payment_link']['order_id'] ?? null;
    $paymentLinkId = $result['data']['payment_link']['id'] ?? null;

    if (!$checkoutUrl) {
        json_error('No checkout URL returned from Square', 502);
    }

    // Store session data including shipping address
    try {
        $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'square_sessions.json';
        $store = [];
        if (is_readable($sessPath)) {
            $rawS = file_get_contents($sessPath);
            $tmp = json_decode($rawS, true);
            if (is_array($tmp)) { $store = $tmp; }
        }
        $normalizedItems = array_map(function($it){
            return [
                'id' => $it['id'] ?? null,
                'name' => $it['name'] ?? null,
                'quantity' => intval($it['quantity'] ?? 1),
                'price' => floatval($it['price'] ?? 0),
                'variantId' => isset($it['variantId']) && is_numeric($it['variantId']) ? (int)$it['variantId'] : null,
                'brand' => $it['brand'] ?? null,
                'image' => $it['image'] ?? null,
                'storage' => $it['storage'] ?? null,
            ];
        }, is_array($items) ? $items : []);
        $store[$txRef] = [
            'txRef' => $txRef,
            'squareOrderId' => $orderId,
            'squarePaymentLinkId' => $paymentLinkId,
            'amount' => $amount,
            'currency' => $currency,
            'customerEmail' => $customerEmail,
            'items' => $normalizedItems,
            'installmentPlan' => $installmentPlan,
            'includesSubscription' => $includeSubscription,
            'subscriptionTier' => $subscriptionTier,
            'userUid' => $userUid,
            'shippingAddress' => $shippingAddress, // Store the profile address
            'status' => 'created',
            'createdAt' => date('Y-m-d H:i:s')
        ];
        file_put_contents($sessPath, json_encode($store, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    } catch (Throwable $se) {
        error_log('Square session store write failed: ' . $se->getMessage());
    }

    json_ok([
        'success' => true,
        'tx_ref' => $txRef,
        'order_id' => $orderId,
        'payment_link_id' => $paymentLinkId,
        'amount' => $amount,
        'currency' => $currency,
        'url' => $checkoutUrl,
        'checkout_url' => $checkoutUrl,
        'email' => $customerEmail,
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'installmentPlan' => $installmentPlan,
        'includesSubscription' => $includeSubscription,
        'provider' => 'square',
    ]);
}

/**
 * Verify Square payment status
 */
function square_verify_payment($txRefOrOrderId) {
    if (!$txRefOrOrderId) { json_error('Missing tx_ref or order_id', 400); }

    if (!defined('SQUARE_ACCESS_TOKEN') || empty(SQUARE_ACCESS_TOKEN)) {
        json_error('Square API is not configured', 500);
    }

    // Look up order ID from tx_ref if needed
    $orderId = $txRefOrOrderId;
    $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'square_sessions.json';
    $sessionData = null;
    
    if (strpos($txRefOrOrderId, 'SQ-') === 0) {
        if (is_readable($sessPath)) {
            $store = json_decode(file_get_contents($sessPath), true);
            if (is_array($store) && isset($store[$txRefOrOrderId])) {
                $sessionData = $store[$txRefOrOrderId];
                $orderId = $sessionData['squareOrderId'] ?? $txRefOrOrderId;
            }
        }
    }

    // Get order details from Square
    $result = square_api_call('/orders/' . urlencode($orderId));
    
    if (!$result['success']) {
        // Try to get payment info from session store
        if ($sessionData) {
            json_ok([
                'success' => true,
                'data' => [
                    'id' => $orderId,
                    'tx_ref' => $txRefOrOrderId,
                    'amount' => $sessionData['amount'] ?? 0,
                    'currency' => $sessionData['currency'] ?? 'GBP',
                    'customer_email' => $sessionData['customerEmail'] ?? null,
                    'payment_status' => $sessionData['status'] ?? 'unknown',
                    'provider' => 'square',
                ]
            ]);
        }
        json_error('Failed to verify Square payment: ' . ($result['error'] ?? 'Unknown error'), 502);
    }

    $order = $result['data']['order'] ?? [];
    $state = strtolower($order['state'] ?? 'unknown');
    $status = ($state === 'completed') ? 'success' : $state;

    $totalMoney = $order['total_money'] ?? [];
    $amount = ($totalMoney['amount'] ?? 0) / 100;
    $currency = $totalMoney['currency'] ?? 'GBP';

    // Update session store if payment is successful
    if ($state === 'completed') {
        try {
            $store = [];
            if (is_readable($sessPath)) {
                $tmp = json_decode(file_get_contents($sessPath), true);
                if (is_array($tmp)) { $store = $tmp; }
            }
            $txRef = $order['reference_id'] ?? $txRefOrOrderId;
            if (isset($store[$txRef])) {
                $store[$txRef]['status'] = 'paid';
                $store[$txRef]['paidAt'] = date('Y-m-d H:i:s');
                file_put_contents($sessPath, json_encode($store, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
            }
        } catch (Throwable $e) {
            error_log('Square session update failed: ' . $e->getMessage());
        }
    }

    json_ok([
        'success' => true,
        'data' => [
            'id' => $orderId,
            'tx_ref' => $order['reference_id'] ?? $txRefOrOrderId,
            'amount' => $amount,
            'currency' => $currency,
            'customer_email' => $sessionData['customerEmail'] ?? null,
            'payment_status' => $status,
            'provider' => 'square',
        ]
    ]);
}

/**
 * Get Square configuration for frontend
 */
function square_get_config() {
    $configured = defined('SQUARE_ACCESS_TOKEN') && !empty(SQUARE_ACCESS_TOKEN);
    
    json_ok([
        'success' => true,
        'provider' => 'Square',
        'configured' => $configured,
        'appId' => defined('SQUARE_APP_ID') ? SQUARE_APP_ID : '',
        'currency' => 'GBP',
        'supportedCountries' => 'all_except_MW',
    ]);
}

/**
 * Handle Square webhook events
 */
function square_webhook_handler() {
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_SQUARE_HMACSHA256_SIGNATURE'] ?? '';
    
    // Verify webhook signature
    if (defined('SQUARE_WEBHOOK_SIGNATURE_KEY') && !empty(SQUARE_WEBHOOK_SIGNATURE_KEY)) {
        $expectedSig = base64_encode(hash_hmac('sha256', SQUARE_WEBHOOK_URL . $payload, SQUARE_WEBHOOK_SIGNATURE_KEY, true));
        if (!hash_equals($expectedSig, $signature)) {
            error_log('Square webhook signature mismatch');
            http_response_code(401);
            json_error('Invalid signature', 401);
            return;
        }
    }

    $event = json_decode($payload, true);
    if (!is_array($event)) {
        json_error('Invalid webhook payload', 400);
        return;
    }

    $eventType = $event['type'] ?? '';
    $data = $event['data']['object'] ?? [];

    switch ($eventType) {
        case 'payment.completed':
            $payment = $data['payment'] ?? [];
            $orderId = $payment['order_id'] ?? '';
            $amount = ($payment['amount_money']['amount'] ?? 0) / 100;
            $currency = $payment['amount_money']['currency'] ?? 'GBP';
            
            // Load session data
            $sessPath = __DIR__ . DIRECTORY_SEPARATOR . 'square_sessions.json';
            $items = [];
            $installmentPlan = null;
            $customerEmail = '';
            $txRef = '';
            $includesSubscription = false;
            $subscriptionTier = null;
            $userUid = null;
            
            if (is_readable($sessPath)) {
                $store = json_decode(file_get_contents($sessPath), true);
                if (is_array($store)) {
                    foreach ($store as $ref => $sess) {
                        if (($sess['squareOrderId'] ?? '') === $orderId) {
                            $txRef = $ref;
                            $items = $sess['items'] ?? [];
                            $installmentPlan = $sess['installmentPlan'] ?? null;
                            $customerEmail = $sess['customerEmail'] ?? '';
                            $includesSubscription = $sess['includesSubscription'] ?? false;
                            $subscriptionTier = $sess['subscriptionTier'] ?? 'plus';
                            $userUid = $sess['userUid'] ?? null;
                            
                            // Update status
                            $store[$ref]['status'] = 'paid';
                            $store[$ref]['paidAt'] = date('Y-m-d H:i:s');
                            file_put_contents($sessPath, json_encode($store, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
                            break;
                        }
                    }
                }
            }

            // If checkout included subscription, activate it for the user
            if ($includesSubscription && $userUid && $subscriptionTier) {
                try {
                    $db = DatabaseConnection::getInstance();
                    $conn = $db->getConnection();
                    if ($conn && !$conn->connect_errno) {
                        // Create subscription record - subscription was paid as part of checkout
                        $subscriptionId = 'SUB-' . strtoupper(bin2hex(random_bytes(8)));
                        $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                        
                        $stmt = $conn->prepare("
                            UPDATE users 
                            SET subscription_id = ?, 
                                subscription_status = 'ACTIVE', 
                                subscription_active = 1,
                                subscription_tier = ?,
                                subscription_payment_gateway = 'square',
                                subscription_start_date = NOW(), 
                                subscription_renewal_date = ?,
                                subscription_updated_at = NOW()
                            WHERE uid = ?
                        ");
                        if ($stmt) {
                            $stmt->bind_param('ssss', $subscriptionId, $subscriptionTier, $nextRenewal, $userUid);
                            $stmt->execute();
                            $stmt->close();
                            
                            // Record subscription amount based on tier
                            $tierPrices = ['plus' => 6.00, 'premium' => 9.99];
                            $subAmount = $tierPrices[$subscriptionTier] ?? 6.00;
                            record_subscription_history($userUid, $subscriptionId, 'ACTIVATED', null, 'ACTIVE', $subAmount, 'Activated via checkout payment - ' . ucfirst($subscriptionTier));
                            error_log('Subscription activated for user ' . $userUid . ' - Tier: ' . $subscriptionTier);
                        }
                    }
                } catch (Throwable $e) {
                    error_log('Failed to activate subscription from checkout: ' . $e->getMessage());
                }
            }

            // Trigger notification
            $_POST = [
                'txRef' => $txRef,
                'amount' => $amount,
                'currency' => $currency,
                'customerEmail' => $customerEmail,
                'paymentStatus' => 'success',
                'items' => $items,
                'installmentPlan' => $installmentPlan,
                'provider' => 'square',
            ];
            payments_notify_success();
            break;

        case 'order.updated':
            $order = $data['order'] ?? [];
            $state = $order['state'] ?? '';
            $orderId = $order['id'] ?? '';
            error_log("Square order updated: $orderId -> $state");
            break;

        case 'subscription.created':
        case 'subscription.updated':
            // Handle subscription events
            $subscription = $data['subscription'] ?? [];
            $subscriptionId = $subscription['id'] ?? '';
            $customerId = $subscription['customer_id'] ?? '';
            $status = $subscription['status'] ?? '';
            $planId = $subscription['plan_id'] ?? '';
            error_log("Square subscription event: $eventType - $subscriptionId ($status)");
            
            // Update user subscription status in database
            square_update_user_subscription($customerId, $subscriptionId, $status);
            
            // If subscription is ACTIVE, ensure start_date and renewal_date are set
            if (strtoupper($status) === 'ACTIVE') {
                try {
                    $db = DatabaseConnection::getInstance();
                    $conn = $db->getConnection();
                    if ($conn && !$conn->connect_errno) {
                        // Get current subscription_start_date
                        $stmt = $conn->prepare("SELECT uid, subscription_start_date, subscription_tier FROM users WHERE square_customer_id = ? LIMIT 1");
                        if ($stmt) {
                            $stmt->bind_param('s', $customerId);
                            $stmt->execute();
                            $result = $stmt->get_result()->fetch_assoc();
                            $stmt->close();
                            
                            if ($result) {
                                $userUid = $result['uid'];
                                $tier = $result['subscription_tier'] ?? 'plus';
                                
                                // If no start_date, set it now
                                if (empty($result['subscription_start_date'])) {
                                    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                                    $updateStmt = $conn->prepare("
                                        UPDATE users 
                                        SET subscription_start_date = NOW(),
                                            subscription_renewal_date = ?,
                                            subscription_updated_at = NOW()
                                        WHERE uid = ?
                                    ");
                                    if ($updateStmt) {
                                        $updateStmt->bind_param('ss', $nextRenewal, $userUid);
                                        $updateStmt->execute();
                                        $updateStmt->close();
                                    }
                                }
                                
                                // Record activation
                                $action = 'ACTIVATED';
                                $tierPrices = ['plus' => 6.00, 'premium' => 9.99];
                                $amount = $tierPrices[$tier] ?? 6.00;
                                record_subscription_history($userUid, $subscriptionId, $action, null, $status, $amount, 'Via Square webhook - subscription active');
                            }
                        }
                    }
                } catch (Throwable $e) {
                    error_log('Failed to set subscription dates: ' . $e->getMessage());
                }
            }
            break;

        default:
            error_log("Unhandled Square event: $eventType");
    }

    json_ok(['success' => true, 'received' => true]);
}

// ===================================
// SQUARE SUBSCRIPTION FUNCTIONS
// ===================================

/**
 * Create or get subscription plan for Xtrapush Premium (£5/month)
 */
function square_get_or_create_subscription_plan() {
    $planName = 'Xtrapush Premium';
    $planPrice = 500; // £5.00 in pence
    
    // First, try to find existing catalog item for subscription
    $searchResult = square_api_call('/catalog/search', 'POST', [
        'object_types' => ['SUBSCRIPTION_PLAN'],
        'query' => [
            'text_query' => [
                'keywords' => ['Xtrapush Premium']
            ]
        ]
    ]);
    
    if ($searchResult['success'] && !empty($searchResult['data']['objects'])) {
        $plan = $searchResult['data']['objects'][0];
        // Return the subscription plan variation ID, not the catalog object ID
        $subscriptionPlanData = $plan['subscription_plan_data'] ?? null;
        if ($subscriptionPlanData) {
            // For subscription plans, we need the plan variation ID which is typically in subscription_plan_variations
            $variations = $subscriptionPlanData['subscription_plan_variations'] ?? [];
            if (!empty($variations)) {
                return $variations[0]['id'] ?? $plan['id'];
            }
        }
        return $plan['id'];
    }
    
    // Create subscription plan if not exists
    $idempotencyKey = 'xp_sub_plan_' . md5($planName);
    
    $createResult = square_api_call('/catalog/object', 'POST', [
        'idempotency_key' => $idempotencyKey,
        'object' => [
            'type' => 'SUBSCRIPTION_PLAN',
            'id' => '#xp_premium_plan',
            'subscription_plan_data' => [
                'name' => $planName,
                'phases' => [
                    [
                        'cadence' => 'MONTHLY',
                        'recurring_price_money' => [
                            'amount' => $planPrice,
                            'currency' => 'GBP'
                        ]
                    ]
                ]
            ]
        ]
    ]);
    
    if (!$createResult['success']) {
        return null;
    }
    
    $catalogObject = $createResult['data']['catalog_object'] ?? null;
    if (!$catalogObject) {
        return null;
    }
    
    // Return the subscription plan variation ID if available
    $subscriptionPlanData = $catalogObject['subscription_plan_data'] ?? null;
    if ($subscriptionPlanData) {
        $variations = $subscriptionPlanData['subscription_plan_variations'] ?? [];
        if (!empty($variations)) {
            return $variations[0]['id'] ?? $catalogObject['id'];
        }
    }
    
    return $catalogObject['id'];
}

/**
 * Create subscription for a user
 */
function square_create_subscription() {
    // Wrap entire function in try-catch to prevent 502 errors
    try {
        // Log raw input for debugging
        $rawInput = file_get_contents('php://input');
        error_log('Raw subscription input received: ' . substr($rawInput, 0, 500)); // First 500 chars
        
        $input = json_decode($rawInput, true);
        
        // Check JSON decode errors
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('JSON decode error: ' . json_last_error_msg());
            json_error('Invalid JSON: ' . json_last_error_msg(), 400);
        }
        
        if (!is_array($input)) {
            error_log('Input is not an array, type: ' . gettype($input));
            json_error('Invalid JSON - expected object/array', 400);
        }
        
        // Log incoming request for debugging
        error_log('Subscription creation request: ' . json_encode([
            'userUid' => $input['userUid'] ?? 'missing',
            'customerEmail' => $input['customerEmail'] ?? 'missing',
            'tier' => $input['tier'] ?? 'missing',
            'gateway' => $input['gateway'] ?? 'missing',
            'currency' => $input['currency'] ?? 'missing'
        ]));
        
        $userUid = $input['userUid'] ?? null;
        $customerEmail = $input['customerEmail'] ?? null;
        $tier = $input['tier'] ?? 'plus'; // 'plus' or 'premium', default to plus
        $cardId = $input['cardId'] ?? null; // From Square Web Payments SDK
        $successUrl = $input['successUrl'] ?? 'https://itsxtrapush.com/dashboard';
        $gateway = $input['gateway'] ?? 'square'; // 'square' or 'paychangu'
        $customerName = $input['customerName'] ?? 'Customer'; // Default if not provided
        
        if (!$userUid) {
            json_error('Missing userUid parameter', 400);
        }
        
        if (!$customerEmail || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            json_error('Missing or invalid customerEmail parameter', 400);
        }
        
        // Validate tier
        if (!in_array($tier, ['plus', 'premium'])) {
            $tier = 'plus';
        }
        
        // Validate gateway
        if (!in_array($gateway, ['square', 'paychangu'])) {
            json_error('Invalid gateway parameter. Must be "square" or "paychangu"', 400);
        }
        
        // Set pricing based on tier
        $tierPrices = [
            'plus' => ['amount' => 600, 'name' => 'Xtrapush Plus'], // £6.00
            'premium' => ['amount' => 999, 'name' => 'Xtrapush Premium'] // £9.99
        ];
        $tierInfo = $tierPrices[$tier];
        
        // Gateway-specific handling
        if ($gateway === 'paychangu') {
            // PayChangu: Create initial checkout for first payment
            $tierPrices = [
                'plus' => ['amount' => 6000, 'name' => 'Xtrapush Plus'], // MWK 6,000
                'premium' => ['amount' => 10000, 'name' => 'Xtrapush Premium'] // MWK 10,000
            ];
            $tierInfo = $tierPrices[$tier];
            
            // Generate transaction reference
            $txRef = 'SUB-INITIAL-' . strtoupper(bin2hex(random_bytes(6))) . '-' . time();
            
            try {
                // Create PayChangu checkout
                $payload = [
                    'tx_ref' => $txRef,
                    'amount' => $tierInfo['amount'],
                    'currency' => 'MWK',
                    'customer_email' => $customerEmail,
                    'customer_name' => $customerName,
                    'title' => $tierInfo['name'] . ' - Initial Subscription',
                    'description' => 'First month subscription payment for ' . $tierInfo['name'],
                    'callback_url' => 'https://sparkle-pro.co.uk/api/payments/paychangu/webhook',
                    'return_url' => $successUrl ?? 'https://itsxtrapush.com/dashboard?subscription=activated',
                    'customization' => [
                        'title' => 'Xtrapush Subscription',
                        'description' => 'Activate your ' . $tierInfo['name'] . ' subscription'
                    ],
                    'meta' => [
                        'userUid' => $userUid,
                        'type' => 'subscription_initial',
                        'tier' => $tier
                    ]
                ];
                
                // Call PayChangu API to create checkout
                $checkoutUrl = paychangu_create_checkout($payload);
                
                if (!$checkoutUrl) {
                    json_error('Failed to create PayChangu checkout', 500);
                }
                
                // Store pending subscription in database
                $db = DatabaseConnection::getInstance();
                $conn = $db->getConnection();
                if ($conn && !$conn->connect_errno) {
                    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                    $stmt = $conn->prepare("
                        UPDATE users 
                        SET subscription_status = 'PENDING', 
                            subscription_tier = ?,
                            subscription_payment_gateway = 'paychangu',
                            subscription_pending_tx_ref = ?,
                            subscription_renewal_date = ?,
                            subscription_updated_at = NOW()
                        WHERE uid = ?
                    ");
                    if ($stmt) {
                        $stmt->bind_param('ssss', $tier, $txRef, $nextRenewal, $userUid);
                        $stmt->execute();
                        $stmt->close();
                    }
                }
                
                // Record subscription creation attempt
                record_subscription_history($userUid, $txRef, 'INITIATED', null, 'PENDING', 
                    $tierInfo['amount'] / 100, 'PayChangu subscription checkout created');
                
                json_ok([
                    'success' => true,
                    'requires_checkout' => true,
                    'checkout_url' => $checkoutUrl,
                    'tx_ref' => $txRef,
                    'tier' => $tier,
                    'message' => 'Please complete checkout to activate your subscription'
                ]);
                exit;
                
            } catch (Throwable $e) {
                error_log('PayChangu subscription checkout error: ' . $e->getMessage());
                json_error('Failed to create subscription checkout: ' . $e->getMessage(), 500);
            }
        }
        
        // Square: For UK/International users
        // Collect card via Square Web Payments SDK on frontend, then create subscription
        
        if ($gateway === 'square') {
            try {
                // Create or get Square customer
                $customerId = square_get_or_create_customer($userUid, $customerEmail, $customerName);
                if (!$customerId) {
                    error_log('Failed to get/create Square customer for ' . $userUid . ' / ' . $customerEmail);
                    json_error('Failed to create customer. Please ensure you have a valid email address.', 500);
                }
                
                // Check if card nonce/token is provided (from Square Web Payments SDK)
                $cardNonce = $input['cardNonce'] ?? null;
                
                if (!$cardNonce) {
                    // No card yet - return instruction to collect card on frontend
                    json_ok([
                        'success' => true,
                        'requires_card' => true,
                        'customer_id' => $customerId,
                        'tier' => $tier,
                        'gateway' => 'square',
                        'message' => 'Please provide card details to complete subscription setup'
                    ]);
                    exit;
                }
                
                // Card nonce provided - create card on file for customer
                $cardResult = square_api_call('/cards', 'POST', [
                    'idempotency_key' => uniqid('card_', true),
                    'source_id' => $cardNonce,
                    'card' => [
                        'customer_id' => $customerId
                    ]
                ]);
                
                if (!$cardResult['success']) {
                    $errorMsg = $cardResult['error'] ?? 'Failed to save card';
                    error_log('Square card creation failed: ' . $errorMsg);
                    json_error('Failed to save card details: ' . $errorMsg, 400);
                }
                
                $card = $cardResult['data']['card'] ?? [];
                $cardId = $card['id'] ?? null;
                
                if (!$cardId) {
                    json_error('Failed to get card ID from Square', 500);
                }
                
                // Get the subscription plan ID for the selected tier
                $planVariationId = square_get_subscription_plan_for_tier($tier);
                if (!$planVariationId) {
                    json_error('Failed to get subscription plan for tier: ' . $tier, 500);
                }
                
                error_log('Creating Square subscription - Customer: ' . $customerId . ', Card: ' . $cardId . ', Plan: ' . $planVariationId);
                
                // Create subscription with card on file
                $idempotencyKey = uniqid('sub_create_', true);
                $startDate = date('Y-m-d');
                
                $subscriptionPayload = [
                    'idempotency_key' => $idempotencyKey,
                    'location_id' => SQUARE_LOCATION_ID ?: 'main',
                    'plan_variation_id' => $planVariationId,
                    'customer_id' => $customerId,
                    'card_id' => $cardId,
                    'start_date' => $startDate,
                    'timezone' => 'Europe/London'
                ];
                
                $subscriptionResult = square_api_call('/subscriptions', 'POST', $subscriptionPayload);
                
                if (!$subscriptionResult['success']) {
                    $errorMsg = $subscriptionResult['error'] ?? 'Unknown error';
                    error_log('Square subscription creation failed: ' . $errorMsg . ' | Response: ' . json_encode($subscriptionResult));
                    json_error('Failed to create subscription: ' . $errorMsg, 502);
                }
                
                $subscription = $subscriptionResult['data']['subscription'] ?? [];
                $subscriptionId = $subscription['id'] ?? null;
                $status = $subscription['status'] ?? 'PENDING';
                
                if (!$subscriptionId) {
                    error_log('No subscription ID returned from Square: ' . json_encode($subscriptionResult));
                    json_error('Failed to get subscription ID from Square', 500);
                }
                
                // Store subscription in database
                $db = DatabaseConnection::getInstance();
                $conn = $db->getConnection();
                if ($conn && !$conn->connect_errno) {
                    $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                    $isActive = (strtoupper($status) === 'ACTIVE') ? 1 : 0;
                    
                    $stmt = $conn->prepare("
                        UPDATE users 
                        SET subscription_id = ?,
                            subscription_status = ?, 
                            subscription_tier = ?,
                            subscription_payment_gateway = 'square',
                            subscription_start_date = NOW(),
                            subscription_renewal_date = ?,
                            square_customer_id = ?,
                            subscription_active = ?,
                            subscription_updated_at = NOW()
                        WHERE uid = ?
                    ");
                    if ($stmt) {
                        $stmt->bind_param('sssssds', $subscriptionId, $status, $tier, $nextRenewal, $customerId, $isActive, $userUid);
                        $stmt->execute();
                        $stmt->close();
                    }
                }
                
                // Record subscription creation
                record_subscription_history($userUid, $subscriptionId, 'CREATED', null, $status, 
                    $tierInfo['amount'] / 100, 'Square subscription created with card - status: ' . $status);
                
                // Return success
                json_ok([
                    'success' => true,
                    'subscription_id' => $subscriptionId,
                    'status' => $status,
                    'tier' => $tier,
                    'gateway' => 'square',
                    'message' => 'Subscription activated! You will be charged automatically each month.'
                ]);
                exit;
                
            } catch (Throwable $e) {
                error_log('Square subscription setup error: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                json_error('Failed to initiate Square subscription: ' . $e->getMessage(), 500);
            }
        }
        
        // If we reach here, invalid gateway
        json_error('Invalid gateway configuration', 500);
        
    } catch (Throwable $e) {
        // Top-level catch for any uncaught errors
        error_log('FATAL: Subscription creation error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        json_error('System error during subscription creation. Please try again later.', 500);
    }
}

/**
 * Get or create Square customer
 */
function square_get_or_create_customer($userUid, $email, $name = null) {
    // Search for existing customer
    $searchResult = square_api_call('/customers/search', 'POST', [
        'query' => [
            'filter' => [
                'email_address' => [
                    'exact' => $email
                ]
            ]
        ]
    ]);
    
    if ($searchResult['success'] && !empty($searchResult['data']['customers'])) {
        return $searchResult['data']['customers'][0]['id'];
    }
    
    // Create new customer
    $customerData = [
        'idempotency_key' => 'cust_' . $userUid,
        'email_address' => $email,
        'reference_id' => $userUid,
        'note' => 'Xtrapush customer'
    ];
    
    // Add name if provided
    if ($name) {
        // Try to split name into given_name and family_name
        $nameParts = explode(' ', trim($name), 2);
        $customerData['given_name'] = $nameParts[0];
        if (isset($nameParts[1])) {
            $customerData['family_name'] = $nameParts[1];
        }
    }
    
    $createResult = square_api_call('/customers', 'POST', $customerData);
    
    if (!$createResult['success']) {
        error_log('Square customer creation failed: ' . json_encode($createResult));
        return null;
    }
    
    return $createResult['data']['customer']['id'] ?? null;
}

/**
 * Get subscription plan variation ID for a given tier
 * Returns the catalog object ID for the subscription plan
 */
function square_get_subscription_plan_for_tier($tier) {
    // Define plan names and prices
    $plans = [
        'plus' => [
            'name' => 'Xtrapush Plus',
            'amount' => 600, // £6.00
            'idempotency_suffix' => 'plus'
        ],
        'premium' => [
            'name' => 'Xtrapush Premium',
            'amount' => 999, // £9.99
            'idempotency_suffix' => 'premium'
        ]
    ];
    
    if (!isset($plans[$tier])) {
        error_log('Invalid tier requested: ' . $tier);
        return null;
    }
    
    $planInfo = $plans[$tier];
    
    // First, try to find existing catalog item for this subscription tier
    $searchResult = square_api_call('/catalog/search', 'POST', [
        'object_types' => ['SUBSCRIPTION_PLAN'],
        'query' => [
            'text_query' => [
                'keywords' => [$planInfo['name']]
            ]
        ]
    ]);
    
    if ($searchResult['success'] && !empty($searchResult['data']['objects'])) {
        $plan = $searchResult['data']['objects'][0];
        // IMPORTANT: Return the FIRST VARIATION ID, not the plan object ID
        // Square Subscriptions API requires a plan variation ID
        $planData = $plan['subscription_plan_data'] ?? [];
        $variations = $planData['subscription_plan_variations'] ?? [];
        
        if (!empty($variations)) {
            $variationId = $variations[0]['id'] ?? null;
            if ($variationId) {
                error_log('Found existing subscription plan variation: ' . $variationId);
                return $variationId;
            }
        }
        
        // Fallback: if no variations but plan exists, use plan ID
        error_log('Found existing subscription plan: ' . $plan['id']);
        return $plan['id'];
    }
    
    // Create subscription plan if not exists
    $idempotencyKey = 'xp_sub_plan_' . $planInfo['idempotency_suffix'] . '_v2';
    
    $createResult = square_api_call('/catalog/object', 'POST', [
        'idempotency_key' => $idempotencyKey,
        'object' => [
            'type' => 'SUBSCRIPTION_PLAN',
            'id' => '#xp_' . $tier . '_plan',
            'subscription_plan_data' => [
                'name' => $planInfo['name'],
                'phases' => [
                    [
                        'cadence' => 'MONTHLY',
                        'recurring_price_money' => [
                            'amount' => $planInfo['amount'],
                            'currency' => 'GBP'
                        ],
                        'ordinal' => 0
                    ]
                ],
                // CRITICAL: Must define at least one variation for the plan
                'subscription_plan_variations' => [
                    [
                        'id' => '#xp_' . $tier . '_variation',
                        'name' => $planInfo['name'] . ' Monthly',
                        'phases' => [
                            [
                                'cadence' => 'MONTHLY',
                                'recurring_price_money' => [
                                    'amount' => $planInfo['amount'],
                                    'currency' => 'GBP'
                                ],
                                'ordinal' => 0
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);
    
    if (!$createResult['success']) {
        error_log('Failed to create subscription plan for ' . $tier . ': ' . json_encode($createResult));
        return null;
    }
    
    $catalogObject = $createResult['data']['catalog_object'] ?? null;
    if (!$catalogObject) {
        error_log('No catalog object returned when creating subscription plan');
        return null;
    }
    
    // Return the VARIATION ID from the created plan
    $planData = $catalogObject['subscription_plan_data'] ?? [];
    $variations = $planData['subscription_plan_variations'] ?? [];
    
    if (!empty($variations)) {
        $variationId = $variations[0]['id'] ?? null;
        if ($variationId) {
            error_log('Created new subscription plan variation: ' . $variationId);
            return $variationId;
        }
    }
    
    // Fallback
    error_log('Created new subscription plan: ' . $catalogObject['id']);
    return $catalogObject['id'];
}

/**
 * Record subscription history for audit trail
 */
function record_subscription_history($userUid, $subscriptionId, $action, $oldStatus = null, $newStatus = null, $amount = null, $notes = null) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) { return false; }
        
        $stmt = $conn->prepare("
            INSERT INTO subscription_history (user_uid, subscription_id, action, old_status, new_status, amount_paid, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        if ($stmt) {
            $stmt->bind_param('sssssds', $userUid, $subscriptionId, $action, $oldStatus, $newStatus, $amount, $notes);
            $stmt->execute();
            $stmt->close();
            return true;
        }
    } catch (Throwable $e) {
        error_log('Failed to record subscription history: ' . $e->getMessage());
    }
    return false;
}

/**
 * Update user subscription status in database
 */
function square_update_user_subscription($squareCustomerId, $subscriptionId, $status) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) { return false; }
        
        $isActive = in_array(strtoupper($status), ['ACTIVE', 'PENDING']);
        
        // Update by Square customer ID or subscription ID
        $stmt = $conn->prepare("
            UPDATE users 
            SET subscription_id = ?, 
                subscription_status = ?, 
                subscription_active = ?,
                subscription_updated_at = NOW()
            WHERE square_customer_id = ? OR subscription_id = ?
        ");
        
        if ($stmt) {
            $activeInt = $isActive ? 1 : 0;
            $stmt->bind_param('ssiss', $subscriptionId, $status, $activeInt, $squareCustomerId, $subscriptionId);
            $stmt->execute();
            $stmt->close();
            return true;
        }
    } catch (Throwable $e) {
        error_log('Failed to update user subscription: ' . $e->getMessage());
    }
    return false;
}

/**
 * Get user subscription status
 */
function square_get_subscription_status() {
    $userUid = $_GET['uid'] ?? null;
    if (!$userUid) { json_error('Missing uid'); }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) { json_error('Database error', 500); }
        
        $stmt = $conn->prepare("
            SELECT subscription_id, subscription_status, subscription_active, subscription_updated_at, subscription_tier,
                   subscription_renewal_date, subscription_grace_period_end, subscription_payment_gateway,
                   subscription_pending_tx_ref, country_code
            FROM users WHERE uid = ? LIMIT 1
        ");
        
        if ($stmt) {
            $stmt->bind_param('s', $userUid);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            if ($result) {
                $tier = $result['subscription_tier'] ?? 'plus';
                $isActive = (bool)$result['subscription_active'];
                $status = $result['subscription_status'];
                $gateway = $result['subscription_payment_gateway'] ?? 'square';
                $renewalDate = $result['subscription_renewal_date'];
                $gracePeriodEnd = $result['subscription_grace_period_end'];
                $pendingTxRef = $result['subscription_pending_tx_ref'];
                
                // Check if payment is overdue
                $isOverdue = false;
                $daysUntilDue = null;
                if ($renewalDate) {
                    $renewalTimestamp = strtotime($renewalDate);
                    $now = time();
                    $daysUntilDue = floor(($renewalTimestamp - $now) / 86400);
                    $isOverdue = $daysUntilDue < 0;
                }
                
                // Determine if urgent action is needed (PayChangu pending payment)
                $requiresPayment = ($status === 'PENDING_PAYMENT' && $gateway === 'paychangu');
                $inGracePeriod = $gracePeriodEnd && strtotime($gracePeriodEnd) > time();
                
                json_ok([
                    'success' => true,
                    'hasSubscription' => !empty($result['subscription_id']),
                    'subscriptionId' => $result['subscription_id'],
                    'status' => $status,
                    'isActive' => $isActive,
                    'tier' => $tier,
                    'gateway' => $gateway,
                    'updatedAt' => $result['subscription_updated_at'],
                    'renewalDate' => $renewalDate,
                    'daysUntilDue' => $daysUntilDue,
                    'isOverdue' => $isOverdue,
                    'requiresPayment' => $requiresPayment,
                    'inGracePeriod' => $inGracePeriod,
                    'gracePeriodEnd' => $gracePeriodEnd,
                    'pendingTxRef' => $pendingTxRef,
                    'benefits' => [
                        'freeInsurance' => $isActive,
                        'freeDelivery' => $isActive,
                        'multipleGadgets' => $isActive && $tier === 'premium',
                        'prioritySupport' => $isActive && $tier === 'premium',
                    ],
                    'price' => $gateway === 'paychangu' 
                        ? ($tier === 'premium' ? 'MWK 16,500/month' : 'MWK 10,000/month')
                        : ($tier === 'premium' ? '£9.99/month' : '£6.00/month')
                ]);
            }
        }
    } catch (Throwable $e) {
        error_log('Failed to get subscription status: ' . $e->getMessage());
    }
    
    json_ok([
        'success' => true,
        'hasSubscription' => false,
        'isActive' => false,
        'benefits' => [
            'freeInsurance' => false,
            'freeDelivery' => false,
        ],
        'price' => '£5.00/month'
    ]);
}

/**
 * Cancel user subscription
 */
function square_cancel_subscription() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userUid = $input['userUid'] ?? null;
    
    if (!$userUid) { json_error('Missing userUid'); }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) { json_error('Database error', 500); }
        
        // Get subscription ID
        $stmt = $conn->prepare("SELECT subscription_id, subscription_status FROM users WHERE uid = ? LIMIT 1");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$result || empty($result['subscription_id'])) {
            json_error('No active subscription found');
        }
        
        $subscriptionId = $result['subscription_id'];
        $oldStatus = $result['subscription_status'];
        
        // Cancel in Square
        $cancelResult = square_api_call("/subscriptions/{$subscriptionId}/cancel", 'POST');
        
        if (!$cancelResult['success']) {
            json_error('Failed to cancel subscription: ' . ($cancelResult['error'] ?? 'Unknown'));
        }
        
        // Update database
        $updateStmt = $conn->prepare("
            UPDATE users SET subscription_status = 'CANCELED', subscription_active = 0, subscription_updated_at = NOW(), subscription_end_date = NOW()
            WHERE uid = ?
        ");
        $updateStmt->bind_param('s', $userUid);
        $updateStmt->execute();
        $updateStmt->close();
        
        // Record cancellation in history
        record_subscription_history($userUid, $subscriptionId, 'CANCELED', $oldStatus, 'CANCELED', null, 'User requested cancellation');
        
        json_ok(['success' => true, 'message' => 'Subscription cancelled']);
        
    } catch (Throwable $e) {
        json_error('Failed to cancel subscription: ' . $e->getMessage());
    }
}

/**
 * Create PayChangu checkout for subscription renewal
 */
function paychangu_create_renewal_checkout() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { json_error('Invalid JSON'); }
    
    $userUid = $input['userUid'] ?? null;
    $tier = $input['tier'] ?? 'plus';
    
    if (!$userUid) {
        json_error('Missing userUid');
    }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) { json_error('Database error', 500); }
        
        // Get user details
        $stmt = $conn->prepare("
            SELECT email, full_name, subscription_tier, subscription_status, subscription_payment_gateway
            FROM users WHERE uid = ? LIMIT 1
        ");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$user) {
            json_error('User not found', 404);
        }
        
        // Use the subscription tier from DB if available
        $tier = $user['subscription_tier'] ?? $tier;
        
        // Set pricing based on tier (in MWK for Malawi)
        $tierPrices = [
            'plus' => ['amount' => 10000, 'name' => 'Xtrapush Plus'], // 10,000 MWK
            'premium' => ['amount' => 16500, 'name' => 'Xtrapush Premium'] // 16,500 MWK
        ];
        $tierInfo = $tierPrices[$tier];
        
        // Create PayChangu checkout for renewal
        $txRef = 'RENEWAL-' . strtoupper(bin2hex(random_bytes(6))) . '-' . time();
        $amount = $tierInfo['amount'];
        
        $payload = [
            'tx_ref' => $txRef,
            'amount' => $amount,
            'currency' => 'MWK',
            'customer_email' => $user['email'],
            'customer_name' => $user['full_name'] ?? 'Subscriber',
            'title' => $tierInfo['name'] . ' - Monthly Renewal',
            'description' => 'Subscription renewal for ' . $tierInfo['name'] . ' - ' . date('F Y'),
            'callback_url' => 'https://sparkle-pro.co.uk/api/payments/paychangu/webhook',
            'return_url' => 'https://itsxtrapush.com/dashboard?subscription=renewed',
            'customization' => [
                'title' => 'Xtrapush Subscription Renewal',
                'description' => 'Continue your ' . $tierInfo['name'] . ' subscription'
            ]
        ];
        
        // Store pending renewal in database
        $stmt = $conn->prepare("
            UPDATE users 
            SET subscription_pending_tx_ref = ?, subscription_status = 'PENDING_PAYMENT', subscription_updated_at = NOW()
            WHERE uid = ?
        ");
        $stmt->bind_param('ss', $txRef, $userUid);
        $stmt->execute();
        $stmt->close();
        
        // Call PayChangu API
        $checkoutUrl = paychangu_create_checkout($payload);
        
        if (!$checkoutUrl) {
            json_error('Failed to create PayChangu checkout', 500);
        }
        
        // Record renewal attempt
        record_subscription_history($userUid, $txRef, 'RENEWAL_INITIATED', 
            $user['subscription_status'], 'PENDING_PAYMENT', $amount / 100, 
            'PayChangu renewal checkout created');
        
        json_ok([
            'success' => true,
            'checkout_url' => $checkoutUrl,
            'tx_ref' => $txRef,
            'amount' => $amount,
            'currency' => 'MWK',
            'tier' => $tier
        ]);
        
    } catch (Throwable $e) {
        error_log('PayChangu renewal checkout error: ' . $e->getMessage());
        json_error('Failed to create renewal checkout: ' . $e->getMessage(), 500);
    }
}

/**
 * Process subscription renewals - called by cron job
 * Handles renewals for both Square and Paychangu gateways
 */
function process_subscription_renewals() {
    try {
        // Verify cron token if provided
        $token = $_GET['token'] ?? $_POST['token'] ?? null;
        $valid_token = getenv('CRON_SECRET_TOKEN') ?: 'your-secret-token-change-this';
        
        if ($token && $token !== $valid_token) {
            json_error('Unauthorized', 401);
        }
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database error', 500);
        }
        
        $results = [
            'renewals_processed' => 0,
            'reminders_sent' => 0,
            'suspensions' => 0,
            'errors' => []
        ];
        
        // 1. Process renewals for subscriptions due today
        $processRenewals = "
            SELECT u.id, u.uid, u.email, u.subscription_id, u.subscription_status, 
                   u.subscription_tier, u.subscription_payment_gateway, u.subscription_active,
                   u.subscription_start_date, u.country_code,
                   COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) as renewal_date
            FROM users u
            WHERE u.subscription_active = 1 
            AND u.subscription_status = 'ACTIVE'
            AND COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) <= CURDATE()
            AND (u.subscription_grace_period_end IS NULL OR u.subscription_grace_period_end > NOW())
        ";
        
        $renewalResult = $conn->query($processRenewals);
        
        if ($renewalResult) {
            while ($user = $renewalResult->fetch_assoc()) {
                try {
                    $gateway = $user['subscription_payment_gateway'] ?? 
                               (strtoupper($user['country_code']) === 'MW' ? 'paychangu' : 'square');
                    
                    if ($gateway === 'square') {
                        // Square handles renewals automatically
                        $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                        
                        $updateStmt = $conn->prepare("
                            UPDATE users 
                            SET subscription_renewal_date = ?, subscription_updated_at = NOW()
                            WHERE id = ?
                        ");
                        $updateStmt->bind_param('si', $nextRenewal, $user['id']);
                        $updateStmt->execute();
                        $updateStmt->close();
                        
                        // Log renewal
                        record_subscription_history($user['uid'], $user['subscription_id'], 
                            'ACTIVE', 'ACTIVE', 'RENEWED', null, 
                            'Square automatic renewal processed. Next renewal: ' . $nextRenewal);
                        
                        send_renewal_email($user, 'renewal_success', [
                            'gateway' => 'Square',
                            'renewal_date' => $nextRenewal
                        ]);
                        
                        $results['renewals_processed']++;
                        
                    } else {
                        // Paychangu: Mark as PENDING_PAYMENT and set grace period
                        $gracePeriodEnd = date('Y-m-d H:i:s', strtotime('+7 days'));
                        $nextRenewal = date('Y-m-d', strtotime('+1 month'));
                        
                        $updateStmt = $conn->prepare("
                            UPDATE users 
                            SET subscription_status = 'PENDING_PAYMENT',
                                subscription_grace_period_end = ?, 
                                subscription_renewal_date = ?,
                                subscription_updated_at = NOW()
                            WHERE id = ?
                        ");
                        $updateStmt->bind_param('ssi', $gracePeriodEnd, $nextRenewal, $user['id']);
                        $updateStmt->execute();
                        $updateStmt->close();
                        
                        // Log renewal initiation
                        record_subscription_history($user['uid'], $user['subscription_id'], 
                            'RENEWAL_DUE', 'ACTIVE', 'PENDING_PAYMENT', null, 
                            'PayChangu renewal due. Payment required. Grace period until: ' . $gracePeriodEnd);
                        
                        // Send payment request with urgent notice
                        send_renewal_email($user, 'renewal_payment_required', [
                            'gateway' => 'Paychangu',
                            'amount' => ($user['subscription_tier'] === 'premium' ? 16500 : 10000),
                            'currency' => 'MWK',
                            'grace_period_days' => 7,
                            'grace_period_end' => $gracePeriodEnd
                        ]);
                        
                        $results['renewals_processed']++;
                    }
                    
                } catch (Throwable $e) {
                    $results['errors'][] = "Error processing renewal for user {$user['uid']}: " . $e->getMessage();
                    error_log("[SubscriptionRenewal] Error for user {$user['uid']}: " . $e->getMessage());
                }
            }
        }
        
        // 2. Send reminder notifications (5 days and 1 day before renewal)
        $reminderDays = [5, 1];
        foreach ($reminderDays as $days) {
            $targetDate = date('Y-m-d', strtotime("+$days days"));
            
            $reminderQuery = "
                SELECT u.id, u.uid, u.email, u.subscription_tier, u.subscription_payment_gateway,
                       COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH)) as renewal_date
                FROM users u
                WHERE u.subscription_active = 1 
                AND u.subscription_status = 'ACTIVE'
                AND DATE(COALESCE(u.subscription_renewal_date, DATE_ADD(u.subscription_start_date, INTERVAL 1 MONTH))) = '$targetDate'
                AND (u.last_renewal_reminder_sent IS NULL OR DATE(u.last_renewal_reminder_sent) < '$targetDate')
            ";
            
            $reminderResult = $conn->query($reminderQuery);
            
            if ($reminderResult) {
                while ($user = $reminderResult->fetch_assoc()) {
                    try {
                        send_renewal_email($user, 'renewal_reminder', [
                            'days_until_renewal' => $days,
                            'tier' => $user['subscription_tier'],
                            'gateway' => $user['subscription_payment_gateway'] === 'square' ? 'Square' : 'Paychangu'
                        ]);
                        
                        // Update last reminder sent
                        $reminderStmt = $conn->prepare("
                            UPDATE users SET last_renewal_reminder_sent = NOW() WHERE id = ?
                        ");
                        $reminderStmt->bind_param('i', $user['id']);
                        $reminderStmt->execute();
                        $reminderStmt->close();
                        
                        $results['reminders_sent']++;
                        
                    } catch (Throwable $e) {
                        $results['errors'][] = "Error sending reminder for user {$user['uid']}: " . $e->getMessage();
                    }
                }
            }
        }
        
        // 3. Handle expired grace periods - suspend accounts
        $suspendQuery = "
            SELECT u.id, u.uid, u.email, u.subscription_tier
            FROM users u
            WHERE u.subscription_active = 1
            AND u.subscription_status IN ('ACTIVE', 'PENDING_PAYMENT')
            AND u.subscription_grace_period_end IS NOT NULL
            AND u.subscription_grace_period_end <= NOW()
        ";
        
        $suspendResult = $conn->query($suspendQuery);
        
        if ($suspendResult) {
            while ($user = $suspendResult->fetch_assoc()) {
                try {
                    $suspendStmt = $conn->prepare("
                        UPDATE users 
                        SET subscription_status = 'SUSPENDED',
                            subscription_active = 0,
                            subscription_updated_at = NOW(),
                            subscription_grace_period_end = NULL
                        WHERE id = ?
                    ");
                    $suspendStmt->bind_param('i', $user['id']);
                    $suspendStmt->execute();
                    $suspendStmt->close();
                    
                    // Log suspension
                    record_subscription_history($user['uid'], null, 'ACTIVE', 'ACTIVE', 
                        'SUSPENDED', null, 'Subscription suspended due to non-payment after grace period');
                    
                    // Send suspension notification
                    send_renewal_email($user, 'subscription_suspended', [
                        'tier' => $user['subscription_tier']
                    ]);
                    
                    $results['suspensions']++;
                    
                } catch (Throwable $e) {
                    $results['errors'][] = "Error suspending user {$user['uid']}: " . $e->getMessage();
                }
            }
        }
        
        // Log the execution
        $logStmt = $conn->prepare("
            INSERT INTO subscription_cron_logs (status, message, created_at)
            VALUES ('success', ?, NOW())
        ");
        $logMessage = json_encode($results);
        $logStmt->bind_param('s', $logMessage);
        $logStmt->execute();
        $logStmt->close();
        
        error_log("[SubscriptionRenewal] Processing completed: " . json_encode($results));
        json_ok(['success' => true, 'data' => $results]);
        
    } catch (Throwable $e) {
        error_log("[SubscriptionRenewal] Fatal error: " . $e->getMessage());
        json_error('Renewal processing failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Link a device to user's subscription
 * For Plus tier: ONE device only
 * For Premium tier: Multiple devices (unlimited)
 */
function subscription_link_device() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { json_error('Invalid JSON'); }
    
    $userUid = $input['userUid'] ?? null;
    $deviceId = $input['deviceId'] ?? null;
    $linkedBy = $input['linkedBy'] ?? 'MANUAL';
    
    if (!$userUid || !$deviceId) {
        json_error('Missing userUid or deviceId', 422);
    }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            json_error('Database error', 500);
        }
        
        // Get user's subscription info
        $stmt = $conn->prepare("
            SELECT subscription_tier, subscription_status, subscription_active, 
                   subscription_linked_device_id
            FROM users WHERE uid = ? LIMIT 1
        ");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$user) {
            json_error('User not found', 404);
        }
        
        if (!$user['subscription_active'] || $user['subscription_status'] !== 'ACTIVE') {
            json_error('Active subscription required', 403);
        }
        
        $tier = $user['subscription_tier'];
        $currentLinkedDevice = $user['subscription_linked_device_id'];
        
        // For Plus tier: only ONE device allowed
        if ($tier === 'plus' && $currentLinkedDevice && $currentLinkedDevice != $deviceId) {
            json_error('Plus subscription already has a linked device. Unlink first or upgrade to Premium.', 409);
        }
        
        // Get device details from orders
        $stmt = $conn->prepare("
            SELECT o.id as order_id, oi.gadget_name, oi.gadget_category, oi.gadget_image,
                   o.created_at as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_uid = ? AND oi.gadget_id = ? AND o.status != 'cancelled'
            ORDER BY o.created_at DESC LIMIT 1
        ");
        $stmt->bind_param('si', $userUid, $deviceId);
        $stmt->execute();
        $device = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$device) {
            json_error('Device not found in user orders', 404);
        }
        
        // Update user table with linked device
        $stmt = $conn->prepare("
            UPDATE users 
            SET subscription_linked_device_id = ?,
                subscription_linked_device_name = ?,
                subscription_device_linked_date = NOW(),
                subscription_device_linked_by = ?
            WHERE uid = ?
        ");
        $deviceName = $device['gadget_name'];
        $stmt->bind_param('isss', $deviceId, $deviceName, $linkedBy, $userUid);
        $stmt->execute();
        $stmt->close();
        
        json_ok([
            'success' => true,
            'message' => 'Device linked successfully',
            'linkedDevice' => [
                'id' => $deviceId,
                'name' => $deviceName,
                'category' => $device['gadget_category'] ?? 'Device',
                'linkedAt' => date('Y-m-d H:i:s'),
                'linkedBy' => $linkedBy
            ]
        ]);
        
    } catch (Throwable $e) {
        error_log('Device linking error: ' . $e->getMessage());
        json_error('Failed to link device: ' . $e->getMessage(), 500);
    }
}

/**
 * Get device linked to user's subscription
 */
function subscription_get_linked_device() {
    $userUid = $_GET['userUid'] ?? null;
    
    if (!$userUid) {
        json_error('Missing userUid', 422);
    }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            json_error('Database error', 500);
        }
        
        $stmt = $conn->prepare("
            SELECT subscription_linked_device_id as id,
                   subscription_linked_device_name as name,
                   subscription_device_linked_date as linked_at,
                   subscription_device_linked_by as linked_by,
                   subscription_tier as tier
            FROM users WHERE uid = ? LIMIT 1
        ");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$result || !$result['id']) {
            json_ok([
                'success' => true,
                'linkedDevice' => null,
                'tier' => $result['tier'] ?? null
            ]);
            return;
        }
        
        json_ok([
            'success' => true,
            'linkedDevice' => [
                'id' => $result['id'],
                'name' => $result['name'],
                'linkedAt' => $result['linked_at'],
                'linkedBy' => $result['linked_by']
            ],
            'tier' => $result['tier']
        ]);
        
    } catch (Throwable $e) {
        error_log('Get linked device error: ' . $e->getMessage());
        json_error('Failed to get linked device: ' . $e->getMessage(), 500);
    }
}

/**
 * Unlink device from user's subscription
 */
function subscription_unlink_device() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { json_error('Invalid JSON'); }
    
    $userUid = $input['userUid'] ?? null;
    
    if (!$userUid) {
        json_error('Missing userUid', 422);
    }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            json_error('Database error', 500);
        }
        
        $stmt = $conn->prepare("
            UPDATE users 
            SET subscription_linked_device_id = NULL,
                subscription_linked_device_name = NULL,
                subscription_device_linked_date = NULL,
                subscription_device_linked_by = NULL
            WHERE uid = ?
        ");
        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $stmt->close();
        
        json_ok([
            'success' => true,
            'message' => 'Device unlinked successfully'
        ]);
        
    } catch (Throwable $e) {
        error_log('Device unlinking error: ' . $e->getMessage());
        json_error('Failed to unlink device: ' . $e->getMessage(), 500);
    }
}

/**
 * Get user's recent devices for linking
 */
function subscription_get_recent_devices() {
    $userUid = $_GET['userUid'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
    
    if (!$userUid) {
        json_error('Missing userUid', 422);
    }
    
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            json_error('Database error', 500);
        }
        
        // Get recent devices from orders
        $stmt = $conn->prepare("
            SELECT DISTINCT oi.gadget_id as id, oi.gadget_name as name, 
                   oi.gadget_category as category, oi.gadget_image as image,
                   o.created_at as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_uid = ? AND o.status != 'cancelled'
            ORDER BY o.created_at DESC
            LIMIT ?
        ");
        $stmt->bind_param('si', $userUid, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $devices = [];
        while ($row = $result->fetch_assoc()) {
            $devices[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'category' => $row['category'],
                'image' => $row['image'],
                'orderDate' => $row['order_date']
            ];
        }
        $stmt->close();
        
        json_ok([
            'success' => true,
            'devices' => $devices,
            'count' => count($devices)
        ]);
        
    } catch (Throwable $e) {
        error_log('Get recent devices error: ' . $e->getMessage());
        json_error('Failed to get recent devices: ' . $e->getMessage(), 500);
    }
}

/**
 * Send renewal-related emails
 */
function send_renewal_email($user, $type, $data = []) {
    $email = $user['email'];
    $subject = '';
    $html = '';
    
    switch ($type) {
        case 'renewal_reminder':
            $subject = "Your subscription renews in {$data['days_until_renewal']} days";
            $html = "
                <h2>Subscription Renewal Reminder</h2>
                <p>Hi {$user['email']},</p>
                <p>Your {$data['tier']} subscription will renew on " . date('F j, Y', strtotime("+{$data['days_until_renewal']} days")) . ".</p>
                <p>Your payment will be processed automatically via {$data['gateway']}.</p>
                <p>If you have any questions, please contact our support team.</p>
                <a href='https://itsxtrapush.com/dashboard/subscription' style='padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;'>View Subscription</a>
            ";
            break;
            
        case 'renewal_success':
            $subject = "Your subscription has been renewed";
            $html = "
                <h2>Subscription Renewed Successfully</h2>
                <p>Hi {$user['email']},</p>
                <p>Your subscription has been successfully renewed and is active through " . $data['renewal_date'] . ".</p>
                <p>Payment was processed via {$data['gateway']}.</p>
                <a href='https://itsxtrapush.com/dashboard' style='padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;'>Back to Dashboard</a>
            ";
            break;
            
        case 'renewal_invoice':
            $subject = "Action Required: Subscription Renewal Payment";
            $html = "
                <h2>Subscription Renewal - Payment Required</h2>
                <p>Hi {$user['email']},</p>
                <p>Your {$data['tier']} subscription is due for renewal.</p>
                <p><strong>Amount Due:</strong> {$data['amount']} {$data['currency']}</p>
                <p><strong>Grace Period:</strong> {$data['grace_period_days']} days (until " . $data['grace_period_end'] . ")</p>
                <p>Payment can be made through our secure payment portal.</p>
                <a href='https://itsxtrapush.com/dashboard/subscription/pay' style='padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;'>Pay Now</a>
                <p><em>If payment is not received within the grace period, your subscription will be suspended.</em></p>
            ";
            break;
            
        case 'subscription_suspended':
            $subject = "Your subscription has been suspended";
            $html = "
                <h2>Subscription Suspended</h2>
                <p>Hi {$user['email']},</p>
                <p>Your {$data['tier']} subscription has been suspended due to non-payment.</p>
                <p>To reactivate your subscription and enjoy all benefits, please visit your dashboard and renew your payment.</p>
                <a href='https://itsxtrapush.com/dashboard/subscription' style='padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;'>Reactivate Subscription</a>
                <p>If you have questions, contact our support team.</p>
            ";
            break;
    }
    
    if ($subject && $html) {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: noreply@itsxtrapush.com\r\n";
        $headers .= "X-Mailer: Xtrapush Subscription Manager\r\n";
        
        // Wrap in HTML template
        $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: 'Poppins', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                    h2 { color: #3b82f6; }
                    p { color: #64748b; line-height: 1.6; }
                    a { color: #3b82f6; }
                </style>
            </head>
            <body>
                <div class='container'>
                    $html
                    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;'>
                    <p style='font-size: 12px; color: #94a3b8;'>This is an automated message from Xtrapush. Please do not reply to this email.</p>
                </div>
            </body>
            </html>
        ";
        
        @mail($email, $subject, $html, $headers);
        error_log("[SubscriptionRenewal] Sent '$type' email to $email");
    }
}

// ===================================
// END SQUARE PAYMENT FUNCTIONS
// ===================================

// --- Admin: Cancel installment and restock ---
function admin_cancel_installment() {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) { $input = $_POST; }

    $orderId = (int)($input['orderId'] ?? 0);
    $adminUid = trim((string)($input['adminUid'] ?? ''));
    $reason = trim((string)($input['reason'] ?? ''));
    if ($orderId <= 0) { json_error('Missing orderId', 422); }

    // Optional: admin check
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { json_error('Database connection failed', 500); }

    if ($adminUid !== '') {
        $stmtA = $conn->prepare("SELECT user_role FROM users WHERE uid = ? LIMIT 1");
        if ($stmtA) {
            $stmtA->bind_param('s', $adminUid);
            $stmtA->execute();
            $resA = $stmtA->get_result()->fetch_assoc();
            $stmtA->close();
            if (!$resA || strtolower($resA['user_role'] ?? '') !== 'admin') {
                json_error('Admin privileges required', 403);
            }
        }
    }

    $conn->begin_transaction();
    try {
        // Restock from order_items
        $stmtItems = $conn->prepare("SELECT gadget_id, variant_id, quantity FROM order_items WHERE order_id = ?");
        if ($stmtItems) {
            $stmtItems->bind_param('i', $orderId);
            $stmtItems->execute();
            $resI = $stmtItems->get_result();
            while ($row = $resI->fetch_assoc()) {
                $gid = (int)($row['gadget_id'] ?? 0);
                $vid = (int)($row['variant_id'] ?? 0);
                $qty = (int)($row['quantity'] ?? 0);
                if ($qty > 0) {
                    if ($vid) {
                        $stmtV = $conn->prepare("UPDATE gadget_variants SET stock_quantity = stock_quantity + ? WHERE id = ?");
                        if ($stmtV) { $stmtV->bind_param('ii', $qty, $vid); $stmtV->execute(); $stmtV->close(); }
                    }
                    if ($gid) {
                        $stmtG = $conn->prepare("UPDATE gadgets SET stock_quantity = stock_quantity + ?, in_stock = 1 WHERE id = ?");
                        if ($stmtG) { $stmtG->bind_param('ii', $qty, $gid); $stmtG->execute(); $stmtG->close(); }
                    }
                }
            }
            $stmtItems->close();
        }

        // Update order status
        $notesAppend = json_encode(['cancel_reason' => $reason, 'action' => 'installment_cancelled'], JSON_UNESCAPED_SLASHES);
        $stmtUpd = $conn->prepare("UPDATE orders SET status = 'cancelled', payment_status = 'refunded', notes = CONCAT(COALESCE(notes,''), '\n', ?) WHERE id = ?");
        if ($stmtUpd) { $stmtUpd->bind_param('si', $notesAppend, $orderId); $stmtUpd->execute(); $stmtUpd->close(); }

        // Update installment plan if exists
        $stmtPlan = $conn->prepare("SELECT id FROM installment_plans WHERE order_id = ? LIMIT 1");
        $planId = null;
        if ($stmtPlan) { $stmtPlan->bind_param('i', $orderId); $stmtPlan->execute(); $rp = $stmtPlan->get_result()->fetch_assoc(); if ($rp && isset($rp['id'])) { $planId = (int)$rp['id']; } $stmtPlan->close(); }
        if ($planId) {
            $stmtCancel = $conn->prepare("UPDATE installment_plans SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = ? WHERE id = ?");
            if ($stmtCancel) { $stmtCancel->bind_param('si', $reason, $planId); $stmtCancel->execute(); $stmtCancel->close(); }
        }

        $conn->commit();
        json_ok(['success' => true]);
    } catch (Throwable $t) {
        $conn->rollback();
        error_log('Cancel installment failed: ' . $t->getMessage());
        json_error('Failed to cancel installment and restock', 500);
    }
}

// ---- Admin helpers and endpoints (existing functions retained) ----
// --- Installments: Fetch plan and registries by orderId ---
function installments_get_plan() {
    $orderId = (int)($_GET['orderId'] ?? $_REQUEST['orderId'] ?? 0);
    if ($orderId <= 0) { json_error('Missing orderId', 422); }

    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { json_error('Database connection failed', 500); }

    $stmt = $conn->prepare("SELECT id, order_id, user_id, status, start_at, expiry_at, next_due_at, period_days, weeks, deposit_amount, weekly_amount, total_amount, amount_paid, payments_made, grace_weeks, cancelled_at, cancel_reason, created_at, updated_at FROM installment_plans WHERE order_id = ? LIMIT 1");
    $plan = null; $planId = null;
    if ($stmt) { $stmt->bind_param('i', $orderId); $stmt->execute(); $r = $stmt->get_result()->fetch_assoc(); $stmt->close(); if ($r) { $plan = $r; $planId = (int)$r['id']; } }

    $payments = [];
    if ($planId) {
        $stmtP = $conn->prepare("SELECT id, tx_ref, amount, type, paid_at, provider, currency, created_at FROM installment_payments WHERE plan_id = ? ORDER BY paid_at ASC, id ASC");
        if ($stmtP) { $stmtP->bind_param('i', $planId); $stmtP->execute(); $res = $stmtP->get_result(); while ($row = $res->fetch_assoc()) { $payments[] = $row; } $stmtP->close(); }
    }

    json_ok(['success' => true, 'data' => ['plan' => $plan, 'payments' => $payments]]);
}

// Generate receipt for an installment order
function installments_generate_receipt($orderId) {
    $orderId = (int)$orderId;
    if ($orderId <= 0) { json_error('Invalid order ID', 422); }

    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { json_error('Database connection failed', 500); }

    // Get the installment plan details
    $stmt = $conn->prepare("
        SELECT ip.*, o.total_amount as order_total, o.currency, o.created_at as order_date,
               u.full_name, u.email
        FROM installment_plans ip
        LEFT JOIN orders o ON ip.order_id = o.id
        LEFT JOIN users u ON ip.user_id = u.id
        WHERE ip.order_id = ?
        LIMIT 1
    ");
    
    if (!$stmt) {
        json_error('Query failed', 500);
    }
    
    $stmt->bind_param('i', $orderId);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$plan) {
        json_error('Installment plan not found', 404);
    }

    // Get payment history
    $paymentStmt = $conn->prepare("
        SELECT * FROM installment_payments 
        WHERE plan_id = ? 
        ORDER BY paid_at DESC
    ");
    $payments = [];
    if ($paymentStmt) {
        $paymentStmt->bind_param('i', $plan['id']);
        $paymentStmt->execute();
        $result = $paymentStmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        $paymentStmt->close();
    }

    // Calculate progress
    $totalPaid = floatval($plan['amount_paid'] ?? 0);
    $totalAmount = floatval($plan['total_amount'] ?? 0);
    $progress = $totalAmount > 0 ? round(($totalPaid / $totalAmount) * 100, 1) : 0;
    $remaining = $totalAmount - $totalPaid;

    $receiptData = [
        'receiptNumber' => 'INS-' . str_pad($orderId, 6, '0', STR_PAD_LEFT),
        'orderId' => $orderId,
        'customer' => [
            'name' => $plan['full_name'] ?? 'Customer',
            'email' => $plan['email'] ?? ''
        ],
        'plan' => [
            'status' => $plan['status'],
            'weeks' => $plan['weeks'],
            'depositAmount' => floatval($plan['deposit_amount']),
            'weeklyAmount' => floatval($plan['weekly_amount']),
            'totalAmount' => $totalAmount,
            'amountPaid' => $totalPaid,
            'remaining' => $remaining,
            'progress' => $progress,
            'paymentsMade' => (int)$plan['payments_made'],
            'nextDueDate' => $plan['next_due_at'],
            'startDate' => $plan['start_at'],
            'expiryDate' => $plan['expiry_at']
        ],
        'payments' => $payments,
        'generatedAt' => date('Y-m-d H:i:s')
    ];

    json_ok([
        'success' => true, 
        'receipt' => $receiptData,
        'downloadUrl' => null // Could generate PDF URL here if needed
    ]);
}

// Schedule reminder email for installment payment
function installments_schedule_reminder() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $orderId = (int)($input['orderId'] ?? 0);
    $daysBefore = (int)($input['daysBefore'] ?? 1);

    if ($orderId <= 0) { json_error('Missing orderId', 422); }

    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { json_error('Database connection failed', 500); }

    // Get plan details
    $stmt = $conn->prepare("
        SELECT ip.*, u.full_name, u.email
        FROM installment_plans ip
        LEFT JOIN users u ON ip.user_id = u.id
        WHERE ip.order_id = ?
        LIMIT 1
    ");
    
    if (!$stmt) {
        json_error('Query failed', 500);
    }
    
    $stmt->bind_param('i', $orderId);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$plan) {
        json_error('Installment plan not found', 404);
    }

    $email = $plan['email'] ?? '';
    $name = $plan['full_name'] ?? 'Customer';
    $nextDue = $plan['next_due_at'];
    $weeklyAmount = floatval($plan['weekly_amount'] ?? 0);

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('No valid email for this plan', 422);
    }

    // Check if reminder already exists for this due date
    $conn->query("
        CREATE TABLE IF NOT EXISTS scheduled_reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            reminder_type VARCHAR(50) DEFAULT 'installment',
            scheduled_for DATETIME NOT NULL,
            sent BOOLEAN DEFAULT FALSE,
            email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_reminder (order_id, scheduled_for)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $reminderDate = date('Y-m-d', strtotime($nextDue . ' -' . $daysBefore . ' days'));

    $insertStmt = $conn->prepare("
        INSERT IGNORE INTO scheduled_reminders (order_id, reminder_type, scheduled_for, email)
        VALUES (?, 'installment', ?, ?)
    ");
    
    if ($insertStmt) {
        $insertStmt->bind_param('iss', $orderId, $reminderDate, $email);
        $insertStmt->execute();
        $insertStmt->close();
    }

    // Send immediate reminder email if due date is within next 2 days
    $daysUntilDue = (strtotime($nextDue) - time()) / 86400;
    if ($daysUntilDue <= 2 && $daysUntilDue >= 0) {
        try {
            $mail = getMailer();
            if ($mail) {
                $mail->addAddress($email, $name);
                $mail->Subject = 'Installment Payment Reminder - Due Soon';
                $mail->Body = '
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                        <div style="background:#1a1a2e;padding:20px;text-align:center;">
                            <h1 style="color:#fff;margin:0;">Payment Reminder</h1>
                        </div>
                        <div style="padding:20px;">
                            <p>Hi ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ',</p>
                            <p>This is a friendly reminder that your installment payment is due soon.</p>
                            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                                <p><strong>Amount Due:</strong> £' . number_format($weeklyAmount, 2) . '</p>
                                <p><strong>Due Date:</strong> ' . date('F j, Y', strtotime($nextDue)) . '</p>
                            </div>
                            <p>Please ensure your payment is made on time to avoid any late fees.</p>
                            <p>Best regards,<br><strong>Xtrapush Team</strong></p>
                        </div>
                    </div>
                ';
                $mail->AltBody = "Payment Reminder\n\nHi $name,\n\nYour installment payment of £" . number_format($weeklyAmount, 2) . " is due on " . date('F j, Y', strtotime($nextDue)) . ".\n\nPlease ensure timely payment.\n\nXtrapush Team";
                $mail->send();
            }
        } catch (Throwable $e) {
            error_log('Reminder email error: ' . $e->getMessage());
        }
    }

    json_ok([
        'success' => true,
        'message' => 'Reminder scheduled',
        'scheduledFor' => $reminderDate,
        'nextDueDate' => $nextDue
    ]);
}

// List receipts for a user
function installments_list_receipts() {
    $userUid = $_GET['uid'] ?? '';

    if (!$userUid) { json_error('Missing uid', 422); }

    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { json_error('Database connection failed', 500); }

    // Get user id from uid
    $userStmt = $conn->prepare("SELECT id FROM users WHERE uid = ? LIMIT 1");
    $userId = null;
    if ($userStmt) {
        $userStmt->bind_param('s', $userUid);
        $userStmt->execute();
        $result = $userStmt->get_result()->fetch_assoc();
        if ($result) { $userId = $result['id']; }
        $userStmt->close();
    }

    if (!$userId) {
        json_ok(['success' => true, 'receipts' => []]);
        exit;
    }

    // Get installment plans for user
    $stmt = $conn->prepare("
        SELECT ip.id, ip.order_id, ip.status, ip.total_amount, ip.amount_paid, ip.payments_made, ip.created_at
        FROM installment_plans ip
        WHERE ip.user_id = ?
        ORDER BY ip.created_at DESC
        LIMIT 50
    ");

    $receipts = [];
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $receipts[] = [
                'id' => $row['id'],
                'orderId' => $row['order_id'],
                'receiptNumber' => 'INS-' . str_pad($row['order_id'], 6, '0', STR_PAD_LEFT),
                'status' => $row['status'],
                'totalAmount' => floatval($row['total_amount']),
                'amountPaid' => floatval($row['amount_paid']),
                'paymentsMade' => (int)$row['payments_made'],
                'createdAt' => $row['created_at']
            ];
        }
        $stmt->close();
    }

    json_ok(['success' => true, 'receipts' => $receipts]);
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest($path) {
    if (preg_match('#^/admin/gadgets/(\\d+)/variants/(\\d+)$#', $path, $m)) {
        deleteGadgetVariant((int)$m[1], (int)$m[2]);
    } elseif (preg_match('/\/admin\/gadgets\/(\d+)/', $path, $matches)) {
        deleteAdminGadget($matches[1]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
}

/**
 * Reusable admin guard
 */
function getAdminByUid($conn, $adminUid) {
    try {
        $adminSql = "SELECT id, uid, email FROM users WHERE uid = ? AND user_role = 'admin' AND is_active = 1";
        $adminStmt = $conn->prepare($adminSql);
        $adminStmt->bind_param('s', $adminUid);
        $adminStmt->execute();
        $adminResult = $adminStmt->get_result();
        $admin = $adminResult->fetch_assoc();
        $adminStmt->close();
        return $admin ?: null;
    } catch (Exception $e) {
        error_log('❌ Error in getAdminByUid: ' . $e->getMessage());
        return null;
    }
}

/**
 * Admin: List users (excluding password) with optional filters
 * GET /admin/users
 * Requires `adminUid` query param
 */
function getAdminUsersList() {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn) { json_error('Database connection failed', 500); }

        $adminUid = $_GET['adminUid'] ?? null;
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Admin permissions required']); return; }

        // Optional filters
        $role = $_GET['role'] ?? null; // admin|seller|buyer
        $active = isset($_GET['active']) ? (int)$_GET['active'] : null; // 1 or 0
        $sellerVerified = isset($_GET['sellerVerified']) ? (int)$_GET['sellerVerified'] : null; // 1 or 0

        $sql = "SELECT id, uid, email, full_name, town, address, postcode, phone, user_role, signup_method, photo_url, seller_verified, is_active, created_at, updated_at FROM users";
        $conditions = [];
        $params = [];
        $types = '';

        if (!is_null($active)) { $conditions[] = 'is_active = ?'; $params[] = $active; $types .= 'i'; }
        if ($role) { $conditions[] = 'user_role = ?'; $params[] = $role; $types .= 's'; }
        if (!is_null($sellerVerified)) { $conditions[] = 'seller_verified = ?'; $params[] = $sellerVerified; $types .= 'i'; }

        if (!empty($conditions)) { $sql .= ' WHERE ' . implode(' AND ', $conditions); }
        $sql .= ' ORDER BY created_at DESC';

        if (!empty($params)) {
            $stmt = $conn->prepare($sql);
            if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query($sql);
            if (!$result) { throw new Exception('Query failed: ' . $conn->error); }
        }

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => (int)$row['id'],
                'uid' => $row['uid'],
                'email' => $row['email'],
                'fullName' => $row['full_name'],
                'town' => $row['town'],
                'address' => $row['address'],
                'postcode' => $row['postcode'],
                'phone' => $row['phone'],
                'userRole' => $row['user_role'],
                'signupMethod' => $row['signup_method'],
                'photoURL' => $row['photo_url'],
                'sellerVerified' => (bool)$row['seller_verified'],
                'isActive' => (bool)$row['is_active'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
            ];
        }

        echo json_encode(['success' => true, 'data' => $users]);
    } catch (Exception $e) {
        error_log('❌ Error in getAdminUsersList: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch users']);
    }
}

/**
 * Admin: Get a specific user detail by uid (excluding password)
 * GET /admin/users/{uid}
 * Requires `adminUid` query param
 */
function getAdminUserDetail($uid) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }

        $adminUid = $_GET['adminUid'] ?? null;
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Admin permissions required']); return; }

        $sql = "SELECT id, uid, email, full_name, town, address, postcode, phone, user_role, signup_method, photo_url, seller_verified, is_active, created_at, updated_at FROM users WHERE uid = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->bind_param('s', $uid);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'User not found']); return; }

        $data = [
            'id' => (int)$user['id'],
            'uid' => $user['uid'],
            'email' => $user['email'],
            'fullName' => $user['full_name'],
            'town' => $user['town'],
            'address' => $user['address'],
            'postcode' => $user['postcode'],
            'phone' => $user['phone'],
            'userRole' => $user['user_role'],
            'signupMethod' => $user['signup_method'],
            'photoURL' => $user['photo_url'],
            'sellerVerified' => (bool)$user['seller_verified'],
            'isActive' => (bool)$user['is_active'],
            'createdAt' => $user['created_at'],
            'updatedAt' => $user['updated_at'],
        ];

        echo json_encode(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        error_log('❌ Error in getAdminUserDetail: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch user detail']);
    }
}

/**
 * Admin: Account status actions (deactivate/reactivate/close)
 * POST /admin/users/actions
 * Body: { action: 'deactivate'|'reactivate'|'close', targetUid, adminUid }
 */
function adminUserAction() {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Invalid JSON']); return; }

        $action = $input['action'] ?? null;
        $targetUid = $input['targetUid'] ?? null;
        $adminUid = $input['adminUid'] ?? null;

        if (!$action || !$targetUid || !$adminUid) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields: action, targetUid, adminUid']);
            return;
        }

        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Admin permissions required']); return; }

        // Prevent admin from closing/deactivating own account
        if ($adminUid === $targetUid) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Cannot perform action on own admin account']);
            return;
        }

        // Resolve target user
        // Allow matching by uid or google_uid to cover OAuth-created accounts
        $userSql = "SELECT id, user_role, is_active FROM users WHERE (uid = ? OR google_uid = ?) LIMIT 1";
        $userStmt = $conn->prepare($userSql);
        if (!$userStmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $userStmt->bind_param('ss', $targetUid, $targetUid);
        $userStmt->execute();
        $userRes = $userStmt->get_result();
        $user = $userRes->fetch_assoc();
        $userStmt->close();

        if (!$user) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Target user not found']); return; }
        if ($user['user_role'] === 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cannot modify another admin via this endpoint']);
            return;
        }

        if ($action === 'deactivate') {
            $sql = "UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
            $stmt->bind_param('i', $user['id']);
            if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
            $stmt->close();
            echo json_encode(['success' => true, 'message' => 'User deactivated']);
        } elseif ($action === 'reactivate') {
            $sql = "UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
            $stmt->bind_param('i', $user['id']);
            if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
            $stmt->close();
            echo json_encode(['success' => true, 'message' => 'User reactivated']);
        } elseif ($action === 'close') {
            // Close account: anonymize PII and deactivate
            $anonEmail = 'closed_' . $user['id'] . '@itsxtrapush.com';
            $sql = "UPDATE users SET email = ?, full_name = 'Closed Account', phone = '', address = '', town = '', postcode = '', is_active = 0, updated_at = NOW() WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
            $stmt->bind_param('si', $anonEmail, $user['id']);
            if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
            $stmt->close();
            echo json_encode(['success' => true, 'message' => 'User account closed']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action. Use deactivate|reactivate|close']);
        }
    } catch (Exception $e) {
        error_log('❌ Error in adminUserAction: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to perform admin action']);
    }
}

/** Create admin-managed gadget (admin only) */
function createAdminGadget() {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['adminUid'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Missing required field: adminUid'
            ]);
            return;
        }

        $admin = getAdminByUid($conn, $data['adminUid']);
        if (!$admin) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Admin permissions required'
            ]);
            return;
        }

        $required = ['name','description','price','category','brand','model'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => "Missing required field: {$field}"
                ]);
                return;
            }
        }

        $sql = "INSERT INTO gadgets (name, description, price, monthly_price, price_gbp, monthly_price_gbp, image_url, category, brand, model, condition_status, specifications, in_stock, stock_quantity, is_active, created_at, updated_at)
                VALUES (?, ?, ?, NULLIF(?, 0), NULLIF(?, 0), NULLIF(?, 0), ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())";

        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }

        $monthlyPrice = isset($data['monthlyPrice']) && is_numeric($data['monthlyPrice']) ? (float)$data['monthlyPrice'] : 0.0;
        $priceGbp = isset($data['priceGbp']) && is_numeric($data['priceGbp']) ? (float)$data['priceGbp'] : null;
        $monthlyPriceGbp = isset($data['monthlyPriceGbp']) && is_numeric($data['monthlyPriceGbp']) ? (float)$data['monthlyPriceGbp'] : 0.0;
        $imageUrl = $data['image'] ?? null;
        $specs = isset($data['specifications']) ? json_encode($data['specifications']) : json_encode([]);
        $inStock = isset($data['inStock']) ? (int)$data['inStock'] : 1;
        $stockQty = isset($data['stockQuantity']) ? (int)$data['stockQuantity'] : 0;
        $conditionStatus = isset($data['condition']) ? $data['condition'] : (isset($data['conditionStatus']) ? $data['conditionStatus'] : 'new');

        $stmt->bind_param('ssddddsssssii',
            $data['name'],
            $data['description'],
            $data['price'],
            $monthlyPrice,
            $priceGbp,
            $monthlyPriceGbp,
            $imageUrl,
            $data['category'],
            $data['brand'],
            $data['model'],
            $conditionStatus,
            $specs,
            $inStock,
            $stockQty
        );

        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }

        $newId = $stmt->insert_id;
        $stmt->close();

        echo json_encode(['success' => true,'message' => 'Gadget created successfully','id' => (int)$newId]);

    } catch (Exception $e) {
        error_log('❌ Error in createAdminGadget: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to create gadget']);
    }
}

/** Get single admin gadget by ID */
function getAdminGadgetById($gadgetId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        
        $adminUid = $_GET['adminUid'] ?? null;
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        
        $sql = "SELECT id, name, description, price, monthly_price, price_gbp, monthly_price_gbp, image_url, category, brand, model, condition_status, specifications, in_stock, stock_quantity, is_pre_order, has_3d_model, model3d_path, created_at, updated_at FROM gadgets WHERE id = ? AND is_active = 1 LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        
        $stmt->bind_param('i', $gadgetId);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        
        $result = $stmt->get_result();
        $gadget = $result->fetch_assoc();
        $stmt->close();
        
        if (!$gadget) { 
            http_response_code(404); 
            echo json_encode(['success' => false,'error' => 'Gadget not found']); 
            return; 
        }
        
        // Parse specifications JSON
        $specs = $gadget['specifications'] ? json_decode($gadget['specifications'], true) : [];
        
        $response = [
            'success' => true,
            'data' => [
                'id' => (int)$gadget['id'],
                'name' => $gadget['name'],
                'description' => $gadget['description'],
                'price' => (float)$gadget['price'],
                'monthlyPrice' => $gadget['monthly_price'] !== null ? (float)$gadget['monthly_price'] : null,
                'priceGbp' => $gadget['price_gbp'] !== null ? (float)$gadget['price_gbp'] : null,
                'monthlyPriceGbp' => $gadget['monthly_price_gbp'] !== null ? (float)$gadget['monthly_price_gbp'] : null,
                'image' => $gadget['image_url'],
                'category' => $gadget['category'],
                'brand' => $gadget['brand'],
                'model' => $gadget['model'],
                'condition' => $gadget['condition_status'],
                'conditionStatus' => $gadget['condition_status'],
                'specifications' => $specs,
                'inStock' => (bool)$gadget['in_stock'],
                'isPreOrder' => isset($gadget['is_pre_order']) ? (bool)$gadget['is_pre_order'] : false,
                'stockQuantity' => (int)$gadget['stock_quantity'],
                'has3dModel' => (bool)$gadget['has_3d_model'],
                'model3dPath' => $gadget['model3d_path'],
                'createdAt' => $gadget['created_at'],
                'updatedAt' => $gadget['updated_at']
            ]
        ];
        
        echo json_encode($response);
    } catch (Exception $e) {
        error_log('❌ Error in getAdminGadgetById: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to fetch gadget']);
    }
}

/** Update admin gadget */
function updateAdminGadget($gadgetId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['adminUid'])) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $data['adminUid']);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        
        // Build update query avoiding price fields due to triggers
        $updates = [];
        $params = [];
        $types = '';
        
        // Handle each field individually
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $params[] = $data['name'];
            $types .= 's';
        }
        
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
            $types .= 's';
        }
        
        
        if (isset($data['image']) || isset($data['imageUrl'])) {
            $updates[] = 'image_url = ?';
            $params[] = isset($data['image']) ? $data['image'] : $data['imageUrl'];
            $types .= 's';
        }
        
        if (isset($data['category'])) {
            $updates[] = 'category = ?';
            $params[] = $data['category'];
            $types .= 's';
        }
        
        if (isset($data['brand'])) {
            $updates[] = 'brand = ?';
            $params[] = $data['brand'];
            $types .= 's';
        }
        
        if (isset($data['model'])) {
            $updates[] = 'model = ?';
            $params[] = $data['model'];
            $types .= 's';
        }
        
        if (isset($data['condition']) || isset($data['conditionStatus'])) {
            $updates[] = 'condition_status = ?';
            $params[] = isset($data['condition']) ? $data['condition'] : $data['conditionStatus'];
            $types .= 's';
        }
        
        if (isset($data['specifications'])) {
            $updates[] = 'specifications = ?';
            $specValue = is_array($data['specifications']) ? json_encode($data['specifications']) : $data['specifications'];
            $params[] = $specValue;
            $types .= 's';
        }
        
        if (isset($data['inStock'])) {
            $updates[] = 'in_stock = ?';
            $params[] = (int)$data['inStock'];
            $types .= 'i';
        }
        
        if (isset($data['stockQuantity'])) {
            $updates[] = 'stock_quantity = ?';
            $params[] = (int)$data['stockQuantity'];
            $types .= 'i';
        }
        
        // Always update timestamp
        $updates[] = 'updated_at = NOW()';
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No valid fields to update']);
            return;
        }
        
        $sql = 'UPDATE gadgets SET ' . implode(', ', $updates) . ' WHERE id = ? AND is_active = 1';
        $stmt = $conn->prepare($sql);
        if (!$stmt) { 
            error_log('Prepare failed: ' . $conn->error);
            throw new Exception('Prepare failed: ' . $conn->error); 
        }
        
        // Add gadget ID parameter
        $params[] = $gadgetId;
        $types .= 'i';
        
        // Bind parameters
        if (!empty($params)) {
            $refs = [];
            foreach($params as $key => $value) {
                $refs[$key] = &$params[$key];
            }
            array_unshift($refs, $types);
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        
        if (!$stmt->execute()) { 
            error_log('Execute failed: ' . $stmt->error);
            throw new Exception('Execute failed: ' . $stmt->error); 
        }
        
        if ($stmt->affected_rows > 0) { 
            echo json_encode(['success' => true,'message' => 'Gadget updated successfully']); 
        } else { 
            http_response_code(404); 
            echo json_encode(['success' => false,'error' => 'Gadget not found or no changes made']); 
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log('❌ Error in updateAdminGadget: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to update gadget: ' . $e->getMessage()]);
    }
}

/** Soft-delete admin gadget */
function deleteAdminGadget($gadgetId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $input = json_decode(file_get_contents('php://input'), true);
        $adminUid = $input['adminUid'] ?? ($_GET['adminUid'] ?? null);
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        $sql = "UPDATE gadgets SET is_active = 0, updated_at = NOW() WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->bind_param('i', $gadgetId);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        if ($stmt->affected_rows > 0) { echo json_encode(['success' => true,'message' => 'Gadget deleted successfully']); }
        else { http_response_code(404); echo json_encode(['success' => false,'error' => 'Gadget not found or already inactive']); }
        $stmt->close();
    } catch (Exception $e) {
        error_log('❌ Error in deleteAdminGadget: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to delete gadget']);
    }
}

/** Get all variants for a gadget (admin only) */
function getAdminGadgetVariants($gadgetId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $adminUid = $_GET['adminUid'] ?? null;
        $includeInactive = isset($_GET['includeInactive']) && $_GET['includeInactive'] === 'true';
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        $sql = 'SELECT id, color, color_hex, storage, condition_status, price, price_gbp, stock_quantity, sku, is_active, created_at, updated_at FROM gadget_variants WHERE gadget_id = ?' . ($includeInactive ? '' : ' AND is_active = 1');
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $gadgetId);
        $stmt->execute();
        $res = $stmt->get_result();
        $variants = [];
        while ($row = $res->fetch_assoc()) {
            $variants[] = [
                'id' => (int)$row['id'],
                'color' => $row['color'],
                'colorHex' => $row['color_hex'],
                'storage' => $row['storage'],
                'condition' => $row['condition_status'],
                'condition_status' => $row['condition_status'],
                'price' => (float)$row['price'],
                'priceGbp' => $row['price_gbp'] !== null ? (float)$row['price_gbp'] : null,
                'stockQuantity' => (int)$row['stock_quantity'],
                'isPreOrder' => isset($row['is_pre_order']) ? (bool)$row['is_pre_order'] : false,
                'sku' => $row['sku'],
                'isActive' => (bool)$row['is_active'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }
        $stmt->close();
        echo json_encode(['success' => true, 'data' => $variants]);
    } catch (Exception $e) {
        error_log('❌ Error in getAdminGadgetVariants: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to fetch variants']);
    }
}

/** Create a variant for a gadget (admin only) - supports Color/Storage/Condition pricing */
function createGadgetVariant($gadgetId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['adminUid'])) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $data['adminUid']);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        
        // Extract variant fields including color
        $colorRaw = isset($data['color']) ? trim((string)$data['color']) : '';
        $color = $colorRaw !== '' ? $colorRaw : null; // Convert empty string to NULL for DB
        $colorHexRaw = isset($data['colorHex']) ? trim((string)$data['colorHex']) : (isset($data['color_hex']) ? trim((string)$data['color_hex']) : '');
        $colorHex = $colorHexRaw !== '' ? $colorHexRaw : null;
        $storage = isset($data['storage']) ? trim((string)$data['storage']) : '';
        $cond = isset($data['condition']) ? (string)$data['condition'] : (isset($data['condition_status']) ? (string)$data['condition_status'] : 'new');
        $price = isset($data['price']) && is_numeric($data['price']) ? (float)$data['price'] : null;
        $priceGbp = isset($data['priceGbp']) && is_numeric($data['priceGbp']) ? (float)$data['priceGbp'] : (isset($data['price_gbp']) && is_numeric($data['price_gbp']) ? (float)$data['price_gbp'] : null);
        $qty = isset($data['stockQuantity']) ? (int)$data['stockQuantity'] : (isset($data['stock_quantity']) ? (int)$data['stock_quantity'] : 0);
        $sku = isset($data['sku']) ? (string)$data['sku'] : null;
        
        if (!$storage || $price === null) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required fields: storage, price']); return; }
        
        // Enforce uniqueness per gadget (color + storage + condition combination)
        // Handle NULL color values in the uniqueness check
        if ($color === null) {
            $chk = $conn->prepare('SELECT id FROM gadget_variants WHERE gadget_id = ? AND color IS NULL AND storage = ? AND condition_status = ? LIMIT 1');
            $chk->bind_param('iss', $gadgetId, $storage, $cond);
        } else {
            $chk = $conn->prepare('SELECT id FROM gadget_variants WHERE gadget_id = ? AND color = ? AND storage = ? AND condition_status = ? LIMIT 1');
            $chk->bind_param('isss', $gadgetId, $color, $storage, $cond);
        }
        $chk->execute();
        $cres = $chk->get_result();
        $exists = $cres->fetch_assoc();
        $chk->close();
        if ($exists) { http_response_code(409); echo json_encode(['success' => false,'error' => 'Variant already exists for this color, storage and condition combination']); return; }
        
        // Insert with color support
        $stmt = $conn->prepare('INSERT INTO gadget_variants (gadget_id, color, color_hex, storage, condition_status, price, price_gbp, stock_quantity, sku, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULLIF(?, ""), 1, NOW(), NOW())');
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->bind_param('issssddis', $gadgetId, $color, $colorHex, $storage, $cond, $price, $priceGbp, $qty, $sku);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        $newId = $stmt->insert_id;
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Variant created successfully', 'id' => (int)$newId]);
    } catch (Exception $e) {
        error_log('❌ Error in createGadgetVariant: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to create variant']);
    }
}

/** Update a variant for a gadget (admin only) - supports Color/Storage/Condition pricing */
function updateGadgetVariant($gadgetId, $variantId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['adminUid'])) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $data['adminUid']);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        // Build dynamic update - now includes color fields
        $fields = [];
        $types = '';
        $params = [];
        if (array_key_exists('color', $data)) { 
            $fields[] = 'color = ?'; 
            $types .= 's'; 
            $colorVal = ($data['color'] ?? null) === null || trim((string)($data['color'] ?? '')) === '' ? null : trim((string)$data['color']);
            $params[] = $colorVal; 
        }
        if (array_key_exists('colorHex', $data) || array_key_exists('color_hex', $data)) { 
            $fields[] = 'color_hex = ?'; 
            $types .= 's'; 
            $hex = $data['colorHex'] ?? $data['color_hex'] ?? null;
            $hexVal = ($hex === null || trim((string)$hex) === '') ? null : trim((string)$hex);
            $params[] = $hexVal; 
        }
        if (isset($data['storage'])) { $fields[] = 'storage = ?'; $types .= 's'; $params[] = trim((string)$data['storage']); }
        if (isset($data['condition']) || isset($data['condition_status'])) { $fields[] = 'condition_status = ?'; $types .= 's'; $params[] = isset($data['condition']) ? (string)$data['condition'] : (string)$data['condition_status']; }
        if (isset($data['price'])) { $fields[] = 'price = ?'; $types .= 'd'; $params[] = (float)$data['price']; }
        if (isset($data['priceGbp']) || isset($data['price_gbp'])) { 
            $fields[] = 'price_gbp = ?'; 
            $types .= 'd'; 
            $params[] = isset($data['priceGbp']) ? (float)$data['priceGbp'] : (float)$data['price_gbp']; 
        }
        if (isset($data['stockQuantity']) || isset($data['stock_quantity'])) { $fields[] = 'stock_quantity = ?'; $types .= 'i'; $params[] = isset($data['stockQuantity']) ? (int)$data['stockQuantity'] : (int)$data['stock_quantity']; }
        if (array_key_exists('sku', $data)) { $fields[] = 'sku = NULLIF(?, "")'; $types .= 's'; $params[] = $data['sku'] === null ? '' : (string)$data['sku']; }
        if (isset($data['isActive'])) { $fields[] = 'is_active = ?'; $types .= 'i'; $params[] = $data['isActive'] ? 1 : 0; }
        if (empty($fields)) { echo json_encode(['success' => true, 'message' => 'No changes provided']); return; }
        $sql = 'UPDATE gadget_variants SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = ? AND gadget_id = ?';
        $types .= 'ii';
        $params[] = $variantId;
        $params[] = $gadgetId;
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->bind_param($types, ...$params);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        if ($stmt->affected_rows > 0) { echo json_encode(['success' => true,'message' => 'Variant updated successfully']); }
        else { http_response_code(404); echo json_encode(['success' => false,'error' => 'Variant not found or no changes made']); }
        $stmt->close();
    } catch (Exception $e) {
        error_log('❌ Error in updateGadgetVariant: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to update variant']);
    }
}

/** Soft-delete a variant (admin only) */
function deleteGadgetVariant($gadgetId, $variantId) {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }
        $input = json_decode(file_get_contents('php://input'), true);
        $adminUid = $input['adminUid'] ?? ($_GET['adminUid'] ?? null);
        if (!$adminUid) { http_response_code(400); echo json_encode(['success' => false,'error' => 'Missing required field: adminUid']); return; }
        $admin = getAdminByUid($conn, $adminUid);
        if (!$admin) { http_response_code(403); echo json_encode(['success' => false,'error' => 'Admin permissions required']); return; }
        $sql = 'UPDATE gadget_variants SET is_active = 0, updated_at = NOW() WHERE id = ? AND gadget_id = ?';
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->bind_param('ii', $variantId, $gadgetId);
        if (!$stmt->execute()) { throw new Exception('Execute failed: ' . $stmt->error); }
        if ($stmt->affected_rows > 0) { echo json_encode(['success' => true,'message' => 'Variant deleted successfully']); }
        else { http_response_code(404); echo json_encode(['success' => false,'error' => 'Variant not found or already inactive']); }
        $stmt->close();
    } catch (Exception $e) {
        error_log('❌ Error in deleteGadgetVariant: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false,'error' => 'Failed to delete variant']);
    }
}

/** Helper: parse first image from JSON string */
function firstImageFromJson($imagesJson) {
    if (!$imagesJson) { return null; }
    $arr = json_decode($imagesJson, true);
    if (is_array($arr) && isset($arr[0])) { return $arr[0]; }
    return null;
}

/** Helper: fetch order items with joined gadget/seller data */
function fetchOrderItems($conn, $orderId) {
    try {
        $sql = "SELECT oi.id, oi.item_type, oi.quantity, oi.unit_price, oi.total_price, oi.variant_id, oi.storage,
                       g.name AS g_name, g.brand AS g_brand, g.model AS g_model, g.image_url AS g_image,
                       sg.name AS s_name, sg.brand AS s_brand, sg.model AS s_model, sg.images AS s_images,
                       gv.storage AS v_storage
                FROM order_items oi
                LEFT JOIN gadgets g ON oi.gadget_id = g.id
                LEFT JOIN seller_gadgets sg ON oi.seller_gadget_id = sg.id
                LEFT JOIN gadget_variants gv ON oi.variant_id = gv.id
                WHERE oi.order_id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { return []; }
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            $isSeller = ($row['item_type'] === 'seller_gadget');
            $name = $isSeller ? ($row['s_name'] ?? null) : ($row['g_name'] ?? null);
            $brand = $isSeller ? ($row['s_brand'] ?? null) : ($row['g_brand'] ?? null);
            $model = $isSeller ? ($row['s_model'] ?? null) : ($row['g_model'] ?? null);
            $image = $isSeller ? firstImageFromJson($row['s_images'] ?? null) : ($row['g_image'] ?? null);
            $storage = isset($row['storage']) && $row['storage'] !== null ? $row['storage'] : ($row['v_storage'] ?? null);
            $items[] = [
                'type' => $row['item_type'],
                'name' => $name,
                'brand' => $brand,
                'model' => $model,
                'image' => $image,
                'storage' => $storage,
                'quantity' => (int)($row['quantity'] ?? 1),
                'unitPrice' => isset($row['unit_price']) ? (float)$row['unit_price'] : null,
                'totalPrice' => isset($row['total_price']) ? (float)$row['total_price'] : null,
                'variantId' => $row['variant_id'] !== null ? (int)$row['variant_id'] : null
            ];
        }
        $stmt->close();
        return $items;
    } catch (Exception $e) {
        error_log('Error in fetchOrderItems: ' . $e->getMessage());
        return [];
    }
}

/** Orders: get user orders by UID */
function getUserOrdersByUid($userUid) {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    try {
        $user = getUserByUid($conn, $userUid);
        if (!$user) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'User not found']); return; }
        $userId = (int)$user['id'];
        $stmt = $conn->prepare("SELECT id, total_amount, currency, status, payment_status, notes, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        $orders = [];
        while ($row = $res->fetch_assoc()) {
            $items = fetchOrderItems($conn, (int)$row['id']);
            $orders[] = [
                'id' => (int)$row['id'],
                'userId' => $userId,
                'totalAmount' => isset($row['total_amount']) ? (float)$row['total_amount'] : 0.0,
                'currency' => $row['currency'] ?? null,
                'status' => $row['status'] ?? null,
                'paymentStatus' => $row['payment_status'] ?? null,
                'createdAt' => $row['created_at'] ?? null,
                'notes' => $row['notes'] ?? null,
                'items' => $items
            ];
        }
        $stmt->close();
        echo json_encode(['success' => true, 'orders' => $orders]);
    } catch (Exception $e) {
        error_log('Error in getUserOrdersByUid: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to load orders']);
    }
}

/** Orders: admin list of all orders */
function getAdminOrdersList() {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn) { json_error('Database connection failed', 500); }
    try {
        // Optional admin guard: if adminUid is provided, enforce it
        $adminUid = $_GET['adminUid'] ?? null;
        if ($adminUid) {
            $admin = getAdminByUid($conn, $adminUid);
            if (!$admin) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Admin permissions required']); return; }
        }
        $sql = "SELECT o.id, o.user_id, o.total_amount, o.currency, o.status, o.payment_status, o.created_at, o.notes,
                       u.email, u.full_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
        $stmt->execute();
        $res = $stmt->get_result();
        $orders = [];
        while ($row = $res->fetch_assoc()) {
            $items = fetchOrderItems($conn, (int)$row['id']);
            $orders[] = [
                'id' => (int)$row['id'],
                'userId' => isset($row['user_id']) ? (int)$row['user_id'] : null,
                'userEmail' => $row['email'] ?? null,
                'userName' => $row['full_name'] ?? null,
                'totalAmount' => isset($row['total_amount']) ? (float)$row['total_amount'] : 0.0,
                'currency' => $row['currency'] ?? null,
                'status' => $row['status'] ?? null,
                'paymentStatus' => $row['payment_status'] ?? null,
                'createdAt' => $row['created_at'] ?? null,
                'notes' => $row['notes'] ?? null,
                'items' => $items
            ];
        }
        $stmt->close();
        echo json_encode(['success' => true, 'orders' => $orders]);
    } catch (Exception $e) {
        error_log('Error in getAdminOrdersList: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to load orders']);
    }
}

// ---- Router ----
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rawPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
// Normalize path: strip possible "/api" base if present
$path = preg_replace('#^/api#', '', $rawPath);
$path = $path ?: '/';

// Direct access fallback using query (?endpoint=...)
// Allow when hitting "/api/" or "/api/index.php" explicitly
if (isset($_GET['endpoint']) && ($path === '/' || $path === '/index.php')) {
    $path = '/' . ltrim($_GET['endpoint'], '/');
}

function auth_login() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (!$email || !$password) { json_error('Missing email or password', 400); }

    $user = null;
    $accountType = null;
    $foundRow = false;

    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        if ($db && !$db->connect_errno) {
            $stmt = $db->prepare('SELECT uid, id, email, full_name, user_role, is_active, password_hash, signup_method FROM users WHERE email = ? LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $foundRow = true;
                if (!isset($row['is_active']) || (int)$row['is_active'] === 1) {
                    $existingMethod = strtolower($row['signup_method'] ?? '');
                    if ($existingMethod === 'google') {
                        // Password login is not allowed for Google-signup accounts
                        json_error(
                            'This account was created with Google sign-in. Please use "Sign in with Google" instead.',
                            401,
                            ['field' => 'password', 'errorType' => 'wrong_signup_method', 'signupMethod' => 'google']
                        );
                    }
                    $stored = $row['password_hash'] ?? '';
                    $valid = false;
                    if ($stored) {
                        if (function_exists('password_verify') && password_verify($password, $stored)) {
                            $valid = true;
                        } elseif (hash_equals($stored, $password)) {
                            $valid = true; // Dev-only plain text
                        }
                    } else {
                        // No password set for this account
                        json_error(
                            'No password set for this account. Please create a new one.',
                            401,
                            ['field' => 'password', 'errorType' => 'password_not_set']
                        );
                    }
                    if ($valid) {
                        $user = [
                            'uid' => $row['uid'] ?? null,
                            'id' => isset($row['id']) ? (int)$row['id'] : null,
                            'email' => $row['email'] ?? $email,
                            'displayName' => $row['full_name'] ?? null,
                            'userRole' => $row['user_role'] ?? 'buyer'
                        ];
                        $accountType = (($row['user_role'] ?? '') === 'admin') ? 'admin' : null;
                    } else {
                        // Invalid password provided
                        $isAdmin = (($row['user_role'] ?? '') === 'admin');
                        $extra = ['field' => 'password', 'errorType' => 'invalid_password'];
                        if ($isAdmin) { $extra['accountType'] = 'admin'; }
                        json_error('Invalid password', 401, $extra);
                    }
                } else {
                    json_error('Account inactive', 403);
                }
            }
            $stmt && $stmt->close();
        }
    } catch (Throwable $e) {
        error_log('Auth login DB error: ' . $e->getMessage());
    }

    // Fallback: demo admin login by seed for testing
    if (!$user && $email === 'admin@itsxtrapush.com' && $password === 'AdminXP2025?') {
        $user = [
            'uid' => 'admin_system_default',
            'id' => 1,
            'email' => $email,
            'displayName' => 'System Administrator',
            'userRole' => 'admin'
        ];
        $accountType = 'admin';
    }

    if (!$user) {
        if (!$foundRow) {
            json_error('No account found with this email address', 401, ['field' => 'email', 'errorType' => 'user_not_found']);
        } else {
            json_error('Invalid credentials', 401);
        }
    }

    // Issue simple signed token and cookie for cross-site session
    $secret = getenv('AUTH_SECRET') ?: (defined('PAYCHANGU_SECRET_KEY') ? PAYCHANGU_SECRET_KEY : 'dev-secret-change-me');
    $payload = ['uid' => $user['uid'] ?? $user['id'], 'email' => $user['email'], 'iat' => time(), 'exp' => time()+3600];
    $sig = hash_hmac('sha256', json_encode($payload), $secret);
    $token = base64_encode(json_encode($payload)) . '.' . $sig;

    // Ensure cookie works in cross-site context (localhost -> https domain)
    header('Set-Cookie: sp_session=' . $token . '; Path=/; HttpOnly; Secure; SameSite=None; Domain=sparkle-pro.co.uk', false);

    json_ok([
        'success' => true,
        'user' => $user,
        'token' => $token,
        'accountType' => $accountType,
        'bypassFirebase' => $accountType === 'admin'
    ]);
}

function ensure_users_columns($conn) {
    if (!$conn) { return; }
    $check = function($column) use ($conn) {
        $column = preg_replace('/[^a-zA-Z0-9_]/', '', $column);
        $res = $conn->query("SHOW COLUMNS FROM `users` LIKE '" . $conn->real_escape_string($column) . "'");
        return $res && $res->num_rows > 0;
    };
    if (!$check('user_role')) { $conn->query("ALTER TABLE `users` ADD COLUMN `user_role` VARCHAR(20) DEFAULT 'buyer'"); }
    if (!$check('password_hash')) { $conn->query("ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(255) NULL"); }
    if (!$check('signup_method')) { $conn->query("ALTER TABLE `users` ADD COLUMN `signup_method` VARCHAR(50) NULL"); }
    if (!$check('full_name')) { $conn->query("ALTER TABLE `users` ADD COLUMN `full_name` VARCHAR(255) NULL"); }
    if (!$check('is_active')) { $conn->query("ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) DEFAULT 1"); }
    if (!$check('google_uid')) { $conn->query("ALTER TABLE `users` ADD COLUMN `google_uid` VARCHAR(64) NULL"); }
    if (!$check('town')) { $conn->query("ALTER TABLE `users` ADD COLUMN `town` VARCHAR(100) NULL"); }
    if (!$check('address')) { $conn->query("ALTER TABLE `users` ADD COLUMN `address` VARCHAR(255) NULL"); }
    if (!$check('postcode')) { $conn->query("ALTER TABLE `users` ADD COLUMN `postcode` VARCHAR(20) NULL"); }
    if (!$check('phone')) { $conn->query("ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(50) NULL"); }
    if (!$check('photo_url')) { $conn->query("ALTER TABLE `users` ADD COLUMN `photo_url` VARCHAR(255) NULL"); }
    if (!$check('email_verified')) { $conn->query("ALTER TABLE `users` ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0"); }
    if (!$check('seller_verified')) { $conn->query("ALTER TABLE `users` ADD COLUMN `seller_verified` TINYINT(1) DEFAULT 0"); }
    if (!$check('created_at')) { $conn->query("ALTER TABLE `users` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); }
}

function auth_register() {
    $input = json_decode(file_get_contents('php://input'), true);
    $method = strtolower(trim($input['signupMethod'] ?? ''));
    $email = strtolower(trim($input['email'] ?? ''));
    $uid = trim($input['uid'] ?? '');
    $displayName = $input['displayName'] ?? ($input['fullName'] ?? null);
    $password = $input['password'] ?? null;
    $domain = $input['domain'] ?? null;

    if (!$email) { json_error('Email is required', 400, ['field' => 'email']); }
    if (!in_array($method, ['google', 'email_password'])) {
        json_error('Invalid signup method', 400, ['field' => 'signupMethod']);
    }

    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }

    ensure_users_columns($db);

    // Check existing account by email
    $stmt = $db->prepare("SELECT id, uid, email, full_name, user_role, password_hash, signup_method FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $existing = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    $existingHasPassword = $existing && !empty($existing['password_hash']);

    if ($method === 'google') {
        if (!$uid) { json_error('Missing uid for Google signup', 400, ['field' => 'uid']); }
        if ($existing) {
            if ($existingHasPassword) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'error' => 'Account already exists with email/password',
                    'field' => 'email',
                    'existingSignupMethod' => 'email_password'
                ]);
                exit;
            }
            // Update minimal profile fields for existing Google account
            $stmt = $db->prepare("UPDATE users SET uid = ?, google_uid = ?, full_name = COALESCE(?, full_name), signup_method = 'google' WHERE id = ?");
            $stmt->bind_param('sssi', $uid, $uid, $displayName, $existing['id']);
            $stmt->execute();
            $stmt->close();
            $userId = (int)$existing['id'];
        } else {
            $role = 'buyer';
            $stmt = $db->prepare("INSERT INTO users (uid, google_uid, email, full_name, user_role, signup_method, is_active) VALUES (?, ?, ?, ?, ?, 'google', 1)");
            $stmt->bind_param('sssss', $uid, $uid, $email, $displayName, $role);
            $stmt->execute();
            $userId = (int)$db->insert_id;
            $stmt->close();
        }
        $accountType = 'user';
    } else { // email_password
        if (!$password || strlen($password) < 6) {
            json_error('Password too weak', 400, ['field' => 'password']);
        }
        $hash = function_exists('password_hash') ? password_hash($password, PASSWORD_BCRYPT) : $password;
        if ($existing) {
            if (!$existingHasPassword) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'error' => 'Account exists with Google sign-in',
                    'field' => 'email',
                    'existingSignupMethod' => 'google'
                ]);
                exit;
            }
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'error' => 'Email already registered',
                'field' => 'email',
                'existingSignupMethod' => 'email_password'
            ]);
            exit;
        }
        if (!$uid) { $uid = 'local:' . bin2hex(random_bytes(8)); }
        $fullName = $displayName ?? ($input['fullName'] ?? null);
        $stmt = $db->prepare("INSERT INTO users (uid, email, full_name, user_role, signup_method, is_active, password_hash) VALUES (?, ?, ?, 'buyer', 'email_password', 1, ?)");
        $stmt->bind_param('ssss', $uid, $email, $fullName, $hash);
        $stmt->execute();
        $userId = (int)$db->insert_id;
        $stmt->close();
        $accountType = 'user';
    }

    // Create session token and cookie
    $secret = getenv('AUTH_SECRET') ?: (defined('PAYCHANGU_SECRET_KEY') ? PAYCHANGU_SECRET_KEY : 'dev-secret-change-me');
    $payload = ['uid' => $uid, 'email' => $email, 'iat' => time(), 'exp' => time() + 3600];
    $sig = hash_hmac('sha256', json_encode($payload), $secret);
    $token = base64_encode(json_encode($payload)) . '.' . $sig;

    header('Set-Cookie: sp_session=' . $token . '; Path=/; HttpOnly; Secure; SameSite=None; Domain=sparkle-pro.co.uk', false);

    $user = [
        'uid' => $uid,
        'id' => isset($userId) ? $userId : null,
        'email' => $email,
        'displayName' => $displayName,
        'userRole' => 'buyer'
    ];

    json_ok([
        'success' => true,
        'user' => $user,
        'token' => $token,
        'accountType' => $accountType,
        'bypassFirebase' => false
    ]);
}

function auth_link_google() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $googleUid = trim($input['googleUid'] ?? '');
    $displayName = $input['displayName'] ?? null;

    if (!$email) { json_error('Email is required', 400, ['field' => 'email']); }
    if (!$googleUid) { json_error('Missing googleUid', 400, ['field' => 'googleUid']); }

    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }

    ensure_users_columns($db);

    // Find existing account by email
    $stmt = $db->prepare("SELECT id, uid, email, full_name, user_role, password_hash, signup_method, google_uid FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $existing = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found', 'errorType' => 'user_not_found']);
        return;
    }

    // If already a Google account or already linked, just issue session
    $alreadyLinked = (($existing['signup_method'] ?? '') === 'google') || (($existing['google_uid'] ?? '') && $existing['google_uid'] === $googleUid) || (($existing['uid'] ?? '') && $existing['uid'] === $googleUid);
    if ($alreadyLinked) {
        $uid = ($existing['google_uid'] ?? '') ?: ($existing['uid'] ?? '') ?: $googleUid;
        $secret = getenv('AUTH_SECRET') ?: (defined('PAYCHANGU_SECRET_KEY') ? PAYCHANGU_SECRET_KEY : 'dev-secret-change-me');
        $payload = ['uid' => $uid, 'email' => $email, 'iat' => time(), 'exp' => time() + 3600];
        $sig = hash_hmac('sha256', json_encode($payload), $secret);
        $token = base64_encode(json_encode($payload)) . '.' . $sig;
        header('Set-Cookie: sp_session=' . $token . '; Path=/; HttpOnly; Secure; SameSite=None; Domain=sparkle-pro.co.uk', false);
        json_ok(['success' => true, 'user' => [
            'uid' => $uid,
            'id' => (int)$existing['id'],
            'email' => $email,
            'displayName' => ($existing['full_name'] ?? null) ?: $displayName,
            'userRole' => ($existing['user_role'] ?? 'buyer')
        ], 'token' => $token]);
        return;
    }

    // Link Google UID to existing email/password account
    $stmt = $db->prepare("UPDATE users SET google_uid = ?, full_name = COALESCE(?, full_name) WHERE id = ?");
    $stmt->bind_param('ssi', $googleUid, $displayName, $existing['id']);
    $stmt->execute();
    $stmt->close();

    // Issue session token bound to Google UID
    $secret = getenv('AUTH_SECRET') ?: (defined('PAYCHANGU_SECRET_KEY') ? PAYCHANGU_SECRET_KEY : 'dev-secret-change-me');
    $payload = ['uid' => $googleUid, 'email' => $email, 'iat' => time(), 'exp' => time() + 3600];
    $sig = hash_hmac('sha256', json_encode($payload), $secret);
    $token = base64_encode(json_encode($payload)) . '.' . $sig;
    header('Set-Cookie: sp_session=' . $token . '; Path=/; HttpOnly; Secure; SameSite=None; Domain=sparkle-pro.co.uk', false);

    json_ok([
        'success' => true,
        'user' => [
            'uid' => $googleUid,
            'id' => (int)$existing['id'],
            'email' => $email,
            'displayName' => $displayName ?? ($existing['full_name'] ?? null),
            'userRole' => ($existing['user_role'] ?? 'buyer')
        ],
        'token' => $token
    ]);
}

/**
 * Admin: Platform statistics
 * Provides visitors (daily signups), page views (orders created), and downloads (paid orders)
 * - GET /admin/stats?days=30&months=6&adminUid=ADMIN_UID
 */
function getAdminPlatformStats() {
    try {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn) { json_error('Database connection failed', 500); }

        // Optional admin guard when adminUid provided
        $adminUid = $_GET['adminUid'] ?? null;
        if ($adminUid) {
            $admin = getAdminByUid($conn, $adminUid);
            if (!$admin) { http_response_code(403); echo json_encode(['success' => false, 'error' => 'Admin permissions required']); return; }
        }

        // Bounds
        $days = isset($_GET['days']) ? max(1, min((int)$_GET['days'], 90)) : 30;
        $months = isset($_GET['months']) ? max(1, min((int)$_GET['months'], 12)) : 6;

        $stats = [
            'visitors' => ['daily' => []],
            'pageViews' => ['monthly' => []],
            'downloads' => ['monthly' => []]
        ];

        // Daily visitors: approximate using user signups
        $startDate = (new DateTime())->modify('-' . $days . ' days')->format('Y-m-d');
        $stmt = $conn->prepare('SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM users WHERE created_at >= ? GROUP BY day ORDER BY day ASC');
        if ($stmt) {
            $stmt->bind_param('s', $startDate);
            $stmt->execute();
            $res = $stmt->get_result();
            $daily = [];
            while ($row = $res->fetch_assoc()) {
                $daily[] = [
                    'day' => $row['day'],
                    'count' => isset($row['cnt']) ? (int)$row['cnt'] : 0
                ];
            }
            $stmt->close();
            $stats['visitors']['daily'] = $daily;
        }

        // Monthly page views: approximate using orders created
        $startMonthDate = (new DateTime(date('Y-m-01')))->modify('-' . ($months - 1) . ' months')->format('Y-m-d');
        $stmt2 = $conn->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM orders WHERE created_at >= ? GROUP BY ym ORDER BY ym ASC");
        if ($stmt2) {
            $stmt2->bind_param('s', $startMonthDate);
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            $monthlyPv = [];
            while ($row = $res2->fetch_assoc()) {
                $monthlyPv[] = [
                    'month' => $row['ym'],
                    'count' => isset($row['cnt']) ? (int)$row['cnt'] : 0
                ];
            }
            $stmt2->close();
            $stats['pageViews']['monthly'] = $monthlyPv;
        }

        // Monthly downloads: approximate using paid orders
        $stmt3 = $conn->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM orders WHERE created_at >= ? AND (payment_status = 'paid' OR status = 'paid') GROUP BY ym ORDER BY ym ASC");
        if ($stmt3) {
            $stmt3->bind_param('s', $startMonthDate);
            $stmt3->execute();
            $res3 = $stmt3->get_result();
            $monthlyDl = [];
            while ($row = $res3->fetch_assoc()) {
                $monthlyDl[] = [
                    'month' => $row['ym'],
                    'count' => isset($row['cnt']) ? (int)$row['cnt'] : 0
                ];
            }
            $stmt3->close();
            $stats['downloads']['monthly'] = $monthlyDl;
        }

        // If analytics tables exist and have data, prefer them for richer stats
        try {
            $hasSessions = $conn->query("SHOW TABLES LIKE 'analytics_sessions'");
            $hasPageViews = $conn->query("SHOW TABLES LIKE 'analytics_page_views'");
            $hasEvents = $conn->query("SHOW TABLES LIKE 'analytics_events'");
            if ($hasSessions && $hasSessions->num_rows > 0) {
                // Daily visitors from sessions
                $stmtA = $conn->prepare("SELECT DATE(start_time) AS day, COUNT(DISTINCT session_id) AS cnt FROM analytics_sessions WHERE start_time >= ? GROUP BY day ORDER BY day ASC");
                if ($stmtA) {
                    $stmtA->bind_param('s', $startDate);
                    $stmtA->execute();
                    $resA = $stmtA->get_result();
                    $daily = [];
                    while ($row = $resA->fetch_assoc()) {
                        $daily[] = ['day' => $row['day'], 'count' => (int)$row['cnt']];
                    }
                    $stmtA->close();
                    if (!empty($daily)) { $stats['visitors']['daily'] = $daily; }
                }
            }
            if ($hasPageViews && $hasPageViews->num_rows > 0) {
                // Monthly page views from analytics
                $stmtB = $conn->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM analytics_page_views WHERE created_at >= ? GROUP BY ym ORDER BY ym ASC");
                if ($stmtB) {
                    $stmtB->bind_param('s', $startMonthDate);
                    $stmtB->execute();
                    $resB = $stmtB->get_result();
                    $monthlyPv = [];
                    while ($row = $resB->fetch_assoc()) {
                        $monthlyPv[] = ['month' => $row['ym'], 'count' => (int)$row['cnt']];
                    }
                    $stmtB->close();
                    if (!empty($monthlyPv)) { $stats['pageViews']['monthly'] = $monthlyPv; }
                }
            }
            if ($hasEvents && $hasEvents->num_rows > 0) {
                // Monthly downloads from analytics events (download or conversion)
                $stmtC = $conn->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM analytics_events WHERE created_at >= ? AND event_type IN ('download','conversion') GROUP BY ym ORDER BY ym ASC");
                if ($stmtC) {
                    $stmtC->bind_param('s', $startMonthDate);
                    $stmtC->execute();
                    $resC = $stmtC->get_result();
                    $monthlyDl = [];
                    while ($row = $resC->fetch_assoc()) {
                        $monthlyDl[] = ['month' => $row['ym'], 'count' => (int)$row['cnt']];
                    }
                    $stmtC->close();
                    if (!empty($monthlyDl)) { $stats['downloads']['monthly'] = $monthlyDl; }
                }
            }
        } catch (Throwable $e) {
            // ignore analytics errors, keep fallbacks
            error_log('analytics override failed: ' . $e->getMessage());
        }

        json_ok(['success' => true, 'data' => $stats]);
    } catch (Throwable $e) {
        error_log('Error in getAdminPlatformStats: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to load platform stats']);
    }
}

// ---- Analytics Endpoints ----
function ensure_analytics_tables($conn) {
    if (!$conn) { return; }
    $conn->query("CREATE TABLE IF NOT EXISTS analytics_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL UNIQUE,
        uid VARCHAR(64) NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        referrer VARCHAR(512) NULL,
        page_count INT DEFAULT 0,
        start_time DATETIME NOT NULL,
        end_time DATETIME NULL,
        INDEX (uid),
        INDEX (start_time)
    )");

    $conn->query("CREATE TABLE IF NOT EXISTS analytics_page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        path VARCHAR(512) NOT NULL,
        title VARCHAR(512) NULL,
        created_at DATETIME NOT NULL,
        INDEX (session_id),
        INDEX (created_at)
    )");

    $conn->query("CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        data_json TEXT NULL,
        created_at DATETIME NOT NULL,
        INDEX (session_id),
        INDEX (event_type),
        INDEX (created_at)
    )");
}

function analytics_session_start_handler() {
    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }
    ensure_analytics_tables($db);

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $sid = isset($body['sessionId']) ? trim($body['sessionId']) : '';
    $uid = isset($body['uid']) ? trim($body['uid']) : null;
    if ($sid === '') { $sid = bin2hex(random_bytes(16)); }

    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $ref = $_SERVER['HTTP_REFERER'] ?? null;

    $stmt = $db->prepare("INSERT INTO analytics_sessions (session_id, uid, ip_address, user_agent, referrer, start_time) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE uid = VALUES(uid), ip_address = VALUES(ip_address), user_agent = VALUES(user_agent), referrer = VALUES(referrer)");
    if (!$stmt) { json_error('DB prepare failed', 500); }
    $stmt->bind_param('sssss', $sid, $uid, $ip, $ua, $ref);
    $stmt->execute();
    $stmt->close();

    json_ok(['success' => true, 'sessionId' => $sid]);
}

function analytics_pageview_handler() {
    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }
    ensure_analytics_tables($db);

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $sid = isset($body['sessionId']) ? trim($body['sessionId']) : '';
    $path = isset($body['path']) ? trim($body['path']) : '';
    $title = isset($body['title']) ? trim($body['title']) : null;
    if ($sid === '' || $path === '') { json_error('Missing sessionId or path', 400); }

    $stmt = $db->prepare("INSERT INTO analytics_page_views (session_id, path, title, created_at) VALUES (?, ?, ?, NOW())");
    if (!$stmt) { json_error('DB prepare failed', 500); }
    $stmt->bind_param('sss', $sid, $path, $title);
    $stmt->execute();
    $stmt->close();

    // increment page_count
    $db->query("UPDATE analytics_sessions SET page_count = page_count + 1 WHERE session_id = '" . $db->real_escape_string($sid) . "'");

    json_ok(['success' => true]);
}

function analytics_event_handler() {
    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }
    ensure_analytics_tables($db);

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $sid = isset($body['sessionId']) ? trim($body['sessionId']) : '';
    $type = isset($body['eventType']) ? trim($body['eventType']) : '';
    $data = isset($body['data']) ? json_encode($body['data']) : null;
    if ($sid === '' || $type === '') { json_error('Missing sessionId or eventType', 400); }

    $stmt = $db->prepare("INSERT INTO analytics_events (session_id, event_type, data_json, created_at) VALUES (?, ?, ?, NOW())");
    if (!$stmt) { json_error('DB prepare failed', 500); }
    $stmt->bind_param('sss', $sid, $type, $data);
    $stmt->execute();
    $stmt->close();

    json_ok(['success' => true]);
}

/**
 * Analytics: Get dashboard data with time range filtering
 * GET /analytics/dashboard?timeRange=30d
 * timeRange: 7d, 30d, 90d, 1y (default: 30d)
 */
function analytics_get_dashboard() {
    try {
        error_log('🔍 Analytics Dashboard: Request started');
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            error_log('❌ Analytics: DB connection failed - ' . ($conn ? $conn->connect_error : 'null'));
            // Return empty data instead of error to prevent dashboard crash
            json_ok([
                'success' => true,
                'data' => get_empty_analytics_data(),
                'error' => 'Database connection failed',
                'cache_status' => 'error'
            ]);
            return;
        }

        // Get time range from query parameter
        $timeRange = isset($_GET['timeRange']) ? trim((string)$_GET['timeRange']) : '30d';
        error_log('📊 Analytics: Time range = ' . $timeRange);
        
        // Calculate date range
        $endDate = new DateTime();
        $startDate = clone $endDate;
        
        switch ($timeRange) {
            case '7d':
                $startDate->modify('-7 days');
                break;
            case '90d':
                $startDate->modify('-90 days');
                break;
            case '1y':
                $startDate->modify('-1 year');
                break;
            case '30d':
            default:
                $timeRange = '30d';
                $startDate->modify('-30 days');
                break;
        }
        
        $startDateStr = $startDate->format('Y-m-d H:i:s');
        $endDateStr = $endDate->format('Y-m-d H:i:s');

        // Check if analytics_cache table exists
        $tableCheck = $conn->query("SHOW TABLES LIKE 'analytics_cache'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            error_log('⚠️  Analytics: analytics_cache table does not exist');
            json_ok([
                'success' => true,
                'data' => get_empty_analytics_data(),
                'cache_status' => 'table_not_found',
                'message' => 'Analytics cache table not found. Run cron job to initialize.'
            ]);
            return;
        }

        // Get cached analytics data - use flexible column selection
        $query = "SELECT * FROM analytics_cache WHERE id = 1 LIMIT 1";
        $result = $conn->query($query);
        
        if (!$result) {
            error_log('❌ Analytics: Query failed - ' . $conn->error);
            json_ok([
                'success' => true,
                'data' => get_empty_analytics_data(),
                'cache_status' => 'query_failed',
                'error' => $conn->error
            ]);
            return;
        }
        
        $cache = $result->fetch_assoc();
        error_log('✅ Analytics: Cache fetch ' . ($cache ? 'succeeded' : 'returned no data'));

        // Build analytics data from cache
        $analyticsData = get_empty_analytics_data();
        $analyticsData['timeRange'] = $timeRange;
        $analyticsData['startDate'] = $startDateStr;
        $analyticsData['endDate'] = $endDateStr;
        $analyticsData['cache_status'] = $cache ? 'fresh' : 'not_found';

        // If cache exists, parse and use it
        if ($cache) {
            $columnsFound = [];
            
            // Parse each JSON column if it exists
            $jsonColumns = [
                'order_stats', 'gadget_stats', 'revenue_stats', 'visitor_stats',
                'conversion_stats', 'user_stats', 'subscription_stats',
                'variant_stats', 'installment_stats', 'tradein_stats',
                'popular_products', 'performance_stats'
            ];
            
            foreach ($jsonColumns as $col) {
                if (isset($cache[$col]) && !empty($cache[$col])) {
                    $columnsFound[] = $col;
                    $parsed = json_decode($cache[$col], true);
                    if (is_array($parsed)) {
                        // Map columns to response keys
                        if ($col === 'user_stats') {
                            $analyticsData['user_activity'] = $parsed;
                        } else {
                            $analyticsData[$col] = $parsed;
                        }
                    }
                }
            }
            
            $analyticsData['last_updated'] = $cache['last_updated'] ?? date('Y-m-d H:i:s');
            $analyticsData['columns_loaded'] = $columnsFound;
            
            error_log('📈 Analytics: Loaded ' . count($columnsFound) . ' data columns: ' . implode(', ', $columnsFound));
        }

        json_ok([
            'success' => true,
            'data' => $analyticsData
        ]);

    } catch (Throwable $e) {
        error_log('❌ CRITICAL Error in analytics_get_dashboard: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        // Return empty data structure instead of error to prevent dashboard crash
        json_ok([
            'success' => true,
            'data' => get_empty_analytics_data(),
            'cache_status' => 'exception',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Helper function to return empty analytics data structure
 */
function get_empty_analytics_data() {
    return [
        'timeRange' => '30d',
        'startDate' => date('Y-m-d H:i:s', strtotime('-30 days')),
        'endDate' => date('Y-m-d H:i:s'),
        'cache_status' => 'empty',
        'order_stats' => [
            'total_orders' => 0,
            'pending_orders' => 0,
            'completed_orders' => 0,
            'dispatched_orders' => 0,
            'cancelled_orders' => 0,
            'orders_today' => 0,
            'orders_this_week' => 0,
            'orders_this_month' => 0
        ],
        'revenue_stats' => [
            'mwk' => [
                'total' => 0,
                'today' => 0,
                'this_week' => 0,
                'this_month' => 0,
                'avg_order_value' => 0
            ],
            'gbp' => [
                'total' => 0,
                'today' => 0,
                'this_week' => 0,
                'this_month' => 0,
                'avg_order_value' => 0
            ]
        ],
        'visitor_stats' => [
            'total_unique_visitors' => 0,
            'visitors_today' => 0,
            'visitors_this_week' => 0,
            'visitors_this_month' => 0,
            'total_events' => 0,
            'page_views_month' => 0,
            'product_views_month' => 0,
            'add_to_cart_month' => 0,
            'checkout_start_month' => 0
        ],
        'conversion_stats' => [
            'total_page_viewers' => 0,
            'total_product_viewers' => 0,
            'cart_users' => 0,
            'checkout_users' => 0,
            'completed_orders' => 0,
            'view_to_product_rate' => 0,
            'product_to_cart_rate' => 0,
            'cart_to_checkout_rate' => 0,
            'checkout_to_order_rate' => 0,
            'overall_conversion_rate' => 0
        ],
        'gadget_stats' => [
            'total_gadgets' => 0,
            'active_gadgets' => 0,
            'in_stock_gadgets' => 0,
            'low_stock_gadgets' => 0,
            'out_of_stock_gadgets' => 0,
            'total_stock_units' => 0,
            'smartphones_count' => 0,
            'laptops_count' => 0,
            'tablets_count' => 0,
            'accessories_count' => 0
        ],
        'user_activity' => [
            'total_users' => 0,
            'admin_users' => 0,
            'regular_users' => 0,
            'users_registered_today' => 0,
            'users_registered_this_week' => 0,
            'users_registered_this_month' => 0,
            'subscribed_users' => 0
        ],
        'subscription_stats' => [
            'total_subscriptions' => 0,
            'active_subscriptions' => 0,
            'pending_subscriptions' => 0,
            'suspended_subscriptions' => 0,
            'cancelled_subscriptions' => 0,
            'plus_subscribers' => 0,
            'premium_subscribers' => 0,
            'square_subscriptions' => 0,
            'paychangu_subscriptions' => 0,
            'new_subscriptions_today' => 0,
            'new_subscriptions_this_week' => 0
        ],
        'variant_stats' => [
            'total_variants' => 0,
            'active_variants' => 0,
            'low_stock_variants' => 0,
            'out_of_stock_variants' => 0
        ],
        'installment_stats' => [
            'total_installment_orders' => 0,
            'pending_installments' => 0,
            'completed_installments' => 0,
            'total_installment_value_mwk' => 0,
            'total_installment_value_gbp' => 0
        ],
        'tradein_stats' => [
            'total_tradeins' => 0,
            'pending_tradeins' => 0,
            'approved_tradeins' => 0,
            'rejected_tradeins' => 0,
            'completed_tradeins' => 0,
            'total_tradein_value' => 0,
            'tradeins_today' => 0
        ],
        'popular_products' => [],
        'performance_stats' => [
            'avg_order_processing_time' => 0,
            'avg_delivery_time' => 0,
            'pending_orders_count' => 0,
            'low_stock_alerts' => 0,
            'out_of_stock_alerts' => 0
        ],
        'last_updated' => null
    ];
}

/**
 * Aggregate analytics data from raw tables into cache table
 * Called by cron job to refresh dashboard data
 * GET /analytics/cron/aggregate?token=CRON_TOKEN
 */
function analytics_aggregate_to_cache() {
    try {
        // Verify cron token
        $token = $_GET['token'] ?? $_POST['token'] ?? null;
        $validToken = getenv('CRON_SECRET_TOKEN') ?: 'cron-secret-change-this';
        
        if ($token && $token !== $validToken) {
            http_response_code(401);
            json_error('Unauthorized cron access', 401);
            return;
        }
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if (!$conn || $conn->connect_errno) {
            json_error('Database connection failed', 500);
        }
        
        error_log('📊 Analytics: Starting cache aggregation');
        
        // Ensure cache table exists
        $conn->query("CREATE TABLE IF NOT EXISTS analytics_cache (
            id INT PRIMARY KEY DEFAULT 1,
            order_stats JSON,
            revenue_stats JSON,
            visitor_stats JSON,
            gadget_stats JSON,
            subscription_stats JSON,
            user_stats JSON,
            conversion_stats JSON,
            installment_stats JSON,
            variant_stats JSON,
            tradein_stats JSON,
            popular_products JSON,
            performance_stats JSON,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY id (id)
        )");
        
        // ===== ORDER STATS =====
        $orderStats = [
            'total_orders' => 0,
            'pending_orders' => 0,
            'completed_orders' => 0,
            'dispatched_orders' => 0,
            'cancelled_orders' => 0,
            'orders_today' => 0,
            'orders_this_week' => 0,
            'orders_this_month' => 0
        ];
        
        $stmt = $conn->prepare("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week,
            SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month
            FROM orders WHERE is_active = 1");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $orderStats = [
                    'total_orders' => (int)($result['total'] ?? 0),
                    'pending_orders' => (int)($result['pending'] ?? 0),
                    'completed_orders' => (int)($result['completed'] ?? 0),
                    'dispatched_orders' => (int)($result['dispatched'] ?? 0),
                    'cancelled_orders' => (int)($result['cancelled'] ?? 0),
                    'orders_today' => (int)($result['today'] ?? 0),
                    'orders_this_week' => (int)($result['this_week'] ?? 0),
                    'orders_this_month' => (int)($result['this_month'] ?? 0)
                ];
            }
            $stmt->close();
        }
        
        // ===== REVENUE STATS =====
        $revenueStats = [
            'mwk' => ['total' => 0, 'today' => 0, 'this_week' => 0, 'this_month' => 0, 'avg_order_value' => 0],
            'gbp' => ['total' => 0, 'today' => 0, 'this_week' => 0, 'this_month' => 0, 'avg_order_value' => 0]
        ];
        
        // MWK Revenue
        $stmt = $conn->prepare("SELECT 
            SUM(CASE WHEN currency = 'MWK' AND payment_status = 'paid' THEN total_amount ELSE 0 END) as mwk_total,
            SUM(CASE WHEN currency = 'MWK' AND payment_status = 'paid' AND DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as mwk_today,
            SUM(CASE WHEN currency = 'MWK' AND payment_status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as mwk_week,
            SUM(CASE WHEN currency = 'MWK' AND payment_status = 'paid' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total_amount ELSE 0 END) as mwk_month,
            COUNT(CASE WHEN currency = 'MWK' AND payment_status = 'paid' THEN 1 END) as mwk_count
            FROM orders WHERE is_active = 1");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $mwkTotal = (float)($result['mwk_total'] ?? 0);
                $mwkCount = (int)($result['mwk_count'] ?? 1);
                $revenueStats['mwk'] = [
                    'total' => round($mwkTotal, 2),
                    'today' => round((float)($result['mwk_today'] ?? 0), 2),
                    'this_week' => round((float)($result['mwk_week'] ?? 0), 2),
                    'this_month' => round((float)($result['mwk_month'] ?? 0), 2),
                    'avg_order_value' => $mwkCount > 0 ? round($mwkTotal / $mwkCount, 2) : 0
                ];
            }
            $stmt->close();
        }
        
        // GBP Revenue
        $stmt = $conn->prepare("SELECT 
            SUM(CASE WHEN currency = 'GBP' AND payment_status = 'paid' THEN total_amount ELSE 0 END) as gbp_total,
            SUM(CASE WHEN currency = 'GBP' AND payment_status = 'paid' AND DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as gbp_today,
            SUM(CASE WHEN currency = 'GBP' AND payment_status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as gbp_week,
            SUM(CASE WHEN currency = 'GBP' AND payment_status = 'paid' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total_amount ELSE 0 END) as gbp_month,
            COUNT(CASE WHEN currency = 'GBP' AND payment_status = 'paid' THEN 1 END) as gbp_count
            FROM orders WHERE is_active = 1");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $gbpTotal = (float)($result['gbp_total'] ?? 0);
                $gbpCount = (int)($result['gbp_count'] ?? 1);
                $revenueStats['gbp'] = [
                    'total' => round($gbpTotal, 2),
                    'today' => round((float)($result['gbp_today'] ?? 0), 2),
                    'this_week' => round((float)($result['gbp_week'] ?? 0), 2),
                    'this_month' => round((float)($result['gbp_month'] ?? 0), 2),
                    'avg_order_value' => $gbpCount > 0 ? round($gbpTotal / $gbpCount, 2) : 0
                ];
            }
            $stmt->close();
        }
        
        // ===== VISITOR STATS (from analytics_page_views table) =====
        $visitorStats = [
            'total_unique_visitors' => 0,
            'visitors_today' => 0,
            'visitors_this_week' => 0,
            'visitors_this_month' => 0,
            'total_events' => 0,
            'page_views_month' => 0,
            'product_views_month' => 0,
            'add_to_cart_month' => 0,
            'checkout_start_month' => 0
        ];
        
        // Check if analytics tables exist
        $hasAnalytics = $conn->query("SHOW TABLES LIKE 'analytics_page_views'");
        if ($hasAnalytics && $hasAnalytics->num_rows > 0) {
            // Total unique visitors
            $stmt = $conn->prepare("SELECT COUNT(DISTINCT session_id) as cnt FROM analytics_page_views");
            if ($stmt) {
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                $visitorStats['total_unique_visitors'] = (int)($result['cnt'] ?? 0);
                $stmt->close();
            }
            
            // Page views by period
            $stmt = $conn->prepare("SELECT 
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week,
                SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as month,
                COUNT(*) as total
                FROM analytics_page_views");
            if ($stmt) {
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                $visitorStats['visitors_today'] = (int)($result['today'] ?? 0);
                $visitorStats['visitors_this_week'] = (int)($result['week'] ?? 0);
                $visitorStats['visitors_this_month'] = (int)($result['month'] ?? 0);
                $visitorStats['total_events'] = (int)($result['total'] ?? 0);
                $visitorStats['page_views_month'] = (int)($result['month'] ?? 0);
                $stmt->close();
            }
        }
        
        // ===== GADGET STATS =====
        $gadgetStats = [
            'total_gadgets' => 0,
            'active_gadgets' => 0,
            'low_stock_count' => 0,
            'out_of_stock_count' => 0,
            'total_variants' => 0,
            'avg_price_mwk' => 0,
            'avg_price_gbp' => 0,
            'most_popular_category' => null
        ];
        
        $stmt = $conn->prepare("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
            AVG(price) as avg_price_mwk,
            AVG(price_gbp) as avg_price_gbp
            FROM gadgets");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $gadgetStats = [
                    'total_gadgets' => (int)($result['total'] ?? 0),
                    'active_gadgets' => (int)($result['active'] ?? 0),
                    'low_stock_count' => (int)($result['low_stock'] ?? 0),
                    'out_of_stock_count' => (int)($result['out_of_stock'] ?? 0),
                    'avg_price_mwk' => round((float)($result['avg_price_mwk'] ?? 0), 2),
                    'avg_price_gbp' => round((float)($result['avg_price_gbp'] ?? 0), 2),
                    'most_popular_category' => null
                ];
            }
            $stmt->close();
        }
        
        // Most popular category
        $stmt = $conn->prepare("SELECT category, COUNT(*) as cnt FROM gadgets WHERE is_active = 1 GROUP BY category ORDER BY cnt DESC LIMIT 1");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $gadgetStats['most_popular_category'] = $result['category'] ?? null;
            }
            $stmt->close();
        }
        
        // Variant count
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM gadget_variants WHERE is_active = 1");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $gadgetStats['total_variants'] = (int)($result['total'] ?? 0);
            $stmt->close();
        }
        
        // ===== SUBSCRIPTION STATS =====
        $subscriptionStats = [
            'active_subscriptions' => 0,
            'plus_subscribers' => 0,
            'premium_subscribers' => 0,
            'pending_subscriptions' => 0,
            'cancelled_subscriptions' => 0,
            'total_mrr_gbp' => 0,
            'total_mrr_mwk' => 0
        ];
        
        $stmt = $conn->prepare("SELECT 
            SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' AND subscription_tier = 'plus' THEN 1 ELSE 0 END) as plus_count,
            SUM(CASE WHEN subscription_active = 1 AND subscription_status = 'ACTIVE' AND subscription_tier = 'premium' THEN 1 ELSE 0 END) as premium_count,
            SUM(CASE WHEN subscription_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN subscription_status = 'CANCELED' THEN 1 ELSE 0 END) as cancelled
            FROM users WHERE user_role = 'buyer'");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $active = (int)($result['active'] ?? 0);
                $plus = (int)($result['plus_count'] ?? 0);
                $premium = (int)($result['premium_count'] ?? 0);
                
                $subscriptionStats = [
                    'active_subscriptions' => $active,
                    'plus_subscribers' => $plus,
                    'premium_subscribers' => $premium,
                    'pending_subscriptions' => (int)($result['pending'] ?? 0),
                    'cancelled_subscriptions' => (int)($result['cancelled'] ?? 0),
                    'total_mrr_gbp' => round(($plus * 6.00) + ($premium * 9.99), 2),
                    'total_mrr_mwk' => round(($plus * 10000) + ($premium * 16500), 2)
                ];
            }
            $stmt->close();
        }
        
        // ===== INSTALLMENT STATS =====
        $installmentStats = [
            'total_installment_orders' => 0,
            'pending_installments' => 0,
            'completed_installments' => 0,
            'total_installment_value_mwk' => 0,
            'total_installment_value_gbp' => 0
        ];
        
        $stmt = $conn->prepare("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'ongoing' AND total_amount > 0 THEN total_amount ELSE 0 END) as value
            FROM installment_plans");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $installmentStats = [
                    'total_installment_orders' => (int)($result['total'] ?? 0),
                    'pending_installments' => (int)($result['pending'] ?? 0),
                    'completed_installments' => (int)($result['completed'] ?? 0),
                    'total_installment_value_mwk' => round((float)($result['value'] ?? 0), 2),
                    'total_installment_value_gbp' => 0 // Would need currency tracking
                ];
            }
            $stmt->close();
        }
        
        // ===== USER STATS =====
        $userStats = [
            'total_users' => 0,
            'active_users' => 0,
            'google_oauth_users' => 0,
            'sellers' => 0,
            'users_today' => 0,
            'users_this_month' => 0
        ];
        
        $stmt = $conn->prepare("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN signup_method = 'google' OR google_uid IS NOT NULL THEN 1 ELSE 0 END) as google,
            SUM(CASE WHEN user_role = 'seller' THEN 1 ELSE 0 END) as sellers,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month
            FROM users");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $userStats = [
                    'total_users' => (int)($result['total'] ?? 0),
                    'active_users' => (int)($result['active'] ?? 0),
                    'google_oauth_users' => (int)($result['google'] ?? 0),
                    'sellers' => (int)($result['sellers'] ?? 0),
                    'users_today' => (int)($result['today'] ?? 0),
                    'users_this_month' => (int)($result['this_month'] ?? 0)
                ];
            }
            $stmt->close();
        }
        
        // ===== Store in cache =====
        $insertSql = "INSERT INTO analytics_cache (id, order_stats, revenue_stats, visitor_stats, gadget_stats, subscription_stats, user_stats, installment_stats)
                      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE 
                      order_stats = VALUES(order_stats),
                      revenue_stats = VALUES(revenue_stats),
                      visitor_stats = VALUES(visitor_stats),
                      gadget_stats = VALUES(gadget_stats),
                      subscription_stats = VALUES(subscription_stats),
                      user_stats = VALUES(user_stats),
                      installment_stats = VALUES(installment_stats),
                      last_updated = NOW()";
        
        $stmt = $conn->prepare($insertSql);
        if ($stmt) {
            $orderStatsJson = json_encode($orderStats);
            $revenueStatsJson = json_encode($revenueStats);
            $visitorStatsJson = json_encode($visitorStats);
            $gadgetStatsJson = json_encode($gadgetStats);
            $subscriptionStatsJson = json_encode($subscriptionStats);
            $userStatsJson = json_encode($userStats);
            $installmentStatsJson = json_encode($installmentStats);
            
            $stmt->bind_param('sssssss', 
                $orderStatsJson, 
                $revenueStatsJson, 
                $visitorStatsJson, 
                $gadgetStatsJson, 
                $subscriptionStatsJson, 
                $userStatsJson, 
                $installmentStatsJson
            );
            $stmt->execute();
            $stmt->close();
        }
        
        error_log('✅ Analytics: Cache aggregation completed');
        error_log('📊 Analytics summary: ' . count($orderStats) . ' order stats, ' . count($visitorStats) . ' visitor stats, ' . count($subscriptionStats) . ' subscription stats');
        
        json_ok([
            'success' => true,
            'message' => 'Analytics cache aggregated successfully',
            'stats' => [
                'orders' => $orderStats['total_orders'],
                'visitors_month' => $visitorStats['page_views_month'],
                'revenue_gbp' => $revenueStats['gbp']['total'],
                'active_subscriptions' => $subscriptionStats['active_subscriptions']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Throwable $e) {
        error_log('❌ Analytics aggregation failed: ' . $e->getMessage());
        json_error('Analytics aggregation failed: ' . $e->getMessage(), 500);
    }
}

// ---- Password Reset via OTP (PHPMailer) ----
function auth_password_reset_request() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Invalid email address', 422);
    }

    $now = time();
    $resendWindowSeconds = 30;
    $ttlSeconds = 600; // 10 minutes

    $userRow = null;
    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        if ($db && !$db->connect_errno) {
            $stmt = $db->prepare('SELECT id, uid, email, signup_method, is_active FROM users WHERE email = ? LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $userRow = $result->fetch_assoc() ?: null;
            $stmt && $stmt->close();

            // Throttle resend if a recent unused request exists
            $stmt = $db->prepare('SELECT id, created_at, expires_at, used FROM password_resets WHERE email = ? AND used = 0 ORDER BY created_at DESC LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                $createdAt = strtotime($row['created_at'] ?? '');
                if ($createdAt && ($now - $createdAt) < $resendWindowSeconds) {
                    $retryAfter = $resendWindowSeconds - ($now - $createdAt);
                    json_error('Please wait before requesting a new code', 429, ['retryAfter' => $retryAfter]);
                }
            }
            $stmt && $stmt->close();
        }
    } catch (Throwable $e) {
        error_log('Password reset request DB error: ' . $e->getMessage());
    }

    // If user exists but is a Google signup, guide them to Google sign-in
    if ($userRow) {
        $method = strtolower($userRow['signup_method'] ?? '');
        if ($method === 'google' || $method === 'google_onboarding') {
            json_error('This account uses Google sign-in. Please use "Sign in with Google".', 400, ['errorType' => 'wrong_signup_method']);
        }
        if (isset($userRow['is_active']) && (int)$userRow['is_active'] !== 1) {
            json_error('Account inactive', 403);
        }
    }

    // Generate 6-digit OTP and store hashed token
    $otp = str_pad(strval(random_int(0, 999999)), 6, '0', STR_PAD_LEFT);
    $tokenHash = hash('sha256', $otp);
    $expiresAt = date('Y-m-d H:i:s', $now + $ttlSeconds);

    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        if ($db && !$db->connect_errno) {
            $userId = $userRow ? (int)$userRow['id'] : null;
            if ($userId) {
                $stmt = $db->prepare('INSERT INTO password_resets (user_id, email, token, expires_at, used) VALUES (?, ?, ?, ?, 0)');
                $stmt->bind_param('isss', $userId, $email, $tokenHash, $expiresAt);
            } else {
                // Allow request creation even if user is unknown (to avoid enumeration); set user_id NULL
                $stmt = $db->prepare('INSERT INTO password_resets (user_id, email, token, expires_at, used) VALUES (NULL, ?, ?, ?, 0)');
                $stmt->bind_param('sss', $email, $tokenHash, $expiresAt);
            }
            $stmt->execute();
            $stmt && $stmt->close();
        }
    } catch (Throwable $e) {
        error_log('Password reset create DB error: ' . $e->getMessage());
    }

    // Send email via PHPMailer
    try {
        $mail = getMailer();
        if (!$mail) {
            json_error('PHPMailer not installed. Please upload vendor/ or run composer install.', 500);
        }
        $mail->clearAllRecipients();
        $mail->addAddress($email);
        $mail->Subject = 'Your Xtrapush password reset code';

        // Simple, clean HTML email
        $mail->Body = '<div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px;color:#0b132a">'
            . '<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(11,19,42,0.08);overflow:hidden">'
            . '<div style="padding:24px 24px 12px;">'
            . '<h2 style="margin:0;font-weight:700;color:#0b132a">Reset your password</h2>'
            . '<p style="margin:12px 0 0;color:#334155">Use the 6-digit code below to verify your identity. This code expires in 10 minutes.</p>'
            . '</div>'
            . '<div style="padding:12px 24px 24px;text-align:center">'
            . '<div style="display:inline-flex;gap:10px;letter-spacing:12px">'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[0]) . '</span>'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[1]) . '</span>'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[2]) . '</span>'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[3]) . '</span>'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[4]) . '</span>'
            . '<span style="font-size:24px;font-weight:700;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' . htmlspecialchars($otp[5]) . '</span>'
            . '</div>'
            . '<p style="margin:16px 0 0;color:#64748b">If you didn\'t request this, you can safely ignore this email.</p>'
            . '</div>'
            . '</div>'
            . '<div style="max-width:520px;margin:12px auto 0;text-align:center;color:#64748b">Xtrapush Support</div>'
            . '</div>';
        $mail->AltBody = 'Your 6-digit code is ' . $otp . "\nIt expires in 10 minutes.";
        $mail->send();
    } catch (Throwable $e) {
        error_log('PHPMailer OTP send error: ' . $e->getMessage());
        json_error('Failed to send reset code', 500, ['details' => $e->getMessage()]);
    }

    // In development (localhost origin), expose the OTP for easier testing
    $origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
    $isLocal = $origin && preg_match('#(localhost|127\.0\.0\.1)#', $origin);
    $payload = ['success' => true, 'message' => 'If an eligible account exists, a code has been sent to your email.', 'resendDelay' => $resendWindowSeconds, 'ttl' => $ttlSeconds];
    if ($isLocal) { $payload['debugToken'] = $otp; }
    json_ok($payload);
}

function auth_password_verify_otp() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $token = trim($input['token'] ?? '');

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { json_error('Invalid email address', 422); }
    if (!$token || !preg_match('/^\d{6}$/', $token)) { json_error('Invalid code format. Enter 6 digits.', 422); }

    $now = time();
    $hash = hash('sha256', $token);

    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        if ($db && !$db->connect_errno) {
            $stmt = $db->prepare('SELECT id, token, expires_at, used FROM password_resets WHERE email = ? AND used = 0 ORDER BY created_at DESC LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            $stmt && $stmt->close();

            if (!$row) { json_error('No active reset request for this email', 404, ['errorType' => 'no_active_reset']); }
            $expiresTs = strtotime($row['expires_at'] ?? '');
            if (!$expiresTs || $expiresTs < $now) { json_error('Code has expired. Please request a new one.', 400, ['errorType' => 'expired_otp']); }
            $stored = $row['token'] ?? '';
            if (!hash_equals($stored, $hash)) { json_error('Invalid code. Please check and try again.', 400, ['errorType' => 'invalid_otp']); }

            json_ok(['success' => true, 'otpVerified' => true]);
        }
    } catch (Throwable $e) {
        error_log('Password verify OTP DB error: ' . $e->getMessage());
        json_error('Server error verifying code', 500);
    }
}

function auth_password_reset_confirm() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $token = trim($input['token'] ?? '');
    $newPassword = $input['newPassword'] ?? '';

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { json_error('Invalid email address', 422); }
    if (!$token || !preg_match('/^\d{6}$/', $token)) { json_error('Invalid code format. Enter 6 digits.', 422); }
    if (!$newPassword || strlen($newPassword) < 6) { json_error('Password too weak', 422, ['field' => 'newPassword']); }

    $now = time();
    $hash = hash('sha256', $token);

    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        if ($db && !$db->connect_errno) {
            // Validate user eligibility (non-Google, active)
            $stmt = $db->prepare('SELECT id, signup_method, is_active FROM users WHERE email = ? LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $res = $stmt->get_result();
            $user = $res->fetch_assoc();
            $stmt && $stmt->close();
            if (!$user) { json_error('No account found with this email address', 404, ['field' => 'email']); }
            $method = strtolower($user['signup_method'] ?? '');
            if ($method !== 'email_password') { json_error('This account uses Google sign-in. Please use Google login.', 400, ['errorType' => 'wrong_signup_method']); }
            if (isset($user['is_active']) && (int)$user['is_active'] !== 1) { json_error('Account inactive', 403); }

            // Verify active reset token
            $stmt = $db->prepare('SELECT id, token, expires_at, used FROM password_resets WHERE email = ? AND used = 0 ORDER BY created_at DESC LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            $stmt && $stmt->close();
            if (!$row) { json_error('No active reset request for this email', 404, ['errorType' => 'no_active_reset']); }
            $expiresTs = strtotime($row['expires_at'] ?? '');
            if (!$expiresTs || $expiresTs < $now) { json_error('Code has expired. Please request a new one.', 400, ['errorType' => 'expired_otp']); }
            $stored = $row['token'] ?? '';
            if (!hash_equals($stored, $hash)) { json_error('Invalid code. Please check and try again.', 400, ['errorType' => 'invalid_otp']); }

            // Update password
            $passwordHash = function_exists('password_hash') ? password_hash($newPassword, PASSWORD_BCRYPT) : $newPassword;
            $stmt = $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
            $uid = (int)$user['id'];
            $stmt->bind_param('si', $passwordHash, $uid);
            $stmt->execute();
            $stmt && $stmt->close();

            // Mark reset as used
            $stmt = $db->prepare('UPDATE password_resets SET used = 1, used_at = NOW() WHERE id = ?');
            $resetId = (int)$row['id'];
            $stmt->bind_param('i', $resetId);
            $stmt->execute();
            $stmt && $stmt->close();

            json_ok(['success' => true, 'message' => 'Password reset successfully']);
        }
    } catch (Throwable $e) {
        error_log('Password reset confirm DB error: ' . $e->getMessage());
        json_error('Server error resetting password', 500);
    }
}

function user_profile_get($uid) {
    $uid = trim($uid);
    if (!$uid) { json_error('UID required', 400); }
    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }

    $stmt = $db->prepare("SELECT id, uid, email, full_name, user_role, town, address, postcode, phone, dob, photo_url, is_active, email_verified, seller_verified, created_at FROM users WHERE (uid = ? OR google_uid = ?) LIMIT 1");
    $stmt->bind_param('ss', $uid, $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    if (!$row) { json_error('User not found', 404); }

    json_ok([
        'success' => true,
        'user' => [
            'uid' => $row['uid'],
            'id' => (int)$row['id'],
            'email' => $row['email'],
            'fullName' => $row['full_name'],
            'userRole' => $row['user_role'] ?? 'buyer',
            'photoURL' => $row['photo_url'] ?? null,
            'phone' => $row['phone'] ?? null,
            'address' => $row['address'] ?? null,
            'town' => $row['town'] ?? null,
            'postcode' => $row['postcode'] ?? null,
            'dob' => $row['dob'] ?? null,
            'emailVerified' => isset($row['email_verified']) ? (bool)$row['email_verified'] : null,
            'sellerVerified' => isset($row['seller_verified']) ? (bool)$row['seller_verified'] : null,
            'createdAt' => $row['created_at'] ?? null
        ]
    ]);
}

function user_profile_update($uid) {
    $uid = trim($uid);
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$uid) { json_error('UID required', 400); }

    $db = DatabaseConnection::getInstance()->getConnection();
    if (!$db || $db->connect_errno) { json_error('Database connection failed', 500); }

    $fullName = $input['fullName'] ?? null;
    $photoURL = $input['photoURL'] ?? null;
    $phone = $input['phone'] ?? null;
    $address = $input['address'] ?? null;
    $dob = $input['dob'] ?? null;

    ensure_users_columns($db);

    $town = $input['town'] ?? null;
    $postcode = $input['postcode'] ?? null;

    // Validate age if DOB is provided
    if ($dob) {
        $birthDate = new DateTime($dob);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;
        if ($age < 18) {
            json_error('User must be at least 18 years old', 400);
        }
    }

    $stmt = $db->prepare("UPDATE users SET full_name = COALESCE(?, full_name), photo_url = COALESCE(?, photo_url), phone = COALESCE(?, phone), address = COALESCE(?, address), town = COALESCE(?, town), postcode = COALESCE(?, postcode), dob = COALESCE(?, dob) WHERE (uid = ? OR google_uid = ?)");
    $stmt->bind_param('sssssssss', $fullName, $photoURL, $phone, $address, $town, $postcode, $dob, $uid, $uid);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected === 0) { json_error('No changes or user not found', 404); }

    // Return updated profile
    $stmt = $db->prepare("SELECT id, uid, email, full_name, user_role, town, address, postcode, phone, dob, photo_url, is_active, email_verified, seller_verified, created_at FROM users WHERE (uid = ? OR google_uid = ?) LIMIT 1");
    $stmt->bind_param('ss', $uid, $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    if (!$row) { json_error('User not found', 404); }

    json_ok([
        'success' => true,
        'user' => [
            'uid' => $row['uid'],
            'id' => (int)$row['id'],
            'email' => $row['email'],
            'fullName' => $row['full_name'],
            'userRole' => $row['user_role'] ?? 'buyer',
            'photoURL' => $row['photo_url'] ?? null,
            'phone' => $row['phone'] ?? null,
            'address' => $row['address'] ?? null,
            'town' => $row['town'] ?? null,
            'postcode' => $row['postcode'] ?? null,
            'dob' => $row['dob'] ?? null,
            'emailVerified' => isset($row['email_verified']) ? (bool)$row['email_verified'] : null,
            'sellerVerified' => isset($row['seller_verified']) ? (bool)$row['seller_verified'] : null,
            'createdAt' => $row['created_at'] ?? null
        ]
    ]);
}

try {
    if ($method === 'GET' && ($path === '/' || $path === '/health')) {
        json_ok(['status' => 'OK', 'message' => 'Sparkle Pro API running']);
        exit;
    }

    // Payments - PayChangu (Malawi - MWK)
    if ($method === 'POST' && $path === '/payments/create-checkout-session') { create_checkout_session(); exit; }
    if ($method === 'GET' && preg_match('#^/payments/paychangu/verify/(.+)$#', $path, $m)) { verify_paychangu($m[1]); exit; }
    if ($method === 'GET' && $path === '/payments/config') { payments_config(); exit; }
    if ($method === 'POST' && $path === '/payments/paychangu/webhook') { payments_paychangu_webhook(); exit; }
    if ($method === 'POST' && $path === '/payments/notify-success') { payments_notify_success(); exit; }
    
    // Payments - Square (International - GBP)
    if ($method === 'POST' && $path === '/payments/square/create-checkout-session') { square_create_checkout_session(); exit; }
    if ($method === 'GET' && preg_match('#^/payments/square/verify/(.+)$#', $path, $m)) { square_verify_payment($m[1]); exit; }
    if ($method === 'GET' && $path === '/payments/square/config') { square_get_config(); exit; }
    if ($method === 'POST' && $path === '/payments/square/webhook') { square_webhook_handler(); exit; }
    if ($method === 'POST' && $path === '/payments/hook') { square_webhook_handler(); exit; } // Webhook URL alias
    
    // Square Subscriptions
    if ($method === 'POST' && $path === '/subscriptions/create') { square_create_subscription(); exit; }
    if ($method === 'GET' && $path === '/subscriptions/status') { square_get_subscription_status(); exit; }
    if ($method === 'POST' && $path === '/subscriptions/cancel') { square_cancel_subscription(); exit; }
    if ($method === 'POST' && $path === '/subscriptions/renew-paychangu') { paychangu_create_renewal_checkout(); exit; }
    if ($method === 'POST' && $path === '/subscriptions/process-renewals') { process_subscription_renewals(); exit; }
    if ($method === 'GET' && $path === '/subscriptions/process-renewals') { process_subscription_renewals(); exit; }
    
    // Subscription Device Linking
    if ($method === 'POST' && $path === '/subscriptions/link-device') { subscription_link_device(); exit; }
    if ($method === 'GET' && $path === '/subscriptions/linked-device') { subscription_get_linked_device(); exit; }
    if ($method === 'POST' && $path === '/subscriptions/unlink-device') { subscription_unlink_device(); exit; }
    if ($method === 'GET' && $path === '/subscriptions/recent-devices') { subscription_get_recent_devices(); exit; }
    
    // Installments: plan and registries
    if ($method === 'GET' && $path === '/installments/plan') { installments_get_plan(); exit; }
    // Generate receipt for an installment order
    if ($method === 'GET' && preg_match('#^/installments/(\d+)/receipt$#', $path, $m)) { installments_generate_receipt($m[1]); exit; }
    // Schedule reminder email
    if ($method === 'POST' && $path === '/installments/reminder') { installments_schedule_reminder(); exit; }
    // List receipts for a user
    if ($method === 'GET' && $path === '/installments/receipts') { installments_list_receipts(); exit; }
    // Admin: cancel installment
    if ($method === 'POST' && $path === '/admin/installments/cancel') { admin_cancel_installment(); exit; }

    // Auth
    if ($method === 'POST' && $path === '/auth/login') { auth_login(); exit; }
    if ($method === 'POST' && $path === '/auth/register') { auth_register(); exit; }
    if ($method === 'POST' && $path === '/auth/link-google') { auth_link_google(); exit; }
    // Password reset via OTP
    if ($method === 'POST' && $path === '/auth/password/reset-request') { auth_password_reset_request(); exit; }
    if ($method === 'POST' && $path === '/auth/password/verify-otp') { auth_password_verify_otp(); exit; }
    if ($method === 'POST' && $path === '/auth/password/reset-confirm') { auth_password_reset_confirm(); exit; }

    // Analytics
    if ($method === 'POST' && $path === '/analytics/session/start') { analytics_session_start_handler(); exit; }
    if ($method === 'POST' && $path === '/analytics/pageview') { analytics_pageview_handler(); exit; }
    if ($method === 'POST' && $path === '/analytics/event') { analytics_event_handler(); exit; }
    if ($method === 'GET' && $path === '/analytics/cron/aggregate') { analytics_aggregate_to_cache(); exit; }

    // User profile
    if ($method === 'GET' && preg_match('#^/user/profile/(.+)$#', $path, $m)) { user_profile_get($m[1]); exit; }
    if ($method === 'PUT' && preg_match('#^/user/profile/(.+)$#', $path, $m)) { user_profile_update($m[1]); exit; }

    // Gadgets
    if ($method === 'GET' && $path === '/gadgets') { gadgets_list(); exit; }
    if ($method === 'GET' && preg_match('#^/gadgets/(\d+)$#', $path, $m)) { gadgets_detail($m[1]); exit; }
    if ($method === 'GET' && $path === '/gadgets/categories') { gadgets_categories(); exit; }
    if ($method === 'GET' && $path === '/gadgets/brands') { gadgets_brands(); exit; }
    // Reviews
    if ($method === 'GET' && preg_match('#^/gadgets/(\d+)/reviews$#', $path, $m)) { getGadgetReviews((int)$m[1]); exit; }
    if ($method === 'POST' && preg_match('#^/gadgets/(\d+)/reviews$#', $path, $m)) { createGadgetReview((int)$m[1]); exit; }
    if ($method === 'POST' && preg_match('#^/reviews/(\d+)/reply$#', $path, $m)) { replyToReview((int)$m[1]); exit; }
    if ($method === 'POST' && preg_match('#^/reviews/(\d+)/react$#', $path, $m)) { reactToReview((int)$m[1]); exit; }

    // Admin: users
    if ($method === 'GET' && preg_match('#^/admin/users/?$#', $path)) { getAdminUsersList(); exit; }
    if ($method === 'GET' && preg_match('#^/admin/users/(.+)/?$#', $path, $m)) { getAdminUserDetail($m[1]); exit; }
    if ($method === 'POST' && preg_match('#^/admin/users/actions/?$#', $path)) { adminUserAction(); exit; }

    // Admin: platform stats
    if ($method === 'GET' && preg_match('#^/admin/stats/?$#', $path)) { getAdminPlatformStats(); exit; }

    // Admin: gadgets
    if ($method === 'POST' && preg_match('#^/admin/gadgets/?$#', $path)) { createAdminGadget(); exit; }
    if ($method === 'GET' && preg_match('#^/admin/gadgets/(\d+)/?$#', $path, $m)) { getAdminGadgetById((int)$m[1]); exit; }
    if ($method === 'PUT' && preg_match('#^/admin/gadgets/(\d+)/?$#', $path, $m)) { updateAdminGadget((int)$m[1]); exit; }
    if ($method === 'DELETE' && preg_match('#^/admin/gadgets/(\d+)/?$#', $path, $m)) { deleteAdminGadget((int)$m[1]); exit; }

    // Admin: variants
    if ($method === 'GET' && preg_match('#^/admin/gadgets/(\d+)/variants/?$#', $path, $m)) { getAdminGadgetVariants((int)$m[1]); exit; }
    if ($method === 'POST' && preg_match('#^/admin/gadgets/(\d+)/variants/?$#', $path, $m)) { createGadgetVariant((int)$m[1]); exit; }
    if ($method === 'PUT' && preg_match('#^/admin/gadgets/(\d+)/variants/(\d+)/?$#', $path, $m)) { updateGadgetVariant((int)$m[1], (int)$m[2]); exit; }
    if ($method === 'DELETE' && preg_match('#^/admin/gadgets/(\d+)/variants/(\d+)/?$#', $path, $m)) { deleteGadgetVariant((int)$m[1], (int)$m[2]); exit; }

    // Orders
    if ($method === 'GET' && preg_match('#^/orders/user/(.+)/?$#', $path, $m)) { getUserOrdersByUid($m[1]); exit; }
    if ($method === 'GET' && preg_match('#^/admin/orders/?$#', $path)) { getAdminOrdersList(); exit; }

    // Models proxy (CORS-safe static models). Place BEFORE Not Found.
    if (($method === 'GET' || $method === 'HEAD') && ($path === '/models-proxy' || $path === '/api/models-proxy')) {
        serveModelsProxy();
        exit;
    }

    // Contact: subjects list (optional)
    if ($method === 'GET' && ($path === '/contact/subjects' || $path === '/api/contact/subjects')) {
        $subjects = [
            'General Inquiry',
            'Product Question',
            'Order Issue',
            'Installment Plan',
            'Partnership',
            'Technical Support',
            'Refund Request',
            'Shipping',
            'Other'
        ];
        json_ok(['success' => true, 'data' => $subjects]);
        exit;
    }

    // Contact: send message via PHPMailer
    if ($method === 'POST' && ($path === '/contact' || $path === '/contact/send' || $path === '/api/contact' || $path === '/api/contact/send')) {
        // Parse JSON body
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) { $input = $_POST; }

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $subject = trim($input['subject'] ?? '');
        $message = trim($input['message'] ?? '');

        if ($name === '' || $email === '' || $subject === '' || $message === '') {
            json_error('Missing required fields: name, email, subject, message', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Invalid email address', 422);
        }

        // Normalize subject to allowed list
        $allowedSubjects = [
            'General Inquiry', 'Product Question', 'Order Issue', 'Installment Plan', 'Partnership', 'Technical Support', 'Refund Request', 'Shipping', 'Other'
        ];
        if (!in_array($subject, $allowedSubjects, true)) { $subject = 'Other'; }

        try {
            $mail = getMailer();
            if (!$mail) {
                json_error('PHPMailer not installed. Please upload vendor/ or run composer install.', 500);
            }

            // Sender and recipient
            // From is pre-set in getMailer(); override here if needed
            $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
            $mail->addAddress('conradzikomo@gmail.com', 'Xtrapush Admin');
            // CC the customer so they have a record
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($email, $name);
            }
            // Let admin reply directly to user
            $mail->addReplyTo($email, $name);

            // Content
            $mail->Subject = 'Contact: ' . $subject . ' — ' . $name;
            $mail->Body = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                . '<p><strong>Name:</strong> ' . htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Email:</strong> ' . htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Subject:</strong> ' . htmlspecialchars($subject, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<hr />'
                . '<p style="white-space:pre-wrap">' . nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>'
                . '</div>';
            $mail->AltBody = "Name: $name\nEmail: $email\nSubject: $subject\n\n$message";

            $mail->send();
            json_ok(['success' => true, 'message' => 'Message sent successfully']);
            exit;
        } catch (Throwable $e) {
            error_log('PHPMailer send error: ' . $e->getMessage());
            json_error('Failed to send message', 500, ['details' => $e->getMessage()]);
            exit;
        }
    }

    // ========== ADMIN TRADE-IN ENDPOINTS ==========
    
    // Admin: Get all trade-ins with optional filtering
    if ($method === 'GET' && ($path === '/admin/trade-in' || $path === '/api/admin/trade-in')) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }
        
        // Optional filters
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 200;
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT * FROM trade_ins";
        $conditions = [];
        $params = [];
        $types = '';
        
        if ($status && $status !== 'all') {
            $conditions[] = 'status = ?';
            $params[] = $status;
            $types .= 's';
        }
        
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT ?';
        $params[] = $limit;
        $types .= 'i';
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            json_error('Query preparation failed', 500);
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $tradeIns = [];
        while ($row = $result->fetch_assoc()) {
            $tradeIns[] = [
                'id' => (int)$row['id'],
                'reference' => $row['reference'],
                'category' => $row['category'],
                'categoryName' => $row['category_name'],
                'deviceBrand' => $row['device_brand'],
                'deviceModel' => $row['device_model'],
                'deviceStorage' => $row['device_storage'],
                'deviceCondition' => $row['device_condition'],
                'deviceAccessories' => $row['device_accessories'],
                'estimatedValue' => (float)$row['estimated_value'],
                'finalValue' => $row['final_value'] ? (float)$row['final_value'] : null,
                'customerName' => $row['customer_name'],
                'customerEmail' => $row['customer_email'],
                'customerPhone' => $row['customer_phone'],
                'customerAddress' => $row['customer_address'],
                'status' => $row['status'],
                'notes' => $row['notes'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
                'reviewedAt' => $row['reviewed_at'],
                'completedAt' => $row['completed_at']
            ];
        }
        
        $stmt->close();
        
        json_ok(['success' => true, 'data' => $tradeIns, 'count' => count($tradeIns)]);
        exit;
    }
    
    // Admin: Update trade-in status, value, or notes
    if ($method === 'POST' && ($path === '/admin/trade-in/update' || $path === '/api/admin/trade-in/update')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        
        $reference = trim($input['reference'] ?? '');
        $status = $input['status'] ?? null;
        $finalValue = $input['finalValue'] ?? null;
        $notes = $input['notes'] ?? null;
        
        if (!$reference) {
            json_error('Reference required', 422);
        }
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }
        
        // Build dynamic update query
        $updates = [];
        $params = [];
        $types = '';
        
        if ($status !== null) {
            $updates[] = 'status = ?';
            $params[] = $status;
            $types .= 's';
            
            // Update reviewed_at if changing to under_review, approved, or rejected
            if (in_array($status, ['under_review', 'approved', 'rejected'])) {
                $updates[] = 'reviewed_at = NOW()';
            }
            
            // Update completed_at if changing to completed
            if ($status === 'completed') {
                $updates[] = 'completed_at = NOW()';
            }
        }
        
        if ($finalValue !== null) {
            $updates[] = 'final_value = ?';
            $params[] = $finalValue;
            $types .= 'd';
        }
        
        if ($notes !== null) {
            $updates[] = 'notes = ?';
            $params[] = $notes;
            $types .= 's';
        }
        
        if (empty($updates)) {
            json_error('No fields to update', 422);
        }
        
        $sql = "UPDATE trade_ins SET " . implode(', ', $updates) . " WHERE reference = ?";
        $params[] = $reference;
        $types .= 's';
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            json_error('Query preparation failed', 500);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            json_error('Failed to update trade-in', 500);
        }
        
        if ($stmt->affected_rows === 0) {
            json_error('Trade-in not found or no changes made', 404);
        }
        
        $stmt->close();
        
        json_ok(['success' => true, 'message' => 'Trade-in updated successfully']);
        exit;
    }

    // ========== TRADE-IN ENDPOINTS ==========
    
    // Submit a new trade-in request
    if ($method === 'POST' && ($path === '/trade-in/submit' || $path === '/api/trade-in/submit')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) { $input = $_POST; }

        // Validate required fields
        $category = trim($input['category'] ?? '');
        $categoryName = trim($input['categoryName'] ?? '');
        $deviceInfo = $input['deviceInfo'] ?? [];
        $contactInfo = $input['contactInfo'] ?? [];
        $estimatedValue = floatval($input['estimatedValue'] ?? 0);

        // Contact info validation
        $name = trim($contactInfo['name'] ?? '');
        $email = trim($contactInfo['email'] ?? '');
        $phone = trim($contactInfo['phone'] ?? '');
        $address = trim($contactInfo['address'] ?? '');

        if ($category === '' || $name === '' || $email === '' || $phone === '') {
            json_error('Missing required fields: category, name, email, phone', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Invalid email address', 422);
        }

        // Generate unique reference
        $reference = 'TI-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . '-' . date('Ymd');

        // Try to save to database
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        $savedToDb = false;

        if ($conn && !$conn->connect_errno) {
            // Create trade_ins table if it doesn't exist
            $conn->query("
                CREATE TABLE IF NOT EXISTS trade_ins (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    reference VARCHAR(50) UNIQUE NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    category_name VARCHAR(100),
                    device_brand VARCHAR(100),
                    device_model VARCHAR(255),
                    device_storage VARCHAR(100),
                    device_condition VARCHAR(50),
                    device_accessories TEXT,
                    estimated_value DECIMAL(10,2) DEFAULT 0,
                    final_value DECIMAL(10,2) DEFAULT NULL,
                    customer_name VARCHAR(255) NOT NULL,
                    customer_email VARCHAR(255) NOT NULL,
                    customer_phone VARCHAR(50) NOT NULL,
                    customer_address TEXT,
                    status ENUM('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    reviewed_at TIMESTAMP NULL,
                    completed_at TIMESTAMP NULL,
                    INDEX idx_reference (reference),
                    INDEX idx_status (status),
                    INDEX idx_email (customer_email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $stmt = $conn->prepare("
                INSERT INTO trade_ins (reference, category, category_name, device_brand, device_model, 
                    device_storage, device_condition, device_accessories, estimated_value, 
                    customer_name, customer_email, customer_phone, customer_address, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");
            
            if ($stmt) {
                $brand = $deviceInfo['brand'] ?? '';
                $model = $deviceInfo['model'] ?? '';
                $storage = $deviceInfo['storage'] ?? '';
                $condition = $deviceInfo['condition'] ?? '';
                $accessories = is_array($deviceInfo['accessories'] ?? null) 
                    ? implode(', ', $deviceInfo['accessories']) 
                    : ($deviceInfo['accessories'] ?? '');

                $stmt->bind_param('ssssssssdssss', 
                    $reference, $category, $categoryName, $brand, $model,
                    $storage, $condition, $accessories, $estimatedValue,
                    $name, $email, $phone, $address
                );
                $savedToDb = $stmt->execute();
                $stmt->close();
            }
        }

        // Send confirmation email to customer
        try {
            $mail = getMailer();
            if ($mail) {
                $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Trade-In');
                $mail->addAddress($email, $name);
                $mail->addBCC('conradzikomo@gmail.com', 'Xtrapush Admin');
                
                $mail->Subject = 'Trade-In Request Received - ' . $reference;
                $mail->Body = '
                    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:600px;margin:0 auto;">
                        <div style="background:#1a1a2e;padding:20px;text-align:center;">
                            <h1 style="color:#fff;margin:0;">Trade-In Request Received</h1>
                        </div>
                        <div style="padding:20px;background:#f8f9fa;">
                            <p>Hello ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ',</p>
                            <p>Thank you for submitting your trade-in request. Here are the details:</p>
                            
                            <div style="background:#fff;padding:15px;border-radius:8px;margin:15px 0;">
                                <h3 style="margin-top:0;color:#1a1a2e;">Reference Number</h3>
                                <p style="font-size:18px;font-weight:bold;color:#4CAF50;">' . $reference . '</p>
                            </div>
                            
                            <div style="background:#fff;padding:15px;border-radius:8px;margin:15px 0;">
                                <h3 style="margin-top:0;color:#1a1a2e;">Device Details</h3>
                                <p><strong>Category:</strong> ' . htmlspecialchars($categoryName ?: $category, ENT_QUOTES, 'UTF-8') . '</p>
                                <p><strong>Brand:</strong> ' . htmlspecialchars($deviceInfo['brand'] ?? 'N/A', ENT_QUOTES, 'UTF-8') . '</p>
                                <p><strong>Model:</strong> ' . htmlspecialchars($deviceInfo['model'] ?? 'N/A', ENT_QUOTES, 'UTF-8') . '</p>
                                <p><strong>Condition:</strong> ' . htmlspecialchars($deviceInfo['condition'] ?? 'N/A', ENT_QUOTES, 'UTF-8') . '</p>
                            </div>
                            
                            <div style="background:#fff;padding:15px;border-radius:8px;margin:15px 0;">
                                <h3 style="margin-top:0;color:#1a1a2e;">Estimated Value</h3>
                                <p style="font-size:24px;font-weight:bold;color:#2196F3;">$' . number_format($estimatedValue, 2) . '</p>
                                <p style="font-size:12px;color:#666;">*Final value may vary based on device inspection</p>
                            </div>
                            
                            <p style="margin-top:20px;">Our team will review your request and contact you within 24 hours to arrange device inspection and pickup.</p>
                            
                            <p>Best regards,<br><strong>Xtrapush Team</strong></p>
                        </div>
                        <div style="background:#1a1a2e;padding:15px;text-align:center;">
                            <p style="color:#888;font-size:12px;margin:0;">© ' . date('Y') . ' Xtrapush. All rights reserved.</p>
                        </div>
                    </div>
                ';
                $mail->AltBody = "Trade-In Request Received\n\nReference: $reference\nDevice: $categoryName - " . ($deviceInfo['brand'] ?? '') . " " . ($deviceInfo['model'] ?? '') . "\nEstimated Value: $" . number_format($estimatedValue, 2) . "\n\nWe will contact you within 24 hours.";
                
                $mail->send();
            }
        } catch (Throwable $e) {
            error_log('Trade-in confirmation email error: ' . $e->getMessage());
            // Continue even if email fails
        }

        // Send notification to admin
        try {
            $mail = getMailer();
            if ($mail) {
                $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Trade-In');
                $mail->addAddress('conradzikomo@gmail.com', 'Xtrapush Admin');
                
                $mail->Subject = 'New Trade-In Request - ' . $reference;
                $mail->Body = '
                    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
                        <h2>New Trade-In Request Received</h2>
                        <p><strong>Reference:</strong> ' . $reference . '</p>
                        <p><strong>Customer:</strong> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Email:</strong> ' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Phone:</strong> ' . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Address:</strong> ' . htmlspecialchars($address, ENT_QUOTES, 'UTF-8') . '</p>
                        <hr />
                        <p><strong>Device:</strong> ' . htmlspecialchars($categoryName ?: $category, ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Brand/Model:</strong> ' . htmlspecialchars(($deviceInfo['brand'] ?? '') . ' ' . ($deviceInfo['model'] ?? ''), ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Condition:</strong> ' . htmlspecialchars($deviceInfo['condition'] ?? 'N/A', ENT_QUOTES, 'UTF-8') . '</p>
                        <p><strong>Estimated Value:</strong> $' . number_format($estimatedValue, 2) . '</p>
                    </div>
                ';
                $mail->AltBody = "New Trade-In: $reference\nCustomer: $name\nEmail: $email\nPhone: $phone\nDevice: $categoryName\nEstimated: $" . number_format($estimatedValue, 2);
                
                $mail->send();
            }
        } catch (Throwable $e) {
            error_log('Trade-in admin notification error: ' . $e->getMessage());
        }

        json_ok([
            'success' => true,
            'reference' => $reference,
            'message' => 'Trade-in request submitted successfully',
            'estimatedValue' => $estimatedValue,
            'savedToDatabase' => $savedToDb
        ]);
        exit;
    }

    // Get trade-in status by reference
    if ($method === 'GET' && preg_match('#^/trade-in/status/([A-Za-z0-9\-]+)$#', $path, $m)) {
        $reference = $m[1];
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        $stmt = $conn->prepare("SELECT * FROM trade_ins WHERE reference = ? LIMIT 1");
        if (!$stmt) {
            json_error('Trade-in lookup failed', 500);
        }
        
        $stmt->bind_param('s', $reference);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            json_ok([
                'success' => true,
                'tradeIn' => [
                    'reference' => $row['reference'],
                    'category' => $row['category_name'] ?: $row['category'],
                    'device' => [
                        'brand' => $row['device_brand'],
                        'model' => $row['device_model'],
                        'condition' => $row['device_condition']
                    ],
                    'estimatedValue' => floatval($row['estimated_value']),
                    'finalValue' => $row['final_value'] ? floatval($row['final_value']) : null,
                    'status' => $row['status'],
                    'createdAt' => $row['created_at'],
                    'updatedAt' => $row['updated_at']
                ]
            ]);
        } else {
            json_error('Trade-in not found', 404);
        }
        $stmt->close();
        exit;
    }

    // Get user's trade-in history by email
    if ($method === 'GET' && ($path === '/trade-in/history' || $path === '/api/trade-in/history')) {
        $uid = $_GET['uid'] ?? '';
        $email = $_GET['email'] ?? '';
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Get user email from uid if provided
        if ($uid && !$email) {
            $stmt = $conn->prepare("SELECT email FROM users WHERE uid = ? LIMIT 1");
            if ($stmt) {
                $stmt->bind_param('s', $uid);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($row = $result->fetch_assoc()) {
                    $email = $row['email'];
                }
                $stmt->close();
            }
        }

        if (!$email) {
            json_error('Email or user ID required', 422);
        }

        $stmt = $conn->prepare("
            SELECT reference, category, category_name, device_brand, device_model, 
                   device_condition, estimated_value, final_value, status, created_at
            FROM trade_ins 
            WHERE customer_email = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        
        if (!$stmt) {
            json_error('Query failed', 500);
        }
        
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $tradeIns = [];
        while ($row = $result->fetch_assoc()) {
            $tradeIns[] = [
                'reference' => $row['reference'],
                'category' => $row['category_name'] ?: $row['category'],
                'device' => $row['device_brand'] . ' ' . $row['device_model'],
                'condition' => $row['device_condition'],
                'estimatedValue' => floatval($row['estimated_value']),
                'finalValue' => $row['final_value'] ? floatval($row['final_value']) : null,
                'status' => $row['status'],
                'createdAt' => $row['created_at']
            ];
        }
        $stmt->close();
        
        json_ok(['success' => true, 'tradeIns' => $tradeIns]);
        exit;
    }

    // Cancel a trade-in request
    if ($method === 'POST' && ($path === '/trade-in/cancel' || $path === '/api/trade-in/cancel')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        
        $reference = trim($input['reference'] ?? '');
        $userUid = trim($input['userUid'] ?? '');
        
        if (!$reference) {
            json_error('Reference required', 422);
        }

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Verify ownership if uid provided
        $stmt = $conn->prepare("
            SELECT ti.id, ti.customer_email, ti.status 
            FROM trade_ins ti
            LEFT JOIN users u ON ti.customer_email = u.email
            WHERE ti.reference = ? AND (u.uid = ? OR ? = '')
            LIMIT 1
        ");
        
        if (!$stmt) {
            json_error('Query failed', 500);
        }
        
        $stmt->bind_param('sss', $reference, $userUid, $userUid);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!($row = $result->fetch_assoc())) {
            json_error('Trade-in not found or unauthorized', 404);
        }
        $stmt->close();

        if ($row['status'] === 'completed' || $row['status'] === 'cancelled') {
            json_error('Cannot cancel trade-in with status: ' . $row['status'], 400);
        }

        $updateStmt = $conn->prepare("UPDATE trade_ins SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancelled by user at ', NOW()) WHERE id = ?");
        if ($updateStmt) {
            $updateStmt->bind_param('i', $row['id']);
            $updateStmt->execute();
            $updateStmt->close();
        }

        json_ok(['success' => true, 'message' => 'Trade-in cancelled successfully']);
        exit;
    }

    // Get estimate (quick calculation without saving)
    if ($method === 'POST' && ($path === '/trade-in/estimate' || $path === '/api/trade-in/estimate')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        
        $category = $input['category'] ?? '';
        $brand = $input['brand'] ?? '';
        $condition = $input['condition'] ?? '';
        
        // Base values by category
        $baseValues = [
            'smartphone' => 200,
            'laptop' => 400,
            'tablet' => 150,
            'smartwatch' => 100,
            'headphones' => 80,
            'camera' => 300
        ];
        
        // Condition multipliers
        $conditionMultipliers = [
            'excellent' => 1.0,
            'very-good' => 0.85,
            'good' => 0.7,
            'fair' => 0.5,
            'poor' => 0.3
        ];
        
        // Brand multipliers
        $premiumBrands = ['Apple', 'Samsung'];
        $goodBrands = ['Google', 'Sony', 'Dell', 'Microsoft', 'Canon', 'Nikon'];
        
        $baseValue = $baseValues[$category] ?? 100;
        $conditionMultiplier = $conditionMultipliers[$condition] ?? 0.5;
        $brandMultiplier = 1.0;
        
        if (in_array($brand, $premiumBrands)) {
            $brandMultiplier = 1.2;
        } elseif (in_array($brand, $goodBrands)) {
            $brandMultiplier = 1.1;
        }
        
        $estimate = round($baseValue * $conditionMultiplier * $brandMultiplier);
        
        json_ok([
            'success' => true,
            'estimate' => $estimate,
            'breakdown' => [
                'baseValue' => $baseValue,
                'conditionMultiplier' => $conditionMultiplier,
                'brandMultiplier' => $brandMultiplier
            ]
        ]);
        exit;
    }

    // ========== EMAIL NOTIFICATION ENDPOINTS ==========

    // Send a custom email notification
    if ($method === 'POST' && ($path === '/notifications/email' || $path === '/api/notifications/email')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        $to = trim($input['to'] ?? '');
        $subject = trim($input['subject'] ?? '');
        $body = trim($input['body'] ?? '');
        $templateId = $input['templateId'] ?? null;
        $templateData = $input['templateData'] ?? [];

        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            json_error('Valid email address required', 422);
        }

        // Use template if provided
        if ($templateId) {
            $templates = [
                'welcome' => [
                    'subject' => 'Welcome to Xtrapush!',
                    'body' => '<h1>Welcome, {{name}}!</h1><p>Thanks for joining Xtrapush. Start exploring our gadgets today.</p>'
                ],
                'order_confirmation' => [
                    'subject' => 'Order Confirmed - {{orderRef}}',
                    'body' => '<h1>Order Confirmed</h1><p>Hi {{name}}, your order {{orderRef}} has been confirmed.</p><p>Total: {{total}}</p>'
                ],
                'payment_received' => [
                    'subject' => 'Payment Received - {{reference}}',
                    'body' => '<h1>Payment Received</h1><p>We received your payment of {{amount}} for {{reference}}.</p>'
                ],
                'trade_in_update' => [
                    'subject' => 'Trade-In Update - {{reference}}',
                    'body' => '<h1>Trade-In Update</h1><p>Your trade-in {{reference}} status: {{status}}</p>'
                ],
                'subscription_reminder' => [
                    'subject' => 'Xtrapush Premium Renewal',
                    'body' => '<h1>Subscription Renewal</h1><p>Your Xtrapush Premium subscription will renew on {{date}}.</p>'
                ]
            ];

            if (isset($templates[$templateId])) {
                $template = $templates[$templateId];
                $subject = $template['subject'];
                $body = $template['body'];

                // Replace placeholders
                foreach ($templateData as $key => $value) {
                    $subject = str_replace('{{' . $key . '}}', htmlspecialchars($value, ENT_QUOTES, 'UTF-8'), $subject);
                    $body = str_replace('{{' . $key . '}}', htmlspecialchars($value, ENT_QUOTES, 'UTF-8'), $body);
                }
            }
        }

        if (!$subject || !$body) {
            json_error('Subject and body required', 422);
        }

        try {
            $mail = getMailer();
            if (!$mail) {
                json_error('Email service unavailable', 500);
            }

            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' . $body . '</div>';
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

            $mail->send();
            json_ok(['success' => true, 'message' => 'Email sent successfully']);
        } catch (Throwable $e) {
            error_log('Email send error: ' . $e->getMessage());
            json_error('Failed to send email', 500, ['details' => $e->getMessage()]);
        }
        exit;
    }

    // Get user notifications (stored in database)
    if ($method === 'GET' && preg_match('#^/notifications/user/([^/]+)/?$#', $path, $m)) {
        $userUid = $m[1];

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Create notifications table if needed
        $conn->query("
            CREATE TABLE IF NOT EXISTS user_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_uid VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                link VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user (user_uid),
                INDEX idx_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $stmt = $conn->prepare("
            SELECT id, title, message, type, is_read, link, created_at 
            FROM user_notifications 
            WHERE user_uid = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ");

        if (!$stmt) {
            json_ok(['success' => true, 'notifications' => []]);
            exit;
        }

        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $result = $stmt->get_result();

        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'message' => $row['message'],
                'type' => $row['type'],
                'isRead' => (bool)$row['is_read'],
                'link' => $row['link'],
                'createdAt' => $row['created_at']
            ];
        }
        $stmt->close();

        json_ok(['success' => true, 'notifications' => $notifications]);
        exit;
    }

    // Mark notification as read
    if ($method === 'PUT' && preg_match('#^/notifications/(\d+)/read/?$#', $path, $m)) {
        $notificationId = (int)$m[1];

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        $stmt = $conn->prepare("UPDATE user_notifications SET is_read = TRUE WHERE id = ?");
        if ($stmt) {
            $stmt->bind_param('i', $notificationId);
            $stmt->execute();
            $stmt->close();
        }

        json_ok(['success' => true, 'message' => 'Notification marked as read']);
        exit;
    }

    // Subscribe to email notifications
    if ($method === 'POST' && ($path === '/notifications/subscribe' || $path === '/api/notifications/subscribe')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        $email = trim($input['email'] ?? '');
        $types = $input['types'] ?? ['all'];

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Valid email required', 422);
        }

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Create subscriptions table if needed
        $conn->query("
            CREATE TABLE IF NOT EXISTS email_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                subscription_types JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $typesJson = json_encode($types);
        $stmt = $conn->prepare("
            INSERT INTO email_subscriptions (email, subscription_types, is_active) 
            VALUES (?, ?, TRUE)
            ON DUPLICATE KEY UPDATE subscription_types = ?, is_active = TRUE, updated_at = NOW()
        ");

        if ($stmt) {
            $stmt->bind_param('sss', $email, $typesJson, $typesJson);
            $stmt->execute();
            $stmt->close();
        }

        json_ok(['success' => true, 'message' => 'Successfully subscribed to notifications']);
        exit;
    }

    // Unsubscribe from email notifications
    if ($method === 'POST' && ($path === '/notifications/unsubscribe' || $path === '/api/notifications/unsubscribe')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        $email = trim($input['email'] ?? '');
        $types = $input['types'] ?? null;

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Valid email required', 422);
        }

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        if ($types === null || (is_array($types) && in_array('all', $types))) {
            // Unsubscribe from all
            $stmt = $conn->prepare("UPDATE email_subscriptions SET is_active = FALSE WHERE email = ?");
            if ($stmt) {
                $stmt->bind_param('s', $email);
                $stmt->execute();
                $stmt->close();
            }
        } else {
            // Remove specific types
            $stmt = $conn->prepare("SELECT subscription_types FROM email_subscriptions WHERE email = ?");
            if ($stmt) {
                $stmt->bind_param('s', $email);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($row = $result->fetch_assoc()) {
                    $currentTypes = json_decode($row['subscription_types'], true) ?: [];
                    $newTypes = array_diff($currentTypes, $types);
                    $newTypesJson = json_encode(array_values($newTypes));

                    $updateStmt = $conn->prepare("UPDATE email_subscriptions SET subscription_types = ? WHERE email = ?");
                    if ($updateStmt) {
                        $updateStmt->bind_param('ss', $newTypesJson, $email);
                        $updateStmt->execute();
                        $updateStmt->close();
                    }
                }
                $stmt->close();
            }
        }

        json_ok(['success' => true, 'message' => 'Successfully unsubscribed']);
        exit;
    }

    // ========== INSTALLMENT APPLICATION ENDPOINTS ==========

    // Helper function to create installment applications table
    function ensure_installment_applications_tables($conn) {
        // Main applications table
        $conn->query("
            CREATE TABLE IF NOT EXISTS installment_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reference VARCHAR(50) UNIQUE NOT NULL,
                user_uid VARCHAR(255) NOT NULL,
                gadget_id INT,
                gadget_name VARCHAR(255),
                variant_id INT,
                variant_storage VARCHAR(100),
                variant_color VARCHAR(100),
                variant_condition VARCHAR(50),
                plan_type ENUM('pay-to-own', 'pay-as-you-go', 'pay-to-lease') NOT NULL,
                plan_weeks INT NOT NULL,
                deposit_amount DECIMAL(12,2) NOT NULL,
                weekly_amount DECIMAL(12,2) NOT NULL,
                total_amount DECIMAL(12,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'MWK',
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                date_of_birth DATE,
                national_id VARCHAR(100),
                address TEXT,
                town VARCHAR(100),
                postcode VARCHAR(20),
                country VARCHAR(100) DEFAULT 'Malawi',
                employment_status VARCHAR(100),
                employer_name VARCHAR(255),
                job_title VARCHAR(255),
                monthly_income VARCHAR(100),
                employment_duration VARCHAR(100),
                employer_phone VARCHAR(50),
                employer_address TEXT,
                status ENUM('pending', 'under_review', 'documents_requested', 'approved', 'denied', 'cancelled') DEFAULT 'pending',
                admin_notes TEXT,
                denial_reason TEXT,
                documents_requested TEXT,
                approved_by VARCHAR(255),
                approved_at DATETIME,
                denied_by VARCHAR(255),
                denied_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_uid (user_uid),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                INDEX idx_gadget_id (gadget_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Documents table
        $conn->query("
            CREATE TABLE IF NOT EXISTS application_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                document_type ENUM('national_id_front', 'national_id_back', 'proof_of_address', 'proof_of_income', 'selfie', 'other') NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INT,
                mime_type VARCHAR(100),
                verified BOOLEAN DEFAULT FALSE,
                verified_by VARCHAR(255),
                verified_at DATETIME,
                verification_notes TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES installment_applications(id) ON DELETE CASCADE,
                INDEX idx_application_id (application_id),
                INDEX idx_document_type (document_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Status history table
        $conn->query("
            CREATE TABLE IF NOT EXISTS application_status_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                previous_status VARCHAR(50),
                new_status VARCHAR(50) NOT NULL,
                changed_by VARCHAR(255),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_application_id (application_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Admin notifications table
        $conn->query("
            CREATE TABLE IF NOT EXISTS application_admin_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                notification_type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                read_by VARCHAR(255),
                read_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_application_id (application_id),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // User notifications for applications
        $conn->query("
            CREATE TABLE IF NOT EXISTS application_user_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                user_uid VARCHAR(255) NOT NULL,
                notification_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                read_at DATETIME,
                email_sent BOOLEAN DEFAULT FALSE,
                email_sent_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_application_id (application_id),
                INDEX idx_user_uid (user_uid),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    // Submit a new installment application with documents
    if ($method === 'POST' && ($path === '/installments/apply' || $path === '/api/installments/apply')) {
        try {
            $db = DatabaseConnection::getInstance();
            $conn = $db->getConnection();

            if (!$conn || $conn->connect_errno) {
                json_error('Database unavailable', 503);
            }

            ensure_installment_applications_tables($conn);

            // Parse application data from multipart form or JSON
            $applicationData = [];
            if (isset($_POST['applicationData'])) {
                $applicationData = json_decode($_POST['applicationData'], true);
            } else {
                $raw = file_get_contents('php://input');
                $applicationData = json_decode($raw, true);
            }

            if (!$applicationData) {
                json_error('Application data required', 422);
            }

            // Generate unique reference
            $reference = 'APP-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . '-' . date('Ymd');

            // Extract data
            $userUid = $applicationData['userUid'] ?? '';
            $gadgetId = $applicationData['gadgetId'] ?? null;
            $gadgetName = $applicationData['gadgetName'] ?? '';
            $variantDetails = $applicationData['variantDetails'] ?? [];
            $installmentPlan = $applicationData['installmentPlan'] ?? [];
            $personalInfo = $applicationData['personalInfo'] ?? [];
            $employmentInfo = $applicationData['employmentInfo'] ?? [];

            // Validate required fields
            if (empty($personalInfo['fullName']) || empty($personalInfo['email']) || empty($personalInfo['phone'])) {
                json_error('Personal information (name, email, phone) required', 422);
            }

            // Insert application
            $stmt = $conn->prepare("
                INSERT INTO installment_applications (
                    reference, user_uid, gadget_id, gadget_name, 
                    variant_id, variant_storage, variant_color, variant_condition,
                    plan_type, plan_weeks, deposit_amount, weekly_amount, total_amount,
                    full_name, email, phone, date_of_birth, national_id,
                    address, town, postcode, country,
                    employment_status, employer_name, job_title, monthly_income,
                    employment_duration, employer_phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            if (!$stmt) {
                json_error('Failed to prepare statement: ' . $conn->error, 500);
            }

            $variantId = $variantDetails['id'] ?? null;
            $variantStorage = $variantDetails['storage'] ?? '';
            $variantColor = $variantDetails['color'] ?? '';
            $variantCondition = $variantDetails['condition'] ?? '';
            $planType = $installmentPlan['type'] ?? 'pay-to-own';
            $planWeeks = (int)($installmentPlan['weeks'] ?? 4);
            $depositAmount = (float)($installmentPlan['depositAmount'] ?? 0);
            $weeklyAmount = (float)($installmentPlan['weeklyAmount'] ?? 0);
            $totalAmount = (float)($installmentPlan['totalAmount'] ?? 0);
            $fullName = $personalInfo['fullName'] ?? '';
            $email = $personalInfo['email'] ?? '';
            $phone = $personalInfo['phone'] ?? '';
            $dateOfBirth = !empty($personalInfo['dateOfBirth']) ? $personalInfo['dateOfBirth'] : null;
            $nationalId = $personalInfo['nationalId'] ?? '';
            $address = $personalInfo['address'] ?? '';
            $town = $personalInfo['town'] ?? '';
            $postcode = $personalInfo['postcode'] ?? '';
            $country = $personalInfo['country'] ?? 'Malawi';
            $employmentStatus = $employmentInfo['employmentStatus'] ?? '';
            $employerName = $employmentInfo['employerName'] ?? '';
            $jobTitle = $employmentInfo['jobTitle'] ?? '';
            $monthlyIncome = $employmentInfo['monthlyIncome'] ?? '';
            $employmentDuration = $employmentInfo['employmentDuration'] ?? '';
            $employerPhone = $employmentInfo['employerPhone'] ?? '';

            $stmt->bind_param(
                'ssissssssiidddsssssssssssssss',
                $reference, $userUid, $gadgetId, $gadgetName,
                $variantId, $variantStorage, $variantColor, $variantCondition,
                $planType, $planWeeks, $depositAmount, $weeklyAmount, $totalAmount,
                $fullName, $email, $phone, $dateOfBirth, $nationalId,
                $address, $town, $postcode, $country,
                $employmentStatus, $employerName, $jobTitle, $monthlyIncome,
                $employmentDuration, $employerPhone
            );

            if (!$stmt->execute()) {
                json_error('Failed to save application: ' . $stmt->error, 500);
            }

            $applicationId = $conn->insert_id;
            $stmt->close();

            // Handle file uploads
            $uploadDir = __DIR__ . '/uploads/applications/' . $applicationId . '/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $documentTypes = ['nationalIdFront', 'nationalIdBack', 'proofOfAddress', 'proofOfIncome', 'selfie'];
            $uploadedDocs = [];

            foreach ($documentTypes as $docType) {
                if (isset($_FILES[$docType]) && $_FILES[$docType]['error'] === UPLOAD_ERR_OK) {
                    $file = $_FILES[$docType];
                    $originalName = basename($file['name']);
                    $storedName = $docType . '_' . time() . '_' . $originalName;
                    $filePath = $uploadDir . $storedName;

                    if (move_uploaded_file($file['tmp_name'], $filePath)) {
                        $docStmt = $conn->prepare("
                            INSERT INTO application_documents 
                            (application_id, document_type, original_filename, stored_filename, file_path, file_size, mime_type)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");
                        
                        // Convert camelCase to snake_case for document type
                        $dbDocType = strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $docType));
                        $relPath = 'uploads/applications/' . $applicationId . '/' . $storedName;
                        
                        if ($docStmt) {
                            $docStmt->bind_param(
                                'issssis',
                                $applicationId, $dbDocType, $originalName, $storedName, $relPath, $file['size'], $file['type']
                            );
                            $docStmt->execute();
                            $docStmt->close();
                            $uploadedDocs[] = $dbDocType;
                        }
                    }
                }
            }

            // Record status history
            $histStmt = $conn->prepare("
                INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
                VALUES (?, NULL, 'pending', 'system', 'Application submitted')
            ");
            if ($histStmt) {
                $histStmt->bind_param('i', $applicationId);
                $histStmt->execute();
                $histStmt->close();
            }

            // Create admin notification
            $adminNotifStmt = $conn->prepare("
                INSERT INTO application_admin_notifications (application_id, notification_type, message)
                VALUES (?, 'new_application', ?)
            ");
            if ($adminNotifStmt) {
                $notifMessage = "New installment application from {$fullName} for {$gadgetName} ({$reference})";
                $adminNotifStmt->bind_param('is', $applicationId, $notifMessage);
                $adminNotifStmt->execute();
                $adminNotifStmt->close();
            }

            // Create user notification
            $userNotifStmt = $conn->prepare("
                INSERT INTO application_user_notifications (application_id, user_uid, notification_type, title, message)
                VALUES (?, ?, 'received', 'Application Received', ?)
            ");
            if ($userNotifStmt) {
                $userMessage = "Your installment application ({$reference}) has been received and is now under review.";
                $userNotifStmt->bind_param('iss', $applicationId, $userUid, $userMessage);
                $userNotifStmt->execute();
                $userNotifStmt->close();
            }

            // Also add to general user_notifications for dashboard
            $dashNotifStmt = $conn->prepare("
                INSERT INTO user_notifications (user_uid, title, message, type, link)
                VALUES (?, 'Installment Application Submitted', ?, 'success', '/dashboard/applications')
            ");
            if ($dashNotifStmt) {
                $dashMessage = "Your application for {$gadgetName} has been received. Reference: {$reference}";
                $dashNotifStmt->bind_param('ss', $userUid, $dashMessage);
                $dashNotifStmt->execute();
                $dashNotifStmt->close();
            }

            // Try to send confirmation email
            try {
                $mail = getMailer();
                if ($mail) {
                    $mail->addAddress($email, $fullName);
                    $mail->Subject = 'Installment Application Received - ' . $reference;
                    $mail->Body = "
                        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
                            <div style='background:linear-gradient(135deg,#0f172a,#1e293b);padding:30px;border-radius:10px;'>
                                <h1 style='color:#48CEDB;margin:0;'>Application Received</h1>
                            </div>
                            <div style='padding:30px;background:#f8f9fa;'>
                                <p>Hi <strong>{$fullName}</strong>,</p>
                                <p>Thank you for submitting your installment application. Here are the details:</p>
                                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                                    <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Reference:</strong></td><td style='padding:10px;border-bottom:1px solid #ddd;'>{$reference}</td></tr>
                                    <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Product:</strong></td><td style='padding:10px;border-bottom:1px solid #ddd;'>{$gadgetName}</td></tr>
                                    <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Plan:</strong></td><td style='padding:10px;border-bottom:1px solid #ddd;'>{$planWeeks} weeks</td></tr>
                                    <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Status:</strong></td><td style='padding:10px;border-bottom:1px solid #ddd;'><span style='color:#f59e0b;font-weight:bold;'>Under Review</span></td></tr>
                                </table>
                                <p>We will review your application and contact you within 24-48 hours.</p>
                                <p style='color:#666;font-size:12px;margin-top:30px;'>Track your application in your dashboard at itsxtrapush.com</p>
                            </div>
                        </div>
                    ";
                    $mail->send();
                }
            } catch (Throwable $e) {
                error_log('Application confirmation email error: ' . $e->getMessage());
            }

            // Notify admin via email
            try {
                $adminMail = getMailer();
                if ($adminMail) {
                    $adminMail->addAddress(ADMIN_EMAIL ?: 'admin@itsxtrapush.com');
                    $adminMail->Subject = 'New Installment Application - ' . $reference;
                    $adminMail->Body = "
                        <h2>New Installment Application</h2>
                        <p><strong>Reference:</strong> {$reference}</p>
                        <p><strong>Customer:</strong> {$fullName}</p>
                        <p><strong>Email:</strong> {$email}</p>
                        <p><strong>Phone:</strong> {$phone}</p>
                        <p><strong>Product:</strong> {$gadgetName}</p>
                        <p><strong>Plan:</strong> {$planType} - {$planWeeks} weeks</p>
                        <p><strong>Deposit:</strong> {$depositAmount}</p>
                        <p><strong>Weekly:</strong> {$weeklyAmount}</p>
                        <p><strong>Total:</strong> {$totalAmount}</p>
                        <p><strong>Employment:</strong> {$employmentStatus}</p>
                        <p><strong>Income:</strong> {$monthlyIncome}</p>
                        <p><strong>Documents:</strong> " . count($uploadedDocs) . " uploaded</p>
                        <p><a href='https://itsxtrapush.com/admin/applications/{$applicationId}'>Review Application</a></p>
                    ";
                    $adminMail->send();
                }
            } catch (Throwable $e) {
                error_log('Admin notification email error: ' . $e->getMessage());
            }

            json_ok([
                'success' => true,
                'reference' => $reference,
                'applicationId' => $applicationId,
                'documentsUploaded' => count($uploadedDocs),
                'message' => 'Application submitted successfully'
            ]);

        } catch (Throwable $e) {
            error_log('Application submission error: ' . $e->getMessage());
            json_error('Failed to submit application: ' . $e->getMessage(), 500);
        }
        exit;
    }

    // Get user's installment applications
    if ($method === 'GET' && preg_match('#^/(api/)?installments/applications/?$#', $path)) {
        $userUid = $_GET['uid'] ?? '';
        
        if (empty($userUid)) {
            json_error('User UID required', 422);
        }

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        ensure_installment_applications_tables($conn);

        $stmt = $conn->prepare("
            SELECT ia.*, 
                   (SELECT COUNT(*) FROM application_documents WHERE application_id = ia.id) as document_count
            FROM installment_applications ia
            WHERE ia.user_uid = ?
            ORDER BY ia.created_at DESC
        ");

        if (!$stmt) {
            json_ok(['success' => true, 'applications' => []]);
            exit;
        }

        $stmt->bind_param('s', $userUid);
        $stmt->execute();
        $result = $stmt->get_result();

        $applications = [];
        while ($row = $result->fetch_assoc()) {
            $applications[] = [
                'id' => $row['id'],
                'reference' => $row['reference'],
                'gadgetId' => $row['gadget_id'],
                'gadgetName' => $row['gadget_name'],
                'variant' => [
                    'storage' => $row['variant_storage'],
                    'color' => $row['variant_color'],
                    'condition' => $row['variant_condition']
                ],
                'plan' => [
                    'type' => $row['plan_type'],
                    'weeks' => $row['plan_weeks'],
                    'depositAmount' => floatval($row['deposit_amount']),
                    'weeklyAmount' => floatval($row['weekly_amount']),
                    'totalAmount' => floatval($row['total_amount']),
                    'currency' => $row['currency']
                ],
                'status' => $row['status'],
                'adminNotes' => $row['admin_notes'],
                'denialReason' => $row['denial_reason'],
                'documentsRequested' => $row['documents_requested'],
                'documentCount' => (int)$row['document_count'],
                'approvedAt' => $row['approved_at'],
                'deniedAt' => $row['denied_at'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }
        $stmt->close();

        json_ok(['success' => true, 'applications' => $applications]);
        exit;
    }

    // Get single application details
    if ($method === 'GET' && preg_match('#^/(api/)?installments/applications/(\d+)/?$#', $path, $m)) {
        $applicationId = (int)$m[2];

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        $stmt = $conn->prepare("SELECT * FROM installment_applications WHERE id = ?");
        if (!$stmt) {
            json_error('Query failed', 500);
        }

        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $app = $result->fetch_assoc();
        $stmt->close();

        if (!$app) {
            json_error('Application not found', 404);
        }

        // Get documents
        $docStmt = $conn->prepare("SELECT * FROM application_documents WHERE application_id = ?");
        $documents = [];
        if ($docStmt) {
            $docStmt->bind_param('i', $applicationId);
            $docStmt->execute();
            $docResult = $docStmt->get_result();
            while ($doc = $docResult->fetch_assoc()) {
                $documents[] = [
                    'id' => $doc['id'],
                    'type' => $doc['document_type'],
                    'originalFilename' => $doc['original_filename'],
                    'verified' => (bool)$doc['verified'],
                    'uploadedAt' => $doc['uploaded_at']
                ];
            }
            $docStmt->close();
        }

        // Get status history
        $histStmt = $conn->prepare("SELECT * FROM application_status_history WHERE application_id = ? ORDER BY created_at DESC");
        $history = [];
        if ($histStmt) {
            $histStmt->bind_param('i', $applicationId);
            $histStmt->execute();
            $histResult = $histStmt->get_result();
            while ($h = $histResult->fetch_assoc()) {
                $history[] = [
                    'previousStatus' => $h['previous_status'],
                    'newStatus' => $h['new_status'],
                    'changedBy' => $h['changed_by'],
                    'notes' => $h['notes'],
                    'createdAt' => $h['created_at']
                ];
            }
            $histStmt->close();
        }

        json_ok([
            'success' => true,
            'application' => [
                'id' => $app['id'],
                'reference' => $app['reference'],
                'userUid' => $app['user_uid'],
                'gadget' => [
                    'id' => $app['gadget_id'],
                    'name' => $app['gadget_name']
                ],
                'variant' => [
                    'storage' => $app['variant_storage'],
                    'color' => $app['variant_color'],
                    'condition' => $app['variant_condition']
                ],
                'plan' => [
                    'type' => $app['plan_type'],
                    'weeks' => $app['plan_weeks'],
                    'depositAmount' => floatval($app['deposit_amount']),
                    'weeklyAmount' => floatval($app['weekly_amount']),
                    'totalAmount' => floatval($app['total_amount']),
                    'currency' => $app['currency']
                ],
                'personal' => [
                    'fullName' => $app['full_name'],
                    'email' => $app['email'],
                    'phone' => $app['phone'],
                    'dateOfBirth' => $app['date_of_birth'],
                    'nationalId' => $app['national_id'],
                    'address' => $app['address'],
                    'town' => $app['town'],
                    'postcode' => $app['postcode'],
                    'country' => $app['country']
                ],
                'employment' => [
                    'status' => $app['employment_status'],
                    'employerName' => $app['employer_name'],
                    'jobTitle' => $app['job_title'],
                    'monthlyIncome' => $app['monthly_income'],
                    'duration' => $app['employment_duration'],
                    'employerPhone' => $app['employer_phone']
                ],
                'status' => $app['status'],
                'adminNotes' => $app['admin_notes'],
                'denialReason' => $app['denial_reason'],
                'documentsRequested' => $app['documents_requested'],
                'approvedBy' => $app['approved_by'],
                'approvedAt' => $app['approved_at'],
                'deniedBy' => $app['denied_by'],
                'deniedAt' => $app['denied_at'],
                'createdAt' => $app['created_at'],
                'updatedAt' => $app['updated_at']
            ],
            'documents' => $documents,
            'history' => $history
        ]);
        exit;
    }

    // Cancel an application (user can cancel pending applications)
    if ($method === 'POST' && preg_match('#^/(api/)?installments/applications/(\d+)/cancel/?$#', $path, $m)) {
        $applicationId = (int)$m[2];

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Check current status
        $stmt = $conn->prepare("SELECT status, user_uid, reference FROM installment_applications WHERE id = ?");
        if (!$stmt) {
            json_error('Query failed', 500);
        }

        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $app = $result->fetch_assoc();
        $stmt->close();

        if (!$app) {
            json_error('Application not found', 404);
        }

        if (!in_array($app['status'], ['pending', 'under_review', 'documents_requested'])) {
            json_error('Cannot cancel application with status: ' . $app['status'], 400);
        }

        // Update status
        $updateStmt = $conn->prepare("UPDATE installment_applications SET status = 'cancelled', updated_at = NOW() WHERE id = ?");
        if ($updateStmt) {
            $updateStmt->bind_param('i', $applicationId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        // Record history
        $histStmt = $conn->prepare("
            INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
            VALUES (?, ?, 'cancelled', 'user', 'Cancelled by user')
        ");
        if ($histStmt) {
            $histStmt->bind_param('is', $applicationId, $app['status']);
            $histStmt->execute();
            $histStmt->close();
        }

        json_ok(['success' => true, 'message' => 'Application cancelled successfully']);
        exit;
    }

    // Admin: Get all applications
    if ($method === 'GET' && preg_match('#^/(api/)?admin/installments/applications/?$#', $path)) {
        $status = $_GET['status'] ?? 'all';

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        ensure_installment_applications_tables($conn);

        $query = "
            SELECT ia.*, 
                   (SELECT COUNT(*) FROM application_documents WHERE application_id = ia.id) as document_count
            FROM installment_applications ia
        ";

        if ($status !== 'all') {
            $query .= " WHERE ia.status = ?";
        }
        $query .= " ORDER BY ia.created_at DESC";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            json_ok(['success' => true, 'applications' => []]);
            exit;
        }

        if ($status !== 'all') {
            $stmt->bind_param('s', $status);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $applications = [];
        while ($row = $result->fetch_assoc()) {
            $applications[] = [
                'id' => $row['id'],
                'reference' => $row['reference'],
                'userUid' => $row['user_uid'],
                'gadgetName' => $row['gadget_name'],
                'fullName' => $row['full_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'plan' => [
                    'type' => $row['plan_type'],
                    'weeks' => $row['plan_weeks'],
                    'depositAmount' => floatval($row['deposit_amount']),
                    'weeklyAmount' => floatval($row['weekly_amount']),
                    'totalAmount' => floatval($row['total_amount'])
                ],
                'employmentStatus' => $row['employment_status'],
                'monthlyIncome' => $row['monthly_income'],
                'status' => $row['status'],
                'documentCount' => (int)$row['document_count'],
                'createdAt' => $row['created_at']
            ];
        }
        $stmt->close();

        // Get unread admin notifications count
        $unreadStmt = $conn->prepare("SELECT COUNT(*) as cnt FROM application_admin_notifications WHERE is_read = FALSE");
        $unreadCount = 0;
        if ($unreadStmt) {
            $unreadStmt->execute();
            $unreadResult = $unreadStmt->get_result();
            if ($row = $unreadResult->fetch_assoc()) {
                $unreadCount = (int)$row['cnt'];
            }
            $unreadStmt->close();
        }

        json_ok([
            'success' => true, 
            'applications' => $applications,
            'unreadNotifications' => $unreadCount
        ]);
        exit;
    }

    // Admin: Approve application
    if ($method === 'POST' && preg_match('#^/(api/)?admin/installments/applications/(\d+)/approve/?$#', $path, $m)) {
        $applicationId = (int)$m[2];
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        $adminNotes = $input['adminNotes'] ?? '';
        $adminEmail = $input['adminEmail'] ?? 'admin';

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Get application
        $stmt = $conn->prepare("SELECT * FROM installment_applications WHERE id = ?");
        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $app = $result->fetch_assoc();
        $stmt->close();

        if (!$app) {
            json_error('Application not found', 404);
        }

        if ($app['status'] === 'approved' || $app['status'] === 'denied' || $app['status'] === 'cancelled') {
            json_error('Cannot approve application with status: ' . $app['status'], 400);
        }

        $previousStatus = $app['status'];

        // Update application
        $updateStmt = $conn->prepare("
            UPDATE installment_applications 
            SET status = 'approved', admin_notes = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW() 
            WHERE id = ?
        ");
        if ($updateStmt) {
            $updateStmt->bind_param('ssi', $adminNotes, $adminEmail, $applicationId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        // Record history
        $histStmt = $conn->prepare("
            INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
            VALUES (?, ?, 'approved', ?, ?)
        ");
        if ($histStmt) {
            $histStmt->bind_param('isss', $applicationId, $previousStatus, $adminEmail, $adminNotes);
            $histStmt->execute();
            $histStmt->close();
        }

        // Create user notification
        $userNotifStmt = $conn->prepare("
            INSERT INTO application_user_notifications (application_id, user_uid, notification_type, title, message)
            VALUES (?, ?, 'approved', 'Application Approved! 🎉', ?)
        ");
        if ($userNotifStmt) {
            $userMessage = "Great news! Your installment application ({$app['reference']}) for {$app['gadget_name']} has been approved. You can now proceed with the deposit payment.";
            $userNotifStmt->bind_param('iss', $applicationId, $app['user_uid'], $userMessage);
            $userNotifStmt->execute();
            $userNotifStmt->close();
        }

        // Add to dashboard notifications
        $dashNotifStmt = $conn->prepare("
            INSERT INTO user_notifications (user_uid, title, message, type, link)
            VALUES (?, 'Application Approved! 🎉', ?, 'success', '/dashboard/applications')
        ");
        if ($dashNotifStmt) {
            $dashMessage = "Your application for {$app['gadget_name']} has been approved! Proceed to payment.";
            $dashNotifStmt->bind_param('ss', $app['user_uid'], $dashMessage);
            $dashNotifStmt->execute();
            $dashNotifStmt->close();
        }

        // Send approval email
        try {
            $mail = getMailer();
            if ($mail) {
                $mail->addAddress($app['email'], $app['full_name']);
                $mail->Subject = 'Application Approved! - ' . $app['reference'];
                $mail->Body = "
                    <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
                        <div style='background:linear-gradient(135deg,#4CAF50,#2E7D32);padding:30px;border-radius:10px;text-align:center;'>
                            <h1 style='color:white;margin:0;'>🎉 Congratulations!</h1>
                            <p style='color:white;font-size:18px;'>Your application has been approved</p>
                        </div>
                        <div style='padding:30px;background:#f8f9fa;'>
                            <p>Hi <strong>{$app['full_name']}</strong>,</p>
                            <p>Great news! Your installment application has been approved.</p>
                            <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                                <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Reference:</strong></td><td>{$app['reference']}</td></tr>
                                <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Product:</strong></td><td>{$app['gadget_name']}</td></tr>
                                <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Deposit:</strong></td><td>" . number_format($app['deposit_amount'], 2) . "</td></tr>
                                <tr><td style='padding:10px;border-bottom:1px solid #ddd;'><strong>Weekly Payment:</strong></td><td>" . number_format($app['weekly_amount'], 2) . "</td></tr>
                            </table>
                            <p><strong>Next Steps:</strong></p>
                            <ol>
                                <li>Log in to your dashboard</li>
                                <li>Go to 'My Applications'</li>
                                <li>Click 'Pay Deposit' to start your installment plan</li>
                            </ol>
                            <a href='https://itsxtrapush.com/dashboard/applications' style='display:inline-block;background:#4CAF50;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin-top:20px;'>Go to Dashboard</a>
                        </div>
                    </div>
                ";
                $mail->send();
            }
        } catch (Throwable $e) {
            error_log('Approval email error: ' . $e->getMessage());
        }

        json_ok(['success' => true, 'message' => 'Application approved successfully']);
        exit;
    }

    // Admin: Deny application
    if ($method === 'POST' && preg_match('#^/(api/)?admin/installments/applications/(\d+)/deny/?$#', $path, $m)) {
        $applicationId = (int)$m[2];
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        $reason = $input['reason'] ?? '';
        $adminEmail = $input['adminEmail'] ?? 'admin';

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Get application
        $stmt = $conn->prepare("SELECT * FROM installment_applications WHERE id = ?");
        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $app = $result->fetch_assoc();
        $stmt->close();

        if (!$app) {
            json_error('Application not found', 404);
        }

        if ($app['status'] === 'approved' || $app['status'] === 'denied' || $app['status'] === 'cancelled') {
            json_error('Cannot deny application with status: ' . $app['status'], 400);
        }

        $previousStatus = $app['status'];

        // Update application
        $updateStmt = $conn->prepare("
            UPDATE installment_applications 
            SET status = 'denied', denial_reason = ?, denied_by = ?, denied_at = NOW(), updated_at = NOW() 
            WHERE id = ?
        ");
        if ($updateStmt) {
            $updateStmt->bind_param('ssi', $reason, $adminEmail, $applicationId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        // Record history
        $histStmt = $conn->prepare("
            INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
            VALUES (?, ?, 'denied', ?, ?)
        ");
        if ($histStmt) {
            $histStmt->bind_param('isss', $applicationId, $previousStatus, $adminEmail, $reason);
            $histStmt->execute();
            $histStmt->close();
        }

        // Create user notification
        $userNotifStmt = $conn->prepare("
            INSERT INTO application_user_notifications (application_id, user_uid, notification_type, title, message)
            VALUES (?, ?, 'denied', 'Application Update', ?)
        ");
        if ($userNotifStmt) {
            $userMessage = "Your installment application ({$app['reference']}) for {$app['gadget_name']} was not approved. " . ($reason ? "Reason: {$reason}" : "Please contact support for more information.");
            $userNotifStmt->bind_param('iss', $applicationId, $app['user_uid'], $userMessage);
            $userNotifStmt->execute();
            $userNotifStmt->close();
        }

        // Add to dashboard notifications
        $dashNotifStmt = $conn->prepare("
            INSERT INTO user_notifications (user_uid, title, message, type, link)
            VALUES (?, 'Application Update', ?, 'warning', '/dashboard/applications')
        ");
        if ($dashNotifStmt) {
            $dashMessage = "Your application for {$app['gadget_name']} requires attention. Please check your dashboard.";
            $dashNotifStmt->bind_param('ss', $app['user_uid'], $dashMessage);
            $dashNotifStmt->execute();
            $dashNotifStmt->close();
        }

        // Send denial email
        try {
            $mail = getMailer();
            if ($mail) {
                $mail->addAddress($app['email'], $app['full_name']);
                $mail->Subject = 'Application Update - ' . $app['reference'];
                $mail->Body = "
                    <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
                        <div style='background:#f59e0b;padding:30px;border-radius:10px;'>
                            <h1 style='color:white;margin:0;'>Application Update</h1>
                        </div>
                        <div style='padding:30px;background:#f8f9fa;'>
                            <p>Hi <strong>{$app['full_name']}</strong>,</p>
                            <p>We've reviewed your installment application ({$app['reference']}) and unfortunately, we're unable to approve it at this time.</p>
                            " . ($reason ? "<p><strong>Reason:</strong> {$reason}</p>" : "") . "
                            <p>If you believe this was a mistake or have additional documentation, please contact our support team.</p>
                            <a href='mailto:support@itsxtrapush.com' style='display:inline-block;background:#0f172a;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin-top:20px;'>Contact Support</a>
                        </div>
                    </div>
                ";
                $mail->send();
            }
        } catch (Throwable $e) {
            error_log('Denial email error: ' . $e->getMessage());
        }

        json_ok(['success' => true, 'message' => 'Application denied']);
        exit;
    }

    // Admin: Request additional documents
    if ($method === 'POST' && preg_match('#^/(api/)?admin/installments/applications/(\d+)/request-docs/?$#', $path, $m)) {
        $applicationId = (int)$m[2];
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        $documentsNeeded = $input['documentsNeeded'] ?? [];
        $adminEmail = $input['adminEmail'] ?? 'admin';

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        // Get application
        $stmt = $conn->prepare("SELECT * FROM installment_applications WHERE id = ?");
        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $app = $result->fetch_assoc();
        $stmt->close();

        if (!$app) {
            json_error('Application not found', 404);
        }

        $previousStatus = $app['status'];
        $docsJson = json_encode($documentsNeeded);

        // Update application
        $updateStmt = $conn->prepare("
            UPDATE installment_applications 
            SET status = 'documents_requested', documents_requested = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        if ($updateStmt) {
            $updateStmt->bind_param('si', $docsJson, $applicationId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        // Record history
        $histStmt = $conn->prepare("
            INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
            VALUES (?, ?, 'documents_requested', ?, ?)
        ");
        if ($histStmt) {
            $notes = 'Documents requested: ' . implode(', ', $documentsNeeded);
            $histStmt->bind_param('isss', $applicationId, $previousStatus, $adminEmail, $notes);
            $histStmt->execute();
            $histStmt->close();
        }

        // Create user notification
        $userNotifStmt = $conn->prepare("
            INSERT INTO application_user_notifications (application_id, user_uid, notification_type, title, message)
            VALUES (?, ?, 'documents_requested', 'Additional Documents Needed', ?)
        ");
        if ($userNotifStmt) {
            $docsList = implode(', ', $documentsNeeded);
            $userMessage = "Please upload additional documents for your application ({$app['reference']}): {$docsList}";
            $userNotifStmt->bind_param('iss', $applicationId, $app['user_uid'], $userMessage);
            $userNotifStmt->execute();
            $userNotifStmt->close();
        }

        // Add to dashboard notifications
        $dashNotifStmt = $conn->prepare("
            INSERT INTO user_notifications (user_uid, title, message, type, link)
            VALUES (?, 'Documents Needed', ?, 'warning', '/dashboard/applications')
        ");
        if ($dashNotifStmt) {
            $dashMessage = "Additional documents needed for your {$app['gadget_name']} application.";
            $dashNotifStmt->bind_param('ss', $app['user_uid'], $dashMessage);
            $dashNotifStmt->execute();
            $dashNotifStmt->close();
        }

        json_ok(['success' => true, 'message' => 'Document request sent']);
        exit;
    }

    // Admin: Get unread notifications
    if ($method === 'GET' && preg_match('#^/(api/)?admin/installments/notifications/?$#', $path)) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        ensure_installment_applications_tables($conn);

        $stmt = $conn->prepare("
            SELECT aan.*, ia.reference, ia.full_name, ia.gadget_name
            FROM application_admin_notifications aan
            JOIN installment_applications ia ON aan.application_id = ia.id
            ORDER BY aan.created_at DESC
            LIMIT 50
        ");

        if (!$stmt) {
            json_ok(['success' => true, 'notifications' => []]);
            exit;
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                'id' => $row['id'],
                'applicationId' => $row['application_id'],
                'reference' => $row['reference'],
                'customerName' => $row['full_name'],
                'gadgetName' => $row['gadget_name'],
                'type' => $row['notification_type'],
                'message' => $row['message'],
                'isRead' => (bool)$row['is_read'],
                'createdAt' => $row['created_at']
            ];
        }
        $stmt->close();

        json_ok(['success' => true, 'notifications' => $notifications]);
        exit;
    }

    // Admin: Mark notification as read
    if ($method === 'PUT' && preg_match('#^/(api/)?admin/installments/notifications/(\d+)/read/?$#', $path, $m)) {
        $notificationId = (int)$m[2];

        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();

        if (!$conn || $conn->connect_errno) {
            json_error('Database unavailable', 503);
        }

        $stmt = $conn->prepare("UPDATE application_admin_notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?");
        if ($stmt) {
            $stmt->bind_param('i', $notificationId);
            $stmt->execute();
            $stmt->close();
        }

        json_ok(['success' => true, 'message' => 'Notification marked as read']);
        exit;
    }

    // ========== APPOINTMENT MANAGEMENT ENDPOINTS ==========
    
    // Helper: Get available time slots for a specific date and location
    // Returns 30-min slots from 9:00 AM to 5:00 PM, excluding booked times
    function get_available_slots($appointmentDate, $locationId) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        // Business hours: 9 AM to 5 PM (17:00 in 24hr format)
        // Available in 30-minute slots
        $slots = [];
        for ($hour = 9; $hour < 17; $hour++) {
            $slots[] = sprintf('%02d:00', $hour);
            $slots[] = sprintf('%02d:30', $hour);
        }
        
        // If database available, remove booked times
        if ($conn && !$conn->connect_errno) {
            $stmt = $conn->prepare(
                "SELECT appointment_time FROM appointments 
                 WHERE appointment_date = ? AND location_id = ? AND status = 'scheduled'"
            );
            if ($stmt) {
                $stmt->bind_param('ss', $appointmentDate, $locationId);
                $stmt->execute();
                $result = $stmt->get_result();
                $booked = [];
                while ($row = $result->fetch_assoc()) {
                    $booked[] = $row['appointment_time'];
                }
                $stmt->close();
                
                // Filter out booked slots
                $slots = array_diff($slots, $booked);
                $slots = array_values($slots); // Re-index
            }
        }
        
        return $slots;
    }
    
    // Helper: Check if user has any active/scheduled appointments
    function user_has_active_appointment($userId) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            return false; // Can't check, so allow (fail open)
        }
        
        $stmt = $conn->prepare(
            "SELECT id FROM appointments 
             WHERE user_id = ? AND status = 'scheduled' 
             LIMIT 1"
        );
        if (!$stmt) { return false; }
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $has_active = $result->num_rows > 0;
        $stmt->close();
        
        return $has_active;
    }
    
    // Helper: Check for time slot conflicts with other users
    function has_time_conflict($appointmentDate, $appointmentTime, $locationId, $excludeUserId = null) {
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            return false; // Can't check, so allow (fail open)
        }
        
        // 30-minute buffer: user books 2:00-2:30, others can't book 1:30-3:00
        $timeObj = DateTime::createFromFormat('H:i', $appointmentTime);
        if (!$timeObj) { return false; }
        
        $startTime = $timeObj->sub(new DateInterval('PT30M'))->format('H:i');
        $endTime = DateTime::createFromFormat('H:i', $appointmentTime)->add(new DateInterval('PT30M'))->format('H:i');
        
        $query = "SELECT COUNT(*) as cnt FROM appointments 
                  WHERE appointment_date = ? 
                  AND location_id = ? 
                  AND status = 'scheduled'
                  AND (
                    (appointment_time >= ? AND appointment_time < ?) OR
                    (appointment_time > ? AND appointment_time <= ?)
                  )";
        $params = [$appointmentDate, $locationId, $startTime, $appointmentTime, $appointmentTime, $endTime];
        $types = 'ssssss';
        
        if ($excludeUserId) {
            $query .= " AND user_id != ?";
            $params[] = $excludeUserId;
            $types .= 'i';
        }
        
        $stmt = $conn->prepare($query);
        if (!$stmt) { return false; }
        
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        return ($result['cnt'] ?? 0) > 0;
    }
    
    // Endpoint: Create a new appointment with validation
    if ($method === 'POST' && ($path === '/appointments' || $path === '/api/appointments')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) { json_error('Invalid JSON'); }
        
        $gadgetId = intval($input['gadgetId'] ?? 0);
        $userId = intval($input['userId'] ?? 0);
        $appointmentDate = trim((string)($input['appointmentDate'] ?? ''));
        $appointmentTime = trim((string)($input['appointmentTime'] ?? ''));
        $locationId = trim((string)($input['locationId'] ?? ''));
        $locationName = trim((string)($input['locationName'] ?? ''));
        $userName = trim((string)($input['userName'] ?? ''));
        $userEmail = trim((string)($input['userEmail'] ?? ''));
        
        // Validations
        if ($gadgetId <= 0) { json_error('Invalid gadgetId', 422); }
        if ($userId <= 0) { json_error('Invalid userId', 422); }
        if (!$appointmentDate || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $appointmentDate)) { 
            json_error('Invalid appointment date (use YYYY-MM-DD)', 422); 
        }
        if (!$appointmentTime || !preg_match('/^\d{2}:\d{2}$/', $appointmentTime)) { 
            json_error('Invalid appointment time (use HH:MM)', 422); 
        }
        if (!$locationId || !$locationName) { json_error('Invalid location', 422); }
        if (!$userEmail || !filter_var($userEmail, FILTER_VALIDATE_EMAIL)) { 
            json_error('Invalid user email', 422); 
        }
        
        // Check gadget stock
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        if ($conn && !$conn->connect_errno) {
            $stmt = $conn->prepare("SELECT stock_quantity FROM gadgets WHERE id = ? LIMIT 1");
            if ($stmt) {
                $stmt->bind_param('i', $gadgetId);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                
                if (!$result || intval($result['stock_quantity'] ?? 0) <= 0) {
                    json_error('Gadget is out of stock', 422);
                }
            }
        }
        
        // Check date is in the future and within 90 days
        $today = new DateTime('today');
        $apptDate = DateTime::createFromFormat('Y-m-d', $appointmentDate);
        if (!$apptDate || $apptDate < $today) {
            json_error('Appointment date must be in the future', 422);
        }
        $maxDate = (new DateTime())->add(new DateInterval('P90D'));
        if ($apptDate > $maxDate) {
            json_error('Appointments can only be booked up to 90 days in advance', 422);
        }
        
        // Check day of week (Monday-Saturday only)
        $dayOfWeek = $apptDate->format('N'); // 1=Mon, 7=Sun
        if ($dayOfWeek == 7) {
            json_error('Appointments not available on Sundays', 422);
        }
        
        // Check time is within business hours (9 AM to 5 PM)
        $hour = intval(substr($appointmentTime, 0, 2));
        if ($hour < 9 || $hour >= 17) {
            json_error('Appointments available from 9:00 AM to 5:00 PM only', 422);
        }
        
        // Check user doesn't have another active appointment
        if (user_has_active_appointment($userId)) {
            json_error('You already have an active appointment. Please complete or cancel it first.', 409);
        }
        
        // Check for time conflicts with other users
        if (has_time_conflict($appointmentDate, $appointmentTime, $locationId, $userId)) {
            json_error('This time slot is no longer available. Please choose another.', 409);
        }
        
        // Create appointment in database
        if ($conn && !$conn->connect_errno) {
            $stmt = $conn->prepare(
                "INSERT INTO appointments 
                 (gadget_id, user_id, appointment_date, appointment_time, location_id, location_name, user_name, user_email, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')"
            );
            if ($stmt) {
                $stmt->bind_param(
                    'iisssss',
                    $gadgetId, $userId, $appointmentDate, $appointmentTime, 
                    $locationId, $locationName, $userName, $userEmail
                );
                if (!$stmt->execute()) {
                    $stmt->close();
                    json_error('Failed to create appointment: ' . $conn->error, 500);
                }
                $appointmentId = $conn->insert_id;
                $stmt->close();
                
                // Send confirmation emails
                try {
                    $mail = getMailer();
                    if ($mail) {
                        // Customer confirmation email
                        $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
                        $mail->addAddress($userEmail, $userName);
                        $mail->Subject = 'Appointment Confirmed — Xtrapush Gadget Viewing';
                        
                        $formattedDate = (new DateTime($appointmentDate))->format('l, F j, Y');
                        $mail->Body = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                            . '<h2 style="margin-top:0;color:#48CEDB">Appointment Confirmed</h2>'
                            . '<p>Hello ' . htmlspecialchars($userName, ENT_QUOTES) . ',</p>'
                            . '<p>Your gadget viewing appointment has been successfully booked. Here are the details:</p>'
                            . '<div style="background:#f0f0f0;padding:12px;border-radius:6px;margin:12px 0">'
                            . '<p><strong>Date & Time:</strong> ' . $formattedDate . ' at ' . $appointmentTime . '</p>'
                            . '<p><strong>Location:</strong> ' . htmlspecialchars($locationName, ENT_QUOTES) . '</p>'
                            . '<p><strong>Gadget:</strong> ' . htmlspecialchars($input['gadgetName'] ?? 'Item', ENT_QUOTES) . '</p>'
                            . '<p><strong>Confirmation:</strong> #' . str_pad($appointmentId, 6, '0', STR_PAD_LEFT) . '</p>'
                            . '</div>'
                            . '<p>If you need to cancel or reschedule, please contact us at least 24 hours before your appointment.</p>'
                            . '<p>Thank you for choosing Xtrapush!</p>'
                            . '</div>';
                        $mail->send();
                        
                        // Admin notification with customer CC
                        $mail2 = getMailer();
                        if ($mail2) {
                            $mail2->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
                            $mail2->addAddress('conradzikomo@gmail.com', 'Xtrapush Admin');
                            $mail2->addCC($userEmail, $userName);
                            $mail2->addReplyTo($userEmail, $userName);
                            $mail2->Subject = 'New Appointment Booking: ' . htmlspecialchars($input['gadgetName'] ?? 'Gadget', ENT_QUOTES) . ' (' . $formattedDate . ' ' . $appointmentTime . ')';
                            
                            $mail2->Body = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                                . '<h3>New Gadget Viewing Appointment</h3>'
                                . '<p><strong>Appointment ID:</strong> #' . str_pad($appointmentId, 6, '0', STR_PAD_LEFT) . '</p>'
                                . '<p><strong>Customer:</strong> ' . htmlspecialchars($userName, ENT_QUOTES) . ' (' . htmlspecialchars($userEmail, ENT_QUOTES) . ')</p>'
                                . '<p><strong>Gadget:</strong> ' . htmlspecialchars($input['gadgetName'] ?? 'Item', ENT_QUOTES) . ' (ID: ' . $gadgetId . ')</p>'
                                . '<p><strong>Date & Time:</strong> ' . $formattedDate . ' at ' . $appointmentTime . '</p>'
                                . '<p><strong>Location:</strong> ' . htmlspecialchars($locationName, ENT_QUOTES) . '</p>'
                                . '<p><strong>Status:</strong> Scheduled</p>'
                                . '</div>';
                            $mail2->send();
                        }
                    }
                } catch (Throwable $e) {
                    error_log('Appointment email send error: ' . $e->getMessage());
                    // Non-blocking: don't fail the appointment creation if emails fail
                }
                
                json_ok(['success' => true, 'appointmentId' => $appointmentId, 'message' => 'Appointment booked successfully']);
                exit;
            }
        }
        
        json_error('Failed to create appointment', 500);
    }
    
    // Endpoint: Get available slots for a specific date and location
    if ($method === 'GET' && ($path === '/appointments/available-slots' || $path === '/api/appointments/available-slots')) {
        $date = isset($_GET['date']) ? trim($_GET['date']) : '';
        $locationId = isset($_GET['locationId']) ? trim($_GET['locationId']) : '';
        
        if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            json_error('Invalid date (use YYYY-MM-DD)', 422);
        }
        if (!$locationId) {
            json_error('Invalid locationId', 422);
        }
        
        // Validate date is in future
        $apptDate = DateTime::createFromFormat('Y-m-d', $date);
        $today = new DateTime('today');
        if (!$apptDate || $apptDate < $today) {
            json_error('Date must be in the future', 422);
        }
        
        // Check day of week
        $dayOfWeek = $apptDate->format('N');
        if ($dayOfWeek == 7) {
            json_ok(['slots' => [], 'message' => 'No appointments available on Sundays']);
            exit;
        }
        
        $slots = get_available_slots($date, $locationId);
        json_ok(['success' => true, 'slots' => $slots, 'date' => $date]);
    }
    
    // Endpoint: Check if user has active appointment
    if ($method === 'GET' && ($path === '/appointments/user-active' || $path === '/api/appointments/user-active')) {
        $userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
        
        if ($userId <= 0) {
            json_error('Invalid userId', 422);
        }
        
        $hasActive = user_has_active_appointment($userId);
        json_ok(['success' => true, 'hasActive' => $hasActive]);
    }
    
    // Endpoint: Get user's appointments
    if ($method === 'GET' && ($path === '/appointments/user' || $path === '/api/appointments/user')) {
        $userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
        
        if ($userId <= 0) {
            json_error('Invalid userId', 422);
        }
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database connection failed', 500);
        }
        
        $stmt = $conn->prepare(
            "SELECT * FROM appointments 
             WHERE user_id = ? 
             ORDER BY appointment_date DESC, appointment_time DESC"
        );
        if (!$stmt) {
            json_error('Query failed', 500);
        }
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $appointments = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        json_ok(['success' => true, 'appointments' => $appointments]);
    }
    
    // Endpoint: Cancel appointment
    if ($method === 'POST' && ($path === '/appointments/cancel' || $path === '/api/appointments/cancel')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) { json_error('Invalid JSON'); }
        
        $appointmentId = intval($input['appointmentId'] ?? 0);
        $userId = intval($input['userId'] ?? 0);
        $reason = trim((string)($input['reason'] ?? 'User requested'));
        
        if ($appointmentId <= 0 || $userId <= 0) {
            json_error('Invalid appointmentId or userId', 422);
        }
        
        $db = DatabaseConnection::getInstance();
        $conn = $db->getConnection();
        
        if (!$conn || $conn->connect_errno) {
            json_error('Database connection failed', 500);
        }
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT * FROM appointments WHERE id = ? AND user_id = ? LIMIT 1");
        if (!$stmt) {
            json_error('Query failed', 500);
        }
        
        $stmt->bind_param('ii', $appointmentId, $userId);
        $stmt->execute();
        $apptResult = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        
        if (!$apptResult) {
            json_error('Appointment not found or unauthorized', 404);
        }
        
        // Update status to cancelled
        $stmt = $conn->prepare(
            "UPDATE appointments SET status = 'cancelled', notes = ? WHERE id = ?"
        );
        if (!$stmt) {
            json_error('Update failed', 500);
        }
        
        $stmt->bind_param('si', $reason, $appointmentId);
        $stmt->execute();
        $stmt->close();
        
        json_ok(['success' => true, 'message' => 'Appointment cancelled successfully']);
    }

    // Bookings: forward appointment bookings via PHPMailer
    if ($method === 'POST' && ($path === '/bookings' || $path === '/bookings/send' || $path === '/api/bookings' || $path === '/api/bookings/send')) {
        // Parse JSON body
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) { $input = $_POST; }

        // Extract and sanitize fields
        $gadgetId = trim((string)($input['gadgetId'] ?? ''));
        $gadgetName = trim((string)($input['gadgetName'] ?? ''));
        $date = trim((string)($input['date'] ?? ''));
        $time = trim((string)($input['time'] ?? ''));
        $locationId = trim((string)($input['locationId'] ?? ''));
        $locationName = trim((string)($input['locationName'] ?? ''));
        $userId = trim((string)($input['userId'] ?? ''));
        $userName = trim((string)($input['userName'] ?? ''));
        $userEmail = trim((string)($input['userEmail'] ?? ''));

        if ($gadgetName === '' || $date === '' || $time === '' || $locationName === '') {
            json_error('Missing required fields: gadgetName, date, time, locationName', 422);
        }
        if ($userEmail !== '' && !filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
            json_error('Invalid user email address', 422);
        }

        try {
            $mail = getMailer();
            if (!$mail) {
                json_error('PHPMailer not installed. Please upload vendor/ or run composer install.', 500);
            }

            // Sender and recipient
            $mail->setFrom(MAIL_FROM ?: 'no-reply@support.itsxtrapush.com', MAIL_FROM_NAME ?: 'Xtrapush Gadgets');
            $mail->addAddress('conradzikomo@gmail.com', 'Xtrapush Admin');
            // CC the customer so they have a record of their booking
            if ($userEmail && filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($userEmail, ($userName ?: 'Customer'));
            }
            if ($userEmail) { $mail->addReplyTo($userEmail, ($userName ?: 'Customer')); }

            // Content
            $subjectParts = [];
            $subjectParts[] = $gadgetName !== '' ? $gadgetName : 'Gadget Viewing';
            $subjectParts[] = ($date !== '' && $time !== '') ? ($date . ' ' . $time) : '';
            $subjectParts[] = $locationName !== '' ? ('@ ' . $locationName) : '';
            $mail->Subject = 'New Booking: ' . implode(' ', array_filter($subjectParts));

            // Safe HTML body
            $body = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                . '<h3 style="margin-top:0">New Appointment Booking</h3>'
                . '<p><strong>Gadget:</strong> ' . htmlspecialchars($gadgetName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Gadget ID:</strong> ' . htmlspecialchars($gadgetId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Date:</strong> ' . htmlspecialchars($date, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Time:</strong> ' . htmlspecialchars($time, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>Location:</strong> ' . htmlspecialchars($locationName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ' (' . htmlspecialchars($locationId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ')</p>'
                . '<hr />'
                . '<p><strong>User Name:</strong> ' . htmlspecialchars($userName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>User ID:</strong> ' . htmlspecialchars($userId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '<p><strong>User Email:</strong> ' . htmlspecialchars($userEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
                . '</div>';
            $mail->Body = $body;
            $mail->AltBody = "New Booking\nGadget: $gadgetName\nGadget ID: $gadgetId\nDate: $date\nTime: $time\nLocation: $locationName ($locationId)\nUser: $userName\nUser ID: $userId\nUser Email: $userEmail";

            $mail->send();
            json_ok(['success' => true, 'message' => 'Booking forwarded successfully']);
            exit;
        } catch (Throwable $e) {
            error_log('PHPMailer booking send error: ' . $e->getMessage());
            json_error('Failed to forward booking', 500, ['details' => $e->getMessage()]);
            exit;
        }
    }

    // Analytics: Dashboard data endpoint
    if ($method === 'GET' && ($path === '/analytics/dashboard' || $path === '/api/analytics/dashboard')) {
        analytics_get_dashboard();
        exit;
    }

    // Not found
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found', 'method' => $method, 'path' => $path]);
    exit;
} catch (Throwable $e) {
    error_log('API router error: ' . $e->getMessage());
    json_error('Server error', 500);
}
// ---- Models Proxy (serve static models with CORS) ----
function serveModelsProxy() {
    try {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $rawUrl = $_GET['url'] ?? null;
        if (!$rawUrl) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing url parameter']);
            return;
        }

        $parsed = parse_url($rawUrl);
        $host = $parsed['host'] ?? ($_SERVER['HTTP_HOST'] ?? 'sparkle-pro.co.uk');
        $scheme = $parsed['scheme'] ?? 'https';
        $path = $parsed['path'] ?? $rawUrl;

        $allowedHosts = ['sparkle-pro.co.uk', 'www.sparkle-pro.co.uk'];
        if (!in_array($host, $allowedHosts, true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Host not allowed']);
            return;
        }

        // Only allow models directories
        if (!preg_match('#^/api/models/#', $path) && !preg_match('#^/models_extracted/#', $path)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid path: ' . $path]);
            return;
        }

        // Try local filesystem mapping first
        $relative = preg_replace('#^/api/models/#', '', $path);
        $localCandidates = [
            __DIR__ . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . $relative,
            __DIR__ . DIRECTORY_SEPARATOR . 'models_extracted' . DIRECTORY_SEPARATOR . $relative,
        ];

        $filePath = null;
        foreach ($localCandidates as $cand) {
            if (file_exists($cand)) { $filePath = $cand; break; }
        }

        if ($filePath) {
            // Set proper content type and stream file
            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mime = 'application/octet-stream';
            if ($ext === 'gltf') $mime = 'model/gltf+json';
            elseif ($ext === 'glb') $mime = 'model/gltf-binary';
            elseif ($ext === 'bin') $mime = 'application/octet-stream';
            elseif ($ext === 'png') $mime = 'image/png';
            elseif ($ext === 'jpg' || $ext === 'jpeg') $mime = 'image/jpeg';
            elseif ($ext === 'svg') $mime = 'image/svg+xml';
            elseif ($ext === 'mtl' || $ext === 'obj') $mime = 'text/plain';

            header_remove('Content-Type');
            header('Content-Type: ' . $mime);
            header('Cache-Control: public, max-age=3600');

            if ($method === 'HEAD') {
                http_response_code(200);
                return;
            }

            readfile($filePath);
            return;
        }

        // Fallback to upstream HTTP fetch
        $remoteUrl = $scheme . '://' . $host . $path;
        $ch = curl_init($remoteUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        if ($method === 'HEAD') { curl_setopt($ch, CURLOPT_NOBODY, true); }
        $response = curl_exec($ch);
        if ($response === false) {
            http_response_code(502);
            echo json_encode(['success' => false, 'error' => 'Upstream fetch failed']);
            curl_close($ch);
            return;
        }
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        curl_close($ch);

        // Propagate content type
        $mime = 'application/octet-stream';
        if (preg_match('/^Content-Type:\s*([^\r\n]+)/mi', $headers, $m)) {
            $mime = trim($m[1]);
        }
        header_remove('Content-Type');
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=3600');
        http_response_code($status);
        if ($method !== 'HEAD') { echo $body; }
    } catch (Throwable $e) {
        error_log('❌ models-proxy error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Proxy error']);
    }
}
    // Models proxy (redundant fallback; primary routing now handled before Not Found)
    if (($method === 'GET' || $method === 'HEAD') && ($path === '/models-proxy' || $path === '/api/models-proxy')) { serveModelsProxy(); exit; }