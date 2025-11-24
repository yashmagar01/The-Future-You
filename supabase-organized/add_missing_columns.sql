-- Add onboarding_data column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores user answers to onboarding questions';

-- Add role and priority columns if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'beta')),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

COMMENT ON COLUMN public.profiles.role IS 'User role: user, admin, or beta';
COMMENT ON COLUMN public.profiles.priority IS 'Processing priority from 1 (lowest) to 5 (highest)';

-- Create prompts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transcripts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE,
  text TEXT,
  segments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_transcripts_recording ON public.transcripts(recording_id);

-- Enable RLS on new tables (IF NOT EXISTS not needed for ALTER TABLE)
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first to avoid duplicate errors)
DROP POLICY IF EXISTS "Public read access to prompts" ON public.prompts;
CREATE POLICY "Public read access to prompts"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view their own transcripts" ON public.transcripts;
CREATE POLICY "Users can view their own transcripts"
  ON public.transcripts FOR SELECT
  TO authenticated
  USING (
    recording_id IN (
      SELECT id FROM public.recordings WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own events" ON public.events_analytics;
CREATE POLICY "Users can insert their own events"
  ON public.events_analytics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their own events" ON public.events_analytics;
CREATE POLICY "Users can view their own events"
  ON public.events_analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
