<?php
/**
 * Fixed Email Notification System for Payment Success
 * This replaces the faulty email configuration with proper PHPMailer setup
 */

// Proper SMTP Configuration - Hardcoded values since environment vars aren't working
define('SMTP_HOST', 'mail.deegits.com');
define('SMTP_USER', 'conrad@deegits.com');
define('SMTP_PASS', 'brickwall2010?');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');
define('MAIL_FROM', 'conrad@deegits.com');
define('MAIL_FROM_NAME', 'Xtrapush Support');

/**
 * Enhanced PHPMailer initialization with better error handling
 */
function getMailer() {
    // Check if PHPMailer is available
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        error_log('PHPMailer class not found - falling back to basic mail()');
        return null;
    }

    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // Configure SMTP settings
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
        
        // Additional SMTP settings for reliability
        $mail->SMTPDebug = 0; // 0 = off, 1 = client messages, 2 = client and server messages
        $mail->Timeout = 30;
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        // Email defaults
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        
        return $mail;
        
    } catch (Exception $e) {
        error_log('PHPMailer initialization failed: ' . $e->getMessage());
        return null;
    }
}

/**
 * Robust email sending function with fallback
 */
function sendPaymentNotificationEmail($to, $subject, $htmlBody, $altBody = '', $cc = null) {
    $mail = getMailer();
    
    // If PHPMailer fails, try basic mail() as fallback
    if (!$mail) {
        return sendBasicEmail($to, $subject, $htmlBody, $cc);
    }
    
    try {
        $mail->clearAllRecipients();
        $mail->addAddress($to);
        
        if ($cc && filter_var($cc, FILTER_VALIDATE_EMAIL)) {
            $mail->addCC($cc);
        }
        
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = $altBody ?: strip_tags($htmlBody);
        
        $result = $mail->send();
        
        if ($result) {
            error_log("✅ Email sent successfully to: $to");
            return true;
        } else {
            error_log("❌ PHPMailer failed to send email to: $to");
            return false;
        }
        
    } catch (Exception $e) {
        error_log("💥 PHPMailer exception for $to: " . $e->getMessage());
        // Try fallback
        return sendBasicEmail($to, $subject, $htmlBody, $cc);
    }
}

/**
 * Fallback email function using PHP's mail()
 */
function sendBasicEmail($to, $subject, $htmlBody, $cc = null) {
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
        'Reply-To: ' . MAIL_FROM
    ];
    
    if ($cc && filter_var($cc, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Cc: ' . $cc;
    }
    
    $result = mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    
    if ($result) {
        error_log("✅ Basic email sent successfully to: $to");
        return true;
    } else {
        error_log("❌ Basic mail() failed to send email to: $to");
        return false;
    }
}

/**
 * Send payment confirmation to customer
 */
function sendCustomerPaymentConfirmation($customerEmail, $txRef, $amount, $currency, $items = [], $installmentPlan = null) {
    if (!$customerEmail || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        error_log("❌ Invalid customer email: $customerEmail");
        return ['sent' => false, 'reason' => 'invalid_email'];
    }
    
    $formattedAmount = number_format($amount, 2, '.', ',');
    $currencyCode = $currency ?: 'MWK';
    
    // HTML email template
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation - Xtrapush</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center;">
                <h1 style="color: #48CEDB; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
                <p style="color: #cbd5e1; margin: 10px 0 0; font-size: 16px;">Thank you for your purchase</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <h2 style="color: #0f172a; margin-top: 0;">Order Details</h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>Reference:</strong></div>
                        <div style="text-align: right; font-weight: 600;">' . htmlspecialchars($txRef) . '</div>
                        
                        <div><strong>Amount:</strong></div>
                        <div style="text-align: right; font-weight: 600; color: #059669;">' . $currencyCode . ' ' . $formattedAmount . '</div>
                        
                        <div><strong>Status:</strong></div>
                        <div style="text-align: right; font-weight: 600; color: #059669;">Completed</div>
                    </div>
                </div>';
    
    // Add items if provided
    if (!empty($items)) {
        $htmlBody .= '
                <h3 style="color: #0f172a; margin: 25px 0 15px;">Purchased Items</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">';
        
        foreach ($items as $item) {
            $itemName = htmlspecialchars($item['name'] ?? $item['title'] ?? 'Item');
            $itemPrice = number_format($item['price'] ?? 0, 2);
            $itemQuantity = intval($item['quantity'] ?? 1);
            
            $htmlBody .= '
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                        <div>
                            <strong>' . $itemName . '</strong>
                            <br><small>Qty: ' . $itemQuantity . '</small>
                        </div>
                        <div style="text-align: right;">
                            ' . $currencyCode . ' ' . $itemPrice . '
                        </div>
                    </div>';
        }
        
        $htmlBody .= '
                </div>';
    }
    
    // Add installment details if applicable
    if (!empty($installmentPlan)) {
        $htmlBody .= '
                <h3 style="color: #0f172a; margin: 25px 0 15px;">Installment Plan</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>Type:</div><div style="text-align: right;">' . htmlspecialchars($installmentPlan['type'] ?? 'Standard') . '</div>
                        <div>Weeks:</div><div style="text-align: right;">' . ($installmentPlan['weeks'] ?? 'N/A') . '</div>
                        <div>Weekly Amount:</div><div style="text-align: right;">' . $currencyCode . ' ' . number_format($installmentPlan['weeklyAmount'] ?? 0, 2) . '</div>
                    </div>
                </div>';
    }
    
    $htmlBody .= '
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; margin: 0;">
                        Need help? Reply to this email or contact us at<br>
                        <strong>conrad@itsxtrapush.com</strong>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">&copy; 2026 Xtrapush Gadgets. All rights reserved.</p>
                <p style="margin: 5px 0 0;">Blantyre, Malawi</p>
            </div>
        </div>
    </body>
    </html>';
    
    $altBody = "Payment Confirmation\nReference: $txRef\nAmount: $currencyCode $formattedAmount\nStatus: Completed";
    
    $sent = sendPaymentNotificationEmail($customerEmail, 'Payment Confirmation - Xtrapush', $htmlBody, $altBody);
    
    return ['sent' => $sent, 'email' => $customerEmail];
}

/**
 * Send admin notification
 */
function sendAdminPaymentNotification($txRef, $amount, $currency, $customerEmail, $items = [], $installmentPlan = null) {
    $adminEmail = 'conradzikomo@gmail.com';
    $formattedAmount = number_format($amount, 2, '.', ',');
    $currencyCode = $currency ?: 'MWK';
    
    // HTML email template for admin
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Payment Received - Xtrapush Admin</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">💰 NEW PAYMENT RECEIVED</h1>
                <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">Payment processed successfully</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <h2 style="color: #0f172a; margin-top: 0;">Transaction Details</h2>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>Reference:</strong></div>
                        <div style="text-align: right; font-weight: 600; color: #dc2626;">' . htmlspecialchars($txRef) . '</div>
                        
                        <div><strong>Amount:</strong></div>
                        <div style="text-align: right; font-weight: 600; color: #dc2626;">' . $currencyCode . ' ' . $formattedAmount . '</div>
                        
                        <div><strong>Customer:</strong></div>
                        <div style="text-align: right;">' . ($customerEmail ? htmlspecialchars($customerEmail) : 'N/A') . '</div>
                        
                        <div><strong>Status:</strong></div>
                        <div style="text-align: right; font-weight: 600; color: #059669;">SUCCESS</div>
                    </div>
                </div>';
    
    // Add items summary
    if (!empty($items)) {
        $htmlBody .= '
                <h3 style="color: #0f172a; margin: 25px 0 15px;">Items Purchased (' . count($items) . ')</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">';
        
        foreach ($items as $item) {
            $itemName = htmlspecialchars($item['name'] ?? $item['title'] ?? 'Item');
            $htmlBody .= '
                    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                        • ' . $itemName . '
                    </div>';
        }
        
        $htmlBody .= '
                </div>';
    }
    
    $htmlBody .= '
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
                    <p style="color: #0369a1; margin: 0; font-weight: 600;">
                        📊 Check admin dashboard for full order details
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">Payment Notification System</p>
                <p style="margin: 5px 0 0;">Generated at ' . date('Y-m-d H:i:s') . '</p>
            </div>
        </div>
    </body>
    </html>';
    
    $altBody = "New Payment Alert\nReference: $txRef\nAmount: $currencyCode $formattedAmount\nCustomer: $customerEmail\nStatus: SUCCESS";
    
    // Send to admin with customer CC'd
    $sent = sendPaymentNotificationEmail($adminEmail, '🚨 New Payment Received - Xtrapush', $htmlBody, $altBody, $customerEmail);
    
    return $sent;
}

/**
 * Main payment notification function - this replaces the faulty endpoint
 */
function sendPaymentNotifications($txRef, $amount, $currency, $customerEmail, $items = [], $installmentPlan = null) {
    error_log("📧 Starting payment notification process for: $txRef");
    
    // Send customer confirmation
    $customerResult = sendCustomerPaymentConfirmation($customerEmail, $txRef, $amount, $currency, $items, $installmentPlan);
    
    // Send admin notification
    $adminResult = sendAdminPaymentNotification($txRef, $amount, $currency, $customerEmail, $items, $installmentPlan);
    
    $results = [
        'customer' => $customerResult,
        'admin' => $adminResult,
        'timestamp' => date('c')
    ];
    
    error_log("📧 Payment notification results: " . json_encode($results));
    
    return $results;
}

// Test the email system
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    echo "🧪 Testing Email Notification System...\n";
    
    $testResult = sendPaymentNotifications(
        'TEST-' . time(),
        12500,
        'MWK',
        'conradzikomo@gmail.com',
        [
            ['name' => 'iPhone 15 Pro', 'price' => 12500, 'quantity' => 1]
        ]
    );
    
    echo "Test Result: " . json_encode($testResult, JSON_PRETTY_PRINT) . "\n";
}
?>