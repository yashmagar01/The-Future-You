-- Migration: Add AI Companion, Habit Tracking, and Memories System
-- Created: 2026-04-05

-- =====================================================
-- 1. Extend profiles table with goals and anchors
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS anchors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

COMMENT ON COLUMN public.profiles.goals IS 'Array of personal development and speaking goals';
COMMENT ON COLUMN public.profiles.anchors IS 'Array of grounding anchors, core habits, or values';

-- =====================================================
-- 2. Create habits table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'growth',
  frequency TEXT DEFAULT 'daily',
  target_days INTEGER DEFAULT 7,
  color TEXT DEFAULT '#10B981',
  icon TEXT DEFAULT 'CheckCircle',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Create habit_logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT true,
  note TEXT DEFAULT '',
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, logged_date)
);

-- =====================================================
-- 4. Create companion_messages table (AI Chat & Reflections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companion_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT DEFAULT 'default',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Create reflections_memories table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reflections_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'reflection',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Enable Row Level Security
-- =====================================================
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections_memories ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Habit Logs Policies
CREATE POLICY "Users can view their own habit logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit logs"
  ON public.habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs"
  ON public.habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Companion Messages Policies
CREATE POLICY "Users can view their own companion messages"
  ON public.companion_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companion messages"
  ON public.companion_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companion messages"
  ON public.companion_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Reflections Memories Policies
CREATE POLICY "Users can view their own reflections memories"
  ON public.reflections_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections memories"
  ON public.reflections_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_date_idx ON public.habit_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS companion_messages_user_session_idx ON public.companion_messages(user_id, session_id, created_at);
CREATE INDEX IF NOT EXISTS reflections_memories_user_idx ON public.reflections_memories(user_id);
