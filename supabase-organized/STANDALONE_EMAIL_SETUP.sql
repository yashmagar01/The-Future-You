-- STANDALONE EMAIL NOTIFICATION SETUP
-- Run this entire script in Supabase SQL Editor if migrations haven't been applied
-- This ensures all prerequisites are met before setting up email notifications

-- =====================================================
-- STEP 1: Ensure notified column exists
-- =====================================================

DO $$ 
BEGIN
  -- Add notified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'recordings' 
    AND column_name = 'notified'
  ) THEN
    ALTER TABLE public.recordings
    ADD COLUMN notified BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'Added notified column to recordings table';
  ELSE
    RAISE NOTICE 'Column notified already exists';
  END IF;
END $$;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_recordings_notified 
ON public.recordings(notified) 
WHERE notified = false;

-- Add comment
COMMENT ON COLUMN public.recordings.notified IS 'Whether user has been notified about video completion';

-- =====================================================
-- STEP 2: Ensure pg_net extension is enabled
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- STEP 3: Create email notification trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_completion_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  video_title TEXT;
  video_url TEXT;
  score INTEGER;
  function_url TEXT;
  request_id BIGINT;
  supabase_anon_key TEXT;
BEGIN
  -- Only proceed if status changed to 'completed' and user hasn't been notified
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.notified = false THEN
    
    -- Get user email and name from auth.users
    SELECT 
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
    INTO user_email, user_name
    FROM auth.users au
    WHERE au.id = NEW.user_id;
    
    -- If user not found, skip notification
    IF user_email IS NULL THEN
      RAISE NOTICE 'User email not found for user_id: %', NEW.user_id;
      RETURN NEW;
    END IF;
    
    -- Get video details
    video_title := NEW.title;
    
    -- Build video URL - UPDATE THIS with your actual domain!
    video_url := 'https://yash.vercel.app/dashboard/recordings/' || NEW.id;
    
    -- Get overall score from feedback table
    SELECT overall_score INTO score
    FROM public.feedback
    WHERE recording_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Default score if not found
    IF score IS NULL THEN
      score := 0;
    END IF;
    
    -- Build Edge Function URL - UPDATE THIS with your Supabase project URL!
    function_url := 'https://wmhccazmbgruojkruyij.supabase.co/functions/v1/send-email';
    
    -- Make HTTP POST request to send-email Edge Function
    BEGIN
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'completion',
          'to', user_email,
          'name', user_name,
          'videoTitle', video_title,
          'videoUrl', video_url,
          'overallScore', score
        )
      ) INTO request_id;
      
      -- Mark as notified
      NEW.notified := true;
      
      RAISE NOTICE 'Completion email sent to %: request_id=%', user_email, request_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Failed to send completion email for recording %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_completion_email() IS 
  'Trigger function that sends email notification when video processing completes';

-- =====================================================
-- STEP 4: Create trigger
-- =====================================================

DROP TRIGGER IF EXISTS send_completion_email_trigger ON public.recordings;

CREATE TRIGGER send_completion_email_trigger
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.notified = false)
  EXECUTE FUNCTION public.send_completion_email();

COMMENT ON TRIGGER send_completion_email_trigger ON public.recordings IS 
  'Automatically sends completion email when recording status changes to completed';

-- =====================================================
-- STEP 5: Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- =====================================================
-- STEP 6: Create manual notification function (fallback)
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_pending_notifications()
RETURNS TABLE(
  recording_id UUID,
  user_email TEXT,
  status TEXT
) AS $$
DECLARE
  rec RECORD;
  request_id BIGINT;
  function_url TEXT;
BEGIN
  -- UPDATE THIS with your Supabase project URL!
  function_url := 'https://wmhccazmbgruojkruyij.supabase.co/functions/v1/send-email';
  
  -- Loop through all completed but unnotified recordings
  FOR rec IN 
    SELECT 
      r.id,
      r.user_id,
      r.title,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
      COALESCE(f.overall_score, 0) as score
    FROM public.recordings r
    JOIN auth.users au ON au.id = r.user_id
    LEFT JOIN public.feedback f ON f.recording_id = r.id
    WHERE r.status = 'completed'
      AND r.notified = false
      AND au.email IS NOT NULL
    ORDER BY r.updated_at ASC
    LIMIT 50
  LOOP
    BEGIN
      -- Send email
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'completion',
          'to', rec.email,
          'name', rec.name,
          'videoTitle', rec.title,
          'videoUrl', 'https://yash.vercel.app/dashboard/recordings/' || rec.id,
          'overallScore', rec.score
        )
      ) INTO request_id;
      
      -- Mark as notified
      UPDATE public.recordings
      SET notified = true, updated_at = now()
      WHERE id = rec.id;
      
      recording_id := rec.id;
      user_email := rec.email;
      status := 'sent';
      
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      recording_id := rec.id;
      user_email := rec.email;
      status := 'failed: ' || SQLERRM;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_pending_notifications() IS 
  'Manually send emails for any completed recordings that were not notified. Use as fallback or for backfill.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recordings'
  AND column_name = 'notified';

-- Check if trigger exists
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'send_completion_email_trigger';

-- Check if functions exist
SELECT 
  proname AS function_name,
  prosecdef AS is_security_definer
FROM pg_proc
WHERE proname IN ('send_completion_email', 'send_pending_notifications');

-- =====================================================
-- TESTING
-- =====================================================

-- To test, run these commands:

-- 1. Check for unnotified recordings:
-- SELECT id, title, status, notified FROM recordings WHERE status = 'completed' LIMIT 5;

-- 2. Manually send pending notifications:
-- SELECT * FROM send_pending_notifications();

-- 3. Reset a recording's notification status (for testing):
-- UPDATE recordings SET notified = false WHERE id = 'YOUR-RECORDING-ID';

-- =====================================================
-- DONE!
-- =====================================================

-- If you see the verification results above with no errors, 
-- the email notification system is ready!
