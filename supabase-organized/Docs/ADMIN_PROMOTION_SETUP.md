# Admin User Promotion System - Setup Guide

## Overview
This system allows admin users to promote regular users to "tester" status (instant analysis) via an admin panel.

## Components Created

### 1. Edge Function: `promote-user`
- **Location:** `supabase-organized/functions/promote-user/index.ts`
- **Endpoint:** `POST /functions/v1/promote-user`
- **Authentication:** Admin only (JWT token required)
- **Functionality:**
  - Validates admin permissions
  - Updates user role in profiles table
  - Updates recording priorities for pending recordings
  - Prevents self-demotion for admins

### 2. Admin Panel UI
- **Location:** `frontend/src/pages/AdminPanel.tsx`
- **Route:** `/admin/users`
- **Features:**
  - Lists all users with their roles
  - Dropdown to change roles (user/tester/admin)
  - Real-time updates
  - Role descriptions and badges

## Deployment Steps

### Step 1: Deploy the Edge Function

```bash
cd supabase-organized
npx supabase functions deploy promote-user
```

### Step 2: Verify Edge Function

Test the function with curl:

```bash
# Get your access token from Supabase Dashboard
export ACCESS_TOKEN="your-access-token-here"

# Test promoting a user
curl -X POST \
  "https://lgfrnuzuyammbqxcqgyo.supabase.co/functions/v1/promote-user" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-to-promote",
    "role": "tester"
  }'
```

### Step 3: Access the Admin Panel

1. **Make yourself an admin first:**

   Run this SQL in Supabase SQL Editor:
   
   ```sql
   -- Replace with your actual user ID
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

2. **Access the admin panel:**
   
   Navigate to: `https://your-app.vercel.app/admin/users`

3. **Promote users:**
   
   - Select a user
   - Change their role from the dropdown
   - System automatically updates their recording priorities

## API Reference

### POST /functions/v1/promote-user

**Request:**
```json
{
  "userId": "uuid-of-user-to-promote",
  "role": "user" | "tester" | "admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User role updated from 'user' to 'tester'",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "previousRole": "user",
    "newRole": "tester"
  }
}
```

**Response (Error):**
```json
{
  "error": "Error message here",
  "details": "Additional details if available"
}
```

## Role Permissions

### User (Default)
- Can upload videos
- Standard processing (2-3 days)
- Priority: LOW
- Can view their own recordings

### Tester
- Can upload videos
- Instant analysis
- Priority: HIGH
- Can view their own recordings

### Admin
- All tester permissions
- Can access admin panel
- Can promote/demote users
- Can view all recordings

## Security Features

1. **Authentication Required:** All requests require valid JWT token
2. **Admin-Only Access:** Only users with `role = 'admin'` can promote others
3. **Self-Protection:** Admins cannot demote themselves
4. **RLS Policies:** Database-level security enforced
5. **User Validation:** Checks if target user exists before promotion

## Automatic Updates

When a user is promoted to/from tester:

1. **User role updated** in `profiles` table
2. **Pending recordings updated** with new priority:
   - Tester → HIGH priority
   - User → LOW priority
3. **Completed recordings** remain unchanged
4. **Real-time UI update** in admin panel

## Testing

### 1. Test Edge Function Validation
```bash
cd supabase-organized/functions/promote-user
deno check index.ts
```

### 2. Test Deployment
```bash
npx supabase functions deploy promote-user --no-verify-jwt
```

### 3. Test Admin Panel
1. Log in as admin
2. Navigate to `/admin/users`
3. Try promoting a test user to tester
4. Verify role badge updates
5. Check database to confirm change

### 4. Verify Database Updates
```sql
-- Check user role
SELECT id, full_name, email, role 
FROM profiles 
WHERE email = 'test-user@example.com';

-- Check their pending recordings priority
SELECT id, title, status, priority, user_id
FROM recordings
WHERE user_id = 'user-id-here'
AND status = 'pending';
```

## Troubleshooting

### "Forbidden - Admin access required"
- Ensure your user has `role = 'admin'` in profiles table
- Check your JWT token is valid and not expired

### "User not found"
- Verify the userId exists in profiles table
- Check for typos in the UUID

### Edge Function not responding
- Verify function is deployed: `npx supabase functions list`
- Check function logs: `npx supabase functions logs promote-user`
- Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

### Admin panel shows "Access Denied"
- Run SQL to make yourself admin:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
  ```
- Clear browser cache and log in again

## Database Schema

### profiles table
```sql
- id (uuid, primary key)
- full_name (text)
- email (text)
- role (text) -- 'user', 'tester', 'admin'
- created_at (timestamp)
```

### recordings table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- title (text)
- status (text) -- 'pending', 'processing', 'completed'
- priority (text) -- 'high', 'low'
- notified (boolean)
- created_at (timestamp)
```

## Next Steps

1. ✅ Edge Function created and validated
2. ✅ Admin Panel UI built
3. ✅ Route added to App.tsx
4. ⏳ Deploy Edge Function to Supabase
5. ⏳ Make yourself admin via SQL
6. ⏳ Test promoting a user in admin panel
7. ⏳ Verify recording priority updates

## Quick Commands

```bash
# Deploy function
npx supabase functions deploy promote-user

# View logs
npx supabase functions logs promote-user --follow

# Make yourself admin (run in SQL Editor)
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

# Test the admin panel
# Navigate to: https://your-app.vercel.app/admin/users
```

## Support

For issues:
1. Check Edge Function logs
2. Verify JWT token is valid
3. Confirm admin role in database
4. Check browser console for errors
5. Review Supabase dashboard for function errors
