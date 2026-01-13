-- =============================================================================
-- INSTALLMENT APPLICATIONS SYSTEM
-- Created: 2026-01-07
-- Description: Tables for installment application system with document uploads,
--              admin approval workflow, and user notifications
-- =============================================================================

-- Installment Applications Table
-- Stores all installment applications submitted by users
CREATE TABLE IF NOT EXISTS installment_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    
    -- Gadget/Product Information
    gadget_id INT,
    gadget_name VARCHAR(255),
    variant_id INT,
    variant_storage VARCHAR(100),
    variant_color VARCHAR(100),
    variant_condition VARCHAR(50),
    
    -- Installment Plan Details
    plan_type ENUM('pay-to-own', 'pay-as-you-go', 'pay-to-lease') NOT NULL,
    plan_weeks INT NOT NULL,
    deposit_amount DECIMAL(12,2) NOT NULL,
    weekly_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MWK',
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    national_id VARCHAR(100),
    address TEXT,
    town VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Malawi',
    
    -- Employment Information
    employment_status VARCHAR(100),
    employer_name VARCHAR(255),
    job_title VARCHAR(255),
    monthly_income VARCHAR(100),
    employment_duration VARCHAR(100),
    employer_phone VARCHAR(50),
    employer_address TEXT,
    
    -- Application Status
    status ENUM('pending', 'under_review', 'documents_requested', 'approved', 'denied', 'cancelled') DEFAULT 'pending',
    admin_notes TEXT,
    denial_reason TEXT,
    documents_requested TEXT, -- JSON array of additional documents needed
    
    -- Approval Info
    approved_by VARCHAR(255),
    approved_at DATETIME,
    denied_by VARCHAR(255),
    denied_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_uid (user_uid),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_gadget_id (gadget_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application Documents Table
-- Stores document uploads for applications
CREATE TABLE IF NOT EXISTS application_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_type ENUM('national_id_front', 'national_id_back', 'proof_of_address', 'proof_of_income', 'selfie', 'other') NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    
    -- Verification status
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at DATETIME,
    verification_notes TEXT,
    
    -- Timestamps
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (application_id) REFERENCES installment_applications(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_application_id (application_id),
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application Status History Table
-- Tracks all status changes for an application
CREATE TABLE IF NOT EXISTS application_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255), -- admin email or 'system' or 'user'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (application_id) REFERENCES installment_applications(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_application_id (application_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application Admin Notifications Table
-- Notifies admins about new applications and status changes
CREATE TABLE IF NOT EXISTS application_admin_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    notification_type ENUM('new_application', 'documents_uploaded', 'user_response', 'payment_received') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_by VARCHAR(255),
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (application_id) REFERENCES installment_applications(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_application_id (application_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application User Notifications Table
-- Notifies users about their application status
CREATE TABLE IF NOT EXISTS application_user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    notification_type ENUM('received', 'under_review', 'documents_requested', 'approved', 'denied', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at DATETIME,
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (application_id) REFERENCES installment_applications(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_application_id (application_id),
    INDEX idx_user_uid (user_uid),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Initial Data / Sample Statuses
-- ============================================================================

-- No initial data needed - tables will be populated by application

-- ============================================================================
-- Useful Views
-- ============================================================================

-- View for pending applications with user details
CREATE OR REPLACE VIEW v_pending_applications AS
SELECT 
    ia.id,
    ia.reference,
    ia.full_name,
    ia.email,
    ia.phone,
    ia.gadget_name,
    ia.variant_storage,
    ia.variant_color,
    ia.plan_type,
    ia.plan_weeks,
    ia.deposit_amount,
    ia.weekly_amount,
    ia.total_amount,
    ia.currency,
    ia.status,
    ia.created_at,
    (SELECT COUNT(*) FROM application_documents WHERE application_id = ia.id) as document_count
FROM installment_applications ia
WHERE ia.status IN ('pending', 'under_review')
ORDER BY ia.created_at DESC;

-- View for application summary by status
CREATE OR REPLACE VIEW v_application_summary AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_value,
    AVG(total_amount) as avg_value
FROM installment_applications
GROUP BY status;

-- ============================================================================
-- Stored Procedure for Creating Application
-- ============================================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_create_application(
    IN p_reference VARCHAR(50),
    IN p_user_uid VARCHAR(255),
    IN p_gadget_id INT,
    IN p_gadget_name VARCHAR(255),
    IN p_variant_id INT,
    IN p_variant_storage VARCHAR(100),
    IN p_variant_color VARCHAR(100),
    IN p_variant_condition VARCHAR(50),
    IN p_plan_type VARCHAR(50),
    IN p_plan_weeks INT,
    IN p_deposit_amount DECIMAL(12,2),
    IN p_weekly_amount DECIMAL(12,2),
    IN p_total_amount DECIMAL(12,2),
    IN p_full_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(50),
    IN p_date_of_birth DATE,
    IN p_national_id VARCHAR(100),
    IN p_address TEXT,
    IN p_town VARCHAR(100),
    IN p_postcode VARCHAR(20),
    IN p_country VARCHAR(100),
    IN p_employment_status VARCHAR(100),
    IN p_employer_name VARCHAR(255),
    IN p_job_title VARCHAR(255),
    IN p_monthly_income VARCHAR(100),
    IN p_employment_duration VARCHAR(100),
    IN p_employer_phone VARCHAR(50),
    OUT p_application_id INT
)
BEGIN
    -- Insert the application
    INSERT INTO installment_applications (
        reference, user_uid, gadget_id, gadget_name, variant_id,
        variant_storage, variant_color, variant_condition,
        plan_type, plan_weeks, deposit_amount, weekly_amount, total_amount,
        full_name, email, phone, date_of_birth, national_id,
        address, town, postcode, country,
        employment_status, employer_name, job_title, monthly_income,
        employment_duration, employer_phone
    ) VALUES (
        p_reference, p_user_uid, p_gadget_id, p_gadget_name, p_variant_id,
        p_variant_storage, p_variant_color, p_variant_condition,
        p_plan_type, p_plan_weeks, p_deposit_amount, p_weekly_amount, p_total_amount,
        p_full_name, p_email, p_phone, p_date_of_birth, p_national_id,
        p_address, p_town, p_postcode, p_country,
        p_employment_status, p_employer_name, p_job_title, p_monthly_income,
        p_employment_duration, p_employer_phone
    );
    
    SET p_application_id = LAST_INSERT_ID();
    
    -- Add status history
    INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, notes)
    VALUES (p_application_id, NULL, 'pending', 'system', 'Application submitted');
    
    -- Create admin notification
    INSERT INTO application_admin_notifications (application_id, notification_type, message)
    VALUES (p_application_id, 'new_application', CONCAT('New installment application from ', p_full_name, ' for ', p_gadget_name));
    
    -- Create user notification
    INSERT INTO application_user_notifications (application_id, user_uid, notification_type, title, message)
    VALUES (p_application_id, p_user_uid, 'received', 'Application Received', 
            CONCAT('Your installment application (', p_reference, ') has been received and is now under review.'));
END //

DELIMITER ;

-- ============================================================================
-- End of Migration
-- ============================================================================
