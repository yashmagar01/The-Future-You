# ⚡ Quick Start - Apply Migrations in 5 Minutes

## 🎯 What You Need

1. Supabase account → https://supabase.com
2. Your project's API credentials
3. 5 minutes ⏱️

---

## 📝 Steps (Copy & Paste)

### 1️⃣ Get API Credentials (2 min)

```
1. Go to: https://supabase.com/dashboard
2. Open your project
3. Settings (⚙️) → API
4. Copy:
   - Project URL
   - anon/public key
   - project ID from URL
```

### 2️⃣ Update .env (30 sec)

```bash
VITE_SUPABASE_URL=your-url-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
VITE_SUPABASE_PROJECT_ID=your-id-here
```

### 3️⃣ Run Migration 1 (1 min)

```
1. Supabase Dashboard → SQL Editor (📝)
2. Click "New query"
3. Open: supabase/migrations/001_initial_schema.sql
4. Copy ALL → Paste → Click "Run"
5. ✅ Should see: "Success. No rows returned"
```

**Creates:** Tables, RLS policies, triggers

### 4️⃣ Run Migration 2 (1 min)

```
1. SQL Editor → "New query"
2. Open: supabase/migrations/002_storage_setup.sql
3. Copy ALL → Paste → Click "Run"
4. ✅ Should see: "Success. No rows returned"
```

**Creates:** Storage buckets for videos

### 5️⃣ Verify (30 sec)

```bash
# Restart dev server
npm run dev
```

**Check:**
- Table Editor → See 4 tables ✅
- Storage → See 2 buckets ✅
- Try signup → Works ✅

---

## ✅ Done!

Your backend is ready. Now you can:
- Sign up users
- Record videos
- Upload files
- View in gallery
- See analytics

---

## 🆘 Issues?

**Error running migration?**
- Copy the ENTIRE file (including first line)
- Check for any red error messages
- Re-run the migration

**No tables showing?**
- Refresh browser
- Check Table Editor (📊) in sidebar

**Can't login after signup?**
- Check email for confirmation
- Authentication → Email templates
- Make sure Email provider is enabled

---

## 📚 Full Guide

Need more details? See: `SUPABASE_MIGRATION_GUIDE.md`

---

**That's it! 🎉 You're ready to record videos!**
