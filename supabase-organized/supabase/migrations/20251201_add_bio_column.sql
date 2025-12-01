-- Add bio column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description, max 200 characters recommended';
