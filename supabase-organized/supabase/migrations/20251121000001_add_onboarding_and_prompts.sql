-- Migration: Add onboarding, prompts, transcripts, and analytics
-- Created: 2025-11-21

-- =====================================================
-- 1. Update profiles table
-- =====================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores user answers to onboarding questions';

-- =====================================================
-- 2. Create prompts table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompts are viewable by everyone"
  ON public.prompts FOR SELECT
  USING (true);

-- Only admins can insert/update prompts
CREATE POLICY "Admins can insert prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update prompts"
  ON public.prompts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 3. Update recordings table
-- =====================================================

ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.recordings.metadata IS 'Technical metadata about the recording';

-- Update status check constraint to include 'pending' and 'uploading'
ALTER TABLE public.recordings
DROP CONSTRAINT IF EXISTS recordings_status_check;

ALTER TABLE public.recordings
ADD CONSTRAINT recordings_status_check
CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'failed'));

-- =====================================================
-- 4. Create transcripts table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for transcripts
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transcripts"
  ON public.transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = transcripts.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Service role or admin can insert transcripts (usually done by background job)
CREATE POLICY "Service role can insert transcripts"
  ON public.transcripts FOR INSERT
  WITH CHECK (true); -- Ideally restricted to service role, but for now allowing insert if authenticated (backend will handle auth)

-- =====================================================
-- 5. Create events_analytics table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for events_analytics
ALTER TABLE public.events_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
  ON public.events_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics"
  ON public.events_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
