-- Add onboarding_data column to profiles table
-- This column will store user onboarding information as JSON

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores user onboarding information and preferences as JSON';
