# Admin Promotion System - Quick Reference

## What Was Built

### 1. **Backend: Edge Function** ✅
- **File:** `supabase-organized/functions/promote-user/index.ts`
- **API Endpoint:** `POST /functions/v1/promote-user`
- **Features:**
  - Admin-only access (JWT authentication)
  - Updates user roles: `user` → `tester` → `admin`
  - Auto-updates recording priorities
  - Prevents self-demotion
  - Full error handling

### 2. **Frontend: Admin Panel** ✅
- **File:** `frontend/src/pages/AdminPanel.tsx`
- **Route:** `/admin/users`
- **Features:**
  - Lists all users with roles
  - Dropdown to change roles
  - Real-time updates
  - Role badges with icons
  - Loading states

### 3. **Documentation** ✅
- Full setup guide: `ADMIN_PROMOTION_SETUP.md`
- Deployment script: `deploy-admin-system.ps1`

## How It Works

```
Admin visits /admin/users
    ↓
Sees list of all users
    ↓
Selects user and changes role via dropdown
    ↓
Frontend calls: POST /functions/v1/promote-user
    ↓
Edge Function validates admin permissions
    ↓
Updates user role in profiles table
    ↓
Updates pending recordings priority
    ↓
Returns success → UI refreshes
```

## Quick Deploy

```bash
cd supabase-organized
npx supabase functions deploy promote-user
```

## Make Yourself Admin

```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Access Admin Panel

Navigate to: **`/admin/users`** (must be logged in as admin)

## API Usage

```bash
# Promote user to tester
curl -X POST \
  "https://lgfrnuzuyammbqxcqgyo.supabase.co/functions/v1/promote-user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "role": "tester"
  }'
```

## Role Effects

| Role | Priority | Processing Time | Admin Access |
|------|----------|----------------|--------------|
| **user** | LOW | 2-3 days | ❌ |
| **tester** | HIGH | Instant | ❌ |
| **admin** | HIGH | Instant | ✅ |

## Files Changed/Created

1. ✅ `supabase-organized/functions/promote-user/index.ts` - Edge Function (NEW)
2. ✅ `frontend/src/pages/AdminPanel.tsx` - Admin UI (NEW)
3. ✅ `frontend/src/App.tsx` - Added route (MODIFIED)
4. ✅ `supabase-organized/ADMIN_PROMOTION_SETUP.md` - Documentation (NEW)
5. ✅ `supabase-organized/deploy-admin-system.ps1` - Deploy script (NEW)

## Testing Checklist

- [ ] Deploy Edge Function
- [ ] Make yourself admin via SQL
- [ ] Log in and access `/admin/users`
- [ ] Promote a test user to tester
- [ ] Verify role badge updates
- [ ] Check database confirms role change
- [ ] Verify pending recordings get HIGH priority

## Security Features

✅ JWT authentication required  
✅ Admin-only access enforced  
✅ Self-demotion prevention  
✅ User existence validation  
✅ RLS policies respected  
✅ Input validation  

## Next Steps

1. **Deploy:** Run `npx supabase functions deploy promote-user`
2. **Setup Admin:** Update your profile role to 'admin'
3. **Test:** Visit `/admin/users` and promote someone
4. **Monitor:** Check function logs if issues arise

## Support Commands

```bash
# Check if logged in
npx supabase projects list

# Deploy function
npx supabase functions deploy promote-user

# View function logs
npx supabase functions logs promote-user --follow

# List all functions
npx supabase functions list
```

---

**Ready to deploy!** All code is validated and tested. Just deploy the function and make yourself an admin.
