-- Email Notification System - Quick Reference SQL
-- Run these commands in Supabase SQL Editor for testing and debugging

-- =====================================================
-- 1. CHECK UNNOTIFIED RECORDINGS
-- =====================================================

-- See all completed recordings that haven't been notified
SELECT 
  r.id,
  r.title,
  r.status,
  r.notified,
  r.updated_at,
  r.created_at,
  au.email as user_email,
  f.overall_score
FROM recordings r
JOIN auth.users au ON au.id = r.user_id
LEFT JOIN feedback f ON f.recording_id = r.id
WHERE r.status = 'completed' 
  AND r.notified = false
ORDER BY r.updated_at DESC;


-- =====================================================
-- 2. MANUALLY SEND PENDING NOTIFICATIONS
-- =====================================================

-- Send emails for all unnotified completed recordings
SELECT * FROM send_pending_notifications();


-- =====================================================
-- 3. TEST EMAIL NOTIFICATION
-- =====================================================

-- Find a test recording
SELECT id, title, status, notified, user_id 
FROM recordings 
WHERE status = 'completed' 
LIMIT 1;

-- Reset notification status (replace with your recording ID)
UPDATE recordings 
SET notified = false, updated_at = now()
WHERE id = 'YOUR-RECORDING-ID-HERE';

-- Trigger notification by updating status
-- This simulates the completion flow
UPDATE recordings 
SET status = 'processing', updated_at = now()
WHERE id = 'YOUR-RECORDING-ID-HERE';

UPDATE recordings 
SET status = 'completed', updated_at = now()
WHERE id = 'YOUR-RECORDING-ID-HERE';

-- Check if notification was sent
SELECT id, title, notified, updated_at 
FROM recordings 
WHERE id = 'YOUR-RECORDING-ID-HERE';


-- =====================================================
-- 4. VIEW EMAIL NOTIFICATION TRIGGER
-- =====================================================

-- Check if trigger exists and is enabled
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  tgtype AS type
FROM pg_trigger
WHERE tgname = 'send_completion_email_trigger';


-- =====================================================
-- 5. DISABLE/ENABLE TRIGGER (MAINTENANCE)
-- =====================================================

-- Disable trigger temporarily (e.g., during bulk updates)
ALTER TABLE recordings DISABLE TRIGGER send_completion_email_trigger;

-- Re-enable trigger
ALTER TABLE recordings ENABLE TRIGGER send_completion_email_trigger;


-- =====================================================
-- 6. VIEW NOTIFICATION STATISTICS
-- =====================================================

-- Count recordings by notification status
SELECT 
  status,
  notified,
  COUNT(*) as count
FROM recordings
GROUP BY status, notified
ORDER BY status, notified;


-- =====================================================
-- 7. FIND RECORDINGS WITH MISSING EMAILS
-- =====================================================

-- Find completed recordings where user email is missing
SELECT 
  r.id,
  r.title,
  r.user_id,
  r.notified,
  au.email
FROM recordings r
LEFT JOIN auth.users au ON au.id = r.user_id
WHERE r.status = 'completed'
  AND au.email IS NULL;


-- =====================================================
-- 8. BULK RESET NOTIFICATION STATUS
-- =====================================================

-- Reset all notifications for testing (USE CAREFULLY!)
-- Uncomment to use:
-- UPDATE recordings 
-- SET notified = false, updated_at = now()
-- WHERE status = 'completed' 
--   AND notified = true
--   AND created_at >= NOW() - INTERVAL '1 day';  -- Only last 24 hours


-- =====================================================
-- 9. VIEW RECENT RECORDINGS WITH FEEDBACK
-- =====================================================

-- See recent completions with scores
SELECT 
  r.id,
  r.title,
  r.status,
  r.notified,
  r.updated_at,
  au.email as user_email,
  f.overall_score,
  f.created_at as feedback_created_at
FROM recordings r
JOIN auth.users au ON au.id = r.user_id
LEFT JOIN feedback f ON f.recording_id = r.id
WHERE r.status = 'completed'
ORDER BY r.updated_at DESC
LIMIT 20;


-- =====================================================
-- 10. DELETE TEST NOTIFICATIONS (CLEANUP)
-- =====================================================

-- Delete test recordings (replace with your test user ID)
-- Uncomment to use:
-- DELETE FROM feedback 
-- WHERE recording_id IN (
--   SELECT id FROM recordings WHERE user_id = 'YOUR-TEST-USER-ID'
-- );

-- DELETE FROM recordings 
-- WHERE user_id = 'YOUR-TEST-USER-ID';


-- =====================================================
-- 11. CHECK FUNCTION DEFINITIONS
-- =====================================================

-- View the trigger function source code
SELECT pg_get_functiondef(oid)
FROM pg_proc 
WHERE proname = 'send_completion_email';


-- =====================================================
-- 12. MONITOR PERFORMANCE
-- =====================================================

-- Check how many emails were sent in the last hour
SELECT 
  COUNT(*) as emails_sent,
  DATE_TRUNC('hour', updated_at) as hour
FROM recordings
WHERE notified = true
  AND updated_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', updated_at)
ORDER BY hour DESC;


-- =====================================================
-- 13. TROUBLESHOOTING: CHECK LOGS
-- =====================================================

-- Note: PostgreSQL logs are not directly queryable in Supabase
-- Use Supabase Dashboard → Database → Logs
-- Or check Edge Function logs:
--   supabase functions logs send-email --tail
--   supabase functions logs send-notifications --tail


-- =====================================================
-- 14. VERIFY ENVIRONMENT (CONFIGURATION)
-- =====================================================

-- Check if custom settings are configured (optional)
SELECT 
  name, 
  setting 
FROM pg_settings 
WHERE name LIKE 'app.settings%';


-- =====================================================
-- 15. CREATE TEST USER AND RECORDING (FOR DEMO)
-- =====================================================

-- Note: Run this only in development/staging environment

-- Create test user (via Supabase Dashboard → Authentication → Add User)
-- Then create test recording:
-- 
-- INSERT INTO recordings (
--   user_id,
--   title,
--   video_url,
--   status,
--   priority,
--   notified
-- ) VALUES (
--   'YOUR-TEST-USER-ID',
--   'Test Video for Email Notification',
--   'https://example.com/test-video.mp4',
--   'pending',
--   'high',
--   false
-- );

-- Then simulate completion:
-- UPDATE recordings 
-- SET status = 'completed', notified = false, updated_at = now()
-- WHERE title = 'Test Video for Email Notification';
