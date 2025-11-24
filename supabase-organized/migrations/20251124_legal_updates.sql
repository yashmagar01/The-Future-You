-- Add beta_consent column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beta_consent boolean DEFAULT false;

-- RLS Policies

-- Enable RLS on tables if not already enabled
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Insights Policies
DROP POLICY IF EXISTS "Users read own insights" ON public.insights;
CREATE POLICY "Users read own insights"
ON public.insights FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own insights" ON public.insights;
CREATE POLICY "Users insert own insights"
ON public.insights FOR INSERTgit 
WITH CHECK (auth.uid() = user_id);

-- Videos Policies
DROP POLICY IF EXISTS "Users read own videos" ON public.videos;
CREATE POLICY "Users read own videos"
ON public.videos FOR SELECT
USING (auth.uid() = user_id);

-- Profiles Policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
