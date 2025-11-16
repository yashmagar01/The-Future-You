# FIX: Column "notified" Does Not Exist Error

## Problem
You're seeing this error:
```
ERROR 42703: column new.notified does not exist
```

## Root Cause
The `notified` column was defined in migration `20241116000002_add_user_roles_and_uploads.sql`, but that migration hasn't been applied to your Supabase database yet.

---

## ✅ Solution: Apply All Migrations

### Option 1: Apply All Migrations (Recommended)

```bash
# Navigate to supabase directory
cd supabase-organized

# Apply all pending migrations
supabase db push
```

This will apply:
1. `20241116000001_create_waitlist_tables.sql`
2. `20241116000002_add_user_roles_and_uploads.sql` ← **Adds notified column**
3. `20241116000003_setup_cron_job.sql`
4. `20241116000004_add_email_notifications.sql` ← **Uses notified column**

---

### Option 2: Run Standalone SQL Script (Quick Fix)

If you can't run migrations, copy and paste the entire contents of **`STANDALONE_EMAIL_SETUP.sql`** into your **Supabase SQL Editor** and run it.

This script:
1. ✅ Checks if `notified` column exists
2. ✅ Adds it if missing
3. ✅ Creates all email notification functions
4. ✅ Sets up the trigger
5. ✅ Verifies everything works

**Steps:**
1. Open Supabase Dashboard → **SQL Editor**
2. Open file: `supabase-organized/STANDALONE_EMAIL_SETUP.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Check verification results at the bottom

---

### Option 3: Apply Individual Migrations

Run these in order in Supabase SQL Editor:

**First, apply migration 002:**
```bash
# Copy contents of this file into SQL Editor:
supabase-organized/migrations/20241116000002_add_user_roles_and_uploads.sql
```

**Then, apply migration 004:**
```bash
# Copy contents of this file into SQL Editor:
supabase-organized/migrations/20241116000004_add_email_notifications.sql
```

---

## Verification

After applying the fix, run this in SQL Editor:

```sql
-- Check if notified column exists
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recordings'
  AND column_name = 'notified';
```

**Expected result:**
```
column_name | data_type | column_default
------------|-----------|---------------
notified    | boolean   | false
```

If you see the above, you're good to go! ✅

---

## Test Email Notification

```sql
-- Find a completed recording
SELECT id, title, status, notified 
FROM recordings 
WHERE status = 'completed' 
LIMIT 1;

-- Manually send pending notifications
SELECT * FROM send_pending_notifications();
```

---

## Why This Happened

The email notification system depends on the `notified` column which was added in an earlier migration. Your Supabase database is missing some migrations, so the column doesn't exist yet.

**Migration dependency chain:**
```
20241116000002_add_user_roles_and_uploads.sql
    ↓ (adds notified column)
20241116000004_add_email_notifications.sql
    ↓ (uses notified column)
```

---

## Files Updated

I've updated the migration to be **self-contained**:

✅ **`20241116000004_add_email_notifications.sql`** now includes:
```sql
ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;
```

This means even if you only run migration 004, it will still work!

✅ **`STANDALONE_EMAIL_SETUP.sql`** (NEW) - Complete standalone setup script that checks for the column and adds it if missing.

---

## Recommended Action

**Best approach:** Run `supabase db push` to apply all migrations in order.

**Quick fix:** Run `STANDALONE_EMAIL_SETUP.sql` in SQL Editor.

Either way, the email notification system will work after this! 🚀
