# 🗄️ Complete Supabase Migration Guide

This guide will walk you through setting up your Supabase database from scratch, including running migrations, setting up storage, and verifying everything works.

---

## 📋 Prerequisites

Before you begin, make sure you have:
- [ ] A Supabase account (sign up at https://supabase.com)
- [ ] Your project created in Supabase
- [ ] Environment variables set in your `.env` file

---

## Part 1: Initial Supabase Project Setup

### Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `Yash Reflections` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect for starting
4. Click **"Create new project"**
5. Wait 2-3 minutes for your project to be ready

### Step 2: Get Your API Credentials

1. Once your project is ready, go to **Settings** (⚙️ icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys**:
     - `anon` / `public` key (this is your publishable key)
     - `service_role` key (keep this secret, don't use in frontend)
4. Copy these values

### Step 3: Update Your Environment Variables

1. Open your `.env` file in the project root
2. Update with your values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Example:**
```env
VITE_SUPABASE_URL=https://bhnaertnhgfviswmivhm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=bhnaertnhgfviswmivhm
```

---

## Part 2: Running Database Migrations

### Step 1: Access the SQL Editor

1. In your Supabase dashboard, click on **SQL Editor** (📝 icon in sidebar)
2. You'll see the SQL editor interface

### Step 2: Run Migration 001 - Initial Schema

1. Click **"New query"** button (top right)
2. Open your project folder and navigate to:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy the **entire contents** of this file
4. Paste it into the SQL editor
5. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

**What this migration does:**
- ✅ Creates `profiles` table for user information
- ✅ Creates `recordings` table for video metadata
- ✅ Creates `feedback` table for AI analysis results
- ✅ Creates `progress` table for user metrics
- ✅ Enables Row Level Security (RLS) on all tables
- ✅ Sets up RLS policies (users can only see their own data)
- ✅ Creates indexes for better performance
- ✅ Creates database triggers for automatic profile creation
- ✅ Creates function to update timestamps automatically

**Expected result:**
You should see:
```
Success. No rows returned
```

### Step 3: Verify Tables Were Created

1. Click on **Table Editor** (📊 icon in sidebar)
2. You should now see 4 new tables:
   - `profiles`
   - `recordings`
   - `feedback`
   - `progress`
3. Click on each table to inspect the columns

### Step 4: Run Migration 002 - Storage Setup

1. Go back to **SQL Editor**
2. Click **"New query"**
3. Open:
   ```
   supabase/migrations/002_storage_setup.sql
   ```
4. Copy the **entire contents**
5. Paste into SQL editor
6. Click **"Run"**

**What this migration does:**
- ✅ Creates `recordings` storage bucket (private)
- ✅ Creates `thumbnails` storage bucket (public)
- ✅ Sets up storage policies for user access control

**Expected result:**
```
Success. No rows returned
```

### Step 5: Verify Storage Buckets

1. Click on **Storage** (🗄️ icon in sidebar)
2. You should see 2 buckets:
   - `recordings` (Private)
   - `thumbnails` (Public)

---

## Part 3: Verify RLS Policies

### Step 1: Check Profiles Policies

1. Go to **Authentication** → **Policies**
2. Find the `profiles` table
3. You should see 3 policies:
   - ✅ "Users can view their own profile" (SELECT)
   - ✅ "Users can update their own profile" (UPDATE)
   - ✅ "Users can insert their own profile" (INSERT)

### Step 2: Check Recordings Policies

1. Find the `recordings` table in policies
2. You should see 4 policies:
   - ✅ "Users can view their own recordings" (SELECT)
   - ✅ "Users can insert their own recordings" (INSERT)
   - ✅ "Users can update their own recordings" (UPDATE)
   - ✅ "Users can delete their own recordings" (DELETE)

### Step 3: Check Storage Policies

1. Go to **Storage** → Click on `recordings` bucket → **Policies** tab
2. You should see:
   - ✅ "Users can upload their own recordings"
   - ✅ "Users can view their own recordings"
   - ✅ "Users can delete their own recordings"

---

## Part 4: Enable Email Authentication

### Step 1: Configure Email Settings

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Make sure it's **enabled** (toggle should be green)
4. Scroll down to **Email Templates**
5. Customize if needed (optional)

### Step 2: Configure Email Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - Development: `http://localhost:8080`
   - Production: `https://your-domain.com` (when deployed)
3. Click **Save**

---

## Part 5: Test Your Setup

### Test 1: User Signup

1. Start your dev server: `npm run dev`
2. Go to http://localhost:8080/signup
3. Create a test account
4. Go to Supabase → **Authentication** → **Users**
5. You should see your new user
6. Go to **Table Editor** → `profiles`
7. You should see a profile automatically created!

### Test 2: Database Connection

1. Go to http://localhost:8080/dashboard
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. You should see NO errors related to Supabase

### Test 3: Video Upload (After Recording)

1. Go to http://localhost:8080/record
2. Allow camera access
3. Record a short test video
4. Go to Supabase → **Storage** → `recordings` bucket
5. You should see a folder with your user ID
6. Inside, you'll find your uploaded video

---

## Part 6: Regenerate TypeScript Types (Optional)

After running migrations, you can regenerate types to remove TypeScript errors:

### Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Generate types
supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
```

### Manual Alternative

1. Go to Supabase Dashboard → **API Docs**
2. Scroll to **TypeScript Types**
3. Copy the generated types
4. Replace contents of `src/integrations/supabase/types.ts`

---

## 🔧 Troubleshooting

### Error: "relation does not exist"

**Problem**: Tables weren't created
**Solution**: 
- Re-run migration 001
- Check SQL editor for any error messages
- Make sure you copied the entire file

### Error: "JWT expired" or "Invalid API key"

**Problem**: Wrong API credentials
**Solution**:
- Double-check your `.env` file
- Make sure you're using the `anon` key, not `service_role`
- Restart your dev server after changing `.env`

### Error: "new row violates row-level security policy"

**Problem**: RLS policies not set correctly
**Solution**:
- Re-run migration 001 to recreate policies
- Check if you're logged in when trying to insert data

### Error: "storage/objects: permission denied"

**Problem**: Storage policies missing
**Solution**:
- Re-run migration 002
- Check Storage → Policies for each bucket

### Camera not working

**Problem**: Browser permissions or HTTPS required
**Solution**:
- Grant camera permissions in browser
- Use `localhost` (works) or HTTPS in production
- Try Chrome/Edge (best MediaRecorder support)

### No data showing in Dashboard/Gallery

**Problem**: No recordings yet OR query errors
**Solution**:
- Record a test video first
- Check browser console for errors
- Verify RLS policies allow SELECT

---

## 📊 Verify Everything is Working

Use this checklist:

- [ ] Tables exist (profiles, recordings, feedback, progress)
- [ ] Storage buckets exist (recordings, thumbnails)
- [ ] RLS policies are active on all tables
- [ ] Storage policies are set
- [ ] Can create a user account
- [ ] Profile is auto-created on signup
- [ ] Can login successfully
- [ ] Can record/upload video
- [ ] Video appears in Gallery
- [ ] Dashboard shows stats
- [ ] No console errors

---

## 🎉 Success!

If all checks pass, your Supabase backend is fully configured and ready!

### What You've Set Up:

✅ **Database**: 4 tables with proper relationships  
✅ **Security**: Row Level Security protecting user data  
✅ **Storage**: Cloud storage for videos  
✅ **Auth**: Email authentication  
✅ **Triggers**: Automatic profile creation  
✅ **Types**: TypeScript definitions  

### Next Steps:

1. Start building features
2. Deploy to production (Vercel/Netlify)
3. Set production URLs in Supabase
4. Later: Add AI backend for video analysis

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 💡 Pro Tips

1. **Backup your database**: Supabase has automatic backups on paid plans
2. **Monitor usage**: Check Dashboard → Settings → Usage
3. **Set up database webhooks**: For real-time notifications
4. **Enable database logs**: Settings → Logs (helpful for debugging)
5. **Use connection pooling**: Automatic with Supabase

---

**Need Help?** Check the project's `SETUP.md` for quick troubleshooting or open an issue on GitHub!
