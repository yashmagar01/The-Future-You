-- Analytics Queries for The Future You MVP
-- Run these in Supabase SQL Editor or create Views

-- ============================================================================
-- 1. ONBOARDING FUNNEL ANALYSIS
-- ============================================================================

-- Onboarding conversion funnel (step-by-step dropoff)
CREATE OR REPLACE VIEW analytics_onboarding_funnel AS
SELECT 
  step_number,
  step_name,
  COUNT(DISTINCT user_id) as users_reached,
  COUNT(DISTINCT user_id) * 100.0 / FIRST_VALUE(COUNT(DISTINCT user_id)) OVER (ORDER BY step_number) as conversion_rate
FROM (
  SELECT 
    user_id,
    (payload->>'step_number')::INT as step_number,
    payload->>'step_name' as step_name
  FROM events_analytics
  WHERE event_type = 'onboard_step_completed'
) steps
GROUP BY step_number, step_name
ORDER BY step_number;

-- Query it:
-- SELECT * FROM analytics_onboarding_funnel;

-- Onboarding completion rate (last 7 days)
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'onboard_started' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event_type = 'onboard_completed' THEN user_id END) as completed,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'onboard_completed' THEN user_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'onboard_started' THEN user_id END), 0) * 100, 
    2
  ) as completion_rate_pct
FROM events_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND event_type IN ('onboard_started', 'onboard_completed')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- 2. RECORDING CONVERSION METRICS
-- ============================================================================

-- Recording funnel (started → completed → uploaded)
CREATE OR REPLACE VIEW analytics_recording_funnel AS
WITH recording_events AS (
  SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT CASE WHEN event_type = 'record_started' THEN user_id END) as started,
    COUNT(DISTINCT CASE WHEN event_type = 'record_completed' THEN user_id END) as completed,
    COUNT(DISTINCT CASE WHEN event_type = 'upload_completed' THEN user_id END) as uploaded
  FROM events_analytics
  WHERE event_type IN ('record_started', 'record_completed', 'upload_completed')
  GROUP BY DATE(created_at)
)
SELECT 
  date,
  started,
  completed,
  uploaded,
  ROUND(completed::NUMERIC / NULLIF(started, 0) * 100, 2) as completion_rate_pct,
  ROUND(uploaded::NUMERIC / NULLIF(completed, 0) * 100, 2) as upload_rate_pct,
  ROUND(uploaded::NUMERIC / NULLIF(started, 0) * 100, 2) as end_to_end_conversion_pct
FROM recording_events
ORDER BY date DESC;

-- Query it:
-- SELECT * FROM analytics_recording_funnel WHERE date >= NOW() - INTERVAL '7 days';

-- Average recording duration
SELECT 
  AVG((payload->>'duration_seconds')::NUMERIC) as avg_duration_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (payload->>'duration_seconds')::NUMERIC) as median_duration_seconds,
  MIN((payload->>'duration_seconds')::NUMERIC) as min_duration_seconds,
  MAX((payload->>'duration_seconds')::NUMERIC) as max_duration_seconds
FROM events_analytics
WHERE event_type = 'record_completed'
  AND payload->>'duration_seconds' IS NOT NULL;

-- ============================================================================
-- 3. WEEKLY RETENTION ANALYSIS
-- ============================================================================

-- Weekly active users (WAU)
CREATE OR REPLACE VIEW analytics_weekly_active_users AS
SELECT 
  DATE_TRUNC('week', created_at) as week_start,
  COUNT(DISTINCT user_id) as active_users
FROM events_analytics
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- User cohort retention (Week 0, Week 1, Week 2, etc.)
WITH user_cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', MIN(created_at)) as cohort_week
  FROM events_analytics
  GROUP BY user_id
),
weekly_activity AS (
  SELECT DISTINCT
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM events_analytics
)
SELECT 
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  FLOOR(EXTRACT(EPOCH FROM (a.activity_week - c.cohort_week)) / 604800)::INT as weeks_since_signup,
  COUNT(DISTINCT a.user_id) as retained_users,
  ROUND(COUNT(DISTINCT a.user_id)::NUMERIC / COUNT(DISTINCT c.user_id) * 100, 2) as retention_rate_pct
FROM user_cohorts c
LEFT JOIN weekly_activity a ON c.user_id = a.user_id
GROUP BY c.cohort_week, weeks_since_signup
HAVING weeks_since_signup >= 0
ORDER BY c.cohort_week DESC, weeks_since_signup;

-- ============================================================================
-- 4. USER ENGAGEMENT METRICS
-- ============================================================================

-- Daily active users (DAU)
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(*) as total_events
FROM events_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most engaged users (by event count)
SELECT 
  p.full_name,
  e.user_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT DATE(e.created_at)) as active_days,
  COUNT(DISTINCT CASE WHEN event_type = 'record_completed' THEN e.id END) as recordings_completed
FROM events_analytics e
JOIN profiles p ON e.user_id = p.id
WHERE e.created_at >= NOW() - INTERVAL '7 days'
GROUP BY e.user_id, p.full_name
ORDER BY total_events DESC
LIMIT 20;

-- Event distribution (what users do most)
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM events_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- ============================================================================
-- 5. DROPOFF ANALYSIS
-- ============================================================================

-- Users who started onboarding but didn't complete (last 7 days)
SELECT 
  p.full_name,
  p.email,
  started.created_at as onboarding_started_at,
  EXTRACT(EPOCH FROM (NOW() - started.created_at))/3600 as hours_since_start
FROM (
  SELECT DISTINCT user_id, created_at
  FROM events_analytics
  WHERE event_type = 'onboard_started'
    AND created_at >= NOW() - INTERVAL '7 days'
) started
JOIN profiles p ON started.user_id = p.id
LEFT JOIN (
  SELECT DISTINCT user_id
  FROM events_analytics
  WHERE event_type = 'onboard_completed'
) completed ON started.user_id = completed.user_id
WHERE completed.user_id IS NULL
ORDER BY started.created_at DESC;

-- Users who completed recordings but didn't upload
SELECT 
  p.full_name,
  COUNT(*) as recordings_not_uploaded
FROM events_analytics e
JOIN profiles p ON e.user_id = p.id
WHERE e.event_type = 'record_completed'
  AND e.created_at >= NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM events_analytics upload
    WHERE upload.user_id = e.user_id
      AND upload.event_type = 'upload_completed'
      AND upload.created_at > e.created_at
      AND upload.created_at < e.created_at + INTERVAL '1 hour'
  )
GROUP BY p.full_name, e.user_id
ORDER BY recordings_not_uploaded DESC;

-- ============================================================================
-- 6. TIME-BASED INSIGHTS
-- ============================================================================

-- Peak usage hours
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM events_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- Day of week analysis
SELECT 
  TO_CHAR(created_at, 'Day') as day_of_week,
  EXTRACT(DOW FROM created_at) as day_number,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM events_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week, day_number
ORDER BY day_number;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get conversion rate between two events
CREATE OR REPLACE FUNCTION get_conversion_rate(
  start_event TEXT,
  end_event TEXT,
  days_back INT DEFAULT 7
) RETURNS TABLE (
  started BIGINT,
  completed BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT CASE WHEN event_type = start_event THEN user_id END) as started,
    COUNT(DISTINCT CASE WHEN event_type = end_event THEN user_id END) as completed,
    ROUND(
      COUNT(DISTINCT CASE WHEN event_type = end_event THEN user_id END)::NUMERIC /
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = start_event THEN user_id END), 0) * 100,
      2
    ) as conversion_rate
  FROM events_analytics
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_conversion_rate('record_started', 'upload_completed', 7);

-- ============================================================================
-- 8. DASHBOARD SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW analytics_dashboard_summary AS
SELECT 
  (SELECT COUNT(DISTINCT user_id) FROM events_analytics WHERE created_at >= NOW() - INTERVAL '1 day') as dau,
  (SELECT COUNT(DISTINCT user_id) FROM events_analytics WHERE created_at >= NOW() - INTERVAL '7 days') as wau,
  (SELECT COUNT(DISTINCT user_id) FROM events_analytics WHERE created_at >= NOW() - INTERVAL '30 days') as mau,
  (SELECT COUNT(*) FROM recordings WHERE created_at >= NOW() - INTERVAL '7 days') as recordings_this_week,
  (SELECT COUNT(*) FROM recordings WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 days') as completed_this_week,
  (SELECT ROUND(AVG(overall_score), 2) FROM recordings WHERE overall_score IS NOT NULL AND created_at >= NOW() - INTERVAL '7 days') as avg_score_this_week;

-- Query it:
-- SELECT * FROM analytics_dashboard_summary;
