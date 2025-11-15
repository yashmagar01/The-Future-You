-- Migration: Setup Cron Job for Recording Processing
-- Created: 2024-11-16
-- This migration sets up a cron job that triggers the process-recordings Edge Function

-- =====================================================
-- 1. Enable required extensions
-- =====================================================

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- 2. Create helper function to invoke the worker
-- =====================================================

CREATE OR REPLACE FUNCTION public.invoke_processing_worker()
RETURNS void AS $$
DECLARE
  function_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Get Supabase project URL from settings
  -- Replace with your actual project URL or use environment variable
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-recordings';
  
  -- Get cron secret from settings (set this in Supabase Dashboard → Project Settings → Secrets)
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  -- If secrets not set, use fallback (not recommended for production)
  IF function_url IS NULL OR function_url = '/functions/v1/process-recordings' THEN
    function_url := 'https://wmhccazmbgruojkruyij.supabase.co/functions/v1/process-recordings';
  END IF;
  
  -- Make HTTP POST request to Edge Function
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || COALESCE(cron_secret, 'default-secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  -- Log the request
  RAISE NOTICE 'Processing worker invoked: request_id=%', request_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to invoke processing worker: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.invoke_processing_worker IS 'Invokes the process-recordings Edge Function via HTTP POST';

-- =====================================================
-- 3. Schedule the cron job
-- =====================================================

-- Remove existing job if it exists
SELECT cron.unschedule('process-recordings-worker') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-recordings-worker'
);

-- Schedule job to run every 5 minutes
SELECT cron.schedule(
  'process-recordings-worker',           -- Job name
  '*/5 * * * *',                        -- Cron expression: every 5 minutes
  $$SELECT public.invoke_processing_worker();$$
);

-- =====================================================
-- 4. Create monitoring table for job runs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.worker_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recordings_processed INTEGER DEFAULT 0,
  recordings_failed INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
  ) STORED
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_worker_runs_started_at ON public.worker_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_runs_status ON public.worker_runs(status);

-- Add comment
COMMENT ON TABLE public.worker_runs IS 'Log of processing worker executions for monitoring';

-- =====================================================
-- 5. Create view for cron job monitoring
-- =====================================================

CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  j.database,
  jr.runid,
  jr.start_time as last_run_start,
  jr.end_time as last_run_end,
  jr.status as last_run_status,
  jr.return_message as last_run_message,
  EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) as last_run_duration_seconds
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT * FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) jr ON true
WHERE j.jobname = 'process-recordings-worker';

-- Grant access
GRANT SELECT ON public.cron_job_status TO authenticated;

-- Add comment
COMMENT ON VIEW public.cron_job_status IS 'Monitor status and history of the processing worker cron job';

-- =====================================================
-- 6. Helpful queries for monitoring
-- =====================================================

-- Query to check current cron job status
-- SELECT * FROM public.cron_job_status;

-- Query to view recent job runs
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-recordings-worker')
-- ORDER BY start_time DESC LIMIT 10;

-- Query to check pending recordings
-- SELECT COUNT(*), priority 
-- FROM recordings 
-- WHERE status = 'pending' 
-- GROUP BY priority;

-- Query to disable cron job (if needed)
-- SELECT cron.unschedule('process-recordings-worker');

-- Query to re-enable with different schedule
-- SELECT cron.schedule('process-recordings-worker', '*/10 * * * *', $$SELECT public.invoke_processing_worker();$$);

-- =====================================================
-- 7. Create notification for stuck jobs
-- =====================================================

-- Optional: Create a daily report of stuck jobs
SELECT cron.schedule(
  'report-stuck-jobs',
  '0 9 * * *',  -- Every day at 9 AM
  $$
  DO $$
  DECLARE
    stuck_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO stuck_count
    FROM recordings
    WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '1 hour';
    
    IF stuck_count > 0 THEN
      RAISE WARNING 'Found % stuck recording(s) in processing state', stuck_count;
      -- TODO: Send notification email via Edge Function
    END IF;
  END $$;
  $$
);

-- =====================================================
-- 8. Setup complete - Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Processing worker cron job configured successfully';
  RAISE NOTICE '  - Job name: process-recordings-worker';
  RAISE NOTICE '  - Schedule: Every 5 minutes';
  RAISE NOTICE '  - Function: public.invoke_processing_worker()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy the Edge Function: supabase functions deploy process-recordings';
  RAISE NOTICE '2. Set secrets: supabase secrets set CRON_SECRET=your_secret OPENAI_API_KEY=your_key';
  RAISE NOTICE '3. Update function URL in invoke_processing_worker() if needed';
  RAISE NOTICE '4. Monitor: SELECT * FROM public.cron_job_status;';
END $$;
