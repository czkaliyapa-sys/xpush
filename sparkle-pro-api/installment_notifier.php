<?php
// Standalone cron-friendly script to email installment reminders
// - Sends emails when a plan is halfway through its period
// - Sends emails when the plan has passed its last payment day (overdue)
// Uses same DB and PHPMailer settings as index.php

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
    error_log('Composer autoload not available: ' . $e->getMessage());
}

// ---- Database credentials (aligned with index.php) ----
if (!defined('DB_HOST')) { define('DB_HOST', 'localhost'); }
if (!defined('DB_NAME')) { define('DB_NAME', 'itsxtrapush_db'); }
if (!defined('DB_USER')) { define('DB_USER', 'xuser'); }
if (!defined('DB_PASS')) { define('DB_PASS', 'Xpush2025?'); }

// ---- SMTP config for PHPMailer (aligned with index.php) ----
if (!defined('SMTP_HOST')) { define('SMTP_HOST', getenv('mail.deegits.com') ?: ''); }
if (!defined('SMTP_USER')) { define('SMTP_USER', getenv('conrad@deegits.com') ?: ''); }
if (!defined('SMTP_PASS')) { define('SMTP_PASS', getenv('brickwall2010?') ?: ''); }
if (!defined('SMTP_PORT')) { define('SMTP_PORT', intval(getenv('SMTP_PORT') ?: 587)); }
if (!defined('SMTP_SECURE')) { define('SMTP_SECURE', getenv('SMTP_SECURE') ?: 'tls'); }
if (!defined('MAIL_FROM')) { define('MAIL_FROM', getenv('MAIL_FROM') ?: 'no-reply@sparkle-pro.co.uk'); }
if (!defined('MAIL_FROM_NAME')) { define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Xtrapush Support'); }

// Helper: configured PHPMailer instance
function getMailer() {
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) { return null; }
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
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
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->setFrom(MAIL_FROM ?: 'no-reply@sparkle-pro.co.uk', MAIL_FROM_NAME ?: 'Xtrapush Support');
    return $mail;
}

// Simple DB connection wrapper
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
        if (self::$instance === null) { self::$instance = new self(); }
        return self::$instance;
    }
    public function getConnection() { return $this->conn; }
}

// Ensure notifications table exists to prevent duplicate emails
function ensure_notifications_table($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS installment_notifications (\n"
         . "  id INT(11) NOT NULL AUTO_INCREMENT,\n"
         . "  plan_id INT(11) NOT NULL,\n"
         . "  type ENUM('halfway','overdue') NOT NULL,\n"
         . "  notified_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\n"
         . "  PRIMARY KEY (id),\n"
         . "  UNIQUE KEY uniq_plan_type (plan_id, type)\n"
         . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci";
    @$conn->query($sql);
}

// Check whether a notification of given type has been sent for this plan
function has_notified($conn, $planId, $type) {
    $stmt = $conn->prepare('SELECT id FROM installment_notifications WHERE plan_id = ? AND type = ? LIMIT 1');
    if (!$stmt) { return false; }
    $stmt->bind_param('is', $planId, $type);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return !!$res;
}

// Record that a notification was sent
function mark_notified($conn, $planId, $type) {
    $stmt = $conn->prepare('INSERT IGNORE INTO installment_notifications (plan_id, type, notified_at) VALUES (?, ?, NOW())');
    if ($stmt) { $stmt->bind_param('is', $planId, $type); $stmt->execute(); $stmt->close(); }
}

// Fetch active installment plans and associated user email
function fetch_active_plans($conn) {
    $plans = [];
    $sql = "SELECT p.id, p.order_id, p.user_id, p.status, p.start_at, p.expiry_at, p.next_due_at, p.period_days, p.weeks, p.deposit_amount, p.weekly_amount, p.total_amount, p.amount_paid, p.payments_made, u.email AS user_email, u.full_name AS user_name\n"
         . "FROM installment_plans p\n"
         . "LEFT JOIN users u ON u.id = p.user_id\n"
         . "WHERE p.status = 'ongoing'";
    $res = $conn->query($sql);
    if ($res) {
        while ($row = $res->fetch_assoc()) { $plans[] = $row; }
        $res->close();
    }
    return $plans;
}

function send_email($toEmail, $toName, $subject, $html, $altText = null) {
    $mail = getMailer();
    if (!$mail) { throw new RuntimeException('PHPMailer not installed.'); }
    $mail->setFrom(MAIL_FROM ?: 'no-reply@sparkle-pro.co.uk', MAIL_FROM_NAME ?: 'Xtrapush Support');
    $mail->addAddress($toEmail, $toName ?: 'Customer');
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = $altText ?: strip_tags($html);
    $mail->send();
}

function format_currency($amount, $currency = 'MWK') {
    $amt = number_format((float)$amount, 2);
    return $currency . ' ' . $amt;
}

function run_notifications() {
    $db = DatabaseConnection::getInstance();
    $conn = $db->getConnection();
    if (!$conn || $conn->connect_errno) { throw new RuntimeException('Database connection failed'); }

    ensure_notifications_table($conn);

    $plans = fetch_active_plans($conn);
    $now = new DateTime('now');

    $sentCount = 0; $errors = 0;
    foreach ($plans as $p) {
        $planId = (int)$p['id'];
        $weeks = (int)$p['weeks'];
        $periodDays = (int)$p['period_days'];
        $startAt = $p['start_at'] ? new DateTime($p['start_at']) : null;
        $expiryAt = $p['expiry_at'] ? new DateTime($p['expiry_at']) : null;
        $nextDueAt = $p['next_due_at'] ? new DateTime($p['next_due_at']) : null;
        $totalAmount = (float)$p['total_amount'];
        $amountPaid = (float)$p['amount_paid'];
        $weeklyAmount = (float)$p['weekly_amount'];
        $depositAmount = (float)$p['deposit_amount'];
        $paymentsMade = (int)$p['payments_made'];
        $remaining = max(0.0, $totalAmount - $amountPaid);
        $toEmail = trim((string)($p['user_email'] ?? ''));
        $toName = trim((string)($p['user_name'] ?? ''));

        if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            // Skip plans without a valid user email
            continue;
        }

        // Skip if already fully paid
        if ($totalAmount > 0 && $amountPaid >= $totalAmount) { continue; }

        // --- Halfway notification (>= 50% elapsed days since start) ---
        if ($startAt && $weeks >= 2) {
            $totalDays = max(1, $weeks * $periodDays);
            $elapsedInterval = $startAt->diff($now);
            $elapsedDays = (int)$elapsedInterval->days;
            $progress = $elapsedDays / $totalDays;

            if ($progress >= 0.5 && !has_notified($conn, $planId, 'halfway')) {
                $subject = 'Xtrapush Installments: You’re halfway through your plan';
                $html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                     . '<h3 style="margin-top:0">You’re Halfway There 🎯</h3>'
                     . '<p>Great progress on your Xtrapush installment plan for order #' . htmlspecialchars((string)$p['order_id']) . '.</p>'
                     . '<p><strong>Total Plan:</strong> ' . format_currency($totalAmount) . '</p>'
                     . '<p><strong>Deposit:</strong> ' . format_currency($depositAmount) . '</p>'
                     . '<p><strong>Weekly Amount:</strong> ' . format_currency($weeklyAmount) . ' (' . $weeks . ' weeks)</p>'
                     . '<p><strong>Paid So Far:</strong> ' . format_currency($amountPaid) . '</p>'
                     . '<p><strong>Remaining Balance:</strong> ' . format_currency($remaining) . '</p>'
                     . ($nextDueAt ? ('<p><strong>Next Due Date:</strong> ' . $nextDueAt->format('Y-m-d') . '</p>') : '')
                     . ($expiryAt ? ('<p><strong>Final Date:</strong> ' . $expiryAt->format('Y-m-d') . '</p>') : '')
                     . '<hr />'
                     . '<p>If you need help or have questions, simply reply to this email.</p>'
                     . '<p>— Xtrapush Installments Team</p>'
                     . '</div>';
                try {
                    send_email($toEmail, $toName, $subject, $html);
                    mark_notified($conn, $planId, 'halfway');
                    $sentCount++;
                } catch (Throwable $e) {
                    $errors++;
                    error_log('Halfway email error (plan ' . $planId . '): ' . $e->getMessage());
                }
            }
        }

        // --- Overdue notification (passed last day) ---
        if ($expiryAt) {
            // Trigger on or after the expiry calendar day, only once
            if ($now >= $expiryAt && !has_notified($conn, $planId, 'overdue')) {
                $subject = 'Xtrapush Installments: Your payment period has ended';
                $html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
                     . '<h3 style="margin-top:0">Payment Period Ended ⏳</h3>'
                     . '<p>Your Xtrapush installment plan for order #' . htmlspecialchars((string)$p['order_id']) . ' has reached its final day.</p>'
                     . '<p><strong>Total Plan:</strong> ' . format_currency($totalAmount) . '</p>'
                     . '<p><strong>Paid So Far:</strong> ' . format_currency($amountPaid) . '</p>'
                     . '<p><strong>Outstanding Balance:</strong> ' . format_currency($remaining) . '</p>'
                     . '<p>Please arrange the remaining payment or reply to this email if you need assistance.</p>'
                     . '<p><strong>Final Date:</strong> ' . $expiryAt->format('Y-m-d') . '</p>'
                     . '<hr />'
                     . '<p>We’re here to help. Reply anytime.</p>'
                     . '<p>— Xtrapush Installments Team</p>'
                     . '</div>';
                try {
                    send_email($toEmail, $toName, $subject, $html);
                    mark_notified($conn, $planId, 'overdue');
                    $sentCount++;
                } catch (Throwable $e) {
                    $errors++;
                    error_log('Overdue email error (plan ' . $planId . '): ' . $e->getMessage());
                }
            }
        }
    }

    // Basic CLI output
    echo '[' . date('Y-m-d H:i:s') . "] installment_notifier: sent=" . $sentCount . " errors=" . $errors . "\n";
}

// Run if executed directly (CLI or web)
try {
    run_notifications();
} catch (Throwable $e) {
    http_response_code(500);
    $msg = 'installment_notifier failed: ' . $e->getMessage();
    error_log($msg);
    echo $msg . "\n";
}

?>