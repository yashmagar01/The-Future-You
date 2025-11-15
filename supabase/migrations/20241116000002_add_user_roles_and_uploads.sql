-- Migration: Add user roles and enhance recordings table
-- Created: 2024-11-16

-- =====================================================
-- 1. Update profiles table to include role field
-- =====================================================

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('tester', 'user', 'admin'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.role IS 'User role: tester (high priority), user (standard), admin (full access)';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =====================================================
-- 2. Enhance recordings table with new fields
-- =====================================================

-- Add new columns to recordings table
ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'low'
CHECK (priority IN ('high', 'low'));

ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS result_url TEXT;

ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.recordings.priority IS 'Processing priority: high for testers, low for regular users';
COMMENT ON COLUMN public.recordings.result_url IS 'URL to the processed video result or feedback';
COMMENT ON COLUMN public.recordings.notified IS 'Whether user has been notified about completion';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_recordings_priority ON public.recordings(priority);
CREATE INDEX IF NOT EXISTS idx_recordings_status_priority ON public.recordings(status, priority);
CREATE INDEX IF NOT EXISTS idx_recordings_notified ON public.recordings(notified) WHERE notified = false;

-- =====================================================
-- 3. Create function to auto-set priority based on user role
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_recording_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user role and set priority accordingly
  SELECT 
    CASE 
      WHEN role = 'tester' THEN 'high'
      ELSE 'low'
    END INTO NEW.priority
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set priority on insert
DROP TRIGGER IF EXISTS set_recording_priority_trigger ON public.recordings;
CREATE TRIGGER set_recording_priority_trigger
  BEFORE INSERT ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_recording_priority();

-- =====================================================
-- 4. Update existing data
-- =====================================================

-- Set priority for existing recordings based on user role
UPDATE public.recordings r
SET priority = CASE 
  WHEN p.role = 'tester' THEN 'high'
  ELSE 'low'
END
FROM public.profiles p
WHERE r.user_id = p.id;

-- =====================================================
-- 5. RLS Policies (maintain existing security)
-- =====================================================

-- Ensure users can only see their own recordings
-- (existing policies should handle this, but let's verify)

-- Admin can see all recordings
DROP POLICY IF EXISTS "Admins can view all recordings" ON public.recordings;
CREATE POLICY "Admins can view all recordings"
  ON public.recordings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update notified status on their own recordings
DROP POLICY IF EXISTS "Users can mark their recordings as notified" ON public.recordings;
CREATE POLICY "Users can mark their recordings as notified"
  ON public.recordings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. Create view for admin dashboard
-- =====================================================

CREATE OR REPLACE VIEW public.recordings_queue AS
SELECT 
  r.id,
  r.user_id,
  r.title,
  r.status,
  r.priority,
  r.notified,
  r.created_at,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role
FROM public.recordings r
JOIN public.profiles p ON r.user_id = p.id
ORDER BY 
  r.priority DESC,
  r.created_at ASC;

-- Grant access to authenticated users (admin can see via RLS)
GRANT SELECT ON public.recordings_queue TO authenticated;

-- =====================================================
-- 7. Add helpful comments
-- =====================================================

COMMENT ON TABLE public.recordings IS 'Video recordings with priority processing based on user role';
COMMENT ON VIEW public.recordings_queue IS 'Admin view of recordings processing queue ordered by priority';
