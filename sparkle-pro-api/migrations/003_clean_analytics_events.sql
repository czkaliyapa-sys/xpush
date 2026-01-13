-- Clean old dummy analytics event data and prepare table for fresh tracking
-- Date: 2026-01-11

-- Delete old analytics events from before today
DELETE FROM analytics_events WHERE created_at < CURDATE();

-- Verify table structure
ALTER TABLE analytics_events MODIFY id int(11) AUTO_INCREMENT;

-- Add indexes for better query performance (ignore if already exists)
ALTER TABLE analytics_events ADD INDEX IF NOT EXISTS idx_session_id (session_id);
ALTER TABLE analytics_events ADD INDEX IF NOT EXISTS idx_event_type (event_type);
ALTER TABLE analytics_events ADD INDEX IF NOT EXISTS idx_created_at (created_at);
ALTER TABLE analytics_events ADD INDEX IF NOT EXISTS idx_session_event (session_id, event_type);

-- Verify the table is clean and ready
SELECT COUNT(*) as remaining_events FROM analytics_events;
SELECT DATE(MAX(created_at)) as most_recent_event FROM analytics_events;
