-- Migration: Add DOB column to users table for age verification
-- Date: 2026-01-09
-- Description: Adds date_of_birth column to support age verification on age-restricted products

-- Add DOB column/index if they do not already exist
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `dob` date DEFAULT NULL AFTER `phone`;

ALTER TABLE `users`
ADD INDEX IF NOT EXISTS `idx_dob` (`dob`);

-- Add age verification index for performance when filtering by age
-- Generated columns cannot use non-deterministic functions like CURDATE in MySQL/MariaDB
-- To filter by age efficiently, query using DOB with a functional predicate, e.g.:
--   WHERE dob <= DATE_SUB(CURDATE(), INTERVAL 18 YEAR)
-- If you need a persisted age column, populate it via a scheduled job/trigger instead of a generated column.
