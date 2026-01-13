-- Add condition_status to gadgets table to align with seller_gadgets
-- Allowed values mirror seller_gadgets: ('new','like_new','good','fair','poor')
-- Default to 'new' for admin-managed gadgets

ALTER TABLE `gadgets`
  ADD COLUMN `condition_status` ENUM('new','like_new','good','fair','poor') NOT NULL DEFAULT 'new' AFTER `model`;