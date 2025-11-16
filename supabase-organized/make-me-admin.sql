-- Check your current role
-- Run this first to see what role you have

SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'yashajaymagar10@gmail.com';  -- Replace with your actual email

-- If role is NULL or 'user', run this to make yourself an admin:

UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'yashajaymagar10@gmail.com'  -- Replace with your actual email
);

-- Verify the change:

SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'yashajaymagar10@gmail.com';  -- Replace with your actual email

-- You should now see role = 'admin'

-- Alternative: If you're logged in, you can use auth.uid()
-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
