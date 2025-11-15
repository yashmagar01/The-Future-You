# Create Test User for The Future You

This guide will help you create a test user account for development and testing purposes.

## Prerequisites

Before creating a test user, ensure you have:

1. ✅ Applied the database migrations (see `QUICK_START.md` or `SUPABASE_MIGRATION_GUIDE.md`)
2. ✅ Set up your `.env` file with Supabase credentials
3. ✅ Verified the app is running (`npm run dev`)

## Method 1: Using the Signup Page (Recommended)

The easiest way to create a test user is through the app's signup page:

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser:
   ```
   http://localhost:5173
   ```

3. **Navigate to Signup**:
   - Click "Sign Up" button on the homepage
   - Or go directly to: `http://localhost:5173/signup`

4. **Create test account**:
   ```
   Full Name:    Test User
   Email:        test@example.com
   Password:     Test123!
   ```

5. **Verify account creation**:
   - You should be redirected to the dashboard
   - Check Supabase Dashboard → Authentication → Users to see the new user

## Method 2: Using Supabase Dashboard

Create a user directly in Supabase (useful if you need to bypass email verification):

1. **Go to Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Click "Users" tab
   - Click "Add user" button

3. **Fill in user details**:
   ```
   Email:                test@example.com
   Password:             Test123!
   Auto Confirm User:    ✓ (check this box to skip email verification)
   ```

4. **Add user metadata** (optional):
   - After creating, click on the user
   - Go to "User Metadata" section
   - Add:
     ```json
     {
       "full_name": "Test User"
     }
     ```

5. **Create profile manually** (if auto-trigger didn't work):
   - Go to SQL Editor
   - Run this query:
     ```sql
     INSERT INTO public.profiles (id, full_name)
     VALUES ('USER_ID_FROM_AUTH', 'Test User')
     ON CONFLICT (id) DO NOTHING;
     ```
   - Replace `USER_ID_FROM_AUTH` with the actual user ID from Authentication tab

## Method 3: Using SQL Script

Create multiple test users at once using SQL:

1. **Go to Supabase SQL Editor**
2. **Run this script**:

```sql
-- Create test user in auth.users table
-- Note: This requires RLS policies to be disabled or you need admin access
-- The password 'Test123!' will be hashed by Supabase

-- First, we'll create a user with Supabase Auth API
-- This needs to be done via the Supabase Dashboard or client library

-- After creating the user via Dashboard/API, the profile will be
-- automatically created by the trigger in 001_initial_schema.sql

-- You can verify the profile exists:
SELECT * FROM public.profiles;

-- If profile wasn't created automatically, create it manually:
-- (Replace 'USER_ID' with actual UUID from auth.users)
INSERT INTO public.profiles (id, full_name)
VALUES (
  'YOUR_USER_ID_HERE',
  'Test User'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = now();
```

## Test User Credentials

Use these credentials for testing:

| Field      | Value               |
|------------|---------------------|
| Email      | test@example.com    |
| Password   | Test123!            |
| Full Name  | Test User           |

## Verify Test User Setup

After creating the test user, verify everything works:

1. **Login Test**:
   ```
   1. Go to http://localhost:5173/login
   2. Enter: test@example.com / Test123!
   3. Click "Sign In"
   4. Should redirect to /dashboard
   ```

2. **Check Profile**:
   - Dashboard should display "Welcome, Test User"
   - User info should appear in the sidebar

3. **Check Database**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT 
     p.id,
     p.full_name,
     p.avatar_url,
     p.created_at
   FROM public.profiles p
   WHERE p.id IN (
     SELECT id FROM auth.users WHERE email = 'test@example.com'
   );
   ```

4. **Test Recording** (optional):
   - Go to /record
   - Allow camera access
   - Record a short test video
   - Verify it appears in /gallery

## Creating Additional Test Users

To create more test users for testing different scenarios:

**User 2 - Multiple Recordings:**
```
Email:     test2@example.com
Password:  Test123!
Name:      Jane Smith
```

**User 3 - New User:**
```
Email:     test3@example.com
Password:  Test123!
Name:      John Doe
```

## Troubleshooting

### "Email not confirmed"
- **Solution**: In Supabase Dashboard → Authentication → Email Settings
- Disable "Confirm email" or set "Auto Confirm Users" to enabled

### Profile not created automatically
- **Check trigger**: Run this query to verify the trigger exists:
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'create_profile_on_signup';
  ```
- **Manual fix**: Create profile using Method 2 or 3 above

### Password too weak
- Supabase requires: minimum 6 characters
- Our test password `Test123!` meets requirements
- Change in: Supabase Dashboard → Authentication → Policies

### Cannot login after signup
- **Check email confirmation**: Disable it in Supabase settings
- **Check RLS policies**: Ensure they're properly set up (from migrations)
- **Check browser console**: Look for error messages

## Security Note

⚠️ **Important**: These are TEST credentials for development only!

- Never use these credentials in production
- Change/remove test users before deploying
- Use strong, unique passwords for real users
- Enable email verification in production

## Clean Up Test Users

To remove test users when done testing:

1. **Via Supabase Dashboard**:
   - Authentication → Users
   - Click on user → Delete User
   - This will cascade delete the profile (due to ON DELETE CASCADE)

2. **Via SQL**:
   ```sql
   -- Delete from auth.users (profile will be auto-deleted)
   DELETE FROM auth.users 
   WHERE email = 'test@example.com';
   
   -- Verify deletion
   SELECT * FROM public.profiles;
   ```

## Next Steps

After creating your test user:

1. ✅ Test all pages (Dashboard, Record, Gallery)
2. ✅ Record a test video
3. ✅ Check that data persists after logout/login
4. ✅ Verify analytics update correctly
5. ✅ Test on different browsers

---

**Need help?** Check `SUPABASE_MIGRATION_GUIDE.md` for detailed Supabase setup instructions.
