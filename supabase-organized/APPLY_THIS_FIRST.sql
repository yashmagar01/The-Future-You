-- STEP 1: Add the role column to profiles table
-- Copy and run this in Supabase Dashboard → SQL Editor

-- Add role column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('tester', 'user', 'admin'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- STEP 2: Make yourself an admin
-- Replace 'yashajaymagar10@gmail.com' with your actual email

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'yashajaymagar10@gmail.com'
);

-- STEP 3: Verify it worked
-- You should see your user with role = 'admin'

SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'yashajaymagar10@gmail.com';
