-- Create appointments table for gadget viewing appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gadget_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` varchar(5) NOT NULL COMMENT '24-hour format HH:MM',
  `location_id` varchar(50) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `status` enum('scheduled','completed','cancelled','no-show') DEFAULT 'scheduled' COMMENT 'scheduled=booked, completed=attended, cancelled=user cancelled, no-show=user missed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gadget_id` (`gadget_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_status` (`status`),
  KEY `idx_date_time_location` (`appointment_date`, `appointment_time`, `location_id`),
  UNIQUE KEY `unique_user_active_appointment` (`user_id`, `gadget_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appointments_gadget` FOREIGN KEY (`gadget_id`) REFERENCES `gadgets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_appointments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
