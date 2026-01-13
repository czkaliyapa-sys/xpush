-- Migration: Add nullable storage column to order_items
-- Run this against existing databases created before the enhanced schema update

ALTER TABLE order_items 
  ADD COLUMN storage VARCHAR(64) DEFAULT NULL AFTER item_type;