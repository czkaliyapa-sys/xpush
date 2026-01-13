-- Migration: Trade-In, Notifications, and Reminder System
-- Date: 2026-01-07
-- Description: Creates tables for trade-in submissions, user notifications, 
--              email subscriptions, and scheduled reminders

-- ============================================
-- TRADE-INS TABLE
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER NOTIFICATIONS TABLE
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EMAIL SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    subscription_types JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SCHEDULED REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    reminder_type VARCHAR(50) DEFAULT 'installment',
    scheduled_for DATETIME NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reminder (order_id, scheduled_for),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_sent (sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VERIFY TABLES CREATED
-- ============================================
-- Run these to verify:
-- SHOW TABLES LIKE 'trade_ins';
-- SHOW TABLES LIKE 'user_notifications';
-- SHOW TABLES LIKE 'email_subscriptions';
-- SHOW TABLES LIKE 'scheduled_reminders';
