-- Migration: Add Email Notifications for Completed Videos
-- Created: 2024-11-16
-- Automatically sends email when recording status changes to 'completed'

-- =====================================================
-- 0. Ensure notified column exists (safety check)
-- =====================================================

-- Add notified column if it doesn't exist
-- This should already exist from migration 20241116000002, but we add it here as a safety measure
ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient queries on unnotified recordings
CREATE INDEX IF NOT EXISTS idx_recordings_notified ON public.recordings(notified) WHERE notified = false;

-- Add comment
COMMENT ON COLUMN public.recordings.notified IS 'Whether user has been notified about video completion';

-- =====================================================
-- 1. Create function to send completion email
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
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.notified = false THEN
    
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
    video_url := current_setting('app.settings.supabase_url', true) || '/dashboard/recordings/' || NEW.id;
    
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
    
    -- Get Supabase function URL and anon key
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email';
    supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    -- Fallback to hardcoded values if not set (update these!)
    IF function_url IS NULL OR function_url = '/functions/v1/send-email' THEN
      function_url := 'https://lgfrnuzuyammbqxcqgyo.supabase.co/functions/v1/send-email';
    END IF;
    
    -- Make HTTP POST request to send-email Edge Function
    BEGIN
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || COALESCE(supabase_anon_key, 'default-key'),
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

-- =====================================================
-- 2. Create trigger on recordings table
-- =====================================================

DROP TRIGGER IF EXISTS send_completion_email_trigger ON public.recordings;

CREATE TRIGGER send_completion_email_trigger
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.notified = false)
  EXECUTE FUNCTION public.send_completion_email();

-- =====================================================
-- 3. Grant necessary permissions
-- =====================================================

-- Allow the function to read from auth.users
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- =====================================================
-- 4. Add comments
-- =====================================================

COMMENT ON FUNCTION public.send_completion_email() IS 
  'Trigger function that sends email notification when video processing completes';

COMMENT ON TRIGGER send_completion_email_trigger ON public.recordings IS 
  'Automatically sends completion email when recording status changes to completed';

-- =====================================================
-- 5. Create manual notification function (fallback)
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
  supabase_anon_key TEXT;
BEGIN
  -- Get function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email';
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  IF function_url IS NULL OR function_url = '/functions/v1/send-email' THEN
    function_url := 'https://lgfrnuzuyammbqxcqgyo.supabase.co/functions/v1/send-email';
  END IF;
  
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
          'Authorization', 'Bearer ' || COALESCE(supabase_anon_key, 'default-key'),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'completion',
          'to', rec.email,
          'name', rec.name,
          'videoTitle', rec.title,
          'videoUrl', current_setting('app.settings.supabase_url', true) || '/dashboard/recordings/' || rec.id,
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
-- 6. Usage Examples
-- =====================================================

-- To manually trigger notifications for pending recordings:
-- SELECT * FROM public.send_pending_notifications();

-- To check recordings awaiting notification:
-- SELECT id, title, status, notified, updated_at 
-- FROM public.recordings 
-- WHERE status = 'completed' AND notified = false;

-- To reset notification status (for testing):
-- UPDATE public.recordings SET notified = false WHERE id = 'YOUR-RECORDING-ID';
